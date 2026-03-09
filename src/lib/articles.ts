import { prisma } from '@/lib/prisma';

export type ArticleLocale = 'en' | 'he' | 'ar';

export interface ArticleSummary {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  articleOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleFull extends ArticleSummary {
  content: string;
  focusKeyword: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
  canonicalUrl: string | null;
  showRelatedArticles: boolean;
}

const LOCALE_SUFFIX = { en: 'En', he: 'He', ar: 'Ar' } as const;

function pickLocaleFields<T extends Record<string, unknown>>(
  row: T,
  locale: ArticleLocale
): { title: string; excerpt: string | null; metaTitle: string | null; metaDesc: string | null } {
  const s = LOCALE_SUFFIX[locale];
  return {
    title: (row[`title${s}`] as string) ?? '',
    excerpt: (row[`excerpt${s}`] as string | null) ?? null,
    metaTitle: (row[`metaTitle${s}`] as string | null) ?? null,
    metaDesc: (row[`metaDesc${s}`] as string | null) ?? null,
  };
}

function pickLocaleFieldsFull<T extends Record<string, unknown>>(
  row: T,
  locale: ArticleLocale
): ArticleFull {
  const s = LOCALE_SUFFIX[locale];
  const base = pickLocaleFields(row, locale);
  return {
    id: row.id as string,
    slug: row.slug as string,
    locale,
    title: base.title,
    excerpt: base.excerpt,
    featuredImage: row.featuredImage as string | null,
    metaTitle: base.metaTitle,
    metaDesc: base.metaDesc,
    articleOrder: row.articleOrder as number,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
    content: (row[`content${s}`] as string) ?? '',
    focusKeyword: (row[`focusKeyword${s}`] as string | null) ?? null,
    ogTitle: (row[`ogTitle${s}`] as string | null) ?? null,
    ogDesc: (row[`ogDesc${s}`] as string | null) ?? null,
    canonicalUrl: (row[`canonicalUrl${s}`] as string | null) ?? null,
    showRelatedArticles: (row.showRelatedArticles as boolean) ?? true,
  } as ArticleFull;
}

export async function getPublishedArticles(locale: ArticleLocale): Promise<ArticleSummary[]> {
  const statusKey = `status${LOCALE_SUFFIX[locale]}` as 'statusEn' | 'statusHe' | 'statusAr';
  const rows = await prisma.article.findMany({
    where: { [statusKey]: 'PUBLISHED' },
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleHe: true,
      titleAr: true,
      excerptEn: true,
      excerptHe: true,
      excerptAr: true,
      featuredImage: true,
      metaTitleEn: true,
      metaTitleHe: true,
      metaTitleAr: true,
      metaDescEn: true,
      metaDescHe: true,
      metaDescAr: true,
      articleOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((r) => {
    const base = pickLocaleFields(r, locale);
    return {
      id: r.id,
      slug: r.slug,
      locale,
      title: base.title,
      excerpt: base.excerpt,
      featuredImage: r.featuredImage,
      metaTitle: base.metaTitle,
      metaDesc: base.metaDesc,
      articleOrder: r.articleOrder,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    } as ArticleSummary;
  });
}

export async function getArticleBySlug(slug: string, locale: ArticleLocale): Promise<ArticleFull | null> {
  const statusKey = `status${LOCALE_SUFFIX[locale]}` as 'statusEn' | 'statusHe' | 'statusAr';
  const article = await prisma.article.findFirst({
    where: { slug, [statusKey]: 'PUBLISHED' },
  });
  if (!article) return null;
  return pickLocaleFieldsFull(article, locale);
}

/** Same locale, exclude current article — all for carousel */
export async function getRelatedArticlesForCarousel(
  excludeArticleId: string,
  locale: ArticleLocale
): Promise<ArticleSummary[]> {
  const statusKey = `status${LOCALE_SUFFIX[locale]}` as 'statusEn' | 'statusHe' | 'statusAr';
  const rows = await prisma.article.findMany({
    where: {
      [statusKey]: 'PUBLISHED',
      id: { not: excludeArticleId },
    },
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleHe: true,
      titleAr: true,
      excerptEn: true,
      excerptHe: true,
      excerptAr: true,
      featuredImage: true,
      metaTitleEn: true,
      metaTitleHe: true,
      metaTitleAr: true,
      metaDescEn: true,
      metaDescHe: true,
      metaDescAr: true,
      articleOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((r) => {
    const base = pickLocaleFields(r, locale);
    return {
      id: r.id,
      slug: r.slug,
      locale,
      title: base.title,
      excerpt: base.excerpt,
      featuredImage: r.featuredImage,
      metaTitle: base.metaTitle,
      metaDesc: base.metaDesc,
      articleOrder: r.articleOrder,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    } as ArticleSummary;
  });
}

/** Returns alternate hreflangs for a given slug across all locales */
export async function getArticleHreflangs(slug: string): Promise<{ locale: string; slug: string }[]> {
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { statusEn: true, statusHe: true, statusAr: true, titleEn: true, titleHe: true, titleAr: true },
  });
  if (!article) return [];

  const result: { locale: string; slug: string }[] = [];
  for (const loc of ['en', 'he', 'ar'] as const) {
    const status = article[`status${LOCALE_SUFFIX[loc]}`];
    const title = article[`title${LOCALE_SUFFIX[loc]}`];
    if (status === 'PUBLISHED' && title && title.trim()) {
      result.push({ locale: loc, slug });
    }
  }
  return result;
}
