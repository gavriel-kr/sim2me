import { NextResponse } from 'next/server';
import { ensureTodayDeals } from '@/lib/hot-deals';
import { getDbCachedPackages } from '@/lib/packagesCache';
import type { EsimPackage } from '@/lib/esimaccess';

export const dynamic = 'force-dynamic';

/**
 * Public hot deals for the homepage. Generates today's deals lazily on
 * first request; afterwards reflects admin pin/disable actions.
 */
export async function GET() {
  try {
    const [deals, cached] = await Promise.all([ensureTodayDeals(), getDbCachedPackages()]);
    if (deals.length === 0) return NextResponse.json({ deals: [] });

    const pkgMap = new Map<string, EsimPackage>(
      (cached?.packageList ?? []).map((p: EsimPackage) => [p.packageCode, p])
    );

    // Deals expire (visually) at the end of the UTC day; checkout keeps a grace window.
    const endsAt = `${deals[0].dealDay}T23:59:59.999Z`;

    const payload = deals.flatMap((deal) => {
      const pkg = pkgMap.get(deal.packageCode);
      if (!pkg) return []; // package vanished from supplier catalog — hide the deal
      return [{
        id: deal.id,
        packageCode: deal.packageCode,
        name: deal.packageName,
        locationCode: deal.locationCode,
        flagCode: deal.locationCode.length > 2 ? 'un' : deal.locationCode.toLowerCase(),
        volume: pkg.volume,
        duration: pkg.duration,
        speed: pkg.speed,
        topUp: pkg.supportTopUpType > 0,
        originalPrice: Number(deal.originalPrice),
        dealPrice: Number(deal.dealPrice),
        discountPercent: deal.discountPercent,
        currency: 'USD',
        endsAt,
      }];
    });

    return NextResponse.json({ deals: payload });
  } catch (e) {
    console.error('[Hot deals]', e);
    return NextResponse.json({ deals: [] });
  }
}
