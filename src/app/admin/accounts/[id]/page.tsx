import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AccountEditClient } from './AccountEditClient';

export const metadata = { title: 'Edit account | Admin | Sim2Me' };
export const dynamic = 'force-dynamic';

export default async function AdminAccountEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/admin/login');
  if ((session.user as { type?: string }).type !== 'admin') {
    return (
      <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>
    );
  }

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) notFound();

  const { password: _, ...safe } = customer;
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/admin/accounts" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          ← Back to accounts
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Edit account</h1>
      <p className="mt-1 text-sm text-gray-500">{customer.email}</p>
      <AccountEditClient account={safe} />
    </div>
  );
}
