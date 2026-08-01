# Ticket 029 — PRD: Six daily hot deals

## Problem

The homepage ships **three** hot deals a day. On desktop that is a single row of three cards in a
section that owns a full band of the page — heading, character, gradient, "only today" badge — and
then delivers one row. The offer looks thinner than the presentation around it.

The same three are also the entire rotation of the hero: the deal chip under the activation badge
and the offer card Simi and Sima present both cycle the identical three-item list. A visitor who
lands, reads the hero and scrolls past the deals section has been shown three products, twice.

Three is not a considered number. It is the default that shipped with ticket 024 and was never
revisited once the engine proved it could hold the profit floor.

## Goal

Six daily deals, three per row, shown consistently everywhere deals appear.

- **G1** Six deals generated per UTC day instead of three.
- **G2** The deals section renders all six: two rows of three on desktop, the existing responsive
  grid unchanged.
- **G3** Every surface that shows deals shows the same six — the hero chip, the hero offer card and
  the deals row rotate and render one list, never a truncated view of it.
- **G4** **The profit gate is untouched.** No deal ships below the configured net-profit floor. More
  deals must not mean cheaper deals or thinner margins.
- **G5** Six candidates are found reliably. Today there are only eight featured destinations and the
  engine allows one deal per destination, so six slots out of eight is tight: a single destination
  with no qualifying package leaves a half-empty second row.
- **G6** Correct in `he`, `en` and `ar`, including mirrored layout, and on mobile where six cards
  stack into one column.
- **G7** The admin stays in control: the count remains configurable and the existing pin / disable /
  regenerate actions keep working against a six-deal day.

## Non-goals

- **No change to the discount itself.** The 5–10% range, the rounding, the `originalPrice` baseline
  and the `-X%` label all stay exactly as they are.
- **No change to checkout or pricing.** `getActiveDealPrice` and the create-transaction hook are not
  touched.
- **No new deal surfaces.** Destination pages, the cart and the plan pages are out of scope.
- **No schema change and no new dependency.**
- **No new copy.** The section heading, subtitle and "only today" badge already work for six.

## Decisions taken with Gabriel (2026-08-01)

| Question | Decision |
|---|---|
| How many deals rotate in the hero? | **All six.** Not a truncated three. |
| How do six render on mobile? | **All six**, stacked. No "show more" control, no second column. |
| Process | Own ticket. Tickets 026 and 027 moved to `_paused/` — they were plans with no code. |

## Known risk, carried deliberately

The candidate pool is **eight featured destinations** (AU, FR, GR, DE, IT, US, GB, JP). Six deals a
day means three quarters of the featured set is discounted at any moment, and tomorrow's rotation
will land on largely the same countries — which erodes the "only today" premise the section is built
on. The fix is not code: widen the featured list to roughly 12–15 destinations in the admin. Flagged
here so the decision is recorded rather than discovered later.
