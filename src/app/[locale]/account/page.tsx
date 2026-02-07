import { MainLayout } from '@/components/layout/MainLayout';
import { AccountClient } from './AccountClient';

export const metadata = {
  title: 'My account',
  description: 'Manage your orders and eSIMs.',
};

export default function AccountPage() {
  return (
    <MainLayout>
      <AccountClient />
    </MainLayout>
  );
}
