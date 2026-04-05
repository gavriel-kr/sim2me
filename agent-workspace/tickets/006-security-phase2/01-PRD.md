# PRD — Security Phase 2: Remaining Critical / High / Medium Vulnerabilities

## Context
Ticket 005 (Security Hardening Phase 1) implemented:
- `requireAdmin()` helper and applied it to ~10 admin routes.
- Admin purchase notification email on every order.
- Removal of debug artifacts.
- DB-backed rate limiting on 4 public endpoints.
- Webhook fraud detection: block eSIM fulfillment when `totalAmount < supplierCostUsd`.

A subsequent full audit revealed additional unresolved vulnerabilities across three severity levels.

---

## Problem Statement
The application still has 17 admin API routes that only check `if (!session)` without verifying
`user.type === 'admin'`. Any logged-in regular customer can call these routes.  
Additionally, several data-leakage and injection issues remain.

---

## Goals
Resolve all **Critical**, **High**, and **Medium** vulnerabilities identified in the Phase 1 audit,
without changing any user-facing behavior or breaking existing features.

---

## Scope of Changes

### CRITICAL

**C1 — 17 admin routes missing `requireAdmin`**  
Replace `if (!session)` with `requireAdmin(session)` on every remaining admin route:
- `api/admin/settings/route.ts`
- `api/admin/settings/upload/route.ts`
- `api/admin/articles/[id]/route.ts`
- `api/admin/seo/route.ts`
- `api/admin/seo/global/route.ts`
- `api/admin/seo/[id]/route.ts`
- `api/admin/articles/bulk-fill-keywords/route.ts`
- `api/admin/articles/default-image/route.ts`
- `api/admin/update-phase7-articles/route.ts`
- `api/admin/packages/cache-status/route.ts`
- `api/admin/orders/backfill-costs/route.ts`
- `api/admin/contact/[id]/route.ts`
- `api/admin/contact/[id]/notes/route.ts`
- `api/admin/contact/[id]/read/route.ts`
- `api/admin/contact/bulk-update/route.ts`
- `api/admin/pages/sync/route.ts`
- `api/admin/users/route.ts`

---

### HIGH

**H1 — eSIM credential leak via `by-transaction` endpoint**  
`GET /api/orders/by-transaction/[transactionId]` returns QR code URL, `smdpAddress`, and
`activationCode` to any unauthenticated caller who knows a `txn_` ID.  
**Fix:** Remove `qrCodeUrl`, `smdpAddress`, `activationCode` from the unauthenticated response.
Return only status/order metadata needed for the success page to poll. A separate authenticated
endpoint can serve credentials when the user is signed in.

**H2 — Guest account takeover via register endpoint**  
If a customer checked out as a guest (email exists in DB, no password), any attacker who knows
that email can POST `/api/account/register` and set a password, gaining full access to the
victim's orders.  
**Fix:** Block registration for any existing email **regardless of whether it has a password**
and return `409`. Customers should use a "set password" / "forgot password" flow instead.

**H3 — `wholesalePrice` exposed in public packages API**  
`GET /api/packages` returns `wholesalePrice` (supplier cost) in every package object, visible to
any visitor. This leaks internal margin data.  
**Fix:** Remove `wholesalePrice` from the public response.

---

### MEDIUM

**M1 — HTML injection in contact form email**  
`POST /api/contact` inserts raw `${name}`, `${email}`, `${subject}`, `${message}` directly into an
HTML email template without escaping. A malicious user can inject HTML/CSS to manipulate the
email layout or phish the admin.  
**Fix:** Add a minimal `escapeHtml()` utility and apply it to all interpolated user fields in the
email HTML.

**M2 — Rate limiter silently fails open on DB error**  
`checkRateLimit()` catches all DB errors and returns `true` (allow) with no log. If the DB is
unavailable, rate limiting is completely bypassed with no visibility.  
**Fix:** Add `console.error('[RateLimit] DB error:', e)` inside the catch block. Behaviour
(fail-open) stays the same — this is a deliberate choice — but errors become observable in
Vercel logs.

---

## Non-Goals
- No UI changes.
- No schema changes (no migrations).
- No new dependencies.
- The `by-transaction` endpoint remains unauthenticated for status polling; only credential
  fields are removed.
- No change to cron, payments, or fulfillment logic.

---

## Success Criteria
- Any regular logged-in customer calling an admin API receives 403 Forbidden.
- An attacker with a `txn_` ID cannot retrieve QR / activation code without auth.
- Registering with a guest-ordered email returns 409.
- Public packages response contains no `wholesalePrice` field.
- Contact form email renders correctly with injected HTML characters escaped.
- Rate limit DB errors appear in Vercel function logs.
