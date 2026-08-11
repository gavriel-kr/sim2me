'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import { translatePlanName } from '@/lib/translate-plan-name';

const { useRouter } = createSharedPathnamesNavigation(routing);

/**
 * Ticket 034 — the strings a visitor actually types that no name in the catalogue contains.
 *
 * Two tables, not one, because a country code and a region prefix can be the same two letters: `SA` is
 * Saudi Arabia as a country and South America as a region, and a single table made "אמריקה" return
 * Saudi Arabia.
 *
 * Regions are keyed by the letters before the dash. The supplier ships one region under several codes
 * (`EU-30`, `EU-42`, `EU-43`, `EU-7`) and names half of them `Region (EU-33)`, so the prefix is the
 * only stable thing to hang "אירופה" on.
 *
 * Kept in the component rather than a lib file: it is input tolerance for one field, and nothing else
 * consumes it.
 */
const COUNTRY_ALIASES: Record<string, readonly string[]> = {
  US: ['ארהב', 'אמריקה', 'ארצות הברית', 'usa', 'america', 'united states', 'أمريكا'],
  GB: ['אנגליה', 'בריטניה', 'uk', 'england', 'britain', 'إنجلترا', 'بريطانيا'],
  AE: ['דובאי', 'איחוד האמירויות', 'dubai', 'emirates', 'دبي'],
  GR: ['יוון', 'greece', 'اليونان'],
  NL: ['הולנד', 'holland', 'هولندا'],
  CZ: ['צכיה', 'פראג', 'czech', 'prague'],
  KR: ['קוריאה', 'korea', 'كوريا'],
  CN: ['סין', 'china', 'الصين'],
};

const REGION_ALIASES: Record<string, readonly string[]> = {
  EU: ['אירופה', 'اوروبا', 'أوروبا'],
  AS: ['אסיה', 'آسيا'],
  AF: ['אפריקה', 'افريقيا', 'أفريقيا'],
  ME: ['המזרח התיכון', 'מזרח תיכון', 'الشرق الأوسط'],
  NA: ['אמריקה הצפונית', 'צפון אמריקה'],
  SA: ['אמריקה הדרומית', 'דרום אמריקה', 'أمريكا الجنوبية'],
  CB: ['קריביים', 'הקריביים', 'الكاريبي'],
  GL: ['גלובלי', 'עולמי', 'כל העולם', 'global', 'عالمي'],
  CN: ['סין', 'china', 'الصين'],
  USCA: ['ארהב וקנדה', 'אמריקה וקנדה', 'אמריקה'],
  AUNZ: ['אוסטרליה', 'ניו זילנד', 'australia'],
  SAAEQAKWOMBH: ['מדינות המפרץ', 'המפרץ', 'الخليج'],
};

function aliasesFor(locationCode: string): readonly string[] | undefined {
  if (locationCode.length <= 2) return COUNTRY_ALIASES[locationCode];
  return REGION_ALIASES[locationCode] ?? REGION_ALIASES[locationCode.split('-')[0]];
}

/** Punctuation and spacing an Israeli visitor types inconsistently: ארה"ב, ארה״ב, ארהב. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/["'׳״`.\-\s]/g, '');
}

interface SearchDestinationProps {
  ctaLabel?: string;
}

interface DestOption {
  slug: string;
  name: string;         // localized for display and matching
  englishName: string;  // as the API returned it — `japan` must find יפן
  flagCode: string;
  locationCode: string; // ISO-2 for countries, a supplier code for regional bundles
}

/**
 * Countries came through `Intl.DisplayNames` here and regions were filtered out, so nothing needed to
 * translate a region name. Now that regional bundles appear in the list, the shared translator does
 * both — including the "(30+ countries)" tail — rather than this file growing a second region table.
 */
function localizedName(name: string, locationCode: string, locale: string): string {
  return translatePlanName(name, name, locationCode, locationCode.length > 2, locale);
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
      /* Regional bundles are on sale and are reached by the same slug rule as any country — the
         destinations list already links them that way — so they belong in the autocomplete. */
      return (data.destinations || []).map(
        (d: { locationCode: string; name: string; flagCode: string }) => ({
          slug: d.locationCode.toLowerCase(),
          name: d.name,
          englishName: d.name,
          flagCode: d.flagCode,
          locationCode: d.locationCode,
        })
      );
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  /* ── Translate names to current locale ── */
  const destinations = useMemo<DestOption[]>(
    () => rawDestinations.map((d) => ({
      ...d,
      name: localizedName(d.englishName, d.locationCode, locale),
    })),
    [rawDestinations, locale]
  );

  /* ── Filtered suggestions ── */
  const suggestions = useMemo<DestOption[]>(() => {
    if (!query.trim()) return [];
    const q = normalize(query);
    if (!q) return [];
    return destinations
      .filter((d) => {
        if (normalize(d.name).includes(q)) return true;
        if (normalize(d.englishName).includes(q)) return true;
        if (normalize(d.locationCode).includes(q)) return true;
        const aliases = aliasesFor(d.locationCode);
        return aliases ? aliases.some((a) => normalize(a).includes(q)) : false;
      })
      .slice(0, 7);
  }, [query, destinations]);

  const noResults = query.trim().length > 0 && suggestions.length === 0;

  /* ── Show/hide dropdown ── */
  useEffect(() => {
    setOpen(suggestions.length > 0 || noResults);
    setActiveIdx(-1);
  }, [suggestions, noResults]);

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
        <span
          className="pointer-events-none absolute start-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
          aria-hidden
        >
          <Search className="h-4 w-4 shrink-0" />
        </span>
        <Input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => (suggestions.length > 0 || noResults) && setOpen(true)}
          /* White fill and a border dark enough to clear the 3:1 minimum for a user-interface
             component. The previous pale blue on pale blue read as a disabled field.
             The native clear control is suppressed because the action button occupies that corner. */
          className={`h-14 ps-14 text-base rounded-xl border-slate-500 bg-white text-foreground shadow-md
            placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/25
            [&::-webkit-search-cancel-button]:appearance-none ${ctaLabel ? 'pe-36' : 'pe-4'}`}
          aria-label={t('searchPlaceholder')}
          aria-autocomplete="list"
          aria-expanded={open}
          autoComplete="off"
        />

        {/* Inside the field, so the field and its action read as one control. */}
        {ctaLabel && (
          <button
            type="button"
            onClick={handleNavigate}
            className="absolute end-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-glow hover:brightness-105"
          >
            {ctaLabel}
          </button>
        )}

        {/* Autocomplete dropdown */}
        {open && (suggestions.length > 0 || noResults) && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {suggestions.map((dest, idx) => (
              <li
                key={dest.slug}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(dest.slug); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${idx === activeIdx ? 'bg-primary/10 text-foreground' : 'bg-white hover:bg-primary/5'}`}
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
            {noResults && (
              <li className="px-4 py-3 text-sm text-muted-foreground">{t('searchNoResults')}</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
