# DIP — Ticket 016: Orders: Filtering, Search & Pagination

## Pre-Implementation Checklist
- [ ] PRD approved
- [ ] ADD reviewed
- [ ] Ticket 014 completed (unified list, expand panel)
- [ ] Ticket 015 completed (archivedAt field on Order)
- [ ] Read `src/app/admin/orders/page.tsx` — current Prisma query understood
- [ ] Read `src/app/admin/orders/AdminOrdersClient.tsx` — current filter state understood
- [ ] Read `src/app/admin/orders/orderFilters.ts` — current filter types understood
- [ ] Read `src/app/admin/orders/OrdersFilters.tsx` — current filter UI understood

---

## Phase 1 — Server: URL-Driven Prisma Query

### Step 1.1 — Update `page.tsx` to read searchParams
- [ ] Add `searchParams` to page props type: `{ searchParams: { q?: string; status?: string; country?: string; from?: string; to?: string; archived?: string; page?: string } }`
- [ ] Build `where: Prisma.OrderWhereInput` from searchParams (see ADD for logic)
- [ ] Replace `findMany({ take: 500 })` with `findMany({ where, skip, take: 50, orderBy })`
- [ ] Add `prisma.order.count({ where })` → `totalCount`
- [ ] Pass `{ orders, totalCount, currentPage: pageNum, pageSize: 50, filters: searchParams }` to AdminOrdersClient

### Step 1.2 — Handle ABANDONED in server query
- [ ] If `status` param contains only `ABANDONED`: return 0 DB orders (don't apply ABANDONED to Prisma — it's not an OrderStatus enum value)
- [ ] If `status` contains mixed (e.g. `FAILED,ABANDONED`): filter out ABANDONED before Prisma query

---

## Phase 2 — Client: URL-Driven Filter State

### Step 2.1 — Remove client-side filter state
- [ ] Remove `useState` for filter values (search, status, country, dates)
- [ ] Replace with `useSearchParams()` reads
- [ ] Add `updateFilter(key, value)` helper (see ADD)

### Step 2.2 — Update OrdersFilters.tsx
- [ ] Each filter input: `value` reads from `useSearchParams()`, `onChange` calls `updateFilter`
- [ ] "Clear filters" button: push to `/admin/orders` (no params)
- [ ] Add **Archived filter** toggle: radio or select with options `active` / `archived` / `all`

### Step 2.3 — Add ABANDONED to status filter
- [ ] Update `ORDER_STATUSES` in `orderFilters.ts` to include `'ABANDONED'`
- [ ] ABANDONED status filter: client-side only (controls whether abandoned rows from Paddle appear)

---

## Phase 3 — Client: Pagination UI

### Step 3.1 — Pagination component
- [ ] Create small inline pagination component (no separate file needed, within AdminOrdersClient or OrdersFilters)
- [ ] Props: `currentPage`, `totalPages`, `totalCount`, `pageSize`
- [ ] Renders: "← Prev | Page X of Y | Next →" and "Showing A–B of N orders"
- [ ] Prev/Next: call `updateFilter('page', String(n))`
- [ ] Disable Prev on page 1, disable Next on last page

### Step 3.2 — Pass pagination data to client
- [ ] `totalPages = Math.ceil(totalCount / pageSize)` (computed in page.tsx or client)
- [ ] Display pagination at bottom of table (and optionally top)

---

## Phase 4 — ICCID Search

### Step 4.1 — Extend Prisma search in page.tsx
- [ ] Add `{ iccid: { contains: q, mode: 'insensitive' } }` to the OR clause
- [ ] No UI change needed — uses the same search box

---

## Phase 5 — Build & Verify

### Step 5.1 — TypeScript
- [ ] `npx tsc --noEmit` — 0 errors (Prisma WhereInput types must satisfy TS)

### Step 5.2 — Build
- [ ] `npx next build` — clean

### Step 5.3 — Manual verification
- [ ] Default load: shows 50 orders, page 1 of N
- [ ] Pagination: Next → page 2, URL updates to `?page=2`, correct orders shown
- [ ] Search: enter email → URL updates → filtered results from server
- [ ] Search by ICCID: enter ICCID → correct order found
- [ ] Status filter: select FAILED → only FAILED orders; select ABANDONED → only Paddle abandoned rows
- [ ] Archived filter: default (Active) → no archived; select Archived → only archived; All → both
- [ ] Filter + refresh: URL preserved, same results
- [ ] Filter change resets to page 1

---

## Rollback Plan
- No schema changes
- Reverting page.tsx to original findMany(take:500) + restoring client filter state = full rollback
- All changes contained in 4 files

---

## Progress Tracking

| Phase | Step | Status |
|-------|------|--------|
| 1 | page.tsx: searchParams + paginated Prisma query | ⬜ |
| 1 | ABANDONED exclusion from Prisma | ⬜ |
| 2 | Remove client filter state → URL-driven | ⬜ |
| 2 | OrdersFilters: URL-connected + archived toggle | ⬜ |
| 2 | ABANDONED in status filter | ⬜ |
| 3 | Pagination component | ⬜ |
| 3 | Pagination data flow | ⬜ |
| 4 | ICCID search in Prisma OR clause | ⬜ |
| 5 | Build + verify | ⬜ |
