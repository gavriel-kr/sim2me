'use client';

import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
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

      {/*
        Beat 3 — both of them closing, thumbs up, one either side of the text. Full length and calm
        rather than cropped and expressive: beside a sign-up button, enthusiasm reads as pressure, so
        their job here is presence and a thumbs-up.

        Anchored to the centre rather than to the section edges, so they stay beside the words instead
        of drifting to the corners as the window widens. At `calc(50% - 350px)` each inner edge lands
        about 230 px from the centre line, which leaves roughly 60 px of air beside the headline at its
        widest. That is close to the practical limit: the `lg:text-5xl` heading reaches about 170 px
        either side of centre, so much less than this and they start crowding the words.

        The mirroring is what keeps the raised thumb on the *outer* hand. Both were drawn with the
        thumb on their image-left, so whoever stands at the inline start has it pointing inward at the
        text and needs flipping — and which of them that is swaps with the writing direction, which is
        why the rule lives in the resolver rather than here.
      */}
      <CharacterFigure
        slot="ctaClose"
        height={340}
        className="pointer-events-none absolute bottom-0 hidden lg:block start-[calc(50%_-_350px)]"
      />
      <CharacterFigure
        slot="ctaCloseSima"
        height={330}
        className="pointer-events-none absolute bottom-0 hidden lg:block end-[calc(50%_-_350px)]"
      />

      <div className="relative container mx-auto max-w-3xl px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white/90">
          <Plane className="h-4 w-4" />
          {t('ctaBadge')}
        </div>
        {/*
          `!text-center` and not plain `text-center`: `globals.css` right-aligns every h1–h6 and p
          under `[dir="rtl"]`, and that selector outranks the utility class, so in Hebrew and Arabic
          the heading ignores the centring its own container asks for. The important modifier is the
          contained way out; the rule itself is a site-wide problem, logged as a follow-up.
        */}
        <h2 className="!text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {t('ctaTitle')}
        </h2>
        <p className="mt-4 !text-center text-lg text-white/80">{t('ctaSubtitle')}</p>
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
