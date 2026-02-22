import { MainLayout } from '@/components/layout/MainLayout';
import { AccountLoginClient } from './AccountLoginClient';

export const metadata = {
  title: 'Sign in | Sim2Me',
  description: 'Sign in to your Sim2Me account.',
};

export default function AccountLoginPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-md px-4 py-12">
        <AccountLoginClient />
      </div>
    </MainLayout>
  );
}
