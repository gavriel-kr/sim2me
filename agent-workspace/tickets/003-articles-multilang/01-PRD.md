# PRD — Ticket 003: Articles Multi-Language Consolidation

## Background

The admin articles list at `/admin/articles` shows each language variant as a separate row. Articles about the same destination (e.g. eSIM for Italy) appear as 3 rows (EN, HE, AR), making management cumbersome. Some articles share the same slug across languages; others use different slugs (e.g. `esim-turkey` vs `esim-turkiya`).

## Requirements

### R1 — One Article = One Topic (All Languages)

- Articles about the same destination/topic shall be **one row** in the database.
- Each article has fields per language: `titleEn`, `titleHe`, `titleAr`, `contentEn`, `contentHe`, `contentAr`, etc.
- Follows the existing `Page` model pattern.

### R2 — Canonical Slug

- One **canonical slug** per article (typically English).
- All language variants use the same URL path: `/en/articles/{slug}`, `/he/articles/{slug}`, `/ar/articles/{slug}`.
- Articles with different slugs for the same destination (e.g. `esim-turkiya` → `esim-turkey`) are merged; canonical slug is chosen (no surprises).

### R3 — Status Per Language

- Each language has its own status: `statusEn`, `statusHe`, `statusAr` (DRAFT | PUBLISHED).
- Allows publishing EN first, adding HE/AR later when ready.

### R4 — Full SEO Per Language

- All SEO fields per language: `metaTitleEn/He/Ar`, `metaDescEn/He/Ar`, `ogTitleEn/He/Ar`, `ogDescEn/He/Ar`, `focusKeywordEn/He/Ar`, `canonicalUrlEn/He/Ar`, `excerptEn/He/Ar`.
- Admin UI shows all languages in one edit view (tabs or accordion).

### R5 — Migration

- **Preserve all existing data**.
- Group articles by destination (auto-detect from title when slugs differ).
- Merge into new schema; ensure site displays correctly after migration.
- Migration script must be idempotent and reversible (with backup).

## Out of Scope

- Changing URL structure for published articles (canonical slug preserves `/articles/{slug}`).
- Automatic translation (admin fills content manually).
- New languages beyond en/he/ar.
