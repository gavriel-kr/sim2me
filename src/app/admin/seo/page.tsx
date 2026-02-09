import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';

export default async function SeoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage meta tags, descriptions, and keywords for each page</p>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Per-page SEO</h2>
            <p className="text-sm text-gray-500">
              SEO settings are integrated into the page editor. Go to Pages (CMS) to edit meta titles, descriptions, and keywords for each page and language.
            </p>
          </div>
        </div>
        <Link
          href="/admin/pages"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline"
        >
          Go to Pages
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900">Global SEO Tips</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>&#8226; Keep meta titles under 60 characters for best display in search results</li>
          <li>&#8226; Meta descriptions should be 120-160 characters for optimal click-through rates</li>
          <li>&#8226; Use relevant keywords naturally in both titles and descriptions</li>
          <li>&#8226; Each page should have unique meta tags for all 3 languages (EN, HE, AR)</li>
          <li>&#8226; Add keywords as comma-separated values (e.g., &quot;esim, travel, data plan&quot;)</li>
        </ul>
      </div>
    </div>
  );
}
