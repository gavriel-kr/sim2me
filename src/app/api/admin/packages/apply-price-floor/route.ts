import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPackages } from '@/lib/esimaccess';

export const dynamic = 'force-dynamic';

const FLOOR_MIN = 0.55; // packages at or above this price...
const FLOOR_MAX = 0.70; // ...but below this get raised to FLOOR_PRICE
const FLOOR_PRICE = 0.70;

/**
 * POST — Apply $0.70 price floor to all packages priced $0.55–$0.69.
 * Creates or updates PackageOverride.customPrice = 0.70 for qualifying packages.
 * All other override fields (visibility, paddlePriceId, etc.) are preserved.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { packageList } = await getPackages();
  if (!packageList?.length) {
    return NextResponse.json({ updated: 0, packageCodes: [] });
  }

  // Fetch existing overrides so we can preserve other fields on upsert
  const existingOverrides = await prisma.packageOverride.findMany();
  const overrideMap = new Map(existingOverrides.map((o) => [o.packageCode, o]));

  const qualifying: string[] = [];

  for (const pkg of packageList) {
    const retailUsd = (pkg.retailPrice ?? pkg.price) / 10000;
    if (retailUsd >= FLOOR_MIN && retailUsd < FLOOR_MAX) {
      qualifying.push(pkg.packageCode);
    }
  }

  if (qualifying.length === 0) {
    return NextResponse.json({ updated: 0, packageCodes: [] });
  }

  // Upsert each qualifying package — preserve all existing override fields
  await Promise.all(
    qualifying.map((packageCode) => {
      const existing = overrideMap.get(packageCode);
      return prisma.packageOverride.upsert({
        where: { packageCode },
        update: { customPrice: FLOOR_PRICE },
        create: {
          packageCode,
          customPrice: FLOOR_PRICE,
          visible: existing?.visible ?? true,
          customTitle: existing?.customTitle ?? null,
          paddlePriceId: existing?.paddlePriceId ?? null,
          saleBadge: existing?.saleBadge ?? null,
          featured: existing?.featured ?? false,
          sortOrder: existing?.sortOrder ?? 0,
          notes: existing?.notes ?? null,
        },
      });
    })
  );

  return NextResponse.json({ updated: qualifying.length, packageCodes: qualifying });
}
