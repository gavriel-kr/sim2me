'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search, Globe, MapPin, X, Wifi, Zap,
  ChevronDown, ArrowUpDown, Filter, LayoutGrid,
} from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

/* ─── Types ────────────────────────────────────────────────── */
interface DestItem {
  id: string;
  name: string;
  slug: string;
  flagCode: string;
  isRegional: boolean;
  continent: string;
  planCount: number;
  fromPrice: number;
  maxDataMB: number;
  speeds: string[];
  featured: boolean;
}

/* ─── Filter presets ───────────────────────────────────────── */
const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: Infinity },
  { label: 'Under $5', min: 0, max: 5 },
  { label: '$5 – $15', min: 5, max: 15 },
  { label: '$15 – $30', min: 15, max: 30 },
  { label: '$30+', min: 30, max: Infinity },
];

const DATA_RANGES = [
  { label: 'Any data', min: 0 },
  { label: '500 MB+', min: 500 },
  { label: '1 GB+', min: 1024 },
  { label: '3 GB+', min: 3072 },
  { label: '5 GB+', min: 5120 },
  { label: '10 GB+', min: 10240 },
  { label: '20 GB+', min: 20480 },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'price', label: 'Lowest price' },
  { value: 'plans', label: 'Most plans' },
  { value: 'data', label: 'Most data' },
] as const;

/* ─── Select component (tiny) ──────────────────────────────── */
function MiniSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-lg border border-gray-200 bg-white text-sm font-medium transition-colors
          hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
          ${icon ? 'pl-8 pr-7 py-2' : 'pl-3 pr-7 py-2'}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/* ─── Active filter chip ───────────────────────────────────── */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 pl-2.5 pr-1 py-0.5 text-xs font-medium text-emerald-800 animate-in fade-in-0 zoom-in-95">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-emerald-200 transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════ */
export function DestinationsClient() {
  const t = useTranslations('destinations');
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── State ─────────────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'countries' | 'regions'>('countries');
  const [continent, setContinent] = useState('all');
  const [priceIdx, setPriceIdx] = useState(0);
  const [dataIdx, setDataIdx] = useState(0);
  const [speedFilter, setSpeedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('name');

  /* ── Data fetching ─────────────────────────────────────────── */
  const { data: destinations = [], isLoading } = useQuery<DestItem[]>({
    queryKey: ['destinations'],
    queryFn: () =>
      fetch('/api/packages')
        .then((r) => r.json())
        .then((data) =>
          (data.destinations || []).map(
            (d: {
              locationCode: string;
              name: string;
              flagCode: string;
              isRegional: boolean;
              continent: string;
              planCount: number;
              minPrice: number;
              maxDataMB: number;
              speeds: string[];
              featured: boolean;
            }) => ({
              id: d.locationCode.toLowerCase(),
              name: d.name,
              slug: d.locationCode.toLowerCase(),
              flagCode: d.flagCode,
              isRegional: d.isRegional,
              continent: d.continent || 'Other',
              planCount: d.planCount,
              fromPrice: d.minPrice,
              maxDataMB: d.maxDataMB || 0,
              speeds: d.speeds || [],
              featured: d.featured,
            })
          )
        ),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  /* ── Derived lists ─────────────────────────────────────────── */
  const continents = useMemo(() => {
    const set = new Set(destinations.map((d) => d.continent));
    return Array.from(set).sort();
  }, [destinations]);

  const allSpeeds = useMemo(() => {
    const set = new Set(destinations.flatMap((d) => d.speeds));
    return Array.from(set).sort();
  }, [destinations]);

  const regionCount = useMemo(() => destinations.filter((d) => d.isRegional).length, [destinations]);
  const countryCount = useMemo(() => destinations.filter((d) => !d.isRegional).length, [destinations]);

  /* ── Active filter tags (for chips) ────────────────────────── */
  const activeFilters = useMemo(() => {
    const tags: { key: string; label: string; clear: () => void }[] = [];
    if (search.trim()) tags.push({ key: 'search', label: `"${search.trim()}"`, clear: () => setSearch('') });
    if (continent !== 'all') tags.push({ key: 'continent', label: continent, clear: () => setContinent('all') });
    if (priceIdx !== 0) tags.push({ key: 'price', label: PRICE_RANGES[priceIdx].label, clear: () => setPriceIdx(0) });
    if (dataIdx !== 0) tags.push({ key: 'data', label: DATA_RANGES[dataIdx].label, clear: () => setDataIdx(0) });
    if (speedFilter !== 'all') tags.push({ key: 'speed', label: speedFilter, clear: () => setSpeedFilter('all') });
    return tags;
  }, [search, continent, priceIdx, dataIdx, speedFilter]);

  /* ── Unified filtering engine ──────────────────────────────── */
  const filtered = useMemo(() => {
    let list = destinations;

    // 1. Tab
    list = tab === 'countries'
      ? list.filter((d) => !d.isRegional)
      : list.filter((d) => d.isRegional);

    // 2. Search (name + slug + continent)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.slug.includes(q) ||
          d.continent.toLowerCase().includes(q)
      );
    }

    // 3. Continent
    if (continent !== 'all') {
      list = list.filter((d) => d.continent === continent);
    }

    // 4. Price
    const pr = PRICE_RANGES[priceIdx];
    if (priceIdx !== 0 && pr) {
      list = list.filter((d) => d.fromPrice >= pr.min && d.fromPrice < pr.max);
    }

    // 5. Data
    const dr = DATA_RANGES[dataIdx];
    if (dataIdx !== 0 && dr) {
      list = list.filter((d) => d.maxDataMB >= dr.min);
    }

    // 6. Speed
    if (speedFilter !== 'all') {
      list = list.filter((d) => d.speeds.includes(speedFilter));
    }

    // 7. Sort
    list = [...list];
    switch (sortBy) {
      case 'price':
        list.sort((a, b) => a.fromPrice - b.fromPrice);
        break;
      case 'plans':
        list.sort((a, b) => b.planCount - a.planCount);
        break;
      case 'data':
        list.sort((a, b) => b.maxDataMB - a.maxDataMB);
        break;
      default:
        list.sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
    }
    return list;
  }, [destinations, search, tab, continent, priceIdx, dataIdx, speedFilter, sortBy]);

  const clearAll = useCallback(() => {
    setSearch('');
    setContinent('all');
    setPriceIdx(0);
    setDataIdx(0);
    setSpeedFilter('all');
    setSortBy('name');
  }, []);

  const getFlagUrl = useCallback(
    (flagCode: string) => `https://flagcdn.com/w80/${flagCode}.png`,
    []
  );

  /* ── Keyboard shortcut: / to focus search ──────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Loading ───────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="container px-4 py-12">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="mt-6 h-12 animate-pulse rounded-xl bg-muted" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  /* ═══ Render ═══════════════════════════════════════════════════ */
  return (
    <div className="container px-4 py-8">
      {/* ─── Title ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Globe className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
      </div>
      <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>

      {/* ═══ Unified search + filter bar ═════════════════════════ */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Row 1: Search + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by country, region, or continent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm
                focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <MiniSelect
            value={sortBy}
            onChange={setSortBy}
            icon={<ArrowUpDown className="h-3.5 w-3.5" />}
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>

        {/* Row 2: Tabs + Filters (always visible, scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-gray-100 px-3 py-2.5 sm:px-4 scrollbar-hide">
          {/* Tabs */}
          {(['countries', 'regions'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all
                ${tab === v
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {v === 'countries' ? `Countries (${countryCount})` : `Regions (${regionCount})`}
            </button>
          ))}

          {/* Divider */}
          <div className="mx-1 h-5 w-px shrink-0 bg-gray-200" />

          {/* Continent */}
          <MiniSelect
            value={continent}
            onChange={setContinent}
            options={[
              { value: 'all', label: 'All continents' },
              ...continents.map((c) => ({ value: c, label: c })),
            ]}
          />

          {/* Price */}
          <MiniSelect
            value={String(priceIdx)}
            onChange={(v) => setPriceIdx(Number(v))}
            options={PRICE_RANGES.map((r, i) => ({ value: String(i), label: r.label }))}
          />

          {/* Data */}
          <MiniSelect
            value={String(dataIdx)}
            onChange={(v) => setDataIdx(Number(v))}
            options={DATA_RANGES.map((r, i) => ({ value: String(i), label: r.label }))}
          />

          {/* Speed */}
          {allSpeeds.length > 0 && (
            <MiniSelect
              value={speedFilter}
              onChange={setSpeedFilter}
              options={[
                { value: 'all', label: 'Any speed' },
                ...allSpeeds.map((s) => ({ value: s, label: s })),
              ]}
            />
          )}
        </div>

        {/* Row 3: Active filter chips (only if filters active) */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 px-3 py-2 sm:px-4">
            <Filter className="h-3 w-3 text-gray-400 shrink-0" />
            {activeFilters.map((f) => (
              <Chip key={f.key} label={f.label} onRemove={f.clear} />
            ))}
            <button
              onClick={clearAll}
              className="ml-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ─── Result count ─────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <LayoutGrid className="inline h-4 w-4 mr-1" />
          <strong>{filtered.length}</strong> {filtered.length === 1 ? 'destination' : 'destinations'}
          {activeFilters.length > 0 && <span className="text-gray-400"> (filtered)</span>}
        </p>
        {activeFilters.length > 0 && filtered.length === 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* ─── Destinations grid ────────────────────────────────── */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((d) => (
          <IntlLink key={d.id} href={`/destinations/${d.slug}`}>
            <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-gray-200/80 hover:border-emerald-200">
              <CardContent className="flex items-center gap-3.5 p-3.5">
                {d.isRegional ? (
                  <div className="flex h-11 w-[60px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-sm">
                    <Globe className="h-5 w-5 text-emerald-600" />
                  </div>
                ) : (
                  <img
                    src={getFlagUrl(d.flagCode)}
                    alt={d.name}
                    className="h-11 w-[60px] shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors text-[15px]">
                    {d.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {d.planCount} {t('plansCount')}
                    </span>
                    {d.fromPrice > 0 && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs font-bold text-emerald-600">
                          from ${d.fromPrice.toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {d.featured && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[9px] leading-none">
                        {t('popular')}
                      </Badge>
                    )}
                    {d.speeds.slice(0, 1).map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700"
                      >
                        {s.includes('5G') ? <Zap className="h-2 w-2" /> : <Wifi className="h-2 w-2" />}
                        {s}
                      </span>
                    ))}
                    <span className="text-[9px] text-gray-400">{d.continent}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </IntlLink>
        ))}
      </div>

      {/* ─── Empty state ──────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mt-5 text-lg font-semibold text-gray-700">No destinations found</p>
          <p className="mt-1 text-sm text-gray-400">Try different keywords or adjust your filters</p>
          <button
            onClick={clearAll}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
