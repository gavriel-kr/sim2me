# DIP — Ticket 017: Orders: Email Notifications (All Events)

## Pre-Implementation Checklist
- [ ] PRD approved
- [ ] ADD reviewed
- [ ] Ticket 014 completed (abandoned route exists as reference)
- [ ] Ticket 015 completed (cancel-esim and refund routes exist)
- [ ] Read `src/lib/email.ts` fully — understand existing function pattern and Resend usage
- [ ] Read `src/app/api/webhooks/paddle/route.ts` — identify FAILED paths to add notification
- [ ] Read `src/app/api/admin/orders/[id]/retry/route.ts` — identify success/failure paths
- [ ] Check if `vercel.json` exists at repo root

---

## Phase 1 — New Email Functions in `src/lib/email.ts`

### Step 1.1 — `sendOrderFailedEmail(order, errorMessage)`
- [ ] Add function following `sendAdminOrderNotificationEmail` pattern
- [ ] Subject: `⚠️ Order FAILED: #${order.orderNo} — ${order.customerName}`
- [ ] HTML body: order details table + errorMessage highlighted in red + link to `/admin/orders`
- [ ] Fire-and-forget with `.catch(console.error)`

### Step 1.2 — `sendRetrySucceededEmail(order)`
- [ ] Subject: `✅ Retry Succeeded: #${order.orderNo} — ${order.customerName}`
- [ ] HTML body: order details + ICCID confirmation + link to `/admin/orders`

### Step 1.3 — `sendRetryFailedEmail(order, errorMessage)`
- [ ] Subject: `❌ Retry Failed: #${order.orderNo} — ${order.customerName}`
- [ ] HTML body: order details + new errorMessage + link to `/admin/orders`

### Step 1.4 — `sendEsimCancelledEmail(order)`
- [ ] Subject: `🚫 eSIM Cancelled: #${order.orderNo} — ${order.customerName}`
- [ ] HTML body: order details + note that eSIMAccess balance was refunded + link

### Step 1.5 — `sendRefundIssuedEmail(order, amount, currency)`
- [ ] Subject: `💸 Refund Issued: #${order.orderNo} — ${amount} ${currency}`
- [ ] HTML body: order details + amount refunded + customer info + link

### Step 1.6 — `sendAbandonedCheckoutEmail(abandonedOrders: AbandonedOrder[])`
- [ ] Subject: `👻 ${abandonedOrders.length} Abandoned Checkout(s) Detected`
- [ ] HTML body: table of all abandoned orders (email, amount, time since, Paddle link)
- [ ] Single email for all new abandoned (not one per)

---

## Phase 2 — Call Sites: Webhook (FAILED notifications)

### Step 2.1 — `src/app/api/webhooks/paddle/route.ts`
- [ ] Locate fraud guard path (underpayment → sets FAILED)
- [ ] Add: `sendOrderFailedEmail(order, 'Potential fraud: payment below supplier cost').catch(console.error)`
- [ ] Locate eSIMAccess error path (purchasePackage throws → sets FAILED)
- [ ] Add: `sendOrderFailedEmail(order, errorMessage).catch(console.error)`
- [ ] Locate getEsimProfileWithRetry error path → FAILED
- [ ] Add: same call

---

## Phase 3 — Call Sites: Retry Routes

### Step 3.1 — `src/app/api/admin/orders/[id]/retry/route.ts`
- [ ] Locate success path (order set to COMPLETED)
- [ ] Add: `sendRetrySucceededEmail(updatedOrder).catch(console.error)`
- [ ] Locate failure/catch path (order set to FAILED)
- [ ] Add: `sendRetryFailedEmail(order, errorMessage).catch(console.error)`

### Step 3.2 — `src/app/api/account/orders/[id]/retry/route.ts`
- [ ] Same as Step 3.1 (customer-initiated retry also notifies admin)

---

## Phase 4 — Call Sites: Ticket 015 Routes

### Step 4.1 — `src/app/api/admin/orders/[id]/cancel-esim/route.ts`
- [ ] After successful eSIMAccess cancel + DB update
- [ ] Add: `sendEsimCancelledEmail(order).catch(console.error)`

### Step 4.2 — `src/app/api/admin/orders/[id]/refund/route.ts`
- [ ] After successful Paddle refund + DB update
- [ ] Add: `sendRefundIssuedEmail(order, order.totalAmount, order.currency).catch(console.error)`

---

## Phase 5 — Cron: Abandoned Checkout Notifications

### Step 5.1 — Create `src/app/api/admin/orders/check-abandoned/route.ts`
- [ ] `GET` handler (Vercel Cron uses GET)
- [ ] Auth: check `Authorization: Bearer ${CRON_SECRET}` header (or Vercel's auto-auth for crons)
- [ ] Fetch Paddle transactions: status `billed`/`ready`/`past_due`, created > 30 min ago
- [ ] Fetch existing DB `paddleTransactionId` values (to exclude already-processed ones)
- [ ] Check AuditLog for `ABANDONED_CHECKOUT_ALERT` entries — exclude already-alerted IDs
- [ ] Filter: only truly new abandoned (not in DB, not already alerted)
- [ ] If any new: call `sendAbandonedCheckoutEmail(newAbandoned)`
- [ ] Write AuditLog entries for each alerted `paddleTransactionId` with action `ABANDONED_CHECKOUT_ALERT`
- [ ] Return `{ ok: true, alerted: number }`

### Step 5.2 — Add `CRON_SECRET` to env (if not already present)
- [ ] Check if `CRON_SECRET` env var exists in project
- [ ] If not: document that user must add it to Vercel env vars

### Step 5.3 — `vercel.json`
- [ ] Check if `vercel.json` exists at repo root
- [ ] If yes: add to crons array
- [ ] If no: create with crons only
```json
{
  "crons": [
    {
      "path": "/api/admin/orders/check-abandoned",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

## Phase 6 — Build & Verify

### Step 6.1 — TypeScript
- [ ] `npx tsc --noEmit` — 0 errors

### Step 6.2 — Build
- [ ] `npx next build` — clean

### Step 6.3 — Manual verification
- [ ] Manually trigger a FAILED state (e.g. test order with bad packageCode) → check inbox
- [ ] Admin retry a FAILED order → success → check inbox
- [ ] Admin cancel an eSIM → check inbox
- [ ] Confirm all emails arrive at `info.sim2me@gmail.com`
- [ ] Confirm email HTML renders correctly (order details visible)
- [ ] Cron endpoint: call manually with correct auth header → check it runs without error

---

## Rollback Plan
- All email sends are fire-and-forget `.catch` — a broken email function cannot crash a route
- Rollback = remove call sites and new functions
- Cron: remove from `vercel.json` — Vercel stops calling the endpoint

---

## Progress Tracking

| Phase | Step | Status |
|-------|------|--------|
| 1 | sendOrderFailedEmail | ⬜ |
| 1 | sendRetrySucceededEmail | ⬜ |
| 1 | sendRetryFailedEmail | ⬜ |
| 1 | sendEsimCancelledEmail | ⬜ |
| 1 | sendRefundIssuedEmail | ⬜ |
| 1 | sendAbandonedCheckoutEmail | ⬜ |
| 2 | Webhook: FAILED notification call sites | ⬜ |
| 3 | Admin retry route: success + fail notifications | ⬜ |
| 3 | Account retry route: success + fail notifications | ⬜ |
| 4 | cancel-esim route: notification | ⬜ |
| 4 | refund route: notification | ⬜ |
| 5 | check-abandoned cron route | ⬜ |
| 5 | vercel.json cron config | ⬜ |
| 6 | Build + verify | ⬜ |
