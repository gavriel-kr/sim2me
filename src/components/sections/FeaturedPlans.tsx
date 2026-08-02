'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { ArrowRight, Sparkles } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

function getLocalizedCountryName(isoCode: string, fallback: string, locale: string): string {
  if (isoCode.length !== 2) return fallback; // regional bundles keep English name
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode) || fallback;
  } catch {
    return fallback;
  }
}

export function FeaturedPlans() {
  const t = useTranslations('home');
  const tDest = useTranslations('destinations');
  const locale = useLocale();
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: getDestinations,
  });
  // Show admin-marked popular destinations; fall back to European countries when none are set
  const popular = (() => {
    const marked = destinations.filter((d) => d.popular);
    if (marked.length > 0) return marked.slice(0, 8);
    return destinations
      .filter((d) => d.region === 'Europe' && d.isoCode.length === 2)
      .slice(0, 8);
  })();

  return (
    <section className="relative bg-gradient-to-b from-muted/30 to-white py-20 sm:py-24">
      <div className="container px-4">
        {/*
          Simi scouting the destinations through binoculars. Cropped to head-and-torso: the
          binoculars sit at eye level, so that crop is where the whole gesture lives.

          Sides alternate down the page — deals at the inline start, the daily pick at the end, here
          back at the start, the FAQ at the end — so the characters zigzag instead of stacking into a
          column along one edge.
        */}
        <div className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:gap-8">
          <CharacterFigure slot="destinationsScout" height={140} heightLg={230} crop={0.46} />
          <div className="max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              {t('featuredPlans')}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {t('featuredPlans')}
            </h2>
            <p className="mt-2 text-muted-foreground sm:text-lg">
              {tDest('subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((d) => (
            <IntlLink
              key={d.id}
              href={`/destinations/${d.slug}`}
              className="group relative flex items-center gap-4 rounded-2xl border border-border/60 bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/30"
            >
              <img
                src={d.flagUrl}
                alt=""
                className="h-12 w-[68px] shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-foreground transition-colors group-hover:text-primary">
                  {getLocalizedCountryName(d.isoCode, d.name, locale)}
                </span>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {d.planCount} {tDest('plansCount')}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
            </IntlLink>
          ))}
        </div>

        <div className="mt-10 text-center">
          <IntlLink
            href="/destinations"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-transparent px-8 py-3 text-base font-semibold text-primary transition-all hover:bg-primary hover:text-white hover:shadow-glow"
          >
            {tDest('viewAllLocations')}
            <ArrowRight className="h-4 w-4" />
          </IntlLink>
        </div>
      </div>
    </section>
  );
}
