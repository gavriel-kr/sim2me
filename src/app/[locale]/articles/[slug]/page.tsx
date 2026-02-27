import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getArticleBySlug, getArticleHreflangs, getRelatedArticles, type ArticleLocale } from '@/lib/articles';
import { ArticleDetail } from './ArticleDetail';
import { MainLayout } from '@/components/layout/MainLayout';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net';

function localePrefix(locale: string) {
  return locale === 'en' ? '' : `/${locale}`;
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug, locale as ArticleLocale);
  if (!article) return { title: 'Not found' };

  const prefix = localePrefix(locale);
  const canonical = article.canonicalUrl || `${siteUrl}${prefix}/articles/${slug}`;
  const hreflangs = await getArticleHreflangs(slug);

  const languages: Record<string, string> = {};
  for (const alt of hreflangs) {
    languages[alt.locale] = `${siteUrl}${localePrefix(alt.locale)}/articles/${alt.slug}`;
  }

  return {
    title: article.metaTitle || article.title,
    description: article.metaDesc || article.excerpt || '',
    robots: 'index, follow',
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: article.ogTitle || article.metaTitle || article.title,
      description: article.ogDesc || article.metaDesc || article.excerpt || '',
      type: 'article',
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      ...(article.featuredImage && { images: [article.featuredImage] }),
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as 'en' | 'he' | 'ar')) notFound();
  setRequestLocale(locale);

  const article = await getArticleBySlug(slug, locale as ArticleLocale);
  if (!article) notFound();

  const prefix = localePrefix(locale);
  const canonical = article.canonicalUrl || `${siteUrl}${prefix}/articles/${slug}`;

  const relatedArticles =
    article.showRelatedArticles !== false
      ? await getRelatedArticles(article.id, locale as ArticleLocale, 3)
      : [];

  // FAQ schema extraction: scan for JSON-LD in content
  const faqMatch = article.content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const schemaJson = faqMatch ? faqMatch[1] : null;

  return (
    <MainLayout>
      {schemaJson && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}${prefix}` },
            { '@type': 'ListItem', position: 2, name: locale === 'he' ? 'מדריכים' : locale === 'ar' ? 'أدلة' : 'Articles', item: `${siteUrl}${prefix}/articles` },
            { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
          ],
        })
      }} />
      <ArticleDetail article={article} locale={locale} canonical={canonical} relatedArticles={relatedArticles} />
    </MainLayout>
  );
}
