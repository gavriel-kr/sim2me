import { NextResponse, NextRequest } from 'next/server';
import { getPackages } from '@/lib/esimaccess';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Public API: returns eSIMaccess packages merged with admin overrides.
 * - Only visible packages are returned
 * - Custom prices/titles/badges are applied
 * - Optional ?location=XX filter
 */
export async function GET(req: NextRequest) {
  const locationCode = req.nextUrl.searchParams.get('location') || '';

  try {
    // Fetch packages from eSIMaccess + overrides from DB in parallel
    const [apiData, overrides] = await Promise.all([
      getPackages(locationCode || undefined),
      prisma.packageOverride.findMany(),
    ]);

    const overrideMap = new Map(overrides.map((o) => [o.packageCode, o]));

    // Merge and filter
    const packages = (apiData.packageList || [])
      .map((pkg) => {
        const override = overrideMap.get(pkg.packageCode);
        const retailPriceUsd = pkg.retailPrice ? pkg.retailPrice / 10000 : pkg.price / 10000;
        
        return {
          packageCode: pkg.packageCode,
          slug: pkg.slug,
          name: override?.customTitle || pkg.name,
          originalName: pkg.name,
          price: override?.customPrice ? Number(override.customPrice) : retailPriceUsd,
          wholesalePrice: pkg.price / 10000,
          currency: 'USD',
          volume: pkg.volume,
          duration: pkg.duration,
          durationUnit: pkg.durationUnit || 'DAY',
          location: pkg.location,
          locationCode: pkg.locationCode,
          description: pkg.description,
          speed: pkg.speed,
          topUp: pkg.supportTopUpType > 0,
          visible: override?.visible ?? true,
          featured: override?.featured ?? false,
          saleBadge: override?.saleBadge || null,
          sortOrder: override?.sortOrder ?? 0,
        };
      })
      .filter((p) => p.visible)
      .sort((a, b) => {
        // Featured first, then by sortOrder, then by price
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.price - b.price;
      });

    // Group by locationCode for destinations list
    const destinationsMap = new Map<string, {
      locationCode: string;
      location: string;
      planCount: number;
      minPrice: number;
      featured: boolean;
    }>();

    for (const pkg of packages) {
      const existing = destinationsMap.get(pkg.locationCode);
      if (existing) {
        existing.planCount++;
        existing.minPrice = Math.min(existing.minPrice, pkg.price);
        if (pkg.featured) existing.featured = true;
      } else {
        destinationsMap.set(pkg.locationCode, {
          locationCode: pkg.locationCode,
          location: pkg.location,
          planCount: 1,
          minPrice: pkg.price,
          featured: pkg.featured,
        });
      }
    }

    const destinations = Array.from(destinationsMap.values())
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.location.localeCompare(b.location);
      });

    return NextResponse.json({
      packages,
      destinations,
      total: packages.length,
    });
  } catch (error) {
    console.error('[Public packages error]', error);
    return NextResponse.json(
      { error: (error as Error).message, packages: [], destinations: [] },
      { status: 500 }
    );
  }
}
