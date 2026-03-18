'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Plan } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { DataUsageModal } from '@/components/sections/DataUsageModal';
import { Sim2MeIcon } from '@/components/icons/Sim2MeIcon';

/* Thin line icons for Data, Validity, Network */
const IconData = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);
const IconValidity = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconNetwork = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden>
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

function localizeData(dataDisplay: string, locale: string): string {
  if (locale === 'he') {
    return dataDisplay
      .replace(/\bGB\b/g, "ג'יגה")
      .replace(/\bMB\b/g, 'מגה')
      .replace(/\bUnlimited\b/gi, 'ללא הגבלה');
  }
  if (locale === 'ar') {
    return dataDisplay
      .replace(/\bGB\b/g, 'جيجا')
      .replace(/\bMB\b/g, 'ميجا')
      .replace(/\bUnlimited\b/gi, 'غير محدود');
  }
  return dataDisplay;
}

interface PlanCardProps {
  plan: Plan;
  destinationName: string;
  destinationSlug: string;
}

export function PlanCard({ plan, destinationName, destinationSlug }: PlanCardProps) {
  const t = useTranslations('plan');
  const tDest = useTranslations('destinations');
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();
  const localizedData = localizeData(plan.dataDisplay, locale);

  const MIN_PURCHASE = 1.20;

  const handleAddToCart = () => {
    addItem({
      planId: plan.id,
      destinationId: plan.destinationId,
      destinationName,
      destinationSlug,
      plan,
    });
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
      });
    }
  };

  const perDay = plan.days > 0 ? (plan.price / plan.days).toFixed(2) : plan.price;

  return (
    <Card
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-emerald-100/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-900/5 ${
        plan.popular
          ? 'ring-2 ring-primary/30 bg-gradient-to-br from-white to-emerald-50/50 shadow-md'
          : 'bg-white shadow-sm'
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

      {plan.popular && (
        <div className="relative flex items-center justify-center gap-1.5 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-center text-xs font-semibold text-white shadow-sm">
          <IconSpark />
          <span>{t('badgeBestSeller')}</span>
        </div>
      )}
      <CardContent className="relative flex-1 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-foreground ring-1 ring-emerald-100">
              {localizedData} · {plan.days} {t('days')}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-100">
              <IconNetwork />
              {plan.operatorName}
            </p>
          </div>
          <div className="text-end">
            <span className="text-2xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
            {plan.days > 0 && (
              <p className="mt-2 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
                {formatPrice(plan.price / plan.days, plan.currency)} {t('perDay')}
              </p>
            )}
          </div>
        </div>
        <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <IconData />
            <span className="font-medium text-foreground">{t('data')}:</span> {localizedData}
            <InfoTooltip content={t('dataTooltip')} />
          </li>
          <li className="flex items-center gap-2">
            <IconValidity />
            <span className="font-medium text-foreground">{t('validity')}:</span> {plan.days} {t('days')}
            <InfoTooltip content={t('validityTooltip')} />
          </li>
          <li className="flex items-center gap-2">
            <IconNetwork />
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
        <DataUsageModal />
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
