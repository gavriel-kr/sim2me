# DIP — Ticket 011: TypeScript Strict Cleanup

## Phase 1 — tsconfig: Exclude seed scripts ✅
- [ ] Edit `tsconfig.json`: add `prisma/seed*.ts`, `prisma/scripts/*.ts` to `exclude`
- Eliminates 21 stale errors from one-time migration scripts

## Phase 2 — Fix `OrderForFilter` generic type ✅
- [ ] Edit `src/app/admin/orders/orderFilters.ts`:
  - Make `applyOrderFilters<T extends OrderForFilter>(orders: T[], ...): T[]`
- Eliminates ~14 errors in `AdminOrdersClient.tsx`

## Phase 3 — Fix Next.js 15 route handler `params` ✅
- [ ] `src/app/api/account/orders/[id]/retry/route.ts` — `params: Promise<{id: string}>`, await inside
- [ ] `src/app/api/admin/orders/[id]/retry/route.ts` — same
- [ ] `src/app/api/admin/seo/[id]/route.ts` — same
- Eliminates 8 `.next/types/` errors

## Phase 4 — Fix remaining `src/` type errors ✅
- [ ] `src/app/[locale]/destinations/[slug]/plan/[planId]/page.tsx` — Plan type cast
- [ ] `src/app/[locale]/success/SuccessClient.tsx` — status comparison fix
- [ ] `src/app/admin/accounts/[id]/page.tsx` — add param type annotation
- [ ] `src/app/admin/accounts/AccountsClient.tsx` — fix cast via `unknown`
- [ ] `src/app/admin/accounts/page.tsx` — annotate sort callback
- [ ] `src/app/admin/contact/contactExcel.ts` — fix row type mismatch
- [ ] `src/app/admin/contact/ContactSubmissionsClient.tsx` — fix `ContactForFilter` type
- [ ] `src/app/admin/contact/page.tsx` — annotate callbacks
- [ ] `src/app/admin/destinations/page.tsx` — annotate callback
- [ ] `src/app/admin/orders/page.tsx` — annotate callback
- [ ] `src/app/admin/page.tsx` — annotate callback
- [ ] `src/app/admin/pages/page.tsx` — annotate callback
- [ ] `src/app/admin/settings/page.tsx` — annotate callback
- [ ] `src/app/api/account/contact-submissions/route.ts` — annotate callback
- [ ] `src/app/api/account/orders/route.ts` — annotate callback
- [ ] `src/app/api/admin/esimaccess/orders/route.ts` — annotate callbacks
- [ ] `src/app/api/admin/esimaccess/sync/route.ts` — annotate callback
- [ ] `src/app/api/admin/fees/route.ts` — annotate callbacks
- [ ] `src/app/api/admin/orders/backfill-costs/route.ts` — annotate callback
- [ ] `src/app/api/admin/packages/apply-price-floor/route.ts` — annotate callbacks
- [ ] `src/app/api/admin/packages/bulk-rollback/route.ts` — annotate callback
- [ ] `src/app/api/admin/packages/bulk-update/route.ts` — annotate callbacks (38 errors, biggest file)
- [ ] `src/app/api/admin/pages/sync/route.ts` — annotate callback
- [ ] `src/app/api/admin/seo/global/route.ts` — annotate callback
- [ ] `src/app/api/admin/update-phase7-articles/route.ts` — annotate callback
- [ ] `src/app/api/admin/users/route.ts` — annotate callback
- [ ] `src/app/api/checkout/create-transaction/route.ts` — fix type
- [ ] `src/app/api/checkout/prepare/route.ts` — fix type
- [ ] `src/app/api/packages/route.ts` — annotate callbacks (16 errors)
- [ ] `src/lib/articles.ts` — annotate callbacks
- [ ] `src/lib/global-seo.ts` — annotate callback
- [ ] `src/lib/navigation.ts` — annotate callback
- [ ] `src/lib/site-branding.ts` — annotate callback
- [ ] `src/middleware.ts` — annotate callback

## Phase 5 — Remove `ignoreBuildErrors` and verify ✅
- [ ] Edit `next.config.mjs`: remove `typescript: { ignoreBuildErrors: true }`
- [ ] Run `npx tsc --noEmit` — confirm exit code 0 for `src/`
- [ ] Verify Vercel deploy succeeds
