import { prisma } from '@/lib/prisma';
import type { Article } from '@prisma/client';

export type ArticleLocale = 'en' | 'he' | 'ar' | 'hi';

/** Every language an article can be written in, in the order the admin shows them. */
export const ARTICLE_LOCALES: readonly ArticleLocale[] = ['en', 'he', 'ar', 'hi'];

/**
 * Maps a UI locale to the article columns it reads. Ticket 043 gave Hindi its own columns, so every
 * UI locale reads its own; anything else reads English.
 */
export function toArticleLocale(locale: string): ArticleLocale {
  return (ARTICLE_LOCALES as readonly string[]).includes(locale) ? (locale as ArticleLocale) : 'en';
}

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

const LOCALE_SUFFIX = { en: 'En', he: 'He', ar: 'Ar', hi: 'Hi' } as const;

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
  const statusKey = `status${LOCALE_SUFFIX[locale]}` as 'statusEn' | 'statusHe' | 'statusAr' | 'statusHi';
  const rows = await prisma.article.findMany({
    where: { [statusKey]: 'PUBLISHED' },
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleHe: true,
      titleAr: true,
      titleHi: true,
      excerptEn: true,
      excerptHe: true,
      excerptAr: true,
      excerptHi: true,
      featuredImage: true,
      metaTitleEn: true,
      metaTitleHe: true,
      metaTitleAr: true,
      metaTitleHi: true,
      metaDescEn: true,
      metaDescHe: true,
      metaDescAr: true,
      metaDescHi: true,
      articleOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((r: Article) => {
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
  const statusKey = `status${LOCALE_SUFFIX[locale]}` as 'statusEn' | 'statusHe' | 'statusAr' | 'statusHi';
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
  const statusKey = `status${LOCALE_SUFFIX[locale]}` as 'statusEn' | 'statusHe' | 'statusAr' | 'statusHi';
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
      titleHi: true,
      excerptEn: true,
      excerptHe: true,
      excerptAr: true,
      excerptHi: true,
      featuredImage: true,
      metaTitleEn: true,
      metaTitleHe: true,
      metaTitleAr: true,
      metaTitleHi: true,
      metaDescEn: true,
      metaDescHe: true,
      metaDescAr: true,
      metaDescHi: true,
      articleOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((r: Article) => {
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
    select: {
      statusEn: true, statusHe: true, statusAr: true, statusHi: true,
      titleEn: true, titleHe: true, titleAr: true, titleHi: true,
    },
  });
  if (!article) return [];

  const result: { locale: string; slug: string }[] = [];
  for (const loc of ARTICLE_LOCALES) {
    const status = article[`status${LOCALE_SUFFIX[loc]}`];
    const title = article[`title${LOCALE_SUFFIX[loc]}`];
    if (status === 'PUBLISHED' && title && title.trim()) {
      result.push({ locale: loc, slug });
    }
  }
  return result;
}

/*
  What a reader of one UI language gets (ticket 043). Hebrew, Arabic and English readers get their own
  language only, as before. Hindi has far fewer articles, so a Hindi reader gets the Hindi ones first
  and then the English articles that have no Hindi version — the way ticket 038 served every article —
  and the article page keeps those English ones out of the index. `locale` on each result says which
  language the text is in.
*/

/**
 * An article in one language whatever its status, for an admin previewing a draft (ticket 043).
 * Null when that language has no title yet. Callers must check the admin session first.
 */
export async function getArticleForPreview(slug: string, uiLocale: string): Promise<ArticleFull | null> {
  const locale = toArticleLocale(uiLocale);
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return null;
  const full = pickLocaleFieldsFull(article, locale);
  return full.title.trim() ? full : null;
}

/** How many articles are published in one language. */
export async function countPublishedArticles(locale: ArticleLocale): Promise<number> {
  const statusKey = `status${LOCALE_SUFFIX[locale]}` as 'statusEn' | 'statusHe' | 'statusAr' | 'statusHi';
  return prisma.article.count({ where: { [statusKey]: 'PUBLISHED' } });
}

/** The article at /<uiLocale>/articles/<slug>, or null. */
export async function getArticleForReader(slug: string, uiLocale: string): Promise<ArticleFull | null> {
  const locale = toArticleLocale(uiLocale);
  const own = await getArticleBySlug(slug, locale);
  if (own || locale !== 'hi') return own;
  return getArticleBySlug(slug, 'en');
}

/** The articles index for one UI language. */
export async function getArticlesForReader(uiLocale: string): Promise<ArticleSummary[]> {
  const locale = toArticleLocale(uiLocale);
  const own = await getPublishedArticles(locale);
  if (locale !== 'hi') return own;
  const translated = new Set(own.map((a) => a.slug));
  const english = (await getPublishedArticles('en')).filter((a) => !translated.has(a.slug));
  return [...own, ...english];
}

/** The related-articles carousel under one article, for one UI language. */
export async function getRelatedArticlesForReader(excludeArticleId: string, uiLocale: string): Promise<ArticleSummary[]> {
  const locale = toArticleLocale(uiLocale);
  const own = await getRelatedArticlesForCarousel(excludeArticleId, locale);
  if (locale !== 'hi') return own;
  const translated = new Set(own.map((a) => a.slug));
  const english = (await getRelatedArticlesForCarousel(excludeArticleId, 'en')).filter((a) => !translated.has(a.slug));
  return [...own, ...english];
}
