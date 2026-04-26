/**
 * Single Rider API
 * PATCH /api/riders/[id] — update status, zone, or profile fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const ALLOWED_FIELDS = ['status', 'zone_id', 'name', 'phone', 'email', 'vehicle_type', 'national_id'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceRoleClient();
    const body = await req.json();

    const update: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('rms_riders')
      .update(update)
      .eq('id', id)
      .select('*, rms_zones(id, name, town, color)')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Riders API] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update rider' }, { status: 500 });
  }
}
