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

## Phase D — Verify

- [✅] **D.1** Grep: no `InstallAppBanner`, no nav href `/app` in layout components
- [ ] **D.2** Smoke: home, account, checkout still load; banner gone; app nav gone (manual / local)
- [✅] **D.3** Update this DIP checkboxes; summarize files changed

## Ready to implement
Done — awaiting user smoke / deploy decision.
