import { NextResponse } from 'next/server';
import { getSiteBranding } from '@/lib/site-branding';
import { brandConfig } from '@/config/brand';

export const dynamic = 'force-dynamic';

const STATIC_ICONS = [
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' as const },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' as const },
  { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
  { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
];

const BASE_MANIFEST = {
  name: 'Sim2Me – Travel eSIM',
  short_name: brandConfig.name,
  description: 'Buy eSIM online for 200+ countries. Instant delivery, best prices.',
  start_url: '/',
  display: 'standalone' as const,
  orientation: 'portrait' as const,
  theme_color: '#0d9f6e',
  background_color: '#ffffff',
  categories: ['travel', 'utilities', 'shopping'],
  lang: 'en',
  dir: 'auto' as const,
  icons: STATIC_ICONS,
  screenshots: [],
  shortcuts: [
    { name: 'Browse Destinations', short_name: 'Destinations', url: '/destinations', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    { name: 'Get Help', short_name: 'Help', url: '/help', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
  ],
  related_applications: [],
  prefer_related_applications: false,
};

function withCacheBust(url: string, version: number | null): string {
  if (version == null || !url.startsWith('/')) return url;
  return `${url}?v=${version}`;
}

/** Serves PWA manifest; uses admin favicon as primary app icon when set (so installed PWA shows updated symbol). */
export async function GET() {
  const { faviconUrl, brandingVersion } = await getSiteBranding();
  const faviconSrc = faviconUrl && faviconUrl.startsWith('/') ? withCacheBust(faviconUrl, brandingVersion) : null;
  const icons = faviconSrc
    ? [
        { src: faviconSrc, sizes: '192x192', type: 'image/png', purpose: 'any' as const },
        { src: faviconSrc, sizes: '512x512', type: 'image/png', purpose: 'any' as const },
        { src: faviconSrc, sizes: 'any', type: 'image/x-icon', purpose: 'any' as const },
        ...STATIC_ICONS.filter((i) => i.purpose === 'maskable'),
      ]
    : [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' as const },
        ...STATIC_ICONS,
      ];
  return NextResponse.json({ ...BASE_MANIFEST, icons }, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
