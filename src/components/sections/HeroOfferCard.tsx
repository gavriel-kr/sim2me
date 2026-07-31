'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { localizedCountryName, volumeToDisplay, type HotDeal } from '@/lib/deals';
import { useAddDeal } from '@/hooks/useAddDeal';
import type { PauseHandlers } from '@/hooks/useDealRotation';
import { Flame, ShoppingCart } from 'lucide-react';

/**
 * Ticket 028 — the card Simi and Sima present in the hero, cycling through today's hot deals.
 *
 * This is not the phone mockup returning. That showed three deals at once, at 10 px, with nothing to
 * click — a shrunken preview of the section 200 px below it. This shows one deal at full size with a
 * working button, so the sequence adds reach without adding density.
 *
 * The rotation itself is not owned here: it comes from `useDealRotation` in `Hero`, shared with the
 * deal chip so the two never disagree about which deal is today's.
 *
 * Every slide stays in the DOM in one flex track, so the card's height is the tallest slide from the
 * first paint and advancing cannot move anything on the page. `translateX` is physical, so the sign
 * comes from the locale: the track has to move *toward* the reading direction for the next slide to
 * arrive from the far side in both scripts.
 */

interface Props {
  deals: HotDeal[];
  active: number;
  onSelect: (index: number) => void;
  pauseHandlers: PauseHandlers;
}

export function HeroOfferCard({ deals, active, onSelect, pauseHandlers }: Props) {
  const t = useTranslations('home');
  const tPlan = useTranslations('plan');
  const locale = useLocale();
  const addDeal = useAddDeal();
  const rtl = locale === 'he' || locale === 'ar';

  if (deals.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={t('hotDealsTitle')}
      className="w-[320px] rounded-2xl border border-gray-100 bg-white p-4 shadow-card"
      {...pauseHandlers}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
          <Flame className="h-3 w-3" aria-hidden="true" />
          {t('hotDealsEndsToday')}
        </span>
        {deals.length > 1 && (
          <span className="flex items-center gap-1.5">
            {deals.map((deal, i) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={localizedCountryName(deal.locationCode, deal.name, locale)}
                aria-current={i === active}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? 'w-4 bg-primary' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </span>
        )}
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${(rtl ? 1 : -1) * active * 100}%)` }}
        >
          {deals.map((deal) => {
            const countryName = localizedCountryName(deal.locationCode, deal.name, locale);
            const { dataDisplay } = volumeToDisplay(deal.volume);
            return (
              <div key={deal.id} className="w-full shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://flagcdn.com/w80/${deal.flagCode}.png`}
                    alt=""
                    className="h-6 w-9 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-foreground">{countryName}</p>
                    <p className="text-xs text-muted-foreground">
                      {dataDisplay} &middot; {deal.duration} {tPlan('days')}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-extrabold text-primary">
                      {formatPrice(deal.dealPrice, deal.currency)}
                    </p>
                    <p className="text-xs text-gray-400 line-through">
                      {formatPrice(deal.originalPrice, deal.currency)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => addDeal(deals[active])}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
      >
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        {t('hotDealsAddToCart')}
      </button>
    </div>
  );
}
