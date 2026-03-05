import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { SEO_CACHE_TAG } from '@/lib/seo-override';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.seoSetting.findMany({ orderBy: { path: 'asc' } });
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { path, title, description, ogTitle, ogDescription, ogImage, canonicalUrl } = body;

  if (!path?.trim()) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const setting = await prisma.seoSetting.create({
      data: {
        path: path.trim(),
        title: title || null,
        description: description || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImage: ogImage || null,
        canonicalUrl: canonicalUrl || null,
      },
    });
    revalidateTag(SEO_CACHE_TAG);
    return NextResponse.json({ setting });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A setting for this path already exists' }, { status: 409 });
    }
    throw e;
  }
}
