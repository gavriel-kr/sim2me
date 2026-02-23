# DIP — Ticket 001: Customer Portal & Auto-Account Creation

## Implementation Plan

### Phase 1 — Auto-create account on purchase
- [ ] **1.1** `src/app/api/webhooks/paddle/route.ts` — upsert Customer after fulfillment, link order
- [ ] **1.2** `src/app/api/admin/orders/[id]/retry/route.ts` — same upsert logic in retry path
- [ ] **1.3** `src/lib/email.ts` — add `tempPassword?` param to post-purchase email, include login info in Hebrew template if new account

### Phase 2 — Real data in customer portal
- [ ] **2.1** `src/app/[locale]/account/esims/page.tsx` — fetch real orders for logged-in customer
- [ ] **2.2** `src/app/[locale]/account/esims/MyEsimsClient.tsx` — replace mock with real Order type, show QR/ICCID/codes

### Phase 3 — Admin: orders per customer
- [ ] **3.1** `src/app/admin/accounts/[id]/page.tsx` — fetch customer orders alongside account
- [ ] **3.2** `src/app/admin/accounts/[id]/AccountEditClient.tsx` — add orders section below edit form

## Files Modified
1. `src/app/api/webhooks/paddle/route.ts`
2. `src/app/api/admin/orders/[id]/retry/route.ts`
3. `src/lib/email.ts`
4. `src/app/[locale]/account/esims/page.tsx`
5. `src/app/[locale]/account/esims/MyEsimsClient.tsx`
6. `src/app/admin/accounts/[id]/page.tsx`
7. `src/app/admin/accounts/[id]/AccountEditClient.tsx`

## No new dependencies (bcrypt already installed)
## No schema changes (relations already exist)
