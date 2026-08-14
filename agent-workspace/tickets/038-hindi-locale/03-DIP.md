# Ticket 038 — Detailed Implementation Plan (DIP)

Status icons: ⬜ open · ✅ done · ⛔ blocked · 👤 needs Gabriel

Local only. No commit at any point in this plan unless Gabriel asks for one. Nothing was pushed and no
database write was made: `npm run build` was deliberately replaced with `npx next build`, because the
build script also runs `prisma db push` and two content scripts against the live database.

## Gate — before any code

- ✅ Gabriel approved the work locally, with a full backup, on 2026-08-13
- ✅ All eleven product decisions answered and recorded in `01-PRD.md`
- ✅ Paddle's supported checkout locales verified against their documentation — Hindi unavailable, and the
  overlay stays out of scope
- ✅ Baseline commit identified: `825451d`, clean tree apart from one unrelated modified DIP
- 👤 Two prior tickets carry open manual-verification items — 026 (form in three languages) and 037
  (real card purchase, webhook replay). Their code is complete. Recorded here so this ticket does not
  bury them
- ✅ Phase 5 sign-off read from Gabriel's "go ahead, local changes only", given with this DIP in front of
  him. The checkout edit is one line, listed in the summary for review

## Phase 0 — Safety

- ✅ `backup/` holds all 36 modified files in their pre-ticket state, taken from `HEAD`
- ✅ `backup/RESTORE.md` — git rollback, manual rollback, and a partial rollback that keeps the four
  defect fixes and drops the locale
- ✅ `npx tsc --noEmit` green before the first edit. `next build` was recorded green after Phase 8
  rather than before Phase 1 — the baseline was type-checked, not built

## Phase 1 — Infrastructure

Goal: `/hi` returns 200 and renders.

- ✅ `src/i18n/routing.ts` — `'hi'` added to `locales`
- ✅ `src/middleware.ts` — `hi` in the matcher regex; locale-header cast widened to the routing tuple
- ✅ `src/i18n/request.ts`, `src/app/[locale]/layout.tsx` — casts widened
- ✅ `src/lib/locale-path.ts` — `hi` in `LOCALE_REGEX`
- ✅ `src/lib/locale-path.test.ts` — seven cases, including `how-it-works`, where `hi` is a substring;
  `npm run test:locale-path` passes
- ✅ `src/components/layout/Header.tsx` — `हिन्दी` entry, shared by desktop and mobile
- ✅ `/hi`, `/hi/destinations`, `/hi/help`, `/hi/checkout`, `/hi/account/login` all 200, `lang="hi"`,
  `dir="ltr"`
- ✅ `/en`, `/he`, `/ar` still 200 with the right `lang` and `dir`
- 👤 Click the switcher through all four locales in a browser — the dropdown renders on open, so it
  cannot be checked from the served HTML
- ⬜ Deviation: `hi.json` was written translated in one pass rather than as an English stub first, to
  avoid writing 563 strings twice

## Phase 2 — The fall-through defects

Five, not four. The cookies page carried its own copy of the CMS bug in JSX.

- ✅ `src/lib/cms.ts` — exhaustive `COLUMN_SUFFIX`, `null` for anything not `en`/`he`/`ar`
- ✅ `src/app/[locale]/cookies/page.tsx` — heading no longer falls through to Arabic, body no longer
  renders empty for an unknown locale, Hindi notice added
- ✅ Verified: `/hi`, `/hi/terms`, `/hi/privacy`, `/hi/cookies`, `/hi/refund`, `/hi/about`, `/hi/help`,
  `/hi/how-it-works`, `/hi/compatible-devices`, `/hi/contact`, `/hi/destinations` contain **zero**
  Arabic and **zero** Hebrew characters
- ✅ Verified: `/he/terms`, `/ar/terms`, `/he/help`, `/ar/help`, `/en/terms` still render their own
  script and no Devanagari. Byte-identical comparison was not possible after the fact — no pre-change
  capture exists — but the `en`/`he`/`ar` suffixes resolve to the same values as before
- ✅ `src/lib/articles.ts` — `toArticleLocale` maps a locale without article columns to English
- ✅ `articles/page.tsx`, `articles/[slug]/page.tsx` — content locale via `toArticleLocale`,
  `noindex, follow` for Hindi
- ✅ Verified: `/hi/articles` lists articles; `/hi/articles/best-esim-for-travel` returns 200 with the
  English body in a Hindi shell, `noindex`, and no carousel error
- ✅ `src/lib/email.ts` — `EmailLocale` gains `'hi'`; `toEmailLocale` accepts it; `'he'` default untouched
- ✅ `src/lib/validation/schemas.ts` — `'hi'` in `internalSaleSchema.emailLocale`
- ✅ `npx tsc --noEmit` → 0

## Phase 3 — The Hindi interface

- ✅ `src/messages/hi.json` — 563 strings, plain register, technical terms left in Latin script
- ✅ `legalPages` and `accessibilityStatement` — English body verbatim under the Hindi binding notice
- ✅ Support wording: email only, replies in English, no response-time promise — in `contact.responseTime`,
  `contact.supportDesc`, `help.notFoundDesc`, `about.why6Desc`, `home.trustSupport` and the emails
- ✅ Verified by script: 563 keys in both files, no key missing, no extra key, and every ICU placeholder
  matching `en.json` exactly
- 👤 Read `/hi` page by page in a browser for overflow and wrapping — Devanagari runs longer than English
  in places, and no automated check substitutes for looking

## Phase 4 — Font

- ✅ `src/app/layout.tsx` — `Noto_Sans_Devanagari`, `subsets: ['devanagari']`, `preload: false`, class on
  `<html>` only when the locale is Hindi
- ✅ `src/app/globals.css` — one `html[lang="hi"] body` rule, DM Sans still second for the Latin runs
- ✅ Verified: `/en` serves one font-variable class, `/hi` serves two
- ✅ `tailwind.config.ts` untouched
- 👤 Confirm in the network panel that no Devanagari file is requested on `/en`, and that `/hi` renders in
  the real face with no boxes

## Phase 5 — Money path and email

- ✅ `create-transaction/route.ts` — `'hi'` added to the locale enum. One line; nothing else in the file
  touched, which the diff shows
- ✅ Verified by diff: Turnstile, rate limit, consent gate and price resolution unchanged
- ✅ `src/lib/email.ts` — Hindi entry in all seven copy blocks, plus `emailDir` so Hindi mail is LTR
- ✅ Six customer-facing Hindi emails rendered to
  `proofs/emails/`: `dir="ltr"`, `lang="hi"`, Devanagari body, plain-text alternative present, links to
  `/hi/...`
- ✅ `formatDate` gives `dd/mm/yyyy` for Hindi — the English branch is the only special case
- 👤 Send the four-locale set to a real inbox and read them on a phone
- 👤 A POST from `/hi` through a real checkout — local verification cannot reach Paddle

## Phase 6 — Copy outside the message files

- ✅ `src/lib/cookieConsent.ts` — Hindi consent copy; both consumers now key off the record's own type
  rather than a hardcoded three
- ✅ `src/lib/destination-unavailable-copy.ts` — `'hi'` in `UiLang` and all five records
- ✅ `src/lib/translate-plan-name.ts` — Hindi regions and plan terms
- ✅ `DestinationsClient.tsx`, `destination-data.ts`, `plan/[planId]/page.tsx` — the same Hindi region map,
  because each file keeps its own copy. Not centralised in this ticket; noted as the cost of the next
  language
- ✅ Country names arrive from `Intl.DisplayNames` with no manual list
- 👤 Walk an unavailable destination, a forced error and a 404 under `/hi`

## Phase 7 — The suggestion banner

- ✅ `src/components/LanguageSuggestBanner.tsx` — new file
- ✅ `src/middleware.ts` — `requestForDetection` strips Hindi from `accept-language`, narrowed to
  GET/HEAD, no cookie, no locale in the path
- ✅ Mounted in `MainLayout` above the sticky header, so it stays off `/admin`
- ✅ Verified: `accept-language: hi` and `hi-IN,hi;q=0.9,en;q=0.8` → `/en`
- ✅ Verified: `he-IL,he;q=0.9` → `/he`, `ar` → `/ar`, `en-US` → `/en` — the regression that matters most
- ✅ Verified: `hi;q=0.9,he;q=0.8` → `/he`, so filtering Hindi does not discard the rest of the header
- ✅ Verified: `NEXT_LOCALE=hi` with an English `accept-language` → `/hi`
- 👤 In a browser with Hindi in its language list: the banner appears on English, accepting lands on the
  matching `/hi` path, declining hides it for good, and it does not collide with the cookie banner

## Phase 8 — SEO

- ✅ `src/app/sitemap.ts` — Hindi article guard, and `/hi/articles` itself excluded since it is `noindex`
- ✅ Hindi title and description: homepage, destinations, articles index, help, about, contact,
  how-it-works, compatible-devices, cookies
- ✅ `hreflang`: `hi` on the root layout, homepage and destination pages; **not** on articles
- ✅ `openGraph.alternateLocale` gains `hi_IN`
- ✅ Verified: `/sitemap.xml` has 13 Hindi static URLs, zero Hindi article URLs, and 181 English ones
- ✅ Verified: a Hindi article page emits `noindex` and no Hindi `hreflang`
- ⬜ Deviation: `noindex` is applied to Hindi **article** pages only, per the PRD decision to index the
  Hindi interface. There is no site-wide Hindi `noindex` switch to leave inactive

## Phase 9 — Whole-system verification

- ✅ `npx tsc --noEmit` → 0
- ✅ `npm run lint` → exit 0, pre-existing warnings only, none in a file this ticket touched
- ✅ `npx next build` → success. `npm run build` deliberately not used: it writes to the live database
- ✅ `npm run test:locale-path` passes
- ✅ 18 routes checked under `/hi`, plus `/en`, `/he`, `/ar` homepages — all 200 with the right `lang`
  and `dir`. `/calculator` 404s in every locale, including English: pre-existing, not a route
- ✅ `CHANGELOG.md` updated
- 👤 Full purchase from `/hi` on Gabriel's machine, with a real card
- 👤 Contact form submitted from `/hi`; auto-reply arrives in Hindi
- 👤 Registration, verification and OTP from `/hi`
- 👤 Side-by-side that `/en`, `/he`, `/ar` are unchanged: homepage, destination, plan, checkout, account,
  help, legal

## Known limits, written down before we start

- The Paddle overlay will be English on `/hi`. Not fixable — Paddle does not offer Hindi. The Hindi
  checkout copy now says so.
- The Hindi copy will not have been read by a native speaker at launch. Gabriel's call, recorded.
- The next language will cost the same as this one, because the locale lists are not being centralised.
  Four files hold their own region map; `hi` was added to each.
- Hindi is not Tamil, Telugu or Bengali. This ticket does not "cover India".
