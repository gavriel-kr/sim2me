import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { EsimAccessOrdersClient } from './EsimAccessOrdersClient';

export default async function EsimAccessOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">eSIMaccess Orders</h1>
      <p className="mt-1 text-sm text-gray-500">
        All orders placed at eSIMaccess — wholesale purchases, eSIM profiles, and supplier costs
      </p>
      <EsimAccessOrdersClient />
    </div>
  );
}
