# Ticket 027 — DIP

Scope: repaint the storefront to the navy palette with a dark hero. Local only. No commit, no deploy.

## Gate — before any code

- ⬜ Gabriel approves scope (PRD G1–G6, non-goals confirmed)
- ⬜ Gabriel decides: **footer stays light** (default) or **footer goes navy** (Phase 8)
- ⬜ Gabriel decides: per-phase local commits, or backups only
- ✅ Theme switcher dropped — one palette (2026-07-31)
- ✅ Admin panel out of scope — stays green
- ✅ Working tree clean at `1761d90`; ticket 026 is paused and touches a disjoint set of files, so there is no collision
- ✅ Dark hero variant approved from `/he/design-preview` (2026-07-31)

## Phase 0 — Safety

- ⬜ Create `agent-workspace/tickets/027-navy-palette/backup/`
- ⬜ Copy `globals.css` and `tailwind.config.ts` into `backup/` before Phase 1
- ⬜ Copy every other file into `backup/` immediately before its first edit, preserving the folder path in the filename
- ⬜ Confirm `npm run dev` is up and `/he`, `/en`, `/ar` all return 200 before touching anything
- ⬜ Capture a "before" reference: note the current look of homepage, `/he/destinations`, `/he/destinations/jp`, and a plan page

## Phase 1 — Token layer (site stays visually near-identical)

Scalar tokens only. The gradient utilities are **not** touched here — each ships with its consumer, so no phase ever leaves a navy background under dark text.

- ⬜ `globals.css` `:root` — update the 10 changed tokens per the ADD table
- ⬜ `globals.css` `:root` — add the 8 new tokens (`--primary-bright`, `--surface-deep`, `--surface-raised`, `--on-deep`, `--on-deep-muted`, `--brand-blue`, `--brand-blue-soft`, `--urgent`)
- ⬜ `tailwind.config.ts` — expose the new tokens under `theme.extend.colors` (additive only; no key renamed or removed)
- ⬜ Leave the `.dark` block untouched
- ⬜ Verify: `/he` still renders correctly. Expected difference is subtle only — slightly deeper green, mint tints now cool grey. Anything more than that means a token was mis-mapped
- ⬜ `npx tsc --noEmit` clean

## Phase 2 — Dark hero

- ⬜ `globals.css` — redefine `.bg-gradient-hero` (navy + blue/green radial wash) and `.bg-dot-pattern` (blue dots on dark)
- ⬜ `globals.css` — add a dark `.glass` variant for the hero search field
- ⬜ `Hero.tsx` — invert text to `on-deep` / `on-deep-muted`; badge chip → translucent white with `primary-bright` text; deal chip → `urgent` fill; search field → dark glass; CTA → `primary-bright`; destination chips → translucent white; trust icons → `primary-bright`; phone frame → `surface-deep`, screen header → navy gradient, deal price → `primary`
- ⬜ `SearchDestination.tsx` — the hero renders this component; its input, dropdown and CTA must read correctly on navy without breaking its use elsewhere. **Check every other page that renders it before editing**
- ⬜ Confirm all ticket-025 behaviour is intact: destination chips, continue-chip from `sim2me_recent_destinations`, hot-deal chip anchoring to `#hot-deals`, live phone mockup with its static fallback, micro-trust row
- ⬜ Verify in `he`, `en`, `ar` — including that the radial wash sits sensibly when the layout mirrors
- ⬜ Verify with the accessibility toolbar: high-contrast on, highlight-focus on

## Phase 3 — Closing band + shared primitives

- ⬜ `globals.css` — redefine `.bg-gradient-cta`
- ⬜ `CTASection.tsx` — heading `on-deep`, body `on-deep-muted`, button `primary-bright` with dark ink (replacing the current white button with green text)
- ⬜ `ui/badge.tsx` — `success` variant off raw emerald onto `primary`
- ⬜ `ui/toast.tsx` — `success` variant off raw emerald
- ⬜ `ui/tooltip.tsx` — emerald tint → neutral/blue
- ⬜ These three are shared with the admin panel: confirm `/admin/orders` and `/admin/packages` still look right after the change

## Phase 4 — Remaining homepage sections

- ⬜ `HotDealsSection.tsx` — deal styling onto `urgent`; keep the `id="hot-deals"` anchor from ticket 025
- ⬜ `ForYouSection.tsx`, `ValueProps.tsx`, `TrustStrip.tsx`, `FeaturedPlans.tsx`, `FAQSection.tsx`
- ⬜ `StickyHelpButton.tsx` — `bg-emerald-500` → `primary`
- ⬜ `Header.tsx` — verify it still reads against the navy hero directly beneath it (it is sticky, so it overlaps on scroll)
- ⬜ Verify the whole homepage top to bottom in all three locales

## Phase 5 — Plan and destination funnel

Highest-density files; one at a time, each verified before the next.

- ⬜ `PlanCard.tsx` (21 occurrences) — price → `primary`; per-day pill `sky` → `brand-blue-soft`; spec icon tiles `purple`/`amber`/`emerald` → `brand-blue` / `amber` / `primary`; best-seller strip → navy gradient; sale badge stays `urgent`
- ⬜ `CuratedTierCard.tsx`
- ⬜ `DestinationsClient.tsx` (39)
- ⬜ `DestinationDetailClient.tsx` (51) — the country header and the filter pills are the bulk of it
- ⬜ `PlanDetailClient.tsx` (40)
- ⬜ `DataUsageCalculator.tsx` (18), `DataUsageModal.tsx`
- ⬜ Verify `/he/destinations`, `/he/destinations/jp`, `/he/destinations/eu-42` (regional — renders the globe icon, not a flag), and one plan page

## Phase 6 — Account, checkout, content

- ⬜ `AccountClient.tsx` (48) — read-only styling changes; **do not touch any auth or order logic**
- ⬜ `AccountLoginClient.tsx` (10)
- ⬜ `CheckoutClient.tsx` (6) — styling only; the Paddle flow is a critical path and must not be restructured
- ⬜ `SuccessClient.tsx`
- ⬜ `contact/page.tsx`, `how-it-works`, `compatible-devices`, `about`
- ⬜ `ArticlesIndexClient.tsx`, `ArticleDetail.tsx` — includes the `#ecfdf5 → #d1fae5` default card gradient in both files
- ⬜ `RedirectCountdownButton.tsx`, `CookiePreferencesModal.tsx`
- ⬜ Verify a full purchase flow locally end to end: destination → plan → cart → checkout → success

## Phase 7 — Browser chrome and brand config

- ⬜ `src/app/layout.tsx` — `viewport.themeColor` `#0d9f6e` → `#111B2C`
- ⬜ `src/app/manifest/route.ts` — `theme_color` → `#111B2C`
- ⬜ `src/config/brand.ts` — `primaryColor` / `secondaryColor` aligned to the real tokens
- ⬜ Confirm the PWA manifest still parses and the installed-app splash is sane

## Phase 8 — Footer (optional, gated on Gabriel's decision)

- ⬜ `Footer.tsx` — `bg-gray-50` → `surface-deep`; link and heading text onto on-dark tokens; social tiles onto `surface-raised`
- ⬜ Verify on every page type, since the footer is global
- ⬜ Contrast check on all footer link states

## Phase 9 — Verification

- ⬜ `npx tsc --noEmit` clean
- ⬜ `ReadLints` clean on every touched file
- ⬜ `npx next build` passes
- ⬜ `rg "emerald-|mint|155 40%" src --glob '!**/admin/**'` returns nothing unexpected
- ⬜ Smoke `/he`, `/en`, `/ar` → 200; homepage, destinations, destination detail, plan, account, checkout, success, contact, articles
- ⬜ RTL pass in `he` and `ar`: no clipped gradients, no text running the wrong way, chips and arrows correct
- ⬜ Contrast audit on every navy surface — AA minimum, measured rather than assumed
- ⬜ Accessibility toolbar: high-contrast, large text, highlight-links, highlight-focus, reduce-motion — all still usable on navy
- ⬜ Mobile widths (375px, 768px): the hero drops its right-hand visual below `lg`, so confirm the navy still works without it
- ⬜ Regression: `/api/hot-deals` and `/api/packages` still 200; add-to-cart and the Paddle checkout still function
- ⬜ Admin spot-check: `/admin`, `/admin/orders`, `/admin/packages` unaffected apart from the three shared primitives

## Phase 10 — Cleanup

- ⬜ Delete `src/app/[locale]/design-preview/page.tsx`
- ⬜ Confirm nothing links to it and the build is clean without it
- ⬜ Update `CHANGELOG.md` under `[Unreleased]`
- ⬜ Summarise: files changed, what to look at, what was deliberately left alone

## Status log

- 2026-07-31: Ticket opened. Awaiting Gate approval.
- 2026-07-31: Dark hero chosen from `/he/design-preview`; theme switcher dropped after discussion (permanent maintenance tax, no revenue impact, and the tokenisation work it depended on is needed regardless).
- 2026-07-31: **PAUSED before Phase 0 — nothing implemented.** Gabriel's concern: the site has accumulated green elements over time (contact page and others), and a file list in a DIP is not a guarantee that every one of them converts. He is right — nothing in the build catches a colour class left behind, so coverage rests on the grep plus discipline. If this resumes, it needs a mechanical completeness check before Phase 1, not after: an explicit inventory of every colour-class occurrence outside `src/app/admin/**` committed to this ticket, each line either migrated or consciously exempted, verified by re-running the same grep at the end. Priority moved to imagery instead.

## If this resumes — what to add first

- ⬜ Generate the full inventory (`rg` with line numbers, every colour utility, storefront only) into `backup/inventory-before.txt`
- ⬜ Classify each line: migrate / keep (amber warning, destructive) / dead code
- ⬜ Re-run the identical grep at the end and diff against the classification — that is the completeness guarantee this plan currently lacks

## Notes / follow-ups

- **Next ticket (agreed):** people and destination imagery — a fixed cast of 2–3 with rotating backgrounds, wardrobe varied across the ~30 featured destinations; a generic banner plus per-destination place imagery. Requires new infrastructure: there is no image field on destinations today (they are derived by grouping packages on `locationCode`), `next.config.mjs` only whitelists `flagcdn.com`, and the CSP `img-src` blocks everything else.
- **Deferred — emails.** `src/lib/email.ts` uses inline `#0d9f6e` / `#059669`. Should follow eventually so the brand is consistent from purchase to inbox, but post-purchase delivery is a critical path and deserves its own ticket with its own verification.
- **Deferred — dark mode.** Tokens exist in `.dark`, but there is no provider and no toggle. If it is ever built, the navy palette is a much better starting point than the current one.
- **Dead code noticed, not fixed here.** `getThemeFromBrand()` in `src/lib/theme/tokens.ts` has no importer. Worth deleting or wiring up in a cleanup pass.
- **The rule this ticket introduces:** no raw colour utilities in storefront code. Once colour lives in tokens, a stray `bg-emerald-500` in a new file breaks the system silently, and nothing in the build will catch it.
