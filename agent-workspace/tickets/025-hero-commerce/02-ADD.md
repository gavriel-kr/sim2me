# Ticket 025 — Architectural Design (ADD)

## Principle: reuse only
No new backend, tables, or endpoints. Everything feeds off queries and storage that already exist:

| Hero element | Existing source |
|---|---|
| Destination chips (flag, name, from-price) | `getDestinations()` react-query (`['destinations']` — same cache as FeaturedPlans) |
| Continue-chip | `localStorage.sim2me_recent_destinations` (written by destination pages, ticket 024) |
| Hot-deal chip + phone deals | `GET /api/hot-deals` react-query (`['hot-deals']` — same cache as HotDealsSection) |
| Localized country names | `Intl.DisplayNames` (same pattern as FeaturedPlans/HotDealsSection) |
| Trust row texts | existing `home.trust*` keys + 1 new key |

## Changes
1. `src/components/sections/Hero.tsx` — client component already; add the two queries, chips row, continue-chip, deal chip, trust row; phone mockup renders real deals with static fallback.
2. `src/components/sections/HotDealsSection.tsx` — add `id="hot-deals"` for anchor scroll (only change).
3. `src/messages/{en,he,ar}.json` — updated `heroTitle`/`heroSubtitle`, ~6 new keys.

## Notes
- Headline price anchor is static copy ("$1.40") — matches the real catalog floor; chips carry live per-destination prices. Revisit copy if supplier pricing changes.
- SSR renders the hero without chips/deals (client queries); layout reserves no fixed space for them, so no CLS-sensitive jumps beyond small reveals.
- Risk: R0 (presentation only, no critical paths).
