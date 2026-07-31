# Ticket 028 — Architectural Design (ADD)

> The repo has no `project-standards/architecture.md`. This ADD is written against the
> architecture as observed, following the conventions of tickets 023–025.

## Principle: static assets, one resolver, zero new infrastructure

No new dependency, no schema change, no admin UI, no config change. Everything rests on things
that already exist:

| Need | Existing thing it uses |
|---|---|
| Image optimisation | `next/image` (already used by articles); `sharp` is already installed as a Next.js dependency |
| Serving | `public/` — same-origin, so CSP `img-src 'self'` already allows it and `next.config.mjs` `remotePatterns` is irrelevant |
| Locale | The `[locale]` route segment and `useLocale()` / `getLocale()` |
| Destination identity | `locationCode` — the key everything else in the app is already grouped by |
| RTL | `dir` on `<html>` (set in `layout.tsx`) plus the logical-property conventions already in use |

### Why not the DB

The existing image-upload pattern stores **base64 data URLs inside `site_settings.value`** — that
is how the logo works, and `getSiteBranding()` rewrites them to `/api/site-branding/logo` for
serving. That is acceptable for a 10 KB logo and actively wrong for a library of photographs: it
bloats the row, defeats CDN caching and routes every image through a Node handler. This ticket
does not extend that pattern.

### Why a code map rather than a `FeaturedDestination` column

The featured list is admin-mutable — today it holds exactly eight entries (`AU FR GR DE IT US GB
JP`) out of 225 destinations, and it falls back to the first eight European destinations when
empty. A map with a fallback therefore **cannot break**: add a destination in the admin before its
artwork exists and it simply shows the generic banner. Adding a column would create a nullable
field that means the same thing with a migration attached.

## Layer 1 — assets

```
public/characters/            pair-hero.avif, sima-reacting.avif, simi-cta.avif,
                              destination-generic.avif
public/destinations/skylines/ generic.svg          (per-country versions land later)
agent-workspace/brand-assets/ master library, WebP q95, never served
                              — includes the shelved globe artwork
```

**Cutouts** are produced once by a script (`agent-workspace/scripts/cutout.mjs`) using the
already-installed `sharp`. Two decisions, both forced by measurement rather than preference:

Characters are rendered on **flat saturated magenta**, not studio grey. Grey looks like the safe,
neutral choice and is the wrong one: light-wash denim in shadow measures `rgb(146,146,146)` against
a `rgb(143,143,143)` background, so Sima's jeans are literally the same colour as the backdrop and
no rule can keep them. Nothing anyone wears is near magenta.

The technique is a **border flood fill**, not a global colour key, so that interior regions
matching the background are protected by connectivity rather than by tolerance. A second pass then
clears *enclosed* background pockets — the gaps between Simi's curls, which are genuine background
but unreachable from the border and which glow against a dark page. That pass is size-capped and
uses a tighter colour match, because an unbounded version punches speckles into white linen.

Output is AVIF with alpha plus a WebP fallback, auto-trimmed to the figure: roughly 45–65 KB each.

**Skylines are SVG, not raster.** This follows directly from choosing graphic backgrounds and it
buys three things: a few KB per destination instead of a few hundred; crisp at any size; and —
most usefully — strokes set to `currentColor`, so the artwork inherits whatever colour the site
gives it. If ticket 027 ever resumes and the palette changes, every skyline follows automatically
and nothing is regenerated.

## Layer 2 — the resolver

One module, `src/lib/character-art.ts`, is the single place that answers *which artwork goes here*:

```
resolveCharacter({ slot, locale, locationCode? })
  → { src, alt, character: 'simi' | 'sima', skyline?, flipInRtl }
```

Rules it encodes, so no `if` statements leak into components:

- **Slot → artwork.** The three homepage slots (`hero`, `deals`, `cta`) resolve to the homepage
  story set — one shared outfit, three different poses and reactions.
- **`locationCode` → wardrobe**, currently an empty map, so every destination resolves to the
  generic. Adding a destination later means one entry here.
- **Modesty by locale.** `ar` resolves to a covered variant. Dormant in this ticket: the generic
  wardrobe is covered anyway, and the rule only bites on the summer and beach sets that ship with
  the per-destination work. It lives in the resolver so it cannot be forgotten then.

### Two asset sets, not one

The homepage story forces a split that a single per-destination set cannot express:

| Set | Contents | Rule |
|---|---|---|
| **Homepage story** | Pair presenting the offer (waist-up), Sima reacting, Simi closing | One identical outfit across all three — the page is one continuous moment |
| **Destination generic** | One character, one backdrop, used on all 225 | Season-neutral and place-neutral; full length; deliberately calm |

Framing differs on purpose. Hero art is cropped waist-up because the hero's right column is only
about half of a 1152 px container; two full-length figures there would render faces at roughly
40 px. The destination banner keeps the full-length figure, where there is width to spend.

The resolver still carries a `locationCode` map even though it starts empty, because that is the
seam that turns each future destination into one line plus two assets. An empty map with a working
fallback is not speculative generality here — the fallback is the code path every destination page
actually takes, so it is the path that has to be correct.

### Why locale and not IP geolocation

Vercel exposes `x-vercel-ip-country` and it would be technically easy. It is rejected for three
concrete reasons. It is the wrong signal for this business — the customers are, definitionally,
people who are travelling, so their current IP country says little about them. It makes the HTML
vary by request in a way that undermines CDN caching. And the header does not exist in local
development, so the behaviour could not be properly tested.

## Layer 3 — the component

`src/components/brand/CharacterBanner.tsx` — one composition primitive:

- Renders skyline (SVG, behind) + character (`next/image`, in front) + a `children` slot for text.
- **RTL**: applies `rtl:scale-x-[-1]` to the character. This is safe *only* because the wardrobe
  rules forbid text or asymmetric marks on clothing — a flip must be invisible. Free mirroring is
  the main practical reason the cutout direction was chosen over full-scene images.
- **Performance**: fixed aspect box so there is no layout shift; `priority` on the hero instance
  only; every other instance lazy. AVIF first, WebP fallback.
- `alt` is meaningful for the destination banner and empty for the decorative instances.

## Layer 4 — the hero: presenters and an offer

### The phone mockup is removed

`Hero.tsx:206–285` renders a CSS phone showing the top three hot deals. `HotDealsSection` renders
**the same three deals**, roughly 200 px further down the page, through `DealCard` — with a large
flag, a double-size price, the struck-through original, a per-day pill and a working add-to-cart
button. The hero's copy of them is 10 px text with no action attached.

So the phone is not competing with products and prices; it is the weaker duplicate of them. On top
of that, the same deals are currently represented **three times** in the hero region: the orange
chip near the badge, the phone mockup, and the section itself.

It is also working against the brief. People looking at a phone are looking *down and away*;
welcoming presenters look *at the visitor*. Removing the phone frees the pair to face forward.

**Removing it deletes the single largest technical risk in this ticket** — anchoring an HTML
overlay to a photographed phone screen across viewport sizes. That problem no longer exists.

### What replaces it

One **large, actionable offer card** in a single fixed slot, cycling through the live hot deals —
flag, destination, data and days, a large price with the original struck through, and a real
add-to-cart button for whichever deal is showing. For the first time the hero is buyable.

Cycling is not the phone mistake repeated. The phone showed three deals *simultaneously*, at 10 px,
with no action — a shrunken preview of the section below. This shows one deal at full size with a
working button; the sequence adds reach without adding density. Four rules keep it from becoming a
liability, and each answers a specific known failure of carousels:

| Rule | Why |
|---|---|
| Fixed height, reserved before data arrives | A resizing card next to a button is a CLS and mis-click generator |
| Pause on hover and on focus | Otherwise the card changes under a cursor already travelling to *Add to cart* |
| Honour `prefers-reduced-motion` — no auto-advance, manual only | Motion near a purchase control is exactly where this matters |
| Dots for manual control, and the interval slow (~6s) | An auto-only carousel is unusable if the deal you want just passed |

The transition direction follows writing direction, so it advances outward in both `he`/`ar` and
`en` rather than looking reversed in one of them.

The commerce logic already exists and is shared rather than rewritten: `dealToPlan()`,
`volumeToDisplay()` and the `useCartStore` / `trackAddToCart` wiring all live in
`HotDealsSection.tsx` and get lifted into a shared module so both call sites use one implementation.

The pair stands behind and beside the card, presenting it — Sima's gesture directs toward it. Eye
flow: face → card → price → button.

Because both characters must look like they are genuinely sharing a moment, the hero art is **one
image of the pair**, not two cutouts placed side by side. Two independent cutouts cannot hold a
convincing shared eyeline, and the eyeline is what sells the scene. The resulting rigidity — the
pair cannot be re-spaced responsively — is acceptable because the whole visual is hidden below
`lg` (`hidden lg:flex`, `Hero.tsx:203`). The card floating over their waistline is also what hides
the hard crop edge of a waist-up cutout.

### The globe background, and why it is not in the build

It was built before it was judged, which is the only reason we know it should not ship. The
contrast measurement excluded it from the text column, so its only remaining home was behind the
pair — mostly hidden by an opaque cutout. Tuned faint enough to be safe there, it became invisible
in practice. A decorative layer that costs an asset, a mask layer and 38 KB, and that the reviewer
cannot locate on the page, is not paying for itself.

`.bg-dot-pattern` therefore stays exactly as it is, and `globals.css` is not touched at all.

The technique is still worth recording, because the destination backdrops use it: monochrome line
art applied through CSS `mask-image`, so the asset supplies the shape and CSS supplies the colour.
A palette change then needs no regeneration. `lineart-to-mask.mjs` does the conversion.

## Files

**New:** `src/lib/character-art.ts`, `src/components/brand/CharacterBanner.tsx`,
`src/components/sections/HeroOfferCard.tsx`, `src/lib/deals.ts` (the shared commerce helpers
lifted out of `HotDealsSection`), `agent-workspace/scripts/cutout.mjs`, assets under
`public/characters/`, `public/destinations/skylines/` and `public/brand/`.

**Edited:** `Hero.tsx` — a genuine structural change to the right-hand column, not an insertion:
the phone mockup and the three floating badges come out, the pair and the offer card go in.
`HotDealsSection.tsx` — beat 2, plus its commerce helpers move to the shared module and are
imported back. `CTASection.tsx`, `DestinationDetailClient.tsx` — insertions only.

**Untouched after all:** `globals.css`. Dropping the globe means the hero keeps `.bg-dot-pattern`
and no shared stylesheet is edited.

**Untouched:** everything else. No API, no Prisma, no `next.config.mjs`, no CSP, no admin.

## Rollback

The working tree is clean at `1761d90`, so `git restore .` reverts everything. Per-file backups go
to `agent-workspace/tickets/028-characters-imagery/backup/` before each first edit, matching tickets
021–025. New files are additive and can simply be deleted.

**On restoring the phone mockup:** no feature flag, no commented-out block. The mockup is
`Hero.tsx:206–285` at commit `1761d90` and is recoverable with
`git show 1761d90:src/components/sections/Hero.tsx`. A toggle would be dead code that every future
hero change has to keep working, in exchange for something version control already provides.

## Risk

R1 — presentation only. Removing the phone deleted the ticket's largest risk. What remains is craft
rather than correctness: cutout edge quality around curly hair (proven in Phase 1 on a single
asset), and keeping the headline legible over the globe (proven in Phase 2). The one structural
concern is that `Hero.tsx` is genuinely rebuilt rather than added to, so every ticket-025 behaviour
in that file has to be re-verified individually.
