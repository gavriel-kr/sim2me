'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { planToGaItem, trackAddToCart } from '@/lib/analytics';
import { dealToPlan, localizedCountryName, volumeToDisplay, type HotDeal } from '@/lib/deals';

/**
 * Ticket 028 — adds a hot deal to the cart. Lifted out of `HotDealsSection`'s `DealCard` unchanged,
 * so the hero card and the deals row produce one identical cart line and one identical analytics
 * event no matter which one the visitor clicks.
 */
export function useAddDeal() {
  const tPlan = useTranslations('plan');
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  return (deal: HotDeal) => {
    const countryName = localizedCountryName(deal.locationCode, deal.name, locale);
    const { dataDisplay } = volumeToDisplay(deal.volume);
    const plan = dealToPlan(deal, locale);

    addItem({
      planId: plan.id,
      destinationId: plan.destinationId,
      destinationName: countryName,
      destinationSlug: deal.locationCode.toLowerCase(),
      plan,
    });
    trackAddToCart(planToGaItem(plan, countryName));
    toast({
      title: tPlan('toastAdded'),
      description: `${dataDisplay} / ${deal.duration} ${tPlan('days')} ${tPlan('forDestination')} ${countryName}`,
      variant: 'success',
    });
  };
}
