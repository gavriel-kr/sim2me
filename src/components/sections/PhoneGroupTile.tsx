'use client';

/**
 * Ticket 042 (2026-09-28) — one kind of phone number as a tile, and the words that describe it.
 *
 * The whole tile links to the group's own page (/phone-plans/global, /usa, /europe, /mongolia…).
 * "N countries · Which countries?" opens the country list without following the link: the link is
 * stretched over the tile underneath, and the pop-up button sits above it.
 */

import { useLocale, useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { Globe2, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { formatPrice } from '@/lib/utils';
import type { PhonePlan } from '@/lib/phone-plans';
import type { PhoneGroup } from '@/lib/phone-groups';
import { countryName, usePhonePlanLabels } from '@/components/sections/PhonePlanCard';
import { PhoneCountriesDialog } from '@/components/sections/PhoneCountriesDialog';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

/** Title, number line, flag and call allowance of a group, in the reader's language. */
export function usePhoneGroupText() {
  const t = useTranslations('phonePlans');
  const locale = useLocale();
  const labels = usePhonePlanLabels();
  return {
    title: (g: PhoneGroup) =>
      g.region === 'global' ? t('regionGlobal', { count: g.coverage.length })
        : g.region === 'us' ? t('regionUs')
          : g.region === 'europe' ? t('regionEurope')
            : countryName(g.numberCountry, locale),
    /** Under a title that already names the country, a local number only needs its dial code. */
    number: (g: PhoneGroup) =>
      g.region === 'local' ? t('numberLocalShort', { dial: `‎${g.plans[0].dialCode}` }) : labels.number(g.plans[0]),
    flag: (g: PhoneGroup): string | null =>
      g.region === 'global' ? null : g.region === 'europe' ? 'eu' : g.numberCountry.toLowerCase(),
    calls: (g: PhoneGroup) => {
      if (g.plans.every((p: PhonePlan) => p.voiceMinutes < 0)) return labels.minutes(g.plans[0]);
      const finite = g.plans.map((p: PhonePlan) => p.voiceMinutes).filter((m: number) => m >= 0);
      const min = Math.min(...finite);
      const max = Math.max(...finite);
      return min === max ? t('minutes', { count: min }) : t('callsRange', { min, max });
    },
  };
}

/** "36 countries · Which countries?" — nothing for a number that works in one country only. */
export function PhoneCountriesLine({ codes, names, className = '' }: { codes: string[]; names?: Record<string, string>; className?: string }) {
  const t = useTranslations('phonePlans');
  if (codes.length < 2) return null;
  return (
    <span className={`relative z-10 inline-flex flex-wrap items-center gap-x-1.5 text-sm text-gray-700 ${className}`}>
      <Globe2 className="h-3.5 w-3.5 shrink-0 text-sky-700" aria-hidden />
      {t('countriesCount', { count: codes.length })}
      <span aria-hidden>·</span>
      <PhoneCountriesDialog codes={codes} names={names} />
    </span>
  );
}

export function PhoneGroupTile({ group }: { group: PhoneGroup }) {
  const t = useTranslations('phonePlans');
  const text = usePhoneGroupText();
  const flag = text.flag(group);
  const from = Math.min(...group.plans.map((p) => p.priceUsd));
  const renewable = group.plans.every((p) => p.renewable);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/5">
      <span className="flex items-center gap-2.5">
        {flag ? (
          <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm ring-1 ring-black/5" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <Globe2 className="h-4 w-4" aria-hidden />
          </span>
        )}
        <span className="text-lg font-bold text-gray-800">{text.title(group)}</span>
      </span>
      <span className="mt-1 text-sm font-semibold text-sky-700">{text.number(group)}</span>
      <span className="mt-3 space-y-1 text-sm text-gray-700">
        <span className="block">{text.calls(group)} · SMS</span>
        {group.region === 'global' && <span className="block text-muted-foreground">{t('tileGlobalNote')}</span>}
        <PhoneCountriesLine codes={group.coverage} names={group.coverageNames} className="flex" />
        <span className={`flex items-center gap-1 text-xs ${renewable ? 'text-emerald-700' : 'text-gray-500'}`}>
          <RefreshCw className="h-3 w-3 shrink-0" aria-hidden />
          {renewable ? t('badgeRenewable') : t('badgeNotRenewable')}
        </span>
      </span>
      <span className="mt-4 flex flex-1 items-end justify-between gap-2">
        <span>
          <span className="block text-xl font-bold tabular-nums text-gray-800">{t('from', { price: formatPrice(from) })}</span>
          <span className="text-xs text-muted-foreground">{t('plansCount', { count: group.plans.length })}</span>
        </span>
        {/* Stretched over the whole tile; the country pop-up above sits on top of it. */}
        <IntlLink
          href={`/phone-plans/${group.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-sky-400"
        >
          {t('choose')}
          <ArrowLeft className="h-4 w-4 ltr:hidden" aria-hidden />
          <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden />
        </IntlLink>
      </span>
    </div>
  );
}
