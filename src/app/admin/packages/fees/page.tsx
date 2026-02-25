import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { FeesClient } from './FeesClient';

export const metadata = { title: 'Fees / Charges | Admin | Sim2Me' };

export default async function FeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Fees / Charges</h1>
      <p className="mt-1 text-sm text-gray-500">
        Paddle and additional fees used for profit calculations across the admin.
      </p>
      <FeesClient />
    </div>
  );
}
