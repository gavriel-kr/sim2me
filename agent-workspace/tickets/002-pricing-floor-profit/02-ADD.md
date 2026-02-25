# ADD — Ticket 002: Pricing Floor & Profit Dashboard

## Architecture Overview

This ticket touches three independent concerns. Each follows existing project patterns
with minimal footprint.

---

## R1 — Price Floor Bulk Action

### New API Route
`src/app/api/admin/packages/apply-price-floor/route.ts`
- **Method**: POST
- **Auth**: Admin session required (same pattern as existing override route)
- **Logic**:
  1. Fetch all packages from eSIMaccess via `getPackages()`.
  2. Fetch existing overrides from `prisma.packageOverride.findMany()`.
  3. For each package where `(retailPrice || price) / 10000` is in range `[0.55, 0.70)`:
     - Upsert `PackageOverride` with `customPrice = 0.70` (leave all other fields intact).
  4. Return `{ updated: N }`.
- No new dependencies. Follows `/api/admin/packages/override/route.ts` pattern.

### UI Change — PackagesClient.tsx
- Add one button next to "Refresh": **"Apply Price Floor"**.
- On click: POST to new route, show toast with count, call `fetchAll()` to refresh.
- State: `applyingFloor: boolean` (loading spinner), `floorResult: string` (toast).

---

## R2 — Back Office Price Labels

No API changes. Pure UI improvement in `PackagesClient.tsx` package card (~lines 384–394).

Current display logic is already correct (customPrice shown large, API price line-through,
cost below). We improve **labels only**:
- `$X.XX` (customPrice) → label: "Sale Price"
- `$X.XX` (API retailPrice) → label: "API Price" (line-through when overridden)
- `Cost: $X.XX` (wholesale) → unchanged, just styled consistently

---

## R3 — Profit Tracking

### Schema Change (additive only)
```prisma
model Order {
  ...
  supplierCost  Decimal?  @db.Decimal(10, 4)  // wholesale cost paid to eSIMaccess (USD)
  ...
}
```
- **Additive** — nullable field, zero risk to existing data.
- Migration: `prisma migrate dev --name add-supplier-cost-to-order`

### Webhook Update
`src/app/api/webhooks/paddle/route.ts`
- Package lookup already happens at lines 110–121.
- Capture `supplierCostUsd = pkg.price / 10000` alongside existing package details.
- Pass `supplierCost: supplierCostUsd` when calling `prisma.order.create()` at line 128.

### Dashboard Update
`src/app/admin/page.tsx`
- Add aggregate query for `supplierCost` sum (COMPLETED orders).
- Derive `profit = revenue - cost`.
- Replace 4-stat grid with 5 stats: Orders, Revenue, Cost, Profit, Avg Order.
- Profit card uses red/green colour based on sign (always positive in normal operation).

---

## Data Flow (R3)

```
Paddle webhook
  → getPackages() [already called]
  → capture pkg.price as supplierCost
  → prisma.order.create({ supplierCost, ... })

Dashboard
  → prisma.order.aggregate({ _sum: { totalAmount, supplierCost } })
  → profit = totalAmount - supplierCost
```

---

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `supplierCost` field to Order |
| `src/app/api/webhooks/paddle/route.ts` | Capture & save supplierCost |
| `src/app/api/admin/packages/apply-price-floor/route.ts` | **New** — bulk price floor endpoint |
| `src/app/admin/packages/PackagesClient.tsx` | Add Apply Price Floor button + clearer labels |
| `src/app/admin/page.tsx` | Show Cost + Profit stats |

## No New Dependencies
