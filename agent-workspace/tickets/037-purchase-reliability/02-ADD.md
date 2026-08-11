# Ticket 037 — Architectural Design (ADD)

Read against the code as it stands at `f8040bb`. Line references are from that state.

## The five changes

### 1. Consent at checkout — enforced on the server, evidenced at Paddle

Three parts, in order of who they protect:

- **UI.** A required checkbox at the traveler step of `CheckoutClient.tsx`, with links to the terms and
  the refund policy, and an explicit acknowledgement that the eSIM is delivered immediately and that
  the withdrawal right is waived on activation. It gates the same "continue" the form already gates,
  through the existing `react-hook-form` + `zod` resolver — `travelerInfoSchema` in
  `src/lib/validation/schemas.ts` gains one boolean with a `refine`, so no new validation mechanism
  appears.
- **Server.** `api/checkout/create-transaction/route.ts` rejects a request whose consent flag is not
  `true`, before it creates anything. This is the actual control; the checkbox is only how a human
  expresses it. A crafted request that omits the field gets a 400 and no transaction.
- **Evidence.** The flag travels in Paddle `custom_data`, which the route already builds and which
  Paddle retains on the transaction and echoes back to the webhook. So for any order there is a
  third-party record that consent was given at purchase time, with Paddle's own timestamp on the
  transaction.

**No schema change.** An additive `Order.termsAcceptedAt` column was considered and deferred: the
evidence already exists at Paddle and in the webhook payload, and a migration is a heavier thing to add
in the same week as everything else. If the legal position later needs the flag queryable in our own
database, it is one additive nullable column and its own small ticket.

### 2. `COMPLETED` starts to mean "there is an eSIM"

`webhooks/paddle/route.ts:264-275` sets `status: 'COMPLETED'` unconditionally and spreads the profile
fields only `...(firstProfile && …)`. The status becomes conditional on the same thing the fields are:
profile present → `COMPLETED`; profile absent → stays `PROCESSING`.

Everything else in that branch is untouched. The `else` at `:322-332` still sends
`sendOrderDelayedEmail`, so the customer is still told. The customer-account upsert at `:277-300` still
runs, so they can still sign in and see the order.

The identical defect exists in both retry routes — `account/orders/[id]/retry/route.ts:60-72` and the
admin equivalent — and is fixed the same way in each, because a retry that produces no profile leaving
`COMPLETED` behind is the same lie by a different door.

**Consequence that must be designed for, not discovered:** the customer retry route only accepts
`status: 'FAILED'` (`:37`). Leaving these orders `PROCESSING` therefore removes their self-service
action — which is why change 4 below widens that route deliberately and narrowly, rather than by
accident.

### 3. A pending order says what it is

In `AccountClient.tsx`, a `PROCESSING` order gains a short explanation — paid, the eSIM is being
prepared, check the email — and a "check again" action. It also stops being invisible in the eSIM view,
which filters to `COMPLETED`: pending orders appear there with the same explanation instead of being
absent, because "my eSIMs" is exactly where someone who just paid will look.

All copy goes through `next-intl` under existing namespaces. No new component; this is additional
markup inside the branches that already render an order row.

### 4. The retry guard — fetch, don't buy

Both retry routes, and the webhook's own path, currently call `purchasePackage` and then
`getEsimProfileWithRetry`. The guard is one condition: **if `order.esimOrderId` is already set, skip the
purchase and go straight to fetching that order's profile.**

This is the pattern ticket 032 established for internal sales, applied to the Paddle path its own DIP
flagged as still exposed.

Widening the customer route: it accepts an order that is `FAILED` **or** `PROCESSING`, and when the
status is `PROCESSING` it may only take the fetch-only path — a `PROCESSING` order without an
`esimOrderId` is refused rather than purchased against, because that combination means fulfilment is
mid-flight and a second buyer is the last thing it needs. The ownership check at `:34-40`, the 3-per-hour
rate limit at `:21`, and the session requirement at `:25` are all unchanged and still apply.

The admin route keeps its existing statuses and gains the same guard.

### 5. Refunds and chargebacks land on the order

The webhook currently switches on `transaction.completed` and acknowledges the rest. It gains handling
for Paddle's refund/adjustment notification, which sets the order's status to `REFUNDED` by
`paddleTransactionId`.

Strict limits, because this is new event handling on a money path:

- It runs **after** the same signature verification and replay window as the existing event; no new
  entry point, no separate route.
- It may only **update** an order it can find. It never creates one, and it can never set `COMPLETED`.
- It is idempotent: setting `REFUNDED` on an already-`REFUNDED` order is a no-op.
- An unknown transaction id is acknowledged and logged, not treated as an error, so Paddle does not
  retry forever.
- The exact event name and payload shape must be confirmed against Paddle's current documentation
  during implementation rather than guessed; the DIP carries that as a step, and if it cannot be
  confirmed cleanly this change is deferred rather than approximated.

## What must not move

| Thing | Status |
|---|---|
| Underpayment guard (`:202-244`) | Untouched. Admin alerts only, no customer email — ticket 033's explicit decision |
| Webhook signature verification and replay window | Untouched |
| Server-side price resolution | Untouched |
| Turnstile, checkout rate limit, retry rate limits | Untouched |
| Fraud auto-block behaviour | Untouched |
| Authentication and session handling | Untouched |
| `sendPostPurchaseEmail` / `sendOrderDelayedEmail` internals | Untouched — only which branch calls them |
| Idempotency check at `:102-105` | Untouched |

## Files and blast radius

| File | Change | Risk |
|---|---|---|
| `src/lib/validation/schemas.ts` | one boolean on `travelerInfoSchema` | Low |
| `src/app/[locale]/checkout/CheckoutClient.tsx` | consent checkbox at the traveler step | Low |
| `src/app/api/checkout/create-transaction/route.ts` | reject without consent; flag into `custom_data` | **Medium** — money path, but additive rejection only |
| `src/app/api/webhooks/paddle/route.ts` | conditional `COMPLETED`; refund event | **High** — fulfilment |
| `src/app/api/account/orders/[id]/retry/route.ts` | purchase guard; accept guarded `PROCESSING`; conditional `COMPLETED` | **High** |
| `src/app/api/admin/orders/[id]/retry/route.ts` | purchase guard; conditional `COMPLETED` | **High** |
| `src/app/[locale]/account/AccountClient.tsx` | pending state explained and visible | Low |
| `src/messages/{he,en,ar}.json` | consent copy, pending copy, check-again label | Low |

No schema change. No migration. No new endpoint. No new dependency.

## Sequencing

**After 034.** Both tickets edit `CheckoutClient.tsx`, and 034 is a string-level change that should
land and be verified before a functional gate is added to the same screen. 034 also has a far lower risk
profile, so it should not wait behind this one.

## Rollback

All eight files are byte-copied in `agent-workspace/backups/2026-08-10-pre-launch-tickets/` from a clean
tree at `f8040bb`. Because there is no schema change and no new file, restoring them returns the system
exactly to today's behaviour — including, deliberately, back to the defects. The order data written while
the new code was live stays valid under the old code: the only status values used are ones the old code
already produces.
