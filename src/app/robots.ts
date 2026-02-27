import { MetadataRoute } from 'next';

/** Canonical base URL (HTTPS). Used for sitemap reference in robots.txt. */
const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net').replace(/^http:\/\//i, 'https://').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/checkout', '/account/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
