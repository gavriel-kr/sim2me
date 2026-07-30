# PRD — Ticket 020: Remove App Promotion

## Problem Statement
The site currently promotes a separate “app” experience:
- Bottom install banner (`InstallAppBanner`)
- Marketing page at `/[locale]/app`
- Nav/footer links to that page
- A CTA on the app page that links to `/app/` (static/mobile shell)

This creates the impression that customers need a dedicated app. In reality Sim2Me is a full web product; the personal account area already covers browsing, purchase history, and eSIM management. App promotion adds noise and confusion without product value right now.

## Goals
1. **Remove** the bottom install / PWA install popup site-wide.
2. **Remove** the public app marketing page and all navigation links to it.
3. **Stop linking** users to `/app/` from the marketing surface.
4. Keep the product story clear: web site + personal area is enough.

## Out of Scope
- Deleting the `mobile/` codebase or `public/app` static build (backend/mobile shell may remain unused for now).
- Changing account / eSIM install flows.
- Building a native store app.
- Changing PWA manifest serving unless required to stop the banner (banner removal is sufficient).

## User Stories
- As a visitor, I no longer see an “Install App” bottom banner.
- As a visitor, I no longer see “App” in header/footer navigation.
- As a visitor, `/he/app`, `/en/app`, `/ar/app` are no longer a marketed product page.
- As a customer, I continue to manage everything in the personal account area on the web.

## Success Criteria
- [ ] `InstallAppBanner` not rendered anywhere
- [ ] No nav/footer/sitemap entry for `/app` (locale marketing page)
- [ ] Locale app page removed or redirected away from marketing content
- [ ] No user-facing CTA pointing at `/app/`
- [ ] Existing account and checkout flows unchanged

## Notes
Ticket **019** remains with one open verification item (spot-check articles). This ticket is independent UI/product cleanup and was approved to proceed in parallel.
