# Ticket 022 — Detailed Implementation Plan (DIP)

## Phase 0 — Safety
- ✅ Backup all to-be-modified files (5 files in `backup/`)

## Phase 1 — Helper
- ✅ Create `src/lib/analytics.ts` (gtag-safe wrappers + `planToGaItem` + sessionStorage purchase dedupe)

## Phase 2 — Wire events
- ✅ `DestinationDetailClient.tsx` → `view_item_list` (`destination:{slug}`, once per slug)
- ✅ `PlanDetailClient.tsx` → `view_item` + `add_to_cart`
- ✅ `PlanCard.tsx` → `add_to_cart`
- ✅ `CheckoutClient.tsx` → `begin_checkout` (cart→traveler, both buttons) + `add_payment_info` (Pay now)
- ✅ `SuccessClient.tsx` → `purchase` on COMPLETED (deduped per transaction)
- ✅ `api/orders/by-transaction` → added `packageCode`, `totalAmount`, `currency` to response (needed for purchase value)

## Phase 3 — Verification
- ✅ tsc clean, lint clean on all touched files
- ✅ `npx next build` passes (exit 0; full `npm run build` blocked locally by missing `DIRECT_URL` env for `prisma db push` — pre-existing environment limitation, unrelated)
- [ ] Local smoke with consent granted: events in `window.dataLayer` (requires running dev server + browser)

## Status log
- 2026-07-29: All code complete. Build green. Browser smoke pending user's local run.

## GTM/GA4 note (no repo change)
GA4 standard ecommerce events are sent via gtag directly — they appear in GA4 without extra GTM config. If GTM tags are also used for ads, map the same events in the GTM container.
