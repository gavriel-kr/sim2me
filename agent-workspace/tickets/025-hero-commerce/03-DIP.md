# Ticket 025 — DIP

## Gate
- ✅ User approved scope + copy version A; existing homepage sections stay untouched (2026-07-29)

## Phase 0 — Safety
- ✅ Backup `Hero.tsx`, `HotDealsSection.tsx`, `en/he/ar.json` → `backup/`

## Phase 1 — Copy
- ✅ heroTitle + heroSubtitle rewritten (price anchor + pain-relief) ×3 locales
- ✅ New keys: heroContinue, heroDealChip, heroDealInstead, heroTrustInstall, heroPhoneHeader, heroPhoneSub, heroFrom ×3 locales

## Phase 2 — Hero
- ✅ Destination quick-chips (popular-first, flag + name + from $X; 6, or 4 when continue-chip shows)
- ✅ Continue-chip from `sim2me_recent_destinations`
- ✅ Hot-deal chip (top deal, price + strikethrough, anchor → #hot-deals)
- ✅ Micro-trust row (install minutes / secure checkout / 24-7 support)
- ✅ Phone mockup: today's real deals w/ prices + strikethrough, localized chrome, static localized fallback
- ✅ `id="hot-deals"` + `scroll-mt-24` on HotDealsSection (only change to that file)

## Phase 3 — Verification
- ✅ tsc clean, no linter errors
- ✅ `npx next build` passes
- ✅ Dev smoke: /he /en /ar → 200; /api/hot-deals → 200 with deals
- ✅ SSR HTML contains new headline, subtitle, trust row, phone header (he)
- ✅ CHANGELOG updated

## Status log
- 2026-07-29: Ticket opened, implemented, verified. DONE.
- 2026-07-29 (revision): Per user — headline changed to "הישארו מחוברים בכל העולם. בלי דמי נדידה." (price anchor dropped from H1; live prices remain in chips/deals). "Per day" mislabel fixed: removed `perDay` next to `fromPrice` in FeaturedPlans, DestinationDetailClient, DestinationsClient (fromPrice = cheapest package price, auto from live catalog). Removed fake `fromPrice: 4.99` from static fallback `src/data/destinations.ts` (price now hidden instead of wrong when API fails). Verified: tsc clean, /he + /he/destinations/jp → 200, new title in SSR HTML.

- 2026-07-29 (revision 2): Subtitle ending replaced per user — "בלי חשבון מפתיע כשחוזרים הביתה" → "בלי לחפש WiFi בשדה התעופה" (×3 locales). Roaming-bill pain already covered by the headline; subtitle now covers the practical landing moment. Verified in SSR HTML.

- 2026-07-30 (revision 3): Destination page — "Show all N plans" now expands the full catalog *below* the curated tiers (same page, smooth scroll to it) instead of replacing them. "Back to recommended" collapses the catalog and scrolls back up. Calculator "find plan" also opens the catalog (its data filter lives there). File: `DestinationDetailClient.tsx` (viewMode → showAll + refs). Verified: tsc clean, /he/destinations/jp → 200.

## Notes / follow-ups
- `perDay` keys kept in messages — still correctly used by PlanCard/PlanDetail (price ÷ days).
