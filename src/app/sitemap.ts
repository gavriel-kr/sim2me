import { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { routing } from '@/i18n/routing';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sim2me.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const destinations = await getDestinations();
  const staticPaths = [
    '',
    '/destinations',
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
