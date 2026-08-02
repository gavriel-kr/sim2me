# Backup — the destination-pages session, 2026-08-01 → 08-02

Pre-change copies of **every** file touched in this session, taken from commit `e4a9d48` (ticket
029, the last commit before the work started). Verified on 2026-08-02: each file here is
byte-identical to `git show HEAD:<path>`.

Filenames are the original paths under `src/` with separators flattened to `-` and the Next.js route
brackets dropped, matching the convention in the ticket backup folders.

To restore one file, copy it back to its original path:

| Backup file | Original path |
|---|---|
| `app-locale-destinations-DestinationsClient.tsx` | `src/app/[locale]/destinations/DestinationsClient.tsx` |
| `app-locale-destinations-slug-DestinationDetailClient.tsx` | `src/app/[locale]/destinations/[slug]/DestinationDetailClient.tsx` |
| `app-locale-destinations-slug-page.tsx` | `src/app/[locale]/destinations/[slug]/page.tsx` |
| `app-locale-destinations-slug-plan-planId-PlanDetailClient.tsx` | `src/app/[locale]/destinations/[slug]/plan/[planId]/PlanDetailClient.tsx` |
| `components-sections-DealCard.tsx` | `src/components/sections/DealCard.tsx` |
| `components-sections-FeaturedPlans.tsx` | `src/components/sections/FeaturedPlans.tsx` |
| `components-sections-Hero.tsx` | `src/components/sections/Hero.tsx` |
| `components-sections-PlanCard.tsx` | `src/components/sections/PlanCard.tsx` |
| `lib-character-art.ts` | `src/lib/character-art.ts` |
| `lib-plan-curation.ts` | `src/lib/plan-curation.ts` |

That is the complete list of modified files. Everything else the session produced is **new** —
image files under `public/characters/` and their masters under `agent-workspace/brand-assets/` — and
new files need no pre-image.

`src/components/brand/CharacterFigure.tsx` was copied during the session and then removed from here:
it was never modified, so a backup of it was only noise.

## `intermediate-before-characters/`

Two files as they stood **mid-session**: after the shelf and price-badge work, before the character
work. Kept because they were taken at the time, not because they are a useful restore point — a
rollback wants the top-level copies, which are the real before-state. Do not restore from this
subfolder unless you specifically want the shelf changes without the characters.

## What changed against these copies

Two unrelated bodies of work landed in the same session. They are logged in full in
`agent-workspace/tickets/028-characters-imagery/03-DIP.md`, Phase 7j and Phase 10.

### Shelf and pricing (Phase 10 in the 028 DIP)

1. **Weekend tier removed** — `plan-curation.ts`: `tierWeekend` dropped from `TierKey` and
   `TIER_TARGETS`; `DestinationDetailClient.tsx`: the now-dead `tier.key !== 'tierWeekend'` guard
   removed from the hot-deal filter.
2. **"from $X" badge removed** — `Hero.tsx`, `DestinationDetailClient.tsx`, `FeaturedPlans.tsx`,
   `DestinationsClient.tsx`, and the destination page's SEO title and description in `page.tsx`.
   The `fromPrice` field itself stays: `/destinations` still filters and sorts on it.
3. **"$X per day" badge removed** — `PlanCard.tsx`, `DealCard.tsx`, `PlanDetailClient.tsx`.
4. **Reverted, not shipped** — a second validity pass in `valueUpgrade()` was tried and rolled back
   at Gabriel's request. `valueUpgrade()` in the working tree is identical to the copy here.

### Characters on the destination pages (Phase 7j in the 028 DIP)

5. **`character-art.ts` grew a second map** — `CharacterSlot` split into `HomepageSlot` and
   `DestinationSlot`; ten destination slots added; `destinationHeaderPose()` added.
6. **Six new renders** — four rotating destination-header poses, one pointing pair, one pair peering
   down, one pair on binoculars. The two `*-generic` files already existed and were unused.
7. **Four placements** — the destination header, the "show all plans" button, the seam where the
   catalogue opens, and the destinations index heading. Plus the plan page's price card, which uses
   the pre-existing generic cutouts.
8. **A 2-second spinner** on "show all plans" — deliberate, not a fetch. See the DIP.
