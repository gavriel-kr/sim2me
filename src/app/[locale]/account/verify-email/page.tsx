import { MainLayout } from '@/components/layout/MainLayout';
import { VerifyEmailClient } from './VerifyEmailClient';

export const metadata = {
  title: 'Verify email | Sim2Me',
  description: 'Verify your email address.',
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <MainLayout>
      <div className="container mx-auto max-w-md px-4 py-12">
        <VerifyEmailClient token={token ?? ''} />
      </div>
    </MainLayout>
  );
}
