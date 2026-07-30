'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { SearchDestination } from '@/components/forms/SearchDestination';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { formatPrice } from '@/lib/utils';
import { Wifi, Globe2, Shield, Zap, Flame, Headphones, History } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const RECENT_DESTINATIONS_KEY = 'sim2me_recent_destinations';

interface HeroDeal {
  id: string;
  name: string;
  locationCode: string;
  flagCode: string;
  volume: number;
  duration: number;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  currency: string;
}

interface RecentDestination {
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

function volumeToDisplay(volumeBytes: number): string {
  if (volumeBytes < 0) return 'Unlimited';
  const gb = volumeBytes / (1024 * 1024 * 1024);
  const mb = volumeBytes / (1024 * 1024);
  return gb >= 1 ? `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)}GB` : `${mb.toFixed(0)}MB`;
}

async function fetchDeals(): Promise<HeroDeal[]> {
  const res = await fetch('/api/hot-deals');
  if (!res.ok) return [];
  const data = await res.json();
  return data.deals ?? [];
}

function readRecent(): RecentDestination | null {
  try {
    const raw = localStorage.getItem(RECENT_DESTINATIONS_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as RecentDestination[];
    return Array.isArray(list) && list.length > 0 && list[0]?.slug ? list[0] : null;
  } catch {
    return null;
  }
}

export function Hero() {
  const t = useTranslations('home');
  const tPlan = useTranslations('plan');
  const locale = useLocale();
  const [recent, setRecent] = useState<RecentDestination | null>(null);

  // Same query keys as HotDealsSection / ForYouSection — shared react-query cache, zero extra requests.
  const { data: deals = [] } = useQuery({
    queryKey: ['hot-deals'],
    queryFn: fetchDeals,
    staleTime: 5 * 60 * 1000,
  });
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: getDestinations,
  });

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  const topDeal = deals[0];
  const chips = destinations
    .filter((d) => d.popular && d.isoCode.length === 2)
    .slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative container mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Text content */}
          <div className="animate-fade-up">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                {t('instantActivation')}
              </div>
              {topDeal && (
                <a
                  href="#hot-deals"
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100"
                >
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('heroDealChip', {
                    destination: localizedCountryName(topDeal.locationCode, topDeal.name, locale),
                    data: volumeToDisplay(topDeal.volume),
                    dealPrice: formatPrice(topDeal.dealPrice, topDeal.currency),
                  })}
                  <span className="text-orange-400 line-through">
                    {formatPrice(topDeal.originalPrice, topDeal.currency)}
                  </span>
                </a>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 max-w-md">
              <SearchDestination ctaLabel={t('searchCta')} />
            </div>

            {/* Zero-typing entry: recent destination first, then popular chips */}
            {(recent || chips.length > 0) && (
              <div className="mt-4 flex max-w-lg flex-wrap items-center gap-2">
                {recent && (
                  <IntlLink
                    href={`/destinations/${recent.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
                  >
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('heroContinue', {
                      destination: localizedCountryName(recent.code, recent.name, locale),
                    })}
                  </IntlLink>
                )}
                {chips
                  .filter((d) => d.slug !== recent?.slug)
                  .slice(0, recent ? 4 : 6)
                  .map((d) => (
                    <IntlLink
                      key={d.id}
                      href={`/destinations/${d.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <img src={d.flagUrl} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                      <span className="font-medium">
                        {localizedCountryName(d.isoCode, d.name, locale)}
                      </span>
                      {typeof d.fromPrice === 'number' && (
                        <span className="text-xs text-muted-foreground">
                          {t('heroFrom')}{formatPrice(d.fromPrice, d.fromCurrency || 'USD')}
                        </span>
                      )}
                    </IntlLink>
                  ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <IntlLink
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
              >
                {t('howItWorksButton')}
              </IntlLink>
            </div>

            {/* Micro-trust row */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {t('heroTrustInstall')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {t('trustSecure')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {t('trustSupport')}
              </span>
            </div>
          </div>

          {/* Right: Visual illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              {/* Phone mockup */}
              <div className="animate-float relative h-[420px] w-[220px] rounded-[2.5rem] border-[3px] border-gray-800 bg-gray-900 p-2 shadow-2xl">
                <div className="h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-emerald-50 to-white">
                  {/* Screen content */}
                  <div className="flex h-full flex-col">
                    <div className="bg-gradient-to-r from-primary to-emerald-600 px-4 pb-6 pt-10 text-white">
                      <p className="text-xs font-medium opacity-80">{t('heroPhoneSub')}</p>
                      <p className="mt-1 text-lg font-bold">{t('heroPhoneHeader')}</p>
                    </div>
                    <div className="flex-1 space-y-3 px-3 pt-4">
                      {deals.length > 0 ? (
                        deals.slice(0, 3).map((deal, idx) => (
                          <div
                            key={deal.id}
                            className={`rounded-xl border p-3 ${
                              idx === 0
                                ? 'border-emerald-200 bg-emerald-50/80 shadow-sm'
                                : 'border-gray-100 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={`https://flagcdn.com/w40/${deal.flagCode}.png`}
                                alt=""
                                className="h-4 w-6 rounded-sm object-cover"
                              />
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-800">
                                  {localizedCountryName(deal.locationCode, deal.name, locale)}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {volumeToDisplay(deal.volume)} &middot; {deal.duration} {tPlan('days')}
                                </p>
                              </div>
                              <div className="text-end">
                                <p className="text-xs font-extrabold text-emerald-600">
                                  {formatPrice(deal.dealPrice, deal.currency)}
                                </p>
                                <p className="text-[9px] text-gray-400 line-through">
                                  {formatPrice(deal.originalPrice, deal.currency)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        [
                          { country: 'JP', data: '5GB', days: 7 },
                          { country: 'FR', data: '3GB', days: 5 },
                          { country: 'US', data: '10GB', days: 30 },
                        ].map((esim, idx) => (
                          <div
                            key={esim.country}
                            className={`rounded-xl border p-3 ${
                              idx === 0
                                ? 'border-emerald-200 bg-emerald-50/80 shadow-sm'
                                : 'border-gray-100 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={`https://flagcdn.com/w40/${esim.country.toLowerCase()}.png`}
                                alt=""
                                className="h-4 w-6 rounded-sm object-cover"
                              />
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-800">
                                  {localizedCountryName(esim.country, esim.country, locale)}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {esim.data} &middot; {esim.days} {tPlan('days')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="animate-float-delayed absolute -left-16 top-16 rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                    <Wifi className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Connected</p>
                    <p className="text-[10px] text-muted-foreground">4G LTE &middot; Tokyo</p>
                  </div>
                </div>
              </div>

              <div className="animate-float absolute -right-12 top-52 rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                    <Globe2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">200+</p>
                    <p className="text-[10px] text-muted-foreground">Countries</p>
                  </div>
                </div>
              </div>

              <div className="animate-float-delayed absolute -left-8 bottom-20 rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                    <Shield className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Secure</p>
                    <p className="text-[10px] text-muted-foreground">Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
