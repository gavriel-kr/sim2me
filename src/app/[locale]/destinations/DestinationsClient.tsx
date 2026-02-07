'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function DestinationsClient() {
  const t = useTranslations('destinations');
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ['destinations'],
    queryFn: getDestinations,
  });

  if (isLoading) {
    return (
      <div className="container px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d) => (
          <IntlLink key={d.id} href={`/destinations/${d.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-medium">
              <CardContent className="flex items-center gap-4 p-4">
                <img
                  src={d.flagUrl}
                  alt=""
                  className="h-12 w-16 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{d.name}</span>
                    {d.popular && (
                      <Badge variant="secondary" className="text-xs">
                        {t('popular')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {d.planCount} {t('plansCount')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </IntlLink>
        ))}
      </div>
    </div>
  );
}
