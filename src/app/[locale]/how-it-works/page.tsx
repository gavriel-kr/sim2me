import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, CreditCard, Smartphone } from 'lucide-react';

export async function generateMetadata() {
  const t = await getTranslations('howItWorks');
  return {
    title: t('title'),
    description: 'Learn how to buy, install, and activate your eSIM in three simple steps.',
  };
}

export default async function HowItWorksPage() {
  const t = await getTranslations('howItWorks');
  const steps = [
    { key: 'step1', icon: MapPin },
    { key: 'step2', icon: CreditCard },
    { key: 'step3', icon: Smartphone },
  ];

  return (
    <MainLayout>
      <div className="container px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
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
      </div>
    </MainLayout>
  );
}
