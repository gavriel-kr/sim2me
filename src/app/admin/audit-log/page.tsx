import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditLogClient } from './AuditLogClient';

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const limit = 50;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip }),
    prisma.adminAuditLog.count(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
      <p className="mt-1 text-sm text-gray-500">All admin actions are recorded here</p>
      <AuditLogClient logs={logs} total={total} page={page} pages={Math.ceil(total / limit)} />
    </div>
  );
}
