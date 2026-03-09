-- Articles multi-language consolidation
-- Step 1: Rename existing table to preserve data (only if articles exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles') THEN
    ALTER TABLE "articles" RENAME TO "articles_legacy";
  END IF;
END $$;

-- Step 1b: Rename PK on articles_legacy so "articles_pkey" is free for new table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE c.conname = 'articles_pkey' AND t.relname = 'articles_legacy') THEN
    ALTER TABLE "articles_legacy" RENAME CONSTRAINT "articles_pkey" TO "articles_legacy_pkey";
  END IF;
END $$;

-- Step 2: Drop articles if exists (recovery from partial migration)
DROP TABLE IF EXISTS "articles" CASCADE;

-- Step 3: Create new articles table with multi-locale columns
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL DEFAULT '',
    "titleHe" TEXT NOT NULL DEFAULT '',
    "titleAr" TEXT NOT NULL DEFAULT '',
    "contentEn" TEXT NOT NULL DEFAULT '',
    "contentHe" TEXT NOT NULL DEFAULT '',
    "contentAr" TEXT NOT NULL DEFAULT '',
    "excerptEn" TEXT,
    "excerptHe" TEXT,
    "excerptAr" TEXT,
    "focusKeywordEn" TEXT,
    "focusKeywordHe" TEXT,
    "focusKeywordAr" TEXT,
    "metaTitleEn" TEXT,
    "metaTitleHe" TEXT,
    "metaTitleAr" TEXT,
    "metaDescEn" TEXT,
    "metaDescHe" TEXT,
    "metaDescAr" TEXT,
    "ogTitleEn" TEXT,
    "ogTitleHe" TEXT,
    "ogTitleAr" TEXT,
    "ogDescEn" TEXT,
    "ogDescHe" TEXT,
    "ogDescAr" TEXT,
    "canonicalUrlEn" TEXT,
    "canonicalUrlHe" TEXT,
    "canonicalUrlAr" TEXT,
    "statusEn" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "statusHe" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "statusAr" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "featuredImage" TEXT,
    "articleOrder" INTEGER NOT NULL DEFAULT 0,
    "showRelatedArticles" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- Unique slug
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");
