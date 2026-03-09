# ADD — Ticket 003: Articles Multi-Language Consolidation

## Architecture Overview

Consolidate the Article model from "one row per locale" to "one row per topic" with multi-language columns, following the existing `Page` + `SeoMeta` pattern. Migration merges existing data by slug and destination.

---

## 1. Schema Change

### New Article Model

Replace current `Article` with multi-locale columns:

```prisma
model Article {
  id                  String   @id @default(cuid())
  slug                String   @unique   // canonical slug (e.g. esim-italy)
  // Content per locale
  titleEn             String   @default("")
  titleHe             String   @default("")
  titleAr             String   @default("")
  contentEn           String   @default("") @db.Text
  contentHe           String   @default("") @db.Text
  contentAr           String   @default("") @db.Text
  excerptEn           String?   @db.Text
  excerptHe           String?   @db.Text
  excerptAr           String?   @db.Text
  // SEO per locale
  focusKeywordEn      String?
  focusKeywordHe      String?
  focusKeywordAr      String?
  metaTitleEn         String?
  metaTitleHe         String?
  metaTitleAr         String?
  metaDescEn          String?  @db.Text
  metaDescHe          String?  @db.Text
  metaDescAr          String?  @db.Text
  ogTitleEn           String?
  ogTitleHe           String?
  ogTitleAr           String?
  ogDescEn            String?  @db.Text
  ogDescHe            String?  @db.Text
  ogDescAr            String?  @db.Text
  canonicalUrlEn      String?
  canonicalUrlHe      String?
  canonicalUrlAr      String?
  // Status per locale
  statusEn            ArticleStatus @default(DRAFT)
  statusHe            ArticleStatus @default(DRAFT)
  statusAr            ArticleStatus @default(DRAFT)
  // Shared
  featuredImage       String?
  articleOrder        Int      @default(0)
  showRelatedArticles Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("articles")
}
```

- **Slug**: unique, canonical (one per article).
- **Shared**: `featuredImage`, `articleOrder`, `showRelatedArticles`.
- **Per-locale**: all content + SEO + status.

---

## 2. Migration Strategy

### Phase A — Backup & New Table

1. Create migration that:
   - Rename `articles` → `articles_legacy`.
   - Create new `articles` with new schema.

### Phase B — Migration Script

`prisma/scripts/migrate-articles-to-multilang.ts`:

1. **Group by slug**  
   For each distinct `slug` in `articles_legacy`, collect all locale rows. Merge into one new row.

2. **Group by destination** (for different slugs)  
   - Extract destination from title (reuse `getDestinationFromTitle` logic).
   - Maintain `SLUG_TO_CANONICAL` map: `{ "esim-turkiya": "esim-turkey", "esim-thailand-he": "esim-thailand-guide", ... }`.
   - For each legacy row with slug not yet merged: if slug in map, merge into canonical article; else try destination match.
   - Destination normalization: config `DESTINATION_ALIASES` maps locale-specific names to canonical key (e.g. "Turkey" / "تركيا" / "תורכיה" → "turkey").

3. **Canonical slug choice**  
   Prefer EN slug when same destination; else first slug in group.

4. **Data mapping**  
   - `titleEn` ← row where locale=en, etc.
   - `statusEn` ← row where locale=en, etc.
   - Shared fields: take from first non-null (e.g. featuredImage from any locale).

5. **Idempotency**  
   Script checks if new `articles` has data; if yes, skip or dry-run only.

### Phase C — Cleanup

- After verification: drop `articles_legacy` in a follow-up migration.

---

## 3. Data Flow

```
Legacy: articles (slug, locale, title, content, ...)
         ↓ migration script
New:     articles (slug, titleEn, titleHe, titleAr, contentEn, ...)

Frontend: /[locale]/articles/[slug]
         → getArticleBySlug(slug, locale)
         → pick titleEn/He/Ar, contentEn/He/Ar, statusEn/He/Ar by locale
```

---

## 4. Code Changes

### 4.1 `src/lib/articles.ts`

- `getArticleBySlug(slug, locale)`: query by `slug`, return `{ title: article[`title${Locale}`], content: article[`content${Locale}`], ... }` based on locale. Check `status${Locale} === 'PUBLISHED'`.
- `getPublishedArticles(locale)`: filter `status${locale} === 'PUBLISHED'`, return articles with that locale's title/excerpt.
- `getArticleHreflangs(slug)`: return `[{ locale: 'en', slug }, { locale: 'he', slug }, { locale: 'ar', slug }]` for locales where content exists (title non-empty).
- `getRelatedArticlesForCarousel`: same as today, filter by locale status.

### 4.2 Admin API

- `GET /api/admin/articles`: return articles with all locale fields (for admin list).
- `POST /api/admin/articles`: create with all locale fields.
- `PATCH /api/admin/articles/[id]`: update any locale fields.
- `DELETE`: unchanged.

### 4.3 Admin UI — `ArticlesClient.tsx`

- **List**: one row per article (slug). Show badges EN/HE/AR for which locales have content + status.
- **Editor**: tabs "EN | HE | AR" per article. Each tab: Main (title, excerpt, status), Content (rich text), SEO.
- **New article**: slug required; all locales editable in tabs.

### 4.4 Frontend Pages

- `/[locale]/articles/[slug]/page.tsx`: use updated `getArticleBySlug`; no structural change.
- `/[locale]/articles/page.tsx`: use updated `getPublishedArticles`; no structural change.
- Sitemap: iterate articles, for each slug emit URLs for locales where `status${locale} === 'PUBLISHED'`.

---

## 5. Slug Canonical Mapping (Migration)

Config in migration script:

```ts
const SLUG_TO_CANONICAL: Record<string, string> = {
  'esim-turkiya': 'esim-turkey-guide',
  'esim-thailand-he': 'esim-thailand-guide',
  'esim-thailand-ar': 'esim-thailand-guide',
  // ... add as discovered from seed/production
};
```

Destination-based grouping uses normalized destination key from title; config expanded as needed.

---

## 6. Files Modified / New

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Replace Article model |
| `prisma/scripts/migrate-articles-to-multilang.ts` | **New** — migration script |
| `src/lib/articles.ts` | Update all queries for new schema |
| `src/app/api/admin/articles/route.ts` | GET/POST for new schema |
| `src/app/api/admin/articles/[id]/route.ts` | GET/PATCH/DELETE for new schema |
| `src/app/admin/articles/ArticlesClient.tsx` | List + editor with locale tabs |
| `src/app/admin/articles/page.tsx` | Fetch for new schema |
| `src/app/sitemap.ts` | Iterate by locale status |
| `src/app/api/admin/articles/bulk-fill-keywords/route.ts` | Adapt for per-locale keywords |

---

## 7. Rollback Plan

- Keep `articles_legacy` until verification complete.
- Rollback migration: rename tables back, revert schema.
- No external API changes.
