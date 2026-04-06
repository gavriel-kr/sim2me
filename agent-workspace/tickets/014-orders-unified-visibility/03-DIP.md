# DIP — Ticket 014: Orders: Unified List + Full Transparency

## Pre-Implementation Checklist
- [ ] PRD approved
- [ ] ADD reviewed
- [ ] Read `src/app/admin/orders/AdminOrdersClient.tsx` fully
- [ ] Read `src/app/admin/orders/page.tsx` fully
- [ ] Read `src/lib/esimaccess.ts` — `getEsimUsage`, `getEsimProfile` signatures confirmed
- [ ] Confirm `PADDLE_API_KEY` env var is set in production
- [ ] Understand existing expand/row pattern (if any) in AdminOrdersClient

---

## Phase 1 — New API Route: Paddle Abandoned Orders

### Step 1.1 — Create `src/app/api/admin/orders/abandoned/route.ts`
- [ ] Admin auth check (getServerSession + isAdmin)
- [ ] Call Paddle REST API: `GET https://api.paddle.com/transactions` with status filters
- [ ] Parse response, return array of `{ paddleTransactionId, customerEmail, amount, currency, createdAt, paddleStatus }`
- [ ] Handle Paddle API errors gracefully (return empty array, log error)
- [ ] Return `{ abandoned: [...] }`

---

## Phase 2 — New API Route: Live eSIM Status

### Step 2.1 — Create `src/app/api/admin/orders/[id]/esim-status/route.ts`
- [ ] Admin auth check
- [ ] Find order by `id` in DB (`prisma.order.findUnique`)
- [ ] If order has `iccid`: call `getEsimUsage(iccid)`
- [ ] Else if order has `esimOrderId`: call `getEsimProfile(esimOrderId)` → take first item
- [ ] Else: return `{ noEsim: true }`
- [ ] Return normalized response (status, volumes, expiry, ICCID, QR, codes)
- [ ] Handle eSIMAccess errors gracefully (return `{ error: string }`)

---

## Phase 3 — AdminOrdersClient: Unified Merged List

### Step 3.1 — Add abandoned orders state + fetch
- [ ] `useState<AbandonedOrder[]>` + `useState<boolean>` for loading
- [ ] `useEffect` on mount: fetch `/api/admin/orders/abandoned`
- [ ] Map abandoned response to unified `DisplayOrder` type with `status: 'ABANDONED'`
- [ ] Merge with DB orders into one array, sorted by `createdAt` desc
- [ ] De-dup: filter abandoned where `paddleTransactionId` already in DB orders

### Step 3.2 — Add `ABANDONED` to status filter options
- [ ] Update `ORDER_STATUSES` in `orderFilters.ts` to include `'ABANDONED'`
- [ ] Filter logic: if status filter includes ABANDONED, include merged abandoned rows

### Step 3.3 — Status badges
- [ ] Define badge color map for all statuses including ABANDONED
- [ ] ABANDONED badge: orange with dashed border style

---

## Phase 4 — Expandable Row Panel

### Step 4.1 — Row click → expand state
- [ ] Add `expandedOrderId: string | null` state
- [ ] Click on row → toggle expand (same ID collapses)
- [ ] Expand icon/chevron on each row

### Step 4.2 — eSIM status fetch on expand
- [ ] `esimStatusMap: Record<string, EsimStatusData>` state
- [ ] `esimLoadingIds: Set<string>` state
- [ ] On expand of order with `iccid` or `esimOrderId`: if not in map → fetch `/api/admin/orders/[id]/esim-status` → store in map
- [ ] Once fetched, cached — no re-fetch on collapse/expand

### Step 4.3 — Expand panel UI: Paddle section
- [ ] Show: `paddleTransactionId` with working deep-link
  - Fix: `https://vendors.paddle.com/transactions-v2/{paddleTransactionId}`
- [ ] Show: payment status, receipt URL (if returned by Paddle API in future)
- [ ] Show: `paidAt` formatted date

### Step 4.4 — Expand panel UI: eSIMAccess section
- [ ] Loading spinner while fetching
- [ ] Error state if eSIMAccess unavailable
- [ ] Status indicator: 🟢 Active / 🔴 Inactive / ⚫ Expired
- [ ] Data usage bar: `████████░░ 3.2 / 5 GB` (CSS width % = usedVolume/orderVolume)
- [ ] Remaining + expiry date
- [ ] ICCID (monospace, copyable)
- [ ] SM-DP+ address (collapsible, copyable)
- [ ] Activation code (copyable)
- [ ] QR code image (lazy loaded, toggle show/hide)
- [ ] `errorMessage` in red if present

### Step 4.5 — Expand panel UI: Actions section
- [ ] Placeholder action buttons (wired in Ticket 015):
  - Archive, Cancel eSIM, Refund, Edit, Resend Email
- [ ] For ABANDONED rows: "View in Paddle" button only

### Step 4.6 — ABANDONED row display
- [ ] Columns: Date, Customer Email (or "—"), Package (or "—"), Amount, ABANDONED badge
- [ ] Expand: only Paddle section (no eSIM section)

---

## Phase 5 — Fix Paddle Deep-Link

### Step 5.1 — Fix in AdminOrdersClient
- [ ] Find existing "View in Paddle" href
- [ ] Change from `https://vendors.paddle.com/transactions-v2` to `https://vendors.paddle.com/transactions-v2/{order.paddleTransactionId}`
- [ ] Only render link if `paddleTransactionId` exists

---

## Phase 6 — Build & Verify

### Step 6.1 — TypeScript
- [ ] `npx tsc --noEmit` — 0 errors

### Step 6.2 — Build
- [ ] `npx next build` — clean

### Step 6.3 — Manual verification
- [ ] Page loads, DB orders visible
- [ ] Abandoned section loads async (spinner then list)
- [ ] Click order → expand panel opens
- [ ] eSIM data loads in expand (spinner → data or "no eSIM")
- [ ] Usage bar renders correctly
- [ ] Paddle deep-link points to correct transaction
- [ ] ABANDONED rows show email + amount + Paddle link

---

## Rollback Plan
- No schema changes → rollback = revert file changes only
- Both new API routes are additive; removing them breaks nothing

---

## Progress Tracking

| Phase | Step | Status |
|-------|------|--------|
| 1 | /abandoned route | ✅ |
| 2 | /esim-status route | ✅ |
| 3 | Merged list + ABANDONED filter | ✅ |
| 3 | Status badges | ✅ |
| 4 | Row expand state | ✅ |
| 4 | eSIM fetch on expand | ✅ |
| 4 | Paddle panel | ✅ |
| 4 | eSIMAccess panel + usage bar | ✅ |
| 4 | Actions placeholder | ✅ |
| 4 | ABANDONED row | ✅ |
| 5 | Fix Paddle deep-link | ✅ |
| 6 | Build + verify | ✅ |
