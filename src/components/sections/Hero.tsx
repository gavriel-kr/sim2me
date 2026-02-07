'use client';

import { useTranslations } from 'next-intl';
import { SearchDestination } from '@/components/forms/SearchDestination';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function Hero() {
  const t = useTranslations('home');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.07] via-primary/[0.03] to-white px-4 py-20 sm:py-28">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {t('heroTitle')}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
          {t('heroSubtitle')}
        </p>
        <div className="mt-10">
          <SearchDestination />
        </div>
        <IntlLink
          href="/destinations"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:shadow-lg"
        >
          {t('searchCta')}
        </IntlLink>
      </div>
    </section>
  );
}
