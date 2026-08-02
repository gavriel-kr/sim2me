# Ticket 030 — Recommended plans on the single-plan page (PRD)

Requested by Gabriel, 2026-08-02.

## The problem

A plan detail page is a dead end. It shows one package, in isolation, with an add-to-cart button and
nothing else to compare against. Everything the site knows about which package is actually worth
buying — the whole curated shelf, the tier names, the Best-Seller pick — lives on the destination
page and is thrown away the moment a visitor clicks through to a single plan.

That matters most for the people most likely to buy badly. The thinnest packages in the catalogue
are the cheapest, so they sort to the top and get clicked first. Someone who lands on
"1GB/day · 1 day" sees a valid page with a valid price and no signal at all that a 3GB/15-day
package exists two clicks away for a few dollars more. The shelf was built to prevent exactly that,
and it is absent from the page where the decision is actually made.

## What we are building

Under the plan's details, an inviting block headed "recommended for you", carrying **two** cards:

1. **The closest match** — of the destination's four curated picks, the one nearest to the package
   being viewed in data and duration. It answers "if this is roughly what you want, this is the
   version of it we would actually buy."
2. **The main pick** — the destination's Best-Seller, the single tier the shelf stars. It answers
   "and this is what most travellers to this country choose."

Simi and Sima head the block, so it reads as a recommendation from someone rather than as another
row of inventory.

## A bug this uncovers, fixed in the same ticket

The plan detail page loads its package through `getPlanById`, which does not apply the daily hot
deal. A package on offer therefore shows its **catalog price** here while the destination page and
the homepage show the discounted one — and checkout charges the discounted price regardless,
because `getActiveDealPrice` resolves the deal server-side.

So the page quotes more than we take. This is pre-existing, was recorded in ticket 029 as
deliberately out of scope ("the single-plan page still shows catalog prices for a package on
offer"), and Gabriel approved fixing it here. It also has to be fixed here regardless: a
deal-aware recommendation card sitting beside a deal-blind price is a visible contradiction on one
screen.

## Rules

- **The recommendation never contradicts the shelf.** The same package, on the destination page and
  here, is the same tier at the same price. One curation engine, one set of tier names.
- **Never recommend the package being viewed.** If the closest match is the plan on screen, fall
  through to the next candidate.
- **Never show the same package twice.** If the closest match and the Best-Seller are the same
  package, the block shows one card, not two.
- **Silence beats noise.** A destination with too few packages to curate (`buildTiers` returns
  fewer than three tiers) shows no block at all, exactly as its destination page shows no shelf.
- **A recommendation failure must never take down the page.** The extra fetch is wrapped; if it
  fails, the page renders as it does today.
- **Curation runs on catalog prices**, as on the destination page. A deal price would let a
  discounted package crowd out packages it does not really beat, and the recommendation would
  reshuffle at midnight for reasons nobody could see.

## Out of scope

- The "For You" section on the homepage, which still shows catalog prices for a package on offer.
- Any change to the curation targets, the tier set, or the Best-Seller rule.
- Any change to cart, checkout or pricing logic. This ticket reads prices; it does not set them.

## Acceptance

- On a destination with a curated shelf, a plan page shows the block with one or two cards, never a
  duplicate, never the plan being viewed.
- On a destination with no shelf, the plan page is unchanged.
- A package on offer shows the same price on its own page as on the destination page.
- Hebrew, English and Arabic all render the block, correctly mirrored.
- Add to cart still works from the plan page and from a recommendation card.
