import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PagesClient } from './PagesClient';

export const dynamic = 'force-dynamic';

// All slugs that should exist in the CMS
const ALL_SLUGS = [
  'home', 'about', 'contact', 'how-it-works',
  'compatible-devices', 'help', 'destinations',
  'terms', 'privacy', 'refund',
];

export default async function CMSPagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  // Auto-create any missing pages
  const existing = await prisma.page.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existing.map((p) => p.slug));

  for (const slug of ALL_SLUGS) {
    if (!existingSlugs.has(slug)) {
      await prisma.page.create({
        data: {
          slug,
          titleEn: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          published: true,
        },
      });
    }
  }

  const pages = await prisma.page.findMany({
    include: { seo: true },
    orderBy: { slug: 'asc' },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Pages (CMS)</h1>
      <p className="mt-1 text-sm text-gray-500">Edit page content and SEO settings for each language. Changes appear instantly on the website.</p>
      <PagesClient pages={pages} />
    </div>
  );
}
