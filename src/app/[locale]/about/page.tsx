import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('about', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('about');
  return {
    title: cms?.seoTitle || cms?.title || t('title'),
    description: cms?.seoDesc || 'About our eSIM travel connectivity service.',
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('about', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('about');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">{cms?.title || t('title')}</h1>
        <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line">
          {cms?.content || t('mission')}
        </div>
      </div>
    </MainLayout>
  );
}
