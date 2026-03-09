import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ article });
}

const LOCALE_FIELDS = [
  'titleEn', 'titleHe', 'titleAr',
  'contentEn', 'contentHe', 'contentAr',
  'excerptEn', 'excerptHe', 'excerptAr',
  'focusKeywordEn', 'focusKeywordHe', 'focusKeywordAr',
  'metaTitleEn', 'metaTitleHe', 'metaTitleAr',
  'metaDescEn', 'metaDescHe', 'metaDescAr',
  'ogTitleEn', 'ogTitleHe', 'ogTitleAr',
  'ogDescEn', 'ogDescHe', 'ogDescAr',
  'canonicalUrlEn', 'canonicalUrlHe', 'canonicalUrlAr',
  'statusEn', 'statusHe', 'statusAr',
] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
