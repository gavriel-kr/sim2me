# Ticket 038 — Hindi as the fourth language (PRD)

Requested by Gabriel, 2026-08-13. First language addition since the site was built with `en`, `he`, `ar`.

Local only. Nothing leaves this machine under this ticket.

## Why this is not "add a JSON file"

The site runs `next-intl` with three locales that are written out by hand in dozens of places: the
routing table, the middleware matcher, the language switcher, the email templates, the cookie banner,
the CMS lookup, the sitemap, the hreflang blocks, the checkout's request validation. There is no single
list to extend.

More importantly, three code paths do not merely lack Hindi — they misbehave when handed a locale they
do not recognise. These were found by reading the code, not by guessing:

**1. `/hi/terms` would serve Arabic.** `src/lib/cms.ts:19` resolves the column suffix as
`locale === 'en' ? 'En' : locale === 'he' ? 'He' : 'Ar'`. Any unknown locale collapses to Arabic. Every
CMS-backed page — terms, privacy, cookies, refund, about, help, how-it-works, compatible-devices,
contact — would render Arabic text inside a left-to-right Hindi page. Silently: no error, no log.

**2. `/hi/articles` would return 500.** `src/lib/articles.ts:29` maps locale to a column suffix for
three locales only. For `hi` the suffix is `undefined`, the query asks Prisma for `statusundefined`, and
Prisma throws. The articles index has no `try`/`catch`, so it is a hard error, not an empty list. The
article detail page catches and redirects to `/hi/articles` — straight back into the failure.

**3. Checkout would reject every Hindi purchase.** `create-transaction/route.ts:29` validates the
locale against `z.enum(['en','he','ar'])`. The client sends the active locale, so a purchase from `/hi`
fails validation and returns 400. No payment is possible.

**4. A Hindi buyer would receive Hebrew email.** `toEmailLocale` (`src/lib/email.ts:72`) falls back to
`'he'` for anything unrecognised.

Separately: the loaded font, `DM Sans`, is Latin-only (`subsets: ['latin']`). Without a Devanagari face
Hindi renders in whatever the device substitutes, or as boxes.

## Decisions — Gabriel, 2026-08-13

Each of these was asked and answered before the ticket was written. They are requirements, not
suggestions.

| Question | Decision |
|---|---|
| Language detection | Visitors stay in English by default. A one-time banner offers Hindi; only an explicit accept writes the locale cookie. Choosing Hindi in the header switcher also counts as accepting |
| Emails | All seven templates in Hindi — verification, OTP, password reset, purchase receipt, delayed order, contact auto-reply, link labels. A Hindi buyer never sees Hebrew or English mail |
| Legal pages | Stay in **English**, with a Hindi line stating the English version is the binding one. No legal translation, no exposure |
| Articles | Not translated. `/hi/articles` shows the English articles inside the Hindi interface, and the canonical points at the English URL |
| Font | `Noto Sans Devanagari`, loaded only for Hindi pages so no other visitor pays for it |
| Currency | USD only. No INR, no rupee pricing — that is a product change, not a translation |
| Support | Email only, answered in English, with no response-time promise. Stated plainly in Hindi so nobody expects otherwise |
| Indexing | Publish immediately. Gabriel has no way to review the Hindi copy, and accepts that |
| Architecture | Minimal footprint. `hi` is added as a fourth locale; the hardcoded locale lists are **not** refactored into a single source of truth in this ticket |
| Copy review | Launching on the draft written here, without a native reviewer |

Two consequences worth stating because they were accepted knowingly, not overlooked:

- **Indexed copy nobody has reviewed.** Google will index Hindi that no Hindi speaker has read. The copy
  is therefore written deliberately plain — no idiom, no wordplay — so the worst outcome is dry rather
  than wrong. The DIP carries a documented switch to put `/hi` back to `noindex` without a discussion if
  feedback demands it.
- **A fifth language will cost the same as this one.** Declining the refactor is the right call for one
  language and the wrong call for five. Recorded so the next language is a decision, not a surprise.

## The payment overlay cannot be Hindi

Verified against Paddle's own documentation on 2026-08-13. Paddle Checkout is localised into English,
German, Spanish, French, Italian, Japanese, Korean, Dutch, Swedish, Norwegian, Danish, Polish,
Portuguese, Russian, Simplified and Traditional Chinese, Arabic and Turkish. **Hindi is not on the
list** — and neither is Hebrew.

So everything we render is Hindi: the cart, the checkout steps, the traveler form, the totals, the
consent checkbox, the VAT note. The card-entry overlay belongs to Paddle and will be English. Their
overlay carries its own language selector at the bottom, so the customer can change it; we cannot give
them Hindi there. This does not block a purchase, and it is written down here so it is not discovered
after launch.

We also do not currently pass a locale to Paddle at all — the overlay follows the browser. Making that
explicit is a one-line change on the money path, so it stays **out of this ticket** and waits for a
separate decision.

## What we are building

- `hi` as a real fourth locale: `/hi/...` routes, language switcher entry, sitemap entries, hreflang.
- The full interface in Hindi — 563 strings across 19 namespaces, matching the English file exactly.
- All seven email templates in Hindi.
- The four unknown-locale defects above fixed so `hi` cannot fall through to Arabic, to a crash, to a
  400, or to Hebrew.
- English articles served inside the Hindi interface, canonical to English.
- English legal pages with a Hindi binding-version notice.
- A Devanagari font that loads only on Hindi pages.
- A one-time Hindi suggestion banner, with acceptance recorded before the locale changes.

## Out of scope

- Any Paddle change, including passing the overlay locale.
- INR pricing or currency work.
- Other Indian languages. Hindi is not Tamil, Telugu or Bengali, and this ticket does not pretend to
  cover India.
- Translating any article.
- Hindi CMS columns, Hindi article columns, or a Hindi tab in the admin. None are needed: CMS pages and
  articles are English for Hindi visitors, so there is nothing for an editor to fill in.
- Refactoring the hardcoded locale lists.
- Hindi support staffing.

## Acceptance

- `/hi` and every page beneath it returns 200, with `lang="hi"` and `dir="ltr"`.
- `/hi/terms` shows English text with a Hindi binding notice — **not Arabic**. Same for every other
  CMS-backed page.
- `/hi/articles` and a Hindi article URL both load, showing English article content, canonical to the
  English URL.
- A purchase completes end to end from `/hi`, and the resulting email is in Hindi.
- The contact form submits from `/hi` and the auto-reply is in Hindi.
- Devanagari renders in a real Devanagari face on `/hi`, and the font is not requested on `/en`.
- A browser preferring Hindi that lands on the bare domain gets **English** plus the offer banner, and
  is only moved to `/hi` after accepting.
- Hebrew, Arabic and English behaviour is byte-identical to today, verified page by page.
- `npx tsc --noEmit`, lint and `next build` all clean.
- No schema change. No migration. No package installed.
