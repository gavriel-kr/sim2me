'use client';

/**
 * Ticket 042 — one PikaSim plan with a phone number.
 *
 * Built on the same card as `PlanCard` (rounded, white, emerald hover) so it sits naturally among
 * the site's cards, but headed by a sky-blue number strip. That strip is the one thing that has to
 * read differently at a glance: this card comes with a phone number and the others do not.
 */

import { useLocale, useTranslations } from 'next-intl';
import { Phone, MessageSquare, Database, CalendarDays, Globe2, Sparkles, RefreshCw } from 'lucide-react';
import type { PhonePlan } from '@/lib/phone-plans';
import { phonePlanToPlan } from '@/lib/new-product-plans';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAddPlanToCart } from '@/hooks/useAddPlanToCart';
import { PhoneCountriesDialog } from '@/components/sections/PhoneCountriesDialog';

interface Props {
  plan: PhonePlan;
  /** What the cart and the checkout summary call this purchase ("USA", "Greece"…). */
  destinationName: string;
  destinationSlug: string;
}

/** "MN" → "Mongolia" in the reader's language, so a local number says whose it is. */
export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function usePhonePlanLabels() {
  const t = useTranslations('phonePlans');
  const locale = useLocale();
  const number = (p: Pick<PhonePlan, 'region' | 'dialCode' | 'numberCountry'>) =>
    p.region === 'us'
      ? t('numberUs')
      : p.region === 'europe'
        ? t('numberEurope')
        : p.region === 'global'
          ? t('numberGlobal')
          : t('numberLocal', { dial: `‎${p.dialCode}`, country: countryName(p.numberCountry, locale) });
  const minutes = (p: Pick<PhonePlan, 'region' | 'voiceMinutes'>) =>
    p.voiceMinutes < 0
      ? p.region === 'europe'
        ? t('minutesUnlimitedEurope')
        : t('minutesUnlimited')
      : t('minutes', { count: p.voiceMinutes });
  const sms = (p: Pick<PhonePlan, 'sms'>) => (p.sms < 0 ? t('smsUnlimited') : t('sms', { count: p.sms }));
  /* For a card's headline, where a phone plan leads with its calls rather than its data. */
  const minutesShort = (p: Pick<PhonePlan, 'region' | 'voiceMinutes'>) =>
    p.voiceMinutes < 0 ? minutes(p) : t('minutesShort', { count: p.voiceMinutes });
  return { number, minutes, sms, minutesShort };
}

export function PhonePlanCard({ plan, destinationName, destinationSlug }: Props) {
  const t = useTranslations('phonePlans');
  const tPlan = useTranslations('plan');
  const labels = usePhonePlanLabels();
  const { add, buyNow } = useAddPlanToCart();
  const cartPlan = phonePlanToPlan(plan, destinationSlug);
  const days = t('days', { days: plan.days });
  const flag = plan.numberCountry.toLowerCase();

  const description = t('cartLine', {
    data: t('data', { gb: plan.dataGb }),
    days,
    minutes: labels.minutes(plan),
    sms: labels.sms(plan),
  });

  return (
    <Card
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-sky-900/5 ${
        plan.featured ? 'border-sky-200 ring-2 ring-sky-200' : 'border-sky-100/80'
      }`}
    >
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-sky-600 to-teal-500 px-4 py-2 text-xs font-semibold text-white">
        <span className="flex items-center gap-2">
          <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" className="h-3.5 w-5 rounded-sm object-cover ring-1 ring-white/40" />
          {labels.number(plan)}
        </span>
        {plan.featured ? (
          <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t('featured')}
          </span>
        ) : plan.saleBadge ? (
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950">{plan.saleBadge}</span>
        ) : null}
      </div>

      <CardContent className="flex-1 p-6">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-3">
          <p className="text-xl font-bold text-gray-700">
            {labels.minutesShort(plan)} · {plan.dataGb}GB · {days}
          </p>
          <span className="flex flex-col items-end">
            <span className={`text-xl font-bold tabular-nums ${plan.originalPriceUsd ? 'text-emerald-600' : 'text-gray-800'}`}>{formatPrice(plan.priceUsd)}</span>
            {plan.originalPriceUsd != null && (
              <span className="text-sm font-medium tabular-nums text-gray-400 line-through">{formatPrice(plan.originalPriceUsd)}</span>
            )}
          </span>
        </div>
        <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-sky-100 p-1.5 text-sky-700" aria-hidden>
              <Phone className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-foreground">{labels.minutes(plan)}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-teal-100 p-1.5 text-teal-700" aria-hidden>
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-foreground">{labels.sms(plan)}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-purple-100 p-1.5 text-purple-600" aria-hidden>
              <Database className="h-3.5 w-3.5" />
            </span>
            {t('data', { gb: plan.dataGb })}
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-100 p-1.5 text-amber-600" aria-hidden>
              <CalendarDays className="h-3.5 w-3.5" />
            </span>
            {tPlan('validity')}: {days}
          </li>
          {plan.coverageCount > 1 && (
            <li className="flex items-center gap-2">
              <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-100 p-1.5 text-emerald-600" aria-hidden>
                <Globe2 className="h-3.5 w-3.5" />
              </span>
              <span>
                {t('worksIn', { count: plan.coverageCount })}
                {' · '}
                <PhoneCountriesDialog codes={plan.coverage} />
              </span>
            </li>
          )}
        </ul>
        <p className="mt-4 text-xs font-medium text-sky-700">{t('includes')}</p>
        <p className={`mt-1 flex items-center gap-1 text-xs ${plan.renewable ? 'text-emerald-700' : 'text-gray-500'}`}>
          <RefreshCw className="h-3 w-3 shrink-0" aria-hidden />
          {plan.renewable ? t('badgeRenewable') : t('badgeNotRenewable')}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2 p-6 pt-0">
        {/* Sky-to-teal, like the number strip: a phone plan's buy button reads differently from an
            eSIM-only one at a glance (Gabriel, 2026-09-28). Only the phone cards use it. */}
        <Button
          className="flex-1 bg-gradient-to-r from-sky-600 to-teal-500 text-white shadow-sm hover:from-sky-700 hover:to-teal-600"
          onClick={() => buyNow(cartPlan, destinationName, destinationSlug)}
        >
          {t('buyNow')}
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => add(cartPlan, destinationName, destinationSlug, `${labels.number(plan)} · ${description}`)}
        >
          {tPlan('addToCart')}
        </Button>
      </CardFooter>
    </Card>
  );
}
