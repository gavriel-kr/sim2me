/**
 * Ticket 042 — plans with a phone number in the daily hot deals (Gabriel, 2026-09-28).
 *
 * Up to two of the day's deals are phone plans, and only ones that still clear the hot-deals profit
 * floor after the discount, computed with the same fee context and profit function as the eSIM deals.
 *
 * They are deliberately not written to the `hot_deals` table. That table is shared with the live
 * site, whose current code would show a `pk:` deal it cannot sell. Instead the day's phone deals are
 * derived from the date with the same seeded generator, so every request on the same day — the
 * homepage, a destination page, checkout — arrives at the same deals and the same prices.
 */

import { getHotDealsConfig, loadProfitContext, dealNetProfit, seededRng, utcDay } from '@/lib/hot-deals';
import { getPhonePlans } from '@/lib/phone-catalog';
import type { PhonePlan, PhonePlanFull } from '@/lib/phone-plans';

/**
 * A third of the day's deals, at least one: Gabriel chose "up to 2 of 6", and the admin's deal count
 * can change (it is 3 on 2026-09-28), so the share is kept rather than the number.
 */
export function maxPhoneDeals(dealCount: number): number {
  return Math.max(1, Math.floor(dealCount / 3));
}

export interface PhoneDeal {
  planId: string;
  plan: PhonePlanFull;
  discountPercent: number;
  originalPrice: number;
  dealPrice: number;
  netProfit: number;
  dealDay: string;
}

const cache = new Map<string, Promise<PhoneDeal[]>>();

/*
  Which plans get the day's phone slots first (Gabriel, 2026-09-28: "why only the Maldives?").
  The numbers most travellers want — US, global, Europe — on trip-length plans come first; local
  numbers and long-stay plans only fill in when none of those can carry a discount above the
  profit floor. Within a tier the order still rotates by day.
*/
function dealTier(plan: PhonePlanFull): number {
  const main = plan.region === 'us' || plan.region === 'global' || plan.region === 'europe';
  const trip = plan.days <= 30;
  if (main && trip) return 0;
  if (main) return 1;
  return trip ? 2 : 3;
}

async function computeTodayPhoneDeals(dealDay: string): Promise<PhoneDeal[]> {
  const config = await getHotDealsConfig();
  if (!config.enabled) return [];
  const [plans, ctx] = await Promise.all([getPhonePlans(), loadProfitContext()]);
  const pool = plans.filter((p) => p.visible && !p.requiresActivationDate);
  if (pool.length === 0) return [];

  const rng = seededRng(`phone:${dealDay}`);
  const shuffled = [...pool]
    .map((plan) => ({ plan, key: rng() }))
    .sort((a, b) => dealTier(a.plan) - dealTier(b.plan) || a.key - b.key)
    .map((x) => x.plan);
  const span = Math.max(0, config.discountMax - config.discountMin);
  const limit = maxPhoneDeals(config.count);
  const deals: PhoneDeal[] = [];
  const usedRegions = new Set<string>();

  // One per kind of number first, so two deals never both sell the same US number.
  for (const allowRepeatRegion of [false, true]) {
    for (const plan of shuffled) {
      if (deals.length >= limit) break;
      if (deals.some((d) => d.planId === plan.id)) continue;
      if (!allowRepeatRegion && usedRegions.has(plan.region)) continue;
      // The day's draw, stepping down to the smallest allowed discount if the draw would take the
      // plan under the profit floor: a phone plan's margin is thin, and 5% off is still a deal.
      const drawn = config.discountMin + Math.floor(rng() * (span + 1));
      let discountPercent = drawn;
      let dealPrice = 0;
      let netProfit = -Infinity;
      for (let pct = drawn; pct >= config.discountMin; pct--) {
        const price = Math.floor(plan.priceUsd * (1 - pct / 100) * 100) / 100;
        const profit = dealNetProfit(
          { packageCode: plan.id, packageName: plan.name, locationCode: plan.numberCountry, displayPrice: plan.priceUsd, simCost: plan.costUsd },
          price,
          ctx,
        );
        discountPercent = pct;
        dealPrice = price;
        netProfit = profit;
        if (profit >= config.minProfit) break;
      }
      if (netProfit < config.minProfit) continue; // the profit floor always wins
      deals.push({ planId: plan.id, plan, discountPercent, originalPrice: plan.priceUsd, dealPrice, netProfit: Math.round(netProfit * 100) / 100, dealDay });
      usedRegions.add(plan.region);
    }
  }
  return deals;
}

/** Today's phone deals. Memoised per day and per server instance; a failure yields no deals. */
export async function getTodayPhoneDeals(): Promise<PhoneDeal[]> {
  const day = utcDay();
  // Keyed by the settings too, so an admin change to the deal count or discounts applies at once.
  const config = await getHotDealsConfig();
  const key = `${day}|${config.enabled}|${config.count}|${config.minProfit}|${config.discountMin}|${config.discountMax}`;
  if (!cache.has(key)) {
    cache.clear();
    cache.set(key, computeTodayPhoneDeals(day).catch(() => []));
  }
  return cache.get(key)!;
}

/** The deal price for a phone plan today, or null. Checkout may only ever go lower, never higher. */
export async function getPhoneDealPrice(planId: string): Promise<number | null> {
  const deal = (await getTodayPhoneDeals()).find((d) => d.planId === planId);
  return deal ? deal.dealPrice : null;
}

/** Put today's deal prices on public phone plans, keeping the regular price to strike through. */
export function applyPhoneDeals(plans: PhonePlan[], deals: PhoneDeal[]): PhonePlan[] {
  return plans.map((p) => {
    const deal = deals.find((d) => d.planId === p.id);
    if (!deal || deal.dealPrice >= p.priceUsd) return p;
    return { ...p, priceUsd: deal.dealPrice, originalPriceUsd: p.priceUsd, saleBadge: `-${deal.discountPercent}%` };
  });
}
