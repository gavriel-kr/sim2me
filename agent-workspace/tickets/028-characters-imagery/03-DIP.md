# Ticket 028 — DIP

Scope: brand characters Simi & Sima plus destination imagery. Local only. No commit, no deploy.

Risk-first ordering: the two things that can fail are proven on a single asset in Phases 1–2,
before any bulk generation. If either fails, we stop and re-cut the plan having spent one image
instead of nine.

## Gate — before any code

- ✅ Gabriel approves scope (2026-07-31)
- ✅ Simi's summer default — open shirt for `he` and `en`; `ar` fixed to the t-shirt (2026-07-31)
- ✅ Cast locked — Sima `sima-v2`, Simi `simi-v3` (2026-07-31)
- ✅ Style locked — photographic cutout (2026-07-31)
- ✅ Homepage is a three-beat story: both presenting the offer → Sima reacts to the deals → Simi closes. One shared outfit across all three; hero framed waist-up (2026-07-31)
- ✅ Hero treatment — **phone mockup removed**. The pair faces the visitor and presents one large actionable offer card, cycling through the live hot deals. No globe (2026-07-31)
- ✅ Destination backgrounds — graphic line art, therefore SVG (2026-07-31)
- ✅ Master library archived to `agent-workspace/brand-assets/characters/` with a README index
- ✅ Working tree clean at `1761d90`; ticket 027 paused and independent of this work

## Phase 0 — Safety

- ✅ Create `agent-workspace/tickets/028-characters-imagery/backup/`
- ✅ Copy each file into `backup/` immediately before its first edit — `Hero.tsx`, `HotDealsSection.tsx`, `CTASection.tsx` copied before any of them was touched
- ✅ `npm run dev` up; `/he`, `/en`, `/ar` all 200
- ⬜ Record the current hero LCP locally as the baseline (deferred to just before the Phase 7b rebuild, so the measurement is taken against the hero as it will be on the day it changes)

## Phase 1 — Cutout pipeline (risk proof #1) ✅

- ✅ Write `agent-workspace/scripts/cutout.mjs` using the installed `sharp`: border flood fill, alpha channel, 1 px erode, feathered edge, auto-trim, AVIF + WebP
- ✅ Run it on `simi-v3` first — the full curly hair is the hardest edge in the whole set
- ✅ Inspect over light, dark navy and brand green, plus a 2× zoom on the hair; no halo on dark
- ✅ Clear enclosed background pockets — the gaps between curls are real background but unreachable from the border, and they glow on a dark page
- ✅ Confirm Sima's white tee and white sneakers survive
- ✅ Emit AVIF with alpha plus a WebP fallback: Simi 44/81 KB, Sima 65/106 KB
- ✅ **Decision point passed** — with one recipe change, below

### What Phase 1 changed in the plan

**The grey studio background has to go.** Measured, not guessed: pixels inside Sima's light-wash
jeans come back as `rgb(146,146,146)` with zero channel spread, against a background of
`rgb(143,143,143)`. They are not similar to the background, they are the same colour, so the fill
walks in from the hem and eats her legs. No colour rule can separate them — the fix is upstream.

Regenerating her on flat saturated magenta and keying that instead gives a clean cutout with the
jeans fully intact and no coloured fringe in blonde hair. **All future characters are generated on
magenta**, and the README recipe is updated accordingly.

Two lessons worth keeping:

- **Colour distance alone is not a background test.** It must be paired with a second condition —
  neutrality for grey backgrounds (`--grey`), which is what stops the fill eating a tan backpack —
  or simply a background colour no garment can ever be near, which is the whole point of magenta.
- **Verify numerically, not visually.** A downscaled proof sheet showed a convincing halo around
  the hair that did not exist: `sharp` silently promotes a 1-channel raw buffer to three channels,
  so every alpha lookup was misaligned. A tile-coverage map found in one run what eyeballing had
  misdiagnosed twice.

### Known limitation, accepted

Hair still carries a faint grey haze between individual strands — pixels that are genuinely half
hair and half background, which a binary mask cannot represent. Invisible at display size and on
light backgrounds. Proper alpha matting is not worth it here; revisit only if a character is ever
placed on a dark panel at large size.

## Phase 2 — Hero composition (risk proof #2) ✅

The old risk here — anchoring an HTML overlay to a photographed phone screen — no longer exists.
What is left to prove is that the pair reads as presenters and that the globe does not eat the
headline.

- ✅ Generate the hero pose: **Simi and Sima together, waist-up, facing the viewer**, warm and welcoming, with space in front of them for the offer card. No phone
- ✅ Confirm the pair reads as sharing a moment — Gabriel's call, not a measurement (2026-07-31)
- ✅ Cut it out through the Phase 1 pipeline
- ✅ Produce a draft engraved globe: monochrome line work, landmarks and skylines, no fills; converted to a CSS alpha mask by `lineart-to-mask.mjs`
- ✅ Keep the mask cheap: 539 KB at full density, thinned to **38 KB** by raising gamma and cutting near-zero alpha. Both versions are on the preview page to compare
- ✅ Probe on `/he/character-preview`: two globe placements, three opacities, two line densities, four widths, three locales
- ✅ Verify headline contrast — measured with `measure-contrast.mjs`, and it changed the design (below)
- ✅ Judged across 1024–1920 px and all three locales — approved
- ✅ **Decision point passed.** The pair holds the card and a readable face at every width; no fallback to a single character needed
- ✅ **Globe cut from scope** (2026-07-31)

### What the contrast measurement changed, and then what killed the globe

The globe could not sit behind the hero paragraph. Not a preference — the muted subtitle
(`hsl(220 10% 46%)` at 20 px) measures **4.6:1** on the bare hero gradient, barely over the 4.5:1
floor for normal text, so ink of any strength behind it fails; even 6% opacity takes it to 4.2:1.
The headline was never the constraint, holding 13:1 at 18% opacity, which is exactly why judging
this by eye on the headline would have produced the wrong answer.

That left only the area behind the pair, where an opaque cutout covers most of it. Tuned faint
enough to be safe, it turned out to be imperceptible — Gabriel could not find it on the page at all,
and a verified-rendering, correctly-masked, unfindable decoration is not worth an asset and a layer.
Cut. `.bg-dot-pattern` stays, `globals.css` is not touched, and the artwork is archived in case it
ever gets a better home.

## Phase 3 — Resolver ✅

Narrowed on Gabriel's call (2026-07-31): homepage only for now, so the destination map is not written
at all rather than written empty. Adding it later is a second `Record` beside the first.

- ✅ Create `src/lib/character-art.ts` with `resolveCharacter(slot)`
- ✅ Encode the three homepage beats: `heroPair`, `dealsReaction`, `ctaClose`
- ✅ Carry intrinsic width and height per asset, so a box can be reserved before the image loads
- ✅ Type the slots so a typo is a compile error, not a missing image
- ✅ Carry the mirroring rule as **data, not a class**. Sima was drawn looking to her own left, so at the inline start she looks inward in RTL and outward in LTR — LTR is the one that needs flipping, the opposite of the usual `rtl:` reflex. A hardcoded class would have got this backwards in one language

## Phase 4 — CharacterFigure component ✅

Renamed from `CharacterBanner`: with destination backdrops deferred, there is no banner to build.
What the homepage needs is a figure, and naming it for what it does keeps it honest.

- ✅ Create `src/components/brand/CharacterFigure.tsx`: `<picture>` with AVIF then WebP
- ✅ **Not `next/image`** — the cutouts are already AVIF-with-alpha plus a WebP fallback, hand-checked on dark backgrounds. Re-encoding finished art gains nothing, and `next/image` cannot express the AVIF-then-WebP pair for a static asset
- ✅ Box sized from the intrinsic ratio, so the space is reserved and nothing moves when the image arrives
- ✅ `mirror` applied from the resolver's data as `rtl:-scale-x-100` or `ltr:-scale-x-100`
- ✅ `priority` on the hero instance (eager + high fetch priority), lazy everywhere else
- ✅ `alt=""` on every instance, and `aria-hidden` on the wrapper — the characters illustrate copy that already says everything, so describing them would add noise, not information
- ✅ Optional `crop`: show the top fraction of a full-length figure with a gradient fade at the cut. A full-length figure in a narrow column shrinks the face to nothing, which is the entire point of the character; the fade is what stops the crop looking like a sliced photograph

## Phase 5 — Backdrops

Scope cut on 2026-07-31: one generic backdrop, not nine country skylines. Per-destination artwork
ships later, each destination as one unit.

- ⬜ Produce one generic line-art backdrop SVG for the destination banner — travel motifs, no country identifiable
- ⬜ Strokes use `currentColor` so the artwork inherits the site's colours and survives any future palette change
- ⬜ Optimise; confirm it is single-digit KB
- ⬜ Check it mirrored — it must read correctly in RTL
- ⬜ Convert it with `lineart-to-mask.mjs` if it is drawn rather than hand-written as SVG, so the colour still comes from CSS
- ~~Hero globe~~ — cut from scope in Phase 2

## Phase 6a — Homepage story set

All three share **one identical outfit**. This is the constraint that makes the page read as a
single continuous moment rather than three unrelated photos, so it is checked before anything is
wired.

- ✅ Define the homepage outfit once and record it in `brand-assets/characters/README.md` before generating
- ✅ Beat 1 — the pair presenting the offer, waist-up (produced in Phase 2, outfit unchanged, no regeneration needed)
- ✅ Beat 2 — Sima reacting to the deals: pleasantly surprised, one hand fanning. **One gesture only** — two steps further and she becomes a mascot. `sima-reacting-v1`, 77/117 KB
- ✅ Beat 3 — Simi at the closing CTA, relaxed, inviting: straight to camera, thumbs-up. Confidence, not excitement — this beat sits beside a sign-up, where enthusiasm reads as pressure. `simi-closing-v1`, 57/90 KB
- ✅ Both cut through the Phase 1 magenta recipe and checked on navy: curls clean, leg gap resolved
- ✅ All three laid side by side at equal height on the preview page
- ✅ Confirm no two beats repeat a pose — presenting outward, reacting sideways, addressing camera
- ⬜ Gabriel confirms the three beats read as the same people on the same day

## Phase 6b — Generic destination asset

- ⬜ Generate one generic full-length character for the destination banner, locked to the canonical brief in `brand-assets/characters/README.md`
- ⬜ Deliberately calm: quiet presence, no big gesture. It repeats on 225 pages, and a repeated expression stops reading as delight
- ⬜ Neutral wardrobe that does not suggest a season or a place, so it sits correctly on Iceland and Thailand alike
- ⬜ Run it through the Phase 1 pipeline and check it on a dark background
- ⬜ Archive the master to `brand-assets/characters/` and extend the README index

## Phase 7 — Wiring

One placement at a time, each verified before the next.

### 7a — Shared commerce helpers

The hero card and the deals row must add the *same* item to the cart in the *same* way. Two
implementations would drift.

- ✅ Lift `dealToPlan()`, `volumeToDisplay()`, `localizedCountryName()`, `fetchDeals()` and the `HotDeal` type into `src/lib/deals.ts`, plus `HOT_DEALS_QUERY` so the hero and the row share one cache entry and one request
- ✅ The add-to-cart side needs React state, so it became `src/hooks/useAddDeal.ts` rather than being forced into a lib file — cart write, analytics event and toast, moved verbatim
- ✅ Import them back into `HotDealsSection.tsx`; the row is now a pure consumer with no local copies

### 7b — Hero rebuild

Not an insertion. The right-hand column is replaced, so every existing behaviour is re-verified
individually.

- ✅ Back up `Hero.tsx` to `backup/` first
- ✅ Build `src/components/sections/HeroOfferCard.tsx`: one slot cycling through the live hot deals — flag, destination, data, days, large price with the original struck through, working add-to-cart, all through the Phase 7a helpers
- ✅ Remove the CSS phone mockup and the three floating badges — 123 lines out, 21 in. Recoverable via `git show 1761d90:src/components/sections/Hero.tsx` and from `backup/`
- ✅ Place the pair and the card in the right column, card overlapping the waistline — the geometry Gabriel approved on the probe, carried over unchanged
- ✅ **Every ticket-025 behaviour preserved:** destination chips, continue-chip, hot-deal chip, micro-trust row all untouched; only the right-hand column changed
- ✅ Empty state: `HeroOfferCard` returns null with no deals, and the 470 px box holds its height, so the pair still stands and the grid does not collapse
- ⬜ Add to cart from the hero, then from the deals row, and confirm one consistent cart entry

#### The cycling rules, each one guarding a known carousel failure

- ✅ Every slide is in the DOM in one flex track, so the height is the tallest slide from first paint and advancing cannot move anything
- ✅ Auto-advance 6 s, paused on hover and on focus (`onFocusCapture` / `onBlurCapture`, so the button and the dots both count)
- ✅ `prefers-reduced-motion`: no auto-advance at all, and `motion-reduce:transition-none` on the track
- ✅ Dots for manual control, each labelled with its destination name
- ✅ Advance direction follows writing direction — `translateX` is physical, so the sign comes from the locale
- ✅ The add-to-cart acts on `slides[active]`, not on `slides[0]`
- ⬜ Verify in the browser by adding from the second and third slides
- ✅ Screen reader: labelled `role="group"`, and deliberately **no** `aria-live` — announcing an auto-rotating card on every tick is noise, so the correct pattern is a labelled region plus working manual controls

### 7c — Remaining homepage placements

- ✅ `HotDealsSection.tsx` — beat 2, Sima beside the heading rather than inside a card: a person next to a price competes with it, and inside a card she would repeat three times. Cropped to head-and-torso. `id="hot-deals"` anchor untouched
- ✅ `CTASection.tsx` — beat 3, Simi, full length and calm. Absolutely positioned so the centred headline keeps its own geometry, and only from `lg` where the room outside the `max-w-3xl` column actually exists
- ⬜ Scroll the homepage end to end and judge it as one scene, not a parade: same outfit, same light, each beat advancing the last
- ⬜ `DestinationDetailClient.tsx` — **deferred with the rest of the destination work**

### 7h — The characters reach mobile, 2026-07-31

Every beat had shipped with `hidden lg:block`, so below 1024 px the homepage had no characters at all.
The hero's visual column had been hidden below `lg` before this ticket too, so nothing was lost there —
but with `ValueProps` and `TrustStrip` removed, a phone visitor got two fewer sections and nothing in
their place. On a site whose traffic is mostly phones that is the gap that mattered.

- ✅ **`CharacterFigure` can now be sized per breakpoint.** This was the blocker, not the layouts: the
  box was sized by inline `width` and `height`, and a `style` attribute cannot carry a media query.
  Sizing moved to `--fig-h` / `--fig-h-lg` / `--fig-ratio` / `--fig-crop` custom properties read by a
  `.character-figure` class in `globals.css`. Tailwind arbitrary values were the alternative and were
  rejected: they must be static in the source, so every call site would have had to hand-compute its
  own pixel width from the artwork ratio
- ✅ **A bug caught by printing the numbers rather than looking at the page.** The first version
  computed box width as `height × ratio`, but a cropped figure's width follows the *scaled-up* image
  height, so it must be `height / crop × ratio`. At `crop: 0.46` that made the box 54 % too narrow and
  sliced the figure down both sides. Verified the corrected desktop widths against the values the old
  inline styles produced — 211 px and 184 px for the scout and the FAQ figure — so desktop is untouched
- ✅ Hero: pair and offer card stack on a phone, overlap from `lg`. The overlap is what makes them look
  like they are holding the card out, but it is impossible at 375 px where the card alone is 320 px of
  a 343 px column. The card became `w-[min(320px,100%)]` so it survives a 320 px screen
- ✅ The four beside-a-heading beats became `flex-col lg:flex-row`, which puts the figure above the
  heading (or below the FAQ accordion) instead of splitting a narrow screen between figure and text
- ✅ CTA: `lg:contents` on a new wrapper. From `lg` the wrapper generates no box, so both figures still
  position against the section and flank the text exactly as before; below `lg` it is an ordinary flex
  row under the button. One DOM node per character, two layouts, no duplicated `<picture>`
- ✅ **Mobile heights are set by faces, not by available space.** The two CTA figures are full length,
  so a head is about a seventh of the box: at the 150 px the layout would accept, a face lands near
  20 px and turns to mush. They are 250 px, which puts a face back near 35 px and still leaves the pair
  under 200 px wide. Same reasoning raised the lounging pair to 190 px
- ✅ Verified every box against a 288 px content width (a 320 px phone), computed from the rendered
  custom properties rather than estimated: 255, 129, 101, 89, 86 px, and the CTA pair 199 px together

### 7i — The hero column was wider than the phone, 2026-08-01

7h shipped and Gabriel's phone showed the homepage sliced down its left edge: the headline missing its
first word, the search field cut, the pair and the offer card half off-screen. 7h's last check had
measured each figure and found them all comfortably inside 288 px — which was true, and useless,
because it measured the figures and never their container.

- ✅ **The hero grid's own children were 536 px inside a 343 px track.** A grid item defaults to
  `min-width: auto`, meaning it will not shrink below its own min-content, so the item simply
  overflowed the track and the section's `overflow-hidden` hid the evidence. Measured, not guessed:
  text column and headline at `[-177 .. 359]`, search input 448 px wide, the pair at `[-36 .. 218]`,
  the card at `[-69 .. 251]`. `min-w-0` on both columns removes the automatic floor and every box
  returns to `[16 .. 359]`
- ✅ The deal chip's `whitespace-nowrap` became `lg:whitespace-nowrap`. The single-line guarantee 7g
  introduced is right where there is room for it, but the longest deal is wider than a phone, and a
  chip that cannot wrap is precisely the kind of unbreakable content that raises a column's min-content
- ✅ Clean at 375 px and at 320 px: `scrollWidth` equals the viewport, and the only boxes outside it are
  the carousel's two inactive slides and the pre-existing decorative blur circles, all inside
  `overflow-hidden` by design

**Why this was missed, and what now catches it.** Every check to that point was a number computed from
the source — figure widths derived from custom properties — and the failure lived in a CSS default that
no source reading would surface. Three throwaway-proof scripts now exist under `agent-workspace/scripts`
and drive the already-installed Chrome over the DevTools Protocol, with no new dependency, because
Node 24 has a global `WebSocket`:

- `find-overflow.mjs` — lists every element crossing the viewport edge, innermost first
- `probe-layout.mjs` — prints the exact box of the hero's named parts
- `shoot-mobile.mjs` — screenshots at a true phone viewport

The last one exists because of a false alarm worth remembering: `chrome --headless --screenshot
--window-size=375,...` is **not** a phone. Without `Emulation.setDeviceMetricsOverride` the layout
viewport came out 512 px and the PNG was cropped to 375 — which looks exactly like the overflow being
hunted, and briefly suggested the fix had not worked when it had. It also renders lazy images as empty
reserved boxes, so sections below the fold look stripped of their characters unless the shot scrolls
to them first.

### 7g — The deal chip becomes a rotating strip, 2026-07-31

Gabriel's call: the chip under the hero badge should cycle through all of today's deals, not name only
the first.

- ✅ Rotation lifted out of `HeroOfferCard` into `hooks/useDealRotation.ts`, and **shared** by the chip
  and the card. Two independent timers would drift apart within seconds and the hero would contradict
  itself — the chip announcing France while the card sells Japan. One index, one pause state: hovering
  either stops both, which is also the behaviour that keeps the card from changing under a cursor
  already moving toward *Add to cart*
- ✅ `HeroOfferCard` is now presentational, driven by `active` / `onSelect` / `pauseHandlers` props.
  The deal list is sliced once in `Hero` so both views iterate the identical three
- ✅ The chip and the activation badge are **stacked, not wrapped** (`flex-col items-start`). Left to
  `flex-wrap`, the line break depended on how long today's country name happened to be, so the hero's
  opening lines rearranged themselves from one day to the next
- ✅ Only the active deal is in the DOM, keyed on its id so each one remounts and fades in with
  `animate-in fade-in`, the fade utility already used across the UI components. The chip is therefore
  exactly as wide as the deal it shows

  **This replaced a first attempt worth recording.** The chip originally kept all three deals stacked
  in one `inline-grid` cell and crossfaded opacity, which fixed its width at the longest deal from
  the first paint. That was the right answer *while it shared a row with the badge* — there, a
  changing width risks a wrap that drops the headline every six seconds. But a fixed width means
  short deals pay for the long ones in visible empty space, which is what Gabriel spotted. The two
  decisions are one decision: giving the chip its own line removes the reason for the reserved width,
  because there is nothing beside it to push and only its own trailing edge moves
- ✅ Fade here, slide in the card. Not an inconsistency to tidy up later: a slide needs a fixed-width
  viewport, and the point of this change is that the chip's width follows its content

### 7f — Polish pass, 2026-07-31

- ✅ Hebrew CTA heading changed from the singular "מוכן לטייל?" to the plural "מוכנים לטייל?", matching the plural voice the rest of the Hebrew copy already uses
- ✅ Hebrew CTA subtitle likewise: "מצא את ה-eSIM" → "מצאו את ה-eSIM"
- ✅ CTA heading and subtitle forced to centre with `!text-center` — see the root cause below
- ✅ The closing pair moved off the section edges and anchored to the centre, so they stay beside the words instead of drifting to the corners as the window widens. Tightened twice on review, to `calc(50% - 350px)`: each inner edge lands about 230 px from the centre line, leaving roughly 60 px of air beside the headline. That is the practical floor — the `lg:text-5xl` heading reaches about 170 px either side of centre, so any closer and they crowd the words
- ✅ Hebrew CTA badge "התחל את המסע" → "התחילו את המסע כאן", and the button "עיין ביעדים" → "לרשימת כל היעדים". Hebrew only — English has no singular/plural to fix here, and the Arabic heading is still singular masculine while the rest of the Arabic copy is plural, logged below rather than changed unasked
- ✅ Mirroring added to both closing figures so the raised thumb is always on the **outer** hand. Both were drawn with the thumb on their image-left, so whoever stands at the inline start points it inward at the text — and which of them that is swaps with the writing direction, so it is `mirror: 'rtl'` for Simi and `'ltr'` for Sima
- ✅ `HotDealsSection` and `FeaturedPlans` headings switched from `items-end` to `items-center`, so the heading sits on the figure's midline like the recommended-destination one

#### Root cause of the CTA heading not centring — a site-wide bug, not a section bug

`globals.css:236` right-aligns every `h1`–`h6`, `p`, `li`, `td`, `th` and `blockquote` under
`[dir="rtl"]`. As a plain rule outside `@layer`, with specificity `[dir="rtl"] h2` = 0-1-1, it
outranks the `.text-center` utility at 0-1-0. **In Hebrew and Arabic, every heading and paragraph on
the site ignores the centring its own container asks for** — the badge and the button in the same CTA
looked centred purely because they are not `h`/`p` tags, which is what identified the cause.

Fixed with the important modifier in the one place Gabriel reported, and verified in the generated
CSS rather than by eye: `.\!text-center { text-align: center !important; }` is emitted.

The rule itself is left alone deliberately. Wrapping its selector in `:where()` drops it to zero
specificity and fixes the whole site in one line — but it would also un-suppress every `text-center`
that is currently being silently overridden, which is a visual change across every page in two
languages. That belongs in its own ticket with its own review, not smuggled in here.

### 7e — Homepage trimmed, 2026-07-31

Gabriel's call, immediately after seeing the seven beats in place.

- ✅ `ValueProps` ("why travellers choose Sim2Me") removed from the homepage
- ✅ `TrustStrip` removed from the homepage. It repeated the hero's own micro-trust row almost word for word — 200+ destinations, secure payment, 24/7 support — which is exactly why it read as filler
- ✅ Both components left in the codebase and unreferenced, so restoring either is one import and one line. `ValueProps` was reverted to its original state with `git checkout`, so no half-finished edit is left behind
- ✅ The deck-chair pair moved from the deleted value section to beside "today's recommended destination" in `ForYouSection` — arguably a better home anyway, since that section makes a recommendation and they are the picture of taking it
- ✅ Slot renamed `valueLounging` → `forYouLounging`. Typed slots meant the rename was compiler-checked rather than a search-and-replace
- ✅ **Sides re-alternated after the move.** With the value section gone, the daily pick and popular destinations became adjacent, which would have put two figures on the same edge in a row. Simi's scouting moved to the inline start and Sima's curiosity to the end, so the page now zigzags: deals start, daily pick end, destinations start, FAQ end
- ✅ **And the mirror values flipped with them.** Both figures are drawn looking image-right, so moving a figure across the page inverts which language needs flipping. Getting this wrong is invisible in one language and has the character staring off the page in the other

### 7d — Four more homepage beats, requested 2026-07-31

The story grew from three beats to seven figures across six images, on Gabriel's call.

- ✅ `sima-closing-v1` — joins Simi at the CTA, thumbs up. They **flank** the column rather than stand together: side by side they need ~240 px and at 1024 px there are only 128 px between the text and the viewport edge, so they would sit on the headline
- ✅ `pair-lounging-v1` — both in deck chairs over a phone, centred above the "why travellers choose" heading. Wide and seated, turned toward each other, so there is no direction to point in and a side placement would have nothing to look at
- ✅ `simi-scouting-v1` — binoculars, beside the popular-destinations heading, at the inline **end** so the beats alternate sides instead of stacking down one edge
- ✅ `sima-curious-v1` — beside the FAQ accordion, not the FAQ heading: the questions are what she is curious about
- ✅ All four generated on magenta in the locked wardrobe, cut with `--key --despill`, and checked on navy. The deck-chair frame was the real test and it passed: every enclosed gap in the chair skeleton came out clean
- ✅ Wardrobe held across all four, deck chairs included. Swimwear there would read as a different day and break the sequence
- ⬜ Gabriel judges density — seven figures on one page is a deliberate bet on liveliness, and it is the kind of thing that only reads right or wrong on the actual page

**Weight, measured:** 543 KB of AVIF across all seven, of which only the 109 KB hero is eager; the
other six are lazy and below the fold. Worth re-checking against the Phase 0 LCP baseline rather than
assuming it is fine.

## Phase 8 — Verification

- ✅ `npx tsc --noEmit` clean
- ✅ `ReadLints` clean on every touched file
- ✅ `/he`, `/en`, `/ar` all 200 with all six server-rendered characters in the markup, and no phone remnant: `animate-float`, `w-[220px]` and `rounded-[2.5rem]` all gone
- ✅ All seven assets serve 200
- ⬜ `npx next build` passes — deferred until after Gabriel's visual review, so a rejected composition is not built twice
- ⬜ Smoke `/he`, `/en`, `/ar` → 200 for homepage, destinations index, a featured destination, an unmapped destination, a regional bundle
- ⬜ Hero LCP compared against the Phase 0 baseline; if it regressed meaningfully, fix before continuing
- ⬜ RTL pass in `he` and `ar`: characters flipped, skylines readable, no clipping, nothing overlapping the sticky header
- ⬜ Arabic locale never shows a bare-chested character — check every placement
- ⬜ Mobile 375 px and 768 px: hero visual is hidden below `lg`, so confirm the layout is still balanced without it
- ⬜ Accessibility: decorative images have empty `alt`, the destination banner has a meaningful one, and `html.a11y-high-contrast` (which applies `filter: contrast(0.69)` to images) does not wreck them
- ⬜ Regression: `/api/hot-deals` still 200; the hero card and the deals row both show today's real data and both add to cart identically
- ⬜ Headline contrast over the globe measured in all three locales — Hebrew and Arabic type has different stroke weight from Latin

## Phase 9 — Close

- ⬜ Delete the local-only route `src/app/[locale]/character-preview/`, the throwaway `agent-workspace/scripts/probe-pixels.mjs`, and `proofs/`; keep `cutout.mjs` and `zoom-edge.mjs`, which are reusable
- ⬜ Remove the now-dead `heroPhoneHeader` / `heroPhoneSub` keys from all three message files. Left in place for now because they ship in the client payload and cost almost nothing, while keeping the phone one revert away
- ⬜ Update `CHANGELOG.md` under `[Unreleased]`
- ⬜ Update `brand-assets/characters/README.md` with the final index
- ⬜ Summarise: files changed, what to look at, what was deliberately left alone

## Status log

- 2026-08-01: **Deployed to production**, commit `5f31def`, backup tag `pre-deploy-20260801-0133` on `c8f304c`. R0 — three class changes in one component. Post-deploy smoke green: three locales 200 with ten character asset references each, Japan destination 200, `/api/checkout/health` `ok: true` on all five steps, both preview pages 404. The check that matters was re-run against production rather than trusted from local: every hero box now spans `[16 .. 359]` at 375 px in all three locales, and at 320 px the only boxes outside the viewport are the carousel's inactive slides and the pre-existing decorative blurs, all inside `overflow-hidden`. **The lesson is about the previous deploy, not this one.** 7h shipped after verifying each figure fitted a 288 px content width — a true statement that measured the figures and never their container, and every check in it was a number computed from the source. The bug lived in a CSS default no source reading surfaces, and it took a browser to see. Three CDP scripts now exist so that is a one-command check rather than a rediscovery.
- 2026-07-31: **The characters now appear on phones**, which they did not in the first deploy — every beat carried `hidden lg:block`. The real blocker was that `CharacterFigure` sized its box with inline `width` and `height`, and a `style` attribute cannot hold a media query, so sizing moved to custom properties read by a `.character-figure` class. Two things worth keeping: the first version of that class computed width as `height × ratio` and forgot that a cropped figure's width follows the scaled-up image height, which made cropped boxes 54 % too narrow and sliced the figures down both sides — caught by printing the rendered numbers and comparing them against what the old inline styles produced, not by looking at the page. And the CTA pair's mobile height is set by faces rather than by space: full-length figures put a head at a seventh of the box, so the 150 px the layout would happily accept gives a 20 px face. The hero pair and card stack instead of overlapping, the four beside-a-heading beats become columns, and the CTA uses `lg:contents` so one DOM node serves both layouts.
- 2026-07-31: **Deployed to production**, commit `1dd200e`, backup tag `pre-deploy-20260731-2017` on `1761d90`. R1. Post-deploy smoke green: three locales 200 with five characters in the server HTML each, all fourteen assets 200, the new CTA copy present in all three, `/api/hot-deals` returning today's three deals, `/api/checkout/health` `ok: true`, destinations and checkout unaffected, and both preview pages correctly 404. Three things the deploy prep turned up that are worth more than the deploy itself:
  - **`.env.bak` and `.env.local.bak` were tracked in git** and had been since `70f6b9b`, carrying live `RESEND_API_KEY`, `ESIMACCESS_ACCESS_CODE`, `ESIMACCESS_SECRET_KEY`, `NEXTAUTH_SECRET` and three database URLs. `.gitignore` covered `.env` and `.env.local` but not the `.bak` variants. Untracked here and now ignored, which stops further exposure but does not undo it — **the keys still need rotating**, and that is deliberately not in this commit because it touches eSIM, email and auth
  - **`npm run lint` has never linted anything.** There is no ESLint config in the repo and never has been, so the command only offers to create one and exits 1; `next build` prints "Skipping linting" to match. Gate A's lint step has been vacuous for the project's whole life, and `tsc` was used in its place
  - **`npm run build` writes to the production database.** It is `prisma db push` plus two content scripts, and the local `DATABASE_URL` points at the same `db.prisma.io` instance production uses — there is no separate local database. Gate A was satisfied with `npx next build` alone. Vercel runs the full command on every deploy regardless, so this is existing behaviour rather than something this ticket introduced
  - Verifying the build faithfully required setting the two preview pages aside first, since they are in the working tree but not in the commit. That produced 94 static pages against 100 with them present — exactly the six locale URLs that must not be public
- 2026-07-31: **CTA copy aligned across all three locales.** Hebrew had gone plural on its own, which left the closing button saying different things in different languages. English gained "here" on the badge and "See all destinations" on the button; Arabic moved to the plural throughout. The Arabic is a careful best effort and still deserves a native read.
- 2026-07-31: **The hero deal chip now rotates through all of today's deals**, and the rotation is shared with the offer card rather than duplicated — two timers would drift apart in seconds and leave the chip naming one country while the card sold another, so `useDealRotation` owns one index and one pause state for both. The chip's own layout took two passes, and the pair of them is the lesson: reserving the width of the longest deal is correct while the chip shares a row with the activation badge, because a changing width there risks wrapping and dropping the headline every six seconds — but it makes short deals pay in visible empty space, which Gabriel caught immediately. Moving the chip onto its own line removed the reason for the reservation, so it now renders one deal at a time and fits it exactly. Stacking also made the break deterministic: under `flex-wrap` the hero's opening lines rearranged themselves according to the length of today's country name. Also tightened the closing pair to `calc(50% - 350px)`, the practical floor before they crowd the headline, and pluralised the Hebrew CTA subtitle
- 2026-07-31: **Polish pass, and it uncovered a site-wide bug.** The CTA heading would not centre, and the cause was not the section: `globals.css` right-aligns every `h1`–`h6` and `p` under `[dir="rtl"]` with a selector that outranks `.text-center`, so in Hebrew and Arabic no heading anywhere on the site can be centred by its container. The tell was that the badge and the button in the same block *were* centred — they are not `h`/`p` tags. Patched at the CTA with `!text-center` and verified in the generated CSS; the rule itself is logged as its own ticket, because the correct `:where()` fix re-centres headings across every page in two languages at once. Also in this pass: the Hebrew CTA heading went plural, the closing pair moved off the section edges to `calc(50% - 480px)` so they stay beside the words at any width, both of them gained mirroring so the raised thumb is on the outer hand rather than pointing into the text, and the deals and destinations headings moved to the figure's midline.
- 2026-07-31: **Homepage trimmed to five sections.** `ValueProps` and `TrustStrip` dropped on Gabriel's call — the trust strip was repeating the hero's own micro-trust row almost verbatim. Both components stay in the codebase unreferenced, and `ValueProps` was reverted to its original state so no half-edit is left behind. The deck-chair pair moved to beside "today's recommended destination", which suits it better: that section makes a recommendation and they are the picture of taking it. Two consequences that had to be handled together: removing the value section made two character sections adjacent, so the sides were re-alternated into a zigzag, and because both of those figures are drawn looking image-right, moving them across the page **inverted** which language needs mirroring. That is the kind of error that is invisible in one language and glaring in the other. `tsc` and lint clean, three locales 200.
- 2026-07-31: **Four more beats added on request** — Sima joins Simi at the CTA, Simi scouts the destinations through binoculars, Sima reads the FAQ with curiosity, and both put their feet up above "why travellers choose". Seven figures across six images now, all in the locked wardrobe. Three placement decisions worth recording, each forced rather than chosen: the CTA pair flanks the column because side by side they overrun the headline at 1024 px; the deck-chair scene is centred because a seated pair facing each other has no direction to point in; and the FAQ figure is laid out in flow rather than absolutely, because an absolute figure beside a `max-w-3xl` column overruns the container at 1024 px and costs a horizontal scrollbar on the whole page. `tsc` and lint clean, all three locales 200.
- 2026-07-31: **The homepage is live locally with Simi and Sima.** Gabriel narrowed the ticket to the homepage only, so phases 3, 4, 7a, 7b and the homepage half of 7c were done in one pass: four new files (`lib/character-art.ts`, `lib/deals.ts`, `hooks/useAddDeal.ts`, `components/brand/CharacterFigure.tsx`, `components/sections/HeroOfferCard.tsx`) and three edited (`Hero.tsx`, `HotDealsSection.tsx`, `CTASection.tsx`). The phone mockup is gone: 123 lines replaced by 21. `tsc` and lint clean, three locales 200. Two deliberate consequences worth recording: the resolver was narrowed to homepage slots instead of shipping an empty destination map, and `CharacterBanner` became `CharacterFigure` because with backdrops deferred there is no banner to build. One cosmetic side effect of unifying the formatters: the hero deal chip now reads "5 GB" instead of "5GB", matching the deals row 200 px below it. Remaining: Gabriel's visual review, then `next build` and the RTL/mobile/cart passes.
- 2026-07-31: **Phase 6a done — the homepage story set is complete.** Beats 2 and 3 generated on magenta, cut and checked on navy, both in the identical hero wardrobe so the page reads as one continuous moment. All three beats are side by side at equal height on the preview page for the continuity check. Remaining: Gabriel's judgement that they are the same people on the same day.
- 2026-07-31: **Phase 2 closed. Hero composition approved; globe cut.** The pair and card hold up from 1024 to 1920 px in all three locales, so no fallback to a single figure. The globe is dropped — contrast measurement had already barred it from the text column, and behind the pair, at a safe intensity, it proved literally unfindable. `globals.css` now stays untouched, and bespoke assets drop from 6 to 5. **Scope addition:** the offer card cycles through the live hot deals instead of showing only the top one, with fixed height, pause on hover and focus, reduced-motion respect, and manual dots.
- 2026-07-31: **Phase 2 probe built.** Globe drawn, converted to a CSS alpha mask, and thinned from 539 KB to 38 KB. Contrast measured rather than eyeballed, and it moved the globe: it may not sit behind the hero paragraph, because the muted subtitle is already at 4.6:1 with no headroom. Awaiting Gabriel's judgement on placement, opacity, line density and the card position across widths.
- 2026-07-31: Simi re-rendered on magenta, retiring the last grey asset. Both canonical sources are now magenta; the grey renders stay in the library as casting history only.
- 2026-07-31: **Beat 1 sample produced.** Two pipeline fixes came out of it, both consequences of the magenta recipe. On magenta the fill needs no connectivity at all, so `--key` drops every matching pixel wherever it sits — which is what finally cleared the wedge between Simi's legs, an enclosed pocket the border fill could never reach and that the size cap deliberately skipped. And magenta bleeds into curly hair, so `--despill` subtracts it: magenta is red and blue over green, so the weaker of red/blue minus green measures the spill exactly, and skin and blonde hair score zero because their blue sits below green.
- 2026-07-31: **Scope cut, by Gabriel's call.** Per-destination characters and skylines are deferred; this ticket ships the homepage story plus one generic destination banner. Bespoke assets drop from 21 to 6. Two reasons it is the right order: the hard craft problem is the pair holding one shared moment across three beats, and it is better learned on three assets than discovered halfway through eight destinations; and deferring skylines *with* the characters avoids a half-local look. Phase 5 reduced to one generic backdrop, Phase 6b to one generic character, Phase 3 keeps the map but starts it empty.
- 2026-07-31: **Scope approved. Phases 0 and 1 complete.** Cutout pipeline built and proven on both characters; preview at `/he/character-preview`. One recipe change came out of it: characters are generated on saturated magenta, not studio grey, because light denim is pixel-identical to the grey.
- 2026-07-31: Ticket opened. Awaiting Gate approval.
- 2026-07-31: Cast, style, hero treatment and background direction all locked in conversation. Master library archived (14 assets, 2.6 MB WebP).
- 2026-07-31: **Hero redesigned.** The CSS phone mockup is removed: it duplicated the deals row 200 px below it at 10 px with no action attached, and it pulled the characters' gaze down and away from the visitor. Replaced by one large actionable offer card presented by the pair, over an engraved globe. Two consequences — the ticket's largest technical risk (anchoring HTML to a photographed phone screen) is deleted, and `Hero.tsx` becomes a structural rebuild rather than an insertion, so Phase 7 was split into shared helpers, hero rebuild, and remaining placements.
- 2026-07-31: Homepage reframed from "a few placements" to a three-beat story. Consequences folded in: the "never the same character twice per page" rule is suspended for the homepage only; assets split into a homepage story set (one shared outfit) and a destination set; hero framing changed from full length to waist-up so the faces are large enough to carry the warmth. Simi's `he`/`en` summer default set to the open shirt.

## Notes / follow-ups

- **The hero pair is clipped by 14 px per side at exactly 1024 px.** The figure is a fixed 532 px
  centred in a column that is 472 px at that width, and the section's `overflow-hidden` trims the
  difference. Confirmed pre-existing — production measured identically before and after the overflow
  fix — and invisible above about 1100 px. Left alone rather than folded into a deploy that was asked
  to be uneventful; the fix is a smaller figure between `lg` and `xl`.
- **The hero's search button is still singular** — "מצא את ה-eSIM שלך" — while the rest of the page
  has moved to the plural, including "מצאו" in the closing section. It was never flagged, and the
  transcript confirms the earlier "מצא → מצאו" instruction referred to the green CTA section, so it is
  recorded rather than changed.
- **The Arabic CTA heading is singular masculine** (`مستعد للسفر؟`) while the rest of the Arabic copy
  addresses the reader in the plural, the same inconsistency that was just fixed in Hebrew. Not
  changed here because it was not asked for, and Arabic copy deserves a native read rather than a
  mechanical pluralisation.
- **RTL text alignment overrides every centring utility site-wide.** `globals.css:236` right-aligns all
  `h1`–`h6`, `p`, `li`, `td`, `th`, `blockquote` under `[dir="rtl"]` with a selector that outranks
  `.text-center`, so in Hebrew and Arabic no heading or paragraph can be centred by its container. The
  one-line fix is `:where()` around the selector, which drops it to zero specificity and lets explicit
  utilities win. Worth its own ticket, because it will visibly re-centre headings across every page in
  two languages at once. Patched locally at the CTA with `!text-center` in the meantime.
- **The hero subtitle is a pre-existing accessibility problem**, found while measuring for the globe and deliberately not fixed here. `--muted-foreground` at `hsl(220 10% 46%)` gives 4.6:1 against the hero gradient — technically passing, with no margin, and it is used for body text across the whole site, not just the hero. Darkening the token is a one-line change with site-wide visual consequences, so it belongs in its own ticket rather than smuggled into this one.
- **Testimonials with real faces** — the single highest-conversion use of human imagery and it does not exist anywhere on the site. Its own ticket.
- **Ticket 027 (navy palette)** is paused. Deliberately no dependency in either direction: characters wear neutral tones and skylines inherit `currentColor`, so whichever palette wins, nothing here is regenerated.
- **Expanding beyond eight destinations** is purely an asset job once this ships — add to the featured list, generate a wardrobe, add one line to the map. Everything unmapped keeps working.
- **The library is the asset.** Every generated Simi and Sima is kept in `brand-assets/characters/`, including the rejected castings, for campaigns and one-off requests.
