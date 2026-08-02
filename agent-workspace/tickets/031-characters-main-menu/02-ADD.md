# Ticket 031 — Architectural Design (ADD)

> The repo still has no `project-standards/architecture.md`. This is written against the
> architecture as observed, and specifically against the character system ticket 028 built and
> ticket 030 last extended.

## Principle: a third map, four insertions, no new machinery

Ticket 028 already answered every structural question this ticket could ask. There is a resolver
(`src/lib/character-art.ts`), a component (`CharacterFigure`), a production pipeline
(`cutout.mjs`), an asset convention (AVIF with alpha plus a WebP fallback, served from `public/`)
and a written rule for mirroring. This ticket adds art and four call sites. It adds no mechanism.

| Need | Existing thing it uses |
|---|---|
| Slot → artwork | `character-art.ts`, which already holds two maps |
| Rendering | `CharacterFigure` — has no `'use client'`, so it drops into a server page unchanged |
| Sizing | `--fig-h` / `--fig-h-lg` in `globals.css`, already responsive |
| RTL | The `mirror` field, plus the logical `start`/`end` utilities the CTA section already uses |
| Asset production | `agent-workspace/scripts/cutout.mjs`, magenta key, unchanged flags |

`CharacterFigure` having no `'use client'` matters more than it looks. Three of the four target
headings live in **server** components (`how-it-works`, `help`, `contact`). If the component were
client-only, each of those pages would need a client boundary introduced purely to hold a decorative
image. It does not, so all three stay server components.

## The third map

`CharacterSlot` is today `HomepageSlot | DestinationSlot`. This adds `SiteSlot`:

```
export type SiteSlot =
  | 'howItWorksExplaining'
  | 'calculatorEstimating'
  | 'helpReassuring'
  | 'contactWaving';

export type CharacterSlot = HomepageSlot | DestinationSlot | SiteSlot;
```

A third map rather than four more entries in `HOMEPAGE`, because the two existing maps are not
arbitrary buckets — each carries a rule. `HOMEPAGE` is governed by the alternating-sides rhythm and
the wardrobe lock; `DESTINATION` is governed by travel styling and the slug-hash rotation. These four
pages obey neither. Filing them under either map would put art in a group whose rules do not apply to
it, and the next person to add a homepage beat would find four slots that are not part of the
sequence they are trying to preserve.

`resolveCharacter` currently does `slot in HOMEPAGE ? … : DESTINATION[…]`. With three maps that
ternary stops being readable, so it becomes a single merged lookup built once at module load. Same
behaviour, no per-call cost, and adding a fourth map later is one line.

## Wardrobe: the homepage outfit, and why

The README locks one outfit across the homepage and deliberately frees the destination set to travel
styling. These four pages are neither, so the rule has to be decided rather than inherited.

They get **the locked homepage outfit**. A destination page is a specific trip and can dress for it.
"How it works", "Help" and "Contact" are the site talking about itself in its own voice — the same
voice the homepage speaks in — and a visitor moves between the homepage and these pages constantly
through the menu. Different clothes on either side of a menu click would read as a different day, the
exact failure the homepage lock exists to prevent, now stretched across the whole navigation instead
of down one page.

The Calculator is the interesting case, because it is a tool rather than a piece of the pitch. It
still gets the same outfit: it is one menu click from the homepage like the rest, and a lone wardrobe
exception would be noticed and not understood.

## Layout: the centred-heading problem

The site has two heading shapes, and the existing character placements only solve one of them.

**Left-aligned headings** — `/destinations` and the destination detail pages. Text block at the
inline start, figure at the inline end, `flex-col` collapsing to `sm:flex-row`. Solved, working, and
not what these four pages look like.

**Centred headings** — all four pages in this ticket:

```69:72:src/app/[locale]/how-it-works/page.tsx
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
```

Putting a figure at the end of that flex row centres *the cluster*, which means the heading itself is
no longer centred on the page — it sits visibly left of centre with a person filling the gap on the
right. On a page whose entire layout is a centred column, that reads as a mistake rather than as a
design.

**The pattern used instead** is the one `CTASection` already established: the heading block keeps its
own centring untouched, and the figure is taken out of the flow and positioned against the section
from `lg` up.

```
<div className="relative">
  <div className="text-center max-w-2xl mx-auto">…unchanged h1 and subtitle…</div>
  <CharacterFigure
    slot="…"
    height={…}            /* phone */
    heightLg={…}          /* desktop */
    className="mx-auto mt-6 lg:absolute lg:bottom-0 lg:end-0 lg:mt-0"
  />
</div>
```

Three things fall out of this and each is deliberate:

- **The heading markup is not touched.** Adding `relative` to a wrapper and appending a sibling is an
  insertion. None of the four `h1` elements, their classes, their translation keys or their CMS
  overrides change, so nothing that currently renders can regress.
- **`end-0`, not `right-0`.** The logical property flips with writing direction on its own, so the
  figure sits on the outer side of the column in all three locales without a single conditional.
- **Below `lg` the figure is in the flow, centred, under the subtitle.** Not beside it. At 375 px
  there is no room beside a heading for anything, and forcing it produces either a 60 px face or a
  two-word-per-line heading. This is the same decision `FAQSection` and `CTASection` already made.

`/data-calculator` is the one exception to the insertion rule, and only in where the code goes. Its
`h1` lives inside `DataUsageCalculator`, a client component that is **also** used in `compact` mode
inside a dialog on destination pages. The heading is already wrapped in `{!compact && …}`, so the
figure goes inside that same guard — the dialog is untouched by construction, not by a new condition.

## Mirroring

Each figure stands at the inline end of the column and is drawn looking and gesturing toward
**image-right**. That gives `mirror: 'ltr'`, identical to `faqCurious`, and the reasoning is the same
one already written down in the resolver: at the inline end, RTL puts the figure on the left of the
column where looking right is looking inward, and LTR puts it on the right where looking right is
looking off the page — so LTR is the direction that needs the flip.

Choosing the same side and the same gaze direction for all four is itself the decision. The homepage
zigzags because it is one continuous scroll and a column of figures all on one side would look like a
margin ornament. Four separate pages have no scroll relationship to each other, so consistency is
worth more than variety: whichever menu item a visitor picks, the pair is in the same place.

## Assets

Four new renders, produced the way every existing one was:

- Flat saturated magenta `#FF00AA`, explicitly no shadow, no gradient, no vignette. Never "transparent" — the model has no alpha channel and paints a checkerboard as ordinary pixels
- Reference `simi-v5-magenta` / `sima-v4-magenta` so the faces stay the same people
- Homepage outfit, spelled out in every prompt, including Simi's shirt tucked in
- No text, no logos, no brand marks, generic phone only — a flip has to be invisible
- `cutout.mjs --tol 60 --grey 0 --key`, proofed on a dark background before acceptance
- AVIF plus WebP into `public/characters/`, `{who}-{pose}-v1.{avif|webp}`, master into
  `agent-workspace/brand-assets/characters/`

Expected weight, from the eight comparable assets already shipped: 40–110 KB per format, pairs
heavier than singles. Two pairs and two singles here, so roughly **250–350 KB of AVIF** added to
`public/`. Anything materially above that gets downscaled before cutout, the way `pair-peering-down`
was when its first render came back at 244 KB.

**A note on the `-proof.png` files, raised for the third time.** `public/characters/` currently ships
twelve of them, about 10.8 MB, referenced by no code. They are QA artefacts that were written to the
served directory instead of the workspace. This ticket will add four more unless the convention
changes. Proposal, needing one word from Gabriel: write proofs to
`agent-workspace/brand-assets/characters/proofs/` and delete the twelve. It is a `git rm` and a
one-flag change to `cutout.mjs`, and it takes 10.8 MB out of every deploy.

## Files

**New:** four asset pairs under `public/characters/`, four masters under
`agent-workspace/brand-assets/characters/`.

**Edited:**
- `src/lib/character-art.ts` — the `SiteSlot` union, the `SITE` map, the merged lookup
- `src/app/[locale]/how-it-works/page.tsx` — wrapper + figure, server component
- `src/app/[locale]/help/page.tsx` — wrapper + figure, server component
- `src/app/[locale]/contact/page.tsx` — wrapper + figure, server component
- `src/components/sections/DataUsageCalculator.tsx` — wrapper + figure inside the existing
  `{!compact}` guard, client component
- `agent-workspace/brand-assets/characters/README.md` — a fourth table, and the wardrobe decision

**Untouched:** `CharacterFigure.tsx`, `globals.css`, `Header.tsx`, `lib/navigation.ts`, the homepage
and its six beats, the destinations index, destination pages, plan pages. No API, no Prisma, no
`next.config.mjs`, no CSP, no admin.

## Rollback

The working tree is **not** clean — everything from 2026-08-01/02 (tickets 028 Phase 7j and 10, and
all of 030) is still uncommitted, so `git restore .` would take that with it and is not the rollback
path here. Per-file backups go to `031-characters-main-menu/backup/` copied **from the working tree**
before the first edit, the same precaution ticket 030 took and for the same reason. New assets and
new map entries are additive and can be deleted.

## Risk

**R0 — presentation only.** No data path, no money path, no auth, no schema. The whole changeset is
one type union, one map, four JSX insertions and eight image files. The realistic failure modes are
craft, not correctness: a figure that overlaps a heading at some width between 375 px and `lg`, a
`mirror` value that is right in Hebrew and wrong in English, and a cutout with a magenta fringe in
curly hair that is invisible on white and obvious on the footer. Each has a verification step in the
DIP.
