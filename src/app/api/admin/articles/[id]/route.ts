import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ article });
}

const LOCALE_FIELDS = [
  'titleEn', 'titleHe', 'titleAr', 'titleHi',
  'contentEn', 'contentHe', 'contentAr', 'contentHi',
  'excerptEn', 'excerptHe', 'excerptAr', 'excerptHi',
  'focusKeywordEn', 'focusKeywordHe', 'focusKeywordAr', 'focusKeywordHi',
  'metaTitleEn', 'metaTitleHe', 'metaTitleAr', 'metaTitleHi',
  'metaDescEn', 'metaDescHe', 'metaDescAr', 'metaDescHi',
  'ogTitleEn', 'ogTitleHe', 'ogTitleAr', 'ogTitleHi',
  'ogDescEn', 'ogDescHe', 'ogDescAr', 'ogDescHi',
  'canonicalUrlEn', 'canonicalUrlHe', 'canonicalUrlAr', 'canonicalUrlHi',
  'statusEn', 'statusHe', 'statusAr', 'statusHi',
] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  const {
    slug, featuredImage, articleOrder, showRelatedArticles,
    ...localeFields
  } = body;

  if (slug !== undefined) {
    const conflict = await prisma.article.findFirst({
      where: { slug: slug.trim().toLowerCase(), NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json({ error: 'An article with this slug already exists' }, { status: 409 });
    }
  }

  const data: Record<string, unknown> = {};
  if (slug !== undefined) data.slug = slug.trim().toLowerCase();
  if (featuredImage !== undefined) data.featuredImage = featuredImage;
  if (articleOrder !== undefined) data.articleOrder = articleOrder;
  if (showRelatedArticles !== undefined) data.showRelatedArticles = Boolean(showRelatedArticles);

  for (const key of LOCALE_FIELDS) {
    if (localeFields[key] !== undefined) {
      data[key] = localeFields[key];
    }
  }

  const article = await prisma.article.update({
    where: { id },
    data,
  });

  return NextResponse.json({ article });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
