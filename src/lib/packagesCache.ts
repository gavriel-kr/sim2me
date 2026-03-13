import { prisma } from '@/lib/prisma';
import { type EsimPackage } from '@/lib/esimaccess';

export const ALL_PACKAGES_DB_CACHE_KEY = 'packages_all_cache';
const DB_CACHE_REFRESH_MS = 60 * 60 * 1000; // 1 hour before background refresh

/**
 * Read all-packages from persistent DB cache.
 * Stale-while-revalidate: always returns data if available, marks as stale after 1h.
 * Returns null only if cache is completely missing.
 */
export async function getDbCachedPackages(): Promise<{ packageList: EsimPackage[]; stale: boolean } | null> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: ALL_PACKAGES_DB_CACHE_KEY } });
    if (!setting) return null;
    const cached = JSON.parse(setting.value) as { ts: number; packageList: EsimPackage[] };
    if (!cached.packageList?.length) return null;
    const stale = Date.now() - cached.ts > DB_CACHE_REFRESH_MS;
    return { packageList: cached.packageList, stale };
  } catch {
    return null;
  }
}

function buildCacheValue(packageList: EsimPackage[]): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const slim = packageList.map(({ locationNetworkList: _, ...rest }) => rest);
  return JSON.stringify({ ts: Date.now(), packageList: slim });
}

/**
 * Write all-packages to persistent DB cache (fire-and-forget).
 * Strips locationNetworkList to keep JSON small (~300KB vs ~5MB).
 */
export function setDbCachedPackages(packageList: EsimPackage[]): void {
  const value = buildCacheValue(packageList);
  prisma.siteSetting.upsert({
    where: { key: ALL_PACKAGES_DB_CACHE_KEY },
    create: { key: ALL_PACKAGES_DB_CACHE_KEY, value },
    update: { value },
  }).catch(() => {}); // non-critical, fire-and-forget
}

/**
 * Write all-packages to persistent DB cache (awaitable).
 * Use this when you need to confirm the write before responding.
 */
export async function setDbCachedPackagesAsync(packageList: EsimPackage[]): Promise<void> {
  const value = buildCacheValue(packageList);
  await prisma.siteSetting.upsert({
    where: { key: ALL_PACKAGES_DB_CACHE_KEY },
    create: { key: ALL_PACKAGES_DB_CACHE_KEY, value },
    update: { value },
  });
}
