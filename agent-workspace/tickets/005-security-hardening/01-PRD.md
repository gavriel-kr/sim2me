# PRD — Ticket 005: Security Hardening

## Background

On 04/04/2026, a price manipulation exploit was discovered: customers submitted manipulated `unitPrice` values via the checkout API, paying $0.71 for eSIM packages costing $12.80 from the supplier. The root cause (client-trusted price) was patched immediately in ticket 005 hotfix. This ticket addresses the remaining systemic security gaps discovered during the subsequent audit.

## Goals

1. **Admin route authorization** — Ensure only admin users can call `/api/admin/*` endpoints
2. **Admin purchase notification** — Notify `info.sim2me@gmail.com` on every completed order
3. **Remove debug artifacts** — Remove `127.0.0.1:7242` debug fetch calls from production code
4. **Rate limiting** — Prevent brute-force and spam on public endpoints

## Out of Scope

- Order cancellation flow with eSIMaccess
- Order transfer between accounts
- Monitoring dashboards / external alerting tools

---

## Phase 1 — Admin Route Authorization

### Problem
Several `/api/admin/*` routes check only "is there a session?" without verifying `session.user.type === 'admin'`. A registered customer with a valid session token can call:
- `POST /api/admin/orders/bulk-update` — change order statuses
- `POST /api/admin/orders/[id]/retry` — trigger eSIM re-purchase
- `GET/POST /api/admin/esimaccess/*` — view supplier data, trigger sync
- `POST /api/admin/packages/override` — change package prices
- `POST /api/admin/packages/apply-price-floor` — change floor prices
- `GET/POST /api/admin/articles/*`, `/api/admin/pages/*`, `/api/admin/destinations/*`

### Solution
Add consistent `isAdminSession` guard to all unprotected admin routes, matching the pattern already used in `src/app/api/admin/accounts/route.ts`.

---

## Phase 2 — Admin Purchase Notification Email

### Problem
Admin has no visibility into purchases as they happen. The exploit went undetected for hours.

### Solution
After every successful order (in the Paddle webhook), send a notification email to `info.sim2me@gmail.com` containing:
- Customer name + email
- Package name, destination, data/validity
- Amount charged (retail) and supplier cost
- Order ID with direct link to admin orders page
- Timestamp

Use existing Resend email infrastructure. No new dependencies.

---

## Phase 3 — Remove Debug Fetch Artifacts

### Problem
Debug `fetch('http://127.0.0.1:7242/ingest/...')` calls exist in production code in two files. They fail silently on Vercel but are dead code and carry debug session payloads.

### Files
- `src/lib/esimaccess.ts`
- `src/app/api/admin/packages/override/route.ts`

### Solution
Remove these lines entirely.

---

## Phase 4 — Rate Limiting

### Problem
No rate limiting on public endpoints:
- `POST /api/checkout/create-transaction` — can be spammed to probe packages
- `POST /api/account/register` — brute-force account creation
- `POST /api/auth/token` — brute-force login
- `POST /api/contact` — spam

### Solution
Implement lightweight in-memory rate limiting using Next.js middleware (no new npm dependencies). Use a simple sliding window counter keyed by IP address.

Limits:
- Checkout: 10 requests / 60 seconds per IP
- Register: 5 requests / 60 seconds per IP
- Auth token: 10 requests / 60 seconds per IP
- Contact: 3 requests / 60 seconds per IP
