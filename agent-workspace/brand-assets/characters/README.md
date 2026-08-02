# Sim2Me character library — Simi & Sima

Source archive of every generated character asset. **Nothing here is served to the web.**
Web-ready cutouts live in `public/characters/`; this folder is the master library for future
campaigns, new destinations and one-off requests.

All files are WebP q95 (visually lossless, ~1/8 the size of the source PNG). Originals were
1024×1536 PNG.

## The cast (locked 2026-07-31)

**Sima** — European, age 26. Fair skin, long straight sandy-blonde hair worn loose, blue-grey
eyes, soft natural features, warm genuine smile. Signature item: small tan leather crossbody bag.
Canonical file: `sima-v2.webp`.

## The homepage outfit — locked

Every homepage beat uses this exact wardrobe. Not a style preference: if the clothes change between
sections, the page stops being one moment and becomes a set of unrelated stock photos.

**Simi** — plain white t-shirt under an unbuttoned light-blue chambray shirt, sleeves rolled to the
elbow, slim beige chinos, brown leather belt, white sneakers, tan canvas backpack on one shoulder.

**Sima** — oversized beige knit cardigan over a plain white t-shirt, light-wash blue jeans, white
sneakers, small tan leather crossbody bag.

### The homepage beats, in page order

| Slot | Asset | Who and what |
|---|---|---|
| `heroPair` | `pair-hero` | Both, waist-up, presenting the offer card |
| `dealsReaction` | `sima-reacting-v1` | Sima, "wow, that's hot", beside the hot-deals heading |
| `forYouLounging` | `pair-lounging-v1` | Both seated in deck chairs over a phone, beside today's recommended destination |
| `destinationsScout` | `simi-scouting-v1` | Simi with binoculars, beside the popular-destinations heading |
| `faqCurious` | `sima-curious-v1` | Sima intrigued, beside the FAQ accordion |
| `ctaClose` / `ctaCloseSima` | `simi-closing-v1`, `sima-closing-v1` | Both, thumbs up, flanking the closing call to action |

Two rules that are easy to break by accident. **The wardrobe never changes** across these, including
the deck-chair scene — swimwear there would read as a different day and break the sequence. And
**sides alternate** down the page: deals at the inline start, the daily pick at the end, popular
destinations back at the start, the FAQ at the end. Adding or moving a beat means re-checking the
zigzag, and re-checking each figure's `mirror` with it, because the correct value depends on which
side the figure stands.

### The destination pages

A separate set, and deliberately not bound by the homepage wardrobe lock — a destination page is its
own moment, so these are styled for travel rather than for the one homepage afternoon. What does not
move is the cast: hair, face and build are the recognisability anchors and every render here was
produced with `simi-v5-magenta` / `sima-v4-magenta` / `pair-lounging-v1` as the reference.

| Slot | Asset | Who and what |
|---|---|---|
| `destinationSuitcases` | `pair-suitcases-v1` | Both walking with cabin suitcases, laughing |
| `destinationSeatedPhone` | `pair-seated-phone-v1` | Both settled in armchairs over one phone |
| `destinationCheckingPhone` | `pair-checking-phone-v1` | Both standing over a phone, delighted by what they found |
| `destinationSelfie` | `pair-selfie-v1` | Both taking a selfie on arrival |
| `showAllSimi` / `showAllSima` | `simi-pointing-v1`, `sima-pointing-v1` | Each pointing at the "show all plans" button they flank |
| `catalogReaction` | `pair-peering-down-v1` | Both peering down over the divider, gasping at the catalogue that just opened |
| `destinationsListScouting` | `pair-binoculars-v1` | Both on binoculars beside the destinations-index heading |
| `planPriceSimi` / `planPriceSima` | `simi-generic`, `sima-generic` | The plain canonical poses, cropped to head-and-torso beside a plan's price |

The first four rotate: `destinationHeaderPose()` in `src/lib/character-art.ts` hashes the destination
slug, which keeps the choice on the server and spreads the four evenly across the catalogue.

**The pointing pair must never be mirrored.** Simi was drawn pointing to image-left and Sima to
image-right, and they are pinned to the physical left and right of the button rather than to the
inline start and end. That is what makes one arrangement correct in all three languages; add a
`mirror` value and both of them point off the page in one of them.

**Both point down and out, not straight out.** A first version had the arm at shoulder height, which
put the fingertips at 11% and 15% of body height — well above a button standing beside them, and not
even level with each other. Angling the arm down to hip height moved them to 49% and 47%, so a
figure standing on the bottom of a box as tall as itself lands its finger on a vertically centred
button with no per-figure nudging. Reshoot either of them and check that number before shipping.

**`catalogReaction` is framed short and must stay flush to the rule.** It is the one destination
asset that is not full length — waist to mid-thigh, so the faces stay readable in a band that is
only ~170 px tall. That leaves a hard photographic edge along the bottom, which reads as a sliced
photo anywhere except sitting directly on the divider above the catalogue. Do not give it a bottom
margin, and do not centre it in a taller box.

### The rest of the site (ticket 031)

The pages the main menu and the header controls lead to. Same reference rule as the destination set —
`simi-v5-magenta` / `sima-v4-magenta` were the inputs for every render — and the same freedom from
the homepage wardrobe lock, though in practice all four came back in the canonical outfits.

| Slot | Asset | Who and what |
|---|---|---|
| `howItWorksExplaining` | `pair-explaining-v1` | Simi mid-sentence over a phone, Sima following along |
| `calculatorEstimating` | `sima-estimating-v1` | Sima working a number out on a blank notepad, eyes up |
| `helpReassuring` | `pair-reassuring-v1` | Simi's hand on his chest, Sima's palm open in offer |
| `contactWaving` | `simi-waving-v1` | Simi waving hello at whoever is about to write in |
| `genericSimi` / `genericSima` | `simi-generic`, `sima-generic` | The plain canonical poses, on checkout, the account bar, the order confirmation, and the sign-in and register cards |

All four new poses are full length and read badly uncropped in a heading row: at 150 px tall a
two-person full-length pair gives each face about ten pixels. Every one of them is therefore placed
with `crop={0.5}`, which puts the visible box at 150 px while the underlying art renders at 300 and
brings the faces to roughly 40 px. Reshoot any of them and keep the gesture in the top half — the
phone, the notepad, the open palm and the raised hand all sit above 30% of body height on purpose.

The three shared placements reuse `simi-generic` / `sima-generic` under their own slot names rather
than borrowing `planPrice*`. A slot names a placement, not a picture, and the separate names are what
allow checkout to be re-pointed later without touching a plan page.

**Proofs do not go in `public/`.** `cutout.mjs --proof` writes to `proofs/` in this directory. It used
to write beside its output, which is `public/characters`, and twelve QA sheets totalling 10.8 MB
accumulated there before anyone noticed. They have been deleted and the script changed.

## Canonical briefs

**Simi** — Mediterranean / Israeli, age 29. Warm olive skin, full dark curly voluminous hair,
neatly trimmed short beard, dark expressive eyes, broad genuine smile. Signature item: tan canvas
backpack on one shoulder. Shirt worn **tucked into the trousers** — approved as part of his look,
keep it in every new render. Canonical file: `simi-v3.webp`.

They are friends who travel together — each works alone, and they can share a scene.

## Wardrobe rules

- Warm neutral earth tones only: cream, tan, olive, sand, denim, white.
- No strongly saturated colour, so the characters sit correctly on any site palette.
- No text, logo or asymmetric brand mark on clothing — the cutouts get horizontally flipped for
  RTL, and a flip must be invisible.
- Generic phone only, no recognisable device branding.

## File index

| File | Character | Notes |
|---|---|---|
| `sima-v1.webp` | Sima, casting A | Copper-auburn wavy hair, freckles. **Not selected** — kept for campaigns |
| `sima-v2.webp` | **Sima — CANONICAL** | Sandy-blonde straight hair; beige cardigan, white tee, light jeans |
| `sima-v3.webp` | Sima, casting C | Dark chestnut ponytail, reads Mediterranean. **Not selected** |
| `simi-v1.webp` | Simi, casting A | Short curls, olive overshirt. **Not selected** |
| `simi-v2.webp` | Simi, casting B | Straight textured crop, tan jacket. **Not selected** |
| `simi-v3.webp` | **Simi — CANONICAL** | Full curls, short beard; white linen shirt, olive chinos |
| `sima-summer.webp` | Sima casting A | Beach styling on the *unselected* copper casting — superseded |
| `simi-summer.webp` | Simi casting A | Beach styling on the *unselected* casting — superseded |
| `sima-summer-v2.webp` | **Sima — summer** | Modest: swimsuit under long white linen cover-up + sand sarong, straw hat, woven tote |
| `simi-summer-open.webp` | Simi — summer, open | Navy swim shorts, open white linen shirt, bare chest |
| `simi-summer-covered.webp` | Simi — summer, covered | Navy swim shorts, sand t-shirt. Chest covered |
| `style-photoreal.webp` | Style study | Rejected direction — photoreal scene |
| `style-illustration.webp` | Style study | Rejected direction — flat vector illustration |
| `style-cutout.webp` | Style study | **Selected direction** — photographic cutout on a controlled background |
| `sima-v4-magenta.webp` | **Sima — CANONICAL source** | Same styling as `sima-v2`, re-rendered on magenta. The grey version cannot be cut cleanly |
| `simi-v5-magenta.webp` | **Simi — CANONICAL source** | Same styling as `simi-v3`, re-rendered on magenta. The grey version leaves an uncuttable wedge between the legs |
| `pair-hero-v1.webp` | **Homepage beat 1** | The pair, waist-up, both facing the viewer; Sima's open palm presents the offer card. Homepage outfit reference for beats 2 and 3 |
| `simi-pointing-v1.webp` | **Destination pages** | Simi in the canonical outfit, arm down and out to image-left, looking where he points |
| `sima-pointing-v1.webp` | **Destination pages** | Sima in the canonical outfit, arm down and out to image-right, looking where she points |
| `pair-suitcases-v1.webp` | **Destination header** | Both walking towards camera with cabin suitcases; travel styling |
| `pair-seated-phone-v1.webp` | **Destination header** | Both in armchairs sharing a phone, cabin suitcase beside them |
| `pair-checking-phone-v1.webp` | **Destination header** | Both standing over Sima's phone, Simi's fist raised in delight |
| `pair-selfie-v1.webp` | **Destination header** | Both taking a selfie, Sima in a straw sun hat |
| `pair-peering-down-v1.png` | **Destination catalogue** | Both waist-up in the homepage outfit, heads tilted down, delighted gasp. Cut at mid-thigh on purpose |
| `pair-binoculars-v1.png` | **Destinations index** | Both on binoculars: Simi scanning image-right, Sima peeking over hers at the camera |
| `pair-explaining-v1.png` | **How it works** | Simi holding a phone mid-sentence with his free hand open; Sima leaning in to follow. Turned in on each other, so never mirrored |
| `sima-estimating-v1.png` | **Data calculator** | Sima with a blank notepad and pencil, eyes up to image-right, working a number out. Cut at `--tol 55`; anything above 60 removes her mouth |
| `pair-reassuring-v1.png` | **Help centre** | Simi's hand flat on his chest, Sima's arm extended palm-up; both looking image-right |
| `simi-waving-v1.png` | **Contact** | Simi waving at shoulder height toward image-right, phone in his lowered hand |

## Generation notes (for reproducing the cast)

- Always request a **flat uniform saturated magenta (#FF00AA) background**, and spell out: no
  shadow, no gradient, no vignette, no cast shadow on the floor. Never ask for "transparent" — the
  model has no alpha channel, so it *paints* a grey-and-white checkerboard as ordinary pixels.
  Verified: the early files came back PNG colour type 2, RGB with no alpha.
- **Why magenta and not grey.** The grey renders cut badly. Pixels inside light-wash denim measure
  `rgb(146,146,146)` against a `rgb(143,143,143)` background — identical, not merely similar — so
  the cutout eats the jeans and nothing in the script can prevent it. No garment is ever near
  magenta, so keying it is unambiguous, and blonde hair comes out with no coloured fringe.
- Cut out with `agent-workspace/scripts/cutout.mjs`. Magenta renders: **`--tol 60 --grey 0 --key`**.
  Legacy grey renders: defaults, i.e. `--tol 14 --grey 8`.
- `--key` removes every magenta pixel regardless of connectivity, which is the only thing that
  clears enclosed gaps — between the legs, under an arm, between fingers. Despill runs
  automatically with it and takes the magenta bleed out of curly hair.
- Inspect every cutout on a **dark** background before accepting it (`--proof` does this, into
  `proofs/` in this directory), and on hair use `zoom-edge.mjs`. Leftover background is invisible on
  white and obvious on navy.
- **Never raise `--tol` above 60 to chase a fringe. Lips are the first thing you lose.** On
  `sima-estimating-v1` a faint pink tint on the dark panel looked like leftover background, so the
  key was widened to 78. It was not leftover background — it was her hair catching warm light — and
  the wider key opened a hole straight through her mouth, which shipped and had to be reported by
  Gabriel. Measured on that render: the mouth is intact at 40, 55 and 60, loses 60 px at 70, and is
  336 px of nothing at 78. Skin and lips sit closer to magenta than they look.
- **Before widening anything, measure.** Counting pixels where `min(R,B) − G > 55` across the figure
  put the supposed fringe at zero at `--tol 60`. At a threshold sensitive enough to catch a faint
  tint, that render scores 944 — against 2385 for `sima-generic` and 953 for `pair-reassuring-v1`,
  both already shipped and approved. It was ordinary warm skin tone all along.
- If a fringe is genuinely there, it is an *edge* artefact: reach for `--erode 2`, which shaves the
  outline, and never for a wider key, which eats interiors.
- Keep the shipped files inside roughly **60–120 KB AVIF / 100–190 KB WebP**. Full-length pairs
  rendered at 1024×1536 come out well above that; downscaling the master to ~1100 px tall before
  cutting brought `pair-explaining-v1` from 110/178 KB to 68/99 KB with no visible loss at the sizes
  anything is displayed at.
- Framing: three-quarter or full length from mid-calf up, figure centred, soft even studio
  lighting, crisp edges.
- Consistency has survived two full wardrobe changes so far without losing the face, hair or
  build. Hair volume and colour are the strongest recognisability anchors at banner size —
  protect them in every new prompt.
- Always include: no text, no logos, no brand marks.
