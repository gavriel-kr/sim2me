import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataUsageCalculator } from '@/components/sections/DataUsageCalculator';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'calculator' });
  return {
    title: `${t('title')} | Sim2Me`,
    description: t('subtitle'),
  };
}

export default function DataCalculatorPage() {
  return (
    <MainLayout>
      <div className="py-10 md:py-16">
        <DataUsageCalculator />
      </div>
    </MainLayout>
  );
}
