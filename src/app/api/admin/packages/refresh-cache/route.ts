import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPackages } from '@/lib/esimaccess';
import { setDbCachedPackagesAsync } from '@/lib/packagesCache';

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
    const packageList = result.packageList || [];

    if (packageList.length < 100) {
      return NextResponse.json({ error: 'eSIMaccess returned too few packages — may be "system busy". Try again.', count: packageList.length }, { status: 503 });
    }

    await setDbCachedPackagesAsync(packageList);

    return NextResponse.json({ ok: true, count: packageList.length, message: `Cached ${packageList.length} packages` });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
