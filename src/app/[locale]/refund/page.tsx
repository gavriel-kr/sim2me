import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';

export async function generateMetadata() {
  const t = await getTranslations('footer');
  return { title: t('refund'), description: 'Refund Policy.' };
}

export default async function RefundPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold">Refund Policy</h1>
        <div className="prose prose-sm mt-6 text-muted-foreground">
          <p>Unused eSIMs can be refunded within 14 days of purchase. Once the eSIM is installed or activated, the plan is non-refundable. Contact support with your order ID to request a refund.</p>
        </div>
      </div>
    </MainLayout>
  );
}
