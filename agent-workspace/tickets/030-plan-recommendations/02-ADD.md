# Ticket 030 — Architectural Design (ADD)

## Principles

- **One curation engine.** The recommendation is not a second opinion about which package is good.
  It is the existing shelf, read from a different page. Anything that ranks or names packages stays
  in `plan-curation.ts`.
- **One fetch path per destination.** The plan page needs exactly what the destination page already
  builds. Duplicating that builder would mean two places where a hot deal is applied, and the two
  would drift into two prices for one package — the failure ticket 029 spent Phase 6b fixing.
- **Smallest footprint that is still honest.** No migration, no new route, no new dependency, no new
  artwork.

## The blocker, and the choice made

`getDestinationData(slug, locale)` is the function that turns `/api/packages?location=XX` into
localised, deal-priced `PlanPayload[]`. It is ~130 lines and lives **inside**
`src/app/[locale]/destinations/[slug]/page.tsx`, wrapped in React `cache()`. The plan page cannot
reach it.

Three options were considered:

| Option | Cost |
|---|---|
| Re-implement the mapping on the plan page | ~130 duplicated lines including hot-deal overlay. Two sources of truth for one price. Rejected |
| `getPlansByDestination()` from the repository | Already shared, but applies neither locale name translation nor the hot deal. Would recommend packages at the wrong price and the wrong name. Rejected |
| **Move `getDestinationData` to a shared module** | One mechanical file move. Both pages import it. `cache()` still dedupes within a request. **Chosen** |

The function body is not modified — only its address. The destination page keeps working through a
one-line import change, and the move is the whole of Phase 1 precisely so it can be verified on its
own before anything is built on top of it.

## Changes

### 1. New `src/lib/api/destination-data.ts`

`getDestinationData` and the types it owns (`PackagesFetchResult`, `PlanPayload`) move here
verbatim. `src/app/[locale]/destinations/[slug]/page.tsx` imports instead of defines.

Placed under `lib/api/` beside the repositories, matching where the other server-side data builders
already live.

### 2. `src/lib/plan-curation.ts` — export the distance metric

The module already has a private `fitScore()`: a log-ratio distance over GB and days, with days
weighted 0.6× because a day is a softer constraint than a gigabyte. "Closest match" must use that
same metric — a second, hand-rolled notion of similarity would eventually disagree with the shelf
about which tier a package belongs to.

```ts
/** The curated tier nearest `plan`, by the same metric the shelf itself is picked with. */
export function nearestTier(tiers: CuratedTier[], plan: Plan): CuratedTier | null;
```

Additive. No existing export changes shape.

### 3. New `src/lib/plan-recommendations.ts`

One pure function, so the selection rules are testable and are not smeared across a page component:

```ts
export interface PlanRecommendations {
  similar: CuratedTier | null;
  star: CuratedTier | null;
}

export function recommendPlans(plans: Plan[], currentPlanId: string): PlanRecommendations;
```

Rules, in order:

1. Restore catalog prices before curating (`originalPrice ?? price`), mirroring
   `DestinationDetailClient`. A deal price would distort the Pareto frontier.
2. `buildTiers(...)`. If it returns `[]`, both fields are `null` and the page renders nothing.
3. `star` = the tier with `isStar`.
4. `similar` = `nearestTier(tiers, currentPlan)`.
5. Drop whichever of the two **is** the plan being viewed.
6. If both survive and are the same package, keep it as `star` only, and set `similar` to `null`.
   The block then renders one card.

Returning both as nullable, rather than an array, keeps "which card is which" a type-level fact
instead of an index the component has to guess.

### 4. `src/app/[locale]/destinations/[slug]/plan/[planId]/page.tsx`

- Calls `getDestinationData(slug, locale)` — the same cached call the destination page makes.
- Resolves the viewed plan **from that list** rather than from `getPlanById`, which is what fixes
  the deal-price bug: the list already carries `price`, `originalPrice` and `saleBadge`.
- Falls back to `getPlanById` if the package is not in the list, so a plan that exists but is
  missing from the location feed still renders instead of 404-ing. Behaviour today is preserved.
- The whole block is wrapped: on any failure it falls back to today's path and passes
  `recommendations = { similar: null, star: null }`.

### 5. New `src/components/sections/RecommendedPlans.tsx`

A section, not a card. The cards themselves are `CuratedTierCard`, unchanged — it already renders
the tier name, the one-line description and a full `PlanCard` beneath, which is exactly the
presentation the destination page uses. Building a second recommendation card would be building a
second visual language for the same idea.

Layout: heading and `catalogReaction` above, one or two cards below in
`grid gap-6 sm:grid-cols-2`. `catalogReaction` is the existing pair looking downward in delight —
they end up looking straight at the cards they are recommending, which is the whole reason that
render exists. No new artwork.

### 6. `PlanDetailClient.tsx`

Accepts one new optional prop and renders `<RecommendedPlans />` below the existing grid. Nothing
above it moves. The price card, the add-to-cart button and `handleAddToCart` are not touched.

### 7. Messages — `he.json`, `en.json`, `ar.json`

Three keys under the existing `plan` namespace:

| Key | Hebrew |
|---|---|
| `recommendedHeading` | מומלץ עבורך |
| `recommendedSubtitle` | סימי וסימה עברו על כל החבילות ליעד הזה — אלה שתי המשתלמות ביותר |
| `recommendedSimilar` | הכי קרובה לחבילה שאתה רואה |

Tier names and descriptions are **not** duplicated. `CuratedTierCard` already reads them from the
`destinations` namespace, and one package must not have two names on two pages.

## What is deliberately not done

- **No caching layer of its own.** `getDestinationData` is already `cache()`-wrapped with
  `revalidate: 300`; a second one would be a second expiry to reason about.
- **No client-side fetch.** Curation is deterministic and cheap, and the result is part of the
  page's meaning — it belongs in the server render, not in a flash after hydration.
- **No third card.** Two is the point: the one near what you asked for, and the one most people
  buy. A third would turn a recommendation back into a catalogue.

## Risk

**R2.** Nothing here writes, and cart and checkout are untouched. The rating is for reach: Phase 1
moves a function the destination page depends on, and Phase 3 changes where the plan page gets its
price from. Both are on the purchase path by proximity, so both get backups and their own
verification before anything is built on top of them.
