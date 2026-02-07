'use client';

import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function CTASection() {
  const t = useTranslations('home');

  return (
    <section className="bg-gradient-to-b from-primary/12 to-primary/5 py-20">
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{t('ctaTitle')}</h2>
        <p className="mt-3 text-muted-foreground text-lg">{t('ctaSubtitle')}</p>
        <IntlLink
          href="/destinations"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:shadow-lg"
        >
          {t('ctaButton')}
        </IntlLink>
      </div>
    </section>
  );
}
