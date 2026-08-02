# Pending release — prepared 2026-08-02

Everything below is **local and unpushed**. Gabriel asked for the release to be prepared, not sent;
the push happens only when he says so, and this document is what he approves against.

The protocol is `DEPLOY-PROTOCOL.md` at the repo root and it governs. This file records how each of
its gates was answered for this particular changeset.

## Where the repo stands

| | |
|---|---|
| HEAD | `e4a9d48` — *Ticket 029: six daily hot deals, and the deal price follows the visitor*, 2026-08-01 |
| Branch | `main`, level with `origin/main` — nothing pushed since `e4a9d48` |
| Going up | 29 modified files, 3 new source files, 20 new served assets, plus workspace docs |
| Rollback target | `e4a9d48` |
| Backup tag to create | `pre-deploy-20260802-<HHMM>` on `e4a9d48`, before the push |

Four tickets' worth of work is in one uncommitted changeset. That is the main structural risk in this
release: there is no per-commit rollback inside it. Per-file backups of every edited file sit in each
ticket's `backup/` folder, copied from the working tree before that ticket's first edit.

## What the release contains

### Ticket 028 phase 7j — characters on the destination pages

- Four rotating header poses beside a destination's name, chosen by hashing the slug so the choice is
  stable between server and client and spreads evenly across the catalogue
- Simi and Sima flanking "show all plans", each pointing at it
- The pair peering down over the divider when the catalogue opens, centred, with "back to
  recommended" beneath them
- The pair on binoculars beside the destinations-index heading
- Both characters beside the price on a plan page, cropped to head and torso
- A 2-second spinner on "show all plans", so the catalogue appearing reads as an answer to the click

### Ticket 028 phase 10 — the shelf and the price badges

Not character work; shares the changeset.

- **The weekend tier is gone.** It always resolved to the thinnest package in the catalogue, which
  anchored the shelf to a price nobody should buy at. Audited over 14 destinations before removal:
  all still produce four tiers, so no destination lost its shelf
- **"from $X" removed** from the destination header, homepage chips, featured cards, the destinations
  index, and the destination page's SEO title and description
- **"$X per day" removed** from plan cards, deal cards and the plan detail page
- A 15% validity-upgrade rule was built, tested, and **reverted** at Gabriel's request. Not in this
  release

### Ticket 030 — recommendations on the plan page

- "אולי יתאים לכם גם" at the foot of a plan page: up to two packages from the same destination, drawn
  from the curated shelf, with Simi and Sima above them
- **Price bug fixed** — `/destinations/au/plan/JC101` showed $9.40 while the destination page that
  linked to it sold the same package at $8.64. It now shows the deal price with the original struck
  through
- `getDestinationData` moved to `src/lib/api/destination-data.ts`, proven inert
- Audited over 104 simulated plan pages across 18 destinations, 0 rule failures

### Ticket 031 — characters on the rest of the site

Now **built**, not just planned.

- A pose beside the heading on `/how-it-works`, `/data-calculator`, `/help` and `/contact`. Four new
  renders, cut with the existing pipeline
- The generic pair on `/checkout`, `/account` and `/success`, and — added on request after the first
  pass — above the `/account/login` and `/account/register` cards, outside the card so the sign-in
  form, the OTP step and Turnstile are untouched
- `DEFAULT_NAV_MENU` now matches `Header.tsx`; the first admin save would previously have deleted the
  Calculator link from the site
- `cutout.mjs --proof` writes into the workspace instead of `public/characters`

## Risk level: R2

Presentation work almost everywhere, which argues for R0 or R1. It is **R2** anyway, for one reason
worth stating plainly: gate B1 lists **מחירים** as a money-path area, and this release changes the
price printed next to an add-to-cart button.

The protocol says to treat the uncertain case as R2, and being conservative here costs one extra
approval and buys a full gate C. R2 was kept even after the investigation below came back clean —
downgrading a level because the evidence looks good is the "it seems fine" move the protocol exists
to prevent.

**R2 requires:** gate A + gate B + full gate C + gate D, a backup tag, and a second explicit approval
beyond the request to deploy.

### The money path was traced end to end

The concern was that the cart entry built on a plan page now carries the deal price where it used to
carry the catalog price, and the cart is `localStorage`, i.e. attacker-controlled. Traced and read
directly rather than assumed:

- `CheckoutClient.tsx` does send `unitPrice` from the cart to `POST /api/checkout/create-transaction`
- That route **never reads it.** `unitPrice` appears three times in the entire `src/app/api` tree: a
  security comment, a Zod field, and a second comment. The charged amount is `serverPrice`, resolved
  from `PackageOverride.customPrice` or the packages cache, with `getActiveDealPrice(planId)` applied
  server-side and only ever downward
- The order total written after payment comes from Paddle's signature-verified webhook payload, not
  from anything the browser sent

So checkout was **already** charging the deal price. This release makes the page agree with the till
rather than changing what the till does. No file on the charge path is in the changeset:
`create-transaction`, the Paddle webhook, `hot-deals.ts` and the Prisma schema are all untouched. The
one checkout file that is in the changeset, `CheckoutClient.tsx`, gained a heading wrapper and two
decorative figures and nothing else — the diff is nine lines and is quoted in the ticket.

## Gate A — code builds locally

Re-run from a deleted `.next` after the last edit:

- ✅ `npx tsc --noEmit` → 0
- ✅ `npm run lint` → **0**, no errors. Six pre-existing errors were fixed to get here; see below
- ✅ `npm run test:profit` → pass
- ✅ `npm run test:locale-path` → pass
- ✅ `npx next build` → 0
- ✅ No `.env`, credential or key file in the changeset
- ✅ No leftover `console.log`, `debugger` or stray TODO in any changed file
- ✅ No orphan assets: all 21 served character poses are referenced by code. `public/characters` is
  42 files, 3.7 MB

`npm run build` itself is not used, because it chains `prisma db push` and needs `DIRECT_URL`, which
is not set locally. `npx next build` compiles the identical application without touching the
database. Called out because the protocol names `npm run build` by name.

### Six lint errors were fixed, none of them from this work

The gate requires green and it was red, in files this release never touched. All six were mechanical
and none changes runtime behaviour:

| File | Error | Fix |
|---|---|---|
| `components/ui/input.tsx` | empty interface | `type` alias. `InputProps` is used only inside that file |
| `lib/theme/tokens.ts` | three `let`s never reassigned | `const`. Confirmed read-only through line 32 |
| `admin/seo/SeoSettingsClient.tsx` | unescaped apostrophe | `&apos;`, renders identically |
| `character-preview/page.tsx` | unescaped apostrophe | route retired, see below |

If Gabriel would rather the release touch nothing outside its own scope, these three files can be
reverted and the gate declared red-but-known, as it evidently was on previous deploys.

## Gate C — smoke

### C0, always
- ✅ `/en`, `/he`, `/ar` → 200
- ✅ Zero console errors, warnings, exceptions or failed requests on ten pages in Hebrew: home,
  destinations index, a destination, a plan page, all four menu pages, sign-in, register
- ✅ `dir=rtl` correct on every one of them, every figure loaded, none broken

### C1, checkout and money
- ✅ `GET /api/checkout/health` → `ok: true`, all five steps green including `paddle-ping`
- ✅ **Full cart flow driven through a real browser** on `CKH509`, a package with a live deal at
  $15.25 against a $16.40 catalog price. Plan page shows $15.25 with $16.40 struck; a real click on
  "הוסף לעגלה" writes `price 15.25` and `originalPrice 16.4` into the cart; the checkout page totals
  $15.25. Same number in all three places
- ✅ Recommendations render on that page, one card, correctly collapsed to a single card rather than
  padded with a second
- ✅ Nothing on the charge path is modified — traced above

### C2, customer account
- ✅ `/he/account/login` and `/he/account/register` → 200, both render
- ✅ Form fields intact after adding the figures: 2 inputs on sign-in, 6 on register
- ✅ `/he/account` → 307 to the login page, guard intact

### C3, admin
- ✅ `/admin/login` → 200
- ✅ `/admin/orders`, `/admin/navigation`, `/admin/seo` → 307, guards intact
- Admin screens behind the guard were not opened; the two admin edits are one suggestion array and
  one apostrophe, both covered by typecheck, lint and build

### C4, content and i18n

The first pass was Hebrew-heavy: all three locales on the homepage, but console errors and the cart
flow in Hebrew only, and just five English/Arabic combinations elsewhere. Gabriel asked whether every
language had really been covered. It had not. Redone as a full matrix.

**11 pages × 3 locales × 2 widths = 66 checks**, each verifying text direction, figure loading,
mirroring, horizontal overflow, untranslated keys and console errors:

- ✅ `dir` correct everywhere — `ltr` for `en`, `rtl` for `he` and `ar`
- ✅ No horizontal overflow at 375 px or 1440 px in any locale
- ✅ No figure off-canvas, none broken once lazy loading is accounted for
- ✅ **Key audit across all 509 message keys:** Hebrew and English complete, Arabic missing exactly 17
- ❌ One real failure, pre-existing: see below

### The Arabic contact page is missing its whole form vocabulary

`src/messages/ar.json` has 492 of 509 keys. All 17 gaps are in `contact`, and they are the entire
form: `namePlaceholder`, `emailPlaceholder`, `phone`, `phonePlaceholder`, `messagePlaceholder`,
`subjectPlaceholder`, all six `subject_*` options, `marketingConsent`, `sending`, `messageSent`,
`messageSentDesc`, `sendAnother`.

An Arabic visitor sees literal `contact.namePlaceholder` and `contact.subject_refund_request` in the
form, and the browser console fills with `IntlError: MISSING_MESSAGE`. Screenshot in the ticket
proofs.

**Not caused by this release** — the only other change to `ar.json` here is the two `plan.recommended*`
keys, and every other section of the file was already complete. It has been live on production.

**Fixed, on Gabriel's instruction, inside this release.** All 17 strings written in the same Modern
Standard Arabic register as the rest of the section, in the same key order as `en.json`. Where the
page already names a concept twice the wording was matched rather than reinvented: the subject
options now echo the "common issue types" chips above them, and `subject_refund_request` and
`subject_general_inquiry` are word-for-word the existing `issueRefund` and `issueOther`.

Content only — no logic, no component, no key referenced from code that did not already exist.

Verified after: 509 keys in all three locales, no gaps, no empty values, and no Arabic string left
identical to its English source apart from `devices.samsungTitle` and `devices.otherList`, which are
device model names and are identical in Hebrew too. `/ar/contact` renders with zero raw keys and zero
`IntlError`s at 375 px and 900 px, and `/he/contact` and `/en/contact` are unchanged. Before-and-after
screenshots in the ticket proofs.

One thing deliberately left alone: the phone-country dropdown lists country names in English in every
locale. It comes from a country-data list rather than the message files, so it is a separate problem
and out of this release's scope.

### C5, mobile
- ✅ 375 px sweep over 15 page/locale combinations. **All clean** — no horizontal scroll, no figure
  off-canvas, none under 40 px tall
- One real bug found and fixed during this sweep; see below

### C6, cron
- Not touched. No change to `CRON_SECRET` handling or to `vercel.json`

## What the sweep caught

**A plan page for a package on offer scrolled sideways on a phone.** Document width 394 px against a
375 px viewport, which shifted the header, footer and cookie banner too. Caused by 028 and 030
meeting: 028 put the pair in the price row, 030 added the struck-through original beside the deal
price, and neither the prices nor the figures could give way, so the row measured 378 px inside a
343 px card.

Fixed by making the price block `min-w-0 flex-wrap` — the original now drops under the discounted
price rather than forcing the page wider — and bringing the phone figures from 140 px to 116 px so it
rarely needs to. Re-verified at 375 px in three locales, with and without a live deal, and the card
was inspected at 375 and 1440.

Worth noting how it hid: a plan page **without** a deal never showed it, which is why earlier 375 px
passes missed it. It would have hit only the pages hot deals drive traffic to.

## Known and pre-existing, not caused by this release

- **Hydration mismatch whenever the cart is non-empty.** React logs "server rendered HTML didn't
  match the client" on any page once something is in the cart. Isolated by loading `/he/about`, a
  page this release never touches, with an empty cart (clean) and then a full one (mismatch). It is
  the header's cart badge reading `localStorage`, and it predates all of this. Worth its own ticket;
  not a blocker here
- **The homepage "For You" section still shows catalog prices** for a package on offer. It fetches
  `/api/packages` from the browser and never sees a deal. Deliberately deferred since 029
- **`h1` is empty on the sign-in and register pages** — their title is a `CardTitle` div. Pre-existing
  and unrelated, but it is an SEO and screen-reader gap somebody should pick up

## Not shipping

Both are untracked, so they cannot reach production as long as staging is done by explicit path,
which is how the command below is written.

| Item | Status |
|---|---|
| `src/app/[locale]/character-preview/` | **Retired.** Moved to `agent-workspace/tickets/028-characters-imagery/retired-preview-route/` with a README. Its own header said to delete it once the characters were on real pages; they are. It was also the last lint error in the character work |
| `src/app/[locale]/design-preview/` | **Left in place, untracked.** Belongs to ticket 027, which is parked. Its header says to delete it once the palette decision is made, and that decision is still open. Gabriel can still view it locally |
| `agent-workspace/backups/` | 13 files, 0.2 MB. Untracked. Not staged |
| `public/characters/*-proof.png` | **Gone**, never tracked in any commit, and covered by `.gitignore` since 028 in any case. `cutout.mjs` now writes proofs to the workspace |

`.gitignore` already keeps the workspace binaries out: character master PNGs, ticket `proofs/`
folders and any `*-proof.png` under `public/characters` are all ignored, so none of the screenshots
or masters from this work can reach the repo. Nothing about those rules changed in this release.

One standing hazard remains: `design-preview` is an ordinary `.tsx` under `src/` and is not ignored,
so a future `git add -A` would sweep it into a commit and put the route on the live site.

## Gate D — the pre-push checklist

Ready to tick, in order, when Gabriel approves:

- ⬜ Gabriel explicitly asks for the push
- ✅ Risk level determined: **R2**
- ✅ Gate A green, `npx next build` = 0
- ✅ Gate B answered, money path traced and clear
- ✅ Gate C0–C5 passed; the one failure found was fixed and re-checked
- ⬜ Backup tag `pre-deploy-20260802-<HHMM>` created on `e4a9d48`
- ✅ Commit contains only files belonging to this change; no secrets, no scratch routes
- ✅ Deploy by `git push origin main` only. No Vercel CLI, ever
- ⬜ **Second explicit approval, because this is R2**
- ⬜ Gabriel's own pass in a browser

## Post-deploy smoke, to run once Vercel reports Ready

- `https://www.sim2me.net/en`, `/he`, `/ar` load, no 5xx
- `https://www.sim2me.net/api/checkout/health` → `ok: true`
- A destination page: header characters, the pointing pair, "show all plans" and its spinner
- A plan page **for a package on today's deal**: deal price, struck original, recommendations, and
  no sideways scroll on a phone
- The four menu pages and the sign-in page: a character beside each heading
- Admin → Orders loads

If any of it fails: stop, report, propose rollback to the tag. Do not push again blind.

## Rollback

`e4a9d48` is the last deployed commit. Tag it before pushing; recovery is
`git push origin <tag>:main`, with Gabriel's approval, per protocol section 10.

A partial rollback is not available, because the release is one changeset. If one piece needs
reverting later, the per-file backups in each ticket's `backup/` folder are the way back.
