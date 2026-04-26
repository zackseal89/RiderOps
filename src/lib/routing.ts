/**
 * Order Routing Engine
 * Decides whether an order goes to a last-mile Shipday rider
 * or a long-distance courier partner (Fargo, Pickup Mtaani, G4S).
 *
 * Rules (configurable via zones table):
 * - If the delivery town matches an active zone → last_mile (Shipday)
 * - Otherwise → long_distance (pick courier partner by town/distance)
 */

import type { CourierPartner, DeliveryType } from '@/lib/types';

/**
 * Towns covered by your own riders.
 * These are loaded from the DB at runtime — this is just the fallback list.
 */
const DEFAULT_LAST_MILE_TOWNS = [
  'nairobi',
  'westlands',
  'karen',
  'langata',
  'kasarani',
  'eastleigh',
  'kiambu',
  'thika',
  'ruiru',
];

export function classifyDelivery(
  deliveryAddress: string,
  activeTownSlugs: string[] = DEFAULT_LAST_MILE_TOWNS
): { deliveryType: DeliveryType; courierPartner?: CourierPartner } {
  const addressLower = deliveryAddress.toLowerCase();

  const isLastMile = activeTownSlugs.some((town) =>
    addressLower.includes(town.toLowerCase())
  );

  if (isLastMile) {
    return { deliveryType: 'last_mile' };
  }

  // Long-distance routing rules
  const courierPartner = selectCourierPartner(deliveryAddress);
  return { deliveryType: 'long_distance', courierPartner };
}

/**
 * Select the best courier partner for a given address.
 * Simple rule-based for now — extend with real pricing APIs later.
 */
function selectCourierPartner(address: string): CourierPartner {
  const lower = address.toLowerCase();

  // Pickup Mtaani has the widest agent network nationwide
  if (
    lower.includes('mombasa') ||
    lower.includes('kisumu') ||
    lower.includes('nakuru') ||
    lower.includes('eldoret')
  ) {
    return 'fargo'; // Fargo has strong coverage in major towns
  }

  if (lower.includes('western') || lower.includes('nyanza')) {
    return 'g4s';
  }

  // Default: Pickup Mtaani — broadest agent network
  return 'pickup_mtaani';
}

/** Geocode a Kenyan address using Google Maps Geocoding API */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not set — skipping geocoding');
    return null;
  }

  try {
    const encoded = encodeURIComponent(`${address}, Kenya`);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`
    );
    const data = (await res.json()) as {
      status: string;
      results: Array<{
        geometry: { location: { lat: number; lng: number } };
      }>;
    };

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].geometry.location;
    }
    return null;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}
