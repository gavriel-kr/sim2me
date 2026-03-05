import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const SEO_CACHE_TAG = 'seo-overrides';

export type SeoOverride = {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
};

/**
 * Look up a path-based SEO override from the DB.
 * Cached with a 60-second TTL; invalidated immediately on admin save/delete.
 * Safe to call in any Server Component or generateMetadata.
 */
export const getSeoOverride = unstable_cache(
  async (path: string): Promise<SeoOverride | null> => {
    if (!process.env.DATABASE_URL) return null;
    try {
      return await prisma.seoSetting.findUnique({ where: { path } });
    } catch {
      return null;
    }
  },
  ['seo-override'],
  { tags: [SEO_CACHE_TAG], revalidate: 60 }
);
