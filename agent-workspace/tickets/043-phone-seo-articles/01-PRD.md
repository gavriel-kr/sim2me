# Ticket 043 — Organic search for eSIMs with a phone number (PRD)

Requested by Gabriel, 2026-09-29. Article list, titles and keywords approved the same day.

## Problem

1. Phone plans went live on 2026-09-28, but nothing on the site that search engines read says so:
   the homepage description, the destination pages and the articles talk about data only.
2. Destination pages have an English-only title and description in every language
   (`Buy eSIM for Japan – 23 Plans` on `/he/destinations/jp` too).
3. Articles cannot be written in Hindi: the table has no Hindi columns and the admin has no Hindi tab.
   `/hi/articles/*` shows the English text, marked `noindex`.
4. Article bodies have no typography: the Tailwind typography plugin is not installed, so the `prose`
   classes on the article body do nothing, and a bare `<h2>` looks like body text.

## Decisions (Gabriel)

| Topic | Decision |
|---|---|
| Articles | 14 in-depth articles, each in Hebrew, English, Arabic and Hindi (56 pages) — the list below |
| Originality | Everything written from scratch; each language written for its own readers, not translated |
| Depth | In depth, not shortened ("מאמרי עומק... לא לקצר") |
| Verification codes | Not mentioned in the articles; the existing sentence on the site stays as it is |
| SEO | Every article has its full SEO settings in every language so it is crawled well |
| Publishing | Prepared locally first; how they go live is asked before anything is written to the database |

### The 14 articles

| # | Slug | Main keyword (he / en / ar / hi) |
|---|---|---|
| 1 | `esim-with-phone-number` | eSIM עם מספר טלפון / eSIM with phone number / شريحة eSIM مع رقم هاتف / फ़ोन नंबर वाला eSIM |
| 2 | `global-phone-number-esim` | מספר טלפון גלובלי / global phone number eSIM / رقم هاتف دولي eSIM / ग्लोबल फ़ोन नंबर eSIM |
| 3 | `global-phone-number-israel` | מספר טלפון גלובלי ישראל / global phone number Israel / رقم هاتف دولي إسرائيل / इज़राइल ग्लोबल फ़ोन नंबर |
| 4 | `us-phone-number-esim` | מספר טלפון אמריקאי / US phone number eSIM / رقم هاتف أمريكي / अमेरिकी फ़ोन नंबर |
| 5 | `europe-esim-with-phone-number` | eSIM לאירופה עם מספר טלפון / Europe eSIM with phone number / … |
| 6 | `esim-data-only-vs-phone-number` | eSIM עם מספר או בלי / data-only vs phone number eSIM / … |
| 7 | `how-to-find-esim-phone-number` | איך רואים מספר eSIM / how to find eSIM phone number / … |
| 8–14 | `usa-`, `thailand-`, `japan-`, `uk-`, `greece-`, `dubai-`, `india-esim-with-phone-number` | eSIM ל<country> עם מספר טלפון / <country> eSIM with phone number / … |

## In scope

- The 56 article pages, each with title, excerpt, focus keyword, meta title, meta description,
  Open Graph title and description, FAQ with structured data, buttons to the right number page and
  destination page, and links to related articles.
- Hindi article columns, a Hindi tab in the articles admin, Hindi in the article pages, index,
  sitemap and hreflang.
- Article pages: `Article` structured data, `hreflang` for all four languages plus `x-default`,
  social image fallback, the FAQ structured data printed once instead of twice.
- Readable article typography for all articles (headings, lists, tables, buttons).
- Search titles and descriptions that mention phone numbers: homepage, destination pages (in each
  language), `/phone-plans` and the number pages (with `hreflang`).

## Out of scope

- Changing existing articles' text (their "what about calls?" sections could link to the new
  articles later — only with Gabriel's approval).
- Verification codes, OTP, WhatsApp registration: not claimed anywhere new.
- Any change to plans, prices, checkout or suppliers.

## Facts the articles rely on (from the catalogue, 2026-09-29)

- Global number: US +1, works in 168 countries (Israel, the USA, Thailand, Japan, the UK, Greece,
  the UAE and India among them). Six plans, 1GB/7 days/10 min/10 SMS $27.90 up to
  20GB/365 days/200 min/200 SMS $192.90. Renewable before it ends, keeps the number.
- USA number: US +1, the USA only. Eight plans from 1GB/7 days/10 min/10 SMS $7.90 to
  10GB/365 days/75 min/30 SMS $108.90. Renewable.
- French number: +33, 36 European countries (not Israel, not Turkey), 20GB/30 days, unlimited calls
  within Europe, 30 minutes to other countries, 200 SMS, $33.90. Not renewable.
- Validity starts at installation. Phone must support eSIM and be unlocked. No refunds after
  purchase. 48-hour renewal reminder by email. A plan that ends without renewal loses its number.
