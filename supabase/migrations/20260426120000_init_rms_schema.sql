-- RiderOps initial schema
-- Tables: rms_zones, rms_riders, rms_orders, rms_deliveries, rms_tracking
-- All tables prefixed with rms_ so they coexist with anything else in the project's Supabase instance.

set check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

create or replace function rms_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- rms_zones — delivery coverage areas owned by your last-mile riders
-- ─────────────────────────────────────────────────────────────────────────────

create table rms_zones (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  slug              text not null unique,
  town              text not null,
  is_active         boolean not null default true,
  color             text not null default '#3B82F6',
  delivery_fee_kes  integer not null default 200 check (delivery_fee_kes >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index rms_zones_active_idx on rms_zones (is_active) where is_active;
create index rms_zones_town_idx   on rms_zones (lower(town));

create trigger rms_zones_updated_at
  before update on rms_zones
  for each row execute function rms_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- rms_riders — last-mile riders (mirrored to Shipday as carriers)
-- ─────────────────────────────────────────────────────────────────────────────

create table rms_riders (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  phone               text not null unique,
  email               text unique,
  vehicle_type        text not null default 'motorcycle'
                      check (vehicle_type in ('motorcycle','bicycle','car','van')),
  status              text not null default 'offline'
                      check (status in ('available','busy','offline','suspended')),
  zone_id             uuid references rms_zones(id) on delete set null,
  shipday_driver_id   text unique,
  national_id         text,
  total_deliveries    integer not null default 0 check (total_deliveries >= 0),
  rating              numeric(3,2) not null default 5.00 check (rating >= 0 and rating <= 5),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index rms_riders_status_idx on rms_riders (status);
create index rms_riders_zone_idx   on rms_riders (zone_id);

create trigger rms_riders_updated_at
  before update on rms_riders
  for each row execute function rms_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- rms_orders — every Shopify order routed through the system
-- ─────────────────────────────────────────────────────────────────────────────

create table rms_orders (
  id                    uuid primary key default uuid_generate_v4(),

  -- Shopify reference
  shopify_order_id      text not null unique,
  shopify_order_number  text not null,

  -- Customer
  customer_name         text not null,
  customer_phone        text,
  customer_email        text,

  -- Delivery target
  delivery_address      text not null,
  delivery_town         text,
  delivery_lat          double precision,
  delivery_lng          double precision,
  delivery_zone_id      uuid references rms_zones(id) on delete set null,

  -- Order details
  order_total_kes       numeric(12,2),
  payment_method        text not null default 'prepaid'
                        check (payment_method in ('prepaid','cod')),
  items_summary         text,
  item_count            integer not null default 1 check (item_count >= 0),

  -- Routing
  delivery_type         text not null
                        check (delivery_type in ('last_mile','long_distance')),
  courier_partner       text check (courier_partner in ('fargo','pickup_mtaani','g4s')),
  courier_tracking_id   text,
  shipday_order_id      text unique,

  -- Lifecycle
  status                text not null default 'pending'
                        check (status in (
                          'pending','assigned','rider_accepted',
                          'picked_up','in_transit','delivered',
                          'failed','cancelled'
                        )),
  notes                 text,
  shopify_raw           jsonb,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index rms_orders_status_idx        on rms_orders (status);
create index rms_orders_delivery_type_idx on rms_orders (delivery_type);
create index rms_orders_zone_idx          on rms_orders (delivery_zone_id);
create index rms_orders_created_idx       on rms_orders (created_at desc);
create index rms_orders_shipday_idx       on rms_orders (shipday_order_id);

create trigger rms_orders_updated_at
  before update on rms_orders
  for each row execute function rms_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- rms_deliveries — one row per assignment of an order to a rider
--   (an order may be reassigned, so this is one-to-many in theory; in
--    practice the dashboard treats the most recent row as authoritative)
-- ─────────────────────────────────────────────────────────────────────────────

create table rms_deliveries (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references rms_orders(id) on delete cascade,
  rider_id      uuid not null references rms_riders(id) on delete restrict,

  assigned_at   timestamptz not null default now(),
  accepted_at   timestamptz,
  pickup_at     timestamptz,
  delivered_at  timestamptz,
  failed_at     timestamptz,

  pod_photo_url text,
  signature_url text,
  fail_reason   text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index rms_deliveries_order_idx on rms_deliveries (order_id);
create index rms_deliveries_rider_idx on rms_deliveries (rider_id);

create trigger rms_deliveries_updated_at
  before update on rms_deliveries
  for each row execute function rms_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- rms_tracking — rider GPS pings, one row per location update
-- ─────────────────────────────────────────────────────────────────────────────

create table rms_tracking (
  id            bigserial primary key,
  delivery_id   uuid not null references rms_deliveries(id) on delete cascade,
  lat           double precision not null,
  lng           double precision not null,
  recorded_at   timestamptz not null default now()
);

create index rms_tracking_delivery_idx on rms_tracking (delivery_id, recorded_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
--   All tables: RLS on, no policies for anon/authenticated.
--   The Next.js app uses the service_role key from the server, which bypasses
--   RLS. Browser code never reads these tables directly. If you later add
--   per-rider auth (e.g. a rider PWA), add policies here.
-- ─────────────────────────────────────────────────────────────────────────────

alter table rms_zones      enable row level security;
alter table rms_riders     enable row level security;
alter table rms_orders     enable row level security;
alter table rms_deliveries enable row level security;
alter table rms_tracking   enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: a couple of starter zones so the dashboard isn't empty on first load.
-- ─────────────────────────────────────────────────────────────────────────────

insert into rms_zones (name, slug, town, color, delivery_fee_kes) values
  ('Nairobi CBD',  'nairobi-cbd',  'Nairobi', '#3B82F6', 200),
  ('Westlands',    'westlands',    'Nairobi', '#10B981', 250),
  ('Kilimani',     'kilimani',     'Nairobi', '#F59E0B', 250),
  ('Karen',        'karen',        'Nairobi', '#8B5CF6', 350),
  ('Mombasa CBD',  'mombasa-cbd',  'Mombasa', '#EF4444', 300);
