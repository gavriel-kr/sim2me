# DIP — Ticket 003: Articles Multi-Language Consolidation

## Status Legend: [ ] pending · [✅] done

---

## Phase 1 — Schema & Migration Setup

- [✅] **1.1** Create Prisma migration: new Article model with multi-locale columns
  - slug (unique), titleEn/He/Ar, contentEn/He/Ar, excerptEn/He/Ar
  - focusKeywordEn/He/Ar, metaTitleEn/He/Ar, metaDescEn/He/Ar, ogTitleEn/He/Ar, ogDescEn/He/Ar, canonicalUrlEn/He/Ar
  - statusEn/He/Ar, featuredImage, articleOrder, showRelatedArticles
  - Strategy: raw SQL migration — rename `articles` → `articles_legacy`, create new `articles` table

- [✅] **1.2** Create `prisma/scripts/migrate-articles-to-multilang.ts`
  - Read from `articles_legacy` (raw or temp model)
  - SLUG_TO_CANONICAL map for known different-slug-same-destination (esim-turkiya→esim-turkey-guide, esim-thailand-he→esim-thailand-guide, etc.)
  - Group by slug first; for unmerged rows, group by destination (extract from title, normalize)
  - Merge into new articles table
  - Idempotent: skip if new table already populated

- [✅] **1.3** Run migration + script, verify data in new table

- [ ] **1.4** Migration to drop `articles_legacy` (after verification)

---

## Phase 2 — Articles Lib (`src/lib/articles.ts`)

- [✅] **2.1** `getArticleBySlug(slug, locale)` — query by slug, pick title/content/excerpt/SEO from `title${Locale}` etc., require `status${Locale} === 'PUBLISHED'`

- [✅] **2.2** `getPublishedArticles(locale)` — where `status${locale} === 'PUBLISHED'`, return slug + that locale's title/excerpt/meta

- [✅] **2.3** `getArticleHreflangs(slug)` — return locales where content exists (title non-empty) and status is PUBLISHED

- [✅] **2.4** `getRelatedArticlesForCarousel(excludeArticleId, locale)` — filter by status, return articles for that locale

---

## Phase 3 — Admin API

- [✅] **3.1** `GET /api/admin/articles` — return articles with all locale fields (for list + editor)

- [✅] **3.2** `POST /api/admin/articles` — create with slug + all locale fields

- [✅] **3.3** `GET /api/admin/articles/[id]` — return full article

- [✅] **3.4** `PATCH /api/admin/articles/[id]` — update any locale fields

- [✅] **3.5** `DELETE /api/admin/articles/[id]` — unchanged

---

## Phase 4 — Admin UI (`ArticlesClient.tsx`)

- [✅] **4.1** List: one row per article (slug), show EN/HE/AR badges with status (Live/Draft)

- [✅] **4.2** Editor: locale tabs (EN | HE | AR), each tab: Main (title, excerpt, status), Content (rich text), SEO

- [✅] **4.3** New article: slug + all locales in tabs

- [✅] **4.4** Remove filter by locale (no longer needed); keep search, status filter, sort

- [✅] **4.5** Update `page.tsx` to fetch for new schema

---

## Phase 5 — Frontend & Sitemap

- [✅] **5.1** `/[locale]/articles/[slug]/page.tsx` — verify works with updated `getArticleBySlug` (no structural change expected)

- [✅] **5.2** `/[locale]/articles/page.tsx` — verify works with `getPublishedArticles`

- [✅] **5.3** `src/app/sitemap.ts` — iterate articles, for each locale where `status${locale} === 'PUBLISHED'` emit URL

---

## Phase 6 — Bulk Fill & Other

- [✅] **6.1** `bulk-fill-keywords/route.ts` — update for focusKeywordEn/He/Ar based on titleEn/He/Ar

- [✅] **6.2** `update-phase7-articles.ts` — adapt for new schema if still used

- [ ] **6.3** Seed scripts (seed-articles*.ts) — optional for production — update format for new schema (or mark deprecated for production)

---

## Files Modified

1. `prisma/schema.prisma`
2. `prisma/migrations/` (2 migrations: schema change + drop legacy)
3. `prisma/scripts/migrate-articles-to-multilang.ts` ← new
4. `src/lib/articles.ts`
5. `src/app/api/admin/articles/route.ts`
6. `src/app/api/admin/articles/[id]/route.ts`
7. `src/app/admin/articles/ArticlesClient.tsx`
8. `src/app/admin/articles/page.tsx`
9. `src/app/sitemap.ts`
10. `src/app/api/admin/articles/bulk-fill-keywords/route.ts`
11. `src/lib/update-phase7-articles.ts` (if applicable)

---

## Rollback Plan

- Keep `articles_legacy` until production verification.
- Rollback: restore schema, rename tables, revert code.
- No external API changes.
