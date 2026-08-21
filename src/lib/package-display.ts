/**
 * Human-readable plan fields for abandoned checkouts (admin list + digest).
 * Prefers values already stored on the Paddle transaction; falls back to the
 * packages cache — the same lookup the paid-order webhook uses.
 */
import { formatDataVolume, type EsimPackage } from '@/lib/esimaccess';
import { getDbCachedPackages } from '@/lib/packagesCache';

export const CHECKOUT_LOCALES = ['en', 'he', 'ar', 'hi'] as const;
export type CheckoutLocale = (typeof CHECKOUT_LOCALES)[number];

export type PackageDisplayHints = {
  planId?: string | null;
  planName?: string | null;
  destinationName?: string | null;
  destinationSlug?: string | null;
};

export type PackageDisplay = {
  planId: string;
  packageName: string;
  destination: string;
  destinationSlug: string;
  dataAmount: string;
  validity: string;
};

export function asCheckoutLocale(raw?: string | null): CheckoutLocale {
  return CHECKOUT_LOCALES.includes(raw as CheckoutLocale) ? (raw as CheckoutLocale) : 'en';
}

export function sanitizeDestinationSlug(raw?: string | null): string {
  if (!raw) return '';
  return String(raw).toLowerCase().trim().replace(/[^a-z0-9-]/g, '').slice(0, 64);
}

export function buildPlanPagePath(locale: string | null | undefined, slug: string, planId: string): string {
  const safeSlug = sanitizeDestinationSlug(slug);
  const safeId = planId.trim();
  return `/${asCheckoutLocale(locale)}/destinations/${safeSlug}/plan/${encodeURIComponent(safeId)}`;
}

export function buildPlanPageUrl(
  locale: string | null | undefined,
  slug: string,
  planId: string,
): string | undefined {
  const safeSlug = sanitizeDestinationSlug(slug);
  const safeId = planId.trim();
  if (!safeSlug || !safeId) return undefined;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net').replace(/\/$/, '');
  return `${site}${buildPlanPagePath(locale, safeSlug, safeId)}`;
}

export function destinationLine(display: Pick<PackageDisplay, 'destination' | 'dataAmount' | 'validity'>): string {
  const spec = [display.dataAmount, display.validity].filter(Boolean).join(' / ');
  return [display.destination, spec].filter(Boolean).join(' · ');
}

export function resolvePackageDisplayFromList(
  packageList: EsimPackage[] | null | undefined,
  hints: PackageDisplayHints,
): PackageDisplay {
  const planId = (hints.planId ?? '').trim();
  let packageName = (hints.planName ?? '').trim();
  let destination = (hints.destinationName ?? '').trim();
  let destinationSlug = sanitizeDestinationSlug(hints.destinationSlug);
  let dataAmount = '';
  let validity = '';

  if (planId && packageList?.length) {
    const pkg = packageList.find((p) => p.packageCode === planId);
    if (pkg) {
      if (!packageName) packageName = pkg.name || planId;
      if (!destination) destination = pkg.location || pkg.locationCode || '';
      if (!destinationSlug) destinationSlug = sanitizeDestinationSlug(pkg.locationCode);
      if (pkg.volume != null) dataAmount = formatDataVolume(pkg.volume);
      if (pkg.duration != null) validity = `${pkg.duration} days`;
    }
  }

  return {
    planId,
    packageName: packageName || planId,
    destination,
    destinationSlug,
    dataAmount,
    validity,
  };
}

export async function loadCachedPackageList(): Promise<EsimPackage[] | null> {
  const cached = await getDbCachedPackages();
  return cached?.packageList ?? null;
}
