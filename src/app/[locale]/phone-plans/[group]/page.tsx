/**
 * Ticket 042 (2026-09-28) — one kind of phone number on its own page: /phone-plans/global, /usa,
 * /europe, or a local number's country (/phone-plans/mongolia). Its plans, where it works, its terms
 * and the FAQ. Reached from the tiles on /phone-plans, the homepage section and the hero card.
 */

import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { getPhonePlans } from '@/lib/phone-catalog';
import { sortPhonePlans, toPublicPhonePlan } from '@/lib/phone-plans';
import { applyPhoneDeals, getTodayPhoneDeals } from '@/lib/phone-deals';
import { groupPhonePlans } from '@/lib/phone-groups';
import { PhoneGroupClient } from './PhoneGroupClient';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
/** Always have a page, even while the catalogue is unreachable; local numbers only exist while sold. */
const FIXED_GROUPS = new Set(['global', 'usa', 'europe']);

type Props = { params: Promise<{ locale: string; group: string }> };

async function loadGroup(slug: string) {
  const plans = applyPhoneDeals(
    sortPhonePlans((await getPhonePlans()).filter((p) => p.visible)).map(toPublicPhonePlan),
    await getTodayPhoneDeals(),
  );
  return groupPhonePlans(plans).find((g) => g.slug === slug) ?? null;
}

async function groupTitle(slug: string, locale: string, numberCountry: string | null) {
  const t = await getTranslations({ locale, namespace: 'phonePlans' });
  if (slug === 'global') return t('regionGlobal', { count: 0 });
  if (slug === 'usa') return t('regionUs');
  if (slug === 'europe') return t('regionEurope');
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(numberCountry ?? '') ?? slug;
  } catch {
    return slug;
  }
}

/**
 * Ticket 043 — a search title and description for each kind of number, in the reader's language, with
 * the facts people search for: the dial code, where it works, what is included and the lowest price.
 */
function groupSeo(slug: string, locale: string, name: string, group: Awaited<ReturnType<typeof loadGroup>>) {
  const countries = group?.coverage.length ?? 0;
  const from = group ? `$${Math.min(...group.plans.map((p) => p.priceUsd)).toFixed(2)}` : '';
  const plans = group?.plans.length ?? 0;
  const dial = group?.plans[0]?.dialCode ?? '';
  const minDays = group ? Math.min(...group.plans.map((p) => p.days)) : 0;
  const maxDays = group ? Math.max(...group.plans.map((p) => p.days)) : 0;
  const lang = ['he', 'ar', 'hi'].includes(locale) ? locale : 'en';
  const T: Record<string, Record<string, { title: string; description: string }>> = {
    global: {
      en: { title: `Global Phone Number eSIM – One Number in ${countries} Countries`, description: `A US +1 number that works in ${countries} countries, with data, call minutes and SMS on one eSIM. Plans of ${minDays} to ${maxDays} days, from ${from}. Renew and keep the number.` },
      he: { title: `מספר טלפון גלובלי ב-eSIM – מספר אחד ב-${countries} מדינות`, description: `מספר אמריקאי (+1) שעובד ב-${countries} מדינות, עם גלישה, דקות שיחה ו-SMS על eSIM אחד. חבילות של ${minDays} עד ${maxDays} ימים, החל מ-${from}. מחדשים ושומרים על המספר.` },
      ar: { title: `رقم هاتف دولي عبر eSIM – رقم واحد في ${countries} دولة`, description: `رقم أمريكي (+1) يعمل في ${countries} دولة، مع إنترنت ودقائق اتصال ورسائل SMS على شريحة eSIM واحدة. باقات من ${minDays} إلى ${maxDays} يومًا، تبدأ من ${from}. جدّد واحتفظ بالرقم نفسه.` },
      hi: { title: `ग्लोबल फ़ोन नंबर eSIM – ${countries} देशों में एक नंबर`, description: `अमेरिकी +1 नंबर जो ${countries} देशों में काम करता है, एक ही eSIM पर डेटा, कॉल मिनट और SMS के साथ। ${minDays} से ${maxDays} दिनों के प्लान, ${from} से। रिन्यू करें और वही नंबर रखें।` },
    },
    usa: {
      en: { title: 'US Phone Number eSIM (+1) – Data, Calls & SMS in the USA', description: `A US +1 phone number on an eSIM, with data, call minutes and SMS for your trip to the United States. ${plans} plans from ${from}. Renew and keep the number.` },
      he: { title: 'eSIM עם מספר אמריקאי (+1) – גלישה, שיחות ו-SMS בארה״ב', description: `מספר טלפון אמריקאי (+1) על eSIM, עם גלישה, דקות שיחה ו-SMS לטיול בארצות הברית. ${plans} חבילות החל מ-${from}. מחדשים ושומרים על המספר.` },
      ar: { title: 'eSIM برقم أمريكي (+1) – إنترنت ومكالمات ورسائل في أمريكا', description: `رقم هاتف أمريكي (+1) على شريحة eSIM، مع إنترنت ودقائق اتصال ورسائل SMS لرحلتك إلى الولايات المتحدة. باقات تبدأ من ${from}. جدّد واحتفظ بالرقم نفسه.` },
      hi: { title: 'अमेरिकी नंबर (+1) वाला eSIM – अमेरिका में डेटा, कॉल और SMS', description: `अमेरिका यात्रा के लिए eSIM पर अमेरिकी +1 फ़ोन नंबर, डेटा, कॉल मिनट और SMS के साथ। ${plans} प्लान, ${from} से। रिन्यू करें और वही नंबर रखें।` },
    },
    europe: {
      en: { title: 'Europe eSIM with a French +33 Number – Unlimited Calls', description: `A French +33 number that works in ${countries} European countries: data, unlimited calls within Europe and SMS on one eSIM, from ${from}.` },
      he: { title: 'eSIM לאירופה עם מספר צרפתי (+33) – שיחות ללא הגבלה', description: `מספר צרפתי (+33) שעובד ב-${countries} מדינות באירופה: גלישה, שיחות ללא הגבלה בתוך אירופה ו-SMS על eSIM אחד, החל מ-${from}.` },
      ar: { title: 'eSIM أوروبا برقم فرنسي (+33) – مكالمات غير محدودة', description: `رقم فرنسي (+33) يعمل في ${countries} دولة أوروبية: إنترنت ومكالمات غير محدودة داخل أوروبا ورسائل SMS على شريحة eSIM واحدة، يبدأ من ${from}.` },
      hi: { title: 'फ़्रांसीसी +33 नंबर वाला यूरोप eSIM – अनलिमिटेड कॉल', description: `फ़्रांसीसी +33 नंबर जो यूरोप के ${countries} देशों में काम करता है: एक eSIM पर डेटा, यूरोप के अंदर अनलिमिटेड कॉल और SMS, ${from} से।` },
    },
  };
  const fixed = T[slug]?.[lang];
  if (fixed) return fixed;
  const local: Record<string, { title: string; description: string }> = {
    en: { title: `${name} eSIM with a Local Phone Number`, description: `A local ${name} number (${dial}) with data, calls and SMS on one eSIM. ${plans} plans from ${from}.` },
    he: { title: `eSIM ל${name} עם מספר טלפון מקומי`, description: `מספר מקומי ב${name} (${dial}) עם גלישה, שיחות ו-SMS על eSIM אחד. ${plans} חבילות החל מ-${from}.` },
    ar: { title: `eSIM ${name} برقم هاتف محلي`, description: `رقم محلي في ${name} (${dial}) مع إنترنت ومكالمات ورسائل SMS على شريحة eSIM واحدة، يبدأ من ${from}.` },
    hi: { title: `लोकल फ़ोन नंबर वाला ${name} eSIM`, description: `${name} का लोकल नंबर (${dial}), एक eSIM पर डेटा, कॉल और SMS के साथ। ${plans} प्लान, ${from} से।` },
  };
  return local[lang];
}

export async function generateMetadata({ params }: Props) {
  const { locale, group: slug } = await params;
  const group = await loadGroup(slug).catch(() => null);
  const t = await getTranslations({ locale, namespace: 'phonePlans' });
  const name = await groupTitle(slug, locale, group?.numberCountry ?? null);
  // Without the catalogue there are no facts to state; the generic line is better than wrong numbers.
  const seo = group ? groupSeo(slug, locale, name, group) : { title: `${name} – ${t('pageTitle')}`, description: t('pageSubtitle') };
  return {
    title: seo.title,
    description: seo.description,
    openGraph: { title: seo.title, description: seo.description, url: `${siteUrl}/${locale}/phone-plans/${slug}` },
    alternates: {
      canonical: `${siteUrl}/${locale}/phone-plans/${slug}`,
      languages: {
        en: `${siteUrl}/en/phone-plans/${slug}`,
        he: `${siteUrl}/he/phone-plans/${slug}`,
        ar: `${siteUrl}/ar/phone-plans/${slug}`,
        hi: `${siteUrl}/hi/phone-plans/${slug}`,
        'x-default': `${siteUrl}/en/phone-plans/${slug}`,
      },
    },
  };
}

export default async function PhoneGroupPage({ params }: Props) {
  const { locale, group: slug } = await params;
  setRequestLocale(locale);
  const group = await loadGroup(slug);
  if (!group && !FIXED_GROUPS.has(slug)) notFound();

  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <PhoneGroupClient
          slug={slug}
          group={group}
          figure={<CharacterFigure slot="phonePlansPagePair" height={110} heightLg={180} className="shrink-0" priority />}
        />
      </div>
    </MainLayout>
  );
}
