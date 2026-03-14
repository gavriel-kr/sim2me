import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('terms', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tLegal = await getTranslations({ locale, namespace: 'legalPages' });
  const prefix = `/${locale}`;
  return {
    title: cms?.seoTitle || `${t('terms')} – Sim2Me`,
    description: cms?.seoDesc || tLegal('termsTitle') + ' – Sim2Me',
    alternates: { canonical: `${siteUrl}${prefix}/terms` },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isRTL = locale === 'he' || locale === 'ar';
  const cms = await getCmsPage('terms', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'legalPages' });

  const title = cms?.title || t('termsTitle');
  const content = cms?.content || t('termsContent', { date: new Date().toLocaleDateString(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-SA' : 'en-US') });

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line">
          {content}
        </div>
      </div>
    </MainLayout>
  );
}
