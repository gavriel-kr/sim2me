/**
 * Ticket 028 — hot-deal shapes and pure helpers, lifted verbatim out of `HotDealsSection.tsx`.
 *
 * The hero's offer card and the deals row now sell the same thing. Two copies of "turn a deal into
 * a cart line" would drift apart the first time either is touched, and the failure would be silent:
 * two prices, or two cart entries for one product. So there is one copy, here.
 *
 * Nothing in this file changed while moving. The add-to-cart side needs React state and lives in
 * `src/hooks/useAddDeal.ts`.
 */

import type { Plan } from '@/types';
import { translatePlanName } from '@/lib/translate-plan-name';

export interface HotDeal {
  id: string;
  packageCode: string;
  name: string;
  locationCode: string;
  flagCode: string;
  volume: number;
  duration: number;
  speed: string;
  topUp: boolean;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  currency: string;
  endsAt: string;
}

export function volumeToDisplay(volumeBytes: number): { dataDisplay: string; dataAmountMb: number } {
  if (volumeBytes < 0) return { dataDisplay: 'Unlimited', dataAmountMb: -1 };
  const gb = volumeBytes / (1024 * 1024 * 1024);
  const mb = volumeBytes / (1024 * 1024);
  return {
    dataDisplay: gb >= 1 ? `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB` : `${mb.toFixed(0)} MB`,
    dataAmountMb: mb,
  };
}

export function localizedCountryName(isoCode: string, fallback: string, locale: string): string {
  if (isoCode.length !== 2) return fallback;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode) || fallback;
  } catch {
    return fallback;
  }
}

export function dealToPlan(deal: HotDeal, locale: string): Plan {
  const { dataDisplay, dataAmountMb } = volumeToDisplay(deal.volume);
  return {
    id: deal.packageCode,
    destinationId: deal.locationCode.toLowerCase(),
    name: translatePlanName(deal.name, deal.name, deal.locationCode, deal.locationCode.length > 2, locale),
    dataAmount: dataAmountMb,
    dataDisplay,
    days: deal.duration,
    price: deal.dealPrice,
    currency: deal.currency,
    networkType: deal.speed?.includes('5G') ? '5G' : '4G',
    speed: deal.speed,
    tethering: true,
    topUps: deal.topUp,
    operatorName: deal.speed || 'eSIMaccess',
    saleBadge: `-${deal.discountPercent}%`,
  };
}

export async function fetchDeals(): Promise<HotDeal[]> {
  const res = await fetch('/api/hot-deals');
  if (!res.ok) return [];
  const data = await res.json();
  return data.deals ?? [];
}

/** Shared react-query options, so the hero and the deals row hit one cache and one request. */
export const HOT_DEALS_QUERY = {
  queryKey: ['hot-deals'] as const,
  queryFn: fetchDeals,
  staleTime: 5 * 60 * 1000,
};
