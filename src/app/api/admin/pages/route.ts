import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json();
  const { id, titleEn, titleHe, titleAr, contentEn, contentHe, contentAr, published, seo } = body;

  const page = await prisma.page.update({
    where: { id },
    data: {
      titleEn, titleHe, titleAr,
      contentEn, contentHe, contentAr,
      published: published ?? true,
      seo: seo ? {
        upsert: {
          create: {
            metaTitleEn: seo.metaTitleEn || '',
            metaTitleHe: seo.metaTitleHe || '',
            metaTitleAr: seo.metaTitleAr || '',
            metaDescEn: seo.metaDescEn || '',
            metaDescHe: seo.metaDescHe || '',
            metaDescAr: seo.metaDescAr || '',
            ogImage: seo.ogImage || '',
            keywords: seo.keywords || '',
          },
          update: {
            metaTitleEn: seo.metaTitleEn || '',
            metaTitleHe: seo.metaTitleHe || '',
            metaTitleAr: seo.metaTitleAr || '',
            metaDescEn: seo.metaDescEn || '',
            metaDescHe: seo.metaDescHe || '',
            metaDescAr: seo.metaDescAr || '',
            ogImage: seo.ogImage || '',
            keywords: seo.keywords || '',
          },
        },
      } : undefined,
    },
    include: { seo: true },
  });

  return NextResponse.json({ page });
}
