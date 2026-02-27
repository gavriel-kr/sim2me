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
  return article as ArticleFull | null;
}

/** Returns alternate hreflangs for a given slug across all locales */
export async function getArticleHreflangs(slug: string): Promise<{ locale: string; slug: string }[]> {
  const alts = await prisma.article.findMany({
    where: { slug, status: 'PUBLISHED' },
    select: { locale: true, slug: true },
  });
  return alts;
}
