/**
 * Orders API
 * GET  /api/orders       — list orders with filters
 * POST /api/orders       — manually create test order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const deliveryType = searchParams.get('delivery_type');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = supabase
      .from('rms_orders')
      .select(
        `*, rms_zones(id, name, town, color), rms_deliveries(*, rms_riders(id, name, phone, vehicle_type))`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (deliveryType && deliveryType !== 'all') {
      query = query.eq('delivery_type', deliveryType);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ orders: data, total: count });
  } catch (err) {
    console.error('[Orders API] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('rms_orders')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[Orders API] POST error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
