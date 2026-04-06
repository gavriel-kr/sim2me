import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BlocklistClient } from './BlocklistClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blocklist | Admin' };

export default async function BlocklistPage() {
  const session = await getServerSession(authOptions);
  const userType = (session?.user as { type?: string })?.type;
  if (!session?.user || userType !== 'admin') redirect('/admin/login');

  const items = await prisma.blockedItem.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <BlocklistClient
      initialItems={items.map((i: typeof items[number]) => ({
        id: i.id,
        type: i.type,
        value: i.value,
        reason: i.reason ?? null,
        autoBlocked: i.autoBlocked,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  );
}
