# Ticket 031 — Detailed Implementation Plan (DIP)

Status icons: ⬜ open · ✅ done

## Gate — before any code

- ✅ **Gabriel approved and asked to proceed** (2026-08-02), adding `/checkout`, `/account` and the
  order-confirmation page, and asking not to be handed the two open decisions. Both are therefore
  taken below rather than deferred
- ✅ **Decision A — the `-proof.png` files: move them out.** Twelve, ~10.8 MB, in `public/characters/`
  and referenced by no code. `cutout.mjs` writes `<out>-proof.png` beside its output, and the output
  goes to `public/`, so the served directory fills with QA artefacts by construction. The script's
  proof path moves to `agent-workspace/brand-assets/characters/proofs/` and the twelve are deleted.
  Chosen over leaving it because the alternative is adding four more to a pile already three times
  flagged, and because nothing references them, which makes it the rare cleanup with no failure mode
- ✅ **Decision B — the two menu defaults are made to agree.** The Calculator is added to
  `DEFAULT_NAV_MENU`. One line. It removes a trap where the first admin save silently drops a live
  link, and this ticket cannot define "every main-menu page" while the menu is two different lists
- ✅ Tickets 026 and 027 checked: both still in `_paused/`, both with an entirely unticked DIP, so
  neither expects anything from this one. **027 overlaps on files, though** — the navy-palette repaint
  lists `how-it-works`, `contact/page`, `DataUsageCalculator`, `CheckoutClient`, `AccountClient` and
  `SuccessClient` among ~28 storefront components to restyle, and all six now contain a character
  block that was not there when 027 was written. Nothing conflicts today; whoever restarts 027 should
  re-read those headings first. 026 touches `AccountClient` only for a hardcoded support address,
  nowhere near the header bar
- ✅ **The tree is still uncommitted.** 028 Phase 7j, 028 Phase 10 and all of 030 are unpushed, and
  this ticket lands on top of them. Phase 0's backups are the only per-file rollback that exists

## Phase 0 — Safety and the before-state ✅

- ✅ `agent-workspace/tickets/031-characters-main-menu/backup/` — 11 files
- ✅ Copied **from the working tree**, before first edit. Beyond the planned list this also covers
  `navigation.ts`, `cutout.mjs`, and the three transactional clients added to scope
- ✅ Baseline HTML captured for all nine pages in `he`. `/he/account` answered 307 — it redirects to
  the login screen for an unauthenticated fetch, which is correct and is why that page could not be
  diffed later either
- ✅ `public/characters/` before: **46 files, 13.8 MB**
- ✅ `npm run dev` up; eight of nine pages 200, account 307 as above

## Phase 1 — Prove the two "already done" pages really are done ✅

- ✅ Homepage renders five figures in the served markup — `pair-hero`, `simi-scouting-v1`,
  `sima-curious-v1`, `simi-closing-v1`, `sima-closing-v1`. `forYouLounging` and `dealsReaction` are
  behind conditional sections and do not appear in a cold fetch, which is existing behaviour
- ✅ `/destinations`: `pair-binoculars-v1` is **not** in the server HTML. It is wired into the route's
  client chunk and renders after mount, and the Phase 0 baseline — captured before any edit — has no
  binoculars either. Pre-existing, not caused here, and left alone
- ✅ Both pages diffed identical to baseline after all of this ticket's work, on stripped markup

## Phase 1b — The three transactional pages, on art that already exists ✅

- ✅ Slots named `genericSimi` / `genericSima`, not `checkoutSimi` — they serve three pages, so a
  checkout-specific name would have been wrong on two of them
- ✅ **`/checkout`** — one insertion. The `h1` is now the first child of a `flex items-end
  justify-between` row with the pair as the second. `items`, `step`, Turnstile, `create-transaction`
  and the Paddle handler are byte-identical to the backup
- ✅ Empty-cart branch untouched
- ✅ **`/account`** — pair at the end of the header row, `shrink-0 self-end`. Sima is `hidden sm:block`:
  both figures beside the 56 px avatar leave a 375 px row about 130 px for the name and email, which
  truncates an ordinary address to nothing. Simi alone leaves close to 190 px
- ✅ **`/success`** — the `completed` branch only. `activating` and `failed` get nothing
- ❌ **The pre-release 375 px sweep caught a real bug, and it was not on any page this ticket added.**
  A plan page for a package on offer pushed the document to 394 px against a 375 px viewport, which
  shifted the header, the footer and the cookie banner sideways. 028 put the pair in the price row;
  030 started printing the struck-through original beside the deal price; neither could give way, so
  the row measured 378 px inside a 343 px card. Fixed with `min-w-0 flex-wrap` on the price block and
  116 px figures on phones. It hid because a plan page *without* a deal never showed it — so it would
  have reached production on exactly the pages hot deals send traffic to. The lesson for future
  sweeps: test the discounted state, not the default one
- ✅ **`/account/login` and `/account/register`**, added 2026-08-02 on Gabriel's request. Originally
  excluded on the "don't touch auth" rule; he asked for the sign-in page directly, which settles it.
  Register comes along because the two are one screen with a toggle to a visitor, and characters on
  one but not the other reads as a bug. The figures sit **above** the card, so `AccountLoginClient`
  and `AccountRegisterClient` — which hold the credentials form, the OTP step and Turnstile — are not
  touched at all. Verified after: 2 form inputs on sign-in, 6 on register, unchanged
- ✅ **All three verified in a real browser** — see Phase 5. Each branch was reached honestly rather
  than approximated: checkout with a cart seeded into `localStorage`, success with its order endpoint
  stubbed in the page, account with its profile endpoint stubbed. Screenshots in `proofs/`
- ✅ Sizes computed from the `.character-figure` formula rather than guessed: checkout 73×92 per
  figure on a phone, account 62×74, success 67×200. All fit 343 px of usable width

## Phase 2 — The art ✅

All four came back on the first prompt — cast, wardrobe, flat magenta, no shadow. Generated as a
batch of two then two rather than strictly one at a time.

- ✅ **`howItWorksExplaining`** — `pair-explaining-v1`, 580×998
- ✅ **`calculatorEstimating`** — `sima-estimating-v1`, 450×1358. Notepad blank, as briefed
- ✅ **`helpReassuring`** — `pair-reassuring-v1`, 709×979
- ✅ **`contactWaving`** — `simi-waving-v1`, 641×1377
- ✅ Cut with `--tol 60 --grey 0 --key --proof`; all four proofs read clean on the dark panel
- ❌ **`sima-estimating-v1` was cut wrong and shipped that way. Gabriel found it.** A faint pink tint
  on the dark proof was read as leftover background, so the key was widened to `--tol 78`. That was
  the wrong diagnosis and the wrong tool: the tint was her hair catching warm light, and the wider
  key cut a hole clean through her mouth. It reached the page looking like her lips had been erased
- ✅ **Fixed by measuring instead of guessing.** Re-cut at 40 / 55 / 60 / 70 and counted transparent
  pixels inside the head outline: 0 at 40, 55 and 60; 60 px at 70; 336 px at 78. Magenta remnants
  were 0 at *every* tolerance including 40 — so the fringe that started this never existed. Shipped
  at `--tol 55`, a clear margin below where damage begins. Face verified zoomed on white, navy and
  brand green, and again on the live page
- ✅ Written into the README as a rule, because the mistake is an inviting one: a wider key looks like
  the obvious fix for a fringe, and skin and lips sit closer to magenta than they appear. A real
  fringe is an edge artefact and takes `--erode`, never a wider key
- ✅ Both pairs came out over the size band at 1024×1536 (110/178 KB and 119/189 KB). Masters
  downscaled to 1120 px tall and re-cut: 68/99 KB and 73/106 KB. Final four: 63–78 KB AVIF,
  99–118 KB WebP
- ✅ Masters in `brand-assets/characters/`, cutouts in `public/characters/`, proofs in
  `brand-assets/characters/proofs/`
- ✅ Intrinsic dimensions read from the cut files, not from the prompt

**Gaze, and one correction to the plan.** Three of the four look image-right as briefed and take
`mirror: 'ltr'`. `pair-explaining-v1` does not: Simi looks at Sima and Sima looks down at the phone,
so the pair is turned in on itself and has no outward direction. It is left unmirrored, which is the
same call the four destination header poses get.

## Phase 3 — The resolver ✅

- ✅ `SiteSlot` union added; `CharacterSlot` is now a union of three
- ✅ `SITE` map with six entries — the four new poses plus the two generic ones
- ✅ `resolveCharacter` now reads one `ALL_SLOTS` table built at module load, instead of the two-way
  ternary that a third map would have turned into an unreadable chain
- ✅ No existing export changed shape
- ✅ `npx tsc --noEmit` clean

## Phase 4 — The four placements ✅

Each heading became a centred flex row: the existing text block untouched inside a wrapper, figure as
a second child. Stacks on a phone, side by side from `sm`. No `h1`, heading class, translation key or
CMS override touched — `/help`'s `cms?.title || t('title')` is byte-identical.

- ✅ `/how-it-works`
- ✅ `/help`
- ✅ `/contact` — inside the gradient hero
- ✅ `/data-calculator` — **not** inside the `{!compact}` guard as planned. That guard was the wrong
  seam: the full heading also renders inside a destination page and inside the usage modal, both of
  which would have picked up the figure. A `withCharacter` prop, off by default, passed only from the
  standalone page route, is what actually scopes it
- ✅ Compact calculator on a destination page shows no figure — it is a different prop path entirely
- ✅ **Sizes revised upward after measuring.** The first pass used the destination-index numbers
  (132 px, no crop), which suited an already-cropped wide pair. These four are full length: at 132 px
  tall, `pair-explaining` renders 77 px wide for two whole people, roughly a ten-pixel face. All four
  moved to `crop={0.5}` at 148–150 px, which puts the underlying art at ~300 px and faces at ~40 px,
  in line with `destinationsScout` and `faqCurious`. Every gesture — phone, notepad, open palm,
  raised hand — sits in the top half, so the crop keeps the thing that makes the pose mean something

## Phase 4b — The two decisions ✅

- ✅ `cutout.mjs --proof` now writes to `brand-assets/characters/proofs/`, resolved from the script's
  own location. Verified by the four cutouts, which landed there and not in `public/`
- ✅ Twelve `public/characters/*-proof.png` deleted after confirming nothing in `src/` references
  `-proof`. `public/characters/`: **46 files / 13.8 MB → 42 files / 3.7 MB**, four new assets included
- ✅ Checked whether they had ever shipped: they had not — `git ls-files` shows none of them tracked.
  The exposure was the next commit, not the last deploy. Twenty legitimate character assets in that
  same folder are also still untracked, so a single `git add public/characters` would have taken the
  proofs along with them
- ✅ `DEFAULT_NAV_MENU` gains the calculator between "How it works" and "Help", matching the Header
  fallback exactly, with a comment on each list pointing at the other
- ✅ No visitor-facing change: `/api/navigation` returns `navMenu: null`, so no override exists, the
  Header fallback renders, and all six links including `/he/data-calculator` are in the live header
- ✅ The two lists now read identically: `home, destinations, howItWorks, calculator, help, contact`
- ✅ `/admin/navigation` passes `DEFAULT_NAVIGATION.navMenu` straight through when there is no
  override, so it now lists six. The page itself answers 307 to an unauthenticated fetch, so this is
  verified at the source rather than through the rendered form
- ✅ **A third instance of the same bug, found while checking the second.** The admin screen's
  `KEY_SUGGESTIONS` offered `app` and `devices` for the main menu, and both are stripped by
  `getNavigationConfig` — `app` everywhere, `devices` from the header. An admin picking either would
  add a link, save, see it in the form, and never see it on the site. Suggestions trimmed to keys
  that actually survive, with `calculator` added

## Phase 5 — Verification

- ✅ `npx tsc --noEmit` clean
- ✅ `npx next build` exit 0. `npm run build` cannot run here — it opens with `prisma db push`, which
  fails on a missing `DIRECT_URL` locally, and should not be pointed at the shared DB from this
  machine anyway. Dev server stopped and `.next` cleared first
- ✅ `next lint`: no new finding in any file this ticket touched. The findings that do appear in them
  are all pre-existing — unused OTP handlers in `AccountClient`, an unused `e` in `CheckoutClient`,
  unused icon imports in `how-it-works`. Six errors repo-wide, all in `ui/input.tsx` and
  `theme/tokens.ts`, neither touched here
- ✅ The four menu pages 200 in `he`; `/en/contact` checked for the mirror class
- ✅ **375 px** computed exactly from the `.character-figure` CSS rather than eyeballed. Widest is
  `/help` at 214 px against 343 px of usable width; the figures stack below the text on a phone
- ✅ **RTL / LTR gaze** confirmed from the emitted markup: `ltr:-scale-x-100` present on calculator,
  help and contact, absent on how-it-works. That is the intended split
- ✅ Cutouts inspected on the dark proof panel; pixel-scanned as well
- ✅ No layout shift — boxes reserved from real intrinsic dimensions
- ✅ **Regression**: `/he` and `/he/destinations` diff identical to the Phase 0 baseline on stripped
  markup
### Browser pass — done, with the Chrome already on this machine

No dependency was added. Node 24 ships a global `WebSocket`, so a throwaway script in `TMP` drove the
installed Chrome over the DevTools protocol: real device metrics, real rendering, real screenshots,
plus a DOM read of every `.character-figure` box. Thirty screenshots, kept in `proofs/`.

- ✅ **375 / 640 / 1024 / 1440 px on all four menu pages.** Every measured box matches the arithmetic
  to the pixel — 174×150, 99×150, 214×148, 140×150 on a phone; 228×196, 133×200, 255×176, 186×200
  from `lg`. No horizontal scroll at any width on any page
- ✅ **640 px, the breakpoint that could have collided**: the row switches to horizontal there and the
  figure sits flush at the 16 px gutter on the inline-end side. No overlap
- ✅ **Centring on a phone** confirmed from the boxes, not by eye: each figure's left edge is within
  half a pixel of `(375 − width) / 2`
- ✅ **`he` / `en` / `ar` on all four, gaze checked in each.** `ltr:-scale-x-100` fires only in English:
  Sima's raised eyes, her open palm and Simi's wave all point at the heading in every direction, and
  the how-it-works pair correctly never flips
- ✅ **Checkout, populated.** A cart seeded into `localStorage` reached the real payment flow, not the
  empty-cart branch. Two figures at 73×92 and 69×92 on a phone, inline-end in both directions
- ✅ **Success, completed.** Its order endpoint stubbed in the page — no source file touched — so the
  real component rendered its real completed branch. Both figures full length under "תודה!"
- ✅ **Account dashboard.** Profile endpoint stubbed the same way. Sima measures 0×0 at 375 px, which
  is the `hidden sm:block` doing exactly its job, and the name and email keep their room
- ✅ AVIF is what the browser actually chose in all thirty shots; every image reported `naturalWidth`
  greater than zero, so nothing 404s
- ⚠️ **One temporary source edit, made and reverted.** The account page redirects server-side, which
  no amount of client stubbing can reach, so its guard was briefly gated behind an env flag. Reverted
  immediately; `git diff` on `account/page.tsx` is empty against HEAD. It is the only file in this
  ticket that was edited and then restored
- ⬜ **Gabriel's own pass**, whenever he wants it — the screenshots are in `proofs/`

## Phase 6 — Close

- ✅ `brand-assets/characters/README.md` — a third slot table, the crop rule and why, the four new
  file-index rows, the `--tol 78` note and the size-band note
- ✅ `CHANGELOG.md` under `[Unreleased]`
- ✅ Summary given

## Notes / follow-ups

- The menu is admin-editable through `SiteSetting.nav_menu`. A page added there later has no figure
  and renders exactly as it does today — the map is keyed by page, not by menu entry, so nothing
  breaks; it just is not covered. Worth a line in the admin navigation screen eventually
- `/data-calculator` is not listed in `i18n/routing.ts` pathnames even though the page exists and the
  Header links to it. It works, so it is not urgent, but it is inconsistent with every other route
