/**
 * Hot Deals engine (ticket 024) — server-only.
 *
 * Picks N daily deals (extra 5–10% off) from packages of admin-curated
 * featured destinations, with a hard profit gate: a deal is only created
 * when net profit after the discount stays >= minProfit (default $3),
 * using the same cost/fee model as the admin profit tools.
 *
 * Deals are stored per UTC day and generated lazily on first request.
 * Selection is seeded by the date so it is stable within a day and
 * rotates the next day.
 */

import { prisma } from '@/lib/prisma';
import { getDbCachedPackages } from '@/lib/packagesCache';
import {
  computeOtherFeesTotal,
  computeProfit,
  type AdditionalFeeItem,
} from '@/lib/profit';
import type { EsimPackage } from '@/lib/esimaccess';
import type { AdditionalFee, HotDeal, PackageOverride, Prisma } from '@prisma/client';

export interface HotDealsConfig {
  enabled: boolean;
  count: number;
  minProfit: number;    // USD net profit floor after discount
  discountMin: number;  // percent
  discountMax: number;  // percent
  minPrice: number;     // USD display-price floor for candidates
}

export const HOT_DEALS_CONFIG_KEY = 'hot_deals_config';

export const DEFAULT_HOT_DEALS_CONFIG: HotDealsConfig = {
  enabled: true,
  count: 6,
  minProfit: 3,
  discountMin: 5,
  discountMax: 10,
  minPrice: 8,
};

/** Used when the admin hasn't curated any featured destinations yet. */
const FALLBACK_LOCATIONS = ['US', 'GB', 'FR', 'IT', 'ES', 'GR', 'TR', 'TH', 'JP', 'AE'];

export async function getHotDealsConfig(): Promise<HotDealsConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: HOT_DEALS_CONFIG_KEY } });
    if (!row) return DEFAULT_HOT_DEALS_CONFIG;
    const parsed = JSON.parse(row.value) as Partial<HotDealsConfig>;
    return { ...DEFAULT_HOT_DEALS_CONFIG, ...parsed };
  } catch {
    return DEFAULT_HOT_DEALS_CONFIG;
  }
}

export function utcDay(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

/** Deterministic PRNG (mulberry32) seeded from a string — same day, same deals. */
/** Exported for the phone deals (ticket 042), which pick with the same seeded generator. */
export function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DealCandidate {
  packageCode: string;
  packageName: string;
  locationCode: string;
  displayPrice: number;
  simCost: number;
}

export interface ProfitContext {
  percentageFee: number;
  fixedFee: number;
  additionalFees: AdditionalFeeItem[];
}

export function dealNetProfit(candidate: DealCandidate, dealPrice: number, ctx: ProfitContext): number {
  const otherFeesTotal = computeOtherFeesTotal(dealPrice, ctx.additionalFees, candidate.packageCode);
  return computeProfit({
    salePrice: dealPrice,
    simCost: candidate.simCost,
    percentageFee: ctx.percentageFee,
    fixedFee: ctx.fixedFee,
    otherFeesTotal,
  }).netProfit;
}

async function buildCandidatePool(config: HotDealsConfig): Promise<DealCandidate[]> {
  const [featured, overrides, cached] = await Promise.all([
    prisma.featuredDestination.findMany({ select: { locationCode: true } }),
    prisma.packageOverride.findMany(),
    getDbCachedPackages(),
  ]);
  if (!cached?.packageList?.length) return [];

  const locations = new Set(
    featured.length > 0 ? featured.map((f: { locationCode: string }) => f.locationCode) : FALLBACK_LOCATIONS
  );
  const overrideMap = new Map<string, PackageOverride>(
    overrides.map((o: PackageOverride) => [o.packageCode, o])
  );

  const pool: DealCandidate[] = [];
  for (const pkg of cached.packageList as EsimPackage[]) {
    if (!locations.has(pkg.locationCode)) continue;
    // Fixed-data plans only — daily/unlimited plans have confusing deal math
    if (pkg.volume <= 0 || pkg.duration <= 1) continue;

    const override = overrideMap.get(pkg.packageCode);
    if (override?.visible === false) continue;

    const displayPrice =
      override?.customPrice != null
        ? Number(override.customPrice)
        : (pkg.retailPrice ? pkg.retailPrice / 10000 : pkg.price / 10000);
    if (displayPrice < config.minPrice) continue;

    pool.push({
      packageCode: pkg.packageCode,
      packageName: override?.customTitle || pkg.name,
      locationCode: pkg.locationCode,
      displayPrice,
      simCost: override?.simCost != null ? Number(override.simCost) : pkg.price / 10000,
    });
  }
  return pool;
}

export async function loadProfitContext(): Promise<ProfitContext> {
  const [feeSettings, additionalFees] = await Promise.all([
    prisma.feeSettings.findFirst(),
    prisma.additionalFee.findMany(),
  ]);
  return {
    percentageFee: feeSettings ? Number(feeSettings.paddlePercentageFee) : 0.05,
    fixedFee: feeSettings ? Number(feeSettings.paddleFixedFee) : 0.5,
    additionalFees: additionalFees.map((f: AdditionalFee) => ({
      type: f.type === 'FIXED' ? ('fixed' as const) : ('percentage' as const),
      value: Number(f.value),
      isActive: f.isActive,
      appliesTo: f.appliesTo === 'ALL_PRODUCTS' ? ('all_products' as const) : ('selected_products' as const),
      selectedProductIds: f.selectedProductIds ? (JSON.parse(f.selectedProductIds) as string[]) : [],
    })),
  };
}

/**
 * Generate deals for a day. Carries over yesterday's pinned deals
 * (re-validated against today's prices), then fills remaining slots
 * with seeded-random eligible candidates — one per destination while
 * that can fill the day, repeating destinations only if it cannot.
 *
 * `alreadyCommitted` are rows that exist for the day and are staying — today's pinned deals during
 * a regenerate. They are not re-created, but they occupy slots and their destinations and packages
 * are taken, so the caller has to hand them over or the day ends up over its configured count.
 */
async function generateDeals(
  dealDay: string,
  config: HotDealsConfig,
  alreadyCommitted: HotDeal[] = []
): Promise<void> {
  const slots = config.count - alreadyCommitted.length;
  if (slots <= 0) return;

  const [pool, ctx, pinnedYesterday] = await Promise.all([
    buildCandidatePool(config),
    loadProfitContext(),
    prisma.hotDeal.findMany({ where: { dealDay: utcDay(-1), pinned: true, active: true } }),
  ]);
  if (pool.length === 0) return;

  const rng = seededRng(dealDay);
  const rows: Prisma.HotDealCreateManyInput[] = [];
  const usedLocations = new Set<string>(alreadyCommitted.map((r: HotDeal) => r.locationCode));
  const usedPackages = new Set<string>(alreadyCommitted.map((r: HotDeal) => r.packageCode));

  // 1. Pinned carryover — same discount, prices/profit recomputed for today
  for (const pin of pinnedYesterday) {
    if (rows.length >= slots) break;
    if (usedPackages.has(pin.packageCode)) continue; // already kept for today
    const candidate = pool.find((c: DealCandidate) => c.packageCode === pin.packageCode);
    if (!candidate) continue;
    const dealPrice = Math.floor(candidate.displayPrice * (1 - pin.discountPercent / 100) * 100) / 100;
    const netProfit = dealNetProfit(candidate, dealPrice, ctx);
    if (netProfit < config.minProfit) continue; // profit gate always wins over pinning
    rows.push({
      packageCode: candidate.packageCode,
      dealDay,
      discountPercent: pin.discountPercent,
      originalPrice: candidate.displayPrice,
      dealPrice,
      netProfit: Math.round(netProfit * 100) / 100,
      locationCode: candidate.locationCode,
      packageName: candidate.packageName,
      pinned: true,
      active: true,
    });
    usedLocations.add(candidate.locationCode);
    usedPackages.add(candidate.packageCode);
  }

  // 2. Seeded-random fill, in two passes over the same shuffle.
  //
  //    Pass 1 allows one deal per destination, which is what makes the row read as a set of places
  //    rather than one country on sale six times. Pass 2 runs only if that could not fill the day —
  //    with six slots and eight featured destinations, a single destination whose packages all fail
  //    the profit gate would otherwise leave a visibly ragged second row. Variety is the thing worth
  //    giving up there; the profit gate is not, and it is applied identically in both passes.
  const shuffled = [...pool].sort(() => rng() - 0.5);
  for (const allowRepeatLocation of [false, true]) {
    if (rows.length >= slots) break;

    for (const candidate of shuffled) {
      if (rows.length >= slots) break;
      if (usedPackages.has(candidate.packageCode)) continue;
      if (!allowRepeatLocation && usedLocations.has(candidate.locationCode)) continue;

      const span = Math.max(0, config.discountMax - config.discountMin);
      const discountPercent = config.discountMin + Math.floor(rng() * (span + 1));
      const dealPrice = Math.floor(candidate.displayPrice * (1 - discountPercent / 100) * 100) / 100;
      const netProfit = dealNetProfit(candidate, dealPrice, ctx);
      if (netProfit < config.minProfit) continue;

      rows.push({
        packageCode: candidate.packageCode,
        dealDay,
        discountPercent,
        originalPrice: candidate.displayPrice,
        dealPrice,
        netProfit: Math.round(netProfit * 100) / 100,
        locationCode: candidate.locationCode,
        packageName: candidate.packageName,
        pinned: false,
        active: true,
      });
      usedLocations.add(candidate.locationCode);
      usedPackages.add(candidate.packageCode);
    }
  }

  if (rows.length > 0) {
    // skipDuplicates guards against a concurrent request generating the same day
    await prisma.hotDeal.createMany({ data: rows, skipDuplicates: true });
  }
}

/**
 * Idempotent daily entry point: returns today's active deals, generating
 * them on the first call of the day. Once rows exist for the day, admin
 * toggles are respected and nothing is regenerated automatically.
 */
export async function ensureTodayDeals(): Promise<HotDeal[]> {
  const config = await getHotDealsConfig();
  if (!config.enabled) return [];

  const dealDay = utcDay();
  // Ordered, because the result is sliced to `count`: without it the database is free to return the
  // day's rows in any order and a day holding more rows than the current count would serve a
  // different, arbitrary subset from one request to the next.
  const existing = await prisma.hotDeal.findMany({ where: { dealDay }, orderBy: { createdAt: 'asc' } });
  if (existing.length > 0) {
    return existing.filter((d: HotDeal) => d.active).slice(0, config.count);
  }

  await generateDeals(dealDay, config);
  const created = await prisma.hotDeal.findMany({
    where: { dealDay, active: true },
    orderBy: { createdAt: 'asc' },
  });
  return created.slice(0, config.count);
}

/**
 * Regenerate today's deals (admin action). Keeps pinned rows, replaces the rest.
 */
export async function regenerateTodayDeals(): Promise<HotDeal[]> {
  const config = await getHotDealsConfig();
  const dealDay = utcDay();
  await prisma.hotDeal.deleteMany({ where: { dealDay, pinned: false } });

  const kept = await prisma.hotDeal.findMany({ where: { dealDay } });
  if (kept.length < config.count) {
    // The kept rows have to be handed over: they hold slots, destinations and packages that the
    // generator would otherwise hand out a second time, overshooting the configured count.
    await generateDeals(dealDay, config, kept);
  }
  return prisma.hotDeal.findMany({ where: { dealDay }, orderBy: { createdAt: 'asc' } });
}

/**
 * Display hook: today's active deals for one destination.
 *
 * The destination page needs this because checkout already honours the deal price. A page that
 * showed the catalog price for a package on offer would quote more than we intend to charge, and
 * would hide the discount on exactly the page the homepage deal links to.
 */
export async function getTodayDealsForLocation(locationCode: string): Promise<HotDeal[]> {
  const deals = await ensureTodayDeals();
  const code = locationCode.toUpperCase();
  return deals.filter((d: HotDeal) => d.locationCode.toUpperCase() === code);
}

/**
 * Checkout hook: active deal price for a package, if any.
 * Yesterday's deals are honored too (grace for carts created late at night).
 */
export async function getActiveDealPrice(packageCode: string): Promise<number | null> {
  const deal = await prisma.hotDeal.findFirst({
    where: { packageCode, active: true, dealDay: { in: [utcDay(), utcDay(-1)] } },
    orderBy: { dealDay: 'desc' },
  });
  return deal ? Number(deal.dealPrice) : null;
}
