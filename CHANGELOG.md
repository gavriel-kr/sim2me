# Changelog

## [Unreleased]

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

### Technical
- Site settings key `branding_updated_at` stores timestamp on logo/favicon upload.
- Files touched: `src/lib/site-branding.ts`, `src/app/api/admin/settings/upload/route.ts`, `src/app/api/site-branding/logo/route.ts`, `src/app/api/site-branding/favicon/route.ts`, `src/app/manifest/route.ts`, `src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/lib/email.ts`, `public/sw.js`.
