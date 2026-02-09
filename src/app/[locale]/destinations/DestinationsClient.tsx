'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, MapPin } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

interface DestItem {
  id: string;
  name: string;
  slug: string;
  flagCode: string;
  isRegional: boolean;
  planCount: number;
  fromPrice: number;
  featured: boolean;
}

export function DestinationsClient() {
  const t = useTranslations('destinations');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'countries' | 'regions'>('all');

  const { data: destinations = [], isLoading } = useQuery<DestItem[]>({
    queryKey: ['destinations'],
    queryFn: () => fetch('/api/packages').then(r => r.json()).then(data =>
      (data.destinations || []).map((d: {
        locationCode: string;
        name: string;
        flagCode: string;
        isRegional: boolean;
        planCount: number;
        minPrice: number;
        featured: boolean;
      }) => ({
        id: d.locationCode.toLowerCase(),
        name: d.name,
        slug: d.locationCode.toLowerCase(),
        flagCode: d.flagCode,
        isRegional: d.isRegional,
        planCount: d.planCount,
        fromPrice: d.minPrice,
        featured: d.featured,
      }))
    ),
    staleTime: 5 * 60 * 1000, // keep fresh for 5 min
    refetchOnWindowFocus: false, // prevent blinking on tab switch
  });

  const filtered = useMemo(() => {
    let list = destinations;
    // Tab filter
    if (tab === 'countries') list = list.filter(d => !d.isRegional);
    if (tab === 'regions') list = list.filter(d => d.isRegional);
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.slug.includes(q)
      );
    }
    return list;
  }, [destinations, search, tab]);

  const regionCount = useMemo(() => destinations.filter(d => d.isRegional).length, [destinations]);
  const countryCount = useMemo(() => destinations.filter(d => !d.isRegional).length, [destinations]);

  // Stable flag URL builder that won't cause re-renders
  const getFlagUrl = useCallback((flagCode: string) => {
    return `https://flagcdn.com/w80/${flagCode}.png`;
  }, []);

  if (isLoading) {
    return (
      <div className="container px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      {/* Header */}
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
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-2">
        {(['all', 'countries', 'regions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' && `All (${destinations.length})`}
            {t === 'countries' && `Countries (${countryCount})`}
            {t === 'regions' && `Regions (${regionCount})`}
          </button>
        ))}
      </div>

      {/* Count */}
      {filtered.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          <MapPin className="inline h-4 w-4 mr-1" />
          {filtered.length} destinations available
        </p>
      )}

      {/* Regional packages section */}
      {(tab === 'all' || tab === 'regions') && !search.trim() && (
        (() => {
          const regions = filtered.filter(d => d.isRegional);
          if (regions.length === 0) return null;
          return (
            <>
              {tab === 'all' && (
                <h2 className="mt-6 text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-600" />
                  Regional Plans
                </h2>
              )}
              <div className={`${tab === 'all' ? 'mt-3' : 'mt-6'} grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}>
                {regions.map((d) => (
                  <IntlLink key={d.id} href={`/destinations/${d.slug}`}>
                    <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-0.5 border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-emerald-100 shadow-sm">
                          <Globe className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-sm text-muted-foreground">
                              {d.planCount} plans
                            </p>
                            {d.fromPrice > 0 && (
                              <span className="text-xs font-medium text-emerald-600">
                                from ${d.fromPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </IntlLink>
                ))}
              </div>
            </>
          );
        })()
      )}

      {/* Single-country destinations */}
      {(tab === 'all' || tab === 'countries') && (
        <>
          {tab === 'all' && !search.trim() && filtered.some(d => d.isRegional) && (
            <h2 className="mt-8 text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Countries
            </h2>
          )}
          <div className={`${tab === 'all' && !search.trim() ? 'mt-3' : 'mt-6'} grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}>
            {filtered
              .filter(d => tab === 'countries' || tab === 'all' ? !d.isRegional || (search.trim() !== '') : true)
              .filter(d => !d.isRegional || search.trim() !== '')
              .map((d) => (
                <IntlLink key={d.id} href={`/destinations/${d.slug}`}>
                  <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <CardContent className="flex items-center gap-4 p-4">
                      <img
                        src={getFlagUrl(d.flagCode)}
                        alt={d.name}
                        className="h-12 w-16 rounded-lg object-cover shadow-sm"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{d.name}</span>
                          {d.featured && (
                            <Badge variant="secondary" className="text-xs">
                              {t('popular')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-muted-foreground">
                            {d.planCount} {t('plansCount')}
                          </p>
                          {d.fromPrice > 0 && (
                            <span className="text-xs font-medium text-emerald-600">
                              from ${d.fromPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </IntlLink>
              ))}
          </div>
        </>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="py-16 text-center">
          <Globe className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">No destinations found</p>
          <p className="mt-1 text-sm text-gray-400">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
