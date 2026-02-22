import { MainLayout } from '@/components/layout/MainLayout';
import { AccountRegisterClient } from './AccountRegisterClient';

export const metadata = {
  title: 'Create account | Sim2Me',
  description: 'Create your Sim2Me account.',
};

export default function AccountRegisterPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-md px-4 py-12">
        <AccountRegisterClient />
      </div>
    </MainLayout>
  );
}
