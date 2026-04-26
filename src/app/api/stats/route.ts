/**
 * Dashboard Stats API
 * GET /api/stats  — returns key metrics for the dashboard header
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, riders, deliveredToday] = await Promise.all([
      supabase
        .from('rms_orders')
        .select('status', { count: 'exact', head: false }),
      supabase
        .from('rms_riders')
        .select('status', { count: 'exact', head: false }),
      supabase
        .from('rms_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'delivered')
        .gte('updated_at', today.toISOString()),
    ]);

    const orderRows = orders.data ?? [];
    const riderRows = riders.data ?? [];

    const stats = {
      totalOrders: orders.count ?? 0,
      pendingOrders: orderRows.filter((o: { status: string }) => o.status === 'pending').length,
      activeDeliveries: orderRows.filter((o: { status: string }) =>
        ['assigned', 'rider_accepted', 'picked_up', 'in_transit'].includes(o.status)
      ).length,
      deliveredToday: deliveredToday.count ?? 0,
      availableRiders: riderRows.filter((r: { status: string }) => r.status === 'available').length,
      busyRiders: riderRows.filter((r: { status: string }) => r.status === 'busy').length,
      totalRiders: riders.count ?? 0,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error('[Stats API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
