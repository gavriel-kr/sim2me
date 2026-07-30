'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Destination, Plan } from '@/types';
import { PlanCard } from '@/components/sections/PlanCard';
import { CuratedTierCard } from '@/components/sections/CuratedTierCard';
import { buildTiers } from '@/lib/plan-curation';
import { planToGaItem, trackViewItemList } from '@/lib/analytics';
import { X, SlidersHorizontal, ArrowUpDown, Zap, Wifi, Database, Clock, DollarSign, LayoutGrid, Info, BarChart2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DataUsageCalculator } from '@/components/sections/DataUsageCalculator';

/* ─── Filter presets (pills) + continuous slider ranges ──────── */
const DATA_MAX_GB = 20;
const DATA_PILLS = [
  { key: 'filterAny' as const, gb: 0 },
  { key: 'filter1GB' as const, gb: 1 },
  { key: 'filter3GB' as const, gb: 3 },
  { key: 'filter5GB' as const, gb: 5 },
  { key: 'filter10GB' as const, gb: 10 },
  { key: 'filter20GB' as const, gb: 20 },
];

const DAYS_MAX = 30;
const DAYS_PILLS = [
  { key: 'filterAny' as const, days: 0 },
  { key: 'filter7Days' as const, days: 7 },
  { key: 'filter14Days' as const, days: 14 },
  { key: 'filter30Days' as const, days: 30 },
];

/** Price slider: 0 = any, 1–50 = up to $N, 51 = $50+ (min $50) */
const PRICE_SLIDER_MAX = 51;
const PRICE_PLUS = 51;
const PRICE_PILLS = [
  { key: 'anyPrice' as const, value: 0 },
  { key: 'filterUnder10' as const, value: 10 },
  { key: 'filter10to25' as const, value: 25 },
  { key: 'filter25to50' as const, value: 50 },
  { key: 'filter50Plus' as const, value: PRICE_PLUS },
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

type PillAccent = 'blue' | 'amber' | 'emerald' | 'purple';

const PILL_ACCENTS: Record<PillAccent, { active: string; idle: string }> = {
  blue:    { active: 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200',       idle: 'bg-white/80 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700' },
  amber:   { active: 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200',   idle: 'bg-white/80 text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700' },
  emerald: { active: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200', idle: 'bg-white/80 text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700' },
  purple:  { active: 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-200', idle: 'bg-white/80 text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700' },
};

/* ─── Pill button ──────────────────────────────────────────────── */
function Pill({ active, onClick, children, accent = 'emerald' }: {
  active: boolean; onClick: () => void; children: React.ReactNode; accent?: PillAccent;
}) {
  const a = PILL_ACCENTS[accent];
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${active ? a.active : a.idle}`}
    >
      {children}
    </button>
  );
}

const SLIDER_ACCENTS: Record<PillAccent, { track: string; badge: string }> = {
  purple:  { track: 'accent-purple-400',  badge: 'text-purple-700 bg-purple-50 border-purple-200' },
  amber:   { track: 'accent-amber-300',   badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  blue:    { track: 'accent-blue-400',    badge: 'text-blue-700 bg-blue-50 border-blue-200' },
  emerald: { track: 'accent-emerald-400', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
};

/* ─── Compact filter slider with live value badge ────────────── */
function FilterSlider({ value, max, onChange, valueLabel, accent = 'emerald' }: {
  value: number; max: number; onChange: (v: number) => void; valueLabel: string; accent?: PillAccent;
}) {
  const s = SLIDER_ACCENTS[accent];
  return (
    <div className="mt-2 flex items-center gap-2.5 max-w-[260px]">
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`flex-1 h-1.5 ${s.track} cursor-pointer`}
      />
      <span className={`shrink-0 min-w-[72px] text-center text-xs font-semibold border rounded-md px-2 py-0.5 whitespace-nowrap ${s.badge}`}>
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
          <div className="absolute z-50 start-0 top-6 w-64 rounded-2xl border border-emerald-100 bg-white shadow-xl p-3.5">
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

  // Smart shelf (ticket 023): curated trip-intent tiers, full catalog behind a toggle
  const curatedTiers = useMemo(() => buildTiers(initialPlans), [initialPlans]);
  const canCurate = curatedTiers.length >= 3;
  const [viewMode, setViewMode] = useState<'curated' | 'all'>(canCurate ? 'curated' : 'all');

  const [minDataGB, setMinDataGB] = useState(0);
  const [minDays, setMinDays] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [network, setNetwork] = useState<NetworkFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('price_asc');
  const [calcNudgeOpen, setCalcNudgeOpen] = useState(false);

  /** Map weekly GB estimate from calculator → continuous GB filter */
  const weeklyGbToMinData = (gb: number): number => {
    if (gb < 1) return 0;
    return Math.min(DATA_MAX_GB, Math.ceil(gb));
  };

  const handleCalcFindPlan = useCallback((weeklyGB: number) => {
    setMinDataGB(weeklyGbToMinData(weeklyGB));
    setCalcNudgeOpen(false);
  }, []);

  const clearAll = useCallback(() => {
    setMinDataGB(0);
    setMinDays(0);
    setPriceMax(0);
    setNetwork('all');
    setSortBy('price_asc');
  }, []);

  const hasActiveFilters = minDataGB !== 0 || minDays !== 0 || priceMax !== 0 || network !== 'all';

  const dataValueLabel = minDataGB === 0 ? t('filterAny') : t('filterGbPlus', { gb: minDataGB });
  const daysValueLabel = minDays === 0 ? t('filterAny') : t('filterDaysPlus', { days: minDays });
  const priceValueLabel =
    priceMax === 0 ? t('anyPrice')
    : priceMax === PRICE_PLUS ? t('filter50Plus')
    : t('filterUpToPrice', { price: priceMax });

  const plans = useMemo(() => {
    let list = [...initialPlans];

    // Data filter (min GB)
    if (minDataGB > 0) {
      const dataMinMB = minDataGB * 1024;
      list = list.filter((p) => p.dataAmount < 0 || p.dataAmount >= dataMinMB);
    }

    // Days filter (min days)
    if (minDays > 0) {
      list = list.filter((p) => p.days >= minDays);
    }

    // Price filter: 1–50 = up to $N; 51 = $50+
    if (priceMax === PRICE_PLUS) {
      list = list.filter((p) => p.price >= 50);
    } else if (priceMax > 0) {
      list = list.filter((p) => p.price <= priceMax);
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
  }, [initialPlans, minDataGB, minDays, priceMax, network, sortBy]);

  const has5G = useMemo(() => initialPlans.some((p) => p.networkType === '5G'), [initialPlans]);

  useEffect(() => {
    const listPlans = viewMode === 'curated' ? curatedTiers.map((ti) => ti.plan) : initialPlans;
    trackViewItemList(`${viewMode}:${destination.slug}`, listPlans.map((p) => planToGaItem(p, destination.name)));
    // fire once per destination page view and per view-mode switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.slug, viewMode]);

  return (
    <div className="container px-4 py-8">
      {/* ─── Country header ──────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <img
          src={destination.flagUrl}
          alt={destination.name}
          className="h-16 w-24 rounded-2xl object-cover shadow-md ring-1 ring-black/10"
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
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100 cursor-pointer"
          >
            <BarChart2 className="h-4 w-4 text-gray-400 shrink-0" />
            <p className="text-xs font-medium text-gray-700">
              {tc('notSureHowMuch')}{' '}
              <span className="text-emerald-600 underline underline-offset-2 font-semibold">
                {tc('tryCalculator')}
              </span>
            </p>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-3xl" showClose>
          <DataUsageCalculator onFindPlan={handleCalcFindPlan} />
        </DialogContent>
      </Dialog>

      {/* ─── Smart shelf: curated trip-intent tiers ─── */}
      {viewMode === 'curated' && (
        <div className="mt-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800">{t('curatedHeading')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('curatedSubtitle')}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {curatedTiers.map((tier) => (
              <CuratedTierCard
                key={tier.plan.id}
                tierKey={tier.key}
                plan={tier.plan}
                isStar={tier.isStar}
                destinationName={destination.name}
                destinationSlug={destination.slug}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setViewMode('all')}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
            >
              <LayoutGrid className="h-4 w-4" />
              {t('showAllPlans', { count: initialPlans.length })}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'all' && (
      <>
      {canCurate && (
        <div className="mt-4">
          <button
            onClick={() => setViewMode('curated')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline underline-offset-2"
          >
            {t('showCurated')}
          </button>
        </div>
      )}

      {/* ─── Filter bar (glassmorphism, highlighted) ─── */}
      <div className="relative mt-3 overflow-hidden rounded-3xl border border-emerald-100/90 bg-white/80 shadow-lg shadow-emerald-900/5 backdrop-blur-md">
        {/* Sort row */}
        <div className="relative flex items-center justify-between gap-3 border-b border-gray-100/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{t('filters')}</span>
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {[minDataGB !== 0, minDays !== 0, priceMax !== 0, network !== 'all'].filter(Boolean).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="appearance-none rounded-xl border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.key)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data pills */}
        <div className="relative border-b border-gray-100/80 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-purple-500" />
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
            {DATA_PILLS.map((pill) => (
              <Pill key={pill.key} active={minDataGB === pill.gb} onClick={() => setMinDataGB(pill.gb)} accent="purple">
                {t(pill.key)}
              </Pill>
            ))}
          </div>
          <FilterSlider
            value={minDataGB}
            max={DATA_MAX_GB}
            onChange={setMinDataGB}
            valueLabel={dataValueLabel}
            accent="purple"
          />
        </div>

        {/* Days pills */}
        <div className="relative border-b border-gray-100/80 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('filterDuration')}</span>
            <FilterInfo title={tc('durationInfoTitle')} content={tc('durationInfoText')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS_PILLS.map((pill) => (
              <Pill key={pill.key} active={minDays === pill.days} onClick={() => setMinDays(pill.days)} accent="amber">
                {t(pill.key)}
              </Pill>
            ))}
          </div>
          <FilterSlider
            value={minDays}
            max={DAYS_MAX}
            onChange={setMinDays}
            valueLabel={daysValueLabel}
            accent="amber"
          />
        </div>

        {/* Price pills */}
        <div className={`relative px-4 py-3 ${has5G ? 'border-b border-gray-100/80' : ''}`}>
          <div className="mb-2 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('filterPriceLabel')}</span>
            <FilterInfo title={tc('priceInfoTitle')} content={tc('priceInfoText')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRICE_PILLS.map((pill) => (
              <Pill key={pill.key} active={priceMax === pill.value} onClick={() => setPriceMax(pill.value)} accent="blue">
                {t(pill.key)}
              </Pill>
            ))}
          </div>
          <FilterSlider
            value={priceMax}
            max={PRICE_SLIDER_MAX}
            onChange={setPriceMax}
            valueLabel={priceValueLabel}
            accent="blue"
          />
        </div>

        {/* Network pills – only show if 5G is available */}
        {has5G && (
          <div className="relative px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('filterNetwork')}</span>
              <FilterInfo title={tc('networkInfoTitle')} content={tc('networkInfoText')} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', '4G', '5G'] as NetworkFilter[]).map((v) => (
                <Pill key={v} active={network === v} onClick={() => setNetwork(v)} accent="emerald">
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
          <div className="relative flex justify-end border-t border-gray-100/80 px-4 py-2">
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
            className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <X className="h-3.5 w-3.5" /> {t('clearFilters')}
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
}
