import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
const descByLocale: Record<string, string> = {
  en: 'The terms that apply to buying and using Sim2Me eSIM plans: eligibility, payment, delivery, acceptable use and liability.',
  he: 'התנאים החלים על רכישה ושימוש בחבילות eSIM של Sim2Me: זכאות, תשלום, אספקה, שימוש מותר ואחריות.',
  ar: 'الشروط المطبقة على شراء واستخدام باقات eSIM من Sim2Me: الأهلية والدفع والتسليم والاستخدام المقبول والمسؤولية.',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('terms', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'footer' });
  const prefix = `/${locale}`;
  return {
    // No brand suffix here: the root layout's title template already appends it.
    title: cms?.seoTitle || t('terms'),
    description: cms?.seoDesc || descByLocale[locale] || descByLocale.en,
    alternates: { canonical: `${siteUrl}${prefix}/terms` },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isRTL = locale === 'he' || locale === 'ar';
  const cms = await getCmsPage('terms', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'legalPages' });

  const title = cms?.title || t('termsTitle');
  const content = cms?.content || t('termsContent', { date: new Date().toLocaleDateString(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-SA' : 'en-US') });

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line">
          {content}
        </div>
      </div>
    </MainLayout>
  );
}
