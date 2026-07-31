# Ticket 028 — PRD: Simi & Sima — brand characters and destination imagery

## Problem

The storefront has no human presence at all. Verified across the codebase: zero photographs,
zero illustrations of people, no testimonial imagery. Every destination is represented by a
32×20 flag from `flagcdn.com` and nothing else. The hero is pure CSS — a gradient, a dot
pattern, two blurred blobs and an HTML phone mockup. It is fast and it is lifeless.

For a product people buy *because they are excited about a trip*, the site never shows the trip
or the person taking it.

## Goal

Introduce two recurring brand characters and give the featured destinations a sense of place.

- **G1** A fixed cast of two — **Simi** and **Sima** — who carry a small continuous story down
  the homepage and appear once per page elsewhere.
- **G2** Destination pages get one generic character banner — the same on all 225. Per-destination
  artwork is explicitly **out of scope here** and becomes its own follow-up work, one destination
  at a time. What this ticket must deliver is the seam that makes each of those a one-line change.
- **G3** The hero sells. The phone mockup — which shows the same three deals as the section below
  it, at 10 px and with no action attached — is removed, and replaced by a large **actionable**
  offer card that cycles through the live hot deals, one at a time, each with a working add-to-cart.
  Deal data stays real HTML: daily-rotating, translated into three languages, screen-readable,
  never baked into an image.
- **G4** No measurable regression in perceived load speed. The hero is currently near-instant;
  it must stay fast.
- **G5** Correct in all three locales, including mirrored layout for Hebrew and Arabic.
- **G6** Wardrobe respects the audience: the Arabic locale never sees a bare-chested character.
- **G7** The character library survives this ticket — future campaigns reuse the cast rather
  than regenerating it.

## The cast (locked)

**Sima** — European, 26. Fair skin, long straight sandy-blonde hair, blue-grey eyes, warm smile.
Signature: small tan leather crossbody bag.

**Simi** — Mediterranean / Israeli, 29. Olive skin, full dark curly hair, short trimmed beard,
warm smile. Signature: tan canvas backpack.

Friends who travel together. Each works alone; they can share a scene. Wardrobe is warm neutral
earth tones only — no saturated colour — so they sit correctly on any site palette.

Full brief, file index and generation rules: `agent-workspace/brand-assets/characters/README.md`.

## Placement

### The homepage is a story, not a set of appearances

Simi and Sima accompany the visitor down the homepage as a continuous scene:

| Beat | Where | Who | What happens |
|---|---|---|---|
| 1 | Hero | **Both**, together | Welcoming the visitor and presenting today's top offer |
| 2 | Hot deals | Sima | Reacts to the deals — surprised, "the deals are *hot*" |
| 3 | Closing CTA | Simi | Closes the scene |

This deliberately overrides the "never the same character twice on a page" rule that applies
everywhere else. A repeated *pose* reads as stock; a repeated *character with a new reaction*
reads as a scene. The rule stands for the rest of the site.

Two constraints follow from it, and both are load-bearing:

- **One outfit for the whole page.** If Sima wears a cardigan in the hero and a sundress at the
  deals, the eye reads two different days rather than one continuous moment. The homepage
  therefore needs its own wardrobe set, separate from the per-destination one.
- **Hero framing is waist-up, not full length.** The hero's right-hand column is roughly 576 px
  of a 1152 px container. Two full-length figures plus a card there gives each figure about
  200 px of width and a face around 40 px tall — too small to deliver the warmth that is the
  entire point. Cropping to waist-up buys roughly 2.5× the face size in the same space, and the
  offer card floating over their waistline conveniently hides the crop edge.
- **They face the visitor.** People looking at a phone look down and away; presenters look at you.
  This is the second reason the phone goes — it was pulling the characters' gaze away from exactly
  the person they are meant to welcome.
- **The joke stays small.** One raised eyebrow or one hand fanning. Two steps further and the
  characters stop being people and start being a mascot.

### Hero background — dropped, after building it

An engraved-line globe was drawn, masked and put on the preview page. It is not shipping. Two
findings killed it and both only appeared once it existed. The contrast measurement barred it from
the text column, leaving only the area behind the pair — where the opaque cutout covers most of it.
And at an intensity weak enough to stay out of the way it is genuinely imperceptible: Gabriel could
not find it on the page, which is the clearest possible verdict on a decorative layer.

The hero region is also already the densest on the site — gradient, dot pattern, two blur blobs,
badge, deal chip, headline, subtitle, search, destination chips, trust row, the pair and the offer
card. "World" is carried by the flags, the destination names and the pair. The existing dot pattern
stays.

The artwork is archived, so reviving it costs nothing but a decision.

### Elsewhere

| Where | Who | Notes |
|---|---|---|
| Destination page header | One generic character, one generic backdrop | Identical on all 225 destinations |

**The generic asset is calm on purpose.** It appears on every destination page, and an expressive
gesture repeated a few hundred times stops reading as delight and starts reading as wallpaper —
spending exactly the energy we want available on the homepage. Expression lives in the story
beats; the destination banner is quiet presence.

**Deliberately excluded: plan cards.** They must stay dense and scannable. A face inside a card
competes with the price and the data allowance, which is what actually converts. A character
next to the row delivers the same warmth at none of that cost.

## Non-goals

- **Photographic destination backdrops.** Backgrounds are graphic line art, chosen for weight,
  consistency and because they can inherit the site's colours.
- **Admin-managed imagery.** These are brand assets that change once a year, not content. A code
  map with a fallback is the right shape; no schema change, no upload UI.
- **Geo-detection.** Wardrobe varies by locale, not by the visitor's IP country. Reasoning in the
  ADD.
- **Testimonials.** A section with real customer faces is a strong idea and its own ticket.
- **The palette.** Ticket 027 stays paused. Nothing here depends on it — that is by design.
- **Per-destination characters and skylines.** Deferred deliberately, and deferred *together*: a
  Greek skyline behind a character dressed for an autumn city street looks worse than a neutral
  backdrop does. Each destination later ships as one unit — its skyline, its character, one line
  in the map. This also postpones the modesty wardrobe problem, which only bites on the summer and
  beach destination sets.

## Success criteria

- Simi and Sima appear in the four placements, correct per locale, in `en`, `he` and `ar`.
- Every destination page shows the generic banner, including regional bundles whose code is not a
  two-letter country code.
- The hero offer card shows a real, translated, screen-readable deal and adds to the cart
  identically to the deals row below it.
- Read end to end, the homepage reads as one continuous scene: same outfit, same light, each beat
  advancing the previous one.
- Hero LCP does not regress meaningfully against the current CSS-only baseline.
- Layout mirrors correctly in RTL, with the character flipped and no clipping.
- `npx tsc --noEmit`, lint and `npx next build` all clean.

## Risk

R1. Presentation only — no auth, payment or order path is touched. The overlay risk is gone with
the phone. What remains is craft: keeping one face recognisably the same across every pose, and
keeping the pair's shared eyeline convincing in the hero.
