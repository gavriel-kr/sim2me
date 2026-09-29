import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // regenerate every hour

/** Canonical base URL: HTTPS only, no trailing slash. Aligns with robots.txt and SEO. */
const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net').replace(/^http:\/\//i, 'https://').replace(/\/$/, '');

/**
 * Indexable static paths only. Excludes:
 * - /checkout, /account (disallowed in robots.txt)
 * - /success (post-purchase thank-you; not useful for discovery)
 */
type StaticPage = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
};

const staticPages: StaticPage[] = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/destinations', changeFrequency: 'daily', priority: 0.95 },
  // Ticket 042: the phone-plans page and one page per kind of number (local numbers' pages come and
  // go with the catalogue, so only the three permanent ones are listed).
  { path: '/phone-plans', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/phone-plans/global', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/phone-plans/usa', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/phone-plans/europe', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/articles', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/compatible-devices', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/installation-guide', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/help', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/refund', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/accessibility-statement', changeFrequency: 'yearly', priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch destinations at runtime (not build time)
  let destinations: { slug: string }[] = [];
  try {
    const apiBase = (process.env.NEXTAUTH_URL || baseUrl).replace(/^http:\/\//i, 'https://').replace(/\/$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${apiBase}/api/packages`, { signal: controller.signal, next: { revalidate: 3600 } });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      destinations = (data.destinations || []).map((d: { locationCode: string }) => ({
        slug: d.locationCode.toLowerCase(),
      }));
    }
  } catch {
    // Gracefully handle - sitemap will just have static pages
  }

  // Fetch published articles (one row per article; emit URL per locale where status is PUBLISHED)
  let articles: { slug: string; statusEn: string; statusHe: string; statusAr: string; statusHi: string; updatedAt: Date }[] = [];
  try {
    articles = await prisma.article.findMany({
      select: { slug: true, statusEn: true, statusHe: true, statusAr: true, statusHi: true, updatedAt: true },
    });
  } catch {
    // graceful fallback
  }
  const hasHindiArticles = articles.some((a) => a.statusHi === 'PUBLISHED');

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of routing.locales) {
    const prefix = `/${locale}`;

    for (const page of staticPages) {
      // Until an article is published in Hindi, the Hindi articles index lists English articles and is
      // marked noindex for that reason.
      if (locale === 'hi' && page.path === '/articles' && !hasHindiArticles) continue;
      entries.push({
        url: `${baseUrl}${prefix}${page.path || ''}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    for (const d of destinations) {
      entries.push({
        url: `${baseUrl}${prefix}/destinations/${d.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  /*
    Articles are listed for the languages they are actually written in, which is not every article in
    every language. A Hindi URL of an article with no Hindi version serves the English text, so
    submitting it would offer the crawler a second address for a page it already has. Each entry names
    its other language versions, the same set the page's hreflang tags list.
  */
  const statusByLocale = { en: 'statusEn' as const, he: 'statusHe' as const, ar: 'statusAr' as const, hi: 'statusHi' as const };
  for (const article of articles) {
    const published = (['en', 'he', 'ar', 'hi'] as const).filter((locale) => article[statusByLocale[locale]] === 'PUBLISHED');
    const languages = Object.fromEntries(published.map((locale) => [locale, `${baseUrl}/${locale}/articles/${article.slug}`]));
    for (const locale of published) {
      entries.push({
        url: `${baseUrl}/${locale}/articles/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
        ...(published.length > 1 && { alternates: { languages } }),
      });
    }
  }

  return entries;
}
