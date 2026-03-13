import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPackages, type EsimPackage } from '@/lib/esimaccess';

const ALL_PACKAGES_DB_CACHE_KEY = 'packages_all_cache';

/**
 * POST /api/admin/packages/refresh-cache
 * Fetches all packages from eSIMaccess and stores in DB cache.
 * Admin-only. Useful when the automatic refresh fails.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  const userType = (session?.user as { type?: string })?.type;
  if (!session || userType !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await getPackages('');
    const packageList: EsimPackage[] = result.packageList || [];

    if (packageList.length < 100) {
      return NextResponse.json({ error: 'eSIMaccess returned too few packages — may be "system busy". Try again.', count: packageList.length }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const slim = packageList.map(({ locationNetworkList: _, ...rest }) => rest);
    const value = JSON.stringify({ ts: Date.now(), packageList: slim });
    await prisma.siteSetting.upsert({
      where: { key: ALL_PACKAGES_DB_CACHE_KEY },
      create: { key: ALL_PACKAGES_DB_CACHE_KEY, value },
      update: { value },
    });

    return NextResponse.json({ ok: true, count: packageList.length, message: `Cached ${packageList.length} packages` });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
