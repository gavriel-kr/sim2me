# Ticket 024 — Homepage Hot Deals + Personal Shelf (PRD)

## Background
The homepage today shows destination flags but **zero actual packages** — a visitor cannot see a single price+product without clicking through. Competitor analysis (Airalo, July 2026) shows deal-driven merchandising and personalization drive homepage conversion.

## Goals
1. **Hot Deals**: 3 auto-generated daily deals (5–10% extra discount) on the homepage, with hard profit protection.
2. **Personal shelf ("For You")**: packages chosen by customer signals — recently viewed destination → past order → curated default.
3. **Full admin control** over the deals: view, pin, disable, regenerate, and tune rules.

## Requirements

### R1 — Hot Deals engine
- Candidate pool = packages of **admin-curated featured destinations** (`FeaturedDestination` table — same list that controls homepage flags). Fallback list when empty.
- Eligibility per candidate: visible, fixed-data (not daily/unlimited), display price ≥ $8 (configurable).
- Discount: random integer 5–10% (configurable range) off the current display price.
- **Profit gate (hard rule)**: net profit after discount ≥ $3 (configurable), computed with the existing `computeProfit` (simCost + Paddle % + fixed fee + additional fees + esim additional cost). A package failing the gate can never appear as a hot deal.
- Exactly 3 deals (configurable), max 1 per destination, rotated daily via date-seeded RNG (stable during the day).
- Deals are generated lazily on first request of the day — no cron required.

### R2 — Price integrity (critical)
- The **server-side price resolution in checkout must honor the deal price** — displayed deal price and charged price must always match.
- Grace window: deals from yesterday still honored at checkout (cart added late at night).
- Deal price never touches `PackageOverride.customPrice` (admin manual pricing stays clean).

### R3 — Homepage
- New "Hot Deals" section after the hero: 3 cards with original price struck through, discount badge, destination flag, add-to-cart. Hidden entirely if no eligible deals.
- New "For You" section: signal hierarchy —
  1. Recently viewed destination (localStorage, no account needed): "Continue where you left off"
  2. Latest order destination (logged-in): "Traveling again?"
  3. Default: daily-rotating featured destination star picks
- Both sections fully localized he/en/ar, RTL-aware.

### R4 — Admin
- New page `/admin/hot-deals`: today's 3 deals with computed net profit each, pin / disable / regenerate, and settings (min profit, discount range, count, min price, enabled).

## Non-goals
- No coupons/promo codes (future ticket).
- No changes to destination pages beyond recording recently-viewed.
- No email/push about deals.
- **No deployment — local only.**

## Success criteria
- Homepage shows 3 deals + personal shelf in all 3 locales.
- A deal purchase charges exactly the deal price (verified via create-transaction logic).
- Every displayed deal has provable net profit ≥ $3.
- Admin can disable a deal and it disappears from the homepage on next fetch.
