import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPackages, getBalance, type EsimPackage } from '@/lib/esimaccess';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALL_PACKAGES_DB_CACHE_KEY = 'packages_all_cache';

/** Persist package list to DB cache so the public /api/packages route can serve them (fire-and-forget). */
function persistToPublicCache(packageList: EsimPackage[]): void {
  if (packageList.length < 500) return;
  const value = JSON.stringify({ ts: Date.now(), packageList });
  prisma.siteSetting.upsert({
    where: { key: ALL_PACKAGES_DB_CACHE_KEY },
    create: { key: ALL_PACKAGES_DB_CACHE_KEY, value },
    update: { value },
  }).catch(() => {});
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [packagesData, balanceData] = await Promise.all([
      getPackages(),
      getBalance(),
    ]);

    const packageList = packagesData.packageList || [];
    // Automatically update the public packages cache whenever admin fetches fresh data
    persistToPublicCache(packageList);

    return NextResponse.json({
      packageList,
      balance: (balanceData.balance ?? 0) / 10000,
    });
  } catch (error) {
    console.error('[eSIMaccess packages error]', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
