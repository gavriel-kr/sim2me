import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Serves the favicon stored as a base64 data URL in site settings. */
export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'favicon_url' } });

  if (!setting?.value?.startsWith('data:')) {
    return new NextResponse(null, { status: 404 });
  }

  const match = setting.value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return new NextResponse(null, { status: 404 });

  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, 'base64');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
