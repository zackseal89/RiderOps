/**
 * Shipday API Client
 * Shipday handles last-mile dispatch, rider GPS tracking, and the rider mobile app.
 * Docs: https://shipday.com/docs/api
 */

import type {
  ShipdayOrder,
  ShipdayDriver,
  CreateShipdayOrderInput,
} from '@/lib/types';

const SHIPDAY_BASE_URL = 'https://api.shipday.com';

function getHeaders() {
  const apiKey = process.env.SHIPDAY_API_KEY;
  if (!apiKey) throw new Error('SHIPDAY_API_KEY is not set');
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${apiKey}`,
  };
}

async function shipdayFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${SHIPDAY_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shipday API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Orders ──────────────────────────────────────────────────────────────────

export async function createShipdayOrder(input: CreateShipdayOrderInput) {
  const wire: ShipdayOrder = {
    orderNumber: input.orderNumber,
    customerName: input.recipientName,
    customerAddress: input.recipientAddress,
    customerPhoneNumber: input.recipientPhone,
    customerEmail: input.recipientEmail,
    restaurantName: input.pickupName,
    restaurantAddress: input.pickupAddress,
    expectedPickupTime: input.expectedPickupTime,
    expectedDeliveryDate: input.expectedDeliveryDate,
    deliveryInstruction: input.deliveryInstruction,
    orderItem: input.orderItem,
    totalOrderCost: input.totalOrderCost,
    additionalId: input.additionalId,
  };
  return shipdayFetch<{ orderId: number }>('/orders', {
    method: 'POST',
    body: JSON.stringify(wire),
  });
}

export async function getShipdayOrder(shipdayOrderId: number) {
  return shipdayFetch<Record<string, unknown>>(`/orders/${shipdayOrderId}`);
}

export async function deleteShipdayOrder(shipdayOrderId: number) {
  return shipdayFetch<void>(`/orders/${shipdayOrderId}`, {
    method: 'DELETE',
  });
}

export async function assignShipdayOrder(
  shipdayOrderId: number,
  carrierId: number
) {
  return shipdayFetch<void>(`/orders/${shipdayOrderId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ carrierId }),
  });
}

// ── Carriers (Riders) ────────────────────────────────────────────────────────

export async function createShipdayCarrier(driver: ShipdayDriver) {
  return shipdayFetch<{ id: number }>('/carriers', {
    method: 'POST',
    body: JSON.stringify(driver),
  });
}

export async function listShipdayCarriers() {
  return shipdayFetch<{ carriers: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    isAvailable: boolean;
    currentLocation?: { latitude: number; longitude: number };
  }> }>('/carriers');
}

export async function getShipdayCarrier(carrierId: number) {
  return shipdayFetch<Record<string, unknown>>(`/carriers/${carrierId}`);
}

// ── Active Orders (live tracking) ────────────────────────────────────────────

export async function listActiveShipdayOrders() {
  return shipdayFetch<{ orders: Record<string, unknown>[] }>('/orders/active');
}
