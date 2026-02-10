import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { HelpClient } from './HelpClient';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
const seoByLocale: Record<string, { title: string; desc: string }> = {
  en: { title: 'eSIM Help Center & FAQ – Installation, Activation & Troubleshooting', desc: 'Find answers to common eSIM questions. How to install, activate, troubleshoot connectivity issues, refund policy, dual SIM usage, hotspot and more.' },
  he: { title: 'מרכז עזרה eSIM ושאלות נפוצות – התקנה, הפעלה ופתרון בעיות', desc: 'מצא תשובות לשאלות נפוצות על eSIM. התקנה, הפעלה, פתרון בעיות, מדיניות החזרים, Dual SIM ועוד.' },
  ar: { title: 'مركز مساعدة eSIM والأسئلة الشائعة – التثبيت والتفعيل واستكشاف الأخطاء', desc: 'اعثر على إجابات للأسئلة الشائعة حول eSIM. التثبيت، التفعيل، استكشاف الأخطاء، سياسة الاسترداد والمزيد.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('help', locale as 'en' | 'he' | 'ar');
  const seo = seoByLocale[locale] || seoByLocale.en;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: cms?.seoTitle || seo.title,
    description: cms?.seoDesc || seo.desc,
    alternates: { canonical: `${siteUrl}${prefix}/help` },
  };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('help', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('help');
  const tFaq = await getTranslations('faq');
  const isRTL = locale === 'he' || locale === 'ar';

  /* FAQ JSON-LD structured data for Google rich snippets */
  const faqKeys = [
    ['whatIsEsim', 'answerWhatIsEsim'],
    ['howToInstall', 'answerHowToInstall'],
    ['whenToActivate', 'answerWhenToActivate'],
    ['canUseDualSim', 'answerCanUseDualSim'],
    ['dataRoaming', 'answerDataRoaming'],
    ['hotspot', 'answerHotspot'],
    ['multipleEsim', 'answerMultipleEsim'],
    ['topUp', 'answerTopUp'],
    ['coverage', 'answerCoverage'],
    ['reinstall', 'answerReinstall'],
    ['compatibleDevices', 'answerCompatibleDevices'],
    ['noSignal', 'answerNoSignal'],
    ['refundPolicy', 'answerRefundPolicy'],
    ['vpn', 'answerVpn'],
  ] as const;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqKeys.map(([q, a]) => ({
      '@type': 'Question',
      name: tFaq(q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: tFaq(a),
      },
    })),
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container mx-auto max-w-3xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold sm:text-4xl">{cms?.title || t('title')}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <HelpClient />
      </div>
    </MainLayout>
  );
}
