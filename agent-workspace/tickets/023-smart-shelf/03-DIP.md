# Ticket 023 — Detailed Implementation Plan (DIP)

## Gate
- ✅ User approved HE/AR/EN tier names (2026-07-29)
- ✅ Ticket 022 merged (analytics to measure impact)

## Phase 0 — Safety
- ✅ Backup `DestinationDetailClient.tsx` + 3 message files

## Phase 1 — Curation engine
- ✅ `src/lib/plan-curation.ts`: `classifyFamily`, `paretoFrontier`, `buildTiers` (log-ratio nearest-fit, MAX_FIT_SCORE=2.2, star = featured → tierMonth → middle)
- ✅ Verified with live-data script:
  - JP: 42 → 5 tiers ($1.40 / $3.40 / ★$9.40 / $16.40 / $56)
  - TH: 34 → 5 tiers; US: 37 → 5 tiers; IL: 15 → 5 tiers
  - GI (small catalog): 10 → 4 tiers; <3 tiers → falls back to full grid

## Phase 2 — UI
- ✅ `CuratedTierCard.tsx` wrapper (tier name + intent line above existing PlanCard; star tier reuses Best-Seller strip)
- ✅ `DestinationDetailClient.tsx`: `viewMode` state, curated default when ≥3 tiers, "Show all {N} plans" toggle, "Back to recommended" in full view, <3 tiers fallback
- ✅ Message keys en/he/ar (13 keys each): curatedHeading/Subtitle, showAllPlans, showCurated, 5×tier name+desc

## Phase 3 — Analytics & polish
- ✅ `view_item_list` fires with `curated:{slug}` / `all:{slug}` list ids per view mode
- ✅ RTL: tier header inherits page direction; PlanCard already RTL-aware

## Phase 4 — Verification
- ✅ tsc clean (exit 0), lint clean
- ✅ `npx next build` passes (94 pages)
- ✅ Dev-server smoke: 200 on he/en/ar destination pages; all 5 Hebrew tier names + heading present in JP HTML; EN names present
- [ ] User visual approval in browser (links provided)

## Phase 5 — Value-upgrade rule (user request, 2026-07-29)
- ✅ `valueUpgrade()` in `plan-curation.ts`: after nearest-fit pick, upgrade to a plan with more data + same-or-longer validity if it costs ≤ +15% (`VALUE_UPGRADE_MAX_PRICE_RATIO=1.15`), capped at 4× the tier's data target (`VALUE_UPGRADE_MAX_GB_FACTOR=4`)
- ✅ Synthetic test: 2GB/7d @ $1.50 correctly replaces 1GB/7d @ $1.40 for tierWeekend (+7% price, 2× data)
- ✅ Live-data re-run (JP/TH/IL/US/GI/FR/TR): tiers unchanged — current supplier price ladders scale ~linearly so no upgrade triggers today; rule protects against future pricing where a bigger plan costs nearly the same
- ✅ Borderline noted: US 20GB/30d $14.00 vs 10GB/30d $12.08 = +15.9%, just outside threshold (would need 1.20 to trigger)

## Status log
- 2026-07-29: Implemented, verified, dev server running for user review.
- 2026-07-29 (late): Added value-upgrade rule per user question about prioritizing more-data-for-same-money.
