/**
 * Ticket 042 (2026-09-28) — one kind of phone number on its own page: /phone-plans/global, /usa,
 * /europe, or a local number's country (/phone-plans/mongolia). Its plans, where it works, its terms
 * and the FAQ. Reached from the tiles on /phone-plans, the homepage section and the hero card.
 */

import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { getPhonePlans } from '@/lib/phone-catalog';
import { sortPhonePlans, toPublicPhonePlan } from '@/lib/phone-plans';
import { applyPhoneDeals, getTodayPhoneDeals } from '@/lib/phone-deals';
import { groupPhonePlans } from '@/lib/phone-groups';
import { PhoneGroupClient } from './PhoneGroupClient';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
/** Always have a page, even while the catalogue is unreachable; local numbers only exist while sold. */
const FIXED_GROUPS = new Set(['global', 'usa', 'europe']);

type Props = { params: Promise<{ locale: string; group: string }> };

async function loadGroup(slug: string) {
  const plans = applyPhoneDeals(
    sortPhonePlans((await getPhonePlans()).filter((p) => p.visible)).map(toPublicPhonePlan),
    await getTodayPhoneDeals(),
  );
  return groupPhonePlans(plans).find((g) => g.slug === slug) ?? null;
}

async function groupTitle(slug: string, locale: string, numberCountry: string | null) {
  const t = await getTranslations({ locale, namespace: 'phonePlans' });
  if (slug === 'global') return t('regionGlobal', { count: 0 });
  if (slug === 'usa') return t('regionUs');
  if (slug === 'europe') return t('regionEurope');
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(numberCountry ?? '') ?? slug;
  } catch {
    return slug;
  }
}

export async function generateMetadata({ params }: Props) {
  const { locale, group: slug } = await params;
  const group = await loadGroup(slug).catch(() => null);
  const t = await getTranslations({ locale, namespace: 'phonePlans' });
  const title = await groupTitle(slug, locale, group?.numberCountry ?? null);
  return {
    title: `${title} – ${t('pageTitle')}`,
    description: t('pageSubtitle'),
    alternates: { canonical: `${siteUrl}/${locale}/phone-plans/${slug}` },
  };
}

export default async function PhoneGroupPage({ params }: Props) {
  const { locale, group: slug } = await params;
  setRequestLocale(locale);
  const group = await loadGroup(slug);
  if (!group && !FIXED_GROUPS.has(slug)) notFound();

  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <PhoneGroupClient
          slug={slug}
          group={group}
          figure={<CharacterFigure slot="phonePlansPagePair" height={110} heightLg={180} className="shrink-0" priority />}
        />
      </div>
    </MainLayout>
  );
}
