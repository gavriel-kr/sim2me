/**
 * What to offer someone already looking at one package (ticket 030).
 *
 * Two cards, drawn from the same curated shelf the destination page shows, so a visitor who
 * arrived by clicking a shelf card never meets a fifth package that contradicts the four they
 * just left: the one nearest the trip they seem to be planning, and the Best-Seller.
 */

import type { Plan } from '@/types';
import { buildTiers, nearestTier, type CuratedTier } from '@/lib/plan-curation';

export interface PlanRecommendations {
  /** Nearest remaining shelf slot to the plan on screen. Never the star, never the plan itself. */
  similar: CuratedTier | null;
  /** The shelf's single "Most popular". Absent when it *is* the plan on screen. */
  star: CuratedTier | null;
}

export function recommendPlans(plans: Plan[], currentPlanId: string): PlanRecommendations {
  const empty: PlanRecommendations = { similar: null, star: null };
  if (plans.length === 0) return empty;

  /*
    Curate on catalog prices, exactly as DestinationDetailClient does. The shelf is picked off a
    Pareto frontier, so a deal price would let the discounted package crowd out plans it does not
    really beat, and the recommendation would silently change shape at midnight when the deal
    expires. The live price is put back below, after the picking is done.
  */
  const tiers = buildTiers(
    plans.map((p) => (p.originalPrice != null ? { ...p, price: p.originalPrice } : p))
  );
  if (tiers.length === 0) return empty;

  /*
    Back to the price we actually charge. Curation needed the catalog price; the card must not show
    it. If a recommended package happens to be today's hot deal, this is what makes it quote the
    same discounted figure the destination page quotes, strikethrough and all.
  */
  const priced = tiers.map((tier) => {
    const live = plans.find((p) => p.id === tier.plan.id);
    return live ? { ...tier, plan: live } : tier;
  });

  let star = priced.find((t) => t.isStar) ?? null;
  if (star?.plan.id === currentPlanId) star = null;

  /*
    The nearest slot, honestly. The star is *not* held back from this search to force a second card:
    on a four-slot shelf the star is usually the month tier, and holding it back pushes "similar" out
    to whatever is left — a visitor looking at 3 GB for $3.40 would be shown 20 GB for $16.40 under a
    heading promising something like what they are already reading. One card that is true beats two
    where the first is a five-times-the-price upsell wearing the word "similar".
  */
  const current = plans.find((p) => p.id === currentPlanId) ?? null;
  const candidates = priced.filter((t) => t.plan.id !== currentPlanId);
  let similar = current ? nearestTier(candidates, current) : null;

  // Same package under two headings reads as a page that has lost track of itself.
  if (similar && star && similar.plan.id === star.plan.id) similar = null;

  return { similar, star };
}
