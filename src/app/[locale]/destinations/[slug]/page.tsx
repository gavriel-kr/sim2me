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

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const data = await getDestinationData(slug, locale);
  const lang = toUiLang(locale);
  if (data.status === 'ok') {
    const { destination } = data;
    const prefix = `/${locale}`;
    return {
      title: `Buy eSIM for ${destination.name} – ${destination.planCount} Plans`,
      description: `Buy prepaid eSIM for ${destination.name}. ${destination.planCount} data plans available. Instant delivery, no physical SIM needed. Compare plans and connect in minutes.`,
      alternates: {
        canonical: `${SITE_URL}${prefix}/destinations/${slug}`,
        languages: {
          'en':        `${SITE_URL}/en/destinations/${slug}`,
          'he':        `${SITE_URL}/he/destinations/${slug}`,
          'ar':        `${SITE_URL}/ar/destinations/${slug}`,
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
