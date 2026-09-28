'use client';

/**
 * Ticket 042 — the homepage beat for plans with a phone number.
 *
 * Sits right after the day's deals. Sima reacts to those at the inline start, so Simi waves from the
 * inline end here, keeping the page's alternating rhythm. Three cards, one per kind of number, each
 * with the cheapest visible price; an admin-featured plan (with its badge) gets a highlighted line of
 * its own, which is how phone plans take part in promotions without touching the daily-deals table.
 */

import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { Phone, Globe2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { formatPrice } from '@/lib/utils';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { PhoneCountriesLine } from '@/components/sections/PhoneGroupTile';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export interface PhoneSectionData {
  fromUs: number | null;
  fromEurope: number | null;
  fromGlobal: number | null;
  globalCount: number;
  /** Where each kind of number works (ISO-2), for the country count and its pop-up list. */
  coverage: { us: string[]; europe: string[]; global: string[] };
  /** Names for the few codes a browser cannot name. */
  coverageNames: Record<string, string>;
  /** An admin-featured plan to spotlight, already localised into a short line by the server. */
  spotlight: { region: 'us' | 'europe' | 'global' | 'local'; dataGb: number; days: number; priceUsd: number; badge: string | null } | null;
}

export function PhonePlansSection({ data }: { data: PhoneSectionData }) {
  const t = useTranslations('home');
  const tP = useTranslations('phonePlans');

  // Global first, then the USA, then Europe — the site's order everywhere (Gabriel, 2026-09-28).
  const cards = [
    { key: 'global', flag: null, title: t('phoneGlobalTitle'), desc: t('phoneGlobalDesc'), from: data.fromGlobal, href: '/phone-plans/global', coverage: data.coverage.global },
    { key: 'us', flag: 'us', title: t('phoneUsTitle'), desc: t('phoneUsDesc'), from: data.fromUs, href: '/phone-plans/usa', coverage: data.coverage.us },
    { key: 'europe', flag: 'eu', title: t('phoneEuropeTitle'), desc: t('phoneEuropeDesc'), from: data.fromEurope, href: '/phone-plans/europe', coverage: data.coverage.europe },
  ].filter((c) => c.from != null);

  if (cards.length === 0) return null;

  const spot = data.spotlight;
  const spotNumber = spot
    ? spot.region === 'us' ? tP('numberUs') : spot.region === 'europe' ? tP('numberEurope') : spot.region === 'global' ? tP('numberGlobal') : ''
    : '';

  return (
    <section id="phone-plans" className="relative scroll-mt-24 bg-gradient-to-b from-sky-50/70 to-white py-14 sm:py-16">
      <div className="container px-4">
        <div className="flex flex-col-reverse items-center justify-center gap-4 lg:flex-row lg:gap-8">
          <div className="max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              <Phone className="h-3 w-3" aria-hidden />
              {t('phoneEyebrow')}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('phoneTitle')}</h2>
            <p className="mt-2 text-muted-foreground">{t('phoneSubtitle')}</p>
          </div>
          <CharacterFigure slot="phoneSectionWaving" height={140} heightLg={230} crop={0.5} />
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.key}
              className="group relative flex flex-col rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/5"
            >
              <div className="flex items-center gap-2.5">
                {card.flag ? (
                  <img src={`https://flagcdn.com/w40/${card.flag}.png`} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm ring-1 ring-black/5" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <Globe2 className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <p className="text-lg font-bold text-gray-800">{card.title}</p>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
              <PhoneCountriesLine codes={card.coverage} names={data.coverageNames} className="mt-2 flex" />
              <div className="mt-4 flex items-end justify-between gap-2">
                <span className="text-xl font-bold tabular-nums text-gray-800">
                  {t('phoneFrom', { price: formatPrice(card.from!) })}
                </span>
                {/* Stretched over the whole card; the country pop-up above sits on top of it. */}
                <IntlLink
                  href={card.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 after:absolute after:inset-0 after:rounded-2xl after:content-[''] group-hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-sky-400"
                >
                  {t('phoneSeePlans')}
                  <ArrowLeft className="h-4 w-4 ltr:hidden" aria-hidden />
                  <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden />
                </IntlLink>
              </div>
            </div>
          ))}
        </div>

        {spot && (
          <div className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <Sparkles className="h-4 w-4" aria-hidden />
              {spot.badge || tP('featured')}
              <span className="font-normal text-gray-700">
                {spotNumber} · {tP('data', { gb: spot.dataGb })} · {tP('days', { days: spot.days })}
              </span>
            </span>
            <IntlLink href="/phone-plans" className="text-sm font-bold tabular-nums text-gray-800 hover:underline">
              {formatPrice(spot.priceUsd)}
            </IntlLink>
          </div>
        )}

        <div className="mt-6 text-center">
          <IntlLink href="/phone-plans" className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline">
            {t('phoneCta')}
          </IntlLink>
        </div>
      </div>
    </section>
  );
}
