'use client';

import { useTranslations } from 'next-intl';
import { CuratedTierCard } from '@/components/sections/CuratedTierCard';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import type { PlanRecommendations } from '@/lib/plan-recommendations';

interface Props {
  recommendations: PlanRecommendations;
  destinationName: string;
  destinationSlug: string;
}

/**
 * Ticket 030 — what else to look at, at the bottom of a single-plan page.
 *
 * The cards are the destination page's `CuratedTierCard`, untouched, so a visitor who clicked
 * through from the shelf meets the same card design, the same tier names and the same prices they
 * were just reading. Anything bespoke here would have been a second opinion about the catalogue.
 */
export function RecommendedPlans({ recommendations, destinationName, destinationSlug }: Props) {
  const t = useTranslations('plan');
  const tiers = [recommendations.similar, recommendations.star].filter((tier) => tier != null);

  // Nothing to say — no heading, no characters, no gap where a section would have been.
  if (tiers.length === 0) return null;

  return (
    <section className="mt-12 border-t border-gray-100 pt-10">
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Peering down at the cards, so the pair points at the thing rather than decorating a rule */}
        <CharacterFigure slot="catalogReaction" height={96} heightLg={148} />
        <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">{t('recommendedHeading')}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t('recommendedSubtitle')}</p>
      </div>

      {/*
        One recommendation is a common outcome, not an edge case: when the nearest tier to the plan
        on screen is also the Best-Seller there is only one honest card to show. A two-column grid
        would render it at half width beside an empty cell, so a single card gets its own width.
      */}
      <div
        className={
          tiers.length === 1
            ? 'mx-auto mt-8 max-w-sm'
            : 'mt-8 grid gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl'
        }
      >
        {tiers.map((tier) => (
          <CuratedTierCard
            key={tier.plan.id}
            tierKey={tier.key}
            plan={tier.plan}
            isStar={tier.isStar}
            destinationName={destinationName}
            destinationSlug={destinationSlug}
          />
        ))}
      </div>
    </section>
  );
}
