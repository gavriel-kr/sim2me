import { MainLayout } from '@/components/layout/MainLayout';
import { ResetPasswordClient } from './ResetPasswordClient';

export const metadata = {
  title: 'Set new password | Sim2Me',
  description: 'Choose a new password for your Sim2Me account.',
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <MainLayout>
      <div className="container mx-auto max-w-md px-4 py-12">
        <ResetPasswordClient token={token ?? ''} />
      </div>
    </MainLayout>
  );
}
