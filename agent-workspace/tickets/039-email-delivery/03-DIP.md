# Ticket 039 — Detailed implementation plan

Risk level: **R2** — payment webhook, auth mail, refund mail.
Deploy: approved by Gabriel in the conversation that opened this ticket.

## Phase 0 — Backup

- [ ] Copy every file about to be modified into `backup/`
- [ ] Write `backup/RESTORE.md` with full and partial rollback
- [ ] Record the clean baseline commit

## Phase 1 — Visibility in the funnel (`src/lib/email.ts`)

- [ ] Destructure `{ data, error }` from `resend.emails.send(...)`
- [ ] On `error`: `console.error('[Email] Resend rejected', ...)` and return `false`
- [ ] On success: one `console.log` with recipient, subject and Resend message id
- [ ] Leave the existing `try/catch`, the preview sink and the no-API-key branch untouched
- [ ] Add `sendCustomerEmailFailedAlert` addressed via `adminRecipient()`

## Phase 2 — The purchase path (`webhooks/paddle/route.ts`)

- [ ] Introduce a `pending: Promise<unknown>[]` collector
- [ ] Push the admin notification chain (still started early, before provisioning)
- [ ] Push the fraud alert and order-failed mail in the underpayment branch
- [ ] Capture the post-purchase mail's boolean; on `false`, raise the admin alert
- [ ] Same for the delayed-mail branch and the fulfilment-failure branch
- [ ] `await Promise.allSettled(pending)` immediately before every `return` that follows a send
- [ ] Verify no `return` path can skip the join

## Phase 3 — Auth and account mail

- [ ] `account/register` — await verification mail
- [ ] `account/resend-verification` — await
- [ ] `account/otp/resend` — await
- [ ] `account/otp/disable` — await
- [ ] Confirm no response body or status code changes anywhere in this phase

## Phase 4 — Support, retry, refund, internal

- [ ] `contact` — await admin notification and auto-reply
- [ ] `account/orders/[id]/retry` — await
- [ ] `admin/orders/[id]/retry` — await
- [ ] `admin/orders/[id]/refund` — await
- [ ] `admin/orders/[id]/cancel-esim` — await
- [ ] `admin/orders/internal` — await
- [ ] `cron/check-abandoned` — await

## Phase 5 — Verification

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean (pre-existing warnings only)
- [ ] `npm run test:locale-path` passes
- [ ] `npx next build` exit code 0
- [ ] Forced-failure test: a deliberately invalid recipient must produce `[Email] Resend rejected` and `false`
- [ ] Real send test: one live mail, confirmed `delivered` in Resend's history, with our own log line carrying the same id
- [ ] Contact form submitted locally in Hindi; both mails land before the response returns

## Phase 6 — Deploy (per `DEPLOY-PROTOCOL.md`)

- [ ] Gate A green
- [ ] Backup tag `pre-deploy-YYYYMMDD-HHMM`
- [ ] Commit code + ticket docs only
- [ ] `git push origin main`
- [ ] Post-deploy: `/en` `/he` `/ar` `/hi` load, `/api/checkout/health` `ok: true`
- [ ] Post-deploy: contact form from production, auto-reply timed
- [ ] Report to Gabriel with timings so he can verify a live purchase

## Phase 7 — Close

- [ ] `CHANGELOG.md`
- [ ] Mark the delayed-mail incident resolved with before/after timings
