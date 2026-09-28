/**
 * Ticket 042 — show or hide parts of the homepage from the admin (Homepage Destinations page):
 * "Popular destinations", the "For you" shelf ("Pick up where you left off" / "Today's
 * recommended destination") and the "Instant activation worldwide" badge above the hero headline,
 * whose wording the admin can also replace per language. All shown unless the admin turns them off.
 *
 * One `SiteSetting` row. The live site's current code never reads it.
 */

import { prisma } from '@/lib/prisma';
import { cleanBadgeText, DEFAULT_HOMEPAGE_SECTIONS, type HomepageSections } from '@/lib/homepage-sections-shared';

export * from '@/lib/homepage-sections-shared';

export const HOMEPAGE_SECTIONS_KEY = 'homepage_sections';

export async function getHomepageSections(): Promise<HomepageSections> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: HOMEPAGE_SECTIONS_KEY } });
    if (!row) return DEFAULT_HOMEPAGE_SECTIONS;
    const parsed = JSON.parse(row.value) as Partial<HomepageSections>;
    return {
      popularDestinations: parsed.popularDestinations !== false,
      forYou: parsed.forYou !== false,
      activationBadge: parsed.activationBadge !== false,
      activationBadgeText: cleanBadgeText(parsed.activationBadgeText),
    };
  } catch {
    return DEFAULT_HOMEPAGE_SECTIONS;
  }
}

export async function saveHomepageSections(value: HomepageSections): Promise<void> {
  const json = JSON.stringify({ ...value, activationBadgeText: cleanBadgeText(value.activationBadgeText) });
  await prisma.siteSetting.upsert({
    where: { key: HOMEPAGE_SECTIONS_KEY },
    create: { key: HOMEPAGE_SECTIONS_KEY, value: json },
    update: { value: json },
  });
}
