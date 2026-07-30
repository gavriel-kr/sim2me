'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import type { Plan } from '@/types';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { buildTiers } from '@/lib/plan-curation';
import { translatePlanName } from '@/lib/translate-plan-name';
import { CuratedTierCard } from '@/components/sections/CuratedTierCard';
import { planToGaItem, trackViewItemList } from '@/lib/analytics';
import { Sparkles, ArrowRight } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export const RECENT_DESTINATIONS_KEY = 'sim2me_recent_destinations';

export interface RecentDestination {
  code: string;
  slug: string;
  name: string;
  ts: number;
}

type SignalMode = 'recent' | 'order' | 'default';

interface Signal {
  mode: SignalMode;
  code: string;
  slug: string;
  name: string;
}

function localizedCountryName(isoCode: string, fallback: string, locale: string): string {
  if (isoCode.length !== 2) return fallback;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode) || fallback;
  } catch {
    return fallback;
  }
}

function readRecent(): RecentDestination | null {
  try {
    const raw = localStorage.getItem(RECENT_DESTINATIONS_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as RecentDestination[];
    return Array.isArray(list) && list.length > 0 ? list[0] : null;
  } catch {
    return null;
  }
}

/** Same package→Plan mapping the destination page uses, client-side. */
async function fetchPlansFor(locationCode: string, locale: string): Promise<Plan[]> {
  const res = await fetch(`/api/packages?location=${encodeURIComponent(locationCode)}`);
  if (!res.ok) return [];
  const data = await res.json();
  const packages = (data.packages ?? []).filter(
    (p: { locationCode: string }) => p.locationCode?.toUpperCase() === locationCode.toUpperCase()
  );

  return packages.map((pkg: {
    packageCode: string; name: string; price: number; currency?: string;
    volume: number; duration: number; speed?: string; topUp: boolean;
    location?: string; locationCode: string; isRegional?: boolean;
    featured?: boolean; saleBadge?: string | null;
  }): Plan => {
    let networkType: '4G' | '5G' | '3G' = '4G';
    if (pkg.speed?.includes('5G')) networkType = '5G';
    else if (pkg.speed?.includes('3G')) networkType = '3G';

    let dataDisplay: string;
    let dataAmountMb: number;
    if (pkg.volume < 0) {
      dataDisplay = 'Unlimited';
      dataAmountMb = -1;
    } else {
      const gb = pkg.volume / (1024 * 1024 * 1024);
      const mb = pkg.volume / (1024 * 1024);
      dataAmountMb = mb;
      dataDisplay = gb >= 1
        ? `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`
        : `${mb.toFixed(0)} MB`;
    }

    return {
      id: pkg.packageCode,
      destinationId: locationCode.toLowerCase(),
      name: translatePlanName(pkg.name, pkg.location || pkg.name, pkg.locationCode, pkg.isRegional ?? false, locale),
      dataAmount: dataAmountMb,
      dataDisplay,
      days: pkg.duration,
      price: pkg.price,
      currency: pkg.currency || 'USD',
      networkType,
      speed: pkg.speed,
      tethering: true,
      topUps: pkg.topUp,
      operatorName: pkg.speed || 'eSIMaccess',
      popular: pkg.featured,
      saleBadge: pkg.saleBadge ?? null,
    };
  });
}

/** Stable daily pick: same destination all day, rotates tomorrow. */
function dailyPick<T>(list: T[]): T {
  const day = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

export function ForYouSection() {
  const t = useTranslations('home');
  const locale = useLocale();
  const [signal, setSignal] = useState<Signal | null>(null);

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: getDestinations,
  });

  // Signal hierarchy: recently viewed > latest order > daily featured pick
  useEffect(() => {
    if (signal) return;

    const recent = readRecent();
    if (recent?.code && recent?.slug) {
      setSignal({ mode: 'recent', code: recent.code, slug: recent.slug, name: recent.name });
      return;
    }

    if (destinations.length === 0) return; // wait for the list

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/account/orders');
        if (res.ok) {
          const data = await res.json();
          const destName = data.orders?.[0]?.destination as string | undefined;
          if (destName) {
            const match = destinations.find(
              (d) =>
                d.name.toLowerCase() === destName.toLowerCase() ||
                d.isoCode.toLowerCase() === destName.toLowerCase()
            );
            if (match && !cancelled) {
              setSignal({ mode: 'order', code: match.isoCode, slug: match.slug, name: match.name });
              return;
            }
          }
        }
      } catch { /* guest or network error — fall through */ }

      if (cancelled) return;
      const pool = destinations.filter((d) => d.popular && d.isoCode.length === 2);
      const list = pool.length > 0 ? pool : destinations.filter((d) => d.isoCode.length === 2);
      if (list.length === 0) return;
      const pick = dailyPick(list);
      setSignal({ mode: 'default', code: pick.isoCode, slug: pick.slug, name: pick.name });
    })();

    return () => { cancelled = true; };
  }, [destinations, signal]);

  const { data: plans = [] } = useQuery({
    queryKey: ['foryou-packages', signal?.code, locale],
    queryFn: () => fetchPlansFor(signal!.code, locale),
    enabled: !!signal,
    staleTime: 5 * 60 * 1000,
  });

  const tiers = useMemo(() => {
    const all = buildTiers(plans);
    if (all.length <= 3) return all;
    // Keep 3 tiers centered on the star
    const starIdx = all.findIndex((tier) => tier.isStar);
    const start = Math.min(Math.max(0, starIdx - 1), all.length - 3);
    return all.slice(start, start + 3);
  }, [plans]);

  const destName = signal ? localizedCountryName(signal.code, signal.name, locale) : '';

  useEffect(() => {
    if (!signal || tiers.length === 0) return;
    trackViewItemList(
      `foryou_${signal.mode}:${signal.slug}`,
      tiers.map((tier) => planToGaItem(tier.plan, destName))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal?.slug, tiers.length]);

  if (!signal || tiers.length < 3) return null;

  const titleKey = signal.mode === 'recent' ? 'forYouRecentTitle' : signal.mode === 'order' ? 'forYouOrderTitle' : 'forYouDefaultTitle';
  const subtitleKey = signal.mode === 'recent' ? 'forYouRecentSubtitle' : signal.mode === 'order' ? 'forYouOrderSubtitle' : 'forYouDefaultSubtitle';

  return (
    <section className="relative bg-white py-14 sm:py-16">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            {destName}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t(titleKey)}
          </h2>
          <p className="mt-2 text-muted-foreground">{t(subtitleKey, { destination: destName })}</p>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <CuratedTierCard
              key={tier.plan.id}
              tierKey={tier.key}
              plan={tier.plan}
              isStar={tier.isStar}
              destinationName={destName}
              destinationSlug={signal.slug}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <IntlLink
            href={`/destinations/${signal.slug}`}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline underline-offset-2"
          >
            {t('forYouViewAll', { destination: destName })}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </IntlLink>
        </div>
      </div>
    </section>
  );
}
