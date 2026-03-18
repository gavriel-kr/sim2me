'use client';

import { useTranslations } from 'next-intl';
import type { Destination, Plan } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { brandConfig } from '@/config/brand';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

function IconOperator() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function IconNetworkType() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M2 8a16 16 0 0 1 20 0" />
      <path d="M5 12a11 11 0 0 1 14 0" />
      <path d="M8.5 16a6 6 0 0 1 7 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTethering() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10 6h4" />
      <path d="M3 10a9 9 0 0 1 3-2.5M21 10a9 9 0 0 0-3-2.5" />
    </svg>
  );
}

function IconTopUps() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M12 5v14M5 12h14" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

interface PlanDetailClientProps {
  destination: Destination;
  plan: Plan;
}

export function PlanDetailClient({ destination, plan }: PlanDetailClientProps) {
  const t = useTranslations('plan');
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  const MIN_PURCHASE = 1.20;

  const handleAddToCart = () => {
    addItem({
      planId: plan.id,
      destinationId: plan.destinationId,
      destinationName: destination.name,
      destinationSlug: destination.slug,
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
        description: `${plan.dataDisplay} / ${plan.days} ${t('days')} ${t('forDestination')} ${destination.name}`,
        variant: 'success',
      });
    }
  };

  return (
    <div className="container px-4 py-8">
      <IntlLink
        href={`/destinations/${destination.slug}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        ← {t('backTo')}{destination.name}
      </IntlLink>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Left: Sticky CTA / Price card */}
        <div className="lg:order-1">
          <div className="lg:sticky lg:top-24">
            <Card className="rounded-2xl border border-emerald-100/80 shadow-lg">
              <CardContent className="p-6">
                <div className="text-2xl font-bold sm:text-3xl">
                  {formatPrice(plan.price, plan.currency)}
                </div>
                {plan.days > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPrice(plan.price / plan.days, plan.currency)} {t('perDay')}
                  </p>
                )}
                <Button
                  className="mt-6 w-full rounded-xl shadow-[inset_0_0_12px_rgba(16,185,129,0.15)] hover:shadow-[inset_0_0_16px_rgba(16,185,129,0.22)]"
                  size="lg"
                  onClick={handleAddToCart}
                >
                  {t('addToCart')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Description + watermark background */}
        <div className="relative min-h-[320px] lg:order-2 lg:col-span-2">
          {/* Grand watermark: full Sim2Me logo, ~10% opacity, warm diffused */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl"
            aria-hidden
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.10] select-none">
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/logo.png"
                  alt=""
                  className="h-20 w-20 object-contain drop-shadow-sm"
                  style={{ filter: 'sepia(0.15) brightness(0.97)' }}
                />
                <span
                  className="text-2xl font-extrabold tracking-tight text-emerald-900/90"
                  style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
                >
                  {brandConfig.name}
                </span>
              </div>
            </div>
          </div>

          <Card className="relative rounded-2xl border border-emerald-100/80 bg-white/95 shadow-sm backdrop-blur-sm">
            <CardContent className="relative p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{plan.name}</h1>
                {plan.popular && <Badge>{plan.networkType}</Badge>}
                {plan.networkType === '5G' && (
                  <Badge variant="secondary">5G</Badge>
                )}
              </div>
              <p className="mt-2 text-muted-foreground">{plan.operatorName}</p>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('data')}</dt>
                  <dd className="font-medium">{plan.dataDisplay}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-sm text-muted-foreground">
                    {t('validity')}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help hover:text-emerald-600 transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="border-emerald-100 bg-emerald-50/95 text-gray-800">
                        <p>{t('validityTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </dt>
                  <dd className="font-medium">{plan.days} {t('days')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('network')}</dt>
                  <dd className="font-medium">{plan.networkType}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-sm text-muted-foreground">
                    {t('tethering')}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help hover:text-emerald-600 transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="border-emerald-100 bg-emerald-50/95 text-gray-800">
                        <p>{t('tetheringTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </dt>
                  <dd className="font-medium">{plan.tethering ? t('yes') : t('no')}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-sm text-muted-foreground">
                    {t('topUps')}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help hover:text-emerald-600 transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="border-emerald-100 bg-emerald-50/95 text-gray-800">
                        <p>{t('topUpsTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </dt>
                  <dd className="font-medium">{plan.topUps ? t('available') : t('no')}</dd>
                </div>
              </dl>

              {/* Coverage: clear text guidance instead of an illustrative map */}
              <div className="mt-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-6">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  {t('coverageTitle')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help text-muted-foreground hover:text-emerald-600 transition-colors" aria-label={t('coverageInfoAria')}>
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] border-emerald-100 bg-emerald-50/95 text-gray-800">
                      <p>{t('coverageTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </p>
                <div className="rounded-2xl bg-white/70 p-5 backdrop-blur-sm">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      {t('coverageLine1', { destination: destination.name })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('coverageLine2')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('coverageLine3')}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-sm">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <IconOperator />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-muted-foreground">{t('coverageOperatorLabel')}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-help text-muted-foreground hover:text-emerald-600 transition-colors" aria-label={t('coverageOperatorInfoAria')}>
                                <Info className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px] border-emerald-100 bg-emerald-50/95 text-gray-800">
                              <p>{t('coverageOperatorTooltip')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground">{plan.operatorName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-sm">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <IconNetworkType />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-muted-foreground">{t('coverageNetworkTypeLabel')}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-help text-muted-foreground hover:text-emerald-600 transition-colors" aria-label={t('coverageNetworkTypeInfoAria')}>
                                <Info className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px] border-emerald-100 bg-emerald-50/95 text-gray-800">
                              <p>{t('coverageNetworkTypeTooltip')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground">{plan.networkType}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-sm">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <IconTethering />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-muted-foreground">{t('coverageTetheringLabel')}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-help text-muted-foreground hover:text-emerald-600 transition-colors" aria-label={t('coverageTetheringInfoAria')}>
                                <Info className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px] border-emerald-100 bg-emerald-50/95 text-gray-800">
                              <p>{t('coverageTetheringTooltip')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground">{plan.tethering ? t('yes') : t('no')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-sm">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <IconTopUps />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-muted-foreground">{t('coverageTopUpsLabel')}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-help text-muted-foreground hover:text-emerald-600 transition-colors" aria-label={t('coverageTopUpsInfoAria')}>
                                <Info className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px] border-emerald-100 bg-emerald-50/95 text-gray-800">
                              <p>{t('coverageTopUpsTooltip')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground">{plan.topUps ? t('available') : t('no')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
