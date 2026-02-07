'use client';

import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { ArrowRight, Plane } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function CTASection() {
  const t = useTranslations('home');

  return (
    <section className="relative overflow-hidden bg-gradient-cta py-20 sm:py-24">
      {/* Decorative circles */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
      <div className="absolute right-1/4 top-1/3 h-2 w-2 rounded-full bg-white/20 animate-pulse-soft" />
      <div className="absolute left-1/3 bottom-1/4 h-3 w-3 rounded-full bg-white/15 animate-pulse-soft" />

      <div className="relative container mx-auto max-w-3xl px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white/90">
          <Plane className="h-4 w-4" />
          Start your journey
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {t('ctaTitle')}
        </h2>
        <p className="mt-4 text-lg text-white/80">{t('ctaSubtitle')}</p>
        <IntlLink
          href="/destinations"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-emerald-700 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
        >
          {t('ctaButton')}
          <ArrowRight className="h-4 w-4" />
        </IntlLink>
      </div>
    </section>
  );
}
