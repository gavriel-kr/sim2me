import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { HelpClient } from './HelpClient';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('help', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('help');
  return {
    title: cms?.seoTitle || cms?.title || t('title'),
    description: cms?.seoDesc || t('subtitle'),
  };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('help', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('help');
  const isRTL = locale === 'he' || locale === 'ar';

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold sm:text-4xl">{cms?.title || t('title')}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <HelpClient />
      </div>
    </MainLayout>
  );
}
