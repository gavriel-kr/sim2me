import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
const descByLocale: Record<string, string> = {
  en: 'Read the Sim2Me Privacy Policy. Learn how we collect, use and protect your personal data when you purchase and use our eSIM services.',
  he: 'מדיניות הפרטיות של Sim2Me. איך אנחנו אוספים, משתמשים ומגנים על המידע האישי שלכם ברכישה ובשימוש בשירותי ה-eSIM.',
  ar: 'سياسة الخصوصية في Sim2Me. كيف نجمع بياناتك الشخصية ونستخدمها ونحميها عند شراء خدمات eSIM واستخدامها.',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('privacy', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'footer' });
  const prefix = `/${locale}`;
  return {
    // No brand suffix here: the root layout's title template already appends it.
    title: cms?.seoTitle || t('privacy'),
    description: cms?.seoDesc || descByLocale[locale] || descByLocale.en,
    alternates: { canonical: `${siteUrl}${prefix}/privacy` },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isRTL = locale === 'he' || locale === 'ar';
  const cms = await getCmsPage('privacy', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations({ locale, namespace: 'legalPages' });

  const title = cms?.title || t('privacyTitle');
  const content = cms?.content || t('privacyContent');

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
