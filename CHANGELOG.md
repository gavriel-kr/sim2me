# Changelog

## [Unreleased]

### Changed (Ticket 029 — Six daily hot deals)
- **Six deals a day instead of three** – `DEFAULT_HOT_DEALS_CONFIG.count` 3 → 6. The deals section fills two rows of three on desktop through the grid it already had, and the hero chip and offer card now rotate the whole set rather than a slice of it. No schema change, no new endpoint, no new translation key — the API, the grid and the admin field already supported six.
- **Deal count is configuration again** – `HotDealsSection` and `Hero` each capped the list at three with their own `slice(0, 3)`, so the admin's "Number of deals" setting was silently overruled by two components. Both now render what the server returns, which is already exactly `config.count`.
- **Second fill pass for short pools** – With six slots and eight featured destinations, one destination whose packages all fail the profit gate used to leave a ragged second row, because the generator allowed only one deal per destination and then gave up. A second pass now relaxes that rule — and only that rule — when the first pass cannot fill the day. One package still never appears twice, and the profit gate is applied identically in both passes. Verified by asking for nine deals against eight destinations: nine were produced, the repeat was a different package, and every row cleared the floor.
- **Admin count ceiling 6 → 9** – With the default at six and the clamp at six, the setting could only ever be reduced.

### Added (Ticket 029 — Deals reach the destination page)
- **"All {destination} deals and plans" link on every deal** – In the hero offer card and in each deals-row card, under the price. In the hero it lives inside each slide so it names the deal it sits under; slides that are not showing are taken out of the keyboard path and hidden from screen readers, since all six live in the DOM at once and tabbing off the card otherwise walked through five invisible links. The icon-only arrow that used to sit beside "add to cart" is gone: two links to one destination in one card is a duplicate stop, and the arrow said nothing on its own. Existing `hotDealsViewAll` key, reworded in three locales.
- **Destination pages show today's deal** – On the curated shelf the deal takes the weekend slot, as a full plan card: data, validity, network, tethering, top-ups, per-day price and a details button, like every card beside it. It wears the deal's amber ribbon rather than the homepage's compact card, which on this page read as the thinnest offer on the shelf instead of the best one. Whichever tier holds the discounted package is dropped, so one package is never offered twice at two prices. Curation itself still runs on catalog prices: tiers are picked by a Pareto frontier, and a deal price would let the discounted plan crowd out plans it does not really beat, then reshuffle the shelf at midnight for reasons nobody could see. Two new keys, `tierDeal` / `tierDealDesc`, in three locales.
- **`Plan.originalPrice`** – Optional, set only when a hot deal has discounted `price`, and holds the catalog price it was discounted from. Its presence is what gives a plan card the deal treatment: amber ribbon with the discount and "only today", amber border, emerald price beside the struck original. So a discounted package looks the same on the curated shelf and in the full catalog below it, and a card never shows both the deal ribbon and the Best-Seller strip, or repeats its own percentage in a floating badge.

### Fixed (Ticket 029)
- **Hebrew deal cards read as two bare numbers** – `10 GB · 30 ימים` puts a Latin unit inside a right-to-left line, where it becomes its own left-to-right island and leaves the two figures side by side with nothing to say which one is the data and which one is the days. Plan cards had localized the unit for a while (`ג'יגה` / `جيجا`); the deal surfaces had not. The helper moved out of `PlanCard` into `lib/utils.ts` and is now applied everywhere a data amount prints beside a duration: the deals row, the hero offer card, the hero deal chip and the add-to-cart toast.
- **The deal card on a destination page linked to that page** – "All {destination} deals and plans" made sense on the homepage and in the hero, and nowhere else. The destination page now shows the deal as a plan card, which has no such link.
- **Destination pages quoted more than checkout charges** – A package on offer showed its catalog price on `/destinations/{slug}` — Australia at $9.40 while the homepage sold it at $8.64 — and checkout then charged $8.64 anyway, because `getActiveDealPrice` resolves the deal server-side. So the page overstated the price and hid the discount on exactly the page the homepage deal links to. The deal is now applied server-side to the plan it belongs to, may only ever lower a price, and is wrapped in its own try/catch so a deals failure cannot take a destination page down. `fromPrice` is computed from the final prices, so the header and the page metadata cannot contradict the card below them.
- **Ticket backups were being typechecked** – `tsconfig.json` included `agent-workspace`, so copies of source files kept under `tickets/*/backup/` were compiled: a backed-up `page.tsx` failed on a relative import that does not resolve from the backup folder. Excluded.
- **Regenerate could overshoot the configured count** – `regenerateTodayDeals` deletes today's unpinned rows and then calls the generator, which built its slot counter from zero and knew only about *yesterday's* pins. Today's kept pinned rows were invisible to it, so it could create a further `count` rows on top of them and place two deals on one destination. The kept rows are now handed over, seeding the slot count and the used-destination and used-package sets. Latent since ticket 024; three slots rarely exposed it, six would have.
- **Which deals a day serves was not deterministic** – `ensureTodayDeals` read the day's rows with no `orderBy` and then sliced them to `count`. While a day never held more rows than the count this was invisible; the moment it does, the database is free to return them in any order and consecutive requests can serve different subsets. Now ordered by `createdAt`, matching the branch that returns freshly generated rows.
- **Pinned carryover could burn a slot on a duplicate** – The carryover loop pushed a row for a package that might already exist for the day, relying on `skipDuplicates` to drop it at insert time — by which point it had already consumed one of the day's slots. It now skips such a package before taking the slot.

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
