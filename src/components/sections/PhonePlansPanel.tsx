'use client';

/**
 * Ticket 042 — the "with a phone number" tab on a destination page.
 *
 * Which plans appear was decided server-side (`phonePlansForDestination`); this only lays them out:
 * an intro that says what kind of number this destination gets, the cards grouped by number, the
 * plan terms, and a link to the full phone-plans page.
 */

import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { routing } from '@/i18n/routing';
import type { PhonePlan, PhoneRegion } from '@/lib/phone-plans';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { PhonePlanCard } from '@/components/sections/PhonePlanCard';
import { PhoneConditions } from '@/components/sections/PhoneConditions';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

interface Props {
  plans: PhonePlan[];
  destinationName: string;
  destinationSlug: string;
  isoCode: string;
}

const GROUP_ORDER: PhoneRegion[] = ['us', 'europe', 'local', 'global'];

export function PhonePlansPanel({ plans, destinationName, destinationSlug, isoCode }: Props) {
  const t = useTranslations('phonePlans');

  const has = (r: PhoneRegion) => plans.some((p) => p.region === r);
  const intro =
    isoCode.toUpperCase() === 'US' && has('us')
      ? t('introUs')
      : has('europe')
        ? t('introEurope')
        : has('local')
          ? t('introLocal')
          : t('introGlobal', { destination: destinationName });

  const groups = GROUP_ORDER.map((region) => ({ region, items: plans.filter((p) => p.region === region) })).filter(
    (g) => g.items.length > 0,
  );
  const heading = (r: PhoneRegion) =>
    r === 'us' ? t('sectionUs') : r === 'europe' ? t('sectionEurope') : r === 'local' ? t('sectionLocal') : t('sectionGlobal');

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 rounded-3xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 px-5 pt-5 sm:px-7">
        <div className="min-w-0 pb-5">
          <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">{t('title')}</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-700">{intro}</p>
          <p className="mt-2 text-xs font-medium text-sky-700">{t('includes')}</p>
        </div>
        {/* Simi waving, phone in hand, standing on the box's bottom edge. */}
        <CharacterFigure slot="phoneTabWaving" height={110} heightLg={170} crop={0.6} className="shrink-0" />
      </div>

      {groups.map((group) => (
        <section key={group.region} aria-label={heading(group.region)}>
          {groups.length > 1 && <h3 className="mb-3 text-base font-bold text-gray-800">{heading(group.region)}</h3>}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((plan) => (
              <PhonePlanCard key={plan.id} plan={plan} destinationName={destinationName} destinationSlug={destinationSlug} />
            ))}
          </div>
        </section>
      ))}

      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
        <p className="mb-3 text-sm font-bold text-gray-800">{t('conditionsTitle')}</p>
        <PhoneConditions
          includeEurope={has('europe')}
          includeRenewable={plans.some((p) => p.renewable)}
          includeNotRenewable={plans.some((p) => !p.renewable)}
        />
      </div>

      <div className="text-center">
        <IntlLink
          href="/phone-plans"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-800 hover:underline"
        >
          {t('morePlans')}
          <ArrowLeft className="h-4 w-4 ltr:hidden" aria-hidden />
          <ArrowRight className="h-4 w-4 rtl:hidden" aria-hidden />
        </IntlLink>
      </div>
    </div>
  );
}
