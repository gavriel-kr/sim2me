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
import { countryName as regionName } from '@/components/sections/PhonePlanCard';

/**
 * Ticket 042 — what a deal is called: the country for an eSIM deal, and for a phone deal the kind of
 * number ("USA", "Europe · 36 countries", "Global · 168 countries", or the local number's country).
 */
export function useDealTitle() {
  const locale = useLocale();
  const tP = useTranslations('phonePlans');
  return (deal: HotDeal): string => {
    const p = deal.phone;
    if (!p) return localizedCountryName(deal.locationCode, deal.name, locale);
    if (p.region === 'us') return tP('regionUs');
    if (p.region === 'europe') return tP('regionEurope');
    if (p.region === 'global') return tP('regionGlobal', { count: p.coverageCount });
    return regionName(p.numberCountry, locale);
  };
}

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
  const dealTitle = useDealTitle();

  return (deal: HotDeal) => {
    const countryName = dealTitle(deal);
    const dataDisplay = localizeDataDisplay(volumeToDisplay(deal.volume).dataDisplay, locale);
    const plan = dealToPlan(deal, locale);

    addItem({
      planId: plan.id,
      destinationId: plan.destinationId,
      destinationName: countryName,
      destinationSlug: deal.phone ? 'phone-plans' : deal.locationCode.toLowerCase(),
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
