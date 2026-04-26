/**
 * Order Assignment API
 * POST /api/orders/[id]/assign — assign a rider to an order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { assignShipdayOrder } from '@/lib/shipday';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { rider_id } = await req.json();

    if (!rider_id) {
      return NextResponse.json({ error: 'rider_id is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const [orderRes, riderRes] = await Promise.all([
      supabase.from('rms_orders').select('id, shipday_order_id, status').eq('id', orderId).single(),
      supabase.from('rms_riders').select('id, shipday_driver_id').eq('id', rider_id).single(),
    ]);

    if (orderRes.error) throw orderRes.error;
    if (riderRes.error) throw riderRes.error;

    const order = orderRes.data;
    const rider = riderRes.data;
    const now = new Date().toISOString();

    // Create delivery assignment record
    const { error: deliveryErr } = await supabase
      .from('rms_deliveries')
      .insert({ order_id: orderId, rider_id, assigned_at: now });

    if (deliveryErr) throw deliveryErr;

    // Update order status → assigned, rider status → busy
    await Promise.all([
      supabase.from('rms_orders').update({ status: 'assigned' }).eq('id', orderId),
      supabase.from('rms_riders').update({ status: 'busy' }).eq('id', rider_id),
    ]);

    // Mirror assignment in Shipday (non-fatal)
    if (order.shipday_order_id && rider.shipday_driver_id) {
      try {
        await assignShipdayOrder(
          parseInt(order.shipday_order_id),
          parseInt(rider.shipday_driver_id)
        );
      } catch (shipdayErr) {
        console.warn('[Shipday] assign failed (non-fatal):', shipdayErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Orders/Assign API] POST error:', err);
    return NextResponse.json({ error: 'Failed to assign order' }, { status: 500 });
  }
}
