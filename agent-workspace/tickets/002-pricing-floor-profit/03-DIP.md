# DIP — Ticket 002: Pricing Floor & Profit Dashboard

## Status Legend: [ ] pending · [✅] done

---

## Phase 1 — Schema & Migration

- [✅] **1.1** `prisma/schema.prisma` — add `supplierCost Decimal? @db.Decimal(10, 4)` to `Order` model
- [✅] **1.2** Run `npx prisma db push` to apply migration (shadow DB had pre-existing issue; db push succeeded)

---

## Phase 2 — Price Floor Bulk Action

- [✅] **2.1** Create `src/app/api/admin/packages/apply-price-floor/route.ts`
  - POST handler (admin session guard)
  - Fetch packages from eSIMaccess + existing overrides
  - Filter: `(retailPrice || price) / 10000 >= 0.55 && < 0.70`
  - Upsert each matching package: `customPrice = 0.70` (preserve other override fields)
  - Return `{ updated: N, packageCodes: [...] }`

- [✅] **2.2** `src/app/admin/packages/PackagesClient.tsx` — add "Apply Price Floor" button
  - New state: `applyingFloor: boolean`, `floorResult: string`
  - Button next to Refresh, calls POST `/api/admin/packages/apply-price-floor`
  - On success: show toast "X packages updated to $0.70", call `fetchAll()`
  - Clear toast after 5s
  - Also improved price card labels: API Price / Sale Price / Cost

---

## Phase 3 — Webhook: Capture Supplier Cost

- [✅] **3.1** `src/app/api/webhooks/paddle/route.ts`
  - In the package lookup block (lines 110–121), capture `supplierCostUsd = pkg.price / 10000`
  - Add `supplierCost: supplierCostUsd` to `prisma.order.create()` data (line ~129)
  - If package lookup fails, supplierCost remains undefined (NULL in DB — acceptable)

---

## Phase 4 — Dashboard: Show Profit

- [✅] **4.1** `src/app/admin/page.tsx`
  - Add `supplierCostTotal` aggregate: `prisma.order.aggregate({ _sum: { totalAmount, supplierCost }, where: { status: 'COMPLETED' } })`
  - Derive: `cost = Number(supplierCostTotal._sum.supplierCost || 0)`, `profit = revenue - cost`
  - Expand stats grid to 5 cards: Orders | Revenue | Cost | Profit | Avg Order
  - Profit card: green background (bg-emerald → bg-green) with TrendingUp icon
  - Note: cost/profit will be $0 until the first order after migration (NULL safe)

---

## Files Modified
1. `prisma/schema.prisma`
2. `src/app/api/webhooks/paddle/route.ts`
3. `src/app/api/admin/packages/apply-price-floor/route.ts` ← new file
4. `src/app/admin/packages/PackagesClient.tsx`
5. `src/app/admin/page.tsx`

## Rollback Plan
- Schema: migration is additive (nullable column) — safe to roll back by removing the column
- Webhook: supplierCost is optional; removing it has no effect on order creation
- No Paddle or eSIMaccess API changes
