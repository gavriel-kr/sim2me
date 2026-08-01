# Ticket 029 — Architectural Design (ADD)

## Principles

- Smallest possible footprint. The engine, the API contract and the card markup all already support
  six; what blocks it is one default value and two hardcoded `slice(0, 3)` calls.
- The profit gate is load-bearing and is not opened, relaxed or bypassed anywhere in this ticket.
- Deal count stays **configuration**, not a constant scattered through components. A component that
  slices the list is a second, invisible source of truth for a number the admin thinks it owns.

## What already supports six

Worth stating, because it determines how small this change is:

| Layer | State |
|---|---|
| `HotDealsConfig.count` | Exists; persisted in `SiteSetting` key `hot_deals_config` |
| Admin API clamp | `clampInt(body.count, 1, 6, ...)` — already accepts 6 |
| Admin UI field | `NumField label="Number of deals" min={1} max={6}` — already accepts 6 |
| Deals grid | `sm:grid-cols-2 lg:grid-cols-3` — six lands as two clean rows, no CSS change |
| API payload | `GET /api/hot-deals` returns whatever `ensureTodayDeals()` yields; no cap of its own |
| Schema | `@@unique([packageCode, dealDay])` — no per-day row limit |

So: no migration, no new route, no new component, no new message key.

## Changes

### 1. `src/lib/hot-deals.ts` — default count

```ts
export const DEFAULT_HOT_DEALS_CONFIG: HotDealsConfig = {
  enabled: true,
  count: 6,   // was 3
  ...
};
```

The persisted `SiteSetting` row, if one exists, still wins — the default only applies where the
admin has not saved a config.

### 2. `src/lib/hot-deals.ts` — second-pass fill (addresses G5)

`generateDeals` currently enforces one deal per `locationCode` in a single pass. With six slots and
eight destinations, one destination without a qualifying package yields five cards and a ragged
second row.

Add a second pass, run **only when the first pass came up short**, that drops the
one-per-destination rule while keeping the one-per-package rule:

- Pass 1 — unchanged: at most one deal per destination. Preserves variety when variety is available.
- Pass 2 — same seeded shuffle, same discount draw, same profit gate; `usedLocations` no longer
  blocks, `usedPackages` still does.

Determinism is preserved: the passes consume the same `rng` in a fixed order, so a given UTC day
still produces a given set.

### 3. `src/lib/hot-deals.ts` — `regenerateTodayDeals` correctness

A pre-existing defect that six makes visible. `regenerateTodayDeals` deletes today's unpinned rows,
then calls `generateDeals`, which builds its `rows` array from empty and seeds `usedLocations` /
`usedPackages` from **yesterday's** pins only. Today's kept pinned rows are invisible to it, so it
can create a further `count` rows on top of them — overshooting the configured count and possibly
placing two deals on one destination. With three slots this rarely surfaced; with six and a small
destination pool it will.

Fix: give `generateDeals` an optional set of already-committed rows for the day, and seed the
counter and both `used*` sets from it. Contained to the one function and its single extra caller.

### 4. `HotDealsSection.tsx` and `Hero.tsx` — stop truncating

```diff
- {deals.slice(0, 3).map((deal) => (
+ {deals.map((deal) => (
```

```diff
- const strip = deals.slice(0, 3);
+ const strip = deals;
```

The server already returns exactly `config.count` deals, so the components rendering the full list
*is* the count being respected. Any slicing here is a second cap that silently disagrees with the
admin.

### 5. `src/app/api/admin/hot-deals/route.ts` + `HotDealsClient.tsx` — ceiling headroom

With the default at 6 and the clamp at 6, the admin can only ever reduce the count. Raise both the
API clamp and the number field to **9** so the control still has a direction to move in. Purely
additive; nothing that currently validates starts failing.

## Deliberately not done

**No auto top-up of an existing day.** The tempting change is to make `ensureTodayDeals` generate
more rows when today already has fewer than `count`. It is wrong twice over: `/api/hot-deals` is
`force-dynamic` and calls it on **every public request**, so on any day where the pool genuinely
cannot yield six, every single visitor would pay for a full pool rebuild and profit-context load
that is guaranteed to fail. And rows include admin-disabled ones, so a top-up rule risks quietly
refilling deals an admin switched off. The existing contract stands: *config applies from the next
generation — tomorrow's rotation, or the admin's Regenerate button.*

**No change to rotation timing.** Six slides at the existing 6 s advance is a 36 s full cycle. Nobody
is expected to watch all six in the hero; the hero is a teaser and the section below is the
inventory. Shortening the interval to compress the cycle would speed up a card that sits directly
under a purchase button, which is exactly where a moving target does damage. `ADVANCE_MS` stays at
6000.

**No mobile "show more".** Decided with Gabriel: all six stack. It avoids a new interactive control
and three new translated strings for a section a visitor scrolls past in two thumb flicks.

## Risk & rollback

- **Risk level R1** — presentation and generation only. No schema change, no auth, no payment path,
  no pricing formula. The worst realistic failure is a homepage section with the wrong number of
  cards.
- The profit gate is the guarantee that six deals cost no more margin per deal than three did. It is
  unchanged and re-verified against real rows in the DIP.
- Rollback: restore the four files from `backup/`, then click Regenerate in the admin. No data
  migration to undo — deal rows are per-day and roll over on their own.
- **Backups are taken from the working tree, not from HEAD.** Ticket 028's changes to `Hero.tsx`,
  `HotDealsSection.tsx` and `HeroOfferCard.tsx` are uncommitted; a `git`-based restore would revert
  028 along with this ticket.

## Files touched

| File | Change |
|---|---|
| `src/lib/hot-deals.ts` | Default count, second-pass fill, regenerate seeding |
| `src/components/sections/HotDealsSection.tsx` | Remove `slice(0, 3)` |
| `src/components/sections/Hero.tsx` | Remove `slice(0, 3)` |
| `src/app/api/admin/hot-deals/route.ts` | Clamp ceiling 6 → 9 |
| `src/app/admin/hot-deals/HotDealsClient.tsx` | Field max 6 → 9 |

Read but not modified: `HeroOfferCard.tsx`, `useDealRotation.ts`, `deals.ts`, `api/hot-deals/route.ts`.
