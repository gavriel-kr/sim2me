# Ticket 029 — Detailed Implementation Plan (DIP)

Status icons: ⬜ open · ✅ done

## Phase 0 — Pre-flight ✅

- ✅ Gabriel approves scope (2026-08-01)
- ✅ Decisions locked (2026-08-01): hero rotates **all six**; mobile shows **all six**; own ticket
- ✅ Tickets 026 and 027 moved to `agent-workspace/tickets/_paused/` — plans only, no code was written
- ✅ Ticket 028 left in place: its code is live in the uncommitted working tree and `028/backup/` is
  the only rollback path for it
- ✅ `npm run dev` up, `/he` renders
- ✅ Before-state recorded: no `hot_deals_config` row in `SiteSetting` (so the default applies),
  8 featured destinations, 3 rows for `2026-08-01` (AU, IT, JP)
- ✅ **Found: the local `.env` points at the shared cloud DB** (`db.prisma.io`), not a local
  Postgres. Every verification step below was therefore designed to avoid deleting live rows
- ✅ Create `agent-workspace/tickets/029-six-daily-deals/backup/`
- ✅ Copy each file into `backup/` **from the working tree** before its first edit:
  `hot-deals.ts`, `HotDealsSection.tsx`, `Hero.tsx`, `api/admin/hot-deals/route.ts`,
  `HotDealsClient.tsx`

## Phase 1 — Engine ✅

- ✅ `DEFAULT_HOT_DEALS_CONFIG.count` 3 → 6
- ✅ Confirmed no `hot_deals_config` row exists, so the new default takes effect directly
- ✅ Pass 1 unchanged: one deal per `locationCode`
- ✅ Pass 2, entered **only** when `rows.length < slots` after pass 1: same seeded shuffle, same
  discount draw, same profit gate, `usedPackages` still enforced, `usedLocations` ignored
- ✅ Both passes share one loop body, so the profit gate cannot drift between them
- ✅ `generateDeals` accepts `alreadyCommitted`; `slots`, `usedLocations` and `usedPackages` all
  seeded from it
- ✅ Pinned-carryover loop now skips a package already kept for today — it previously relied on
  `skipDuplicates` at the DB level, which silently burned a slot
- ✅ `regenerateTodayDeals` passes its kept rows in
- ✅ Verified against the live day: 3 kept + 3 created = exactly 6, no destination reused

## Phase 2 — Display ✅

- ✅ `HotDealsSection.tsx` — `deals.slice(0, 3)` → `deals`
- ✅ `Hero.tsx` — `const strip = deals.slice(0, 3)` → `const strip = deals`
- ✅ `HeroOfferCard` needs no change: the flex track renders one slide per deal and takes the height
  of the tallest, so six cannot shift the page
- ✅ `useDealRotation` handles six unchanged — `index % count`, no wrap bug at slide 6 → 1
- ✅ Six dots fit the card: 5×6 px + 16 px active + 5×6 px gaps ≈ 76 px against ~288 px of inner
  width shared with the "only today" chip. **Still worth Gabriel's eye in all three locales**
- ✅ `ADVANCE_MS` left at 6000 (see ADD)

## Phase 3 — Admin headroom ✅

- ✅ `api/admin/hot-deals/route.ts` — `clampInt(body.count, 1, 6, ...)` → max 9
- ✅ `HotDealsClient.tsx` — `NumField … max={9}`
- ✅ A count of 9 was accepted, persisted and honoured during the Phase 4 fill test

## Phase 4 — Verification ✅

Full output: `proofs/verification-2026-08-01.md`.

- ✅ Day topped up to six **without deleting a single existing row** — the three live deals were
  pinned first, since deleting one would strand any cart holding it
- ✅ `GET /api/hot-deals` returns **6**, six distinct package codes, six distinct destinations
- ✅ Every row's `netProfit >= minProfit` — lowest was AU at $3.01 against the $3.00 floor
- ✅ Every `dealPrice` equals `floor(originalPrice × (1 − pct/100) × 100) / 100`
- ✅ Every `discountPercent` inside the configured 5–10 range
- ✅ Short-pool behaviour proved directly: asked for 9 against 8 destinations, got 9, with one
  destination repeated on a **different package** and the profit gate intact
- ✅ Everything restored afterwards — 6 rows, 0 pinned, no config row
- ✅ `/he`, `/en`, `/ar` and `/admin/hot-deals` all 200
- ✅ `npx tsc --noEmit` clean
- ✅ `npx next build` passes (not `npm run build` — that script starts with `prisma db push` and two
  seeding scripts, which have no business running against the shared DB for a local check)
- ⬜ **Gabriel's browser pass** — two rows of three on desktop, six stacked at 375 px, RTL in `he`
  and `ar`, hero cycling all six, add to cart from a second-row card and from hero slides 4–6

## Phase 6 — Deal reach: the link and the destination page ✅

Added on Gabriel's request (2026-08-01) after reviewing the six-deal homepage, and kept in this
ticket because none of 029 is committed yet.

### 6a — "All {destination} deals and plans" link

- ✅ `hotDealsViewAll` copy updated in `he`/`en`/`ar` — it already existed as the arrow's
  `aria-label`, so this is a reword, not a new key
- ✅ `HeroOfferCard` — link inside each slide, so it names the deal it sits under
- ✅ Slides that are not showing are taken out of the keyboard path (`tabIndex={-1}`) and hidden
  from screen readers (`aria-hidden`). Six slides live in the DOM at once; without this, tabbing off
  the card walks through five invisible destination links
- ✅ `DealCard` — link above the button, and the icon-only arrow beside the button removed. Two
  links to one destination in one card is a duplicate stop for keyboard and screen-reader users, and
  the arrow carried no words of its own
- ✅ `mt-auto` on the link/button block, so a country name that wraps cannot leave one card in a row
  shorter than its neighbours

### 6b — Today's deal on the destination page

The homepage was selling Australia at $8.64 while `/destinations/au` showed $9.40 — and checkout
charged $8.64 either way, because `getActiveDealPrice` resolves the deal server-side. The page was
quoting more than we take, and hiding the discount on the page the deal links to.

- ✅ `getTodayDealsForLocation()` added to `hot-deals.ts` — read-only wrapper over `ensureTodayDeals`
- ✅ `destinations/[slug]/page.tsx` applies the deal server-side: `price` becomes the deal price,
  `originalPrice` keeps the catalog price, `saleBadge` becomes `-X%`
- ✅ A deal may only ever **lower** a price here, the same rule checkout applies
- ✅ The lookup is wrapped in its own try/catch — a deals failure must never take down a destination
  page
- ✅ `destination.fromPrice` now computed from the final prices, so the header and the page metadata
  cannot contradict the card below them
- ✅ `Plan.originalPrice` added (optional). Its presence is the signal to strike a price through, so
  it is never set equal to `price`
- ✅ `PlanCard` renders the struck original beside the price, and turns the price emerald when
  discounted — matching the homepage deal card
- ✅ `DealCard` extracted from `HotDealsSection` into its own file so both pages render one
  component. Two copies would have drifted into two prices for one package
- ✅ On the curated shelf the deal takes the **weekend slot**, presented exactly as on the homepage
- ✅ Whichever tier holds the discounted package is dropped too, so a package is never offered twice
  at two prices on one shelf
- ✅ Curation still runs on **catalog** prices. Tiers are picked by a Pareto frontier, so a deal
  price would let the discounted plan crowd out plans it does not really beat — and the shelf would
  reshuffle at midnight for reasons nobody could see
- ✅ Two new keys, `tierDeal` / `tierDealDesc`, ×3 locales, following the existing tier naming
- ✅ Scope held to the destination page per Gabriel. **Still inconsistent and deliberately left:**
  the "For You" section on the homepage and the single-plan page both still show catalog prices for
  a package on offer

### 6d — Gabriel's browser pass: three corrections ✅

Screenshot of `/he/destinations/fr`. The deal card sat beside two full plan cards and lost the
comparison: it was a teaser, and a teaser on the page it was teasing.

- ✅ **The deal is now a `PlanCard`, not a `DealCard`.** Same data, full card: data, validity,
  network, tethering, top-ups, per-day pill, details button. On a shelf where every neighbour lists
  all of that, the compact card read as the thinnest offer instead of the best one
- ✅ The "all {destination} deals and plans" link goes with it — it pointed at the page it was on.
  It stays on the homepage and in the hero, where it does something
- ✅ The deal treatment moved into `PlanCard` and is driven by `plan.originalPrice`: amber ribbon
  with `-X%` and "only today", amber border, emerald price beside the struck original. So the same
  package looks the same wherever it appears, including in the full catalog below
- ✅ One strip per card. A discounted plan wears the deal ribbon instead of the Best-Seller strip,
  and the floating `saleBadge` pill is suppressed — it would repeat the ribbon's own percentage
- ✅ `[&>*]:h-full` on the wrapper, mirroring `CuratedTierCard` — otherwise the deal is the one card
  in the row that misses the shelf's bottom edge
- ✅ **The Hebrew read as two bare numbers.** `10 GB · 30 ימים` puts a Latin unit inside an RTL
  line, which becomes its own LTR island and lands the two figures side by side with nothing to say
  which is data and which is days. `localizeDataDisplay()` lifted out of `PlanCard` into
  `lib/utils.ts` and applied everywhere a data amount prints beside a duration: `DealCard`,
  `HeroOfferCard`, the hero chip, and the add-to-cart toast
- ✅ `deal` prop dropped from `DestinationDetailClient`, and the `HotDealView` the server built for
  it with it. The discounted plan is found by its `originalPrice`, so the page no longer carries the
  same deal twice in two shapes

### 6c — Verification ✅

- ✅ `/en/destinations/jp` shelf reads `Today's deal | About a Week, Worry-Free | The Full Trip |
  Almost unlimited data | Long Stay` — the weekend tier replaced, nothing duplicated
- ✅ `/he/destinations/au` shows four cards: the deal plus three tiers. One fewer than a no-deal
  destination, because the deal's own package was also a tier and was correctly dropped
- ✅ `/he/destinations/gb` (no deal today) unchanged: five tiers, no strikethrough, weekend tier
  still first
- ✅ One strikethrough on a deal page at first paint — the full catalog sits behind "show all"
- ✅ `npx tsc --noEmit` clean, `npx next build` passes
- ✅ `tsconfig.json` now excludes `agent-workspace`. Ticket backups are copies of source files and
  were being compiled: a backed-up `page.tsx` failed on its own relative import, and the throwaway
  verification scripts had broken `tsc` earlier for the same reason
- ✅ After 6d, re-checked `/he/destinations/{fr,us,jp,de,it}` — deal in the weekend slot, weekend
  tier gone — against `{gb,es,th,tr,gr}` — no deal, weekend tier still first. `/en` and `/ar` on
  `fr` both 200
- ✅ Deal card confirmed carrying ribbon, "only today", one `-X%`, struck original, Hebrew data
  unit, and every detail row through to the details and add-to-cart buttons
- ⬜ **Gabriel's browser pass** on a deal destination and a non-deal one, in all three locales

## Phase 5 — Wrap-up ✅

- ✅ Throwaway verification scripts deleted; their output preserved in `proofs/`
- ✅ `CHANGELOG.md` updated under `[Unreleased]`
- ✅ Ticket 028's open verification items amended from three slides to six
- ✅ Existing functionality confirmed intact: hero, deals row, For You, cart, checkout, admin
- ✅ **Local only.** No commit, no push, no deploy
