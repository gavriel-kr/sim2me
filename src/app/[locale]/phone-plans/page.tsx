/**
 * Ticket 042 — every plan with a phone number, grouped by the number it comes with.
 *
 * Destination pages show the plans that fit one trip; this page is where the homepage section and
 * the "all plans with a number" links land, and the only place the long-stay global plans (60 to
 * 365 days) are offered.
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { getPhonePlans } from '@/lib/phone-catalog';
import { sortPhonePlans, toPublicPhonePlan } from '@/lib/phone-plans';
import { applyPhoneDeals, getTodayPhoneDeals } from '@/lib/phone-deals';
import { PhonePlansCatalog } from './PhonePlansCatalog';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
const seoByLocale: Record<string, { title: string; desc: string }> = {
  en: { title: 'eSIM with a Phone Number – US, Europe & Global', desc: 'An eSIM with data, a phone number, calls and SMS. US +1 number, French +33 number for all of Europe, and one global number. Instant delivery.' },
  he: { title: 'eSIM עם מספר טלפון – ארה״ב, אירופה וגלובלי', desc: 'eSIM עם גלישה, מספר טלפון, שיחות ו-SMS. מספר אמריקאי, מספר צרפתי לכל אירופה ומספר גלובלי. מסירה מיידית.' },
  ar: { title: 'eSIM مع رقم هاتف – الولايات المتحدة وأوروبا والعالم', desc: 'شريحة eSIM مع بيانات ورقم هاتف ومكالمات ورسائل SMS. رقم أمريكي، ورقم فرنسي لكل أوروبا، ورقم عالمي. تسليم فوري.' },
  hi: { title: 'फ़ोन नंबर वाला eSIM – अमेरिका, यूरोप और ग्लोबल', desc: 'डेटा, फ़ोन नंबर, कॉल और SMS वाला eSIM। अमेरिकी +1 नंबर, पूरे यूरोप के लिए फ़्रांसीसी +33 नंबर, और एक ग्लोबल नंबर।' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const seo = seoByLocale[locale] || seoByLocale.en;
  return {
    title: seo.title,
    description: seo.desc,
    openGraph: { title: seo.title, description: seo.desc, url: `${siteUrl}/${locale}/phone-plans` },
    alternates: {
      canonical: `${siteUrl}/${locale}/phone-plans`,
      // Ticket 043: the four language versions point at each other.
      languages: {
        en: `${siteUrl}/en/phone-plans`,
        he: `${siteUrl}/he/phone-plans`,
        ar: `${siteUrl}/ar/phone-plans`,
        hi: `${siteUrl}/hi/phone-plans`,
        'x-default': `${siteUrl}/en/phone-plans`,
      },
    },
  };
}

export default async function PhonePlansPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('phonePlans');
  const plans = applyPhoneDeals(
    sortPhonePlans((await getPhonePlans()).filter((p) => p.visible)).map(toPublicPhonePlan),
    await getTodayPhoneDeals(),
  );

  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 pb-2">
            <p className="text-sm font-semibold text-sky-700">{t('includes')}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{t('pageTitle')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t('pageSubtitle')}</p>
          </div>
          <CharacterFigure slot="phonePlansPagePair" height={120} heightLg={210} className="shrink-0" priority />
        </div>
        <PhonePlansCatalog plans={plans} />
      </div>
    </MainLayout>
  );
}
