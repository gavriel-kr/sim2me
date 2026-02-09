import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PagesClient } from './PagesClient';

export default async function CMSPagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const pages = await prisma.page.findMany({
    include: { seo: true },
    orderBy: { slug: 'asc' },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Pages (CMS)</h1>
      <p className="mt-1 text-sm text-gray-500">Edit page content and SEO settings for each language</p>
      <PagesClient pages={pages} />
    </div>
  );
}
