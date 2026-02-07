'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { formatPrice } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function FeaturedPlans() {
  const t = useTranslations('home');
  const tDest = useTranslations('destinations');
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: getDestinations,
  });
  const popular = destinations.filter((d) => d.popular).slice(0, 8);

  return (
    <section className="relative bg-gradient-to-b from-muted/30 to-white py-20 sm:py-24">
      <div className="container px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Popular destinations
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {t('featuredPlans')}
            </h2>
            <p className="mt-2 text-muted-foreground sm:text-lg">
              {tDest('subtitle')}
            </p>
          </div>
          <IntlLink
            href="/destinations"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {tDest('viewAllLocations')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </IntlLink>
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
                  {d.name}
                </span>
                {d.fromPrice != null ? (
                  <p className="mt-0.5 text-sm">
                    <span className="text-muted-foreground">From </span>
                    <span className="font-bold text-primary">
                      {formatPrice(d.fromPrice, d.fromCurrency ?? 'USD')}
                    </span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {d.planCount} plans
                  </p>
                )}
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
