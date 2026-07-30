# Ticket 021 — Detailed Implementation Plan (DIP)

## Phase 0 — Safety
- ✅ Create `backup/` folder and copy all to-be-modified files (13 files backed up)

## Phase 1 — Locale plumbing (R1 transport)
- ✅ `CheckoutClient.tsx`: add `locale` to create-transaction body
- ✅ `create-transaction/route.ts`: zod `locale` enum optional + add to `customData`
- ✅ `webhooks/paddle/route.ts`: read + sanitize `locale` from custom_data (default `'he'` via `toEmailLocale`)

## Phase 2 — Localized emails (R1 + R6)
- ✅ `email.ts`: `POST_PURCHASE_COPY` per-locale record (HE verbatim), `locale` param on `sendPostPurchaseEmail`
- ✅ `email.ts`: `RESET_COPY` localized password-reset + `locale` param (reset URL now locale-prefixed)
- ✅ Webhook passes locale to `sendPostPurchaseEmail`
- ✅ `forgot-password` page sends locale; API accepts + forwards

## Phase 3 — Guest account fix (R2)
- ✅ Webhook auto-create: `emailVerified: true`

## Phase 4 — Newsletter (R3)
- ✅ New `api/newsletter/route.ts` (zod + rate limit 5/min + Customer upsert)
- ✅ `NewsletterSection.tsx`: real submit, `isSubmitting` disable, i18n toasts, hardcoded EN strings replaced
- ✅ Message keys added to `en/he/ar.json` (5 keys each)

## Phase 5 — Merchandising fixes (R4 + R5)
- ✅ `types/index.ts`: `saleBadge?: string | null` on `Plan`
- ✅ `PlanCard.tsx`: badge pill (amber/orange, RTL-aware `end-2`, drops below Best-Seller strip when both present)
- ✅ `override/route.ts`: sortOrder only updated when explicitly provided

## Phase 6 — Verification
- ✅ `npx tsc --noEmit` clean (exit 0)
- ✅ Lint clean on all touched files
- ✅ `npx next build` passes (exit 0). Note: full `npm run build` runs `prisma db push` first, which fails locally on missing `DIRECT_URL` env — pre-existing environment limitation, unrelated to this ticket.
- [ ] Manual checks: newsletter POST works locally; badge renders; HE email unchanged for `locale='he'` (requires dev server)

## Status log
- 2026-07-29: All code phases complete. next build green. Browser smoke pending user's local run.

## Notes
- Admin retry / resend-email paths still send HE (they don't know the buyer locale — Order has no locale column; acceptable v1, noted for future: persist locale on Order).
