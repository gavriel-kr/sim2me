/**
 * Ticket 042 — loads PikaSim's phone catalogue and applies our rules and the admin's overrides.
 *
 * Overrides reuse the existing `PackageOverride` table, keyed by the product id (`pk:<code>`), so no
 * schema change is needed and the admin edits them through the same endpoint as eSIMaccess plans.
 * The live site's code ignores those keys: it only ever looks overrides up by eSIMaccess codes.
 */

import { prisma } from '@/lib/prisma';
import { getPhoneCatalog, isPikaSimConfigured } from '@/lib/pikasim';
import {
  buildPhonePlan,
  sortPhonePlans,
  type PhoneOverride,
  type PhonePlanFull,
} from '@/lib/phone-plans';
import { parseProductId } from '@/lib/product-id';

export async function loadPhoneOverrides(): Promise<Map<string, PhoneOverride>> {
  const rows = await prisma.packageOverride.findMany({ where: { packageCode: { startsWith: 'pk:' } } });
  return new Map(
    rows.map((o: (typeof rows)[number]) => [
      o.packageCode,
      {
        visible: o.visible,
        customPrice: o.customPrice != null ? Number(o.customPrice) : null,
        customTitle: o.customTitle,
        featured: o.featured,
        saleBadge: o.saleBadge,
        sortOrder: o.sortOrder,
      },
    ]),
  );
}

/** Every phone plan with our price and visibility. Empty when PikaSim is not configured or down. */
export async function getPhonePlans(): Promise<PhonePlanFull[]> {
  if (!isPikaSimConfigured()) return [];
  try {
    const [catalog, overrides] = await Promise.all([getPhoneCatalog(), loadPhoneOverrides()]);
    return sortPhonePlans(catalog.map((pkg) => buildPhonePlan(pkg, overrides.get(`pk:${pkg.packageCode}`))));
  } catch (e) {
    console.warn('[phone-catalog] PikaSim catalogue unavailable', e instanceof Error ? e.message : e);
    return [];
  }
}

/** One plan by product id, for checkout and fulfilment. Throws when PikaSim cannot be reached. */
export async function getPhonePlanById(productId: string): Promise<PhonePlanFull | null> {
  const ref = parseProductId(productId);
  if (ref.kind !== 'pika') return null;
  // Checkout and fulfilment: always ask PikaSim, even right after a failed page render did.
  const [catalog, overrides] = await Promise.all([getPhoneCatalog({ patient: true }), loadPhoneOverrides()]);
  const pkg = catalog.find((p) => p.packageCode === ref.code);
  return pkg ? buildPhonePlan(pkg, overrides.get(productId)) : null;
}
