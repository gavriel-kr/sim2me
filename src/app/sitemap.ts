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
  { path: '/articles', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/app', changeFrequency: 'weekly', priority: 0.85 },
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

  // Fetch published articles only (no noindex/draft)
  let articles: { slug: string; locale: string; updatedAt: Date }[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, locale: true, updatedAt: true },
    });
  } catch {
    // graceful fallback
  }

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;

    for (const page of staticPages) {
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

  for (const article of articles) {
    const prefix = article.locale === routing.defaultLocale ? '' : `/${article.locale}`;
    entries.push({
      url: `${baseUrl}${prefix}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
