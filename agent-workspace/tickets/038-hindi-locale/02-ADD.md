# Ticket 038 — Architectural Design (ADD)

Read against the code at `825451d`. Line references are from that state.

No `architecture.md` exists in the repository, so this follows the conventions of the ADDs that came
before it (033, 034, 037): describe the change against the code as it is, name the blast radius, and
name what must not move.

## Design principle for this ticket

Gabriel chose the minimal footprint, so the shape is: **`hi` is added where a locale list already
exists, and unknown-locale fall-through is made explicit where it is currently implicit.** Nothing is
generalised, nothing is centralised, no abstraction is introduced. Every edit below is either one entry
added to an existing list, or one conditional made honest.

The second half of that sentence is the part that matters. Three of these files already "handle" an
unknown locale — by collapsing to Arabic, by computing an undefined column name, by rejecting the
request. Adding `hi` to the routing table without fixing them ships those behaviours to production.

## 1. Locale infrastructure

`src/i18n/routing.ts` gains `'hi'`. That single change cascades correctly through everything that reads
`routing.locales`: `generateStaticParams`, the sitemap's page loop, and the locale guards in the page
components. It also makes `src/i18n/request.ts` load `src/messages/hi.json`, which therefore has to
exist before the first request, or every `/hi` page throws on the dynamic import.

`src/middleware.ts` needs three things:

- `'hi'` in the matcher regex at `:40`, or `/hi/...` never reaches the intl middleware at all.
- The cast at `:24` widened, so the locale header is re-injected for Hindi and `getTranslations()` does
  not silently fall back to English in server components.
- **Hindi removed from automatic detection.** `routing.localeDetection` is `true` and applies to all
  locales at once, so adding `hi` would auto-redirect Hindi-preferring browsers to `/hi` — the opposite
  of the decision. Turning detection off instead would change Hebrew and Arabic behaviour, which is a
  regression on live traffic. The narrow answer: when the request carries no `NEXT_LOCALE` cookie, hand
  the intl middleware an `accept-language` header with the Hindi entries stripped. English wins by
  default, Hebrew and Arabic detection is untouched, and the banner does the offering.

`src/lib/locale-path.ts` — `LOCALE_REGEX` is `/^\/(en|he|ar)(?:\/|$)/`. Without `hi` the switcher
produces `/en/hi/help` when leaving a Hindi page. Its test file gains the matching cases.

`src/components/layout/Header.tsx:35-39` — one entry, `{ code: 'hi', label: 'हिन्दी', flag: '🇮🇳' }`. The
switcher already writes the cookie and rebuilds the path, in both the desktop and mobile menus.

`src/app/layout.tsx` — `dir` already resolves to `ltr` for anything that is not `he`/`ar`, so Hindi is
correct with no change. What does need editing: the locale sniff at `:52` that picks the global SEO
snippet, `alternates.languages` at `:119-123`, and `openGraph.alternateLocale`.

## 2. The four fall-through defects

### CMS — never collapse to Arabic again

```
src/lib/cms.ts:19
const suffix = locale === 'en' ? 'En' : locale === 'he' ? 'He' : 'Ar';
```

Becomes an explicit map with no default branch: `en`/`he`/`ar` resolve to their suffix, anything else
returns `null` before the query runs. `null` is a value every caller already handles — it is what an
empty CMS page returns today, and each page falls back to its `next-intl` copy. So Hindi visitors get
the message-file content, and no future locale can ever inherit Arabic by omission.

### Articles — English content under a Hindi interface

`ArticleLocale` and `LOCALE_SUFFIX` in `src/lib/articles.ts` stay exactly as they are. The mapping
happens at the two call sites instead:

- `src/app/[locale]/articles/page.tsx` and `.../articles/[slug]/page.tsx` resolve a *content locale* —
  `locale === 'hi' ? 'en' : locale` — and pass that to `getPublishedArticles`, `getArticleBySlug` and
  `getRelatedArticlesForCarousel`.
- The canonical for a Hindi article points at `/en/articles/<slug>`, so we are not asking Google to index
  English prose as a Hindi page.
- `getArticleHreflangs` keeps iterating `['en','he','ar']`. There is no Hindi article, so there is no
  Hindi hreflang. Correct by omission rather than by special case.

Touching the call sites rather than the library keeps `articles.ts` — which the Hebrew and Arabic
article pages depend on — byte-identical.

### Checkout — the money path

`src/app/api/checkout/create-transaction/route.ts:29` gains `'hi'` in the enum. That is the whole
change: one enum member. Nothing else in the route moves — not the Turnstile check, not the rate limit,
not the consent gate from ticket 037, not the server-side price resolution.

It is still a money-path edit, so per the safety protocol it carries its own confirmation step in the
DIP even though Gabriel has already approved a Hindi checkout in principle.

`Order.locale` is `String?`, so `'hi'` persists with no schema change, and a later resend speaks Hindi
for free.

### Email

`EmailLocale` gains `'hi'` and `toEmailLocale` accepts it. **The `'he'` default is deliberately left
alone** — changing it would alter behaviour for every existing flow that passes something unexpected,
which is not this ticket's business. Seven `Record<EmailLocale, …>` blocks gain a Hindi entry:
`VERIFY_COPY`, `RESET_COPY`, `POST_PURCHASE_COPY`, `DELAYED_COPY`, `CONTACT_AUTOREPLY_COPY`,
`LINK_LABELS`, `OTP_COPY`.

`formatDate` needs nothing: its non-English branch is `dd/mm/yyyy`, which is the Indian convention.

`internalSaleSchema.emailLocale` in `src/lib/validation/schemas.ts:100` gains `'hi'` so an admin can
sell to a Hindi customer and have the mail match.

## 3. Copy that lives outside the message files

Three modules hold translations in TypeScript rather than JSON, and all three currently degrade to
English for an unknown locale. That is safe but visibly incomplete on a Hindi page:

| Module | Today for `hi` | Change |
|---|---|---|
| `src/lib/cookieConsent.ts:88` | English banner | Hindi entry — this is a consent surface and must be readable |
| `src/lib/destination-unavailable-copy.ts` | `toUiLang` returns `'en'`; empty, error and 404 states in English | `'hi'` added to `UiLang` and to the five copy records |
| `src/lib/translate-plan-name.ts` + `DestinationsClient.tsx` | Country names already Hindi via `Intl.DisplayNames`; region, continent and plan terms English | Hindi region/continent map and plan terms, so "Asia" stops sitting next to "भारत" |

`localizeDataDisplay` in `src/lib/utils.ts` is **deliberately not extended.** It exists to stop a Latin
unit becoming a left-to-right island inside an RTL line — a problem Hindi does not have. "10 GB" is also
how a data allowance is normally written in Indian marketing. Leaving it is the correct answer, not an
omission.

## 4. Legal pages stay English, in one place

No page component changes. The Hindi message file carries the **English** legal body under
`legalPages`, prefixed with a single Hindi sentence stating that the English version is the binding one.
Because `getCmsPage` now returns `null` for Hindi, that message-file copy is what renders.

This is why the decision costs nothing architecturally: the "translation" of a legal page is a copy of
the English string plus one Hindi line, in the file we are writing anyway. No migration, no admin tab,
no new component.

## 5. Font — scoped by attribute, not by route

`Noto Sans Devanagari` is added through `next/font/google`, which is already how `DM Sans` is loaded, so
**no package is installed**. Two details make it Hindi-only:

- `preload: false`, so no `<link rel=preload>` appears for visitors who will never render Devanagari.
- One rule in `globals.css` — `html[lang="hi"] body { font-family: var(--font-noto-devanagari), … }`.
  The `@font-face` is present in the stylesheet for everyone, but a browser fetches a font file only
  when a rule actually applies it, and that rule can only match a Hindi page.

`tailwind.config.ts:48-50` is untouched; `font-sans` keeps resolving to DM Sans everywhere else.

## 6. The suggestion banner — a new file, not an edit

`src/components/LanguageSuggestBanner.tsx`, mounted in the root layout beside the existing
`CookieBanner`. New file rather than an edit, per the safety protocol for new features.

Logic, deliberately small: show only when there is no `NEXT_LOCALE` cookie, no stored dismissal, the
current locale is not already `hi`, and `navigator.language` starts with `hi`. Accepting writes the
cookie and navigates through `buildLocalePath`; declining stores the dismissal. It never redirects on
its own and it never appears twice.

It is a separate surface from the cookie banner. Consent to cookies is not consent to a language, and
the two must not be conflated.

## 7. SEO

- `src/app/sitemap.ts` — the static-page loop already covers Hindi through `routing.locales`, which is
  what "publish immediately" requires. The article loop indexes `statusByLocale[locale]` at `:93`, which
  becomes a TypeScript error the moment `hi` joins the union; it is guarded so Hindi produces no article
  URLs. The compile error is welcome — it is the type system catching exactly the class of bug this
  ticket is about.
- Hindi title and description for the pages that render Hindi content: the homepage's `seoByLocale`, the
  articles index `INDEX_META` heading and meta, and the per-page maps for help, about, contact and
  how-it-works. The CMS-backed legal pages keep their English descriptions, because their content is
  English by decision.
- `hreflang` gains `hi` on the homepage, the destination pages and the root layout. Not on articles.
- The `noindex` switch: a single conditional in the root layout's `robots` block, keyed on the locale.
  Written and left inactive, so reversing the indexing decision is a one-line change with no design work
  behind it.

The global SEO settings in the admin (`SEO_KEYS`) are **not** extended with Hindi fields. They are
`SiteSetting` key/value rows, so it needs no migration, but the in-code per-page maps cover the pages
that matter and the rest falls back to English. It stays out to keep the footprint where Gabriel asked.

## What must not move

| Thing | Status |
|---|---|
| Hebrew and Arabic detection at the bare domain | Untouched — only Hindi is stripped from `accept-language`, and only when no cookie exists |
| `toEmailLocale`'s `'he'` default | Untouched |
| `src/lib/articles.ts` | Untouched — mapping happens at the call sites |
| Turnstile, checkout rate limit, consent gate (037), server-side price resolution | Untouched |
| Paddle: the overlay, `settings.locale`, `custom_data`, the webhook | Untouched. Out of scope by decision |
| Authentication, sessions, OTP logic | Untouched — only the mail copy gains a language |
| `tailwind.config.ts`, `font-sans` for non-Hindi pages | Untouched |
| Admin screens | Untouched. No Hindi tab is needed |
| `localizeDataDisplay` | Untouched, on purpose (§3) |
| Prisma schema | Untouched. No migration in this ticket |

## Files and blast radius

| File | Change | Risk |
|---|---|---|
| `src/messages/hi.json` | **New** — 563 strings, 19 namespaces | Low |
| `src/components/LanguageSuggestBanner.tsx` | **New** | Low |
| `src/i18n/routing.ts` | `'hi'` in `locales` | Low, wide reach |
| `src/middleware.ts` | matcher, cast, `accept-language` filter | **Medium** — every request passes through it |
| `src/lib/cms.ts` | explicit suffix map, `null` for unknown | **Medium** — read by nine pages in three languages |
| `src/app/[locale]/articles/page.tsx`, `.../[slug]/page.tsx` | content-locale mapping, canonical | Low |
| `src/app/api/checkout/create-transaction/route.ts` | one enum member | **Medium** — money path, additive only |
| `src/lib/email.ts` | `EmailLocale` + 7 Hindi blocks | Low, large diff |
| `src/lib/validation/schemas.ts` | one enum member | Low |
| `src/lib/cookieConsent.ts` | Hindi consent copy | Low |
| `src/lib/destination-unavailable-copy.ts` | Hindi copy, `UiLang` widened | Low |
| `src/lib/translate-plan-name.ts` | Hindi regions and plan terms | Low |
| `src/app/[locale]/destinations/DestinationsClient.tsx` | Hindi region/continent map | Low |
| `src/app/layout.tsx` | font, hreflang, OG, SEO locale sniff, noindex switch | Low |
| `src/app/globals.css` | one `html[lang="hi"]` rule | Low |
| `src/components/layout/Header.tsx` | one switcher entry | Low |
| `src/lib/locale-path.ts` + `.test.ts` | regex + cases | Low |
| `src/app/sitemap.ts` | Hindi article guard | Low |
| `src/app/[locale]/page.tsx`, `help`, `about`, `contact`, `how-it-works`, `articles` | Hindi meta strings | Low |
| `src/app/[locale]/layout.tsx`, `src/i18n/request.ts` | cast widening | Low |

No schema change. No migration. No new endpoint. No package installed.

## Rollback

Every file listed above is byte-copied into `agent-workspace/tickets/038-hindi-locale/backup/` from the
clean tree at `825451d`, before the first edit. The two new files are deletions on rollback.

Because there is no schema change, restoring the backup returns the system exactly to today's
behaviour. The only data this ticket can write that today's code has not seen is `Order.locale = 'hi'`
and `NEXT_LOCALE=hi`. Under the old code the first falls through `toEmailLocale` to Hebrew mail — the
pre-existing behaviour, not a corruption — and the second resolves to the default locale because `hi`
is no longer in `routing.locales`. Nothing is left unreadable.
