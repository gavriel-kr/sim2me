import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import {
  MapPin, CreditCard, Smartphone, Apple, Monitor,
  Lightbulb, Zap, AlertTriangle, ChevronRight, CheckCircle2,
  Wifi, QrCode, Link2, Settings,
} from 'lucide-react';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
const seoByLocale: Record<string, { title: string; desc: string }> = {
  en: { title: 'How to Install & Use eSIM – Step-by-Step Guide', desc: 'Learn how to buy, install and activate your eSIM in 3 easy steps. iPhone & Android installation guide, troubleshooting tips, and activation methods.' },
  he: { title: 'איך להתקין ולהשתמש ב-eSIM – מדריך שלב אחר שלב', desc: 'למד איך לקנות, להתקין ולהפעיל eSIM ב-3 צעדים פשוטים. מדריך התקנה לאייפון ואנדרואיד, טיפים ופתרון בעיות.' },
  ar: { title: 'كيفية تثبيت واستخدام eSIM – دليل خطوة بخطوة', desc: 'تعلم كيفية شراء وتثبيت وتفعيل eSIM في 3 خطوات سهلة. دليل التثبيت لـ iPhone و Android ونصائح استكشاف الأخطاء.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('how-it-works', locale as 'en' | 'he' | 'ar');
  const seo = seoByLocale[locale] || seoByLocale.en;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: cms?.seoTitle || seo.title,
    description: cms?.seoDesc || seo.desc,
    alternates: { canonical: `${siteUrl}${prefix}/how-it-works` },
  };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('how-it-works', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('howItWorks');
  const isRTL = locale === 'he' || locale === 'ar';

  /* HowTo JSON-LD structured data for Google rich snippets */
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Install and Use an eSIM',
    description: 'Learn how to buy, install and activate your travel eSIM in 3 easy steps.',
    step: [
      { '@type': 'HowToStep', name: 'Choose Your Plan', text: 'Browse 200+ destinations. Pick the country or region and select a data plan.' },
      { '@type': 'HowToStep', name: 'Buy & Receive Instantly', text: 'Pay securely online. Your eSIM is delivered instantly to your email with a QR code.' },
      { '@type': 'HowToStep', name: 'Scan, Install & Connect', text: 'Scan the QR code with your phone camera. Follow the on-screen prompts and enable Data Roaming.' },
    ],
  };

  if (cms?.content) {
    return (
      <MainLayout>
        <div className="container px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
          <h1 className="text-2xl font-bold sm:text-3xl">{cms.title}</h1>
          <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line max-w-none">
            {cms.content}
          </div>
        </div>
      </MainLayout>
    );
  }

  const steps = [
    { key: 'step1', icon: MapPin, color: 'bg-blue-100 text-blue-600' },
    { key: 'step2', icon: CreditCard, color: 'bg-emerald-100 text-emerald-600' },
    { key: 'step3', icon: Smartphone, color: 'bg-purple-100 text-purple-600' },
  ];

  const iphoneSteps = ['iphoneStep1', 'iphoneStep2', 'iphoneStep3', 'iphoneStep4', 'iphoneStep5'] as const;
  const androidSteps = ['androidStep1', 'androidStep2', 'androidStep3', 'androidStep4', 'androidStep5'] as const;
  const tips = ['tip1', 'tip2', 'tip3', 'tip4', 'tip5'] as const;

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <div className="container px-4 py-12 space-y-16" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* 3 Steps */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map(({ key, icon: Icon, color }) => (
            <Card key={key} className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-6 text-center">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-xl font-bold">{t(`${key}Title`)}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{t(`${key}Desc`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Installation Guide */}
        <section>
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Settings className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold">{t('installTitle')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* iPhone */}
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Apple className="h-5 w-5" />
                  <h3 className="text-lg font-bold">{t('iphoneTitle')}</h3>
                </div>
                <ol className="space-y-3">
                  {iphoneSteps.map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{t(step)}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Android */}
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="h-5 w-5" />
                  <h3 className="text-lg font-bold">{t('androidTitle')}</h3>
                </div>
                <ol className="space-y-3">
                  {androidSteps.map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{t(step)}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Activation Methods */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold">{t('activationTitle')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: 'activationQR', icon: QrCode, color: 'bg-emerald-50 border-emerald-200' },
              { key: 'activationManual', icon: Settings, color: 'bg-blue-50 border-blue-200' },
              { key: 'activationLink', icon: Link2, color: 'bg-purple-50 border-purple-200' },
            ].map(({ key, icon: Icon, color }) => (
              <Card key={key} className={`${color}`}>
                <CardContent className="pt-5 pb-4">
                  <Icon className="h-5 w-5 mb-2 text-gray-600" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(key)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="rounded-2xl bg-amber-50 border border-amber-200 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl font-bold text-amber-900">{t('tipsTitle')}</h2>
          </div>
          <ul className="space-y-3">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <span className="text-sm text-amber-900/80 leading-relaxed">{t(tip)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Troubleshooting */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold">{t('troubleTitle')}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['trouble1', 'trouble2', 'trouble3', 'trouble4'] as const).map((key) => (
              <Card key={key} className="border-gray-200">
                <CardContent className="pt-5 pb-4">
                  <h3 className="font-semibold text-gray-900">{t(`${key}Title`)}</h3>
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
