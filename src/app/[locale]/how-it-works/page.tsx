import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, CreditCard, Smartphone } from 'lucide-react';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('how-it-works', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('howItWorks');
  return {
    title: cms?.seoTitle || cms?.title || t('title'),
    description: cms?.seoDesc || 'Learn how to buy, install, and activate your eSIM.',
  };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('how-it-works', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('howItWorks');
  const steps = [
    { key: 'step1', icon: MapPin },
    { key: 'step2', icon: CreditCard },
    { key: 'step3', icon: Smartphone },
  ];

  return (
    <MainLayout>
      <div className="container px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">{cms?.title || t('title')}</h1>
        {cms?.content ? (
          <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line max-w-none">
            {cms.content}
          </div>
        ) : (
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(({ key, icon: Icon }) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">{t(`${key}Title`)}</h2>
                  <p className="mt-2 text-muted-foreground">{t(`${key}Desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
