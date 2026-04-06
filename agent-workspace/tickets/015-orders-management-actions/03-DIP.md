# DIP — Ticket 015: Orders: Management Actions + Archive

## Pre-Implementation Checklist
- [ ] PRD approved
- [ ] ADD reviewed
- [ ] Ticket 014 completed (actions panel exists in expand row)
- [ ] Read `prisma/schema.prisma` — Order model confirmed
- [ ] Read existing audit log route to match pattern
- [ ] Read `src/lib/esimaccess.ts` — `cancelOrder` signature confirmed
- [ ] Confirm `PADDLE_API_KEY` is set and has Adjustments permission

---

## Phase 1 — Schema Migration

### Step 1.1 — Add fields to Order model
- [ ] Edit `prisma/schema.prisma`: add `archivedAt DateTime?` and `notes String?` to Order
- [ ] Run `npx prisma db push` (additive, non-destructive)
- [ ] Verify in Prisma Studio or quick query: both fields present, null by default

---

## Phase 2 — Archive Route

### Step 2.1 — Create `src/app/api/admin/orders/[id]/archive/route.ts`
- [ ] Admin auth check
- [ ] Parse body: `{ archived: boolean }`
- [ ] `prisma.order.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } })`
- [ ] Write audit log entry: `ARCHIVE_ORDER` or `UNARCHIVE_ORDER`
- [ ] Return `{ ok: true, archivedAt }`

---

## Phase 3 — Cancel eSIM Route

### Step 3.1 — Create `src/app/api/admin/orders/[id]/cancel-esim/route.ts`
- [ ] Admin auth check
- [ ] Find order by id, verify `esimOrderId` exists
- [ ] Guard: if status already `CANCELLED` → return `{ ok: false, error: 'Already cancelled' }`
- [ ] Call `cancelOrder(order.esimOrderId)` from `src/lib/esimaccess.ts`
- [ ] On success: `prisma.order.update({ status: 'CANCELLED' })` + audit log `CANCEL_ESIM_ORDER`
- [ ] On eSIMAccess error: return `{ ok: false, error: errorMessage }` — no DB update
- [ ] Return `{ ok: true }` or `{ ok: false, error: string }`

---

## Phase 4 — Refund Route

### Step 4.1 — Create `src/app/api/admin/orders/[id]/refund/route.ts`
- [ ] Admin auth check
- [ ] Find order by id, verify `paddleTransactionId` exists
- [ ] Guard: if status already `REFUNDED` → return `{ ok: false, error: 'Already refunded' }`
- [ ] Call Paddle Adjustments API (POST `https://api.paddle.com/adjustments`)
  - action: `refund`, transaction_id: `paddleTransactionId`, reason: "Admin refund"
- [ ] On Paddle success: `prisma.order.update({ status: 'REFUNDED' })` + audit log `REFUND_ORDER`
- [ ] On Paddle error: return `{ ok: false, error: paddle_error_message }` — no DB update
- [ ] Return `{ ok: true }` or `{ ok: false, error: string }`

---

## Phase 5 — Edit Route

### Step 5.1 — Create `src/app/api/admin/orders/[id]/edit/route.ts`
- [ ] Admin auth check
- [ ] Parse body, whitelist allowed fields: `customerEmail`, `customerName`, `status`, `errorMessage`, `notes`
- [ ] Fetch current order for before-snapshot
- [ ] `prisma.order.update({ data: allowedFields })`
- [ ] Audit log `EDIT_ORDER` with `{ before, after }` snapshots
- [ ] Return `{ ok: true, order: updatedOrder }`

---

## Phase 6 — Resend Email Route

### Step 6.1 — Create `src/app/api/admin/orders/[id]/resend-email/route.ts`
- [ ] Admin auth check
- [ ] Find order by id
- [ ] Guard: status must be COMPLETED, must have iccid and qrCodeUrl
- [ ] Call `sendPostPurchaseEmail` with order data (use existing function signature)
- [ ] Audit log `RESEND_EMAIL`
- [ ] Return `{ ok: true }` or `{ ok: false, error: string }`

---

## Phase 7 — UI: Action Buttons + Confirmation Dialogs

### Step 7.1 — Action button component
- [ ] Small reusable `<ConfirmDialog>` component (or use existing modal pattern)
  - Props: `title`, `description`, `confirmLabel`, `onConfirm`, `loading`, `danger?: boolean`
- [ ] Place in `src/app/admin/orders/` (co-located, not shared)

### Step 7.2 — Wire action buttons in AdminOrdersClient expand panel (Ticket 014 panel)
- [ ] **Archive/Unarchive**: always visible; on confirm → PATCH `/archive` → update local state
- [ ] **Cancel eSIM**: show if `esimOrderId` and status ≠ CANCELLED/COMPLETED; danger style
- [ ] **Refund**: show if `paddleTransactionId` and status ≠ REFUNDED; danger style; show amount in dialog
- [ ] **Edit**: always visible; opens inline edit form within panel
- [ ] **Resend Email**: show if status = COMPLETED and iccid exists; normal style
- [ ] **Retry**: existing, keep as-is

### Step 7.3 — Inline edit form
- [ ] When Edit button clicked: toggle editable fields in the panel (customerEmail, customerName, notes, status dropdown, errorMessage)
- [ ] Save / Cancel buttons
- [ ] On save → PATCH `/edit` → update local order state with returned order

### Step 7.4 — Local state update after actions
- [ ] Archive → update `order.archivedAt` in local state (or remove from list if not showing archived)
- [ ] Cancel eSIM → update `order.status = 'CANCELLED'`
- [ ] Refund → update `order.status = 'REFUNDED'`
- [ ] Edit → replace order in list with returned updated order

---

## Phase 8 — "Show Archived" toggle in list

### Step 8.1 — Filter toggle
- [ ] Add `showArchived: boolean` state (default false) to AdminOrdersClient
- [ ] When false: filter out orders where `archivedAt !== null`
- [ ] When true: show all including archived (visually distinct — slightly muted)
- [ ] Toggle button or checkbox in filter bar

### Step 8.2 — Archived row style
- [ ] Archived rows: slightly muted opacity + small "ARCHIVED" label
- [ ] Unarchive button visible in expand panel

---

## Phase 9 — Build & Verify

### Step 9.1 — TypeScript
- [ ] `npx tsc --noEmit` — 0 errors

### Step 9.2 — Build
- [ ] `npx next build` — clean

### Step 9.3 — Manual verification
- [ ] Archive an order → disappears from list → toggle "show archived" → reappears → unarchive → back in list
- [ ] Cancel eSIM on unused order → status changes to CANCELLED → eSIMAccess balance refunded
- [ ] Cancel eSIM on used order → shows error from eSIMAccess → status unchanged
- [ ] Refund → Paddle processes → status changes to REFUNDED
- [ ] Edit customer email → saved → visible in list
- [ ] Resend email → customer receives email
- [ ] All actions appear in audit log

---

## Rollback Plan
- Schema changes: additive only (`archivedAt`, `notes` nullable) — rollback = remove columns (safe, no data loss from existing rows)
- All new routes: additive — removing breaks nothing in existing UI
- No changes to webhook or payment flows

---

## Progress Tracking

| Phase | Step | Status |
|-------|------|--------|
| 1 | Schema: archivedAt + notes | ✅ |
| 2 | /archive route | ✅ |
| 3 | /cancel-esim route | ✅ |
| 4 | /refund route (Paddle) | ✅ |
| 5 | /edit route | ✅ |
| 6 | /resend-email route | ✅ |
| 7 | ConfirmDialog component | ✅ |
| 7 | Action buttons in UI | ✅ |
| 7 | Inline edit form | ✅ |
| 7 | Local state update | ✅ |
| 8 | Show archived toggle | ✅ |
| 9 | Build + verify | ✅ |
