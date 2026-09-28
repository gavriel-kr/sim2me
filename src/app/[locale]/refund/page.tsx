import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
// Ticket 042: no refunds after purchase (the CMS page says the same; its SEO description is empty).
const descByLocale: Record<string, string> = {
  en: 'Sim2Me refund policy: the eSIM is delivered right after payment, so there are no refunds after purchase. If it was not delivered because of a fault on our side, contact support.',
  he: 'מדיניות ההחזרים של Sim2Me: ה-eSIM נמסר מיד לאחר התשלום, ולכן אין החזר כספי לאחר הרכישה. אם לא נמסר בגלל תקלה אצלנו, פנו לתמיכה.',
  ar: 'سياسة الاسترداد في Sim2Me: تُسلَّم شريحة eSIM فور الدفع، لذلك لا يوجد استرداد بعد الشراء. إذا لم تصلك بسبب خلل من جهتنا، تواصل مع الدعم.',
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
