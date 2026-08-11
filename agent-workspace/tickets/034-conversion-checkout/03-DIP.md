# Ticket 034 — Detailed Implementation Plan (DIP)

Status icons: ⬜ open · ✅ done · ⛔ blocked

Local only. No commit, no deploy, at any point in this plan.

## Gate — before any code

- ✅ Gabriel approves the scope in `01-PRD.md` (2026-08-10)
- ✅ Standing constraints recorded: hero headline untouched in all three languages, no price anchor
- ✅ Baseline is clean: `git status` empty apart from three pre-existing untracked `agent-workspace/`
  paths; HEAD `f8040bb`
- ✅ Snapshot of today's source taken — 25 files in
  `agent-workspace/backups/2026-08-10-pre-launch-tickets/`, with `RESTORE.md`
- ✅ Adjacent tickets checked: 025 shipped the hero (price anchor already removed there by the same
  instruction); 027 is paused and would recolour two of these files if resumed; 026 owns the
  `trustSupport` copy and is **not** touched here
- ✅ `npm run dev` is up; `/he`, `/en`, `/ar`, `/he/checkout` all 200 before and after the edits

## Phase 0 — Safety

- ✅ Twelve files copied into `backup/` immediately before the first edit
- ✅ `backup/README.md` records which file belongs to which phase, and the single-file restore command

## Phase 1 — Checkout strings

Sixteen replacements in `src/app/[locale]/checkout/CheckoutClient.tsx`, each with a new key in all
three message files. Line numbers are from the pre-edit file.

- ✅ `:157` empty cart → `checkout.emptyCart`
- ✅ `:159` "Browse destinations" → `checkout.browseDestinations`
- ✅ `:197` day unit in the cart line → existing `plan.days`
- ✅ `:209` "Remove" → `checkout.remove`
- ✅ `:216-217` minimum-purchase warning → `checkout.minTitle` + `checkout.minDesc` with `{min}`,
  `{total}`
- ✅ `:225` "Continue to details" → `checkout.continueToDetails`
- ✅ `:280` "Continue to payment" → `checkout.continueToPayment`
- ✅ `:294` minimum-purchase warning at the payment step → `checkout.minPayment` with `{total}`
- ✅ `:321` "Summary" → `checkout.summary`
- ✅ `:330` `{days}d` → existing `plan.days`. **Deviation from the ADD:** `checkout.daysShort` was
  written and then removed. It would have been a third key holding the word "days" with no caller able
  to tell it apart from `plan.days`; the summary row now reuses `plan.days` like the cart row above it
- ✅ `:338` "Total" → `checkout.total`
- ✅ `:346` "Continue" → `checkout.continue`
- ✅ `:74` minimum-purchase error raised in the handler → `checkout.minError`
- ✅ `:121` "Payment is loading…" → `checkout.paddleLoading`
- ✅ `:116` `Error {status}` fallback → `checkout.genericError`
- ✅ `he.json:380` corrupted `checkout.step2` fixed → `הקשו על הוסף חבילה סלולרית`
- ✅ Every price in the new copy renders through `formatPrice`, so a warning and the total it refers to
  cannot disagree about how money is written. `minDisplay` / `totalDisplay` replaced four
  `$${n.toFixed(2)}` literals
- ✅ No logic moved: `onPayWithPaddle`'s control flow, the step machine and the pay button's `disabled`
  expression are byte-identical
- ✅ Grepped for remaining Latin user-facing literals. Four remain, all of the form
  `t('key') || 'English fallback'`, all pre-existing, none reachable — `next-intl` returns the key
  itself when a message is missing, which is truthy. Left alone rather than widen the diff

## Phase 2 — Honest totals and the Turnstile explanation

- ✅ `checkout.vatNote` ×3 — the final amount including VAT is shown in the payment window
- ✅ `checkout.currencyNote` ×3 — the charge is in US dollars
- ✅ Both render under the total row
- ✅ `checkout.secureNote` ×3 — payment processed by Paddle, eSIM emailed immediately; renders at the
  payment step under the button
- ✅ `checkout.turnstilePending` ×3 — renders only while `!turnstileToken && !belowMinimum`, so the
  below-minimum warning is never doubled up with a security-check note
- ✅ The button's `disabled` expression is unchanged and still includes `!turnstileToken`

## Phase 3 — The route out of the cart

- ✅ `plan.toastGoToCheckout` ×3 — `לתשלום` / `Go to checkout` / `إلى الدفع`
- ✅ `useAddDeal` — `action` + `duration: 9000`. **Deviation from the ADD, which said "no new file":**
  the hook holds JSX now, so `useAddDeal.ts` became `useAddDeal.tsx` via `git mv`. Same file, same
  module path, no import anywhere changed; the alternative was `React.createElement` in a `.ts` file,
  which is the same thing written less clearly
- ✅ `PlanCard.tsx` — success branch only; the minimum-order branch deliberately keeps no action
- ✅ `PlanDetailClient.tsx` — same
- ✅ The action is `<ToastAction asChild>` wrapping the locale-aware `IntlLink` at the constant
  `/checkout`. No user input reaches the destination, so no open-redirect surface
- ✅ `Header.tsx` — badge from `h-4`/10 px to `h-5`/11 px with a white ring and a shadow, and
  `key={count}` replays a zoom on every change. `count`, the link target and the `aria-label` unchanged
- ⬜ Check the toast in RTL at 360 px: the action must not overlap the close button. Reasoned safe —
  `ToastClose` is pinned to physical `right-2` and the root reserves `pr-8`, while the action sits in
  the flex row and moves to the left under `dir="rtl"` — but **not yet seen**

## Phase 4 — CTA hierarchy in the hero

**The headline and subtitle are not to be edited. No price anchor.**

- ✅ `Hero.tsx` — "how it works" is a text link; the white background, border and shadow are gone
- ✅ `Hero.tsx` — chips cut from six to four, and from four to three when a recent destination occupies
  the first slot
- ✅ `home.searchCta` ×3 — `לצפייה בחבילות` / `See plans` / `عرض الخطط`. The old label promised to find
  an eSIM and delivered a filtered list
- ✅ `heroTitle` and `heroSubtitle` byte-identical in all three files — confirmed by diff, and
  `מחוברים בכל העולם!` still present in the rendered `/he` HTML
- ⬜ Look at `/he`, `/en`, `/ar` at 360 px and 1440 px and confirm exactly one button-weight CTA above
  the fold. **Needs Gabriel's eyes; there is no browser in this environment**

## Phase 5 — The search field

- ✅ White fill, `h-14`, `shadow-md`, `border-slate-500`
- ✅ Contrast measured, not guessed: `slate-500` (#64748b) against a white fill is **4.76:1**, clearing
  the 3:1 minimum for a user-interface component with room to spare. `slate-400`, the prettier choice,
  computes to 2.56:1 and was rejected on that basis. The old `border-blue-100` was nowhere near
- ✅ The button moved inside the field at the inline end (`end-2`), so it flips with direction on its
  own. The input reserves `pe-36` only when a label is passed
- ✅ The native `type="search"` clear control is suppressed with
  `[&::-webkit-search-cancel-button]:appearance-none`, because it renders in the corner the button now
  occupies
- ✅ `Hero.tsx` — wrapper is `max-w-lg`, matching the subtitle and the chip row; the component's
  `max-w-xl` remains its unconstrained ceiling
- ✅ Matching now runs against the localized name, the original English name, the `locationCode`, and an
  alias table — all four normalized so `ארה"ב`, `ארה״ב` and `ארהב` are one query
- ✅ **Two alias tables, not one.** A single table keyed by code made `אמריקה` return Saudi Arabia:
  `SA` is Saudi Arabia as a country code and South America as a region prefix. Caught by the check
  script below, not by reading the code
- ✅ `isRegional` filter removed — **after** confirming on localhost that regional rows resolve:
  `/he/destinations/af-29`, `as-20` and `as-21` all return 200, and they reach those URLs by the same
  `locationCode.toLowerCase()` rule the destinations list already uses
- ✅ Regional names are localized through the existing `translatePlanName`, which also translates the
  `(30+ countries)` tail. This replaced the component's own private copy of `Intl.DisplayNames`, so the
  file now has one fewer name-translation implementation than before, not one more
- ✅ `nav.searchNoResults` ×3, rendered as a non-interactive row whenever the query is non-empty and
  nothing matches
- ✅ One highlight (`bg-primary/10`, hover `bg-primary/5`) instead of three cycling tints
- ✅ Matcher verified against the live catalogue by
  `agent-workspace/scripts/034-search-match-check.mjs`: `japan`, `usa`, `italy`, `יפן`, `ארה"ב`,
  `ארהב`, `אמריקה`, `אירופה`, `אסיה`, `תאילנד`, `דובאי`, `אנגליה`, `המפרץ` and `jp` all return hits;
  `qqqqq` returns none. Output kept beside the script
- ⬜ Keyboard pass: arrows, Enter on a highlighted row, Enter with no highlight, Escape, Tab away.
  The handler was not touched, but the "no results" row is new state it can now see — **needs a browser**

## Phase 6 — Housekeeping

- ✅ `page.tsx` — the customer-service address now reads `brandConfig.supportEmail`, so it cannot drift
  from the footer again. `gavriel.kr@gmail.com` no longer appears in the rendered homepage
- ✅ `page.tsx` — `sameAs` is derived from `brandConfig.social` and filtered, so a null profile cannot be
  published. `twitter.com` no longer appears in the rendered homepage
- ✅ Closing CTA relabelled to `לבחירת חבילה` / `Choose your plan` / `اختر خطتك`. **The target was left
  at `/destinations`:** that is where a plan is chosen, so the label and the destination now agree, and
  `CTASection.tsx` needed no edit at all
- ✅ Both JSON-LD blocks parse — `/he`, `/en`, `/ar` render and return 200
- ✅ **Added on Gabriel's instruction, 2026-08-10:** the Facebook and Instagram icons are gone from the
  footer. Both accounts do not exist yet, so `brandConfig.social` is now null throughout; the footer
  already hid null links, so no markup changed. Two JSON-LD blocks were emitting `"sameAs":[]` — the
  homepage one and the root layout's — and both now omit the key instead of publishing it empty.
  `facebook.com`, `instagram.com`, `twitter.com` and `sameAs` are all absent from the rendered homepage
- ⬜ **Logged for 026, not fixed here.** The same `contactPoint` claims
  `availableLanguage: ['English', 'Hebrew', 'Arabic']`, which contradicts the English-only support
  decision. It is a claim, so it belongs to 026 rather than to this ticket

## Phase 7 — Verification

Done in this environment:

- ✅ `npx tsc --noEmit` → 0
- ✅ `npm run lint` → warnings only, all pre-existing patterns, none in the new code
- ✅ `ReadLints` clean on every touched file
- ✅ `npx next build` → compiled successfully, 95 pages generated, 0 errors
- ✅ `/he`, `/en`, `/ar`, `/he/checkout`, `/en/checkout`, `/ar/checkout`, `/he/destinations`,
  `/he/destinations/jp` all 200
- ✅ `/he/checkout` HTML contains `העגלה שלך ריקה` and `לעיון ביעדים`, and contains neither
  `Your cart is empty` nor `Browse destinations`
- ✅ `/he` HTML contains `מחוברים בכל העולם!` and `לצפייה בחבילות`, contains `info@sim2me.net`, and
  contains neither `gavriel.kr` nor `twitter.com`
- ✅ Search matcher verified against the live catalogue (see Phase 5)
- ✅ `git status` — nine source files modified plus one rename. `CTASection.tsx` is untouched because its
  change turned out to be copy only; nothing outside the ADD's list was modified

Needs a browser, so it needs Gabriel:

- ⬜ Checkout walk in he, en, ar: cart → traveler → payment, zero English in he and ar
- ⬜ Below-minimum plan: warning at the cart step, warning at the payment step, error from the handler
- ⬜ Add to cart from the hero card, a plan card and the plan detail page; the toast button reaches
  `/checkout` with the item present
- ⬜ Toast layout in RTL at 360 px
- ⬜ Keyboard pass on the autocomplete, including the new empty-results row
- ⬜ One button-weight CTA above the fold at 360 px and 1440 px
- ⬜ Turnstile still blocks payment until solved, and the new sentence appears while it has not
- ✅ `CHANGELOG.md` updated under `[Unreleased]`. Written before the browser sign-off deliberately: it
  describes what changed in the working tree, and nothing is committed or deployed either way

## Explicitly not in this ticket

Removing the name fields from checkout · prices in shekels · a cart drawer · email capture ·
abandoned-cart mail · social proof · anything owned by 026, 036 or 037.

## Status log

- 2026-08-10: Opened after the pre-launch review. Snapshot taken, baseline recorded, adjacent tickets
  audited. Awaiting Gabriel's go-ahead on the Gate.
- 2026-08-10, later: approved and implemented, phases 0–6 complete. `tsc`, lint and `next build` clean.
  Three deviations from the ADD, each recorded above: `checkout.daysShort` dropped in favour of the
  existing `plan.days`; `useAddDeal.ts` renamed to `.tsx` so the hook can hold JSX; `CTASection.tsx` not
  edited because its fix was copy only. One alias bug was found by the check script and fixed
  (`אמריקה` returned Saudi Arabia). Everything that needs a browser is listed above and is waiting on
  Gabriel. Nothing committed, nothing deployed.
- 2026-08-11: Re-verified after 036 touched the same message files: key parity across he/en/ar is exact
  (560 keys each), `tsc` and `next build` clean, and nineteen pages across the three languages return
  200. The five `t('key') || 'English fallback'` expressions left in `CheckoutClient.tsx` were checked —
  every one of those keys exists in all three files, so no fallback is reachable. The browser list above
  is unchanged and still Gabriel's.
