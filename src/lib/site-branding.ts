import { prisma } from '@/lib/prisma';

export const SITE_BRANDING_KEYS = {
  logoUrl: 'logo_url',
  faviconUrl: 'favicon_url',
} as const;

export type SiteBranding = {
  logoUrl: string | null;
  faviconUrl: string | null;
};

/**
 * Get logo and favicon URLs from site settings (for header and metadata).
 */
export async function getSiteBranding(): Promise<SiteBranding> {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: { in: [SITE_BRANDING_KEYS.logoUrl, SITE_BRANDING_KEYS.faviconUrl] },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const rawFavicon = map[SITE_BRANDING_KEYS.faviconUrl]?.trim() || null;
  return {
    logoUrl: map[SITE_BRANDING_KEYS.logoUrl]?.trim() || null,
    // If favicon is stored as base64 data URL, serve via API route for browser compatibility
    faviconUrl: rawFavicon
      ? rawFavicon.startsWith('data:')
        ? '/api/site-branding/favicon'
        : rawFavicon
      : null,
  };
}
