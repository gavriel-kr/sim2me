import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPackages, getBalance } from '@/lib/esimaccess';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
      packageList: packagesData.packageList || [],
      balance: (balanceData.balance ?? 0) / 10000, // convert from API units to USD
    });
  } catch (error) {
    console.error('[eSIMaccess packages error]', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
