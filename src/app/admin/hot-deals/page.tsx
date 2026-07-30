import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { HotDealsClient } from './HotDealsClient';

export const dynamic = 'force-dynamic';

export default async function AdminHotDealsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Hot Deals</h1>
      <p className="mt-1 text-sm text-gray-500">
        Daily homepage deals with an extra 5–10% discount. Every deal is profit-gated:
        it is only created when net profit after the discount stays above the configured floor.
        Deals rotate every day (UTC); pin a deal to carry it into the next day.
      </p>
      <HotDealsClient />
    </div>
  );
}
