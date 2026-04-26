# RiderOps

Delivery management dashboard for a Kenyan Shopify store. Sits between Shopify and your delivery layer — your own riders for last-mile, national couriers (Fargo, Pickup Mtaani, G4S) for everything else.

## What it does

When a customer pays on your Shopify store, RiderOps:

1. Receives the order via webhook (HMAC-verified).
2. Geocodes the delivery address.
3. Classifies it as **last-mile** (inside one of your zones) or **long-distance** (anywhere else).
4. **Last-mile** → pushes the order into [Shipday](https://shipday.com), which dispatches to one of your registered riders via their mobile app.
5. **Long-distance** → books the parcel with the appropriate courier partner and stores the tracking number.
6. Sends the customer an SMS via [Africa's Talking](https://africastalking.com) at each status change.
7. Pushes fulfillment status back to Shopify when delivered.

You manage everything from a single web dashboard at `/dashboard`.

## Architecture

```
Shopify ──webhook──► RiderOps ──API──► Shipday ──app──► Riders
   ▲                    │  │  │
   │                    │  │  └──► Africa's Talking (SMS to customer)
   │                    │  └────► Google Maps (geocode address)
   │                    └─► Fargo / Pickup Mtaani / G4S
   │
   └── Shopify gets back: fulfillment status when delivered
```

RiderOps itself stays thin. Shipday handles the hard stuff (rider mobile app, GPS, route optimization, proof-of-delivery photos) at the SaaS tier. RiderOps is the integration glue plus a unified dashboard.

## Tech stack

| Layer | Tool |
|---|---|
| Backend + frontend | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Last-mile dispatch | Shipday |
| SMS | Africa's Talking |
| Geocoding | Google Maps Platform |
| Hosting (intended) | Vercel |
| Couriers (long-distance) | Fargo, Pickup Mtaani, G4S |

## Quick start

```bash
npm install
cp .env.local .env.local.bak  # keep your placeholders aside
# Fill in real values in .env.local — see Configuration below
npm run dev
```

Dashboard runs at [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

## Configuration

All credentials go in `.env.local` (gitignored). Each integration is independently togglable — missing keys fall back to mock behaviour where possible (e.g. SMS logs to console, courier APIs return stub tracking IDs).

### Required for the dashboard to load
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The schema migration is **not yet committed** — see Roadmap.

### Required for live operations
- **Shopify** — `SHOPIFY_WEBHOOK_SECRET`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN`. Webhook event: *Order payment*, URL: `https://your-domain/api/webhooks/shopify`.
- **Shipday** — `SHIPDAY_API_KEY`, `WAREHOUSE_ADDRESS`. Configure the Shipday status webhook to `https://your-domain/api/webhooks/shipday`.
- **Google Maps** — `GOOGLE_MAPS_API_KEY` (server) and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client). Enable Geocoding API + Maps JavaScript API.

### Optional / fallbacks to mock
- **Africa's Talking** — `AT_API_KEY`, `AT_USERNAME`, `AT_SHORTCODE`. Without these, SMS is logged to the console only.
- **Couriers** — `FARGO_API_KEY`, `PICKUP_MTAANI_API_KEY`, `G4S_API_KEY`. Without these, the system generates placeholder tracking IDs (e.g. `PM-1730000000000`) so flows can be tested end-to-end. None of these three couriers expose a public API; access requires an account-holder request — see [src/lib/couriers.ts](src/lib/couriers.ts) for contact pointers.

## Project layout

```
src/
  app/
    api/
      orders/         GET, POST — list and create orders
      riders/         GET, POST — list and register riders (also creates in Shipday)
      zones/          GET, POST, PATCH — manage delivery coverage zones
      stats/          GET — dashboard KPIs
      webhooks/
        shopify/      Inbound: new paid orders from Shopify (HMAC-verified)
        shipday/      Inbound: rider status updates from Shipday
    dashboard/        Web UI — orders, riders, zones, couriers
  components/         Shared UI (sidebar, etc.)
  lib/
    supabase/         Server + browser clients
    routing.ts        Last-mile vs long-distance classifier + geocoder
    shipday.ts        Shipday REST client
    couriers.ts       Fargo / Pickup Mtaani / G4S clients (currently stubs)
    notifications.ts  Africa's Talking SMS client + templates
    types.ts          Shared TypeScript types
```

## Status

This is an early scaffold. The dashboard, webhooks, and integration clients are in place and type-check clean, but the **Supabase schema hasn't been written yet** — the dashboard pages will fail to load until the migration is created and run.

### Roadmap

1. **Supabase migration** — schema for `rms_orders`, `rms_riders`, `rms_zones`, `rms_deliveries`, `rms_tracking`. Currently blocking everything.
2. **Manual rider assignment UI** — "Assign Rider" button on the orders table.
3. **PWA manifest** — referenced in [src/app/layout.tsx](src/app/layout.tsx) but not yet present.
4. **Live map view** — `react-leaflet` is installed but not wired up.
5. **Real courier API integrations** — pending API access from each provider.
6. **Customer tracking page** — public `/track/[order]` URL.

## License

Private. Internal tooling for a Kenyan e-commerce business.
