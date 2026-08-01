'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { planToGaItem, trackViewItemList } from '@/lib/analytics';
import { dealToPlan, localizedCountryName, HOT_DEALS_QUERY } from '@/lib/deals';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { DealCard } from '@/components/sections/DealCard';
import { Flame } from 'lucide-react';

export function HotDealsSection() {
  const t = useTranslations('home');
  const locale = useLocale();
  const { data: deals = [] } = useQuery(HOT_DEALS_QUERY);

  useEffect(() => {
    if (deals.length === 0) return;
    trackViewItemList(
      'hot_deals',
      deals.map((d) => planToGaItem(dealToPlan(d, locale), localizedCountryName(d.locationCode, d.name, locale)))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals.length]);

  if (deals.length === 0) return null;

  return (
    <section id="hot-deals" className="relative scroll-mt-24 bg-gradient-to-b from-amber-50/60 to-white py-14 sm:py-16">
      <div className="container px-4">
        {/*
          Beat 2 — Sima reacting to the deals. She stands beside the heading rather than inside a
          card: a person next to a price competes with it, and she would then repeat three times.
          Cropped to head-and-torso because a full-length figure this narrow reduces the face, which
          is the entire point of her, to nothing.

          The row becomes a column on a phone, so she sits above the heading instead of beside it.
          Keeping her alongside would mean splitting a 343 px screen between a figure and a heading,
          and both would lose.
        */}
        <div className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:gap-8">
          <CharacterFigure slot="dealsReaction" height={140} heightLg={230} crop={0.46} />
          <div className="max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              <Flame className="h-3 w-3" />
              {t('hotDealsEndsToday')}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {t('hotDealsTitle')}
            </h2>
            <p className="mt-2 text-muted-foreground">{t('hotDealsSubtitle')}</p>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    </section>
  );
}
