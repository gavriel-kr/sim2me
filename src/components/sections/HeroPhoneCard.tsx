'use client';

/**
 * Ticket 042 — what Simi and Sima hold out in the hero when the hot deals are switched off
 * (Gabriel, 2026-09-28): the three kinds of phone number — USA, Europe, global — cycling one at a
 * time, each with its lowest price and a way to its plans.
 *
 * Same frame, size and sliding track as `HeroOfferCard`, so the hero looks the same whichever of the
 * two is showing; the rotation comes from `Hero`'s `useDealRotation`, like the deals.
 */

import { useLocale, useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { Globe2, Phone } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { formatPrice } from '@/lib/utils';
import type { PauseHandlers } from '@/hooks/useDealRotation';
import type { PhoneSectionData } from '@/components/sections/PhonePlansSection';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export interface HeroPhoneTile {
  key: 'us' | 'europe' | 'global';
  flag: string | null;
  from: number;
}

/** The tiles that have a price, in the homepage section's order. */
export function heroPhoneTiles(data: PhoneSectionData | null | undefined): HeroPhoneTile[] {
  if (!data) return [];
  const tiles: HeroPhoneTile[] = [];
  if (data.fromUs != null) tiles.push({ key: 'us', flag: 'us', from: data.fromUs });
  if (data.fromEurope != null) tiles.push({ key: 'europe', flag: 'eu', from: data.fromEurope });
  if (data.fromGlobal != null) tiles.push({ key: 'global', flag: null, from: data.fromGlobal });
  return tiles;
}

interface Props {
  tiles: HeroPhoneTile[];
  active: number;
  onSelect: (index: number) => void;
  pauseHandlers: PauseHandlers;
}

export function HeroPhoneCard({ tiles, active, onSelect, pauseHandlers }: Props) {
  const t = useTranslations('home');
  const locale = useLocale();
  const rtl = locale === 'he' || locale === 'ar';
  if (tiles.length === 0) return null;

  const title = (key: HeroPhoneTile['key']) =>
    key === 'us' ? t('phoneUsTitle') : key === 'europe' ? t('phoneEuropeTitle') : t('phoneGlobalTitle');
  const desc = (key: HeroPhoneTile['key']) =>
    key === 'us' ? t('phoneUsDesc') : key === 'europe' ? t('phoneEuropeDesc') : t('phoneGlobalDesc');
  const current = tiles[Math.min(active, tiles.length - 1)];

  return (
    <div
      role="group"
      aria-label={t('phoneTitle')}
      className="mx-auto w-[min(320px,100%)] rounded-2xl border border-gray-100 bg-white p-4 shadow-card"
      {...pauseHandlers}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
          <Phone className="h-3 w-3" aria-hidden="true" />
          {t('phoneEyebrow')}
        </span>
        {tiles.length > 1 && (
          <span className="flex items-center gap-1.5">
            {tiles.map((tile, i) => (
              <button
                key={tile.key}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={title(tile.key)}
                aria-current={i === active}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-4 bg-sky-600' : 'w-1.5 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </span>
        )}
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${(rtl ? 1 : -1) * active * 100}%)` }}
        >
          {tiles.map((tile, i) => (
            <div key={tile.key} className="w-full shrink-0" aria-hidden={i !== active}>
              <div className="flex items-start gap-3">
                {tile.flag ? (
                  <img src={`https://flagcdn.com/w80/${tile.flag}.png`} alt="" className="mt-0.5 h-6 w-9 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/5" />
                ) : (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <Globe2 className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-foreground">{title(tile.key)}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{desc(tile.key)}</p>
                </div>
              </div>
              <p className="mt-3 text-xl font-extrabold tabular-nums text-gray-800">{t('phoneFrom', { price: formatPrice(tile.from) })}</p>
            </div>
          ))}
        </div>
      </div>

      <IntlLink
        href={`/phone-plans#${current.key}`}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-sky-700 hover:to-teal-600 hover:shadow-md"
      >
        <Phone className="h-4 w-4" aria-hidden />
        {t('phoneSeePlans')}
      </IntlLink>
    </div>
  );
}
