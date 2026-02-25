import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPackages } from '@/lib/esimaccess';

export const dynamic = 'force-dynamic';

/**
 * POST — Backfill supplierCost for orders that have NULL.
 * Looks up current wholesale price from eSIMaccess by packageCode.
 * Note: prices may have changed since original purchase; this is best-effort.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find orders with no supplierCost recorded
  const ordersToFill = await prisma.order.findMany({
    where: { supplierCost: null },
    select: { id: true, packageCode: true },
  });

  if (ordersToFill.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  // Fetch current package prices from eSIMaccess
  const { packageList } = await getPackages();
  const priceMap = new Map<string, number>();
  for (const pkg of packageList || []) {
    // price is in API units (10000 = $1.00)
    priceMap.set(pkg.packageCode, pkg.price / 10000);
  }

  let updated = 0;
  await Promise.all(
    ordersToFill.map(async (order) => {
      const cost = priceMap.get(order.packageCode);
      if (cost == null) return; // package no longer in API — skip
      await prisma.order.update({
        where: { id: order.id },
        data: { supplierCost: cost },
      });
      updated++;
    })
  );

  return NextResponse.json({ updated, total: ordersToFill.length });
}
