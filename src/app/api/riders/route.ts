/**
 * Riders API
 * GET  /api/riders    — list all riders
 * POST /api/riders    — register a new rider (also creates in Shipday)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createShipdayCarrier } from '@/lib/shipday';

export async function GET(_req: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('rms_riders')
      .select('*, rms_zones(id, name, town, color)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ riders: data });
  } catch (err) {
    console.error('[Riders API] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await req.json();

    const { name, phone, email, vehicle_type, zone_id, national_id } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'name and phone are required' },
        { status: 400 }
      );
    }

    // Register rider in our DB first
    const { data: rider, error: dbErr } = await supabase
      .from('rms_riders')
      .insert({
        name,
        phone,
        email: email ?? null,
        vehicle_type: vehicle_type ?? 'motorcycle',
        zone_id: zone_id ?? null,
        national_id: national_id ?? null,
        status: 'offline',
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    // Register rider in Shipday so they get the rider mobile app
    if (email) {
      try {
        const shipdayResult = await createShipdayCarrier({
          name,
          email,
          phone,
        });

        await supabase
          .from('rms_riders')
          .update({ shipday_driver_id: String(shipdayResult.id) })
          .eq('id', rider.id);
      } catch (shipdayErr) {
        // Non-fatal: rider saved in our DB, Shipday can be linked later
        console.warn('[Shipday] Failed to create carrier:', shipdayErr);
      }
    }

    return NextResponse.json(rider, { status: 201 });
  } catch (err) {
    console.error('[Riders API] POST error:', err);
    return NextResponse.json({ error: 'Failed to create rider' }, { status: 500 });
  }
}
