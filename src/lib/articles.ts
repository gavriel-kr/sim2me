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

export async function getPublishedArticles(locale: ArticleLocale): Promise<ArticleSummary[]> {
  return prisma.article.findMany({
    where: { locale, status: 'PUBLISHED' },
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, slug: true, locale: true, title: true,
      excerpt: true, featuredImage: true,
      metaTitle: true, metaDesc: true,
      articleOrder: true, createdAt: true, updatedAt: true,
    },
  });
}

export async function getArticleBySlug(slug: string, locale: ArticleLocale): Promise<ArticleFull | null> {
  const article = await prisma.article.findFirst({
    where: { slug, locale, status: 'PUBLISHED' },
  });
  if (!article) return null;
  return {
    ...article,
    showRelatedArticles: article.showRelatedArticles ?? true,
  } as ArticleFull;
}

/** Same locale, exclude current article, random order, for "related articles" block */
export async function getRelatedArticles(
  excludeArticleId: string,
  locale: ArticleLocale,
  limit: number = 3
): Promise<ArticleSummary[]> {
  const rows = await prisma.article.findMany({
    where: {
      locale,
      status: 'PUBLISHED',
      id: { not: excludeArticleId },
    },
    orderBy: { id: 'asc' }, // stable order before random
    take: limit * 2, // fetch extra then shuffle and slice (Prisma has no random())
    select: {
      id: true, slug: true, locale: true, title: true,
      excerpt: true, featuredImage: true,
      metaTitle: true, metaDesc: true,
      articleOrder: true, createdAt: true, updatedAt: true,
    },
  });
  // Shuffle and take `limit` (random order per request)
  const shuffled = [...rows].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

/** Returns alternate hreflangs for a given slug across all locales */
export async function getArticleHreflangs(slug: string): Promise<{ locale: string; slug: string }[]> {
  const alts = await prisma.article.findMany({
    where: { slug, status: 'PUBLISHED' },
    select: { locale: true, slug: true },
  });
  return alts;
}
