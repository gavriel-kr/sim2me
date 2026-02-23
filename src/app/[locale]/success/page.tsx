import { MainLayout } from '@/components/layout/MainLayout';
import { SuccessClient } from './SuccessClient';

export const metadata = {
  title: 'Order complete',
  description: 'Your eSIM is ready. Scan the QR code to install.',
};

interface PageProps {
  searchParams: Promise<{ transaction_id?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { transaction_id: transactionId } = await searchParams;
  return (
    <MainLayout>
      <SuccessClient transactionId={transactionId ?? null} />
    </MainLayout>
  );
}
