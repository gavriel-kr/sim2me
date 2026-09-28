'use client';

/**
 * Ticket 042 — the "unlimited" tab: pick how many days, see one price.
 *
 * The page never computes a price. The server sends a finished table (`offer.prices[d - 1]`), so the
 * number on the button is the number checkout will charge, and wholesale cost never reaches the
 * browser. Any day count from 1 to 30, by stepper or slider (decided with Gabriel).
 */

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus, Wifi, Smartphone, Share2, Phone } from 'lucide-react';
import type { UnlimitedOffer } from '@/lib/unlimited';
import { DAYPASS_MAX_DAYS, DAYPASS_MIN_DAYS } from '@/lib/product-id';
import { dayPassToPlan } from '@/lib/new-product-plans';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { useAddPlanToCart, formatFupSpeed } from '@/hooks/useAddPlanToCart';

interface Props {
  offer: UnlimitedOffer;
  destinationName: string;
  destinationSlug: string;
  /** Present when the destination also has phone plans: the upsell line switches to that tab. */
  onShowPhonePlans?: () => void;
}

const DEFAULT_DAYS = 7;

export function UnlimitedPicker({ offer, destinationName, destinationSlug, onShowPhonePlans }: Props) {
  const t = useTranslations('unlimited');
  const tPlan = useTranslations('plan');
  const { add, buyNow } = useAddPlanToCart();
  const [days, setDays] = useState(DEFAULT_DAYS);

  const price = offer.prices[days - 1];
  const plan = useMemo(() => dayPassToPlan(offer, days, destinationSlug, destinationName), [offer, days, destinationSlug, destinationName]);
  const daysLabel = t('days', { days });
  const speed = formatFupSpeed(offer.fupKbps);
  const fairUse = speed
    ? t('fairUse', { gb: offer.dailyGb, speed })
    : t('fairUseNoSpeed', { gb: offer.dailyGb });

  const setClamped = (n: number) => setDays(Math.min(DAYPASS_MAX_DAYS, Math.max(DAYPASS_MIN_DAYS, n)));

  return (
    <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/90 bg-gradient-to-br from-white to-emerald-50/60 p-5 shadow-lg shadow-emerald-900/5 sm:p-7">
        <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

        {/* Stepper: big targets for a thumb, the number itself as the centrepiece */}
        <div className="mt-6 flex items-center justify-center gap-4 sm:justify-start">
          <button
            type="button"
            onClick={() => setClamped(days - 1)}
            disabled={days <= DAYPASS_MIN_DAYS}
            aria-label={t('fewer')}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-5 w-5" />
          </button>
          <output aria-live="polite" className="min-w-[8.5rem] text-center">
            <span className="block text-4xl font-bold tabular-nums text-gray-800">{days}</span>
            <span className="block text-sm font-medium text-muted-foreground">{t('daysUnit', { days })}</span>
          </output>
          <button
            type="button"
            onClick={() => setClamped(days + 1)}
            disabled={days >= DAYPASS_MAX_DAYS}
            aria-label={t('more')}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 max-w-md">
          <input
            type="range"
            id="unlimited-days"
            min={DAYPASS_MIN_DAYS}
            max={DAYPASS_MAX_DAYS}
            step={1}
            value={days}
            onChange={(e) => setClamped(Number(e.target.value))}
            aria-label={t('sliderLabel')}
            className="h-1.5 w-full cursor-pointer accent-emerald-500"
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-gray-400">
            <span>{DAYPASS_MIN_DAYS}</span>
            <span>{DAYPASS_MAX_DAYS}</span>
          </div>
        </div>

        {/* The offer for the chosen days */}
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-800">{t('cartLine', { days: daysLabel })}</p>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{fairUse}</p>
            </div>
            <div className="text-end">
              <p className="text-3xl font-bold tabular-nums text-gray-800">{formatPrice(price)}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {t('perDay', { price: formatPrice(price / days) })}
              </p>
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              <Smartphone className="h-3.5 w-3.5" aria-hidden />
              {t('dataOnly')}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <Wifi className="h-3.5 w-3.5" aria-hidden />
              {t('network', { network: plan.networkType })}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              {t('hotspot')}
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{t('dataOnlyHint')}</p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)]"
              onClick={() => buyNow(plan, destinationName, destinationSlug)}
            >
              {t('buyNow')} · {formatPrice(price)}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => add(plan, destinationName, destinationSlug, `${destinationName} · ${t('cartLine', { days: daysLabel })}`)}
            >
              {tPlan('addToCart')}
            </Button>
          </div>
        </div>

        {onShowPhonePlans && (
          <p className="mt-5 flex flex-wrap items-center gap-1.5 text-sm text-gray-700">
            <Phone className="h-4 w-4 text-sky-600" aria-hidden />
            {t('phoneUpsell')}
            <button
              type="button"
              onClick={onShowPhonePlans}
              className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
            >
              {t('phoneUpsellLink')}
            </button>
          </p>
        )}
      </div>

      {/* Sima working the number out — beside the picker on a wide screen, gone on a phone where the
          picker needs the width. */}
      <CharacterFigure slot="unlimitedEstimating" height={200} heightLg={300} className="hidden lg:block" />
    </div>
  );
}
