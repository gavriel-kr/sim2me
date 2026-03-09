import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const articles = await prisma.article.findMany({
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    slug,
    titleEn, titleHe, titleAr,
    contentEn, contentHe, contentAr,
    excerptEn, excerptHe, excerptAr,
    focusKeywordEn, focusKeywordHe, focusKeywordAr,
    metaTitleEn, metaTitleHe, metaTitleAr,
    metaDescEn, metaDescHe, metaDescAr,
    ogTitleEn, ogTitleHe, ogTitleAr,
    ogDescEn, ogDescHe, ogDescAr,
    canonicalUrlEn, canonicalUrlHe, canonicalUrlAr,
    statusEn, statusHe, statusAr,
    featuredImage, articleOrder, showRelatedArticles,
  } = body;

  if (!slug?.trim()) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const existing = await prisma.article.findUnique({ where: { slug: slug.trim().toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'An article with this slug already exists' }, { status: 409 });
  }

  const article = await prisma.article.create({
    data: {
      slug: slug.trim().toLowerCase(),
      titleEn: titleEn ?? '',
      titleHe: titleHe ?? '',
      titleAr: titleAr ?? '',
      contentEn: contentEn ?? '',
      contentHe: contentHe ?? '',
      contentAr: contentAr ?? '',
      excerptEn: excerptEn ?? null,
      excerptHe: excerptHe ?? null,
      excerptAr: excerptAr ?? null,
      focusKeywordEn: focusKeywordEn ?? null,
      focusKeywordHe: focusKeywordHe ?? null,
      focusKeywordAr: focusKeywordAr ?? null,
      metaTitleEn: metaTitleEn ?? null,
      metaTitleHe: metaTitleHe ?? null,
      metaTitleAr: metaTitleAr ?? null,
      metaDescEn: metaDescEn ?? null,
      metaDescHe: metaDescHe ?? null,
      metaDescAr: metaDescAr ?? null,
      ogTitleEn: ogTitleEn ?? null,
      ogTitleHe: ogTitleHe ?? null,
      ogTitleAr: ogTitleAr ?? null,
      ogDescEn: ogDescEn ?? null,
      ogDescHe: ogDescHe ?? null,
      ogDescAr: ogDescAr ?? null,
      canonicalUrlEn: canonicalUrlEn ?? null,
      canonicalUrlHe: canonicalUrlHe ?? null,
      canonicalUrlAr: canonicalUrlAr ?? null,
      statusEn: statusEn ?? 'DRAFT',
      statusHe: statusHe ?? 'DRAFT',
      statusAr: statusAr ?? 'DRAFT',
      featuredImage: featuredImage ?? null,
      articleOrder: articleOrder ?? 0,
      showRelatedArticles: showRelatedArticles !== false,
    },
  });

  return NextResponse.json({ article }, { status: 201 });
}
