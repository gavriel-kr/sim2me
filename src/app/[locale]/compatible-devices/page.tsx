import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';

export async function generateMetadata() {
  const t = await getTranslations('devices');
  return {
    title: t('title'),
    description: 'Check if your phone supports eSIM. iPhone, Android, and more.',
  };
}

export default async function CompatibleDevicesPage() {
  const t = await getTranslations('devices');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
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
      </div>
    </MainLayout>
  );
}
