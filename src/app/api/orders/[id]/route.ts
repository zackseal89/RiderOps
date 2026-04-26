/**
 * Single Order API
 * PATCH /api/orders/[id] — update status and related delivery timestamps
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const supabase = createServiceRoleClient();
    const body = await req.json();

    const ALLOWED = ['status', 'courier_partner', 'courier_tracking_id', 'delivery_zone_id', 'notes'];
    const update: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const newStatus = update.status as string | undefined;

    // Side effects on status transitions
    if (newStatus === 'picked_up' || newStatus === 'delivered' || newStatus === 'failed') {
      const { data: delivery } = await supabase
        .from('rms_deliveries')
        .select('id, rider_id, total_deliveries:rms_riders(total_deliveries)')
        .eq('order_id', orderId)
        .is('failed_at', null)
        .is('delivered_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (delivery) {
        const now = new Date().toISOString();

        if (newStatus === 'picked_up') {
          await supabase
            .from('rms_deliveries')
            .update({ pickup_at: now })
            .eq('id', delivery.id);
        }

        if (newStatus === 'delivered') {
          await supabase
            .from('rms_deliveries')
            .update({ delivered_at: now })
            .eq('id', delivery.id);

          if (delivery.rider_id) {
            const { data: rider } = await supabase
              .from('rms_riders')
              .select('total_deliveries')
              .eq('id', delivery.rider_id)
              .single();

            await supabase
              .from('rms_riders')
              .update({
                status: 'available',
                total_deliveries: (rider?.total_deliveries ?? 0) + 1,
              })
              .eq('id', delivery.rider_id);
          }
        }

        if (newStatus === 'failed') {
          await supabase
            .from('rms_deliveries')
            .update({ failed_at: now })
            .eq('id', delivery.id);

          if (delivery.rider_id) {
            await supabase
              .from('rms_riders')
              .update({ status: 'available' })
              .eq('id', delivery.rider_id);
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('rms_orders')
      .update(update)
      .eq('id', orderId)
      .select('*, rms_zones(id, name, town, color), rms_deliveries(*, rms_riders(id, name, phone, vehicle_type))')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Orders API] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
