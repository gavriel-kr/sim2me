import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { SEO_CACHE_TAG } from '@/lib/seo-override';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json();
  const { title, description, ogTitle, ogDescription, ogImage, canonicalUrl } = body;

  const setting = await prisma.seoSetting.update({
    where: { id: params.id },
    data: {
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
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  await prisma.seoSetting.delete({ where: { id: params.id } });
  revalidateTag(SEO_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
