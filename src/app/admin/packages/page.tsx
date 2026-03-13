import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PackagesClient } from './PackagesClient';
import { RefreshCacheButton } from './RefreshCacheButton';

export default async function PackagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">eSIM Packages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live packages from eSIMaccess. These are the real products shown on your website.
          </p>
        </div>
        <RefreshCacheButton />
      </div>
      <PackagesClient />
    </div>
  );
}
