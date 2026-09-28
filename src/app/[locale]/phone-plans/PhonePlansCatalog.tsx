'use client';

/**
 * Ticket 042 — the phone-plans page: one tile per kind of number, nothing else (Gabriel, 2026-09-28).
 *
 * Global, the USA, Europe, then each country with its own local number. A tile says what the number
 * is, where it works (with the country list in a pop-up), the call allowance, whether it can be
 * renewed and the lowest price, and leads to that number's own page (/phone-plans/global…). The plans
 * used to open underneath the tiles, which made the page long and crowded.
 *
 * Links from before (#us, #europe, #global, #local-mn) are forwarded to the matching page.
 */

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import type { PhonePlan } from '@/lib/phone-plans';
import { groupPhonePlans, slugFromLegacyHash } from '@/lib/phone-groups';
import { PhoneGroupTile } from '@/components/sections/PhoneGroupTile';
import { PhoneFaq } from '@/components/sections/PhoneFaq';

const { useRouter } = createSharedPathnamesNavigation(routing);

export function PhonePlansCatalog({ plans }: { plans: PhonePlan[] }) {
  const t = useTranslations('phonePlans');
  const router = useRouter();
  const groups = useMemo(() => groupPhonePlans(plans), [plans]);

  useEffect(() => {
    const slug = slugFromLegacyHash(window.location.hash);
    if (slug && groups.some((g) => g.slug === slug)) router.replace(`/phone-plans/${slug}`);
  }, [groups, router]);

  if (plans.length === 0) {
    return <p className="mt-10 text-center text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="mt-8 space-y-10">
      <section aria-labelledby="phone-tiles-title">
        <h2 id="phone-tiles-title" className="text-lg font-bold text-gray-800">{t('tilesTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('tilesHint')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <PhoneGroupTile key={g.slug} group={g} />
          ))}
        </div>
      </section>

      <PhoneFaq />
    </div>
  );
}
