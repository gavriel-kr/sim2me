'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { SearchDestination } from '@/components/forms/SearchDestination';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { getDestinations } from '@/lib/api/repositories/destinationsRepository';
import { formatPrice, localizeDataDisplay } from '@/lib/utils';
import { localizedCountryName, volumeToDisplay, HOT_DEALS_QUERY } from '@/lib/deals';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { HeroOfferCard } from '@/components/sections/HeroOfferCard';
import { useDealRotation } from '@/hooks/useDealRotation';
import { Shield, Zap, Flame, Headphones, History } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const RECENT_DESTINATIONS_KEY = 'sim2me_recent_destinations';

interface RecentDestination {
  code: string;
  slug: string;
  name: string;
}

function readRecent(): RecentDestination | null {
  try {
    const raw = localStorage.getItem(RECENT_DESTINATIONS_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as RecentDestination[];
    return Array.isArray(list) && list.length > 0 && list[0]?.slug ? list[0] : null;
  } catch {
    return null;
  }
}

export function Hero() {
  const t = useTranslations('home');
  const locale = useLocale();
  const [recent, setRecent] = useState<RecentDestination | null>(null);

  // Same query key as HotDealsSection / ForYouSection — shared react-query cache, zero extra requests.
  const { data: deals = [] } = useQuery(HOT_DEALS_QUERY);
  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations'],
    queryFn: getDestinations,
  });

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  // One list and one rotation for both the chip and the card, so they always name the same deal.
  // The whole list, not a slice of it: the server already returns exactly the configured number of
  // deals, so a cap here would be a second opinion on a number the admin thinks it owns.
  const strip = deals;
  const { active, setIndex, pauseHandlers } = useDealRotation(strip.length);

  const chips = destinations
    .filter((d) => d.popular && d.isoCode.length === 2)
    .slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative container mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
        {/*
          `min-w-0` on both columns is load-bearing, not tidying. A grid item defaults to
          `min-width: auto`, which means it refuses to shrink below the widest unbreakable thing inside
          it — so any single element that cannot wrap silently widens the whole column, and the section
          clips whatever spills. On a phone that reads as the entire page being cut off down one side,
          with nothing to point at as the cause.
        */}
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Text content */}
          <div className="min-w-0 animate-fade-up">
            {/*
              Stacked rather than wrapped. The deal chip belongs on its own line under the activation
              badge at every width — leaving it to `flex-wrap` meant the line break depended on how
              long today's country name happened to be, so the hero's opening lines rearranged
              themselves from one day to the next.

              Its own line is also what lets the chip size to its content. Both rotate together: a
              chip that shares a row cannot change width without risking a wrap that drops the
              headline, so it had to reserve the width of the longest deal and short deals paid for it
              with visible empty space. Alone on the line there is nothing beside it to push, and only
              its own trailing edge moves.

              `whitespace-nowrap` only from `lg`. The single-line guarantee is worth having where there
              is room for it, but on a phone the longest deal — "ארצות הברית 100 GB ב-$127.21 $139.80"
              — is wider than the screen, and a chip that cannot wrap forces the grid column wider than
              the viewport and pushes the whole hero off the side.
            */}
            <div className="mb-6 flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                {t('instantActivation')}
              </div>
              {strip[active] && (
                <a
                  href="#hot-deals"
                  {...pauseHandlers}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 lg:whitespace-nowrap"
                >
                  <Flame className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {/* Keyed on the deal so each one remounts and fades in; only one is ever in the DOM,
                      which is what makes the chip exactly as wide as the deal it is showing. */}
                  <span key={strip[active].id} className="animate-in fade-in duration-500">
                    {t('heroDealChip', {
                      destination: localizedCountryName(
                        strip[active].locationCode,
                        strip[active].name,
                        locale
                      ),
                      data: localizeDataDisplay(volumeToDisplay(strip[active].volume).dataDisplay, locale),
                      dealPrice: formatPrice(strip[active].dealPrice, strip[active].currency),
                    })}
                    {/*
                      `bdi`, not `span`. The deal price ends the translated sentence and the original
                      opens this element, so in Hebrew and Arabic the two are adjacent left-to-right
                      runs inside a right-to-left line. Bidi merges them into one run laid out
                      left-to-right, which parks the struck-through original against "ב-" and throws
                      the price the sentence is about to the far end of the chip. An isolate keeps this
                      price a unit of its own, so it follows the deal price in reading order.

                      The margin is symmetric for the same reason it cannot be `ms`: `bdi` defaults to
                      `dir="auto"`, and a price carries no strongly-directional character, so it
                      resolves to ltr whatever the surrounding script — a logical margin would answer
                      to the price rather than to the line and sit on the outer edge. Which side faces
                      the deal price flips with the writing direction anyway.
                    */}
                    <bdi className="mx-1.5 text-orange-400 line-through">
                      {formatPrice(strip[active].originalPrice, strip[active].currency)}
                    </bdi>
                  </span>
                </a>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 max-w-md">
              <SearchDestination ctaLabel={t('searchCta')} />
            </div>

            {/* Zero-typing entry: recent destination first, then popular chips */}
            {(recent || chips.length > 0) && (
              <div className="mt-4 flex max-w-lg flex-wrap items-center gap-2">
                {recent && (
                  <IntlLink
                    href={`/destinations/${recent.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
                  >
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('heroContinue', {
                      destination: localizedCountryName(recent.code, recent.name, locale),
                    })}
                  </IntlLink>
                )}
                {chips
                  .filter((d) => d.slug !== recent?.slug)
                  .slice(0, recent ? 4 : 6)
                  .map((d) => (
                    <IntlLink
                      key={d.id}
                      href={`/destinations/${d.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <img src={d.flagUrl} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                      <span className="font-medium">
                        {localizedCountryName(d.isoCode, d.name, locale)}
                      </span>
                    </IntlLink>
                  ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <IntlLink
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
              >
                {t('howItWorksButton')}
              </IntlLink>
            </div>

            {/* Micro-trust row */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {t('heroTrustInstall')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {t('trustSecure')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {t('trustSupport')}
              </span>
            </div>
          </div>

          {/*
            Right: Simi and Sima present today's deal.

            The CSS phone mockup that stood here showed the same three deals as HotDealsSection 200 px
            below, at 10 px, with nothing to click, and it pulled the pair's gaze down and away from
            the visitor. One actionable card replaces it. The box keeps its height when there are no
            deals at all, so the grid never collapses.
          */}
          {/*
            Two layouts, one DOM. From `lg` the card overlaps the pair's lower body, which is the
            composition that makes them look like they are holding it out to you. On a phone that
            overlap is impossible — the card alone is 320 px of a 343 px column — so the two simply
            stack, pair above card, and the fixed-height positioning frame switches off.
          */}
          <div className="mx-auto flex w-full min-w-0 max-w-[536px] flex-col items-center gap-4 lg:relative lg:block lg:h-[470px]">
            <CharacterFigure
              slot="heroPair"
              height={200}
              heightLg={418}
              priority
              className="lg:absolute lg:bottom-[52px] lg:left-1/2 lg:-translate-x-1/2"
            />
            <div className="w-full lg:absolute lg:bottom-0 lg:left-1/2 lg:w-auto lg:-translate-x-1/2">
              <HeroOfferCard
                deals={strip}
                active={active}
                onSelect={setIndex}
                pauseHandlers={pauseHandlers}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
