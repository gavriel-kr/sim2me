import { NextResponse } from 'next/server';
import { getPackages } from '@/lib/esimaccess';
import { setDbCachedPackagesAsync } from '@/lib/packagesCache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // allow up to 60s for the eSIMaccess call

/**
 * GET /api/cron/refresh-packages
 * Called automatically by Vercel Cron every 3 hours.
 * Auth: Vercel injects Authorization: Bearer <CRON_SECRET> automatically.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await getPackages('');
    const packageList = result.packageList || [];

    if (packageList.length < 500) {
      return NextResponse.json(
        { ok: false, message: 'eSIMaccess returned too few packages — system may be busy', count: packageList.length },
        { status: 503 }
      );
    }

    await setDbCachedPackagesAsync(packageList);
    return NextResponse.json({ ok: true, count: packageList.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
