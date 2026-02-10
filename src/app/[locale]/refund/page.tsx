import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('refund', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('footer');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: cms?.seoTitle || `${t('refund')} – Sim2Me`,
    description: cms?.seoDesc || 'Sim2Me refund policy. Unused eSIMs can be refunded within 14 days. Learn about eligibility, the refund process, and how to request a refund.',
    alternates: { canonical: `${siteUrl}${prefix}/refund` },
  };
}

export default async function RefundPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('refund', locale as 'en' | 'he' | 'ar');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">{cms?.title || 'Refund Policy'}</h1>
        <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line">
          {cms?.content || 'Unused eSIMs can be refunded within 14 days of purchase. Once the eSIM is installed or activated, the plan is non-refundable. Contact support with your order ID to request a refund.'}
        </div>
      </div>
    </MainLayout>
  );
}
