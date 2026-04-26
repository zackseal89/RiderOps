/**
 * Shared TypeScript types for the RiderOps Dashboard
 */

// ── Shipday API types ─────────────────────────────────────────────────────────

/** Wire format sent to Shipday's POST /orders endpoint. */
export interface ShipdayOrder {
  orderNumber: string;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  expectedPickupTime?: string;
  expectedDeliveryDate?: string;
  deliveryInstruction?: string;
  orderItem?: { name: string; quantity: number; unitPrice: number }[];
  totalOrderCost?: number;
  additionalId?: string;
}

/**
 * Friendly input shape used by our app code. The Shipday client translates
 * `recipient*`/`pickup*` to Shipday's `customer*`/`restaurant*` wire fields.
 */
export interface CreateShipdayOrderInput {
  orderNumber: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  recipientEmail?: string;
  pickupAddress: string;
  pickupName?: string;
  expectedPickupTime?: string;
  expectedDeliveryDate?: string;
  deliveryInstruction?: string;
  orderItem?: { name: string; quantity: number; unitPrice: number }[];
  totalOrderCost?: number;
  additionalId?: string;
}

export interface ShipdayDriver {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface Zone {
  id: string;
  name: string;
  slug: string;
  town: string;
  is_active: boolean;
  color: string;
  delivery_fee_kes: number;
  created_at: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car' | 'van';
  status: 'available' | 'busy' | 'offline' | 'suspended';
  zone_id: string | null;
  zone?: { id: string; name: string; town: string; color: string } | null;
  shipday_driver_id: string | null;
  national_id: string | null;
  total_deliveries: number;
  rating: number;
  created_at: string;
}

export interface Order {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address: string;
  delivery_town: string | null;
  delivery_type: 'last_mile' | 'long_distance';
  courier_partner: string | null;
  courier_tracking_id: string | null;
  status:
    | 'pending'
    | 'assigned'
    | 'rider_accepted'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'failed'
    | 'cancelled';
  order_total_kes: number | null;
  delivery: unknown;
  created_at: string;
  updated_at: string;
}

// ── Routing & Courier types ───────────────────────────────────────────────────

export type DeliveryType = 'last_mile' | 'long_distance';

export type CourierPartner = 'fargo' | 'pickup_mtaani' | 'g4s';

export interface CourierBooking {
  courier: CourierPartner;
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  town: string;
  itemDescription: string;
  weightKg?: number;
}

export interface CourierBookingResult {
  success: boolean;
  trackingId?: string;
  cost?: number;
  estimatedDelivery?: string;
  error?: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  activeDeliveries: number;
  deliveredToday: number;
  availableRiders: number;
  busyRiders: number;
  totalRiders: number;
}
