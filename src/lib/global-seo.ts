import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import type { SiteSetting } from '@prisma/client';
import {
  GLOBAL_SEO_CACHE_TAG,
  GLOBAL_SEO_DEFAULTS,
  SEO_KEYS,
  type GlobalSeoSettings,
  type SeoKeyName,
} from '@/lib/global-seo-defaults';

/*
  Keys, types and defaults live in `global-seo-defaults.ts` so the admin panel can read them in the
  browser without dragging Prisma along. They are re-exported here because every server caller
  already imports them from this module.
*/
export * from '@/lib/global-seo-defaults';

/**
 * Read all global SEO settings from the SiteSetting table.
 * Falls back to GLOBAL_SEO_DEFAULTS for any missing keys.
 * Cached for 60 seconds; use revalidateTag(GLOBAL_SEO_CACHE_TAG) to bust immediately.
 */
export const getGlobalSeoSettings = unstable_cache(
  async (): Promise<GlobalSeoSettings> => {
    if (!process.env.DATABASE_URL) return GLOBAL_SEO_DEFAULTS;
    try {
      const rows = await prisma.siteSetting.findMany({
        where: { key: { in: Object.values(SEO_KEYS) } },
      });
      const map = Object.fromEntries(rows.map((r: SiteSetting) => [r.key, r.value]));

      // Build typed result, merging DB values over defaults
      const result = {} as GlobalSeoSettings;
      for (const [name, key] of Object.entries(SEO_KEYS) as [SeoKeyName, string][]) {
        result[name] = map[key] ?? GLOBAL_SEO_DEFAULTS[name];
      }
      return result;
    } catch {
      return GLOBAL_SEO_DEFAULTS;
    }
  },
  ['global-seo'],
  { tags: [GLOBAL_SEO_CACHE_TAG], revalidate: 60 }
);
