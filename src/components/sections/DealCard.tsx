'use client';

import { useTranslations, useLocale } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { formatPrice, localizeDataDisplay } from '@/lib/utils';
import { localizedCountryName, volumeToDisplay, type HotDeal } from '@/lib/deals';
import { useAddDeal } from '@/hooks/useAddDeal';
import { Button } from '@/components/ui/button';
import { Flame, ShoppingCart } from 'lucide-react';

/**
 * One hot deal, as sold on the homepage and in the hero.
 *
 * Deliberately compact: it is a teaser that sends the visitor to the destination page, where the
 * same package is shown in full as a plan card. Details do not belong here.
 */

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function DealCard({ deal }: { deal: HotDeal }) {
  const t = useTranslations('home');
  const tPlan = useTranslations('plan');
  const locale = useLocale();
  const addDeal = useAddDeal();

  const countryName = localizedCountryName(deal.locationCode, deal.name, locale);
  const slug = deal.locationCode.toLowerCase();
  const dataDisplay = localizeDataDisplay(volumeToDisplay(deal.volume).dataDisplay, locale);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-900/10">
      {/* Discount ribbon */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Flame className="h-3.5 w-3.5" />
          -{deal.discountPercent}%
        </span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">
          {t('hotDealsEndsToday')}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <img
            src={`https://flagcdn.com/w80/${deal.flagCode}.png`}
            alt=""
            className="h-9 w-[52px] shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
          />
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{countryName}</p>
            <p className="text-sm text-muted-foreground">
              {dataDisplay} · {deal.duration} {tPlan('days')}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-2xl font-extrabold text-emerald-600">
            {formatPrice(deal.dealPrice, deal.currency)}
          </span>
          <span className="text-sm font-medium text-gray-400 line-through">
            {formatPrice(deal.originalPrice, deal.currency)}
          </span>
        </div>

        {/*
          The link sits above the button and carries its own words. It replaced an icon-only arrow
          beside the button: two links to one destination in one card is a duplicate stop for anyone
          navigating by keyboard or screen reader, and the arrow said nothing on its own.

          `mt-auto` on the block below keeps the button on the card's bottom edge whatever the link
          wraps to, so a long country name cannot leave one card in a row shorter than its neighbours.
        */}
        <div className="mt-auto pt-4">
          <IntlLink
            href={`/destinations/${slug}`}
            className="block text-center text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            {t('hotDealsViewAll', { destination: countryName })}
          </IntlLink>

          <Button className="mt-2 w-full gap-1.5" onClick={() => addDeal(deal)}>
            <ShoppingCart className="h-4 w-4" />
            {t('hotDealsAddToCart')}
          </Button>
        </div>
      </div>
    </div>
  );
}
