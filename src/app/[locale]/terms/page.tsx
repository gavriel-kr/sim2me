import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('terms', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('footer');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: cms?.seoTitle || `${t('terms')} – Sim2Me`,
    description: cms?.seoDesc || 'Read the Sim2Me Terms of Service. Learn about our eSIM purchase terms, usage policies, device compatibility requirements and service conditions.',
    alternates: { canonical: `${siteUrl}${prefix}/terms` },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('terms', locale as 'en' | 'he' | 'ar');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">{cms?.title || 'Terms of Service'}</h1>
        <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line">
          {cms?.content || (
            <>
              <p>Last updated: {new Date().toLocaleDateString('en-US')}</p>
              <p>These Terms of Service apply globally to all countries and customers worldwide.</p>
              <p>
                By using this service you agree to purchase eSIM products for personal travel use.
                You must ensure your device is compatible and unlocked. Refunds are subject to our
                Refund Policy. We are not responsible for network coverage or operator service quality.
              </p>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
