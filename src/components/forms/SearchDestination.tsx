'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';

const { useRouter } = createSharedPathnamesNavigation(routing);

interface SearchDestinationProps {
  ctaLabel?: string;
}

interface DestOption {
  slug: string;
  name: string;        // English name from API
  flagCode: string;
  locationCode: string; // ISO-2 for Intl.DisplayNames
}

function translateCountryName(name: string, locationCode: string, locale: string): string {
  if (locale === 'en' || locationCode.length !== 2) return name;
  try {
    const displayName = new Intl.DisplayNames([locale], { type: 'region' }).of(locationCode.toUpperCase());
    if (displayName) return displayName;
  } catch { /* fallback to English */ }
  return name;
}

export function SearchDestination({ ctaLabel }: SearchDestinationProps = {}) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Fetch destination list once for autocomplete ── */
  const { data: rawDestinations = [] } = useQuery<DestOption[]>({
    queryKey: ['destinations-autocomplete'],
    queryFn: async () => {
      const r = await fetch('/api/packages');
      const data = await r.json();
      return (data.destinations || [])
        .filter((d: { isRegional: boolean }) => !d.isRegional)
        .map((d: { locationCode: string; name: string; flagCode: string }) => ({
          slug: d.locationCode.toLowerCase(),
          name: d.name,
          flagCode: d.flagCode,
          locationCode: d.locationCode,
        }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  /* ── Translate names to current locale ── */
  const destinations = useMemo<DestOption[]>(
    () => rawDestinations.map((d) => ({
      ...d,
      name: translateCountryName(d.name, d.locationCode, locale),
    })),
    [rawDestinations, locale]
  );

  /* ── Filtered suggestions ── */
  const suggestions = useMemo<DestOption[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return destinations
      .filter((d) => d.name.toLowerCase().includes(q))
      .slice(0, 7);
  }, [query, destinations]);

  /* ── Show/hide dropdown ── */
  useEffect(() => {
    setOpen(suggestions.length > 0);
    setActiveIdx(-1);
  }, [suggestions]);

  /* ── Close on outside click ── */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleNavigate = useCallback(() => {
    const q = query.trim();
    setOpen(false);
    if (q) {
      router.push(`/destinations?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/destinations');
    }
  }, [query, router]);

  const handleSelect = useCallback(
    (slug: string) => {
      setOpen(false);
      setQuery('');
      router.push(`/destinations/${slug}`);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter') handleNavigate();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx >= 0 && suggestions[activeIdx]) {
          handleSelect(suggestions[activeIdx].slug);
        } else {
          handleNavigate();
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
        setActiveIdx(-1);
      }
    },
    [open, activeIdx, suggestions, handleNavigate, handleSelect]
  );

  return (
    <div className="w-full max-w-xl mx-auto" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="h-12 pl-10 pr-4 text-base rounded-xl"
          aria-label={t('searchPlaceholder')}
          aria-autocomplete="list"
          aria-expanded={open}
          autoComplete="off"
        />

        {/* Autocomplete dropdown */}
        {open && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
          >
            {suggestions.map((dest, idx) => (
              <li
                key={dest.slug}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(dest.slug); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors
                  ${idx === activeIdx ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-50'}`}
              >
                <img
                  src={`https://flagcdn.com/w40/${dest.flagCode}.png`}
                  alt=""
                  className="h-5 w-7 rounded-sm object-cover shrink-0"
                  loading="lazy"
                />
                <span className="font-medium">{dest.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {ctaLabel && (
        <button
          type="button"
          onClick={handleNavigate}
          className="mt-3 w-full inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-all hover:shadow-glow hover:brightness-105"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
