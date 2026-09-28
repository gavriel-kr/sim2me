/**
 * Ticket 042 — the parts of `homepage-sections` the admin's browser code needs too: the shape of the
 * setting and the badge-text rules. Kept apart so a client component never pulls in Prisma.
 */

export const BADGE_LOCALES = ['he', 'en', 'ar', 'hi'] as const;
export type BadgeLocale = (typeof BADGE_LOCALES)[number];
export const BADGE_TEXT_MAX = 80;

export interface HomepageSections {
  popularDestinations: boolean;
  forYou: boolean;
  activationBadge: boolean;
  /** The admin's own wording, per language. A language left empty keeps the site's default text. */
  activationBadgeText: Partial<Record<BadgeLocale, string>>;
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSections = {
  popularDestinations: true,
  forYou: true,
  activationBadge: true,
  activationBadgeText: {},
};

/** Only the known languages, trimmed and capped; empty entries dropped. */
export function cleanBadgeText(raw: unknown): Partial<Record<BadgeLocale, string>> {
  const out: Partial<Record<BadgeLocale, string>> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const locale of BADGE_LOCALES) {
    const value = (raw as Record<string, unknown>)[locale];
    if (typeof value !== 'string') continue;
    const text = value.trim().slice(0, BADGE_TEXT_MAX);
    if (text) out[locale] = text;
  }
  return out;
}
