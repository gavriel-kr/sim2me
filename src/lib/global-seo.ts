import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const GLOBAL_SEO_CACHE_TAG = 'global-seo-settings';

// ── Key registry (stored in SiteSetting table with seo_ prefix) ──────────────
export const SEO_KEYS = {
  // Core / Search snippet
  siteName:           'seo_site_name',
  titleTemplate:      'seo_title_template',
  defaultTitle:       'seo_default_title',
  defaultDescription: 'seo_default_description',
  defaultKeywords:    'seo_default_keywords',

  // Open Graph
  ogTitle:            'seo_og_title',
  ogDescription:      'seo_og_description',
  ogImage:            'seo_og_image',

  // Twitter / X
  twitterHandle:      'seo_twitter_handle',
  twitterCard:        'seo_twitter_card',

  // Canonical & domain
  canonicalDomain:    'seo_canonical_domain',

  // Robots & crawl directives
  robotsIndex:        'seo_robots_index',
  robotsFollow:       'seo_robots_follow',
  googleMaxSnippet:   'seo_google_max_snippet',
  googleMaxImagePreview: 'seo_google_max_image_preview',
  googleMaxVideoPreview: 'seo_google_max_video_preview',

  // Search Console verification
  googleVerification: 'seo_google_verification',
  bingVerification:   'seo_bing_verification',
  yandexVerification: 'seo_yandex_verification',

  // Organization Schema (JSON-LD)
  orgName:      'seo_org_name',
  orgUrl:       'seo_org_url',
  orgLogo:      'seo_org_logo',
  orgTwitter:   'seo_org_twitter',
  orgFacebook:  'seo_org_facebook',
  orgLinkedIn:  'seo_org_linkedin',
} as const;

export type SeoKeys = typeof SEO_KEYS;
export type SeoKeyName = keyof SeoKeys;
export type GlobalSeoSettings = Record<SeoKeyName, string>;

// ── Best-practice defaults for sim2me.net ───────────────────────────────────
export const GLOBAL_SEO_DEFAULTS: GlobalSeoSettings = {
  siteName:           'Sim2Me',
  titleTemplate:      '%s | Sim2Me',
  defaultTitle:       'Sim2Me – Buy eSIM Online for 200+ Countries | Instant Delivery',
  defaultDescription: 'Buy prepaid eSIM online for 200+ countries. Instant delivery, no physical SIM needed. Compare plans, scan QR code and get connected in minutes. Best prices for travel data.',
  defaultKeywords:    'eSIM, buy eSIM, travel eSIM, prepaid eSIM, eSIM online, international data plan, roaming alternative, travel data, eSIM for iPhone, eSIM for Android, digital SIM card, no roaming fees, global eSIM',

  ogTitle:       'Sim2Me – Buy eSIM Online for 200+ Countries',
  ogDescription: 'Instant eSIM delivery for travelers. No physical SIM, no roaming fees. Compare plans and get connected in minutes.',
  ogImage:       '',

  twitterHandle: '@sim2me',
  twitterCard:   'summary_large_image',

  canonicalDomain: 'https://www.sim2me.net',

  robotsIndex:  'true',
  robotsFollow: 'true',
  googleMaxSnippet:      '-1',
  googleMaxImagePreview: 'large',
  googleMaxVideoPreview: '-1',

  googleVerification: '',
  bingVerification:   '',
  yandexVerification: '',

  orgName:     'Sim2Me',
  orgUrl:      'https://www.sim2me.net',
  orgLogo:     '',
  orgTwitter:  'https://twitter.com/sim2me',
  orgFacebook: '',
  orgLinkedIn: '',
};

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
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

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
