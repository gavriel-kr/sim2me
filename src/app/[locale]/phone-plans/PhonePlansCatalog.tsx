'use client';

/**
 * Ticket 042 — the phone-plans page as a set of tiles (Gabriel, 2026-09-28).
 *
 * One tile per kind of number: USA, Europe, global, and each country that has its own local number.
 * A tile says what the number is, where it works, the call allowance, whether it can be renewed and
 * the lowest price. Choosing a tile shows that group's plans in full underneath. No search: there
 * are only a handful of tiles. The choice is kept in the hash (#us, #europe, #global, #local-mn) so
 * the homepage can link straight to a tile.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe2, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import type { PhonePlan } from '@/lib/phone-plans';
import { formatPrice } from '@/lib/utils';
import { PhonePlanCard, countryName, usePhonePlanLabels } from '@/components/sections/PhonePlanCard';
import { PhoneConditions } from '@/components/sections/PhoneConditions';
import { PhoneFaq } from '@/components/sections/PhoneFaq';

interface Group {
  key: string;
  plans: PhonePlan[];
  flag: string | null;
  title: string;
}

export function PhonePlansCatalog({ plans }: { plans: PhonePlan[] }) {
  const t = useTranslations('phonePlans');
  const locale = useLocale();
  const labels = usePhonePlanLabels();
  const [selected, setSelected] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const groups = useMemo<Group[]>(() => {
    const out: Group[] = [];
    const us = plans.filter((p) => p.region === 'us');
    const europe = plans.filter((p) => p.region === 'europe');
    const global = plans.filter((p) => p.region === 'global');
    if (us.length) out.push({ key: 'us', plans: us, flag: 'us', title: t('regionUs') });
    if (europe.length) out.push({ key: 'europe', plans: europe, flag: 'eu', title: t('regionEurope') });
    const locals = [...new Set(plans.filter((p) => p.region === 'local').map((p) => p.numberCountry))];
    for (const code of locals) {
      out.push({
        key: `local-${code.toLowerCase()}`,
        plans: plans.filter((p) => p.region === 'local' && p.numberCountry === code),
        flag: code.toLowerCase(),
        title: countryName(code, locale),
      });
    }
    if (global.length) out.push({ key: 'global', plans: global, flag: null, title: t('regionGlobal', { count: global[0].coverageCount }) });
    return out;
  }, [plans, t, locale]);

  // Deep link from the homepage (#us, #europe, #global) or a shared link.
  useEffect(() => {
    const fromHash = window.location.hash.replace('#', '');
    if (groups.some((g) => g.key === fromHash)) setSelected(fromHash);
  }, [groups]);

  const choose = (key: string) => {
    setSelected(key);
    try {
      window.history.replaceState(null, '', `#${key}`);
    } catch { /* hash is a convenience only */ }
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  if (plans.length === 0) {
    return <p className="mt-10 text-center text-muted-foreground">{t('empty')}</p>;
  }

  const active = groups.find((g) => g.key === selected) ?? null;
  /* Under a heading that already names the country, a local number only needs its dial code. */
  const numberUnderTitle = (g: Group) =>
    g.key.startsWith('local-') ? t('numberLocalShort', { dial: `‎${g.plans[0].dialCode}` }) : labels.number(g.plans[0]);
  const callsOf = (g: Group) => {
    if (g.plans.every((p) => p.voiceMinutes < 0)) return labels.minutes(g.plans[0]);
    const finite = g.plans.map((p) => p.voiceMinutes).filter((m) => m >= 0);
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    return min === max ? t('minutes', { count: min }) : t('callsRange', { min, max });
  };

  return (
    <div className="mt-8 space-y-10">
      <section aria-labelledby="phone-tiles-title">
        <h2 id="phone-tiles-title" className="text-lg font-bold text-gray-800">{t('tilesTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('tilesHint')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => {
            const isActive = g.key === selected;
            const from = Math.min(...g.plans.map((p) => p.priceUsd));
            const renewable = g.plans.every((p) => p.renewable);
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => choose(g.key)}
                aria-pressed={isActive}
                className={`group flex flex-col rounded-2xl border bg-white p-5 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-900/5 ${
                  isActive ? 'border-sky-300 ring-2 ring-sky-200' : 'border-sky-100 hover:border-sky-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {g.flag ? (
                    <img src={`https://flagcdn.com/w40/${g.flag}.png`} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm ring-1 ring-black/5" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                      <Globe2 className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                  <span className="text-lg font-bold text-gray-800">{g.title}</span>
                </span>
                <span className="mt-1 text-sm font-semibold text-sky-700">{numberUnderTitle(g)}</span>
                <span className="mt-3 space-y-1 text-sm text-gray-700">
                  <span className="block">{callsOf(g)} · SMS</span>
                  {g.key === 'global' && <span className="block text-muted-foreground">{t('tileGlobalNote')}</span>}
                  <span className={`flex items-center gap-1 text-xs ${renewable ? 'text-emerald-700' : 'text-gray-500'}`}>
                    <RefreshCw className="h-3 w-3 shrink-0" aria-hidden />
                    {renewable ? t('badgeRenewable') : t('badgeNotRenewable')}
                  </span>
                </span>
                <span className="mt-4 flex items-end justify-between gap-2">
                  <span>
                    <span className="block text-xl font-bold tabular-nums text-gray-800">{t('from', { price: formatPrice(from) })}</span>
                    <span className="text-xs text-muted-foreground">{t('plansCount', { count: g.plans.length })}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                    {t('choose')}
                    <ArrowLeft className="h-4 w-4 ltr:hidden" aria-hidden />
                    <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div ref={listRef} className="scroll-mt-24">
        {active && (
          <section aria-label={active.title} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">
              {active.title} · <span className="text-sky-700">{numberUnderTitle(active)}</span>
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {active.plans.map((plan) => (
                <PhonePlanCard key={plan.id} plan={plan} destinationName={active.title} destinationSlug="phone-plans" />
              ))}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
              <p className="mb-3 text-sm font-bold text-gray-800">{t('conditionsTitle')}</p>
              <PhoneConditions
                includeEurope={active.key === 'europe'}
                includeRenewable={active.plans.some((p) => p.renewable)}
                includeNotRenewable={active.plans.some((p) => !p.renewable)}
              />
            </div>
          </section>
        )}
      </div>

      <PhoneFaq />
    </div>
  );
}
