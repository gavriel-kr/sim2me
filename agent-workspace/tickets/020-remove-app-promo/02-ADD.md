# ADD — Ticket 020: Remove App Promotion

## Architecture Overview
Sim2Me remains a Next.js locale-routed web app. App promotion is a **presentation concern only** — remove marketing surfaces; do not change auth, checkout, or account APIs.

### Surfaces to remove

| Surface | Location | Action |
|---------|----------|--------|
| Install banner | `src/components/layout/InstallAppBanner.tsx` + use in `MainLayout.tsx` | Delete component; remove import/render |
| Marketing page | `src/app/[locale]/app/page.tsx` | Delete route (or replace with redirect to home / account — prefer delete + optional redirect) |
| Nav links | `Header.tsx`, `Footer.tsx`, `src/lib/navigation.ts` | Remove `{ href: '/app', key: 'app' }` entries |
| Sitemap | `src/app/sitemap.ts` | Remove `/app` path entry |
| i18n (optional cleanup) | `en.json` / `he.json` / `ar.json` `app` namespace + `nav.app` | Remove unused keys if nothing else references them |

### Keep (out of scope for deletion)
- `mobile/` package and copy scripts (`scripts/copy-mobile.js`)
- `public/app/` static assets (may still be reachable by direct URL; not linked from UI)
- Auth token route for mobile clients
- Root PWA `manifest` / icons used for branding (unless they only exist for the install banner — verify; do not break favicons)

### Redirect (recommended, minimal SEO hygiene)
If `/[locale]/app` is deleted, add a simple redirect to `/${locale}` (home) so old bookmarks/search results do not 404. Prefer Next.js `redirect` in a thin `page.tsx` **or** `next.config` redirect — pick the pattern already used in the repo.

### Dependency graph
```
MainLayout → InstallAppBanner  (remove)
Header / Footer / navigation.ts → /app  (remove links)
sitemap → /app  (remove)
[locale]/app/page → marketing + link to /app/  (remove page content / redirect)
```

### Risks
- Broken external links to `/en/app` etc. → mitigate with redirect to home.
- Orphan i18n keys → harmless; clean up with the page removal.
- Scripts that screenshot `/app` → update or leave; not user-facing.

### Rollback
Restore deleted files from git; re-add nav entries and `MainLayout` banner mount.
