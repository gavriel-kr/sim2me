import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Apple, Smartphone, Tablet, Monitor, Search, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('compatible-devices', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('devices');
  return {
    title: cms?.seoTitle || cms?.title || t('title'),
    description: cms?.seoDesc || t('subtitle'),
  };
}

export default async function CompatibleDevicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('compatible-devices', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('devices');
  const isRTL = locale === 'he' || locale === 'ar';

  if (cms?.content) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-4xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
          <h1 className="text-2xl font-bold sm:text-3xl">{cms.title}</h1>
          <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line max-w-none">{cms.content}</div>
        </div>
      </MainLayout>
    );
  }

  const deviceSections = [
    { titleKey: 'iphoneTitle', listKey: 'iphoneList', icon: Apple, color: 'bg-gray-100 text-gray-800' },
    { titleKey: 'ipadTitle', listKey: 'ipadList', icon: Tablet, color: 'bg-blue-50 text-blue-700' },
    { titleKey: 'samsungTitle', listKey: 'samsungList', icon: Smartphone, color: 'bg-indigo-50 text-indigo-700' },
    { titleKey: 'googleTitle', listKey: 'googleList', icon: Monitor, color: 'bg-green-50 text-green-700' },
    { titleKey: 'otherTitle', listKey: 'otherList', icon: Smartphone, color: 'bg-orange-50 text-orange-700' },
  ] as const;

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-12 space-y-12" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Important note */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <p className="text-sm font-medium text-amber-900">{t('importantNote')}</p>
        </div>

        {/* Device Lists */}
        <div className="grid gap-5 sm:grid-cols-2">
          {deviceSections.map(({ titleKey, listKey, icon: Icon, color }) => (
            <Card key={titleKey} className="border-gray-200">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-bold">{t(titleKey)}</h2>
                </div>
                <div className="space-y-1.5">
                  {t(listKey).split(', ').map((device: string) => (
                    <p key={device} className="text-sm text-muted-foreground ps-2 border-s-2 border-gray-200">
                      {device}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How to Check */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Search className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">{t('checkTitle')}</h2>
          </div>
          <div className="space-y-3">
            {(['checkStep1', 'checkStep2', 'checkStep3'] as const).map((key, i) => (
              <div key={key} className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(key)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dual SIM */}
        <section className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-blue-900">{t('dualSimTitle')}</h2>
          </div>
          <p className="text-sm text-blue-800/80 leading-relaxed">{t('dualSimDesc')}</p>
        </section>
      </div>
    </MainLayout>
  );
}
