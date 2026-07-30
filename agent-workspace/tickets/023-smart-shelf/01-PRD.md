# Ticket 023 — Smart Shelf: Curated Destination Offers (PRD)

## Background

Destination pages show the raw supplier catalog: Japan = 42 cards including near-duplicates (`(IIJ)`, `(nonhkip)` variants at identical/worse prices), Pareto-dominated plans (Israel 3GB/15d $6.40 vs 3GB/30d $5.40), and mixed product families (fixed-data vs `/Day` vs FUP throttled). Choice overload suppresses conversion.

Verified live data (July 2026): Japan 42 → ~17 after dedupe+dominance on fixed plans alone; Thailand 34 → 11; Israel 15 → 8.

## Product decision

Default view = **curated shelf** of 4–6 tiers named by trip intent, with anchor pricing and a single "Most popular" badge. Full catalog stays one tap away ("Show all N plans") — nothing is removed from sale.

### Tier ladder (per destination, computed from fixed-data plans)

| Tier key | Intent (EN name) | Selection heuristic |
|---|---|---|
| `tierWeekend` | Weekend Trip | smallest plan ≥1GB with ≥7 days |
| `tierWeek` | Easy Week | ~3GB with longest validity at best price |
| `tierMonth` | The Full Trip ★ | ~10GB / 30d — target tier, gets "Most popular" |
| `tierHeavy` | Heavy Traveler | ~20GB / 30d — anchor |
| `tierLong` | Long Stay | largest GB / longest days (only if exists) |

Names localized (he/ar/en) via message keys — e.g. HE: "סופ״ש רגוע", "שבוע בראש שקט", "הטיול המלא", "גולש כבד", "שהייה ארוכה". Spec (GB/days) always remains visible on the card — transparency is non-negotiable.

### Selection algorithm (pure function, no data changes)
1. Split plans into families: `fixed`, `daily` (`/Day` in original name), `unlimited` (volume<0).
2. Within `fixed`: dedupe by `(GB, days)` keeping cheapest; drop Pareto-dominated plans (worse-or-equal on price/GB/days with at least one strictly worse).
3. Map survivors to the tier ladder (nearest-fit; skip empty tiers; never show the same plan twice).
4. Admin override wins: a `featured` plan is always included and takes the ★; `visible=false` plans excluded (already enforced upstream).
5. Daily/unlimited families are not tiered in v1 — they appear only in "Show all".

### UX
- Curated shelf replaces the grid as the default; filter bar applies to the "all plans" view.
- Each tier card: tier name (localized), one-line intent subtitle, spec line (GB · days · network), price + per-day price, CTA.
- One ★ "Most popular" badge per destination (middle tier or admin-featured).
- "Show all N plans" toggle reveals the existing grid + filters unchanged.
- If curation yields <3 tiers (tiny catalogs), fall back to current full grid.

## Success criteria
- Japan default view shows ≤6 cards; full catalog reachable in one tap.
- No plan becomes unpurchasable; admin `visible`/`featured`/`customTitle` still respected.
- Works generically for all destinations (pure function of the plan list — no per-destination config needed).
- Measurable via ticket 022 events (view_item_list fires with `item_list_id` = `curated` vs `all`).

## Out of scope (v1)
- Admin UI for tier config (heuristics only; overrides via existing featured/visible)
- Daily-plan tiering
- Price/name changes to actual packages
- Any backend/API change — curation is client-side on `initialPlans`

## Dependencies
- Ticket 022 (analytics) should land first to measure impact.
- Requires user approval of the Hebrew/Arabic tier names before implementation.
