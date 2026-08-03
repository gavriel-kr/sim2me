# DIP — Ticket 020: Remove App Promotion

## Legend: [ ] pending · [✅] done

## Phase A — Install banner

- [✅] **A.1** Remove `<InstallAppBanner />` from `MainLayout.tsx` (import + render)
- [✅] **A.2** Delete `src/components/layout/InstallAppBanner.tsx`

## Phase B — Marketing page & CTA

- [✅] **B.1** Replace `src/app/[locale]/app/page.tsx` with redirect to `/${locale}` home
- [✅] **B.2** Confirm no remaining UI CTA links to `/app/` from locale marketing pages

## Phase C — Navigation & discovery

- [✅] **C.1** Remove `/app` from `Header.tsx`, `Footer.tsx`, `src/lib/navigation.ts`
- [✅] **C.2** Remove `/app` from `src/app/sitemap.ts`
- [✅] **C.3** Clean unused `nav.app` / `app` / `appComingSoon` keys in `en.json`, `he.json`, `ar.json`
- [✅] **C.4** Filter retired `/app` links from DB-stored nav overrides in `getNavigationConfig`

## Phase E — Browser-generated install prompt (added 2026-08-03)

Removing our banner was not enough: the site still satisfied Chrome's PWA installability
criteria, so the browser showed its own install prompt on mobile.

- [✅] **E.1** `src/app/manifest/route.ts` — `display: 'standalone'` → `'browser'` (removes installability)
- [✅] **E.2** `src/app/layout.tsx` — drop `other: { 'mobile-web-app-capable': 'yes' }` and set
  `appleWebApp.capable: false` **explicitly** (Next defaults it to `true` when the object exists,
  so deleting the key left `mobile-web-app-capable: yes` in the served HTML)
- [✅] **E.3** Keep service worker, manifest name/icons/theme_color, and `metadata.icons` favicons intact
- [✅] **E.4** `npm run lint` + `npm run build` exit 0; `npx tsc --noEmit` clean
- [✅] **E.5** Local smoke on the production build: `/manifest` serves `display: browser` with icons and
  theme_color; `mobile-web-app-capable` and `apple-mobile-web-app-capable` absent from `/en` `/he` `/ar`;
  manifest/icon/apple-touch-icon/theme-color links intact; 15 routes incl. checkout, login, admin login,
  sitemap and `/api/checkout/health` all 200; `/he/app` still 307 → `/he`
- [ ] **E.6** Post-deploy check on a real phone: no install prompt

## Phase D — Verify

- [✅] **D.1** Grep: no `InstallAppBanner`, no nav href `/app` in layout components
- [ ] **D.2** Smoke: home, account, checkout still load; banner gone; app nav gone (manual / local)
- [✅] **D.3** Update this DIP checkboxes; summarize files changed

## Ready to implement
Done — awaiting user smoke / deploy decision.
