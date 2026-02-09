'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search, Globe, MapPin, SlidersHorizontal,
  ChevronDown, X, Wifi, Zap,
} from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

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

const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: Infinity },
  { label: 'Under $5', min: 0, max: 5 },
  { label: '$5 - $15', min: 5, max: 15 },
  { label: '$15 - $30', min: 15, max: 30 },
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

export function DestinationsClient() {
  const t = useTranslations('destinations');

  // Filters
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'countries' | 'regions'>('countries');
  const [showFilters, setShowFilters] = useState(false);
  const [continent, setContinent] = useState('all');
  const [priceRange, setPriceRange] = useState(0);
  const [dataRange, setDataRange] = useState(0);
  const [speedFilter, setSpeedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'plans' | 'data'>('name');

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

  // Derived data
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (continent !== 'all') count++;
    if (priceRange !== 0) count++;
    if (dataRange !== 0) count++;
    if (speedFilter !== 'all') count++;
    return count;
  }, [continent, priceRange, dataRange, speedFilter]);

  // Filtered & sorted destinations
  const filtered = useMemo(() => {
    let list = destinations;

    // Tab filter
    if (tab === 'countries') list = list.filter((d) => !d.isRegional);
    if (tab === 'regions') list = list.filter((d) => d.isRegional);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.slug.includes(q));
    }

    // Continent
    if (continent !== 'all') {
      list = list.filter((d) => d.continent === continent);
    }

    // Price range
    const pr = PRICE_RANGES[priceRange];
    if (pr && pr.min > 0) {
      list = list.filter((d) => d.fromPrice >= pr.min && d.fromPrice < pr.max);
    } else if (pr && pr.max < Infinity) {
      list = list.filter((d) => d.fromPrice < pr.max);
    }

    // Data range
    const dr = DATA_RANGES[dataRange];
    if (dr && dr.min > 0) {
      list = list.filter((d) => d.maxDataMB >= dr.min);
    }

    // Speed
    if (speedFilter !== 'all') {
      list = list.filter((d) => d.speeds.includes(speedFilter));
    }

    // Sort
    switch (sortBy) {
      case 'price':
        list = [...list].sort((a, b) => a.fromPrice - b.fromPrice);
        break;
      case 'plans':
        list = [...list].sort((a, b) => b.planCount - a.planCount);
        break;
      case 'data':
        list = [...list].sort((a, b) => b.maxDataMB - a.maxDataMB);
        break;
      default:
        list = [...list].sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
    }
    return list;
  }, [destinations, search, tab, continent, priceRange, dataRange, speedFilter, sortBy]);

  const clearFilters = () => {
    setContinent('all');
    setPriceRange(0);
    setDataRange(0);
    setSpeedFilter('all');
    setSortBy('name');
    setSearch('');
  };

  const getFlagUrl = useCallback(
    (flagCode: string) => `https://flagcdn.com/w80/${flagCode}.png`,
    []
  );

  // ─── Loading skeleton ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
          </div>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search destinations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
      </div>

      {/* ─── Tabs + Filter toggle ─────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(['countries', 'regions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'countries' && `Countries (${countryCount})`}
            {t === 'regions' && `Regions (${regionCount})`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Filter panel ─────────────────────────────────────── */}
      {showFilters && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-in slide-in-from-top-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Continent */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Continent
              </label>
              <div className="relative">
                <select
                  value={continent}
                  onChange={(e) => setContinent(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All continents</option>
                  {continents.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Price range
              </label>
              <div className="relative">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {PRICE_RANGES.map((r, i) => (
                    <option key={i} value={i}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Data size */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Data size
              </label>
              <div className="relative">
                <select
                  value={dataRange}
                  onChange={(e) => setDataRange(Number(e.target.value))}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {DATA_RANGES.map((r, i) => (
                    <option key={i} value={i}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Speed */}
            {allSpeeds.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Speed
                </label>
                <div className="relative">
                  <select
                    value={speedFilter}
                    onChange={(e) => setSpeedFilter(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="all">Any speed</option>
                    {allSpeeds.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                Sort by
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price">Lowest price</option>
                  <option value="plans">Most plans</option>
                  <option value="data">Most data</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Active filters & clear */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-500">{activeFilterCount} filter(s) active</span>
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Count ────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          <MapPin className="inline h-4 w-4 mr-1" />
          {filtered.length} destinations available
        </p>
      )}

      {/* ─── Destinations grid ────────────────────────────────── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((d) => (
          <IntlLink key={d.id} href={`/destinations/${d.slug}`}>
            <Card className="group h-full transition-all hover:shadow-lg hover:-translate-y-0.5 border-gray-200/80">
              <CardContent className="flex items-center gap-4 p-4">
                {d.isRegional ? (
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-100 shadow-sm">
                    <Globe className="h-6 w-6 text-emerald-600" />
                  </div>
                ) : (
                  <img
                    src={getFlagUrl(d.flagCode)}
                    alt={d.name}
                    className="h-12 w-16 shrink-0 rounded-lg object-cover shadow-sm"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                      {d.name}
                    </span>
                    {d.featured && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {t('popular')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-sm text-muted-foreground">
                      {d.planCount} {t('plansCount')}
                    </p>
                    {d.fromPrice > 0 && (
                      <span className="text-xs font-semibold text-emerald-600">
                        from ${d.fromPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {d.speeds.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {d.speeds.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                        >
                          {s.includes('5G') ? <Zap className="h-2.5 w-2.5" /> : <Wifi className="h-2.5 w-2.5" />}
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </IntlLink>
        ))}
      </div>

      {/* ─── Empty state ──────────────────────────────────────── */}
      {filtered.length === 0 && !isLoading && (
        <div className="py-16 text-center">
          <Globe className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">No destinations found</p>
          <p className="mt-1 text-sm text-gray-400">Try a different search or filter</p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
