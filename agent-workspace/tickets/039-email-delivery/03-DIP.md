# Ticket 039 — Detailed implementation plan

Risk level: **R2** — payment webhook, auth mail, refund mail.
Deploy: approved by Gabriel in the conversation that opened this ticket.

## Phase 0 — Backup

- ✅ Copy every file about to be modified into `backup/`
- ✅ Write `backup/RESTORE.md` with full and partial rollback
- ✅ Record the clean baseline commit (`41dc110`)

## Phase 1 — Visibility in the funnel (`src/lib/email.ts`)

- ✅ Destructure `{ data, error }` from `resend.emails.send(...)`
- ✅ On `error`: `console.error('[Email] Resend rejected', ...)` and return `false`
- ✅ On success: one `console.log` with recipient, subject and Resend message id
- ✅ Leave the existing `try/catch`, the preview sink and the no-API-key branch untouched
- ✅ Add `sendCustomerEmailFailedAlert` addressed via `adminRecipient()`
- ✅ Nine admin helpers swallowed `sendEmail` internally behind a `Promise<void>` signature, so
  awaiting them at the call site would not have awaited the send. They now return the promise:
  `sendAdminOrderNotificationEmail`, `sendFraudAlertEmail`, `sendOrderFailedEmail`,
  `sendRetrySucceededEmail`, `sendRetryFailedEmail`, `sendEsimCancelledEmail`,
  `sendRefundIssuedEmail`, `sendAbandonedCheckoutEmail`, `sendContactAdminNotificationEmail`

## Phase 2 — The purchase path (`webhooks/paddle/route.ts`)

- ✅ Introduce a `pending: Promise<unknown>[]` collector
- ✅ Push the admin notification chain (still started early, before provisioning)
- ✅ Push the fraud alert and order-failed mail in the underpayment branch
- ✅ Capture the post-purchase mail's boolean; on `false`, raise the admin alert
- ✅ Same for the delayed-mail branch and the fulfilment-failure branch
- ✅ `await Promise.allSettled(pending)` immediately before every `return` that follows a send
- ✅ Verify no `return` path can skip the join — two returns follow a send, both covered

## Phase 3 — Auth and account mail

- ✅ `account/register` — await verification mail
- ✅ `account/resend-verification` — await
- ✅ `account/otp/resend` — await
- ✅ `account/otp/disable` — await
- ✅ No response body or status code changed in this phase. The OTP routes deliberately keep
  reporting success on a refused send: telling an unauthenticated caller that mail to an address
  failed would confirm the account exists.

## Phase 4 — Support, retry, refund, internal

- ✅ `contact` — both mails started in parallel, joined before the response
- ✅ `account/orders/[id]/retry` — await, and alert the admin if the customer mail is refused
- ✅ `admin/orders/[id]/retry` — await; response now carries `customerEmailSent`
- ✅ `admin/orders/[id]/refund` — await
- ✅ `admin/orders/[id]/cancel-esim` — await
- ✅ `admin/orders/internal` — await; response now carries `customerEmailSent`
- ✅ `cron/check-abandoned` — await

## Phase 5 — Verification

- ✅ `npx tsc --noEmit` clean
- ✅ `npm run lint` clean (two pre-existing warnings only)
- ✅ `npm run test:locale-path` passes
- ✅ `npx next build` exit code 0
- ✅ Forced-failure test: invalid recipient produced `[Email] Resend rejected` with
  `validation_error` and returned `false`
- ✅ Real send test: accepted in 3.3s, `[Email] sent` carried the message id, Resend recorded
  `delivered` at 05:09:22
- 👤 Contact form could not be submitted from a script: Turnstile blocks it. Left for Gabriel.

## Phase 6 — Deploy (per `DEPLOY-PROTOCOL.md`)

- ✅ Gate A green
- ✅ Backup tag `pre-deploy-20260814-0112` on `41dc110`, pushed
- ✅ Commit code + ticket docs only — 17 files, no secrets
- ✅ `git push origin main` → `3a356a2`
- ✅ Post-deploy: `/en` `/he` `/ar` `/hi` `/hi/checkout` `/he/contact` all 200;
  `checkout/health` `ok: true` on all five steps
- 👤 Post-deploy contact form and auto-reply timing — Turnstile, so Gabriel
- ✅ Report to Gabriel with timings

## Phase 7 — Close

- ✅ `CHANGELOG.md`
- ✅ Incident recorded with before/after timings

## Outcome

Deployed as `3a356a2`. Rollback point: `pre-deploy-20260814-0112`.

Two orders were caught by the defect before it was fixed, both from Gabriel's own testing:

| Order | Locale | Paid | Mail sent | Gap |
|---|---|---|---|---|
| Azerbaijan 500MB 7Days | `hi` | 04:41:14 | 04:49:58 | 8m 43s late |
| Armenia 1GB/Day | `en` | 04:53:35 | never | lost outright |

The English one is the proof that this was never a Hindi defect.

The Armenia mail was delivered by hand at 05:17:52 with
`agent-workspace/scripts/resend-order-email.ts`, written for the purpose and kept for the next
time an order needs its delivery mail replayed.

## Left for Gabriel

- 👤 One live purchase, timed. The mail should now arrive within seconds of the order appearing.
- 👤 Contact form from production, auto-reply timed.
- 👤 Registration and an OTP code from production.

## Follow-up worth its own ticket

- `createAuditLog` still floats in roughly fifteen admin routes. Same class of loss, admin-only
  impact, which is why it stayed out of a fix that had to ship tonight.
- The webhook waits 30–70 seconds inline for an eSIM profile, very likely longer than Paddle's
  own timeout, so Paddle is probably already retrying deliveries that succeeded. Harmless today
  because of the duplicate guard, but it means fulfilment latency is bounded by a supplier's mood.
  A queue is the real answer.
