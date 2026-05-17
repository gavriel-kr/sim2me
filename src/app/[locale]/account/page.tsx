import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { AccountClient } from './AccountClient';

export const metadata = {
  title: 'My account',
  description: 'Manage your orders and eSIMs.',
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userType = (session?.user as { type?: string })?.type;

  if (!session?.user || userType !== 'customer') {
    redirect('/account/login');
  }

  return (
    <MainLayout>
      <AccountClient />
    </MainLayout>
  );
}
