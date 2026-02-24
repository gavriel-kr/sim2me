'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, TrendingUp, Wifi, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchDestinations } from '@/lib/api/repositories/destinationsRepository';
import { Input } from '@/components/ui/input';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

function SkeletonRow() {
  return (
    <li className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="h-8 w-12 rounded-md bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-28 rounded bg-muted" />
        <div className="h-2.5 w-20 rounded bg-muted" />
      </div>
      <div className="h-3 w-14 rounded bg-muted" />
    </li>
  );
}

export function SearchDestination() {
  const t = useTranslations('nav');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: destinations = [], isFetching } = useQuery({
    queryKey: ['search-destinations', query],
    queryFn: () => searchDestinations(query),
    enabled: true,
    staleTime: 60_000,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const showList = open && (query.length >= 1 || destinations.length > 0);
  const displayList = query.length >= 1 ? destinations : destinations.slice(0, 8);

  return (
    <div ref={ref} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-12 pl-10 pr-10 text-base rounded-xl"
          aria-autocomplete="list"
          aria-expanded={showList}
          role="combobox"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showList && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border bg-card shadow-xl overflow-hidden">
          {/* Header label */}
          {!query && (
            <div className="flex items-center gap-1.5 px-4 py-2 border-b bg-muted/30">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Popular destinations
              </span>
            </div>
          )}

          <ul role="listbox" className="max-h-80 overflow-auto">
            {isFetching && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}

            {!isFetching && displayList.length === 0 && (
              <li className="flex flex-col items-center gap-1 px-4 py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No destinations found</p>
                <p className="text-xs text-muted-foreground/60">Try a different country name</p>
              </li>
            )}

            {!isFetching &&
              displayList.map((d) => (
                <li key={d.id} role="option">
                  <IntlLink
                    href={`/destinations/${d.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors group border-b border-border/40 last:border-0"
                    onClick={() => setOpen(false)}
                  >
                    {/* Flag */}
                    <img
                      src={d.flagUrl}
                      alt={d.name}
                      className="h-8 w-12 rounded-md object-cover shadow-sm ring-1 ring-black/10 shrink-0"
                    />

                    {/* Name + region */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground group-hover:text-emerald-700 transition-colors truncate">
                        {d.name}
                      </p>
                      {d.region && (
                        <p className="text-xs text-muted-foreground truncate">{d.region}</p>
                      )}
                    </div>

                    {/* Right side: plan count + price */}
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      {d.planCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {d.planCount} plans
                        </span>
                      )}
                      {d.fromPrice != null && d.fromPrice > 0 && (
                        <span className="text-xs font-bold text-emerald-600">
                          from ${d.fromPrice.toFixed(2)}
                        </span>
                      )}
                      {d.popular && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          <TrendingUp className="h-2.5 w-2.5" />
                          Hot
                        </span>
                      )}
                    </div>
                  </IntlLink>
                </li>
              ))}
          </ul>

          {/* Footer */}
          {displayList.length > 0 && !isFetching && (
            <div className="px-4 py-2 border-t bg-muted/20">
              <IntlLink
                href="/destinations"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                onClick={() => setOpen(false)}
              >
                View all destinations →
              </IntlLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
