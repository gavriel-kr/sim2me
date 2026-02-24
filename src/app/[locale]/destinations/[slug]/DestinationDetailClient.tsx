'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useCallback } from 'react';
import type { Destination, Plan } from '@/types';
import { PlanCard } from '@/components/sections/PlanCard';
import { X, SlidersHorizontal, ArrowUpDown, Zap, Wifi, Database, Clock, DollarSign, LayoutGrid } from 'lucide-react';

/* ─── Filter presets ────────────────────────────────────────── */
const DATA_PRESETS = [
  { label: 'Any', minMB: 0 },
  { label: '1 GB+', minMB: 1024 },
  { label: '3 GB+', minMB: 3072 },
  { label: '5 GB+', minMB: 5120 },
  { label: '10 GB+', minMB: 10240 },
  { label: '20 GB+', minMB: 20480 },
];

const DAYS_PRESETS = [
  { label: 'Any', minDays: 0 },
  { label: '7+ days', minDays: 7 },
  { label: '14+ days', minDays: 14 },
  { label: '30+ days', minDays: 30 },
];

const PRICE_PRESETS = [
  { label: 'Any price', max: Infinity },
  { label: 'Under $10', max: 10 },
  { label: '$10–$25', min: 10, max: 25 },
  { label: '$25–$50', min: 25, max: 50 },
  { label: '$50+', min: 50, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'data_desc', label: 'Most Data' },
  { value: 'days_desc', label: 'Longest Duration' },
  { value: 'popular', label: 'Most Popular' },
];

type NetworkFilter = 'all' | '4G' | '5G';
type SortKey = 'price_asc' | 'price_desc' | 'data_desc' | 'days_desc' | 'popular';

/* ─── Pill button component ─────────────────────────────────── */
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
        active
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
      }`}
    >
      {children}
    </button>
  );
}

interface DestinationDetailClientProps {
  destination: Destination;
  initialPlans: Plan[];
}

export function DestinationDetailClient({
  destination,
  initialPlans,
}: DestinationDetailClientProps) {
  const t = useTranslations('destinations');

  const [dataIdx, setDataIdx] = useState(0);
  const [daysIdx, setDaysIdx] = useState(0);
  const [priceIdx, setPriceIdx] = useState(0);
  const [network, setNetwork] = useState<NetworkFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('price_asc');

  const clearAll = useCallback(() => {
    setDataIdx(0);
    setDaysIdx(0);
    setPriceIdx(0);
    setNetwork('all');
    setSortBy('price_asc');
  }, []);

  const hasActiveFilters = dataIdx !== 0 || daysIdx !== 0 || priceIdx !== 0 || network !== 'all';

  const plans = useMemo(() => {
    let list = [...initialPlans];

    // Data filter
    const dataPreset = DATA_PRESETS[dataIdx];
    if (dataIdx !== 0 && dataPreset) {
      list = list.filter((p) => p.dataAmount < 0 || p.dataAmount >= dataPreset.minMB);
    }

    // Days filter
    const daysPreset = DAYS_PRESETS[daysIdx];
    if (daysIdx !== 0 && daysPreset) {
      list = list.filter((p) => p.days >= daysPreset.minDays);
    }

    // Price filter
    const pricePreset = PRICE_PRESETS[priceIdx];
    if (priceIdx !== 0 && pricePreset) {
      const min = pricePreset.min ?? 0;
      list = list.filter((p) => p.price >= min && p.price <= pricePreset.max);
    }

    // Network filter
    if (network !== 'all') {
      list = list.filter((p) => p.networkType === network);
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'data_desc':
        list.sort((a, b) => b.dataAmount - a.dataAmount);
        break;
      case 'days_desc':
        list.sort((a, b) => b.days - a.days);
        break;
      case 'popular':
        list.sort((a, b) => (a.popular === b.popular ? 0 : a.popular ? -1 : 1));
        break;
    }

    return list;
  }, [initialPlans, dataIdx, daysIdx, priceIdx, network, sortBy]);

  const has5G = useMemo(() => initialPlans.some((p) => p.networkType === '5G'), [initialPlans]);

  return (
    <div className="container px-4 py-8">
      {/* ─── Country header ──────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <img
          src={destination.flagUrl}
          alt={destination.name}
          className="h-16 w-24 rounded-xl object-cover shadow-md ring-1 ring-black/10"
        />
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{destination.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <LayoutGrid className="h-3.5 w-3.5" />
              {destination.planCount} {t('plansCount')}
            </span>
            {destination.fromPrice != null && destination.fromPrice > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="font-semibold text-emerald-600">
                  {t('from')} ${destination.fromPrice.toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Filter bar ─────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Sort row */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Filters</span>
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {[dataIdx !== 0, daysIdx !== 0, priceIdx !== 0, network !== 'all'].filter(Boolean).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors hover:border-emerald-400"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data pills */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DATA_PRESETS.map((p, i) => (
              <Pill key={p.label} active={dataIdx === i} onClick={() => setDataIdx(i)}>
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Days pills */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS_PRESETS.map((p, i) => (
              <Pill key={p.label} active={daysIdx === i} onClick={() => setDaysIdx(i)}>
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Price pills */}
        <div className={`px-4 py-3 ${has5G ? 'border-b border-gray-100' : ''}`}>
          <div className="mb-2 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRICE_PRESETS.map((p, i) => (
              <Pill key={p.label} active={priceIdx === i} onClick={() => setPriceIdx(i)}>
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Network pills – only show if 5G is available */}
        {has5G && (
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Network</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', '4G', '5G'] as NetworkFilter[]).map((v) => (
                <Pill key={v} active={network === v} onClick={() => setNetwork(v)}>
                  {v === 'all' ? (
                    'Any'
                  ) : v === '5G' ? (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" /> 5G
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Wifi className="h-3 w-3" /> 4G
                    </span>
                  )}
                </Pill>
              ))}
            </div>
          </div>
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <div className="flex justify-end border-t border-gray-100 px-4 py-2">
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ─── Result count ────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <strong>{plans.length}</strong> {plans.length === 1 ? 'plan' : 'plans'} available
          {hasActiveFilters && <span className="text-gray-400"> (filtered)</span>}
        </p>
      </div>

      {/* ─── Plans grid ──────────────────────────────────────── */}
      <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            destinationName={destination.name}
            destinationSlug={destination.slug}
          />
        ))}
      </div>

      {/* ─── Empty state ─────────────────────────────────────── */}
      {plans.length === 0 && (
        <div className="py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <SlidersHorizontal className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-700">No plans match your filters</p>
          <p className="mt-1 text-sm text-gray-400">Try adjusting or clearing the filters above</p>
          <button
            onClick={clearAll}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
