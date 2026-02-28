import { prisma } from '@/lib/prisma';

export const SITE_BRANDING_KEYS = {
  logoUrl: 'logo_url',
  faviconUrl: 'favicon_url',
  brandingUpdatedAt: 'branding_updated_at',
} as const;

export type SiteBranding = {
  logoUrl: string | null;
  faviconUrl: string | null;
  /** Timestamp for cache busting (set when logo/favicon is uploaded). */
  brandingVersion: number | null;
};

/**
 * Get logo and favicon URLs from site settings (for header and metadata).
 */
export async function getSiteBranding(): Promise<SiteBranding> {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          SITE_BRANDING_KEYS.logoUrl,
          SITE_BRANDING_KEYS.faviconUrl,
          SITE_BRANDING_KEYS.brandingUpdatedAt,
        ],
      },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const rawLogo = map[SITE_BRANDING_KEYS.logoUrl]?.trim() || null;
  const rawFavicon = map[SITE_BRANDING_KEYS.faviconUrl]?.trim() || null;
  const rawVersion = map[SITE_BRANDING_KEYS.brandingUpdatedAt]?.trim();
  const brandingVersion = rawVersion ? parseInt(rawVersion, 10) : null;
  return {
    // If logo is stored as base64, serve via API route so we can cache-bust with ?v=
    logoUrl: rawLogo
      ? rawLogo.startsWith('data:')
        ? '/api/site-branding/logo'
        : rawLogo
      : null,
    // If favicon is stored as base64 data URL, serve via API route for browser compatibility
    faviconUrl: rawFavicon
      ? rawFavicon.startsWith('data:')
        ? '/api/site-branding/favicon'
        : rawFavicon
      : null,
    brandingVersion: Number.isNaN(brandingVersion) ? null : brandingVersion,
  };
}
