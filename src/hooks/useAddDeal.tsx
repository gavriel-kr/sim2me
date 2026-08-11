'use client';

import { useTranslations, useLocale } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { ToastAction } from '@/components/ui/toast';
import { routing } from '@/i18n/routing';
import { planToGaItem, trackAddToCart } from '@/lib/analytics';
import { localizeDataDisplay } from '@/lib/utils';
import { dealToPlan, localizedCountryName, volumeToDisplay, type HotDeal } from '@/lib/deals';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

/**
 * Ticket 028 — adds a hot deal to the cart. Lifted out of `HotDealsSection`'s `DealCard` unchanged,
 * so the hero card and the deals row produce one identical cart line and one identical analytics
 * event no matter which one the visitor clicks.
 *
 * Ticket 034 gave the confirmation toast a way out to the checkout, which is why this file carries a
 * `.tsx` extension.
 */
export function useAddDeal() {
  const tPlan = useTranslations('plan');
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  return (deal: HotDeal) => {
    const countryName = localizedCountryName(deal.locationCode, deal.name, locale);
    const dataDisplay = localizeDataDisplay(volumeToDisplay(deal.volume).dataDisplay, locale);
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
      duration: 9000,
      action: (
        <ToastAction asChild altText={tPlan('toastGoToCheckout')}>
          <IntlLink href="/checkout">{tPlan('toastGoToCheckout')}</IntlLink>
        </ToastAction>
      ),
    });
  };
}
