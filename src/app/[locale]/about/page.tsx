import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Globe, DollarSign, Smartphone, Shield, HeadphonesIcon } from 'lucide-react';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('about', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('about');
  return {
    title: cms?.seoTitle || cms?.title || t('title'),
    description: cms?.seoDesc || t('mission'),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('about', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('about');
  const isRTL = locale === 'he' || locale === 'ar';

  if (cms?.content) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-3xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
          <h1 className="text-2xl font-bold sm:text-3xl">{cms.title}</h1>
          <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line max-w-none">{cms.content}</div>
        </div>
      </MainLayout>
    );
  }

  const whyItems = [
    { key: 'why1', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
    { key: 'why2', icon: Globe, color: 'bg-blue-100 text-blue-600' },
    { key: 'why3', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
    { key: 'why4', icon: Smartphone, color: 'bg-purple-100 text-purple-600' },
    { key: 'why5', icon: Shield, color: 'bg-red-100 text-red-600' },
    { key: 'why6', icon: HeadphonesIcon, color: 'bg-orange-100 text-orange-600' },
  ] as const;

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-12 space-y-14" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{t('mission')}</p>
        </div>

        {/* Story */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200/50 p-6 sm:p-8">
          <p className="text-base text-gray-700 leading-relaxed">{t('story')}</p>
        </div>

        {/* Why us */}
        <section>
          <h2 className="text-2xl font-bold text-center mb-8">{t('whyTitle')}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map(({ key, icon: Icon, color }) => (
              <Card key={key} className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 pb-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900">{t(`${key}Title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`${key}Desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
