# Changelog

## [Unreleased]

### Changed (Homepage copy — plural voice, Hebrew typography)
- **Hero headline and subtitle shortened (he/en/ar)** – "מחוברים בכל העולם!" / "תקשורת בראש שקט", replacing two long lines that each carried more than one claim. Same treatment in English ("Connected worldwide!" / "Connectivity with peace of mind") and Arabic.
- **Singular imperatives moved to plural (he/ar)** – Every call to action that addressed the visitor in the singular now speaks to travellers as a group: מצאו / בחרו / צפו / חפשו / להוסיף לסל, and اعثروا / اختاروا / ابحثوا / أضيفوا. Touches `nav.searchPlaceholder`, `home.searchCta`, `home.hotDealsAddToCart`, `destinations.subtitle`, `destinations.viewPlans`, `destinations.viewAllLocations` — so the destinations page inherits the same voice.
- **Heavy tier renamed after the benefit** – "גולש כבד" / "Heavy Traveler" / "مستخدم كثيف" → "גלישה כמעט ללא הגבלה" / "Almost unlimited data" / "بيانات شبه غير محدودة". Shown on destination pages, not the homepage.
- **"קנה" dropped from Hebrew page titles** – Removed from both sources that feed the browser tab: the homepage's own title in `src/app/[locale]/page.tsx` and the site-wide Hebrew default in `src/lib/global-seo-defaults.ts` (the fallback every page without its own title uses, including whenever the settings query fails).

### Fixed (Admin)
- **`/admin/seo` crashed on load** – The settings panel is a client component and imported its defaults from `src/lib/global-seo.ts`, which imports Prisma; the whole chain was bundled for the browser and Prisma refuses to run there, so the page died with a client-side exception and global SEO could not be edited at all. Keys, types and defaults moved to `src/lib/global-seo-defaults.ts`, which touches no database. `global-seo.ts` re-exports them, so every server caller is unchanged. Broken since the panel shipped (`40f175b`).
- **Paddle key banner could crash the dashboard** – `useCountdown` sat below the early return for a missing or unparseable expiry date, so it was skipped on some renders and not others. React tracks hooks by call order, so the first render with a valid date after one without it would throw. The hook now runs on every render and takes the null itself, skipping its own timer.

### Fixed (SEO — duplicate page titles)
- **Every CMS page carried the same title** – All ten records in the CMS held one identical meta title per language (`Sim2Me – קנה eSIM אונליין ל-200+ מדינות | משלוח מיידי` in Hebrew), and a CMS title wins over the page's own, so nine pages shipped a duplicate title in each language and the "קנה" that was removed from code kept being served. The fields are now blank, which hands each page back its own title — the ones already written per page, like `מרכז עזרה eSIM ושאלות נפוצות – התקנה, הפעלה ופתרון בעיות`. Data-only change; the descriptions have the same problem and were left alone.
- **Contact page had no localized title of its own** – Its fallback built one from a translation key plus an English suffix, so blanking the CMS record would have produced `צור קשר – Sim2Me eSIM Support`. It now has a `seoByLocale` map like every other page, with its own Hebrew, English and Arabic title and description.
- **The same duplicate description on nine pages** – Every CMS record also held one identical description per language, opening with "קנה eSIM בתשלום מוקדם אונליין" even on the terms and privacy pages. Blanked alongside the titles.
- **Legal pages: brand name twice, description in English** – Privacy, terms, refund and cookies appended "– Sim2Me" to a title the root layout's template already brands, giving `תנאי שימוש – Sim2Me | Sim2Me`, and fell back to a hardcoded English description in every language. The suffix is gone and each has Hebrew, English and Arabic descriptions.

### Added (Tooling)
- **ESLint configuration** – `.eslintrc.json` extending `next/core-web-vitals` and `next/typescript`. `npm run lint` previously dropped into the interactive setup wizard because no config existed, so nothing was ever linted.

### Fixed (Homepage hero)
- **Deal chip showed the two prices in the wrong order in Hebrew and Arabic** – The deal price closes the translated sentence and the struck-through original opened the next element, so bidi merged them into a single left-to-right run: the crossed-out price landed against "ב-" and the price the chip is about was pushed to the far end. The original is now a `bdi` isolate, which keeps it a unit of its own and puts it after the deal price in reading order. Its margin is symmetric because `bdi` defaults to `dir="auto"` and a price has no strongly-directional character, so logical margins resolve against the price instead of the line.

### Changed (Ticket 025 — Commerce-First Hero)
- **Hero headline/subtitle (he/en/ar)** – "Stay connected worldwide. No roaming fees." + pain-relief subtitle ("Land connected — no SIM swapping, no surprise bill"), replacing the generic brand copy. No QR/scan language; live prices shown in chips/deals rather than a static anchor in the H1.
- **"From $X per day" mislabel fixed** – `fromPrice` is the cheapest package price (auto-computed from the live catalog), not a daily rate; removed the wrong "per day" suffix in FeaturedPlans, destination page header, and destinations index. Removed the hardcoded `fromPrice: 4.99` from the static fallback list so a wrong price is never shown when the catalog API is down.
- **Destination page: full catalog expands in place** – "Show all N plans" now opens the full catalog below the curated tiers (with smooth scroll) instead of replacing them; "Back to recommended" collapses it. The usage-calculator's "find plan" opens the catalog too, since the data filter lives there.
- **Hero is now a funnel entry** – Up to 6 popular-destination quick-chips (flag + localized name + live "from $X") under the search box; returning visitors get a "Continue to {destination}?" chip from recently-viewed (ticket 024 storage). Top hot-deal teaser chip near the badge, anchor-scrolls to the deals section (`#hot-deals`). Micro-trust row (installed in minutes / secure checkout / 24-7 support) under the CTA.
- **Phone mockup sells** – Shows today's 3 real hot deals (localized country, data/days, deal price + strikethrough) instead of hardcoded English fakes; localized chrome; localized static fallback when no deals. All data via existing shared react-query caches — zero new requests/endpoints. 7 new i18n keys × 3 locales.

### Added (Ticket 024 — Homepage Hot Deals + Personal Shelf)
- **Hot Deals engine** – 3 daily homepage deals with an extra 5–10% random discount, profit-gated: created only when net profit after discount ≥ $3 (`computeProfit`: simCost + Paddle fees + additional fees). Pool = admin-featured destinations; max 1 deal per destination; date-seeded rotation (stable per UTC day). New table `hot_deals` (additive), `src/lib/hot-deals.ts`, `GET /api/hot-deals`.
- **Checkout honors deal price** – `create-transaction` resolves an active deal server-side (today + yesterday grace); a deal can only lower the charged amount. Displayed price and charged price always match.
- **Homepage "Hot Deals" section** – 3 cards with strikethrough original price, -X% ribbon, add-to-cart at deal price; GA4 `hot_deals` item list. Hidden when no eligible deals.
- **Homepage "For You" section** – signal hierarchy: recently viewed destination (localStorage, written by destination pages) → latest order destination (logged-in) → daily-rotating featured destination. Reuses smart-shelf `buildTiers` + `CuratedTierCard` (up to 3 tiers centered on the star).
- **Admin → Hot Deals** – new page: today's deals with per-deal net profit, pin (survives rotation), disable, regenerate, and settings (count, min profit, discount range, min price, enabled). New `api/admin/hot-deals`.
- 14 new i18n keys × 3 locales; homepage order now Hero → Hot Deals → For You → ValueProps → Popular destinations.

### Fixed (Ticket 024, incidental)
- **Dev server crash under Node 24** – `tailwind.config.ts` used `require()` in an ESM context; switched to a standard import.

### Fixed (Ticket 021 — Critical Revenue Fixes)
- **Post-purchase email now localized (he/en/ar)** – Checkout passes the buyer's locale through Paddle `custom_data`; the webhook picks the matching email template. Hebrew content unchanged and remains the fallback for legacy transactions. Files: `src/lib/email.ts`, `CheckoutClient.tsx`, `api/checkout/create-transaction`, `api/webhooks/paddle`.
- **Guest auto-account can now log in** – Accounts auto-created after purchase get `emailVerified: true` (login blocked unverified customers, making the emailed temp password unusable).
- **Newsletter form actually subscribes** – New `POST /api/newsletter` (rate-limited) sets `Customer.newsletter = true`; homepage form wired with localized success/error toasts (previously toast-only, saved nothing).
- **`saleBadge` now visible to customers** – Admin-set badge renders as a pill on `PlanCard`; `Plan` type extended.
- **Admin single-save no longer wipes `sortOrder`** – `POST /api/admin/packages/override` only updates `sortOrder` when explicitly provided.
- **Password reset email localized (he/en/ar)** – Forgot-password page passes the locale; reset link now locale-prefixed.

### Added (Ticket 023 — Smart Shelf)
- **Curated destination offers** – Destination pages now default to 3–5 "trip intent" tiers (Weekend Trip / Easy Week / The Full Trip ★ / Heavy Traveler / Long Stay, localized he/ar/en) computed client-side: fixed-data plans only, deduped by spec, Pareto-dominated plans dropped, nearest-fit to tier targets. One ★ per destination (admin-featured wins). Full catalog + filters unchanged behind "Show all N plans"; small catalogs (<3 tiers) keep the classic grid. New: `src/lib/plan-curation.ts`, `CuratedTierCard.tsx`; edited `DestinationDetailClient.tsx`; 13 i18n keys × 3 locales. Example: Japan 42 cards → 5 curated tiers.
- **Value-upgrade rule** – After nearest-fit picks a tier plan, the engine upgrades to a plan with more data (same-or-longer validity) if it costs ≤ +15%, capped at 4× the tier's data target. Protects customers from "1GB when 2GB costs almost the same" traps.

### Added (Ticket 022 — Funnel Analytics)
- **GA4 ecommerce events** – New `src/lib/analytics.ts` (consent-safe gtag wrappers). Wired: `view_item_list` (destination page), `view_item` (plan page), `add_to_cart` (PlanCard + plan page), `begin_checkout`, `add_payment_info` (checkout), `purchase` (success page, deduped per transaction). `api/orders/by-transaction` response now includes `packageCode`, `totalAmount`, `currency` for the purchase event.

### Removed
- **App promotion** – Removed bottom Install App banner, “App” nav/footer links, sitemap entry, and app marketing i18n. `/[locale]/app` now redirects to home (web + personal account cover the product). `mobile/` / `public/app` left intact, unlinked from UI.

### Changed
- **Unified favicon** – Replaced all site icons (favicon, apple-touch, PWA icons) with the official Sim2Me logo (Wi‑Fi + globe + SIM). Removed legacy favicon.svg; API fallback now serves favicon.png. Cache versions bumped (v3/v5) so browsers and Google fetch the new icon.
- **Header/Footer default logo** – Replaced with full logo (logo.png: Wi‑Fi + globe + SIM + "Sim2Me" text) when no custom logo from admin.
- **logo.png** – New full logo used in Header, Footer, JSON-LD, emails (fallback), sw cache. Replaces logo.svg.

### Fixed
- **500 on /admin/articles and other pages** – `getSiteBranding()` now catches DB errors and returns fallback values (null logo/favicon) so the site renders when the database is temporarily unreachable. Previously, any Prisma failure in metadata generation crashed the entire page.

### Added
- **Logo & Favicon sync from Admin** – Full Logo and Favicon set in `/admin/settings` now apply across the site:
  - **Header & Footer** – Both use dynamic logo from site settings with cache busting (`?v=timestamp`).
  - **PWA / Manifest** – Dynamic manifest at `/manifest` with favicon from admin; layout uses dynamic favicon and apple-touch icon.
  - **SEO/OG** – `openGraph.images` and `twitter.images` use the admin logo when set.
  - **Emails** – Password reset and post-purchase (Hebrew) templates include the dynamic logo URL.
  - **Cache busting** – `branding_updated_at` is set on each logo/favicon upload; all asset URLs get `?v=...` so browsers and CDNs refresh.
- New API routes: `/api/site-branding/logo` (serves logo image), `/manifest` (dynamic PWA manifest).

### Changed
- `getSiteBranding()` now returns `brandingVersion` and serves logo via `/api/site-branding/logo` when stored as base64 (for consistent cache busting).
- Root layout metadata: icons and OG/twitter images driven by site branding; manifest link points to `/manifest`.

- **Install App banner** – The bottom “Get the Sim2Me App” banner now shows the Full Logo from admin (same as header/footer). When a logo is set, the PWA manifest uses the admin favicon as the primary app icon so the installed app and home-screen shortcut show the updated symbol.
- **PWA icon when installed** – Manifest icons list the dynamic favicon first when set, so “Add to Home screen” / installed PWA uses the new icon.

### Technical
- Site settings key `branding_updated_at` stores timestamp on logo/favicon upload.
- Files touched: `src/lib/site-branding.ts`, `src/app/api/admin/settings/upload/route.ts`, `src/app/api/site-branding/logo/route.ts`, `src/app/api/site-branding/favicon/route.ts`, `src/app/manifest/route.ts`, `src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/InstallAppBanner.tsx`, `src/lib/email.ts`, `public/sw.js`.
