# DIP — Ticket 005: Security Hardening

## Status Legend: [ ] pending · [✅] done

---

## Phase 1 — Admin Route Authorization

- [ ] **1.1** `src/lib/session.ts`
  - Add `requireAdmin(session)` helper function
  - Returns `NextResponse` (401 or 403) or `null` if authorized
  - Export alongside existing session helpers

- [ ] **1.2** Apply `requireAdmin()` to 10 routes (replace "session only" checks):
  - [ ] `src/app/api/admin/orders/bulk-update/route.ts`
  - [ ] `src/app/api/admin/orders/[id]/retry/route.ts`
  - [ ] `src/app/api/admin/esimaccess/packages/route.ts`
  - [ ] `src/app/api/admin/esimaccess/orders/route.ts`
  - [ ] `src/app/api/admin/esimaccess/sync/route.ts`
  - [ ] `src/app/api/admin/articles/route.ts`
  - [ ] `src/app/api/admin/pages/route.ts`
  - [ ] `src/app/api/admin/packages/override/route.ts`
  - [ ] `src/app/api/admin/destinations/route.ts`
  - [ ] `src/app/api/admin/packages/apply-price-floor/route.ts`

---

## Phase 2 — Admin Purchase Notification Email

- [ ] **2.1** `src/lib/email.ts`
  - Add `AdminOrderNotificationData` interface
  - Add `sendAdminOrderNotificationEmail(data)` function
  - Recipient: `process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com'`
  - Clean English HTML email with order details table
  - Fire-and-forget (`.catch()` — never blocks order flow)

- [ ] **2.2** `src/app/api/webhooks/paddle/route.ts`
  - Call `sendAdminOrderNotificationEmail()` after `prisma.order.create()` succeeds
  - Pass all available order data: customer, package, amounts, orderId, link

---

## Phase 3 — Remove Debug Fetch Artifacts

- [ ] **3.1** `src/lib/esimaccess.ts`
  - Remove all `fetch('http://127.0.0.1:7242/...')` lines

- [ ] **3.2** `src/app/api/admin/packages/override/route.ts`
  - Remove all `fetch('http://127.0.0.1:7242/...')` lines

---

## Phase 4 — Rate Limiting

- [ ] **4.1** `prisma/schema.prisma`
  - Add `RateLimit` model with fields: `key String @id`, `count Int`, `windowStart DateTime`
  - Run `npx prisma db push`

- [ ] **4.2** `src/lib/rateLimit.ts` (new file)
  - `checkRateLimit(ip, endpoint, limit, windowSec): Promise<boolean>`
  - Logic: upsert by key, reset if window expired, increment, return false if over limit

- [ ] **4.3** Apply rate limiting to 4 routes:
  - [ ] `src/app/api/checkout/create-transaction/route.ts` — 10/60s
  - [ ] `src/app/api/account/register/route.ts` — 5/60s
  - [ ] `src/app/api/auth/token/route.ts` — 10/60s
  - [ ] `src/app/api/contact/route.ts` — 3/60s

---

## Files Modified Summary

1. `src/lib/session.ts`
2. `src/app/api/admin/orders/bulk-update/route.ts`
3. `src/app/api/admin/orders/[id]/retry/route.ts`
4. `src/app/api/admin/esimaccess/packages/route.ts`
5. `src/app/api/admin/esimaccess/orders/route.ts`
6. `src/app/api/admin/esimaccess/sync/route.ts`
7. `src/app/api/admin/articles/route.ts`
8. `src/app/api/admin/pages/route.ts`
9. `src/app/api/admin/packages/override/route.ts`
10. `src/app/api/admin/destinations/route.ts`
11. `src/app/api/admin/packages/apply-price-floor/route.ts`
12. `src/lib/email.ts`
13. `src/app/api/webhooks/paddle/route.ts`
14. `src/lib/esimaccess.ts`
15. `src/lib/rateLimit.ts` ← new
16. `prisma/schema.prisma`
17. `src/app/api/checkout/create-transaction/route.ts`
18. `src/app/api/account/register/route.ts`
19. `src/app/api/auth/token/route.ts`
20. `src/app/api/contact/route.ts`

## Rollback Plan
- Phase 1: Revert session check changes — restores previous behavior
- Phase 2: Remove notification call — customer email unaffected
- Phase 3: No rollback needed (removing dead code)
- Phase 4: Remove `RateLimit` model (additive schema — safe drop)
