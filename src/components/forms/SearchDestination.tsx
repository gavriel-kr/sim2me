'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchDestinations } from '@/lib/api/repositories/destinationsRepository';
import { Input } from '@/components/ui/input';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function SearchDestination() {
  const t = useTranslations('nav');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchDestination.tsx:render',message:'SearchDestination data',data:{query,destCount:destinations.length,firstDest:destinations[0]?{name:destinations[0].name,slug:destinations[0].slug}:null,isFetching},timestamp:Date.now(),hypothesisId:'H_SEARCH'})}).catch(()=>{});
  }
  // #endregion

  const showList = open && (query.length >= 1 || destinations.length > 0);
  const displayList = query.length >= 1 ? destinations : destinations.slice(0, 6);

  return (
    <div ref={ref} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-12 pl-10 pr-4 text-base rounded-xl"
          aria-autocomplete="list"
          aria-expanded={showList}
          role="combobox"
        />
      </div>
      {showList && (
        <ul
          className="absolute top-full left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-xl border bg-card shadow-large"
          role="listbox"
        >
          {isFetching && (
            <li className="px-4 py-3 text-sm text-muted-foreground">Loading...</li>
          )}
          {!isFetching && displayList.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No destinations found.</li>
          )}
          {!isFetching &&
            displayList.map((d) => (
              <li key={d.id} role="option">
                <IntlLink
                  href={`/destinations/${d.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <img
                    src={d.flagUrl}
                    alt=""
                    className="h-6 w-9 rounded object-cover"
                  />
                  <span className="font-medium">{d.name}</span>
                  {d.popular && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Popular
                    </span>
                  )}
                </IntlLink>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
