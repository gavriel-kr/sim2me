import { MainLayout } from '@/components/layout/MainLayout';
import { ForgotPasswordClient } from './ForgotPasswordClient';

export const metadata = {
  title: 'Forgot password | Sim2Me',
  description: 'Reset your Sim2Me account password.',
};

export default function ForgotPasswordPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-md px-4 py-12">
        <ForgotPasswordClient />
      </div>
    </MainLayout>
  );
}
