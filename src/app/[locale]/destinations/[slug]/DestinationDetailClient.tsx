'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useCallback } from 'react';
import type { Destination, Plan } from '@/types';
import { PlanCard } from '@/components/sections/PlanCard';
import { X, SlidersHorizontal, ArrowUpDown, Zap, Wifi, Database, Clock, DollarSign, LayoutGrid, Info, BarChart2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DataUsageCalculator } from '@/components/sections/DataUsageCalculator';

/* ─── Filter preset keys (labels come from t()) ──────────────── */
const DATA_PRESET_KEYS = ['filterAny', 'filter1GB', 'filter3GB', 'filter5GB', 'filter10GB', 'filter20GB'] as const;
const DATA_PRESET_MB = [0, 1024, 3072, 5120, 10240, 20480];

const DAYS_PRESET_KEYS = ['filterAny', 'filter7Days', 'filter14Days', 'filter30Days'] as const;
const DAYS_PRESET_DAYS = [0, 7, 14, 30];

const PRICE_PRESET_KEYS = ['anyPrice', 'filterUnder10', 'filter10to25', 'filter25to50', 'filter50Plus'] as const;
const PRICE_PRESET_CONFIG = [
  { max: Infinity },
  { max: 10 },
  { min: 10, max: 25 },
  { min: 25, max: 50 },
  { min: 50, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'price_asc' as const, key: 'sortPriceLow' },
  { value: 'price_desc' as const, key: 'sortPriceHigh' },
  { value: 'data_desc' as const, key: 'sortData' },
  { value: 'days_desc' as const, key: 'sortDays' },
  { value: 'popular' as const, key: 'sortPopular' },
] as const;

type NetworkFilter = 'all' | '4G' | '5G';
type SortKey = 'price_asc' | 'price_desc' | 'data_desc' | 'days_desc' | 'popular';

/* ─── Pill button ────────────────────────────────────────────── */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

/* ─── Compact filter slider with live value badge ────────────── */
function FilterSlider({ value, max, onChange, valueLabel }: {
  value: number; max: number; onChange: (v: number) => void; valueLabel: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-2.5 max-w-[260px]">
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-emerald-600 cursor-pointer"
      />
      <span className="shrink-0 min-w-[54px] text-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 whitespace-nowrap">
        {valueLabel}
      </span>
    </div>
  );
}

/* ─── Simple info popover (click-based, works on mobile) ──────── */
function FilterInfo({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 start-0 top-6 w-64 rounded-xl border border-emerald-100 bg-white shadow-xl p-3.5">
            {title && <p className="text-xs font-bold text-gray-800 mb-1.5">{title}</p>}
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 end-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </>
      )}
    </div>
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
  const tc = useTranslations('calculator');

  const [dataIdx, setDataIdx] = useState(0);
  const [daysIdx, setDaysIdx] = useState(0);
  const [priceIdx, setPriceIdx] = useState(0);
  const [network, setNetwork] = useState<NetworkFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('price_asc');
  const [calcNudgeOpen, setCalcNudgeOpen] = useState(false);

  /** Map weekly GB estimate from calculator → DATA_PRESET_MB index */
  const weeklyGbToDataIdx = (gb: number): number => {
    if (gb < 1)  return 0;
    if (gb < 3)  return 1;
    if (gb < 5)  return 2;
    if (gb < 10) return 3;
    if (gb < 20) return 4;
    return 5;
  };

  const handleCalcFindPlan = useCallback((weeklyGB: number) => {
    setDataIdx(weeklyGbToDataIdx(weeklyGB));
    setCalcNudgeOpen(false);
  }, []);

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
    const dataMinMB = DATA_PRESET_MB[dataIdx];
    if (dataIdx !== 0 && dataMinMB > 0) {
      list = list.filter((p) => p.dataAmount < 0 || p.dataAmount >= dataMinMB);
    }

    // Days filter
    const daysMin = DAYS_PRESET_DAYS[daysIdx];
    if (daysIdx !== 0 && daysMin > 0) {
      list = list.filter((p) => p.days >= daysMin);
    }

    // Price filter
    const priceConfig = PRICE_PRESET_CONFIG[priceIdx];
    if (priceIdx !== 0 && priceConfig) {
      const min = priceConfig.min ?? 0;
      list = list.filter((p) => p.price >= min && p.price <= priceConfig.max);
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
                  {t('from')} ${destination.fromPrice.toFixed(2)} {t('perDay')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Calculator nudge (opens popup) ─────────────────── */}
      <Dialog open={calcNudgeOpen} onOpenChange={setCalcNudgeOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <BarChart2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-xs font-medium text-gray-700">
              {tc('notSureHowMuch')}{' '}
              <span className="text-emerald-600 underline underline-offset-2 font-semibold">
                {tc('tryCalculator')}
              </span>
            </p>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl" showClose>
          <DataUsageCalculator onFindPlan={handleCalcFindPlan} />
        </DialogContent>
      </Dialog>

      {/* ─── Filter bar ─────────────────────────────────────── */}
      <div className="mt-3 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Sort row */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{t('filters')}</span>
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
                <option key={o.value} value={o.value}>{t(o.key)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data pills */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('filterDataLabel')}</span>
            {/* Data info popup */}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 transition-colors"
                  aria-label={tc('dataInfoTitle')}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-6" showClose>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tc('dataInfoTitle')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{tc('dataInfoText')}</p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                    <BarChart2 className="h-3.5 w-3.5" /> {tc('openCalculator')}
                  </p>
                  <DataUsageCalculator compact />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2">
            {DATA_PRESET_KEYS.map((key, i) => (
              <Pill key={key} active={dataIdx === i} onClick={() => setDataIdx(i)}>
                {t(key)}
              </Pill>
            ))}
          </div>
          <FilterSlider
            value={dataIdx}
            max={DATA_PRESET_KEYS.length - 1}
            onChange={setDataIdx}
            valueLabel={t(DATA_PRESET_KEYS[dataIdx])}
          />
        </div>

        {/* Days pills */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('filterDuration')}</span>
            <FilterInfo title={tc('durationInfoTitle')} content={tc('durationInfoText')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS_PRESET_KEYS.map((key, i) => (
              <Pill key={key} active={daysIdx === i} onClick={() => setDaysIdx(i)}>
                {t(key)}
              </Pill>
            ))}
          </div>
          <FilterSlider
            value={daysIdx}
            max={DAYS_PRESET_KEYS.length - 1}
            onChange={setDaysIdx}
            valueLabel={t(DAYS_PRESET_KEYS[daysIdx])}
          />
        </div>

        {/* Price pills */}
        <div className={`px-4 py-3 ${has5G ? 'border-b border-gray-100' : ''}`}>
          <div className="mb-2 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('filterPriceLabel')}</span>
            <FilterInfo title={tc('priceInfoTitle')} content={tc('priceInfoText')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRICE_PRESET_KEYS.map((key, i) => (
              <Pill key={key} active={priceIdx === i} onClick={() => setPriceIdx(i)}>
                {t(key)}
              </Pill>
            ))}
          </div>
          <FilterSlider
            value={priceIdx}
            max={PRICE_PRESET_KEYS.length - 1}
            onChange={setPriceIdx}
            valueLabel={t(PRICE_PRESET_KEYS[priceIdx])}
          />
        </div>

        {/* Network pills – only show if 5G is available */}
        {has5G && (
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('filterNetwork')}</span>
              <FilterInfo title={tc('networkInfoTitle')} content={tc('networkInfoText')} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', '4G', '5G'] as NetworkFilter[]).map((v) => (
                <Pill key={v} active={network === v} onClick={() => setNetwork(v)}>
                  {v === 'all' ? (
                    t('filterAny')
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
              <X className="h-3.5 w-3.5" /> {t('clearAllFilters')}
            </button>
          </div>
        )}
      </div>

      {/* ─── Result count ────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <strong>{plans.length}</strong> {plans.length === 1 ? t('planAvailable') : t('plansAvailable')}
          {hasActiveFilters && <span className="text-gray-400"> ({t('filtered')})</span>}
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
          <p className="mt-4 text-lg font-semibold text-gray-700">{t('noPlansMatch')}</p>
          <p className="mt-1 text-sm text-gray-400">{t('tryAdjusting')}</p>
          <button
            onClick={clearAll}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
