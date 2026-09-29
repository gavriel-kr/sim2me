import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getArticlesDefaultImage } from '@/lib/articles-default-image';
import { ArticlesClient } from './ArticlesClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Articles (SEO) | Admin' };

export default async function ArticlesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const defaultImage = await getArticlesDefaultImage();

  const articles = await prisma.article.findMany({
    orderBy: [{ articleOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, slug: true,
      titleEn: true, titleHe: true, titleAr: true, titleHi: true,
      excerptEn: true, excerptHe: true, excerptAr: true, excerptHi: true,
      focusKeywordEn: true, focusKeywordHe: true, focusKeywordAr: true, focusKeywordHi: true,
      metaTitleEn: true, metaTitleHe: true, metaTitleAr: true, metaTitleHi: true,
      metaDescEn: true, metaDescHe: true, metaDescAr: true, metaDescHi: true,
      ogTitleEn: true, ogTitleHe: true, ogTitleAr: true, ogTitleHi: true,
      ogDescEn: true, ogDescHe: true, ogDescAr: true, ogDescHi: true,
      canonicalUrlEn: true, canonicalUrlHe: true, canonicalUrlAr: true, canonicalUrlHi: true,
      statusEn: true, statusHe: true, statusAr: true, statusHi: true,
      featuredImage: true, articleOrder: true, showRelatedArticles: true,
      createdAt: true, updatedAt: true,
    },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Articles (SEO Guides)</h1>
      <p className="mt-1 text-sm text-gray-500">
        Create and manage SEO articles in EN / HE / AR / HI. Published articles appear on{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">/en/articles</code>,{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">/he/articles</code>,{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">/ar/articles</code> and{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">/hi/articles</code>.
      </p>
      <ArticlesClient articles={articles} initialDefaultImage={defaultImage} />
    </div>
  );
}
