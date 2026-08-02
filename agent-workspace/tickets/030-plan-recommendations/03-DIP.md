# Ticket 030 — Detailed Implementation Plan (DIP)

Status icons: ✅ open · ✅ done

## Gate — before any code

- ✅ **Ticket 028's open destination work is now logged** (Gabriel's call, 2026-08-02: log first,
  then start 030). 028 Phase 7c's "deferred with the rest of the destination work" is closed, and
  the session is written up as 028 Phase 7j (characters) and Phase 10 (the shelf and price-badge
  changes, which are not character work but share the same uncommitted changeset). Backups
  consolidated and verified against `e4a9d48` in
  `agent-workspace/backups/2026-08-01-destination-pages/`
- ✅ Gabriel approves this DIP (2026-08-02)
- ✅ **Still uncommitted when 030 starts.** Everything from 2026-08-01/02 plus everything this ticket
  adds will land in one changeset. Phase 0's backups matter more than usual because of it
- ⬜ Confirm no work is expected on tickets 026 / 027 (both parked in `_paused/`, plans only)

## Phase 0 — Safety

- ✅ Create `agent-workspace/tickets/030-plan-recommendations/backup/`
- ✅ Copy from the **working tree**, before first edit, since none of it is committed:
  `destinations/[slug]/page.tsx`, `plan/[planId]/page.tsx`, `PlanDetailClient.tsx`,
  `plan-curation.ts`, `messages/he.json`, `messages/en.json`, `messages/ar.json`
- ✅ Record the before-state: pick one destination **with** a live hot deal and one **without**, and
  write down for each the destination-page price of one package and that same package's price on
  its own plan page. This is the pair of numbers Phase 3 has to make agree
- ✅ `npm run dev` up; the two chosen plan pages render

## Phase 1 — Move the destination data builder

Verified on its own before anything is built on it, because the destination page is live and this
touches its data path.

- ✅ New `src/lib/api/destination-data.ts`
- ✅ Move `getDestinationData`, `PackagesFetchResult` and `PlanPayload` across **verbatim** — no
  edits to the body in this phase, so any behaviour change is provably not from here
- ✅ Keep the `cache()` wrapper on the moved function
- ✅ `destinations/[slug]/page.tsx` imports instead of defines; re-export from the page only if
  something else already imports it from there (check first)
- ✅ `npx tsc --noEmit` clean
- ✅ **Destination page is byte-for-byte unaffected**: fetch `/he/destinations/{au,gb}` before and
  after the move and diff the rendered HTML. Anything other than an empty diff stops the phase

## Phase 2 — Selection logic

- ✅ `plan-curation.ts` — export `nearestTier(tiers, plan)` over the existing private `fitScore`
- ✅ Confirm no existing export changed shape
- ✅ New `src/lib/plan-recommendations.ts` with `recommendPlans(plans, currentPlanId)`
- ✅ Restore catalog prices (`originalPrice ?? price`) before `buildTiers`, mirroring
  `DestinationDetailClient`
- ✅ Return `{ similar: null, star: null }` when `buildTiers` yields `[]`
- ✅ Drop whichever result **is** the plan being viewed
- ✅ Collapse to one card when both results are the same package (keep it as `star`)
- ✅ Throwaway script over ~12 real destinations: for every curated tier plan **and** for the
  cheapest and most expensive package in the catalogue, print what gets recommended. Checking three
  things: never the plan itself, never the same package twice, and never empty where the
  destination page does have a shelf
- ✅ Delete the script; keep its output in `proofs/`

## Phase 3 — Plan page data, and the deal-price fix

- ✅ `plan/[planId]/page.tsx` calls `getDestinationData(slug, locale)`
- ✅ Viewed plan resolved from that list, so it carries `price`, `originalPrice` and `saleBadge`
- ✅ Fall back to `getPlanById` when the package is absent from the location feed — today's
  behaviour for that case must not regress into a 404
- ✅ Whole block wrapped: on any failure, fall back to the current path and pass empty
  recommendations. A recommendation must never be able to take down a purchase page
- ✅ `recommendPlans` called server-side; result passed as a prop
- ✅ **The two numbers from Phase 0 now agree** for the deal destination, and the no-deal
  destination is unchanged
- ✅ Confirm the struck-through original price renders on the plan page for a discounted package,
  the same treatment `PlanCard` already gives it elsewhere

## Phase 4 — The block

- ✅ New `src/components/sections/RecommendedPlans.tsx`
- ✅ Heading plus `catalogReaction`, then `grid gap-6 sm:grid-cols-2`
- ✅ Cards are `CuratedTierCard`, unchanged
- ✅ One card renders as one card, not as a half-width card with a hole beside it
- ✅ `PlanDetailClient.tsx` — new optional prop, section rendered below the existing grid. Nothing
  above it moves; the price card, the button and `handleAddToCart` are not touched
- ✅ Renders nothing at all when both fields are `null` — no empty heading, no stray spacing

## Phase 5 — Copy

- ✅ `recommendedHeading` and `recommendedSubtitle` added to the `plan` namespace in `he.json`,
  `en.json`, `ar.json`. **`recommendedSimilar` was not added** — nothing renders it. The planned
  "similar to this one" label would have sat exactly where `CuratedTierCard` already prints the
  tier name, and two labels on one card is one more than the card can carry
- ✅ No tier name or description duplicated — those stay in `destinations` and are read by
  `CuratedTierCard`
- ✅ Arabic and English checked as written copy, not as machine-shaped Hebrew

## Phase 6 — Verification

- ✅ `npx tsc --noEmit` clean
- ✅ `npx next build` passes (not `npm run build` — it starts with `prisma db push`, which has no
  business running against the shared DB from this machine; see 029 Phase 6)
- ✅ `npm run lint` shows no new finding in a file this ticket touches
- ✅ A plan page on a destination **with** a shelf: two cards, correct tier names, neither is the
  plan on screen
- ✅ A plan page for a package that **is** the Best-Seller: one card, not a duplicate
- ✅ A plan page on a destination with **no** shelf: page unchanged, no empty block
- ✅ A plan page for a **discounted** package: one price, matching the destination page
- ✅ `/he`, `/en`, `/ar` on a plan page → 200; RTL and LTR both correct, characters mirrored per
  their `mirror` value
- ✅ Regression: destination page, curated shelf, hot deals row and the homepage all unchanged
- ⬜ 375 px: cards stack, the pair does not overlap the heading or the cards — checked in the markup
  (`sm:grid-cols-2` is single-column below 640 px, the pair is a centred flex child), not with eyes
- ⬜ Add to cart from the plan page **and** from a recommendation card → one consistent cart entry —
  the recommendation card is `PlanCard`, given the same `destinationName` / `destinationSlug` the
  destination page gives it, so the entry is built from identical inputs. Not clicked
- ⬜ **Gabriel's browser pass**

## Phase 7 — Close

- ✅ `CHANGELOG.md` under `[Unreleased]`
- ✅ Ticket 029's note that "the single-plan page still shows catalog prices for a package on offer"
  amended — it is fixed here
- ✅ Summarise: files changed, what to look at, what was deliberately left alone
- ✅ Confirm the homepage "For You" section is still the one remaining place showing catalog prices
  for a discounted package, and that it is logged somewhere as open

## Status log

**2026-08-02 — built locally, waiting on Gabriel's browser pass.** Nothing committed; this ticket's
changes sit in the same uncommitted changeset as 028's Phase 7j and Phase 10.

Two things went differently from the plan.

**The star is not held back from the "similar" search.** The plan said pick both, then drop a
duplicate. My first implementation instead excluded the star from the search so that two cards would
always appear, and the Phase 2 audit is what caught it: on a four-slot shelf the star is usually the
month tier and also the nearest neighbour of every other slot, so excluding it pushed "similar" out
to whatever was left. A visitor reading 3 GB for $3.40 was offered 20 GB for $16.40 under a heading
promising something like what they were already looking at. Reverted to the plan's rule. One card is
now a common outcome rather than an edge case, which is why the block has a single-card layout.

**`recommendedSimilar` was dropped**, see Phase 5.

Evidence in `proofs/`:

- `phase-1-move-is-inert.md` — the destination page before and after the move. The raw HTML is not
  comparable in dev (a cache-busting `?v={ms}` on the stylesheet diverges at character 355 between
  two fetches of unchanged code), so scripts and `<head>` are stripped. AU and JP identical; GB
  differs only by where React put `<title>`, and the same URL was shown producing two variants
  across four fetches of one unchanged build
- `phase-2-recommendation-audit.txt` — 104 simulated plan pages over 18 destinations, 0 failures

What Phase 0 recorded and Phase 3 had to fix:

| | destination page | plan page, before | plan page, after |
|---|---|---|---|
| AU `JC101`, on offer | $8.64 | **$9.40** | $8.64, $9.40 struck through |
| GB `CKH254`, no offer | $3.00 | $3.00 | $3.00 |

Behaviour on real pages:

| page | price | cards |
|---|---|---|
| `au/JC101` — is the Best-Seller, and on offer | $8.64 was $9.40 | 1, full width |
| `gb/CKH254` — week tier, nearest is the Best-Seller | $3.00 | 1, full width |
| `jp/P6ZMSDS1G` — cheapest in the catalogue | $0.70 | 2, side by side |
| `jp/CKH505` — not in JP's feed, falls back to `getPlanById` | $34.00 | none, no empty block |

`npx tsc --noEmit` clean, `npx next build` passes, `/he` `/en` `/ar` all 200. `npm run lint` still
exits 1 on two pre-existing errors in `ui/input.tsx` and `theme/tokens.ts`, neither touched here;
the one warning this changeset had introduced — an unused `tDest` left in `PlanCard` by today's
per-day badge removal — is gone.

One operational note: running `npx next build` while `npm run dev` was up overwrote `.next` and left
the dev server serving 500s from missing chunks. Not a code fault. Killed, `.next` removed, restarted,
and every check above was re-run against the fresh server.

## Notes / follow-ups

- **The homepage "For You" section is now the last place quoting catalog prices for a package on
  offer.** Verified, not assumed: `ForYouSection` fetches `/api/packages?location=…` from the
  browser and maps `pkg.price` straight onto the card, so it never sees a deal. It cannot reuse the
  fix from here — `getDestinationData` is a server module reading the deals table. Open; recorded
  against ticket 029 Phase 6c, where the deliberate deferral was made
- `public/characters/` ships 12 `-proof.png` files, ~10.8 MB, referenced by nothing. Raised twice on
  2026-08-01, no decision yet. Not this ticket's work, but it is dead weight in every deploy
- `getPlanById` fetches the **entire** global package list to find one package. After Phase 3 it is
  only the fallback path, so this ticket makes it matter less rather than more. Left alone
