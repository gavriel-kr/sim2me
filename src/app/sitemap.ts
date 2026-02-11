import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // regenerate every hour

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch destinations at runtime (not build time)
  let destinations: { slug: string }[] = [];
  try {
    const apiBase = process.env.NEXTAUTH_URL || 'https://www.sim2me.net';
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
  const staticPaths = [
    '',
    '/destinations',
    '/app',
    '/how-it-works',
    '/compatible-devices',
    '/help',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/refund',
    '/checkout',
    '/account',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    for (const path of staticPaths) {
      entries.push({
        url: `${baseUrl}${prefix}${path || ''}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.8,
      });
    }
    for (const d of destinations) {
      entries.push({
        url: `${baseUrl}${prefix}/destinations/${d.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return entries;
}
