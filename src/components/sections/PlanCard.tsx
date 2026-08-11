'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Plan } from '@/types';
import { formatPrice, localizeDataDisplay } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Info, Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { ToastAction } from '@/components/ui/toast';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { DataUsageModal } from '@/components/sections/DataUsageModal';
import { planToGaItem, trackAddToCart } from '@/lib/analytics';
import { Sim2MeIcon } from '@/components/icons/Sim2MeIcon';
import { BrandGlobeWaves } from '@/components/icons/BrandGlobeWaves';

/* Thin line icons for Data, Validity, Network */
const IconData = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);
const IconValidity = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconNetwork = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden>
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);
const IconSpark = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0" aria-hidden>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 10l5.813 1.912a2 2 0 0 1 1.275 1.275L12 17l1.912-5.813a2 2 0 0 1 1.275-1.275L21 10l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

/** Works on both desktop (hover) and mobile (click-toggle) */
function InfoTooltip({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
          className="inline-flex cursor-pointer text-muted-foreground hover:text-emerald-600 transition-colors"
          aria-label="info"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="border-emerald-100 bg-emerald-50/95 text-gray-800">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

interface PlanCardProps {
  plan: Plan;
  destinationName: string;
  destinationSlug: string;
}

export function PlanCard({ plan, destinationName, destinationSlug }: PlanCardProps) {
  const t = useTranslations('plan');
  const tHome = useTranslations('home');
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();
  const localizedData = localizeDataDisplay(plan.dataDisplay, locale);
  const onDeal = plan.originalPrice != null;

  const MIN_PURCHASE = 1.20;

  const handleAddToCart = () => {
    addItem({
      planId: plan.id,
      destinationId: plan.destinationId,
      destinationName,
      destinationSlug,
      plan,
    });
    trackAddToCart(planToGaItem(plan, destinationName));
    if (plan.price < MIN_PURCHASE) {
      toast({
        title: t('toastMinOrder'),
        description: t('toastMinDesc', {
          price: `$${plan.price.toFixed(2)}`,
          min: `$${MIN_PURCHASE.toFixed(2)}`,
        }),
        variant: 'warning',
      });
    } else {
      toast({
        title: t('toastAdded'),
        description: `${plan.dataDisplay} / ${plan.days} ${t('days')} ${t('forDestination')} ${destinationName}`,
        variant: 'success',
        duration: 9000,
        action: (
          <ToastAction asChild altText={t('toastGoToCheckout')}>
            <IntlLink href="/checkout">{t('toastGoToCheckout')}</IntlLink>
          </ToastAction>
        ),
      });
    }
  };

  return (
    <Card
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${
        onDeal
          ? 'border-amber-200/70 bg-white shadow-sm hover:shadow-amber-900/10'
          : `border-emerald-100/80 hover:shadow-emerald-900/5 ${
              plan.popular
                ? 'ring-2 ring-primary/30 bg-gradient-to-br from-white to-emerald-50/50 shadow-md'
                : 'bg-white shadow-sm'
            }`
      }`}
    >
      {/* Micro-reflection on hover: gradient + refracted Sim2Me icon */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 scale-110 scale-x-[1.12] skew-y-[-2deg] opacity-[0.07]">
          <Sim2MeIcon size={56} variant="default" />
        </div>
      </div>

      {/*
        One strip per card. A plan on a hot deal wears the deal's own ribbon — the same amber-to-
        orange band the homepage uses — because the discount is the stronger message and two stacked
        banners would compete. The floating badge is suppressed with it: it would repeat the very
        percentage the ribbon is already showing.
      */}
      {onDeal ? (
        <div className="relative flex items-center justify-between gap-2 rounded-t-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm">
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5" />
            {plan.saleBadge}
          </span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
            {tHome('hotDealsEndsToday')}
          </span>
        </div>
      ) : plan.popular ? (
        <div className="relative flex items-center justify-center gap-1.5 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-center text-xs font-semibold text-white shadow-sm">
          <IconSpark />
          <span>{t('badgeBestSeller')}</span>
        </div>
      ) : null}
      {plan.saleBadge && !onDeal && (
        <span className={`absolute end-2 z-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md ${plan.popular ? 'top-11' : 'top-2'}`}>
          {plan.saleBadge}
        </span>
      )}
      <CardContent className="relative flex-1 p-6">
        <div className="relative z-10 flex items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div>
            <p className="text-xl font-bold text-gray-700">
              {localizedData} · {plan.days} {t('days')}
            </p>
            <DataUsageModal />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold ${plan.originalPrice ? 'text-emerald-600' : 'text-gray-700'}`}>
                {formatPrice(plan.price, plan.currency)}
              </span>
              {/* Only ever rendered when the price above it is genuinely discounted */}
              {plan.originalPrice != null && (
                <span className="text-sm font-medium text-gray-400 line-through">
                  {formatPrice(plan.originalPrice, plan.currency)}
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="relative z-10 mt-5 flex items-center gap-2">
          <ul className="flex-1 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-purple-100 p-1.5 text-purple-600" aria-hidden>
                <IconData />
              </span>
              <span className="font-medium text-foreground">{t('data')}:</span> {localizedData}
              <InfoTooltip content={t('dataTooltip')} />
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-100 p-1.5 text-amber-600" aria-hidden>
                <IconValidity />
              </span>
              <span className="font-medium text-foreground">{t('validity')}:</span> {plan.days} {t('days')}
              <InfoTooltip content={t('validityTooltip')} />
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-100 p-1.5 text-emerald-600" aria-hidden>
                <IconNetwork />
              </span>
              <span className="font-medium text-foreground">{t('network')}:</span> {plan.networkType}
              {plan.networkType === '5G' && (
                <span className="ms-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">5G</span>
              )}
              <InfoTooltip content={t('networkTooltip')} />
            </li>
            {plan.tethering && (
              <li className="flex items-center gap-2">
                <span className="font-medium text-foreground">{t('tethering')}:</span> {t('yes')}
                <InfoTooltip content={t('tetheringTooltip')} />
              </li>
            )}
            {plan.topUps && (
              <li className="flex items-center gap-2">
                <span className="font-medium text-foreground">{t('topUps')}:</span> {t('available')}
                <InfoTooltip content={t('topUpsTooltip')} />
              </li>
            )}
          </ul>
          <div className="shrink-0 self-stretch flex items-center justify-center w-[30%] min-w-[80px] max-w-[110px]">
            <BrandGlobeWaves />
          </div>
        </div>
      </CardContent>
      <CardFooter className="relative flex gap-2 p-6 pt-0">
        <Button
          className="flex-1 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)] hover:shadow-[inset_0_0_16px_rgba(16,185,129,0.22)]"
          onClick={handleAddToCart}
        >
          {t('addToCart')}
        </Button>
        <IntlLink href={`/destinations/${destinationSlug}/plan/${plan.id}`}>
          <Button variant="outline" className="rounded-xl">{t('viewDetails')}</Button>
        </IntlLink>
      </CardFooter>
    </Card>
  );
}
