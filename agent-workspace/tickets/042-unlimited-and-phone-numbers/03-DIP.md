# Ticket 042 — Detailed implementation plan

Local only. Status icons: ⬜ open · ✅ done

## Gate

- ✅ Gabriel approved implementing locally (2026-09-28); no deploy
- ✅ No schema change, no `prisma db push`, no new dependencies
- ✅ `PIKASIM_API_KEY` in `.env` (added by Gabriel); account approved, wallet $25

## Phase 0 — Backups

- ✅ `backup/pre-existing/` — uncommitted diff, git status, HEAD before this ticket
- ✅ Every file copied before its first edit (34) + `manifest.json` + `restore.cjs` (dry-run verified)

## Phase 1 — Core logic

- ✅ `product-id.ts`, `unlimited.ts`, `phone-plans.ts`, `phone-catalog.ts`, `pikasim.ts`, `fulfillment.ts`, `phone-number.ts`
- ✅ `esimaccess.ts`: `dataType`/`fupPolicy` typed; `purchasePackage(..., periodNum)`
- ✅ `ticket-042.test.ts` passes (`npx tsx src/lib/ticket-042.test.ts`)
- ✅ Rules applied to the real PikaSim catalogue: 21 shown / 12 hidden, prices match the approved plan

## Phase 2 — Destination page

- ✅ Tabs Unlimited / By GB / With a phone number (hash `#unlimited|#gb|#phone`)
- ✅ Unlimited picker: stepper + slider 1–30, price from server table, "data only" label, Sima (estimating)
- ✅ By GB: existing shelf + catalogue unchanged, plus "data only" note; day passes removed from the list
- ✅ Phone tab: intro per region, Simi (waving), cards grouped by number, terms, link to /phone-plans
- ✅ Screenshots checked: JP desktop + 500px, FR phone tab

## Phase 3 — Checkout, fulfilment, emails, account

- ✅ Checkout lines per kind; phone terms box; unlimited note; consent text = no refunds
- ✅ Server price for `dp:`/`pk:`; `NEW_PRODUCTS_LOCKED` verified (403)
- ✅ Webhook, internal sale, admin retry, customer retry → `fulfillment.ts`
- ✅ Purchase email box "number appears after installation"; new "your number is ready" email (4 languages)
- ✅ Success page note; account shows number / pending; usage for PikaSim orders
- ✅ Admin order status shows the number; supplier badge in the list; cancel via PikaSim; backfill skips `pk:`
- ⬜ Real test purchase (Gabriel, from admin → Sell, spends PikaSim / eSIMaccess credit)

## Phase 4 — Homepage, page, admin, copy

- ✅ Hero chip, homepage section (Simi waving, from-prices, featured spotlight)
- ✅ `/phone-plans` page (all regions, long-stay global plans), sitemap entry
- ✅ Admin: /admin/phone-plans (edit price, shown, badge, featured, reset to rules, sell) and /admin/day-passes (hide/show, sell N days)
- ✅ Messages he/en/ar/hi; FAQ: 3 new + refund/data-only answers updated; RTL marks for +1/+33
- ⬜ Paste `cms-texts.md` into the CMS Refund page (Gabriel, after approval — live content)

## Phase 5 — Renewal (keep the number)

Approved 2026-09-28 after the check that PikaSim US and global numbers can be kept by renewing before expiry;
Europe (+33) and local numbers are single-cycle.

- ✅ `rn:<baseOrderId>:<topupCode>` product id; `renewal.ts` (context, options at our price, ownership, confirmation email)
- ✅ PikaSim `topup-options` and `topup` (idempotent on our order id); fulfilment describe / place / confirm for renewals
- ✅ Customer: account "Renew and keep my number" (options, end date, days left) → cart → checkout (owner-only, signed in)
- ✅ Admin: "Renew (keep number)" on a completed phone order → internal sale with customer preset; "PikaSim · renewal" badge
- ✅ Emails: "Renewed, number kept"; reminder 7 days before the end (once per end date); number-ready email promises renewal only for US/global
- ✅ Cron `/api/cron/phone-renewal-reminders` (CRON_SECRET, fail-closed) + daily entry in `vercel.json` (07:00 UTC)
- ✅ Copy fixed: renewal promise only for US/global; cards show "renewable" / "not renewable"; FAQ "How do I keep my number"
- ✅ Renewal records: no install QR in account / success page; cancel refused; backfills skip `rn:`
- ✅ Tests: renewal id parsing, renewable flags; unknown ICCID / missing order handled (read-only check)
- ⬜ Live renewal test (Gabriel): needs a completed US/global phone order first; then admin → Orders → Renew
- ⬜ `CRON_SECRET` is not in the local `.env`, so the reminder endpoint answers 503 locally (by design)

## Phase 6 — UI round (Gabriel, 2026-09-28)

Checkpoint of this round only: `checkpoint-ui-round/restore-checkpoint.cjs`.

- ✅ Destination page: two tabs — **With a phone number** (first, default wherever there is one) · **eSIM only** (unlimited picker on top, by-GB shelf under it)
- ✅ "Show all N plans" off everywhere (`SHOW_FULL_CATALOG = false`, code kept); a destination with no shelf still lists its plans
- ✅ "About a Week, Worry-Free" retired everywhere (`RETIRED_TIERS` in plan-curation; shelf minimum 2 tiers; For You shows 2+)
- ✅ Homepage: phone section above Hot Deals; homepage FAQ = first 3 + "What is an eSIM with a phone number" + "How do I keep my number"
- ✅ Main menu: "Phones / מספרי טלפון" after Destinations
- ✅ /phone-plans: clickable tiles per number type (USA, Europe, each local country, Global) → plans + terms; FAQ block
- ✅ Phone cards lead with minutes ("100 min · 10GB · 7 days"); local numbers name the country
- ✅ Screenshots: /he/destinations/us, /he/destinations/jp#esim, /en/phone-plans#local-mn, /he; tsc clean; tests pass

## Phase 7 — Deals round (Gabriel, 2026-09-28)

Checkpoint of this round only: `checkpoint-deals-round/restore-checkpoint.cjs`.

- ✅ Sky-to-teal "Buy now" on phone cards only, and on the button of a phone deal; everything else unchanged (Gabriel narrowed the request)
- ✅ Phone plans in the hot deals: a third of the day's count (min 1; 1 of 3 today), same discount range and profit floor as eSIM deals; computed per day, never written to `hot_deals` (shared with the live site)
- ✅ Deal cards say "eSIM only" or show the number (e.g. "Maldives · local number +960"); phone deals link to their /phone-plans tile
- ✅ The phone deal price applies on destination pages, /phone-plans (strikethrough) and in checkout (server price, lower only)
- ✅ Homepage Destinations (admin): checkboxes for "Popular destinations" and "For you" — both shown by default (`site_settings.homepage_sections`)
- ✅ tsc clean, tests pass, screenshots /he and /he/phone-plans#local-mv

## Phase 8 — Hero round (Gabriel, 2026-09-28)

Checkpoint of this round only: `checkpoint-hero-round/restore-checkpoint.cjs`.

- ✅ Hot deals switched off (or none today) → the card the pair holds cycles the phone numbers (USA, Europe, Global) with "from" prices and a sky-teal "See plans"; appears only after the deals request answers, so no flash
- ✅ Phone deal choice: US / global / Europe on trip-length plans first, local and long-stay only as fallback; the day's discount steps down to the minimum when the draw would break the profit floor (today: Global 2GB/15d, 5%, instead of the Maldives)
- ✅ Checked with a test browser that answers /api/hot-deals with no deals (CDP) — no change to the shared hot-deals setting

## Phase 9 — Badge round (Gabriel, 2026-09-28)

Checkpoint of this round only: `checkpoint-badge-round/restore-checkpoint.cjs`.

- ✅ Homepage sections (admin, Homepage Destinations): a third checkbox shows or hides the "Instant activation worldwide" badge above the hero headline — shown by default
- ✅ Its wording per language (he / en / ar / hi, up to 80 characters); an empty language keeps the site's default, shown as the placeholder; saved with its own button, so a checkbox never saves a half-typed text
- ✅ Same `site_settings.homepage_sections` row (the live site never reads it); the shape and text rules live in `homepage-sections-shared.ts` so the admin's browser code never pulls in Prisma
- ✅ tsc clean, tests pass (badge text rules), homepage 200 in all four languages, admin panel rendered and checked

## Checks

- ✅ `tsc --noEmit` clean · eslint: 0 errors (warnings pre-existing style)
- ✅ 200 on /he, /he/destinations/us|fr, /ar/destinations/jp, /hi/destinations/th, /he|en/phone-plans, /he/checkout, /he/help

## Phase 10 — Release preparation (Gabriel, 2026-09-28)

Checkpoints of this phase: `checkpoint-deploy-prep/` (catalogue fix) and `checkpoint-release-fixes/`
(lock, quantity, refund script, 041 removal). The full gate record is the top section of
`agent-workspace/DEPLOY-READINESS.md`.

- ✅ Sales open on the deploy: `ENABLE_NEW_PRODUCTS_CHECKOUT` became the emergency brake `DISABLE_NEW_PRODUCTS_CHECKOUT` (off unless set); its message now speaks to customers
- ✅ PikaSim catalogue: page renders wait at most 6 s and skip PikaSim for a minute after a failure; checkout and fulfilment still always ask (test added)
- ✅ One of each plan per order: cart capped, saved carts migrated, `create-transaction` accepts quantity 1 only
- ✅ `prisma/update-legal-pages-i18n.ts` carries the no-refund Hebrew and Arabic, so a deploy cannot restore the 14-day policy
- ✅ Ticket 041 closed by Gabriel and taken out of the working tree (shelved in its folder); 042's backups reset so a rollback cannot bring half of it back
- ✅ Gates A and C green on the production build; refund page row saved before the deploy
- ⬜ Gabriel: `PIKASIM_API_KEY` in Vercel, refund texts in the CMS, approval to push
- ✅ "Your number is ready" email sent automatically: `/api/cron/phone-number-ready` every 15 minutes (older orders hourly, up to 180 days); checkpoint `checkpoint-number-cron/`
- ✅ "For you" stays hidden on the live homepage (Gabriel)
- ✅ Refund texts written to the CMS (he/en/ar) and the Terms' section 9 summary aligned, both approved by Gabriel and live; `policies.ts`, the legal-pages script and the refund page's description say the same; checkpoint `checkpoint-refund-seo/`
- ✅ Approved for push (Gabriel, 2026-09-28); backup tag `pre-deploy-20260928-1907`
