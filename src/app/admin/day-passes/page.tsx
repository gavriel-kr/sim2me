import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DayPassesAdminClient } from './DayPassesAdminClient';

export default async function DayPassesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const role = (session.user as { role?: string })?.role;
  const canSell = role === 'SUPER_ADMIN' || role === 'ADMIN';

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Unlimited (day passes)</h1>
      <p className="mt-1 text-sm text-gray-500">
        The 2GB/day passes from eSIMaccess behind the &quot;Unlimited&quot; tab on each destination page, sold by the number of days.
      </p>
      <DayPassesAdminClient canSell={canSell} />
    </div>
  );
}
