# DIP — Ticket 018: Fraud Protection & Auto-Blocking

## Phase 1 — Schema Migration

### Step 1.1 — Add `BlockedItem` model to `prisma/schema.prisma`
- [ ] Add model with fields: id, type, value, reason, autoBlocked, createdAt
- [ ] Add `@@unique([type, value])` constraint

### Step 1.2 — Add `checkoutIp` to `Order` model
- [ ] Add nullable `checkoutIp String?` field

### Step 1.3 — Run migration
- [ ] `$env:DIRECT_URL="..."; npx prisma db push`
- [ ] Verify schema applied without errors

---

## Phase 2 — Fraud Utility (`src/lib/fraud.ts`)

### Step 2.1 — `autoBlock(type, value, reason)`
- [ ] Upsert into `BlockedItem` (update if exists to refresh reason, create if not)
- [ ] `autoBlocked: true`

### Step 2.2 — `checkAndAutoBlockEmail(email)`
- [ ] Count FAILED orders for email in last 24h
- [ ] If ≥ 3 → call `autoBlock('EMAIL', email, '3+ FAILED orders in 24h')`

### Step 2.3 — `isBlocked(type, value)`
- [ ] Simple lookup in `BlockedItem` by type+value
- [ ] Returns boolean

---

## Phase 3 — Checkout Prepare Route

### Step 3.1 — `src/app/api/checkout/prepare/route.ts`
- [ ] Import `getClientIp` from `@/lib/rateLimit` and `isBlocked` from `@/lib/fraud`
- [ ] Extract IP from request
- [ ] Check `isBlocked('IP', ip)` → 403 if blocked
- [ ] Check `isBlocked('EMAIL', customerEmail)` → 403 if blocked
- [ ] Pass `checkoutIp: ip` in customData returned to client

---

## Phase 4 — Webhook Updates

### Step 4.1 — `src/app/api/webhooks/paddle/route.ts`
- [ ] Extract `checkoutIp` from customData (sanitize: max 45 chars, valid IP pattern)
- [ ] Save `checkoutIp` on Order at creation time
- [ ] On underpayment: call `autoBlock('EMAIL', customerEmail, 'Underpayment fraud')` + `autoBlock('IP', checkoutIp, 'Underpayment fraud')` (skip IP if blank)
- [ ] In FAILED catch block: call `checkAndAutoBlockEmail(customerEmail)`

### Step 4.2 — Admin retry route
- [ ] In catch block: call `checkAndAutoBlockEmail(order.customerEmail)`

### Step 4.3 — Account retry route
- [ ] In catch block: call `checkAndAutoBlockEmail(order.customerEmail)`

---

## Phase 5 — Admin Blocklist API

### Step 5.1 — `src/app/api/admin/blocklist/route.ts`
- [ ] `GET`: return all `BlockedItem` records ordered by createdAt desc
- [ ] `POST`: validate `{ type: 'IP'|'EMAIL', value: string, reason?: string }`, upsert BlockedItem

### Step 5.2 — `src/app/api/admin/blocklist/[id]/route.ts`
- [ ] `DELETE`: delete BlockedItem by id, audit log

### Step 5.3 — `src/app/api/admin/blocklist/scan/route.ts`
- [ ] `POST`: retroactive scan
  - Find all unique emails with 3+ FAILED orders → autoBlock
  - Find all orders with errorMessage containing 'Blocked: underpayment' → autoBlock email + IP (from checkoutIp)
  - Return `{ blocked: number, details: [...] }`

---

## Phase 6 — "Block Email" Button on Orders Page

### Step 6.1 — `src/app/admin/orders/AdminOrdersClient.tsx`
- [ ] Add "Block Email" button in expanded order panel (only for non-ABANDONED orders, or abandoned with email)
- [ ] On click: POST `/api/admin/blocklist` with `{ type: 'EMAIL', value: order.customerEmail, reason: 'Admin manual block' }`
- [ ] Show success/error toast

---

## Phase 7 — Admin Blocklist UI Page

### Step 7.1 — `src/app/admin/blocklist/page.tsx`
- [ ] Server component: fetch all blocked items
- [ ] Table with columns: Type, Value, Reason, Auto, Date, Actions
- [ ] Unblock button (DELETE)
- [ ] "Add Block" form: type + value + reason
- [ ] "Run Retroactive Scan" button → POST /api/admin/blocklist/scan

---

## Phase 8 — Build & Verify

### Step 8.1
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx next build` — clean

### Step 8.2 — Manual tests
- [ ] Block an email → try checkout → get 403
- [ ] Block an IP → try checkout → get 403
- [ ] Run retroactive scan → verify count returned
- [ ] Unblock an item from admin UI → verify re-enabled

---

## Rollback Plan
- `BlockedItem` table: drop via migration if needed (no FK dependencies)
- `checkoutIp`: nullable, existing code unaffected if removed
- Auto-block calls are fire-and-forget → removing them doesn't break any flow

---

## Progress Tracking

| Phase | Step | Status |
|-------|------|--------|
| 1 | Schema migration | ⬜ |
| 2 | fraud.ts utility | ⬜ |
| 3 | Checkout prepare blocklist check | ⬜ |
| 4 | Webhook + retry auto-block | ⬜ |
| 5 | Admin blocklist API | ⬜ |
| 6 | Block button on orders page | ⬜ |
| 7 | Admin blocklist UI page | ⬜ |
| 8 | Build + verify | ⬜ |
