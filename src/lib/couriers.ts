/**
 * Courier Partner Integrations
 * Stubs for Fargo Courier, Pickup Mtaani, and G4S.
 * Replace with real API calls as you get API access from each courier.
 */

import type { CourierBooking, CourierBookingResult, CourierPartner } from '@/lib/types';

export async function bookCourier(
  booking: CourierBooking
): Promise<CourierBookingResult> {
  switch (booking.courier) {
    case 'fargo':
      return bookFargo(booking);
    case 'pickup_mtaani':
      return bookPickupMtaani(booking);
    case 'g4s':
      return bookG4S(booking);
    default:
      return { success: false, error: 'Unknown courier partner' };
  }
}

// ── Fargo Courier ────────────────────────────────────────────────────────────
// Contact: https://www.fargocourier.co.ke
// Request API access from their IT team
async function bookFargo(booking: CourierBooking): Promise<CourierBookingResult> {
  const apiKey = process.env.FARGO_API_KEY;
  if (!apiKey) {
    // Stub: return a mock booking for development
    console.warn('[Fargo] API key not set — returning stub booking');
    return {
      success: true,
      trackingId: `FARGO-${Date.now()}`,
      estimatedDelivery: '2-3 business days',
      cost: 450,
    };
  }

  try {
    // TODO: Replace with actual Fargo API endpoint
    const res = await fetch('https://api.fargocourier.co.ke/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        recipient_name: booking.recipientName,
        recipient_phone: booking.recipientPhone,
        delivery_address: booking.deliveryAddress,
        destination_town: booking.town,
        description: booking.itemDescription,
        weight_kg: booking.weightKg ?? 1,
        reference: booking.orderId,
      }),
    });

    if (!res.ok) throw new Error(`Fargo API ${res.status}`);
    const data = (await res.json()) as { tracking_number: string; cost: number };
    return {
      success: true,
      trackingId: data.tracking_number,
      cost: data.cost,
      estimatedDelivery: '1-2 business days',
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── Pickup Mtaani ────────────────────────────────────────────────────────────
// Contact: https://www.pickupmtaani.com — has the widest agent network in Kenya
async function bookPickupMtaani(booking: CourierBooking): Promise<CourierBookingResult> {
  const apiKey = process.env.PICKUP_MTAANI_API_KEY;
  if (!apiKey) {
    console.warn('[PickupMtaani] API key not set — returning stub booking');
    return {
      success: true,
      trackingId: `PM-${Date.now()}`,
      estimatedDelivery: '1-3 business days',
      cost: 300,
    };
  }

  try {
    // TODO: Replace with actual Pickup Mtaani API endpoint
    const res = await fetch('https://api.pickupmtaani.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        recipientName: booking.recipientName,
        recipientPhone: booking.recipientPhone,
        address: booking.deliveryAddress,
        town: booking.town,
        items: booking.itemDescription,
        externalRef: booking.orderId,
      }),
    });

    if (!res.ok) throw new Error(`PickupMtaani API ${res.status}`);
    const data = (await res.json()) as { trackingCode: string; deliveryCost: number };
    return {
      success: true,
      trackingId: data.trackingCode,
      cost: data.deliveryCost,
      estimatedDelivery: '1-3 business days',
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── G4S ─────────────────────────────────────────────────────────────────────
// Contact: https://www.g4s.com/en-ke — enterprise courier
async function bookG4S(booking: CourierBooking): Promise<CourierBookingResult> {
  const apiKey = process.env.G4S_API_KEY;
  if (!apiKey) {
    console.warn('[G4S] API key not set — returning stub booking');
    return {
      success: true,
      trackingId: `G4S-${Date.now()}`,
      estimatedDelivery: '1-2 business days',
      cost: 500,
    };
  }

  try {
    // TODO: Replace with actual G4S API endpoint when available
    const res = await fetch('https://api.g4s.co.ke/courier/v1/shipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        recipient: {
          name: booking.recipientName,
          phone: booking.recipientPhone,
          address: booking.deliveryAddress,
          city: booking.town,
        },
        parcel: {
          description: booking.itemDescription,
          weight: booking.weightKg ?? 1,
        },
        reference: booking.orderId,
      }),
    });

    if (!res.ok) throw new Error(`G4S API ${res.status}`);
    const data = (await res.json()) as { shipmentId: string; quotedCost: number };
    return {
      success: true,
      trackingId: data.shipmentId,
      cost: data.quotedCost,
      estimatedDelivery: '1-2 business days',
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export function getCourierLabel(courier: CourierPartner): string {
  const labels: Record<CourierPartner, string> = {
    fargo: 'Fargo Courier',
    pickup_mtaani: 'Pickup Mtaani',
    g4s: 'G4S Courier',
  };
  return labels[courier] ?? courier;
}
