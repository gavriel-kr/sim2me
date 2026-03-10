import { NextResponse } from 'next/server';
import { brandConfig } from '@/config/brand';

export const dynamic = 'force-dynamic';

const STATIC_ICONS = [
  { src: '/icons/icon-192.png?v=4', sizes: '192x192', type: 'image/png', purpose: 'any' as const },
  { src: '/icons/icon-512.png?v=4', sizes: '512x512', type: 'image/png', purpose: 'any' as const },
  { src: '/icons/icon-maskable-192.png?v=4', sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
  { src: '/icons/icon-maskable-512.png?v=4', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
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
    { name: 'Browse Destinations', short_name: 'Destinations', url: '/destinations', icons: [{ src: '/icons/icon-192.png?v=4', sizes: '192x192' }] },
    { name: 'Get Help', short_name: 'Help', url: '/help', icons: [{ src: '/icons/icon-192.png?v=4', sizes: '192x192' }] },
  ],
  related_applications: [],
  prefer_related_applications: false,
};

/** Serves PWA manifest. All icons are static files – single source, no DB. */
export async function GET() {
  return NextResponse.json(BASE_MANIFEST, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
