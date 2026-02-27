import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AccountsClient } from './AccountsClient';

export const metadata = { title: 'Accounts | Admin | Sim2Me' };
export const dynamic = 'force-dynamic';

export default async function AdminAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');
  if ((session.user as { type?: string }).type !== 'admin') {
    return (
      <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>
    );
  }

  const accounts = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      lastName: true,
      phone: true,
      googleId: true,
      newsletter: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
      <p className="mt-1 text-sm text-gray-500">Customer accounts — view and edit details</p>
      <AccountsClient
        accounts={accounts.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
      />
    </div>
  );
}
