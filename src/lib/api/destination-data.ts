/**
 * Ticket 030 — the destination catalogue, as both pages need it.
 *
 * This lived inside `app/[locale]/destinations/[slug]/page.tsx` until the single-plan page needed
 * the same list to recommend against. It moved rather than being re-implemented: it is the only
 * place that applies today's hot deal to a plan, and a second copy would have become a second
 * answer to "what does this package cost" — the exact contradiction ticket 029 spent a phase
 * removing between the homepage and the destination page.
 *
 * Moved verbatim. Nothing in the body changed with the address.
 */

import { cache } from 'react';
import { headers } from 'next/headers';
import { translatePlanName } from '@/lib/translate-plan-name';
import { getTodayDealsForLocation } from '@/lib/hot-deals';

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

export function translateCountryName(name: string, isoCode: string, isRegional: boolean, locale: string): string {
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

/** Same-origin API base: avoids broken fetches when dev runs on a non-3000 port. */
async function getInternalFetchBaseUrl(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    if (host) {
      const local = host.startsWith('localhost') || host.startsWith('127.0.0.1');
      return `${local ? 'http' : 'https'}://${host}`;
    }
  } catch {
    /* no request context */
  }
  const fromEnv = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  return fromEnv || 'http://localhost:3000';
}

export type DestinationPayload = {
  id: string;
  name: string;
  slug: string;
  region: string;
  isoCode: string;
  flagUrl: string;
  isRegional: boolean;
  popular: boolean;
  operatorCount: number;
  planCount: number;
  fromPrice: number;
  fromCurrency: string;
};

export type PlanPayload = {
  id: string;
  destinationId: string;
  name: string;
  dataAmount: number;
  dataDisplay: string;
  days: number;
  price: number;
  currency: string;
  networkType: '4G' | '5G' | '3G';
  speed: string;
  tethering: boolean;
  topUps: boolean;
  operatorName: string;
  popular: boolean;
  saleBadge: string | null;
  originalPrice: number | null;
};

export type PackagesFetchResult =
  | { status: 'ok'; destination: DestinationPayload; plans: PlanPayload[] }
  | { status: 'empty' }
  | { status: 'error' };

// cache() deduplicates within a single request (generateMetadata + page share one fetch)
export const getDestinationData = cache(async function getDestinationData(slug: string, locale: string = 'en'): Promise<PackagesFetchResult> {
  const baseUrl = await getInternalFetchBaseUrl();
  const locationCode = slug.toUpperCase();

  try {
    const res = await fetch(`${baseUrl}/api/packages?location=${locationCode}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { status: 'error' };
    const data = await res.json();

    const packages = data.packages || [];
    if (packages.length === 0) return { status: 'empty' };

    // Build destination info from first package
    const firstPkg = packages[0];
    const flagCode = firstPkg.flagCode || slug;
    const isoCode = firstPkg.locationCode || slug.toUpperCase();
    const isRegional = firstPkg.isRegional || false;
    const englishName = firstPkg.location || slug.toUpperCase();

    // Convert packages to Plan type
    const plans: PlanPayload[] = packages.map((pkg: {
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
        originalPrice: null,
      };
    });

    /*
      Today's hot deal for this destination, applied to the plan it belongs to.

      Without this the page contradicts two things at once: the homepage, which just sold this
      package at the deal price and links here, and checkout, which resolves the deal server-side
      and charges the lower amount regardless. Quoting the catalog price here would mean asking for
      more than we take, and burying the discount on the one page a visitor arrives at to compare.
    */
    try {
      for (const row of await getTodayDealsForLocation(locationCode)) {
        const plan = plans.find((p) => p.id === row.packageCode);
        if (!plan) continue;
        // A deal may only ever lower a price — the same rule checkout applies.
        const dealPrice = Number(row.dealPrice);
        if (dealPrice >= plan.price) continue;

        plan.originalPrice = plan.price;
        plan.price = dealPrice;
        plan.saleBadge = `-${row.discountPercent}%`;
        break; // the generator allows one deal per destination
      }
    } catch {
      /* deals are a bonus, never a reason for a destination page to fail */
    }

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
      // From the final prices, so a deal that undercuts the cheapest plan is reflected here rather
      // than contradicting the card below it. No longer printed on the page, but `/destinations`
      // still filters and sorts on it.
      fromPrice: Math.min(...plans.map((p) => p.price)),
      fromCurrency: 'USD',
    };

    return { status: 'ok', destination, plans };
  } catch {
    return { status: 'error' };
  }
});
