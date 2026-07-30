# Ticket 024 — Architectural Design (ADD)

## Principles
- Reuse existing infrastructure: `computeProfit` (src/lib/profit.ts), `FeeSettings`/`AdditionalFee`/`SiteSetting`, DB package cache, `FeaturedDestination`, plan curation (`buildTiers`), PlanCard, cart store, analytics lib.
- Deals live in their own table — never mutate `PackageOverride`.
- Server is the single source of truth for deal prices (same pattern as checkout price resolution).

## Data model (additive only)

```prisma
model HotDeal {
  id              String   @id @default(cuid())
  packageCode     String
  dealDay         String                       // "YYYY-MM-DD" UTC rotation key
  discountPercent Int
  originalPrice   Decimal  @db.Decimal(10, 2)
  dealPrice       Decimal  @db.Decimal(10, 2)
  netProfit       Decimal  @db.Decimal(10, 2)  // frozen at creation for admin display
  locationCode    String
  packageName     String
  pinned          Boolean  @default(false)     // survives daily rotation
  active          Boolean  @default(true)      // admin kill switch
  createdAt       DateTime @default(now())

  @@unique([packageCode, dealDay])
  @@index([dealDay])
  @@map("hot_deals")
}
```

Config in `SiteSetting` key `hot_deals_config` (JSON): `{ enabled, count, minProfit, discountMin, discountMax, minPrice }` with defaults `{ true, 3, 3, 5, 10, 8 }`.

## Modules

### `src/lib/hot-deals.ts` (server-only, new)
- `getHotDealsConfig()` — SiteSetting JSON with defaults.
- `ensureTodayDeals()` — idempotent: returns today's active deals; when missing, generates:
  1. Pool: featured destination codes (fallback constant list) → DB-cached packages → apply overrides (visible, customPrice) → fixed-data only → price ≥ minPrice.
  2. Carry over yesterday's `pinned` deals (re-validate profit gate at today's prices).
  3. Date-seeded RNG (mulberry32 over dealDay hash) → shuffle; per candidate draw discount, compute `netProfit` via `computeProfit` with simCost (`override.simCost` ?? wholesale) + esim additional cost + fees; accept if ≥ minProfit; max 1 per locationCode; stop at `count`.
- `getActiveDealPrice(packageCode)` — cheapest active deal for today **or yesterday** (checkout grace), used by create-transaction.

### API routes
- `GET /api/hot-deals` (public, new): `ensureTodayDeals()` + join display data from package cache. Cache-headers: no-store (deals must react to admin toggles).
- `GET/PUT/POST /api/admin/hot-deals` (admin, new): GET list+config, PUT config, POST `{action: regenerate | toggle | pin, id?}`.

### Checkout (surgical edit)
`create-transaction/route.ts`: after `serverPrice` resolution, `getActiveDealPrice(planId)` → if lower, use it. ~6 lines, no other logic touched.

### Homepage components (new files)
- `HotDealsSection.tsx` — client; react-query on `/api/hot-deals`; renders nothing when empty. Cards: flag, localized destination name, GB/days, struck original price, deal price, `-X%` pill, add-to-cart (cart item priced at dealPrice → consistent with what the server will charge). GA4 `view_item_list` (`hot_deals`) + `add_to_cart`.
- `ForYouSection.tsx` — client; signals:
  1. `localStorage.recentDestinations` (written by DestinationDetailClient — new tiny effect)
  2. `GET /api/account/orders` when session exists (existing endpoint; 401 → skip silently)
  3. Daily-seeded pick from featured destinations
  Fetches `/api/packages?location=XX`, builds tiers via existing `buildTiers`, shows up to 3 (star first). Renders nothing when no data.
- `src/app/[locale]/page.tsx`: insert `<HotDealsSection />` + `<ForYouSection />` after `<Hero />`.

### Admin page (new files)
`/admin/hot-deals` + `HotDealsClient.tsx` following existing admin page patterns; sidebar entry added to `AdminSidebar.tsx`.

## Risk & rollback
- Risk level R2 (touches checkout price resolution — approved by user 2026-07-29).
- Deal price only ever **lowers** the charged amount, and only for a package that passed the ≥$3 profit gate; worst-case bug = customer pays the normal price.
- DB change is additive (new table). Local apply via prisma with DIRECT_URL provided ad-hoc; production picks it up via existing `prisma db push` in the build script (whenever a deploy is requested — not now).
- Backups of all modified files in `backup/` before editing.
