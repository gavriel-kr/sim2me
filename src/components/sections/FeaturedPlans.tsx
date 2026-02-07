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
    <section className="bg-white py-16">
      <div className="container px-4">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t('featuredPlans')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {tDest('subtitle')}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((d) => (
            <IntlLink
              key={d.id}
              href={`/destinations/${d.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex flex-1 items-center gap-4 p-4">
                <img
                  src={d.flagUrl}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-lg object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-foreground group-hover:text-primary">
                    {d.name}
                  </span>
                  {d.fromPrice != null && (
                    <p className="mt-0.5 text-lg font-bold text-primary">
                      {formatPrice(d.fromPrice, d.fromCurrency ?? 'USD')}
                    </p>
                  )}
                </div>
              </div>
            </IntlLink>
          ))}
        </div>
        <div className="mt-8 text-center">
          <IntlLink
            href="/destinations"
            className="inline-flex items-center justify-center rounded-lg border border-primary bg-transparent px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            {tDest('viewAllLocations')}
          </IntlLink>
        </div>
      </div>
    </section>
  );
}
