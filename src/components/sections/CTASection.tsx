'use client';

import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function CTASection() {
  const t = useTranslations('home');

  return (
    <section className="bg-primary/8 py-16">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t('ctaTitle')}</h2>
        <p className="mt-2 text-muted-foreground">{t('ctaSubtitle')}</p>
        <IntlLink
          href="/destinations"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
        >
          {t('ctaButton')}
        </IntlLink>
      </div>
    </section>
  );
}
