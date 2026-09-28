/**
 * Ticket 042 (2026-09-28) — plans with a phone number, grouped by the kind of number, one page each.
 *
 * Gabriel: the phone-plans page listed every plan under its tiles and looked crowded, so each kind of
 * number now has its own page — /phone-plans/global, /phone-plans/usa, /phone-plans/europe, and one per
 * local number (/phone-plans/mongolia…). Everywhere on the site the order is global, then the USA,
 * then Europe, then the local numbers.
 *
 * Pure: works on the server and in the browser.
 */

import type { PhonePlan, PhoneRegion } from '@/lib/phone-plans';

export interface PhoneGroup<P extends Pick<PhonePlan, 'region' | 'numberCountry' | 'coverage' | 'coverageNames'> = PhonePlan> {
  /** URL segment under /phone-plans. */
  slug: string;
  region: PhoneRegion;
  /** ISO-2 of the number's country (US for global and USA, FR for Europe, the country for a local number). */
  numberCountry: string;
  plans: P[];
  /** Every country any plan in the group works in. */
  coverage: string[];
  /** Names for the few codes a browser cannot name (see PhonePlan.coverageNames). */
  coverageNames: Record<string, string>;
}

const REGION_RANK: Record<PhoneRegion, number> = { global: 0, us: 1, europe: 2, local: 3 };

/** "MN" → "mongolia", "MV" → "maldives": the English name, so the address reads the same in every language. */
export function countrySlug(code: string): string {
  let name = code;
  try {
    name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    name = code;
  }
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function groupSlugOf(plan: Pick<PhonePlan, 'region' | 'numberCountry'>): string {
  if (plan.region === 'global') return 'global';
  if (plan.region === 'us') return 'usa';
  if (plan.region === 'europe') return 'europe';
  return countrySlug(plan.numberCountry);
}

/** The groups in site order: global, USA, Europe, then local numbers by country slug. */
export function groupPhonePlans<P extends Pick<PhonePlan, 'region' | 'numberCountry' | 'coverage' | 'coverageNames'>>(plans: P[]): PhoneGroup<P>[] {
  const bySlug = new Map<string, PhoneGroup<P>>();
  for (const plan of plans) {
    const slug = groupSlugOf(plan);
    const group = bySlug.get(slug) ?? { slug, region: plan.region, numberCountry: plan.numberCountry, plans: [], coverage: [], coverageNames: {} };
    group.plans.push(plan);
    bySlug.set(slug, group);
  }
  for (const group of bySlug.values()) {
    group.coverage = [...new Set(group.plans.flatMap((p) => p.coverage))].sort();
    group.coverageNames = Object.assign({}, ...group.plans.map((p) => p.coverageNames ?? {}));
  }
  return [...bySlug.values()].sort(
    (a, b) => REGION_RANK[a.region] - REGION_RANK[b.region] || a.slug.localeCompare(b.slug),
  );
}

/** Old deep links (#us, #europe, #global, #local-mn) → the group's page slug. */
export function slugFromLegacyHash(hash: string): string | null {
  const key = hash.replace(/^#/, '');
  if (key === 'global' || key === 'europe') return key;
  if (key === 'us') return 'usa';
  const local = /^local-([a-z]{2})$/.exec(key);
  return local ? countrySlug(local[1]) : null;
}
