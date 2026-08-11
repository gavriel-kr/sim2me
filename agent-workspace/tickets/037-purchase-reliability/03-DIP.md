# Ticket 037 — Detailed Implementation Plan (DIP)

Status icons: ⬜ open · ✅ done · ⛔ blocked · 👤 needs Gabriel, on his machine

Local only. No commit, no deploy, at any point in this plan.

## Gate — before any code

This ticket changes fulfilment. The gate is not a formality.

- ✅ **Gabriel approved modifying the money path** on 2026-08-10 — the Paddle webhook, the
  create-transaction route and both retry endpoints — **conditional on 034 being finished and verified
  first.** That condition is a hard gate, not a preference
- ✅ 034 code complete; on 2026-08-10 Gabriel authorised carrying on through all three tickets, with his
  own browser verification of 034 to follow on his machine. Recorded here rather than assumed
- 👤 Gabriel approves the consent wording, and confirms `/terms` and `/refund` say what the checkbox
  claims they say — **the exact wording now on screen is quoted at the bottom of this file**
- ✅ Underpayment path stays silent to the customer — ticket 033's call, unchanged in the diff
- ✅ Delta against shipped work established: 033 shipped the delayed email and the receipt, 032 shipped
  the `PROCESSING`-not-`FAILED` pattern and logged the Paddle retry exposure as a follow-up, 015 shipped
  manual refunds
- ✅ Source snapshot taken — `agent-workspace/backups/2026-08-10-pre-launch-tickets/`
- ✅ A local test path exists for the server-side gate; the supplier and card paths cannot be driven
  locally, so those proofs move to Gabriel's run

## Phase 0 — Safety

- ✅ Eleven files copied into `backup/` before the first edit
- ⛔ Baseline from a real successful and a real failed order — **not possible locally**: no live Paddle
  webhook and no supplier credentials on this machine. Replaced by static proof: the underpayment branch
  and the signature/replay checks are byte-identical in the diff
- ⛔ `proofs/db-before.json` — the local database has no Paddle order rows to snapshot

## Phase 1 — Consent at checkout

- ✅ `schemas.ts` — `consent` boolean on `travelerInfoSchema`, refined to reject `false`
- ✅ Only consumer is `CheckoutClient`; `npx tsc --noEmit` → 0
- ✅ `CheckoutClient.tsx` — checkbox at the traveler step, links to `/terms` and `/refund`, immediate-
  delivery acknowledgement, through the existing resolver
- ✅ `checkout.consentLabel` ×3 languages
- ✅ Also fixed while in the file: the three existing zod messages rendered the English word "Required"
  in Hebrew and Arabic. Messages are now codes, translated at render — `errRequired`, `errEmail`,
  `errConsent` ×3
- ✅ `create-transaction/route.ts` — 400 when the flag is not `true`, before any Paddle call
- ✅ Same route — `termsAccepted` and `termsAcceptedAt` carried into `custom_data`
- ✅ **Server gate proved**: POST without the flag → `400 {"error":"Terms must be accepted before
  payment."}`, no Paddle call reached
- ✅ Same POST with the flag → falls through to the existing plan resolution (`400 Plan not available`),
  proving the rest of the route is untouched
- ✅ Rejection message reveals nothing about internals
- ✅ Turnstile, the rate limit and server-side price resolution untouched in the diff

## Phase 2 — `COMPLETED` means there is an eSIM

- ✅ `webhooks/paddle/route.ts` — status conditional on `firstProfile`; absent → stays `PROCESSING`
- ✅ The `else` branch still sends the delayed email
- ✅ The customer upsert still runs for a pending order
- ✅ Same fix in `account/orders/[id]/retry/route.ts`
- ✅ Same fix in the admin retry route
- ✅ Underpayment branch untouched; its `return` still precedes everything in this phase

## Phase 3 — A pending order is visible and explained

- ✅ `AccountClient.tsx` — explanation on a `PROCESSING` order row
- ✅ Same order now appears in the eSIM view instead of being filtered out
- ✅ "Check again" wired to the guarded retry, **not** to a fresh purchase
- ✅ `account.pending*` and `account.retry*` keys ×3 languages
- ✅ Fixed while in the file: the client marked an order `COMPLETED` on any 2xx. It now respects the new
  `202 { pending: true }`, so the screen cannot claim success the server did not report
- 👤 Verify in all three languages, and that a `COMPLETED` order's rendering is unchanged

## Phase 4 — The retry guard

- ✅ Customer route — `esimOrderId` set → skip `purchasePackage`, fetch that order's profile
- ✅ Customer route — accepts `FAILED` or `PROCESSING`; `PROCESSING` without `esimOrderId` is refused
  with 409, not purchased against
- ✅ Ownership filter, session check and 3-per-hour rate limit unchanged
- ✅ Admin route — same guard, existing statuses kept, `COMPLETED` still refused up front
- ✅ Proved by reading the diff: `purchasePackage` is now inside `if (!orderNo)` in both routes, and a
  log line records the fetch-only path
- 👤 Live proof against the supplier — an order with an `esimOrderId` and no profile, retried, showing no
  second purchase in the supplier log. Needs supplier credentials
- ✅ A `COMPLETED` order cannot be retried: customer route filters on `FAILED`/`PROCESSING`, admin route
  returns 400
- ✅ A customer cannot retry someone else's order: the `OR` ownership filter is unchanged

## Phase 5 — Refunds and chargebacks

- ✅ Event names and payload confirmed against Paddle's current webhook reference: `adjustment.created`
  and `adjustment.updated`, with `data.action`, `data.status` and `data.transaction_id`. Refunds on live
  accounts arrive as `pending_approval` and only become `approved` on `adjustment.updated`
- ✅ Handled inside the existing verified webhook, after the signature check, no new route
- ✅ Acts only on an approved `refund` or on `chargeback` / `chargeback_warning`; `pending_approval`,
  `rejected` and `credit` are logged and ignored
- ✅ Updates by `paddleTransactionId` only; never creates; never sets `COMPLETED`
- ✅ Idempotent — already-`REFUNDED` returns early; unknown transaction id is logged and acknowledged
- 👤 Replay test with a real signed payload. Needs the Paddle webhook secret

## Phase 6 — Verification

- ✅ `npx tsc --noEmit` → 0
- ✅ `ReadLints` clean on every touched file
- ✅ `npm run lint` → no new errors
- ✅ `npx next build` → success
- 👤 **Real paid end-to-end test** with a real card
- 👤 **Deliberate fulfilment failure** — delayed email, admin alert, order not `COMPLETED`, visible and
  explained in the account area
- 👤 **Deliberate pending** — order left `PROCESSING`, "check again" resolves it, no second supplier
  purchase in the log
- 👤 Duplicate webhook delivery still results in exactly one order
- ✅ `git status` shows only the intended files
- ✅ `CHANGELOG.md` updated under `[Unreleased]`

## Consent wording now on screen — for approval

Hebrew: קראתי ואני מאשר/ת את **תנאי השימוש** ואת **מדיניות ההחזרים**, ומאשר/ת שה-eSIM נמסר באופן מיידי
ולכן זכות הביטול אינה חלה לאחר ההתקנה או ההפעלה.

English: I have read and accept the **Terms of Service** and the **Refund Policy**, and I agree that the
eSIM is delivered immediately, so the right of withdrawal no longer applies once it is installed or
activated.

Arabic: قرأتُ وأوافق على **شروط الاستخدام** و**سياسة الاسترداد**، وأقرّ بأن شريحة eSIM تُسلَّم فورًا،
وبالتالي لا ينطبق حق الإلغاء بعد تثبيتها أو تفعيلها.

Both bold phrases are links opening `/terms` and `/refund` in a new tab.

## Explicitly not in this ticket

Automatic refunds · a `PROCESSING` sweeper cron · any change to pricing, fraud blocking or auth ·
abandoned-cart mail · `Order.termsAcceptedAt` as a column.

## Follow-ups found while implementing — not fixed here

- `AccountClient.tsx` still contains hardcoded English outside the parts this ticket touched, and its
  "Contact Support" link points at `support@sim2me.net` while the brand config uses `info@sim2me.net`.
  Logged for ticket 026
- The admin manual refund (ticket 015) marks an order `REFUNDED` as soon as Paddle accepts the request,
  before Paddle approves it. If Paddle later rejects the refund, the order stays `REFUNDED`. The new
  handler logs a rejected adjustment but deliberately does not change status. Its own small ticket

## Status log

- 2026-08-10: Opened after the pre-launch review, with the delta against tickets 032, 033 and 015
  established.
- 2026-08-10, later: Gabriel approved the money-path change, explicitly conditional on 034 landing and
  being verified first. The ticket is therefore approved but not yet startable.
- 2026-08-10, later still: Gabriel authorised working through all three tickets to the end. Implemented.
  Everything that can be proved on this machine is proved; everything needing a real card, the supplier
  or the Paddle secret is marked 👤 and waits for his run.
- 2026-08-11: Re-verified after 036 edited the shared message files. `tsc` and `next build` clean, the
  adjustment handler and both retry guards still in place, `/he/checkout`, `/en/checkout` and
  `/ar/checkout` all 200, and the consent keys resolve in all three languages. The 👤 items are
  unchanged: they need a real card, the supplier log or the Paddle webhook secret.
