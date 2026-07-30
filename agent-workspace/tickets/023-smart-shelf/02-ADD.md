# Ticket 023 — Architectural Design (ADD)

## Approach

Pure client-side curation layered on the existing destination page. No API, schema, or admin changes. One new lib module + edits to `DestinationDetailClient.tsx`.

## New module: `src/lib/plan-curation.ts`

```ts
export type PlanFamily = 'fixed' | 'daily' | 'unlimited';
export type TierKey = 'tierWeekend' | 'tierWeek' | 'tierMonth' | 'tierHeavy' | 'tierLong';
export interface CuratedTier { key: TierKey; plan: Plan; isStar: boolean }

export function classifyFamily(plan: Plan): PlanFamily
  // volume<0 → unlimited; /\/Day/i on name → daily; else fixed

export function paretoFrontier(plans: Plan[]): Plan[]
  // dedupe (gbRounded, days) keep cheapest → drop dominated

export function buildTiers(plans: Plan[]): CuratedTier[]
  // fixed family → frontier → nearest-fit to ladder targets:
  // weekend {gb:1,  days:7}, week {gb:3, days:15+}, month {gb:10, days:30},
  // heavy {gb:20, days:30}, long {gb:50+, days:60+}
  // dedupe plans across tiers; star = admin-featured plan's tier, else tierMonth, else middle
```

Deterministic, unit-testable, zero React. GB matching uses closest ratio (not exact) so catalogs with 5GB-not-3GB still fill tiers.

## UI changes: `DestinationDetailClient.tsx`

- New state: `viewMode: 'curated' | 'all'`; default `curated` when `buildTiers(initialPlans).length >= 3`, else `all` (current behavior).
- Curated view: renders `CuratedTierCard` list (new small component in same file or `components/sections/`), hides the filter bar, shows "Show all {N} plans" button → `viewMode='all'` (reveals today's filter bar + grid untouched).
- Tier names/subtitles from `destinations` namespace: `tierWeekend`, `tierWeekendDesc`, … (15 keys × 3 locales).
- `PlanCard` reused for tier cards with a `tierLabel` optional prop **or** a thin wrapper card — decision: thin wrapper that composes existing `PlanCard` with a header strip (zero risk to other PlanCard usages).
- Analytics: `view_item_list` with `item_list_id: 'curated:'+slug` vs `'all:'+slug` (ticket 022 helper).

## i18n keys (messages/{en,he,ar}.json → destinations)

`showAllPlans`, `showCurated`, `mostPopular`, plus per-tier `name` + `desc` (10 keys). Hebrew names pending user approval (PRD).

## Files touched
- `src/lib/plan-curation.ts` (**new**)
- `src/app/[locale]/destinations/[slug]/DestinationDetailClient.tsx`
- `src/components/sections/CuratedTierCard.tsx` (**new**, thin wrapper)
- `src/messages/{en,he,ar}.json`

## Backups & rollback
Backups in ticket folder. Rollback = restore `DestinationDetailClient.tsx` + delete 2 new files; message keys are inert.

## Testing
- Unit-style script run with real API data for IL/JP/TH (same analysis used in audit) asserting tier counts and no dominated plan selected.
- Visual check on `/he/destinations/jp`, `/en/destinations/jp`, `/ar/destinations/il`.
