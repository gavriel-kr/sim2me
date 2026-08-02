/**
 * Smart-shelf curation for destination pages (ticket 023).
 *
 * Pure functions Γאפ given the full plan list of a destination, pick 3Γאף5 "tiers"
 * named by trip intent, after removing duplicate specs and Pareto-dominated
 * plans. Nothing is removed from sale: the full catalog stays behind
 * a "Show all" toggle in the UI.
 */

import type { Plan } from '@/types';

export type PlanFamily = 'fixed' | 'daily' | 'unlimited';

export type TierKey = 'tierWeekend' | 'tierWeek' | 'tierMonth' | 'tierHeavy' | 'tierLong';

export interface CuratedTier {
  key: TierKey;
  plan: Plan;
  /** The single "Most popular" highlight of the shelf */
  isStar: boolean;
}

/**
 * Daily (per-day refill / FUP) plans all ship with duration <= 1 in the
 * supplier catalog; name matching alone is unreliable because plan names are
 * translated per locale.
 */
export function classifyFamily(plan: Plan): PlanFamily {
  if (plan.dataAmount < 0) return 'unlimited';
  if (plan.days <= 1 || /\/\s*Day/i.test(plan.name)) return 'daily';
  return 'fixed';
}

function gbOf(plan: Plan): number {
  return plan.dataAmount / 1024;
}

/**
 * Dedupe identical specs (same GB + days Γזע keep cheapest), then drop plans
 * strictly worse than another on price/data/days.
 */
export function paretoFrontier(plans: Plan[]): Plan[] {
  const bySpec = new Map<string, Plan>();
  for (const p of plans) {
    const key = `${gbOf(p).toFixed(2)}|${p.days}`;
    const existing = bySpec.get(key);
    if (!existing || p.price < existing.price) bySpec.set(key, p);
  }
  const deduped = [...bySpec.values()];

  const dominates = (a: Plan, b: Plan): boolean =>
    a !== b &&
    a.price <= b.price &&
    gbOf(a) >= gbOf(b) &&
    a.days >= b.days &&
    (a.price < b.price || gbOf(a) > gbOf(b) || a.days > b.days);

  return deduped.filter((b) => !deduped.some((a) => dominates(a, b)));
}

interface TierTarget {
  key: TierKey;
  gb: number;
  days: number;
}

const TIER_TARGETS: TierTarget[] = [
  { key: 'tierWeekend', gb: 1, days: 7 },
  { key: 'tierWeek', gb: 3, days: 15 },
  { key: 'tierMonth', gb: 10, days: 30 },
  { key: 'tierHeavy', gb: 20, days: 30 },
  { key: 'tierLong', gb: 50, days: 90 },
];

/** Log-ratio distance: symmetric for "half" vs "double" the target. */
function fitScore(plan: Plan, target: TierTarget): number {
  const gbRatio = Math.abs(Math.log(Math.max(gbOf(plan), 0.05) / target.gb));
  const daysRatio = Math.abs(Math.log(plan.days / target.days));
  return gbRatio + 0.6 * daysRatio;
}

/** Reject picks wildly off-target (e.g. a 50GB plan standing in for "weekend"). */
const MAX_FIT_SCORE = 2.2;

/** Value upgrade: prefer more data when it costs almost the same. */
const VALUE_UPGRADE_MAX_PRICE_RATIO = 1.15;
/** Don't upgrade past 4x the tier's data target Γאפ keeps tiers honest to their intent. */
const VALUE_UPGRADE_MAX_GB_FACTOR = 4;

/**
 * After nearest-fit picks a plan, check whether another frontier plan offers
 * strictly more data with same-or-longer validity for at most +15% price.
 * If so, the customer gets the better deal at (nearly) the same money.
 */
function valueUpgrade(picked: Plan, target: TierTarget, frontier: Plan[], used: Set<string>): Plan {
  let best = picked;
  for (const p of frontier) {
    if (p.id === picked.id || used.has(p.id)) continue;
    if (p.days < picked.days) continue;
    if (gbOf(p) <= gbOf(best)) continue;
    if (gbOf(p) > target.gb * VALUE_UPGRADE_MAX_GB_FACTOR) continue;
    if (p.price > picked.price * VALUE_UPGRADE_MAX_PRICE_RATIO) continue;
    best = p;
  }
  return best;
}

/**
 * Build the curated shelf. Returns [] when the catalog is too small to
 * curate meaningfully (caller should fall back to the full grid).
 */
export function buildTiers(plans: Plan[]): CuratedTier[] {
  const fixed = plans.filter((p) => classifyFamily(p) === 'fixed');
  const frontier = paretoFrontier(fixed);
  if (frontier.length < 3) return [];

  const used = new Set<string>();
  const tiers: CuratedTier[] = [];

  for (const target of TIER_TARGETS) {
    let best: Plan | null = null;
    let bestScore = Infinity;
    for (const p of frontier) {
      if (used.has(p.id)) continue;
      const score = fitScore(p, target);
      if (score < bestScore) {
        best = p;
        bestScore = score;
      }
    }
    if (best && bestScore <= MAX_FIT_SCORE) {
      const upgraded = valueUpgrade(best, target, frontier, used);
      used.add(upgraded.id);
      tiers.push({ key: target.key, plan: upgraded, isStar: false });
    }
  }

  if (tiers.length < 3) return [];

  // Exactly one star: admin-featured wins, else "The Full Trip", else middle tier
  const starIdx = (() => {
    const featured = tiers.findIndex((t) => t.plan.popular);
    if (featured >= 0) return featured;
    const month = tiers.findIndex((t) => t.key === 'tierMonth');
    if (month >= 0) return month;
    return Math.floor(tiers.length / 2);
  })();
  tiers[starIdx].isStar = true;

  return tiers;
}
