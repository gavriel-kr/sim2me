import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
const descByLocale: Record<string, string> = {
  en: 'Sim2Me refund policy. Unused eSIMs can be refunded within 14 days. Learn about eligibility, the refund process, and how to request a refund.',
  he: 'מדיניות ההחזרים של Sim2Me. eSIM שלא הותקן ולא נעשה בו שימוש ניתן להחזרה תוך 14 יום. תנאי הזכאות ואיך מגישים בקשה.',
  ar: 'سياسة الاسترداد في Sim2Me. يمكن استرداد eSIM غير المثبت وغير المستخدم خلال 14 يوماً. شروط الأهلية وكيفية تقديم الطلب.',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('refund', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'footer' });
  const prefix = `/${locale}`;
  return {
    // No brand suffix here: the root layout's title template already appends it.
    title: cms?.seoTitle || t('refund'),
    description: cms?.seoDesc || descByLocale[locale] || descByLocale.en,
    alternates: { canonical: `${siteUrl}${prefix}/refund` },
  };
}

export default async function RefundPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isRTL = locale === 'he' || locale === 'ar';
  const cms = await getCmsPage('refund', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'legalPages' });

  const title = cms?.title || t('refundTitle');
  const content = cms?.content || t('refundContent');

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
