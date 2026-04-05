import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getArticlesDefaultImage } from '@/lib/articles-default-image';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

const KEY = 'articles_default_image';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const defaultImage = await getArticlesDefaultImage();
  return NextResponse.json({ defaultImage });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json();
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const alt = typeof body.alt === 'string' ? body.alt.trim() : '';

  if (!url) {
    await prisma.siteSetting.deleteMany({ where: { key: KEY } });
    return NextResponse.json({ defaultImage: null });
  }

  const value = JSON.stringify({ url, alt: alt || 'Default article image' });

  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value },
    update: { value },
  });

  return NextResponse.json({ defaultImage: { url, alt: alt || 'Default article image' } });
}
