import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

/** Serves the favicon from admin, or fallback to static favicon.png. Used at /favicon.ico for Google. */
export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'favicon_url' } });

  if (setting?.value?.startsWith('data:')) {
    const match = setting.value.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const [, mime, base64] = match;
      const buffer = Buffer.from(base64, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      });
    }
  }

  // Fallback: serve static favicon.png when no admin favicon
  try {
    const pngPath = join(process.cwd(), 'public', 'favicon.png');
    const buffer = await readFile(pngPath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
