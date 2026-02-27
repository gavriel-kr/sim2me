import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const articles = await prisma.article.findMany({
    orderBy: [{ locale: 'asc' }, { articleOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      locale: true,
      title: true,
      excerpt: true,
      featuredImage: true,
      focusKeyword: true,
      metaTitle: true,
      metaDesc: true,
      articleOrder: true,
      status: true,
      showRelatedArticles: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    slug, locale, title, content, excerpt, featuredImage,
    focusKeyword, metaTitle, metaDesc, ogTitle, ogDesc,
    canonicalUrl, articleOrder, status, showRelatedArticles,
  } = body;

  if (!slug || !locale || !title) {
    return NextResponse.json({ error: 'slug, locale, and title are required' }, { status: 400 });
  }

  // Check duplicate slug+locale
  const existing = await prisma.article.findUnique({ where: { slug_locale: { slug, locale } } });
  if (existing) {
    return NextResponse.json({ error: 'An article with this slug and locale already exists' }, { status: 409 });
  }

  const article = await prisma.article.create({
    data: {
      slug, locale, title, content: content || '',
      excerpt, featuredImage, focusKeyword,
      metaTitle, metaDesc, ogTitle, ogDesc,
      canonicalUrl,
      articleOrder: articleOrder ?? 0,
      status: status || 'DRAFT',
      showRelatedArticles: showRelatedArticles !== false,
    },
  });

  return NextResponse.json({ article }, { status: 201 });
}
