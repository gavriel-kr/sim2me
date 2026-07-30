# ADD — Ticket 019: Articles Full Language Coverage

## Architecture

- **Source of truth:** PostgreSQL `articles` table (Prisma `Article` model).
- **Delivery mechanism:** One-off Node scripts under `scripts/article-locale-fills/` run locally with `DATABASE_URL`. No runtime API changes.
- **Safety:** Apply functions **skip** updating a locale if `title{Loc}` is already non-empty or `status{Loc}` is already `PUBLISHED` (configurable dry-run).

## Patterns

1. **Short template** (~25 slugs): same structure as Part7 “למה Sim2Me” guides — two CTA blocks, shared intro/tips; only the “local context” paragraph varies per country. Generated via `buildShortTemplateHtml()` + per-slug `p4` + destination code.
2. **Long / unique articles:** filled from existing published locale (usually `contentHe` or `contentEn`) with manual translation embedded in batch JSON or dedicated script sections — same SEO field set as admin editor.

## Files

- `scripts/article-locale-fills/slug-to-dest.mjs` — merged slug → destination segment
- `scripts/article-locale-fills/short-template-builder.mjs` — HTML + SEO builders
- `scripts/article-locale-fills/short-template-data.mjs` — per-slug strings (titles, p4 EN/AR)
- `scripts/article-locale-fills/apply-short-template.mjs` — Prisma updates
- Additional `apply-*.mjs` / JSON batches for non-template articles as needed

## Rollback

Re-import from backup or re-run admin to set affected locales to `DRAFT`; no destructive migration.
