/**
 * Ticket 042 — the "unlimited" tab: an eSIMaccess day pass sold by the number of days.
 *
 * eSIMaccess lists day passes (`dataType: 2`) with a price per day and takes the day count as
 * `periodNum` at order time. Until now the site listed them as if they were one-day plans and bought
 * them without `periodNum`, so a customer who bought "Japan 2GB/Day" got exactly one day.
 *
 * Pure functions only: they take the supplier catalogue and return what the page may show. The
 * wholesale price never leaves the server — the page receives finished retail prices, one per day
 * count.
 */

import type { EsimPackage } from '@/lib/esimaccess';
import { DAYPASS_MAX_DAYS, DAYPASS_MIN_DAYS } from '@/lib/product-id';

/** High-speed data per day on the pass we sell. Decided with Gabriel: 2GB, like the competition. */
export const UNLIMITED_DAILY_GB = 2;

/** Markup on wholesale, plus a flat amount that covers Paddle's fixed fee on short passes. */
const MARKUP = 1.5;
const FLAT_USD = 0.6;
const MIN_PRICE_USD = 0.9;

export interface DayPassPick {
  packageCode: string;
  /** Wholesale USD per day. Server-side only. */
  costPerDayUsd: number;
  /** Speed after the daily allowance, as the supplier writes it ("1 Mbps", "512 Kbps"). */
  fupPolicy: string | null;
  speed: string;
  topUp: boolean;
}

/** "1 Mbps" → 1000, "512 Kbps" → 512. Unknown → 0, so a known speed always wins a tie. */
export function fupKbps(policy: string | null | undefined): number {
  const m = /([\d.]+)\s*(m|k)bps/i.exec(policy ?? '');
  if (!m) return 0;
  const n = Number(m[1]);
  return m[2].toLowerCase() === 'm' ? n * 1000 : n;
}

/**
 * The day pass a destination sells: 2GB a day at that exact location (not a region that happens to
 * include it), cheapest first, faster post-allowance speed on a tie. `excluded` holds package codes
 * the admin has hidden.
 */
export function pickDayPass(
  packages: EsimPackage[],
  locationCode: string,
  excluded: ReadonlySet<string> = new Set(),
): DayPassPick | null {
  const code = locationCode.toUpperCase();
  const bytes = UNLIMITED_DAILY_GB * 1024 ** 3;
  const candidates = packages.filter(
    (p) =>
      p.locationCode?.toUpperCase() === code &&
      p.dataType === 2 &&
      p.volume === bytes &&
      p.price > 0 &&
      !excluded.has(p.packageCode),
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    return fupKbps(b.fupPolicy) - fupKbps(a.fupPolicy);
  });
  const best = candidates[0];
  return {
    packageCode: best.packageCode,
    costPerDayUsd: best.price / 10000,
    fupPolicy: best.fupPolicy ?? null,
    speed: best.speed ?? '',
    topUp: best.supportTopUpType > 1,
  };
}

/**
 * Retail price for a number of days, ending in .90. About 29% net after Paddle's 5% + $0.50
 * across the 1–30 day range. Same rounding as the prices shown to Gabriel in the plan.
 */
export function unlimitedPriceUsd(costPerDayUsd: number, days: number): number {
  const raw = costPerDayUsd * days * MARKUP + FLAT_USD;
  return Math.max(MIN_PRICE_USD, Math.round((Math.ceil(raw) - 0.1) * 100) / 100);
}

/** Wholesale cost of a pass, for the webhook's underpayment guard and the admin profit view. */
export function unlimitedCostUsd(costPerDayUsd: number, days: number): number {
  return Math.round(costPerDayUsd * days * 10000) / 10000;
}

/** Index 0 is one day. The page only ever reads from this table; it never computes a price. */
export function unlimitedPriceTable(costPerDayUsd: number): number[] {
  const out: number[] = [];
  for (let d = DAYPASS_MIN_DAYS; d <= DAYPASS_MAX_DAYS; d++) out.push(unlimitedPriceUsd(costPerDayUsd, d));
  return out;
}

/** What the destination page receives. No wholesale figures in here. */
export interface UnlimitedOffer {
  packageCode: string;
  dailyGb: number;
  /** Post-allowance speed in kbps, 0 when the supplier does not say. */
  fupKbps: number;
  speed: string;
  topUp: boolean;
  /** prices[d - 1] is the price for d days. */
  prices: number[];
}

export function toUnlimitedOffer(pick: DayPassPick): UnlimitedOffer {
  return {
    packageCode: pick.packageCode,
    dailyGb: UNLIMITED_DAILY_GB,
    fupKbps: fupKbps(pick.fupPolicy),
    speed: pick.speed,
    topUp: pick.topUp,
    prices: unlimitedPriceTable(pick.costPerDayUsd),
  };
}
