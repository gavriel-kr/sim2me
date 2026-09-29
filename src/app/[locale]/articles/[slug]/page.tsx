import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { authOptions } from '@/lib/auth';
import { getArticleForPreview, getArticleForReader, getArticleHreflangs, getRelatedArticlesForReader } from '@/lib/articles';
import { getArticlesDefaultImage } from '@/lib/articles-default-image';
import { getGlobalSeoSettings } from '@/lib/global-seo';
import { ArticleDetail } from './ArticleDetail';
import { MainLayout } from '@/components/layout/MainLayout';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net';

const OG_LOCALE: Record<string, string> = { en: 'en_US', he: 'he_IL', ar: 'ar_SA', hi: 'hi_IN' };
const HOME_LABEL: Record<string, string> = { en: 'Home', he: 'בית', ar: 'الرئيسية', hi: 'होम' };
const GUIDES_LABEL: Record<string, string> = { en: 'Articles', he: 'מדריכים', ar: 'أدلة', hi: 'गाइड' };

function localePrefix(locale: string) {
  return `/${locale}`;
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

/*
  ?preview=1 lets a signed-in admin read an article in a language where it is still a draft, so new
  articles can be checked on the real page before they are published (ticket 043). Anyone else gets
  the published article, or the usual redirect. A preview is never indexed.
*/
const isAdminPreview = cache(async (preview: string | undefined) => {
  if (preview !== '1') return false;
  const session = await getServerSession(authOptions).catch(() => null);
  return (session?.user as { type?: string } | undefined)?.type === 'admin';
});

/* Metadata and the page ask for the same rows; one query each per request. */
const loadArticle = cache(async (slug: string, locale: string, preview: boolean) =>
  preview
    ? (await getArticleForPreview(slug, locale)) ?? getArticleForReader(slug, locale)
    : getArticleForReader(slug, locale));
const loadHreflangs = cache((slug: string) => getArticleHreflangs(slug));
const loadDefaultImage = cache(() => getArticlesDefaultImage().catch(() => null));

/** An absolute image URL for sharing: the article's own picture, else the articles default, else the site's. */
async function shareImage(featuredImage: string | null): Promise<string | null> {
  const absolute = (url: string | null | undefined) =>
    !url ? null : url.startsWith('https://') || url.startsWith('http://') ? url : url.startsWith('/') ? `${siteUrl}${url}` : null;
  const own = featuredImage && !featuredImage.startsWith('bg:') ? absolute(featuredImage) : null;
  if (own) return own;
  const fallback = absolute((await loadDefaultImage())?.url);
  if (fallback) return fallback;
  return absolute((await getGlobalSeoSettings().catch(() => null))?.ogImage);
}

/**
 * The FAQ structured data an article carries at the end of its HTML, taken out of the body so it is
 * printed once, in the head of the page, instead of twice (ticket 043).
 */
function splitStructuredData(content: string): { body: string; schemaJson: string | null } {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const match = content.match(re);
  if (!match) return { body: content, schemaJson: null };
  return { body: content.replace(re, ''), schemaJson: match[1].trim() };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const preview = await isAdminPreview((await searchParams).preview);
  const article = await loadArticle(slug, locale, preview);
  if (!article) return { title: 'Not found' };

  // A Hindi reader of an article that has no Hindi version gets the English text (ticket 038):
  // useful to them, but the English URL is the one to index.
  const fallback = article.locale !== locale;
  const canonical = fallback
    ? `${siteUrl}/${article.locale}/articles/${slug}`
    : article.canonicalUrl || `${siteUrl}${localePrefix(locale)}/articles/${slug}`;

  const hreflangs = await loadHreflangs(slug);
  const languages: Record<string, string> = {};
  for (const alt of hreflangs) {
    languages[alt.locale] = `${siteUrl}${localePrefix(alt.locale)}/articles/${alt.slug}`;
  }
  const xDefault = languages.en ?? Object.values(languages)[0];
  if (xDefault) languages['x-default'] = xDefault;

  const title = article.metaTitle || article.title;
  const description = article.metaDesc || article.excerpt || '';
  const ogTitle = article.ogTitle || title;
  const ogDescription = article.ogDesc || description;
  const image = await shareImage(article.featuredImage);

  return {
    // Some older articles' meta titles already end with the brand; don't let the layout template add it again.
    title: /sim2me/i.test(title) ? { absolute: title } : title,
    description,
    ...(article.focusKeyword && { keywords: article.focusKeyword.split(',').map((k) => k.trim()).filter(Boolean) }),
    robots: preview ? { index: false, follow: false } : fallback ? { index: false, follow: true } : 'index, follow',
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      url: canonical,
      siteName: 'Sim2Me',
      locale: OG_LOCALE[article.locale] ?? 'en_US',
      alternateLocale: hreflangs.filter((h) => h.locale !== article.locale).map((h) => OG_LOCALE[h.locale]).filter(Boolean),
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      ...(image && { images: [{ url: image, alt: article.title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ArticleDetailPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);
  const preview = await isAdminPreview((await searchParams).preview);

  let article: Awaited<ReturnType<typeof getArticleForReader>>;
  try {
    article = await loadArticle(slug, locale, preview);
  } catch {
    redirect(locale === 'en' ? '/articles' : `/${locale}/articles`);
  }
  if (!article) redirect(locale === 'en' ? '/articles' : `/${locale}/articles`);

  const prefix = localePrefix(locale);
  const fallback = article.locale !== locale;
  const canonical = fallback
    ? `${siteUrl}/${article.locale}/articles/${slug}`
    : article.canonicalUrl || `${siteUrl}${prefix}/articles/${slug}`;
  const hreflangs = await loadHreflangs(slug);
  const alternateLanguages = hreflangs
    .filter((alt) => alt.locale !== locale)
    .map((alt) => ({ locale: alt.locale, slug: alt.slug, href: `${localePrefix(alt.locale)}/articles/${alt.slug}` }));

  let relatedArticles: Awaited<ReturnType<typeof getRelatedArticlesForReader>> = [];
  let defaultImage: Awaited<ReturnType<typeof getArticlesDefaultImage>> = null;
  try {
    [relatedArticles, defaultImage] = await Promise.all([
      article.showRelatedArticles !== false ? getRelatedArticlesForReader(article.id, locale) : Promise.resolve([]),
      loadDefaultImage(),
    ]);
  } catch {
    // non-fatal: show page without related carousel or default image
  }

  const { body, schemaJson } = splitStructuredData(article.content);
  const image = await shareImage(article.featuredImage);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDesc || article.excerpt || undefined,
    inLanguage: article.locale,
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    mainEntityOfPage: canonical,
    ...(image && { image: [image] }),
    author: { '@type': 'Organization', name: 'Sim2Me', url: siteUrl },
    publisher: { '@type': 'Organization', name: 'Sim2Me', url: siteUrl },
  };

  return (
    <MainLayout>
      {preview && (
        <p className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900">
          Admin preview. This language may still be a draft and is not visible to visitors or search engines.
        </p>
      )}
      {schemaJson && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: HOME_LABEL[locale] ?? HOME_LABEL.en, item: `${siteUrl}${prefix}` },
            { '@type': 'ListItem', position: 2, name: GUIDES_LABEL[locale] ?? GUIDES_LABEL.en, item: `${siteUrl}${prefix}/articles` },
            { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
          ],
        })
      }} />
      <ArticleDetail article={{ ...article, content: body }} locale={locale} canonical={canonical} relatedArticles={relatedArticles} defaultImage={defaultImage} alternateLanguages={alternateLanguages} />
    </MainLayout>
  );
}
