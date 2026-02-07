import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';

export async function generateMetadata() {
  const t = await getTranslations('about');
  return { title: t('title'), description: 'About our eSIM travel connectivity service.' };
}

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        <p className="mt-6 text-muted-foreground">{t('mission')}</p>
      </div>
    </MainLayout>
  );
}
