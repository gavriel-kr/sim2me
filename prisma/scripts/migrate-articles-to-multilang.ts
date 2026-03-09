/**
 * Migrate articles from legacy (slug+locale per row) to new multilang schema.
 * Run after applying migration 20250309000000_articles_multilang.
 * Usage: npx tsx prisma/scripts/migrate-articles-to-multilang.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Locale = 'en' | 'he' | 'ar';

interface LegacyArticle {
  id: string;
  slug: string;
  locale: string;
  title: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  focusKeyword: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
  canonicalUrl: string | null;
  articleOrder: number;
  status: string;
  showRelatedArticles: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Map non-canonical slugs to canonical slug (for same-destination articles) */
const SLUG_TO_CANONICAL: Record<string, string> = {
  // General guides
  'esim-letayel-madrich-shalem': 'best-esim-for-travel',
  'afdal-esim-lissafar': 'best-esim-for-travel',
  // USA
  'esim-artsot-habrit': 'esim-usa-guide',
  'esim-usa': 'esim-usa-guide',
  'esim-amrika': 'esim-usa-guide',
  // Europe
  'esim-europa-madrich': 'esim-europe-guide',
  'esim-orouba': 'esim-europe-guide',
  // Thailand
  'esim-thailand-he': 'esim-thailand-guide',
  'esim-thailand-ar': 'esim-thailand-guide',
  'esim-thailand-travel': 'esim-thailand-guide',
  // Dubai/UAE
  'esim-dubai-he': 'esim-uae-dubai-guide',
  'esim-alimarat-dubai': 'esim-uae-dubai-guide',
  // Turkey
  'esim-turkiya': 'esim-turkey-guide',
  'esim-turkey': 'esim-turkey-guide',
  // Greece
  'esim-yunan': 'esim-greece-guide',
  'esim-greece': 'esim-greece-guide',
  // London/UK
  'esim-london-ar': 'esim-uk-guide',
  'esim-london': 'esim-uk-guide',
  // Germany
  'esim-germany-ar': 'esim-germany-guide',
  'esim-germany': 'esim-germany-guide',
  // Cyprus
  'esim-cyprus-ar': 'esim-cyprus',
  // How eSIM works
  'kayfiyyat-tafeel-esim': 'how-does-esim-work',
  // eSIM vs SIM
  'esim-moqabil-sim-taqlidi': 'esim-vs-physical-sim-vs-roaming',
  // Saudi/Gulf
  'esim-assaoudiyya-khaleej': 'esim-uae-dubai-guide',
};

function getCanonicalSlug(slug: string): string {
  return SLUG_TO_CANONICAL[slug] ?? slug;
}

async function main() {
  // Check if new table already has data (idempotent)
  const existing = await prisma.article.count();
  if (existing > 0) {
    console.log(`Articles table already has ${existing} rows. Skipping migration.`);
    return;
  }

  // Read from legacy table via raw query
  const legacy = await prisma.$queryRaw<LegacyArticle[]>`
    SELECT id, slug, locale, title, content, excerpt, "featuredImage", "focusKeyword",
           "metaTitle", "metaDesc", "ogTitle", "ogDesc", "canonicalUrl",
           "articleOrder", status, "showRelatedArticles", "createdAt", "updatedAt"
    FROM articles_legacy
    ORDER BY slug, locale
  `;

  if (legacy.length === 0) {
    console.log('No legacy articles found.');
    return;
  }

  // Group by canonical slug
  const groups = new Map<string, LegacyArticle[]>();
  for (const row of legacy) {
    const canonical = getCanonicalSlug(row.slug);
    if (!groups.has(canonical)) groups.set(canonical, []);
    groups.get(canonical)!.push(row);
  }

  let created = 0;
  for (const [canonicalSlug, rows] of groups) {
    const byLocale: Record<Locale, LegacyArticle | undefined> = { en: undefined, he: undefined, ar: undefined };
    for (const r of rows) {
      const loc = r.locale as Locale;
      if (!byLocale[loc] || r.slug === canonicalSlug) byLocale[loc] = r;
    }
    const en = byLocale['en'];
    const he = byLocale['he'];
    const ar = byLocale['ar'];

    const getTitle = (r: LegacyArticle | undefined) => r?.title ?? '';
    const getContent = (r: LegacyArticle | undefined) => r?.content ?? '';
    const getExcerpt = (r: LegacyArticle | undefined) => r?.excerpt ?? null;
    const getStatus = (r: LegacyArticle | undefined) => (r?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT') as const;

    const featuredImage = en?.featuredImage ?? he?.featuredImage ?? ar?.featuredImage ?? null;
    const articleOrder = en?.articleOrder ?? he?.articleOrder ?? ar?.articleOrder ?? 0;
    const showRelatedArticles = en?.showRelatedArticles ?? he?.showRelatedArticles ?? ar?.showRelatedArticles ?? true;
    const createdAt = en?.createdAt ?? he?.createdAt ?? ar?.createdAt ?? new Date();
    const updatedAt = new Date();

    await prisma.article.create({
      data: {
        slug: canonicalSlug,
        titleEn: getTitle(en),
        titleHe: getTitle(he),
        titleAr: getTitle(ar),
        contentEn: getContent(en),
        contentHe: getContent(he),
        contentAr: getContent(ar),
        excerptEn: getExcerpt(en),
        excerptHe: getExcerpt(he),
        excerptAr: getExcerpt(ar),
        focusKeywordEn: en?.focusKeyword ?? null,
        focusKeywordHe: he?.focusKeyword ?? null,
        focusKeywordAr: ar?.focusKeyword ?? null,
        metaTitleEn: en?.metaTitle ?? null,
        metaTitleHe: he?.metaTitle ?? null,
        metaTitleAr: ar?.metaTitle ?? null,
        metaDescEn: en?.metaDesc ?? null,
        metaDescHe: he?.metaDesc ?? null,
        metaDescAr: ar?.metaDesc ?? null,
        ogTitleEn: en?.ogTitle ?? null,
        ogTitleHe: he?.ogTitle ?? null,
        ogTitleAr: ar?.ogTitle ?? null,
        ogDescEn: en?.ogDesc ?? null,
        ogDescHe: he?.ogDesc ?? null,
        ogDescAr: ar?.ogDesc ?? null,
        canonicalUrlEn: en?.canonicalUrl ?? null,
        canonicalUrlHe: he?.canonicalUrl ?? null,
        canonicalUrlAr: ar?.canonicalUrl ?? null,
        statusEn: getStatus(en),
        statusHe: getStatus(he),
        statusAr: getStatus(ar),
        featuredImage,
        articleOrder,
        showRelatedArticles,
        createdAt,
        updatedAt,
      },
    });
    created++;
  }

  console.log(`Migrated ${created} articles from ${legacy.length} legacy rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
