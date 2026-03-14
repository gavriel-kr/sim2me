import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('privacy', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'footer' });
  const prefix = `/${locale}`;
  return {
    title: cms?.seoTitle || `${t('privacy')} – Sim2Me`,
    description: cms?.seoDesc || 'Read the Sim2Me Privacy Policy. Learn how we collect, use and protect your personal data when you purchase and use our eSIM services.',
    alternates: { canonical: `${siteUrl}${prefix}/privacy` },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isRTL = locale === 'he' || locale === 'ar';
  const cms = await getCmsPage('privacy', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'legalPages' });

  const title = cms?.title || t('privacyTitle');
  const content = cms?.content || t('privacyContent');

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
