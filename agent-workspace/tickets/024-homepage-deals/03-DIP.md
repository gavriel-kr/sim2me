# Ticket 024 — Detailed Implementation Plan (DIP)

## Gate
- ✅ User approved scope incl. checkout price change and homepage sections (2026-07-29, "יאללה לך על זה")
- ✅ Tickets 021–023 complete (023 pending user visual approval only)

## Phase 0 — Safety
- ✅ Backup: `schema.prisma`, `create-transaction/route.ts`, `page.tsx` (homepage), `DestinationDetailClient.tsx`, `AdminSidebar.tsx`, `en/he/ar.json` → `backup/`

## Phase 1 — Data
- ✅ `HotDeal` model added (additive); `prisma migrate diff` verified only CREATE TABLE + 2 indexes
- ✅ Applied via `prisma db push` + `prisma generate`; SQL documented in `prisma/migrations/20260729000000_add_hot_deals/`

## Phase 2 — Engine
- ✅ `src/lib/hot-deals.ts`: config (SiteSetting `hot_deals_config`), mulberry32 date-seeded RNG, pool = featured destinations (fallback list), profit gate via `computeProfit` (simCost override ?? wholesale + Paddle fees + additional fees), `ensureTodayDeals`, `regenerateTodayDeals`, `getActiveDealPrice` (today + yesterday grace)
- ✅ `GET /api/hot-deals` public route (joins package display data from DB cache)
- ✅ Engine test vs live data: 3 deals (JP 10GB $13.20→$12.14 -8% profit $4.43; AU 50GB $34→$31.61 -7% profit $12.53; GB 20GB $16.40→$14.76 -10% profit $5.32); idempotency PASS; checkout hook PASS

## Phase 3 — Checkout integrity
- ✅ `create-transaction`: deal lookup in the parallel batch; deal price only ever lowers `serverPrice`

## Phase 4 — Homepage
- ✅ `HotDealsSection.tsx` (amber ribbon cards, strikethrough, -X% badge, add-to-cart at deal price, GA4 `hot_deals` list + add_to_cart)
- ✅ Recently-viewed recording in `DestinationDetailClient.tsx` (localStorage `sim2me_recent_destinations`, max 5)
- ✅ `ForYouSection.tsx` (recent view > latest order > daily featured pick; reuses `buildTiers` + `CuratedTierCard`; renders nothing without ≥3 tiers)
- ✅ Wired into homepage: Hero → HotDeals → ForYou → ValueProps → FeaturedPlans
- ✅ 14 i18n keys × 3 locales (home namespace)

## Phase 5 — Admin
- ✅ `GET/PUT/POST /api/admin/hot-deals` (list+config / config update with clamping / regenerate·toggle·pin)
- ✅ `/admin/hot-deals` page + `HotDealsClient` (deals with per-deal net profit, pin/disable/regenerate, settings form)
- ✅ Sidebar entry "Hot Deals" (Flame icon)

## Phase 6 — Verification
- ✅ tsc clean (exit 0), lint clean on all touched files
- ✅ `npx next build` passes (94 pages; new routes present)
- ✅ Dev smoke: `/api/hot-deals` 200 with 3 deals; homepage 200 he/en/ar; `/he/destinations/jp` 200; `/admin/hot-deals` 307→login without session
- ✅ CHANGELOG updated
- [ ] User visual approval in browser

## Incidental fix
- ✅ `tailwind.config.ts`: `require('tailwindcss-animate')` → ESM import (dev server crashed under Node 24 ESM loading; production build unaffected)

## Status log
- 2026-07-29: Implemented end-to-end, verified, dev server running on :3333 for user review.
