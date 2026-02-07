import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { HelpClient } from './HelpClient';

export async function generateMetadata() {
  const t = await getTranslations('help');
  return {
    title: t('title'),
    description: 'FAQ and support for eSIM purchase and installation.',
  };
}

export default async function HelpPage() {
  const t = await getTranslations('help');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        <HelpClient />
      </div>
    </MainLayout>
  );
}
