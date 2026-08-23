import { MainLayout } from '@/components/layout/MainLayout';
import { SuccessClient } from './SuccessClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order complete',
  description: 'Your eSIM is ready.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
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
