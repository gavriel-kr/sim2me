import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ArticlesClient } from './ArticlesClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Articles (SEO) | Admin' };

export default async function ArticlesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

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
      ogTitle: true,
      ogDesc: true,
      canonicalUrl: true,
      articleOrder: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Articles (SEO Guides)</h1>
      <p className="mt-1 text-sm text-gray-500">
        Create and manage SEO articles in EN / HE / AR. Published articles appear on{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">/articles</code>,{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">/he/articles</code>, and{' '}
        <code className="rounded bg-gray-100 px-1 text-xs">/ar/articles</code>.
      </p>
      <ArticlesClient articles={articles} />
    </div>
  );
}
