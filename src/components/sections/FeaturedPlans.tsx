'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { formatPrice } from '@/lib/utils';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function FeaturedPlans() {
  const t = useTranslations('home');
  const tDest = useTranslations('destinations');
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: getDestinations,
  });
  const popular = destinations.filter((d) => d.popular).slice(0, 12);

  return (
    <section className="bg-white py-20">
      <div className="container px-4">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t('featuredPlans')}
        </h2>
        <p className="mt-3 text-muted-foreground text-lg">
          {tDest('subtitle')}
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((d) => (
            <IntlLink
              key={d.id}
              href={`/destinations/${d.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover"
            >
              <div className="flex flex-1 items-center gap-4 p-5">
                <img
                  src={d.flagUrl}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5"
                />
                <div className="min-w-0 flex-1 text-left">
                  <span className="block font-semibold text-foreground group-hover:text-primary transition-colors">
                    {d.name}
                  </span>
                  {d.fromPrice != null && (
                    <p className="mt-1 text-xl font-bold text-primary">
                      {formatPrice(d.fromPrice, d.fromCurrency ?? 'USD')}
                    </p>
                  )}
                </div>
              </div>
            </IntlLink>
          ))}
        </div>
        <div className="mt-10 text-center">
          <IntlLink
            href="/destinations"
            className="inline-flex items-center justify-center rounded-xl border-2 border-primary bg-transparent px-8 py-3 text-base font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            {tDest('viewAllLocations')}
          </IntlLink>
        </div>
      </div>
    </section>
  );
}
