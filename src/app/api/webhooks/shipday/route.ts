/**
 * Shipday Status Webhook
 * POST /api/webhooks/shipday
 *
 * Receives real-time delivery status updates from Shipday.
 * Updates our DB and syncs fulfillment status back to Shopify.
 *
 * Configure in Shipday Dashboard → Settings → Webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendSMS, orderDeliveredSMS } from '@/lib/notifications';

interface ShipdayWebhookPayload {
  eventName: string; // e.g. "ORDER_DELIVERED", "ORDER_PICKED_UP"
  orderNumber: string;
  orderId: number;
  status: string;
  carrierId?: number;
  carrierName?: string;
  carrierPhone?: string;
  timestamp?: string;
  location?: { latitude: number; longitude: number };
}

const STATUS_MAP: Record<string, string> = {
  ORDER_ASSIGNED: 'assigned',
  ORDER_ACCEPTED: 'rider_accepted',
  ORDER_PICKED_UP: 'picked_up',
  ORDER_IN_TRANSIT: 'in_transit',
  ORDER_DELIVERED: 'delivered',
  ORDER_FAILED: 'failed',
  ORDER_CANCELLED: 'cancelled',
};

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ShipdayWebhookPayload;
    const supabase = createServiceRoleClient();

    // Map Shipday event to our status
    const newStatus = STATUS_MAP[payload.eventName];
    if (!newStatus) {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    // Find our order by Shipday order ID
    const { data: order, error: findErr } = await supabase
      .from('rms_orders')
      .select('*, rms_deliveries(*)')
      .eq('shipday_order_id', String(payload.orderId))
      .single();

    if (findErr || !order) {
      console.warn('[Shipday Webhook] Order not found:', payload.orderId);
      return NextResponse.json({ message: 'Order not found' }, { status: 200 });
    }

    // Update order status
    const now = new Date().toISOString();
    await supabase
      .from('rms_orders')
      .update({ status: newStatus, updated_at: now })
      .eq('id', order.id);

    // Update delivery record timestamps
    if (order.rms_deliveries?.[0]) {
      const deliveryUpdate: Record<string, string> = { updated_at: now };
      if (newStatus === 'picked_up') deliveryUpdate.pickup_at = now;
      if (newStatus === 'delivered') deliveryUpdate.delivered_at = now;
      if (newStatus === 'failed') deliveryUpdate.failed_at = now;

      await supabase
        .from('rms_deliveries')
        .update(deliveryUpdate)
        .eq('id', order.rms_deliveries[0].id);
    }

    // SMS customer on delivery
    if (newStatus === 'delivered' && order.customer_phone) {
      await sendSMS(
        order.customer_phone,
        orderDeliveredSMS(order.customer_name, order.shopify_order_number)
      );
    }

    // Sync fulfillment back to Shopify on delivery
    if (newStatus === 'delivered') {
      await syncShopifyFulfillment(order.shopify_order_id, order.shopify_order_number);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Shipday Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function syncShopifyFulfillment(shopifyOrderId: string, orderNumber: string) {
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const shopifyToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!shopifyDomain || !shopifyToken) {
    console.warn('[Shopify Sync] Credentials not set — skipping fulfillment sync');
    return;
  }

  try {
    // Mark order as fulfilled in Shopify
    const res = await fetch(
      `https://${shopifyDomain}/admin/api/2024-01/orders/${shopifyOrderId}/fulfillments.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyToken,
        },
        body: JSON.stringify({
          fulfillment: {
            notify_customer: false,
            tracking_number: orderNumber,
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Shopify Sync] Failed for order ${orderNumber}: ${text}`);
    }
  } catch (err) {
    console.error('[Shopify Sync] Error:', err);
  }
}
