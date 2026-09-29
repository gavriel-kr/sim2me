import { MainLayout } from '@/components/layout/MainLayout';
import { DestinationDetailClient } from './DestinationDetailClient';
import { RedirectCountdownButton } from '@/components/RedirectCountdownButton';
import {
  EMPTY_STATE_COPY,
  ERROR_STATE_COPY,
  METADATA_TITLE_EMPTY,
  METADATA_TITLE_ERROR,
  toUiLang,
} from '@/lib/destination-unavailable-copy';
import { BrandGlobeWaves } from '@/components/icons/BrandGlobeWaves';
import { getDestinationData } from '@/lib/api/destination-data';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const SITE_URL = 'https://www.sim2me.net';

/**
 * Ticket 043 — the search title and description, in the reader's language (they were English on every
 * language until now), and saying so when the destination also has plans with a phone number.
 */
function destinationSeo(lang: ReturnType<typeof toUiLang>, name: string, plans: number, phone: boolean) {
  switch (lang) {
    case 'he':
      return phone
        ? { title: `eSIM ל${name} – גלישה ומספר טלפון`, description: `eSIM ל${name}: ${plans} חבילות גלישה, וגם חבילות עם מספר טלפון לשיחות ו-SMS. נשלח מיד למייל, בלי סים פיזי, מוכן תוך דקות.` }
        : { title: `eSIM ל${name} – ${plans} חבילות גלישה`, description: `eSIM ל${name}: ${plans} חבילות גלישה לבחירה. נשלח מיד למייל, בלי סים פיזי, מוכן תוך דקות.` };
    case 'ar':
      return phone
        ? { title: `eSIM ${name} – باقات إنترنت ورقم هاتف`, description: `شريحة eSIM ${name}: باقات إنترنت متعددة، وباقات مع رقم هاتف للمكالمات والرسائل القصيرة. تسليم فوري بالبريد الإلكتروني، بدون شريحة فعلية، وتفعيل خلال دقائق.` }
        : { title: `eSIM ${name} – باقات إنترنت فورية`, description: `شريحة eSIM ${name}: باقات إنترنت متعددة للاختيار. تسليم فوري بالبريد الإلكتروني، بدون شريحة فعلية، وتفعيل خلال دقائق.` };
    case 'hi':
      return phone
        ? { title: `${name} के लिए eSIM – डेटा प्लान और फ़ोन नंबर`, description: `${name} के लिए eSIM: ${plans} डेटा प्लान, और कॉल व SMS के लिए फ़ोन नंबर वाले प्लान। ईमेल पर तुरंत डिलीवरी, कोई फ़िज़िकल SIM नहीं, मिनटों में सेटअप।` }
        : { title: `${name} के लिए eSIM – ${plans} डेटा प्लान`, description: `${name} के लिए eSIM: ${plans} डेटा प्लान में से चुनें। ईमेल पर तुरंत डिलीवरी, कोई फ़िज़िकल SIM नहीं, मिनटों में सेटअप।` };
    default:
      return phone
        ? { title: `eSIM for ${name} – Data Plans & Phone Number`, description: `eSIM for ${name}: ${plans} data plans, plus plans with a phone number for calls and SMS. Instant delivery by email, no physical SIM, set up in minutes.` }
        : { title: `Buy eSIM for ${name} – ${plans} Data Plans`, description: `eSIM for ${name}: ${plans} data plans to choose from. Instant delivery by email, no physical SIM, set up in minutes.` };
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const data = await getDestinationData(slug, locale);
  const lang = toUiLang(locale);
  if (data.status === 'ok') {
    const { destination } = data;
    const prefix = `/${locale}`;
    const seo = destinationSeo(lang, destination.name, destination.planCount, data.phonePlans.length > 0);
    return {
      title: seo.title,
      description: seo.description,
      openGraph: { title: seo.title, description: seo.description, url: `${SITE_URL}${prefix}/destinations/${slug}` },
      alternates: {
        canonical: `${SITE_URL}${prefix}/destinations/${slug}`,
        languages: {
          'en':        `${SITE_URL}/en/destinations/${slug}`,
          'he':        `${SITE_URL}/he/destinations/${slug}`,
          'ar':        `${SITE_URL}/ar/destinations/${slug}`,
          'hi':        `${SITE_URL}/hi/destinations/${slug}`,
          'x-default': `${SITE_URL}/en/destinations/${slug}`,
        },
      },
    };
  }
  if (data.status === 'empty') {
    return { title: METADATA_TITLE_EMPTY[lang] };
  }
  return { title: METADATA_TITLE_ERROR[lang] };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const data = await getDestinationData(slug, locale);
  const lang = toUiLang(locale);

  if (data.status === 'ok') {
    return (
      <MainLayout>
        <DestinationDetailClient
          destination={data.destination}
          initialPlans={data.plans}
          unlimited={data.unlimited}
          phonePlans={data.phonePlans}
        />
      </MainLayout>
    );
  }

  if (data.status === 'empty') {
    const copy = EMPTY_STATE_COPY[lang];
    return (
      <MainLayout>
        <div className="container px-4 py-24 flex flex-col items-center text-center">
          <div className="mb-5 flex w-full justify-center" aria-hidden>
            <div className="h-[53px] w-[110px] shrink-0 sm:h-[70px] sm:w-[145px]">
              <BrandGlobeWaves />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3 max-w-lg">{copy.title}</h1>
          <p className="text-base text-muted-foreground mb-8 max-w-md leading-relaxed">{copy.body}</p>
          <RedirectCountdownButton
            href={`/${locale}/destinations`}
            seconds={10}
            variant="empty"
            lang={lang}
          />
        </div>
      </MainLayout>
    );
  }

  const copy = ERROR_STATE_COPY[lang];
  return (
    <MainLayout>
      <div className="container px-4 py-24 flex flex-col items-center text-center">
        <div className="mb-5 flex w-full justify-center" aria-hidden>
          <div className="h-[53px] w-[110px] shrink-0 sm:h-[70px] sm:w-[145px]">
            <BrandGlobeWaves />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3 max-w-lg">{copy.title}</h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md leading-relaxed">{copy.body}</p>
        <RedirectCountdownButton
          href={`/${locale}/destinations`}
          seconds={10}
          variant="error"
          lang={lang}
        />
      </div>
    </MainLayout>
  );
}
