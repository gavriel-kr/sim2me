'use client';

import { useTranslations } from 'next-intl';
import { SearchDestination } from '@/components/forms/SearchDestination';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function Hero() {
  const t = useTranslations('home');

  return (
    <section className="relative overflow-hidden bg-white px-4 py-16 sm:py-24">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {t('heroTitle')}
        </h1>
        <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
          {t('heroSubtitle')}
        </p>
        <div className="mt-10">
          <SearchDestination />
        </div>
        <IntlLink
          href="/destinations"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
        >
          {t('searchCta')}
        </IntlLink>
      </div>
    </section>
  );
}
