import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const articles = await prisma.article.findMany({
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied2 = requireAdmin(session);
  if (denied2) return denied2;

  const body = await request.json();
  const {
    slug,
    titleEn, titleHe, titleAr, titleHi,
    contentEn, contentHe, contentAr, contentHi,
    excerptEn, excerptHe, excerptAr, excerptHi,
    focusKeywordEn, focusKeywordHe, focusKeywordAr, focusKeywordHi,
    metaTitleEn, metaTitleHe, metaTitleAr, metaTitleHi,
    metaDescEn, metaDescHe, metaDescAr, metaDescHi,
    ogTitleEn, ogTitleHe, ogTitleAr, ogTitleHi,
    ogDescEn, ogDescHe, ogDescAr, ogDescHi,
    canonicalUrlEn, canonicalUrlHe, canonicalUrlAr, canonicalUrlHi,
    statusEn, statusHe, statusAr, statusHi,
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
      titleHi: titleHi ?? '',
      contentEn: contentEn ?? '',
      contentHe: contentHe ?? '',
      contentAr: contentAr ?? '',
      contentHi: contentHi ?? '',
      excerptEn: excerptEn ?? null,
      excerptHe: excerptHe ?? null,
      excerptAr: excerptAr ?? null,
      excerptHi: excerptHi ?? null,
      focusKeywordEn: focusKeywordEn ?? null,
      focusKeywordHe: focusKeywordHe ?? null,
      focusKeywordAr: focusKeywordAr ?? null,
      focusKeywordHi: focusKeywordHi ?? null,
      metaTitleEn: metaTitleEn ?? null,
      metaTitleHe: metaTitleHe ?? null,
      metaTitleAr: metaTitleAr ?? null,
      metaTitleHi: metaTitleHi ?? null,
      metaDescEn: metaDescEn ?? null,
      metaDescHe: metaDescHe ?? null,
      metaDescAr: metaDescAr ?? null,
      metaDescHi: metaDescHi ?? null,
      ogTitleEn: ogTitleEn ?? null,
      ogTitleHe: ogTitleHe ?? null,
      ogTitleAr: ogTitleAr ?? null,
      ogTitleHi: ogTitleHi ?? null,
      ogDescEn: ogDescEn ?? null,
      ogDescHe: ogDescHe ?? null,
      ogDescAr: ogDescAr ?? null,
      ogDescHi: ogDescHi ?? null,
      canonicalUrlEn: canonicalUrlEn ?? null,
      canonicalUrlHe: canonicalUrlHe ?? null,
      canonicalUrlAr: canonicalUrlAr ?? null,
      canonicalUrlHi: canonicalUrlHi ?? null,
      statusEn: statusEn ?? 'DRAFT',
      statusHe: statusHe ?? 'DRAFT',
      statusAr: statusAr ?? 'DRAFT',
      statusHi: statusHi ?? 'DRAFT',
      featuredImage: featuredImage ?? null,
      articleOrder: articleOrder ?? 0,
      showRelatedArticles: showRelatedArticles !== false,
    },
  });

  createAuditLog({ adminEmail: session!.user!.email!, adminName: session!.user!.name ?? '', action: 'CREATE_ARTICLE', targetType: 'Article', targetId: article.id, details: { slug: article.slug } }).catch(() => {});
  return NextResponse.json({ article }, { status: 201 });
}
