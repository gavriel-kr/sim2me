import { cache } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DestinationDetailClient } from './DestinationDetailClient';
import { translatePlanName } from '@/lib/translate-plan-name';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const REGION_TRANSLATIONS: Record<string, Record<string, string>> = {
  he: {
    'Africa': 'אפריקה', 'Europe': 'אירופה', 'Asia': 'אסיה',
    'North America': 'צפון אמריקה', 'South America': 'דרום אמריקה',
    'Oceania': 'אוקיאניה', 'Middle East': 'המזרח התיכון', 'Caribbean': 'הקריביים',
    'Global': 'עולמי', 'N. America': 'צפון אמריקה', 'S. America': 'דרום אמריקה',
  },
  ar: {
    'Africa': 'أفريقيا', 'Europe': 'أوروبا', 'Asia': 'آسيا',
    'North America': 'أمريكا الشمالية', 'South America': 'أمريكا الجنوبية',
    'Oceania': 'أوقيانوسيا', 'Middle East': 'الشرق الأوسط', 'Caribbean': 'الكاريبي',
    'Global': 'عالمي', 'N. America': 'أمريكا الشمالية', 'S. America': 'أمريكا الجنوبية',
  },
};

function translateCountryName(name: string, isoCode: string, isRegional: boolean, locale: string): string {
  if (locale === 'en') return name;
  if (!isRegional && isoCode.length === 2) {
    try {
      const displayName = new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode.toUpperCase());
      if (displayName) return displayName;
    } catch { /* fallback */ }
  }
  if (isRegional) {
    const translations = REGION_TRANSLATIONS[locale];
    if (translations) {
      for (const [en, local] of Object.entries(translations)) {
        if (name.includes(en)) return name.replace(en, local);
      }
    }
  }
  return name;
}

// cache() deduplicates within a single request (generateMetadata + page share one fetch)
const getDestinationData = cache(async function getDestinationData(slug: string, locale: string = 'en') {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const locationCode = slug.toUpperCase();

  try {
    const res = await fetch(`${baseUrl}/api/packages?location=${locationCode}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();

    const packages = data.packages || [];
    if (packages.length === 0) return null;

    // Build destination info from first package
    const firstPkg = packages[0];
    const flagCode = firstPkg.flagCode || slug;
    const isoCode = firstPkg.locationCode || slug.toUpperCase();
    const isRegional = firstPkg.isRegional || false;
    const englishName = firstPkg.location || slug.toUpperCase();
    const destination = {
      id: slug,
      name: translateCountryName(englishName, isoCode, isRegional, locale),
      slug,
      region: '',
      isoCode,
      flagUrl: `https://flagcdn.com/w80/${flagCode}.png`,
      isRegional,
      popular: packages.some((p: { featured: boolean }) => p.featured),
      operatorCount: 1,
      planCount: packages.length,
      fromPrice: Math.min(...packages.map((p: { price: number }) => p.price)),
      fromCurrency: 'USD',
    };

    // Convert packages to Plan type
    const plans = packages.map((pkg: {
      packageCode: string;
      name: string;
      price: number;
      currency: string;
      volume: number;
      duration: number;
      speed: string;
      topUp: boolean;
      featured: boolean;
      saleBadge: string | null;
      locationCode: string;
      location: string;
      isRegional: boolean;
    }) => {
      let networkType: '4G' | '5G' | '3G' = '4G';
      if (pkg.speed?.includes('5G')) networkType = '5G';
      else if (pkg.speed?.includes('3G')) networkType = '3G';

      const volumeBytes = pkg.volume;
      let dataDisplay: string;
      let dataAmountMb: number;
      if (volumeBytes < 0) {
        dataDisplay = 'Unlimited';
        dataAmountMb = -1;
      } else {
        const gb = volumeBytes / (1024 * 1024 * 1024);
        const mb = volumeBytes / (1024 * 1024);
        dataAmountMb = mb;
        dataDisplay = gb >= 1
          ? `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`
          : `${mb.toFixed(0)} MB`;
      }

      return {
        id: pkg.packageCode,
        destinationId: slug,
        name: translatePlanName(
          pkg.name,
          pkg.location || firstPkg.location || slug,
          pkg.locationCode || isoCode,
          pkg.isRegional ?? isRegional,
          locale,
        ),
        dataAmount: dataAmountMb,
        dataDisplay,
        days: pkg.duration,
        price: pkg.price,
        currency: pkg.currency || 'USD',
        networkType,
        speed: pkg.speed,
        tethering: true,
        topUps: pkg.topUp,
        operatorName: pkg.speed || 'eSIMaccess',
        popular: pkg.featured,
        saleBadge: pkg.saleBadge,
      };
    });

    return { destination, plans };
  } catch {
    return null;
  }
});

const SITE_URL = 'https://www.sim2me.net';

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const data = await getDestinationData(slug, locale);
  if (!data) return { title: 'Destination' };
  const { destination } = data;
  const minPrice = destination.fromPrice > 0 ? ` from $${destination.fromPrice.toFixed(2)}` : '';
  const prefix = `/${locale}`;
  return {
    title: `Buy eSIM for ${destination.name} – ${destination.planCount} Plans${minPrice}`,
    description: `Buy prepaid eSIM for ${destination.name}. ${destination.planCount} data plans available${minPrice}. Instant delivery, no physical SIM needed. Compare plans and connect in minutes.`,
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

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const data = await getDestinationData(slug, locale);
  if (!data) {
    return (
      <MainLayout>
        <div className="container px-4 py-24 text-center">
          <p className="text-4xl mb-4">🌐</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {locale === 'he' ? 'לא הצלחנו לטעון את הנתונים' : locale === 'ar' ? 'تعذر تحميل البيانات' : 'Could not load destination data'}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {locale === 'he' ? 'ייתכן שהשרת עמוס. נסה שוב בעוד רגע.' : locale === 'ar' ? 'قد يكون الخادم مشغولاً. حاول مجدداً.' : 'The server may be busy. Please try again in a moment.'}
          </p>
          <a href={`/${locale}/destinations/${slug}`} className="inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
            {locale === 'he' ? 'נסה שוב' : locale === 'ar' ? 'حاول مجدداً' : 'Try again'}
          </a>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DestinationDetailClient destination={data.destination} initialPlans={data.plans} />
    </MainLayout>
  );
}
