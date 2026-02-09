import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('compatible-devices', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('devices');
  return {
    title: cms?.seoTitle || cms?.title || t('title'),
    description: cms?.seoDesc || 'Check if your phone supports eSIM.',
  };
}

export default async function CompatibleDevicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('compatible-devices', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('devices');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">{cms?.title || t('title')}</h1>
        {cms?.content ? (
          <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line">
            {cms.content}
          </div>
        ) : (
          <>
            <p className="mt-4 text-muted-foreground">{t('subtitle')}</p>
            <div className="mt-8 space-y-6">
              <section>
                <h2 className="text-lg font-semibold">iPhone</h2>
                <p className="mt-2 text-muted-foreground">{t('iphone')}</p>
              </section>
              <section>
                <h2 className="text-lg font-semibold">Android</h2>
                <p className="mt-2 text-muted-foreground">{t('android')}</p>
              </section>
              <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                {t('checkCompatibility')}
              </p>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
