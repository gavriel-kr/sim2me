# ADD — Ticket 017: Orders: Email Notifications (All Events)

## Architecture Overview

New email functions added to `src/lib/email.ts` (existing pattern). Call sites are the action routes from Ticket 015 and the existing webhook/retry routes. Abandoned checkout notification uses the `/api/admin/orders/abandoned` route from Ticket 014 as a cron-triggered endpoint.

No new dependencies — uses existing Resend infrastructure.

---

## New Email Functions in `src/lib/email.ts`

### `sendOrderFailedEmail(order, errorMessage)`
Called from: `src/app/api/webhooks/paddle/route.ts` (on FAILED status set)

### `sendRetrySucceededEmail(order)`
Called from: `src/app/api/admin/orders/[id]/retry/route.ts` (on success)
Called from: `src/app/api/account/orders/[id]/retry/route.ts` (on success, admin notified)

### `sendRetryFailedEmail(order, errorMessage)`
Called from: both retry routes (on failure)

### `sendEsimCancelledEmail(order, adminEmail)`
Called from: `src/app/api/admin/orders/[id]/cancel-esim/route.ts` (Ticket 015)

### `sendRefundIssuedEmail(order, amount)`
Called from: `src/app/api/admin/orders/[id]/refund/route.ts` (Ticket 015)

### `sendAbandonedCheckoutEmail(abandonedOrder)`
Called from: new cron endpoint (see below)

---

## Email Template Pattern

All admin notification emails follow the existing `sendAdminOrderNotificationEmail` pattern:
- From: `RESEND_FROM_EMAIL`
- To: `ADMIN_NOTIFICATION_EMAIL` (default `info.sim2me@gmail.com`)
- HTML: clean table layout with order details
- All sends: fire-and-forget (`.catch(console.error)`) — same as existing pattern
- Dev fallback: if no `RESEND_API_KEY`, log to console and return success

---

## Abandoned Checkout Cron

### `GET /api/admin/orders/check-abandoned` (cron endpoint)
- Called by Vercel Cron every 30 minutes (configured in `vercel.json`)
- Vercel Cron auth: `CRON_SECRET` header check (existing pattern if used, else add)
- Fetches Paddle transactions with status `billed`/`ready`/`past_due`
- Filters: created > 30 minutes ago (older than checkout window)
- Checks against DB: only alert for those NOT in our DB
- Tracks alerted transactions to avoid duplicate emails: simple in-memory Set per invocation is not enough → use a lightweight approach: store `lastAbandonedAlertAt` timestamp in `Settings` table or a simple `AbandonedAlert` log entry in AuditLog
- If new abandoned checkouts found: send one summary email (not one per abandoned) containing a table of all abandoned orders

### Deduplication strategy
Before sending abandoned alert:
- Check AuditLog for `ABANDONED_CHECKOUT_ALERT` entries containing the `paddleTransactionId`
- Only send for IDs not previously alerted
- Write AuditLog entry per alerted transaction

---

## Call Site Changes

### `src/app/api/webhooks/paddle/route.ts`
- Existing: sends `sendAdminOrderNotificationEmail` on `transaction.completed` (keep)
- **Add**: send `sendOrderFailedEmail` when setting status to `FAILED` (fraud guard path + eSIMAccess error path)

### `src/app/api/admin/orders/[id]/retry/route.ts`
- **Add**: send `sendRetrySucceededEmail` on success
- **Add**: send `sendRetryFailedEmail` on failure

### `src/app/api/account/orders/[id]/retry/route.ts`
- **Add**: send `sendRetrySucceededEmail` on success (admin notification, not customer)
- **Add**: send `sendRetryFailedEmail` on failure

### `src/app/api/admin/orders/[id]/cancel-esim/route.ts` (Ticket 015)
- **Add**: send `sendEsimCancelledEmail` on success

### `src/app/api/admin/orders/[id]/refund/route.ts` (Ticket 015)
- **Add**: send `sendRefundIssuedEmail` on success

---

## `vercel.json` — Cron Configuration

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

Check if `vercel.json` already exists in the repo; if so, add to existing crons array.

---

## Files Modified / Created

| File | Change |
|------|--------|
| `src/lib/email.ts` | Add 6 new email functions |
| `src/app/api/webhooks/paddle/route.ts` | Add FAILED notification calls |
| `src/app/api/admin/orders/[id]/retry/route.ts` | Add retry success/fail notifications |
| `src/app/api/account/orders/[id]/retry/route.ts` | Add retry success/fail notifications |
| `src/app/api/admin/orders/[id]/cancel-esim/route.ts` | Add cancelled notification (Ticket 015 file) |
| `src/app/api/admin/orders/[id]/refund/route.ts` | Add refund notification (Ticket 015 file) |
| `src/app/api/admin/orders/check-abandoned/route.ts` | NEW — cron endpoint |
| `vercel.json` | Add cron schedule |

**No new dependencies. No schema changes.**
