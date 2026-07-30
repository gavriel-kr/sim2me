# Ticket 021 — Critical Revenue Fixes (PRD)

## Background

A full-site audit (July 2026) found several "silent revenue leaks": features the admin configures that never reach the customer, emails sent in the wrong language, and broken account/newsletter flows. These are bugs/gaps in existing functionality — not new features — and must be fixed before any marketing push.

Related open tickets: 019 (articles coverage — only live spot-check remains), 020 (remove app promo — pending). This ticket does not overlap with either.

## Problems (verified in code)

### P1 — Post-purchase (eSIM delivery) email is Hebrew-only
`sendPostPurchaseEmail` in `src/lib/email.ts` is hardcoded `dir=rtl lang=he`. Every customer — including EN and AR buyers — receives their QR code, activation details and temp password in Hebrew. This is the single most important email in the business (it *is* the product).
Root cause chain: checkout (`CheckoutClient.tsx`) never sends the locale → `create-transaction` doesn't put it in Paddle `custom_data` → the webhook can't know the buyer's language.

### P2 — Guest auto-account is created locked-out
`src/app/api/webhooks/paddle/route.ts` creates a `Customer` with a temp password but without `emailVerified: true`. `src/lib/auth.ts` (line ~93) throws `EMAIL_NOT_VERIFIED` for unverified customers. Result: the temp password we email after purchase **cannot be used to log in**, killing the repeat-purchase channel.

### P3 — Homepage newsletter form is fake
`NewsletterSection.tsx` `onSubmit` shows a success toast and saves nothing. Every lead is discarded. `Customer.newsletter` field already exists in the schema.

### P4 — `saleBadge` never shown to customers
Admin sets `saleBadge` per package; it flows through `/api/packages` and the destination page mapping, but `PlanCard.tsx` never renders it and the `Plan` type doesn't declare it. Admin promo effort is invisible.

### P5 — Admin single-save resets `sortOrder`
`POST /api/admin/packages/override` update branch does `sortOrder: sortOrder ?? 0`, and the single-edit form doesn't send `sortOrder`. Any curated ordering is silently wiped on the next single edit.

### P6 — Password reset email is English-only
`sendPasswordResetEmail` has no locale variants; the forgot-password page is under `[locale]` and knows the language but doesn't pass it.

## Requirements

| # | Requirement | Success criteria |
|---|---|---|
| R1 | Post-purchase email localized (he/en/ar), language = checkout locale | Buyer on `/en/...` gets English delivery email; `/ar/...` gets Arabic; `/he/...` unchanged Hebrew. Fallback: `he` (current behavior) when locale missing (old/queued transactions) |
| R2 | Guest auto-created accounts can log in with the temp password | Webhook sets `emailVerified: true` on auto-create only (registration flow unchanged) |
| R3 | Newsletter form persists subscriber | `POST /api/newsletter` upserts `Customer.newsletter = true` (creates password-less customer if new), rate-limited; UI shows real success/failure, localized |
| R4 | `saleBadge` rendered on plan cards | Badge visible on `PlanCard` when set; `Plan` type extended with optional `saleBadge` |
| R5 | Single-save no longer resets `sortOrder` | Update branch only touches `sortOrder` when provided |
| R6 | Password reset email localized | he/en/ar based on locale passed from the forgot-password page |

## Out of scope
- Customer abandoned-cart emails (future ticket)
- Welcome / review / re-engagement emails
- Top-up flow
- CRM/ESP integration
- Any pricing or checkout-flow change

## Risk
- R1/R6 touch the transactional email path — the templates change but the send mechanism (`sendEmail` via Resend) is untouched. Hebrew content stays byte-identical as the fallback.
- R2 is a one-word data change on a non-critical path (wrapped in try/catch already).
- R3 adds a new public endpoint — rate-limited (reuse `checkRateLimit`) and email-validated.
- No schema changes. No new dependencies.
