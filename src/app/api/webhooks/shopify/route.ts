/**
 * Shopify Orders Webhook
 * POST /api/webhooks/shopify
 *
 * Receives order notifications from Shopify (orders/paid or orders/create).
 * Validates HMAC signature, classifies delivery, and routes to:
 *   - Shipday (last-mile riders)
 *   - Courier partner (long-distance)
 *
 * Set up in Shopify: Settings → Notifications → Webhooks
 * Event: Order payment  |  URL: https://yourdomain.com/api/webhooks/shopify
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { classifyDelivery, geocodeAddress } from '@/lib/routing';
import { createShipdayOrder } from '@/lib/shipday';
import { bookCourier, getCourierLabel } from '@/lib/couriers';
import {
  sendSMS,
  courierBookedSMS,
} from '@/lib/notifications';

// ── HMAC Verification ────────────────────────────────────────────────────────
function verifyShopifyHmac(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return true; // Skip in dev if not set

  const computed = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(hmacHeader)
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ShopifyLineItem {
  name: string;
  quantity: number;
  price: string;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  email?: string;
  total_price: string;
  currency: string;
  line_items: ShopifyLineItem[];
  shipping_address?: {
    name: string;
    address1: string;
    city: string;
    country: string;
    phone?: string;
  };
  billing_address?: {
    name: string;
  };
  customer?: {
    phone?: string;
    email?: string;
  };
  note?: string;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256') ?? '';

    // Verify authenticity
    if (!verifyShopifyHmac(rawBody, hmacHeader)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const shopifyOrder = JSON.parse(rawBody) as ShopifyOrder;
    const supabase = createServiceRoleClient();

    // Extract delivery details
    const shippingAddr = shopifyOrder.shipping_address;
    if (!shippingAddr) {
      return NextResponse.json(
        { message: 'No shipping address — skipping' },
        { status: 200 }
      );
    }

    const deliveryAddress = `${shippingAddr.address1}, ${shippingAddr.city}`;
    const customerName =
      shippingAddr.name ||
      shopifyOrder.billing_address?.name ||
      'Customer';
    const customerPhone =
      shippingAddr.phone || shopifyOrder.customer?.phone || '';
    const customerEmail =
      shopifyOrder.email || shopifyOrder.customer?.email || '';

    const itemsSummary = shopifyOrder.line_items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(', ');
    const orderTotalKes = parseFloat(shopifyOrder.total_price);

    // Load active zones from DB for routing
    const { data: zones } = await supabase
      .from('rms_zones')
      .select('slug, town')
      .eq('is_active', true);

    const activeTownSlugs = zones?.flatMap((z: { slug: string; town: string }) => [z.slug, z.town]) ?? [];

    // Classify: last_mile or long_distance
    const { deliveryType, courierPartner } = classifyDelivery(
      deliveryAddress,
      activeTownSlugs
    );

    // Geocode address
    const coords = await geocodeAddress(deliveryAddress);

    // Find matching zone
    const { data: matchedZone } = await supabase
      .from('rms_zones')
      .select('id')
      .eq('is_active', true)
      .ilike('town', `%${shippingAddr.city}%`)
      .single();

    // Insert order into our DB
    const { data: rmsOrder, error: insertError } = await supabase
      .from('rms_orders')
      .insert({
        shopify_order_id: String(shopifyOrder.id),
        shopify_order_number: String(shopifyOrder.order_number),
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        delivery_address: deliveryAddress,
        delivery_town: shippingAddr.city,
        delivery_lat: coords?.lat,
        delivery_lng: coords?.lng,
        delivery_zone_id: matchedZone?.id,
        order_total_kes: orderTotalKes,
        payment_method: 'prepaid',
        items_summary: itemsSummary,
        item_count: shopifyOrder.line_items.reduce((s, i) => s + i.quantity, 0),
        delivery_type: deliveryType,
        courier_partner: courierPartner ?? null,
        status: 'pending',
        notes: shopifyOrder.note,
        shopify_raw: shopifyOrder,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // ── Route: last_mile → Shipday ──────────────────────────────────────────
    if (deliveryType === 'last_mile') {
      const pickupAddress =
        process.env.WAREHOUSE_ADDRESS ?? 'Your Warehouse, Nairobi';

      try {
        const shipdayResult = await createShipdayOrder({
          orderNumber: `SHO-${shopifyOrder.order_number}`,
          orderItem: shopifyOrder.line_items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: parseFloat(i.price),
          })),
          recipientName: customerName,
          recipientAddress: deliveryAddress,
          recipientPhone: customerPhone,
          pickupAddress,
          deliveryInstruction: shopifyOrder.note,
        });

        await supabase
          .from('rms_orders')
          .update({
            shipday_order_id: String(shipdayResult.orderId),
            status: 'assigned',
          })
          .eq('id', rmsOrder.id);
      } catch (shipdayErr) {
        console.error('[Shipday] Failed to create order:', shipdayErr);
        // Order still saved as pending — dispatcher can manually assign
      }
    }

    // ── Route: long_distance → Courier partner ──────────────────────────────
    if (deliveryType === 'long_distance' && courierPartner) {
      const booking = await bookCourier({
        courier: courierPartner,
        orderId: String(shopifyOrder.order_number),
        recipientName: customerName,
        recipientPhone: customerPhone,
        deliveryAddress,
        town: shippingAddr.city,
        itemDescription: itemsSummary,
      });

      if (booking.success && booking.trackingId) {
        await supabase
          .from('rms_orders')
          .update({
            courier_tracking_id: booking.trackingId,
            status: 'assigned',
          })
          .eq('id', rmsOrder.id);

        // SMS customer about courier booking
        if (customerPhone) {
          await sendSMS(
            customerPhone,
            courierBookedSMS(
              customerName,
              String(shopifyOrder.order_number),
              getCourierLabel(courierPartner),
              booking.trackingId
            )
          );
        }
      }
    }

    return NextResponse.json({ success: true, orderId: rmsOrder.id });
  } catch (err) {
    console.error('[Shopify Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
