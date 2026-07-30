'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import type { Plan } from '@/types';
import { formatPrice } from '@/lib/utils';
import { translatePlanName } from '@/lib/translate-plan-name';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { planToGaItem, trackAddToCart, trackViewItemList } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Flame, ShoppingCart, ArrowRight } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

interface HotDeal {
  id: string;
  packageCode: string;
  name: string;
  locationCode: string;
  flagCode: string;
  volume: number;
  duration: number;
  speed: string;
  topUp: boolean;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  currency: string;
  endsAt: string;
}

function volumeToDisplay(volumeBytes: number): { dataDisplay: string; dataAmountMb: number } {
  if (volumeBytes < 0) return { dataDisplay: 'Unlimited', dataAmountMb: -1 };
  const gb = volumeBytes / (1024 * 1024 * 1024);
  const mb = volumeBytes / (1024 * 1024);
  return {
    dataDisplay: gb >= 1 ? `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB` : `${mb.toFixed(0)} MB`,
    dataAmountMb: mb,
  };
}

function localizedCountryName(isoCode: string, fallback: string, locale: string): string {
  if (isoCode.length !== 2) return fallback;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode) || fallback;
  } catch {
    return fallback;
  }
}

function dealToPlan(deal: HotDeal, locale: string): Plan {
  const { dataDisplay, dataAmountMb } = volumeToDisplay(deal.volume);
  return {
    id: deal.packageCode,
    destinationId: deal.locationCode.toLowerCase(),
    name: translatePlanName(deal.name, deal.name, deal.locationCode, deal.locationCode.length > 2, locale),
    dataAmount: dataAmountMb,
    dataDisplay,
    days: deal.duration,
    price: deal.dealPrice,
    currency: deal.currency,
    networkType: deal.speed?.includes('5G') ? '5G' : '4G',
    speed: deal.speed,
    tethering: true,
    topUps: deal.topUp,
    operatorName: deal.speed || 'eSIMaccess',
    saleBadge: `-${deal.discountPercent}%`,
  };
}

async function fetchDeals(): Promise<HotDeal[]> {
  const res = await fetch('/api/hot-deals');
  if (!res.ok) return [];
  const data = await res.json();
  return data.deals ?? [];
}

function DealCard({ deal }: { deal: HotDeal }) {
  const t = useTranslations('home');
  const tPlan = useTranslations('plan');
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  const countryName = localizedCountryName(deal.locationCode, deal.name, locale);
  const slug = deal.locationCode.toLowerCase();
  const { dataDisplay } = volumeToDisplay(deal.volume);

  const handleAdd = () => {
    const plan = dealToPlan(deal, locale);
    addItem({
      planId: plan.id,
      destinationId: plan.destinationId,
      destinationName: countryName,
      destinationSlug: slug,
      plan,
    });
    trackAddToCart(planToGaItem(plan, countryName));
    toast({
      title: tPlan('toastAdded'),
      description: `${dataDisplay} / ${deal.duration} ${tPlan('days')} ${tPlan('forDestination')} ${countryName}`,
      variant: 'success',
    });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-900/10">
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
          {deal.duration > 0 && (
            <span className="ms-auto rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-100">
              {formatPrice(deal.dealPrice / deal.duration, deal.currency)} {t('hotDealsPerDay')}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button className="flex-1 gap-1.5" onClick={handleAdd}>
            <ShoppingCart className="h-4 w-4" />
            {t('hotDealsAddToCart')}
          </Button>
          <IntlLink
            href={`/destinations/${slug}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-3 text-gray-500 transition-colors hover:border-emerald-300 hover:text-emerald-700"
            aria-label={t('hotDealsViewAll', { destination: countryName })}
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </IntlLink>
        </div>
      </div>
    </div>
  );
}

export function HotDealsSection() {
  const t = useTranslations('home');
  const locale = useLocale();
  const { data: deals = [] } = useQuery({
    queryKey: ['hot-deals'],
    queryFn: fetchDeals,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (deals.length === 0) return;
    trackViewItemList(
      'hot_deals',
      deals.map((d) => planToGaItem(dealToPlan(d, locale), localizedCountryName(d.locationCode, d.name, locale)))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals.length]);

  if (deals.length === 0) return null;

  return (
    <section id="hot-deals" className="relative scroll-mt-24 bg-gradient-to-b from-amber-50/60 to-white py-14 sm:py-16">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            <Flame className="h-3 w-3" />
            {t('hotDealsEndsToday')}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t('hotDealsTitle')}
          </h2>
          <p className="mt-2 text-muted-foreground">{t('hotDealsSubtitle')}</p>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deals.slice(0, 3).map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    </section>
  );
}
