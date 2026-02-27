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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const {
    slug, locale, title, content, excerpt, featuredImage,
    focusKeyword, metaTitle, metaDesc, ogTitle, ogDesc,
    canonicalUrl, articleOrder, status, showRelatedArticles,
  } = body;

  // If slug+locale changed, check for conflicts
  if (slug && locale) {
    const conflict = await prisma.article.findFirst({
      where: { slug, locale, NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json({ error: 'An article with this slug and locale already exists' }, { status: 409 });
    }
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(slug !== undefined && { slug }),
      ...(locale !== undefined && { locale }),
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(featuredImage !== undefined && { featuredImage }),
      ...(focusKeyword !== undefined && { focusKeyword }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDesc !== undefined && { metaDesc }),
      ...(ogTitle !== undefined && { ogTitle }),
      ...(ogDesc !== undefined && { ogDesc }),
      ...(canonicalUrl !== undefined && { canonicalUrl }),
      ...(articleOrder !== undefined && { articleOrder }),
      ...(status !== undefined && { status }),
      ...(showRelatedArticles !== undefined && { showRelatedArticles: Boolean(showRelatedArticles) }),
    },
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
