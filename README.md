<div align="center">

# RiderOps

**Dispatch hub for Kenyan last-mile delivery**

Shopify order comes in → classified as last-mile or long-distance → dispatched to your riders (via Shipday) or a courier partner → customer gets SMS updates

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzackseal89%2FRiderOps&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,SHOPIFY_WEBHOOK_SECRET,SHOPIFY_STORE_DOMAIN,SHOPIFY_ADMIN_API_TOKEN,SHIPDAY_API_KEY,WAREHOUSE_ADDRESS&envDescription=Supabase%2C%20Shopify%2C%20and%20Shipday%20credentials%20are%20required%20to%20run%20RiderOps&envLink=https%3A%2F%2Fgithub.com%2Fzackseal89%2FRiderOps%23configuration&project-name=riderops&repository-name=RiderOps)

</div>

---

## What it does

When a customer pays on your Shopify store, RiderOps:

1. Receives the order via a **HMAC-verified Shopify webhook**
2. Geocodes the delivery address and checks it against your active **delivery zones**
3. Routes it as either **last-mile** (inside a zone) or **long-distance** (anywhere else)
4. **Last-mile** → pushes the order into [Shipday](https://shipday.com), which sends it to a rider's phone via the Shipday app
5. **Long-distance** → auto-books with the best courier (Fargo, Pickup Mtaani, or G4S) and stores the tracking ID
6. Sends the customer an **SMS update** (via Africa's Talking) at each status change
7. Pushes fulfillment status back to **Shopify** when delivered

Everything is managed from a single dashboard at `/dashboard`.

---

## Architecture

```
Shopify ──webhook──► RiderOps ──API──► Shipday ──app──► Riders (GPS + POD)
   ▲                    │  │
   │    fulfillment      │  └──► Africa's Talking (SMS to customer)
   └────────────────────┤
                        └──► Fargo / Pickup Mtaani / G4S  (long-distance)

Database: Supabase (Postgres)
Hosting:  Vercel (Edge-ready Next.js)
```

RiderOps stays thin — Shipday handles the hard parts (rider app, GPS, route optimisation, proof-of-delivery photos). RiderOps is the integration glue and the ops dashboard.

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Database | Supabase (PostgreSQL + RLS) |
| Last-mile dispatch | Shipday SaaS |
| SMS | Africa's Talking |
| Geocoding | Google Maps Platform |
| Hosting | Vercel |
| Long-distance couriers | Fargo · Pickup Mtaani · G4S |

---

## Deploy to Vercel (recommended)

Click the button above, or follow these steps:

1. **Fork or clone** this repo
2. Click **Deploy with Vercel** → it will prompt you for the required environment variables
3. After deploy, **run the Supabase migration** (see [Database setup](#database-setup))
4. **Register your Shopify webhook** pointing at `https://your-domain.vercel.app/api/webhooks/shopify`
5. **Register the Shipday status webhook** pointing at `https://your-domain.vercel.app/api/webhooks/shipday`

---

## Local development

```bash
git clone https://github.com/zackseal89/RiderOps.git
cd RiderOps
npm install

cp .env.example .env.local
# Fill in real values (Supabase, Shopify, Shipday are required)

npm run dev
# Dashboard at http://localhost:3000/dashboard
```

---

## Database setup

The migration lives in `supabase/migrations/`. Run it once against your Supabase project:

**Option A — Supabase SQL editor (easiest)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste the contents of `supabase/migrations/20260426120000_init_rms_schema.sql`
3. Click **Run**

**Option B — Supabase CLI**

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

The migration creates five tables (`rms_zones`, `rms_riders`, `rms_orders`, `rms_deliveries`, `rms_tracking`), enables Row Level Security on all of them, and seeds five starter zones (Nairobi CBD, Westlands, Kilimani, Karen, Mombasa CBD).

---

## Configuration

Copy `.env.example` to `.env.local` and fill in values. Variables marked **required** will cause the app to fail without them.

### Required (app won't boot)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` |

### Required for live operations

| Variable | Where to find it |
|---|---|
| `SHOPIFY_WEBHOOK_SECRET` | Shopify Admin → Settings → Notifications → Webhooks |
| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` (no `https://`) |
| `SHOPIFY_ADMIN_API_TOKEN` | Shopify Admin → Apps → Develop apps → API credentials |
| `SHIPDAY_API_KEY` | [app.shipday.com](https://app.shipday.com) → Settings → API |
| `WAREHOUSE_ADDRESS` | Your dispatch/pickup address (e.g. `123 Moi Avenue, Nairobi`) |

### Optional — degrade gracefully without them

| Variable | Effect when missing |
|---|---|
| `AT_API_KEY` / `AT_USERNAME` / `AT_SHORTCODE` | SMS logged to console only |
| `GOOGLE_MAPS_API_KEY` | Routing falls back to keyword-matching on town names |
| `FARGO_API_KEY` / `PICKUP_MTAANI_API_KEY` / `G4S_API_KEY` | Placeholder tracking IDs generated (end-to-end flow still works for testing) |

---

## Project layout

```
src/
├── app/
│   ├── api/
│   │   ├── orders/
│   │   │   ├── route.ts          GET (list + filter) · POST (manual create)
│   │   │   └── [id]/
│   │   │       ├── route.ts      PATCH (status transitions + delivery timestamps)
│   │   │       └── assign/
│   │   │           └── route.ts  POST (assign rider → also mirrors to Shipday)
│   │   ├── riders/
│   │   │   ├── route.ts          GET (list) · POST (register + create in Shipday)
│   │   │   └── [id]/
│   │   │       └── route.ts      PATCH (status toggle, zone, profile)
│   │   ├── zones/
│   │   │   ├── route.ts          GET · POST
│   │   │   └── [id]/route.ts     PATCH (activate / deactivate)
│   │   ├── stats/route.ts        GET dashboard KPIs
│   │   └── webhooks/
│   │       ├── shopify/route.ts  Inbound: paid orders (HMAC-verified)
│   │       └── shipday/route.ts  Inbound: rider status updates
│   └── dashboard/
│       ├── page.tsx              Order queue (search, filter, assign from panel)
│       ├── riders/page.tsx       Rider cards with inline status toggle
│       ├── zones/page.tsx        Zone management + routing logic explained
│       └── couriers/page.tsx     Courier partner reference
├── components/
│   ├── Sidebar.tsx               Nav with live pending-orders badge
│   ├── Toast.tsx                 Toast + useToast provider
│   ├── OrderDetailPanel.tsx      Slide-in: customer info, timeline, action buttons
│   └── AssignRiderModal.tsx      Pick available rider → assign
└── lib/
    ├── supabase/
    │   ├── client.ts             Browser Supabase client
    │   ├── server.ts             Server / service-role client
    │   └── database.types.ts     Auto-generated TypeScript types
    ├── shipday.ts                Shipday REST client (orders, carriers, tracking)
    ├── couriers.ts               Fargo · Pickup Mtaani · G4S clients
    ├── notifications.ts          Africa's Talking SMS templates
    ├── routing.ts                Last-mile vs long-distance classifier
    └── types.ts                  Shared TypeScript types

supabase/
└── migrations/
    └── 20260426120000_init_rms_schema.sql   Full schema + seed zones
```

---

## Dashboard pages

| Page | Path | Description |
|---|---|---|
| Order Queue | `/dashboard` | All orders, live search, status filter, click a row to open the detail panel |
| Riders | `/dashboard/riders` | Rider cards, inline available/offline toggle, register new riders |
| Zones | `/dashboard/zones` | Define last-mile coverage areas (activate = riders, deactivate = couriers) |
| Couriers | `/dashboard/couriers` | Long-distance partner reference with API key instructions |

---

## Order lifecycle

```
pending → assigned → rider_accepted → picked_up → in_transit → delivered
                                                              ↘ failed
```

The dashboard panel lets dispatchers manually advance status. Shipday webhooks advance it automatically when the rider updates their app.

---

## Webhook setup

### Shopify

1. Shopify Admin → Settings → Notifications → **Webhooks**
2. Create webhook: **Order payment** → `https://your-domain/api/webhooks/shopify`
3. Copy the signing secret into `SHOPIFY_WEBHOOK_SECRET`

### Shipday

1. [app.shipday.com](https://app.shipday.com) → Settings → **Integrations → Webhook**
2. URL: `https://your-domain/api/webhooks/shipday`
3. Enable all order status events

---

## Roadmap

- [ ] Customer-facing tracking page at `/track/[order]`
- [ ] Live map view (Leaflet + Shipday GPS feed)
- [ ] Bulk assign — assign multiple pending orders to one rider
- [ ] Real courier API integrations (Fargo and G4S require enterprise account setup)
- [ ] Per-rider earnings report

---

## License

Private. Internal tooling for a Kenyan e-commerce business.
