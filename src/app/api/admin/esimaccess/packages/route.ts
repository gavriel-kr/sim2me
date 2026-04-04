import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { getPackages, getBalance } from '@/lib/esimaccess';
import { setDbCachedPackages } from '@/lib/packagesCache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  try {
    const [packagesData, balanceData] = await Promise.all([
      getPackages(),
      getBalance(),
    ]);

    const packageList = packagesData.packageList || [];
    // Automatically update the public packages DB cache whenever admin fetches fresh data
    if (packageList.length >= 500) setDbCachedPackages(packageList);

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
