import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/MainLayout';
import { MyEsimsClient } from './MyEsimsClient';

export const metadata = {
  title: 'My eSIMs',
  description: 'View and install your eSIMs.',
};

export const dynamic = 'force-dynamic';

export default async function MyEsimsPage() {
  const session = await getServerSession(authOptions);
  const userType = (session?.user as { type?: string })?.type;
  if (!session?.user || userType !== 'customer') redirect('/account/login');

  const userId = (session.user as { id?: string }).id;
  const customer = userId
    ? await prisma.customer.findUnique({ where: { id: userId } })
    : null;

  const orders = customer
    ? await prisma.order.findMany({
        where: { customerId: customer.id, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return (
    <MainLayout>
      <MyEsimsClient orders={orders} />
    </MainLayout>
  );
}
