'use client';

/**
 * Ticket 042 (2026-09-28) — the body of one phone-number page: back to all numbers, the number and
 * where it works (country count and list), its plans, the terms that apply to them, and the FAQ.
 */

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { ArrowLeft, ArrowRight, Globe2 } from 'lucide-react';
import { routing } from '@/i18n/routing';
import type { PhoneGroup } from '@/lib/phone-groups';
import { PhonePlanCard } from '@/components/sections/PhonePlanCard';
import { PhoneConditions } from '@/components/sections/PhoneConditions';
import { PhoneFaq } from '@/components/sections/PhoneFaq';
import { PhoneCountriesLine, usePhoneGroupText } from '@/components/sections/PhoneGroupTile';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function PhoneGroupClient({ slug, group, figure }: { slug: string; group: PhoneGroup | null; figure: ReactNode }) {
  const t = useTranslations('phonePlans');
  const text = usePhoneGroupText();
  const flag = group ? text.flag(group) : null;

  return (
    <div className="space-y-8">
      <IntlLink href="/phone-plans" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
        <ArrowRight className="h-4 w-4 ltr:hidden" aria-hidden />
        <ArrowLeft className="h-4 w-4 rtl:hidden" aria-hidden />
        {t('allNumbers')}
      </IntlLink>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 pb-2">
          <p className="text-sm font-semibold text-sky-700">{t('includes')}</p>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold sm:text-3xl">
            {flag ? (
              <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" className="h-6 w-9 rounded-sm object-cover shadow-sm ring-1 ring-black/5" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Globe2 className="h-5 w-5" aria-hidden />
              </span>
            )}
            {group ? text.title(group) : slug === 'usa' ? t('regionUs') : slug === 'europe' ? t('regionEurope') : t('regionGlobal', { count: 0 })}
          </h1>
          {group && (
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-semibold text-sky-700">{text.number(group)}</p>
              {group.region === 'global' && <p className="text-muted-foreground">{t('tileGlobalNote')}</p>}
              <PhoneCountriesLine codes={group.coverage} names={group.coverageNames} className="flex" />
            </div>
          )}
        </div>
        {figure}
      </div>

      {group ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.plans.map((plan) => (
              <PhonePlanCard key={plan.id} plan={plan} destinationName={text.title(group)} destinationSlug="phone-plans" />
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
            <p className="mb-3 text-sm font-bold text-gray-800">{t('conditionsTitle')}</p>
            <PhoneConditions
              includeEurope={group.region === 'europe'}
              includeRenewable={group.plans.some((p) => p.renewable)}
              includeNotRenewable={group.plans.some((p) => !p.renewable)}
            />
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">{t('empty')}</p>
      )}

      <PhoneFaq />
    </div>
  );
}
