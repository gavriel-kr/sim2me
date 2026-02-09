import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UsersClient } from './UsersClient';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const currentRole = (session.user as { role: string }).role;
  if (currentRole !== 'SUPER_ADMIN' && currentRole !== 'ADMIN') {
    return (
      <div className="p-8 text-center text-gray-500">
        You do not have permission to manage users.
      </div>
    );
  }

  const users = await prisma.adminUser.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
      <p className="mt-1 text-sm text-gray-500">Manage who can access the admin panel</p>
      <UsersClient users={users} />
    </div>
  );
}
