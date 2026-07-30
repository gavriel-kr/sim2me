# Ticket 021 — Architectural Design (ADD)

Principle: smallest possible footprint, no schema changes, no new dependencies, all changes in-place on existing files plus one new API route.

## R1 — Localized post-purchase email

**Locale propagation (checkout → Paddle → webhook → email):**

1. `CheckoutClient.tsx` already has `locale` from `useLocale()` → add `locale` to the JSON body of `POST /api/checkout/create-transaction`.
2. `create-transaction/route.ts`: extend zod `bodySchema` with `locale: z.enum(['en','he','ar']).optional()`, add to `customData` (both dynamic and catalog modes — customData is shared).
3. `webhooks/paddle/route.ts`: read `customData.locale`, sanitize to `'he' | 'en' | 'ar'`, default `'he'` (preserves current behavior for in-flight/legacy transactions), pass to `sendPostPurchaseEmail`.

**Email template (`src/lib/email.ts`):**

- `sendPostPurchaseEmail(to, data, locale: 'he' | 'en' | 'ar' = 'he')`.
- Extract the translatable strings into a small `POST_PURCHASE_COPY` record (subject, greeting, intro, labels, install instructions, tips, signature) keyed by locale; keep single HTML skeleton with `dir`/`lang` attributes driven by locale.
- Hebrew strings copied verbatim from the current template (zero regression for HE).

## R2 — Guest account verified

`webhooks/paddle/route.ts`, auto-create block: add `emailVerified: true` to `prisma.customer.create` data. Registration flow untouched (still requires verification — that's a user-initiated signup; the purchase email already proves inbox ownership).

## R3 — Newsletter persistence

**New route** `src/app/api/newsletter/route.ts` (only new file):

- `POST { email }`, zod email validation, `checkRateLimit(ip, 'newsletter', 5, 60)`.
- `prisma.customer.upsert`: existing → `newsletter: true`; new → `{ email, newsletter: true, name: '' }` (password stays null — schema allows; such users can use forgot-password later).
- Returns `{ success: true }`; never leaks whether the email already existed.

**`NewsletterSection.tsx`:** `onSubmit` calls the API, success/error toasts from i18n. Replace the two hardcoded EN strings with message keys.

**Messages:** add to `home` namespace in `en/he/ar.json`: `newsletterSubtitle`, `newsletterNoSpam`, `newsletterSuccess`, `newsletterSuccessDesc`, `newsletterError`.

## R4 — saleBadge on PlanCard

- `src/types/index.ts`: `Plan.saleBadge?: string | null` (data already flows; typing catches up).
- `PlanCard.tsx`: small amber/red badge at card top (absolute, start side) when `plan.saleBadge` is set. When both `popular` and `saleBadge` exist, both render (popular strip is full-width top, badge is corner pill).
- `plan/[planId]/page.tsx` passes plans built from the same payload — verify the detail page mapping also carries `saleBadge` (display there optional, out of scope).

## R5 — sortOrder guard

`api/admin/packages/override/route.ts` update branch: `sortOrder: sortOrder ?? 0` → `...(sortOrder !== undefined && { sortOrder })`. Create branch unchanged (default 0 is correct for new overrides).

## R6 — Localized password reset

- `forgot-password` page → pass `locale` in the POST body (page already lives under `[locale]`).
- `api/account/forgot-password/route.ts` → accept optional locale, pass to `sendPasswordResetEmail(to, token, locale)`.
- `email.ts`: same copy-record pattern as R1 (subject + 4 strings × 3 locales).

## Files touched

| File | Change |
|---|---|
| `src/lib/email.ts` | R1, R6 — localized templates |
| `src/app/[locale]/checkout/CheckoutClient.tsx` | R1 — send locale |
| `src/app/api/checkout/create-transaction/route.ts` | R1 — schema + customData |
| `src/app/api/webhooks/paddle/route.ts` | R1 locale passthrough, R2 emailVerified |
| `src/app/api/newsletter/route.ts` | **new** — R3 |
| `src/components/sections/NewsletterSection.tsx` | R3 — real submit + i18n |
| `src/messages/{en,he,ar}.json` | R3 keys |
| `src/types/index.ts` | R4 — Plan.saleBadge |
| `src/components/sections/PlanCard.tsx` | R4 — render badge |
| `src/app/api/admin/packages/override/route.ts` | R5 — guard |
| `src/app/[locale]/account/forgot-password/*` | R6 — pass locale |
| `src/app/api/account/forgot-password/route.ts` | R6 — accept locale |

## Backups
Before editing, copy originals of every touched file to `agent-workspace/tickets/021-critical-revenue-fixes/backup/` (flat, path-encoded names).

## Rollback
All changes are additive/guarded; restoring any backup file fully reverts its change. No migrations.
