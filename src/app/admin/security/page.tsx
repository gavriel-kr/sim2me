import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SecurityClient } from './SecurityClient';

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const adminEmail = session.user?.email ?? '';
  const admin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
    select: { totpEnabled: true, totpVerifiedAt: true },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Security</h1>
      <p className="mt-1 text-sm text-gray-500">Manage two-factor authentication (2FA) for your account</p>
      <SecurityClient totpEnabled={admin?.totpEnabled ?? false} totpVerifiedAt={admin?.totpVerifiedAt ?? null} />
    </div>
  );
}
