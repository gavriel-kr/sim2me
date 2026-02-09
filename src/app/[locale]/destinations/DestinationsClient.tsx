'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, MapPin } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function DestinationsClient() {
  const t = useTranslations('destinations');
  const [search, setSearch] = useState('');
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => fetch('/api/packages').then(r => r.json()).then(data =>
      (data.destinations || []).map((d: {
        locationCode: string;
        location: string;
        planCount: number;
        minPrice: number;
        featured: boolean;
      }) => ({
        id: d.locationCode.toLowerCase(),
        name: d.location,
        slug: d.locationCode.toLowerCase(),
        isoCode: d.locationCode,
        flagUrl: `https://flagcdn.com/w80/${d.locationCode.toLowerCase()}.png`,
        popular: d.featured,
        planCount: d.planCount,
        fromPrice: d.minPrice,
      }))
    ),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return destinations;
    const q = search.toLowerCase().trim();
    return destinations.filter((d: { name: string; slug: string; isoCode: string }) =>
      d.name.toLowerCase().includes(q) ||
      d.slug.includes(q) ||
      d.isoCode.toLowerCase().includes(q)
    );
  }, [destinations, search]);

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

      {filtered.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          <MapPin className="inline h-4 w-4 mr-1" />
          {filtered.length} destinations available
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((d: { id: string; slug: string; flagUrl: string; name: string; popular: boolean; planCount: number; fromPrice: number }) => (
          <IntlLink key={d.id} href={`/destinations/${d.slug}`}>
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 p-4">
                <img
                  src={d.flagUrl}
                  alt=""
                  className="h-12 w-16 rounded-lg object-cover shadow-sm"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/xx.png'; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{d.name}</span>
                    {d.popular && (
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
