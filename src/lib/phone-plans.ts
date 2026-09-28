/**
 * Ticket 042 — what we sell from PikaSim's phone catalogue, and at what price.
 *
 * Pure functions: catalogue and admin overrides in, the plans a page may show out. The loader that
 * fetches both lives in `phone-catalog.ts`; keeping the rules here means they can be tested without
 * a database or an API key.
 *
 * The rules were decided with Gabriel (2026-09-28):
 *  - price = cost plus about 10% net after Paddle's 5% + $0.50, ending in .90
 *  - a plan that comes out 15% or more above the market price is hidden by default
 *  - the global plan is shown even though it is far above Airalo, because it is the only number on
 *    offer for most of the world
 *  - an admin override (price, visibility, badge) always wins over the defaults
 */

import type { PikaPackage } from '@/lib/pikasim';
import { pikaId } from '@/lib/product-id';

export type PhoneRegion = 'us' | 'europe' | 'global' | 'local';

/** Full view, server-side and admin only: carries our cost and the market reference. */
export interface PhonePlanFull {
  id: string;
  code: string;
  name: string;
  region: PhoneRegion;
  /** Country the phone number belongs to, ISO-2. */
  numberCountry: string;
  dialCode: string;
  /** ISO-2 codes the plan works in (a few places are sub-region codes such as "CY-NC"). */
  coverage: string[];
  /** PikaSim's names for the codes a browser cannot name (not plain ISO-2): "CY-NC" → "Northern Cyprus". */
  coverageNames: Record<string, string>;
  dataGb: number;
  days: number;
  /** -1 = unlimited. */
  voiceMinutes: number;
  /** -1 = unlimited. */
  sms: number;
  hasVoice: boolean;
  hasSms: boolean;
  requiresActivationDate: boolean;
  speed: string;
  costUsd: number;
  /** Rule price before any admin override. */
  rulePriceUsd: number;
  priceUsd: number;
  marketUsd: number | null;
  /** (price / market - 1) × 100, rounded; null without a market reference. */
  vsMarketPct: number | null;
  defaultVisible: boolean;
  visible: boolean;
  featured: boolean;
  saleBadge: string | null;
  sortOrder: number;
  /** Why a plan is hidden by default, for the admin table. */
  hiddenReason: 'aboveMarket' | 'noCalls' | 'activationDate' | null;
  /**
   * US and global numbers can be renewed before they expire and keep the same number. Country plans
   * (Europe, local numbers) are single-cycle: when they end, a new plan brings a new number.
   */
  renewable: boolean;
}

/** What a public page receives. No cost, no market figures. */
export interface PhonePlan {
  id: string;
  name: string;
  region: PhoneRegion;
  numberCountry: string;
  dialCode: string;
  coverageCount: number;
  /** ISO-2 codes the plan works in, for the "Which countries?" pop-up (2026-09-28). */
  coverage: string[];
  coverageNames?: Record<string, string>;
  dataGb: number;
  days: number;
  voiceMinutes: number;
  sms: number;
  hasVoice: boolean;
  hasSms: boolean;
  speed: string;
  priceUsd: number;
  /** Set only while today's phone deal lowers `priceUsd`: the regular price, to strike through. */
  originalPriceUsd?: number | null;
  featured: boolean;
  saleBadge: string | null;
  renewable: boolean;
}

export interface PhoneOverride {
  visible: boolean;
  customPrice: number | null;
  customTitle: string | null;
  featured: boolean;
  saleBadge: string | null;
  sortOrder: number;
}

/** Hidden by default at or above this many percent over the market price. */
export const ABOVE_MARKET_HIDE_PCT = 15;

/*
  What Airalo (US "Change+", global "Discover+") and Orange Holiday (Europe, French number) charge
  for the same plans, checked 2026-09-28. PikaSim resells exactly these products, so this is the
  price a traveller who compares will see. Keyed by region|GB|days. A missing key means no direct
  comparison, which never hides a plan.
*/
const MARKET_USD: Record<string, number> = {
  'us|1|3': 6.0,
  'us|3|3': 11.0,
  'us|3|7': 12.0,
  'us|5|7': 17.0,
  'us|5|15': 18.0,
  'us|5|30': 19.0,
  'us|10|7': 28.0,
  'us|10|15': 29.0,
  'us|10|30': 30.0,
  'us|20|15': 45.0,
  'us|20|30': 47.0,
  'us|50|30': 59.0,
  // Orange sells 20GB for 14 days at this price; ours runs 30 days, so this comparison is harsh.
  'europe|20|30': 29.99,
  'europe|50|30': 53.99,
  'europe|100|30': 57.99,
  'europe|200|30': 69.99,
  'global|1|7': 15.0,
};

const DIAL_CODES: Record<string, string> = {
  US: '+1', FR: '+33', VN: '+84', MN: '+976', AU: '+61', MV: '+960',
};

/**
 * About 10% net after Paddle (5% + $0.50), ending in .90. The figures in the plan Gabriel approved
 * were produced by exactly this rounding, so it must not be "improved" into rounding up past them.
 */
export function phonePriceUsd(costUsd: number): number {
  const raw = (costUsd + 0.5) / 0.85;
  return Math.round((Math.ceil(raw) - 0.1) * 100) / 100;
}

/** PikaSim: "USA and Global phone plans are refillable"; country plans are single-cycle. */
export function isRenewableRegion(region: PhoneRegion): boolean {
  return region === 'us' || region === 'global';
}

export function regionOf(pkg: Pick<PikaPackage, 'location' | 'isGlobalPackage' | 'region'>): PhoneRegion {
  const loc = (pkg.location ?? '').toUpperCase();
  if (loc === 'US' || pkg.region === 'USA') return 'us';
  if (loc === 'EU' || pkg.region === 'Europe') return 'europe';
  if (loc === 'GL' || pkg.isGlobalPackage) return 'global';
  return 'local';
}

function numberCountryOf(region: PhoneRegion, location: string): string {
  if (region === 'us' || region === 'global') return 'US';
  if (region === 'europe') return 'FR';
  return location.toUpperCase();
}

export function buildPhonePlan(pkg: PikaPackage, override?: PhoneOverride | null): PhonePlanFull {
  const region = regionOf(pkg);
  const numberCountry = numberCountryOf(region, pkg.location);
  const coverage =
    region === 'us'
      ? ['US']
      : region === 'local'
        ? [pkg.location.toUpperCase()]
        : (pkg.locationNetworkList ?? []).map((n) => (n.locationCode ?? '').toUpperCase()).filter(Boolean);
  const coverageNames: Record<string, string> = {};
  for (const n of pkg.locationNetworkList ?? []) {
    const code = (n.locationCode ?? '').toUpperCase();
    if (code && !/^[A-Z]{2}$/.test(code) && n.locationName) coverageNames[code] = n.locationName;
  }
  const dataGb = pkg.volumeGB ?? Math.round((pkg.volume / 1024 ** 3) * 10) / 10;
  const costUsd = pkg.price / 100;
  const rulePriceUsd = phonePriceUsd(costUsd);
  const priceUsd = override?.customPrice != null ? override.customPrice : rulePriceUsd;
  const marketUsd = MARKET_USD[`${region}|${dataGb}|${pkg.duration}`] ?? null;
  const vsMarketPct = marketUsd ? Math.round((priceUsd / marketUsd - 1) * 100) : null;

  let hiddenReason: PhonePlanFull['hiddenReason'] = null;
  if (pkg.requiresActivationDate) hiddenReason = 'activationDate';
  else if (!pkg.hasVoice && !pkg.hasSms) hiddenReason = 'noCalls';
  else if (region !== 'global' && vsMarketPct != null && vsMarketPct >= ABOVE_MARKET_HIDE_PCT) hiddenReason = 'aboveMarket';
  const defaultVisible = hiddenReason === null;

  return {
    id: pikaId(pkg.packageCode),
    code: pkg.packageCode,
    name: override?.customTitle || pkg.name,
    region,
    numberCountry,
    dialCode: DIAL_CODES[numberCountry] ?? '',
    coverage,
    coverageNames,
    dataGb,
    days: pkg.duration,
    voiceMinutes: pkg.hasVoice ? pkg.voiceMinutes : 0,
    sms: pkg.hasSms ? pkg.smsCount : 0,
    hasVoice: pkg.hasVoice,
    hasSms: pkg.hasSms,
    // A plan that needs a booked activation date cannot be sold yet: checkout has nowhere to ask for it.
    requiresActivationDate: Boolean(pkg.requiresActivationDate),
    speed: pkg.speed ?? '',
    costUsd,
    rulePriceUsd,
    priceUsd,
    marketUsd,
    vsMarketPct,
    defaultVisible,
    visible: pkg.requiresActivationDate ? false : override ? override.visible : defaultVisible,
    featured: override?.featured ?? false,
    saleBadge: override?.saleBadge ?? null,
    sortOrder: override?.sortOrder ?? 0,
    hiddenReason,
    renewable: isRenewableRegion(region),
  };
}

/** Site order for phone plans, everywhere (Gabriel, 2026-09-28): global, then the USA, Europe, local numbers. */
const REGION_ORDER: Record<PhoneRegion, number> = { global: 0, us: 1, europe: 2, local: 3 };

export function sortPhonePlans<T extends Pick<PhonePlanFull, 'region' | 'featured' | 'sortOrder' | 'priceUsd'>>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      REGION_ORDER[a.region] - REGION_ORDER[b.region] ||
      Number(b.featured) - Number(a.featured) ||
      a.sortOrder - b.sortOrder ||
      a.priceUsd - b.priceUsd,
  );
}

export function toPublicPhonePlan(p: PhonePlanFull): PhonePlan {
  return {
    id: p.id,
    name: p.name,
    region: p.region,
    numberCountry: p.numberCountry,
    dialCode: p.dialCode,
    coverageCount: p.coverage.length,
    coverage: p.coverage,
    coverageNames: p.coverageNames,
    dataGb: p.dataGb,
    days: p.days,
    voiceMinutes: p.voiceMinutes,
    sms: p.sms,
    hasVoice: p.hasVoice,
    hasSms: p.hasSms,
    speed: p.speed,
    priceUsd: p.priceUsd,
    featured: p.featured,
    saleBadge: p.saleBadge,
    renewable: p.renewable,
  };
}

/**
 * Which phone plans a destination page offers (decided 2026-09-28):
 *  - the USA: its own US-number plans
 *  - a European country, or a Europe regional page: the French-number Europe plans, then global
 *  - a country with a local plan (Mongolia, the Maldives…): that plan, then global
 *  - anywhere else the global plan works: global only
 * Only plans that are visible. An empty list means the page shows no phone tab.
 */
export function phonePlansForDestination(plans: PhonePlanFull[], destinationCode: string): PhonePlanFull[] {
  const code = destinationCode.toUpperCase();
  const visible = plans.filter((p) => p.visible);
  const isEuropeRegion = code.startsWith('EU-') || code === 'EU';

  if (code === 'US') return sortPhonePlans(visible.filter((p) => p.region === 'us'));

  const europe = visible.filter((p) => p.region === 'europe' && (isEuropeRegion || p.coverage.includes(code)));
  const local = visible.filter((p) => p.region === 'local' && p.coverage.includes(code));
  /* A trip page offers the global plans a trip needs. The 60-, 180- and 365-day ones are for people
     living abroad; they stay on the phone-plans page, where they do not crowd out the rest. */
  const global = visible.filter(
    (p) => p.region === 'global' && p.days <= 30 && (code.length > 2 || p.coverage.includes(code)),
  );
  return sortPhonePlans([...europe, ...local, ...global]);
}
