'use client';

import { useTranslations } from 'next-intl';
import type { Plan } from '@/types';
import type { TierKey } from '@/lib/plan-curation';
import { PlanCard } from '@/components/sections/PlanCard';

interface CuratedTierCardProps {
  tierKey: TierKey;
  plan: Plan;
  isStar: boolean;
  destinationName: string;
  destinationSlug: string;
}

/**
 * Thin wrapper: trip-intent header (tier name + one-line description) above
 * the existing PlanCard. The star tier reuses PlanCard's Best-Seller strip.
 */
export function CuratedTierCard({ tierKey, plan, isStar, destinationName, destinationSlug }: CuratedTierCardProps) {
  const t = useTranslations('destinations');
  const displayPlan = isStar && !plan.popular ? { ...plan, popular: true } : plan;

  return (
    <div className="flex flex-col">
      <div className="mb-2 px-1">
        <p className="text-base font-bold text-gray-800">{t(tierKey)}</p>
        <p className="text-xs text-muted-foreground">{t(`${tierKey}Desc`)}</p>
      </div>
      <div className="flex-1 [&>*]:h-full">
        <PlanCard
          plan={displayPlan}
          destinationName={destinationName}
          destinationSlug={destinationSlug}
        />
      </div>
    </div>
  );
}
