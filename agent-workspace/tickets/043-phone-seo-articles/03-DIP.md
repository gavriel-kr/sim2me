# Ticket 043 — Implementation plan and status

Local only. Nothing committed or deployed. Status icons: ⬜ open · ✅ done

## Phase 0 — Backups

- ✅ `backup/` — every code file copied before its first edit (`manifest.json`), `pre-existing.diff`, HEAD `f2fa501`
- ✅ `backup/db-snapshot-articles-2026-09-29.json` — the whole articles table (181 rows) before any DB change

## Phase 1 — Code

- ✅ Schema: 10 Hindi columns on `articles` (`titleHi` … `statusHi`), additive only
- ✅ `articles.ts`: Hindi locale; Hindi readers get Hindi articles first, then English ones (noindex, canonical to English); admin preview loader
- ✅ Article page: `Article` + FAQ + Breadcrumb structured data (FAQ printed once), hreflang for 4 languages + `x-default`, Open Graph/Twitter with image fallback, keywords, admin-only `?preview=1` (noindex, banner)
- ✅ `ArticleDetail`: `article-body` typography, Hindi labels, Arabic "read more" showed Hebrew text — fixed, `lang`/`dir` from the text's language
- ✅ `globals.css`: article typography, tables that scroll on phones, summary/note/CTA/button styles (`:where()` so old articles' own classes still win)
- ✅ Articles index: Hindi meta, indexable once Hindi articles exist, hreflang with `hi`
- ✅ Sitemap: Hindi articles, per-article language alternates
- ✅ Admin: Hindi tab (fields, editor, SEO, status), HI badge and link; links open on the same site and drafts open as preview
- ✅ API create/update accept Hindi fields
- ✅ SEO copy: homepage, destination pages (localized, mention phone numbers when the destination has them), `/phone-plans` and number pages (per-number descriptions, hreflang, Open Graph)
- ✅ `tsc` 0, lint 0 errors (3 old warnings)

## Phase 2 — Content

- ✅ 14 articles × he/en/ar/hi in `articles/NN-slug/` + `meta.json` (title, excerpt, keyword, meta title/description, OG)
- ✅ `articles/build.cjs`: checks lengths, links, forbidden terms (verification codes), balanced HTML, FAQ; builds `dist/` with FAQ JSON-LD; isolates `+33`/`+1` as LTR in he/ar — 56/56 pass
- ✅ Facts checked against the catalogue (plans, prices, 168 / 36 countries, networks, exclusions) on 2026-09-29

## Phase 3 — Database (shared with production)

- ✅ `prisma migrate diff` before: only `ALTER TABLE articles ADD COLUMN` × 10; `db push` done; diff after: empty
- ✅ `articles/import.ts --apply`: 14 articles created, **DRAFT in all four languages**
- ✅ Live site checked after: draft URL redirects, sitemap has none of them, articles pages 200
- ✅ Local: articles pages in 4 languages 200; draft without admin redirects; admin preview renders (he desktop, hi/ar at 500px), noindex, FAQPage + Article + Breadcrumb

## Phase 4 — Deploy

- ✅ Gabriel reviewed and approved the articles and the deploy (2026-09-29)
- ✅ Found in the smoke: "| Sim2Me | Sim2Me" on the articles index and on older articles whose meta title already has the brand — fixed (`absolute` title), all gates re-run
- ✅ Tag `pre-deploy-20260929-1400`, `DEPLOY-READINESS.md`
- ⬜ Push, post-deploy smoke
- ⬜ Publish the 14 articles in all four languages, check them live

## Rollback

- Code: restore from `backup/` (or `git checkout` the listed files). **Keep the 10 Hindi lines in `prisma/schema.prisma`**: the
  Vercel build runs `prisma db push`, and a schema without those columns would try to drop them (with data) and fail the build.
- Articles: `DELETE FROM articles WHERE slug IN (the 14 slugs)`, or set their statuses back to DRAFT.
- The snapshot restores the table as it was before this ticket if ever needed.
