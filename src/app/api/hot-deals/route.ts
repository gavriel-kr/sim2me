import { NextResponse } from 'next/server';
import { ensureTodayDeals, getHotDealsConfig } from '@/lib/hot-deals';
import { getTodayPhoneDeals, type PhoneDeal } from '@/lib/phone-deals';
import { getDbCachedPackages } from '@/lib/packagesCache';
import type { EsimPackage } from '@/lib/esimaccess';

export const dynamic = 'force-dynamic';

/**
 * Public hot deals for the homepage. Generates today's deals lazily on
 * first request; afterwards reflects admin pin/disable actions.
 */
export async function GET() {
  try {
    const [deals, cached, phoneDeals, config] = await Promise.all([
      ensureTodayDeals(),
      getDbCachedPackages(),
      getTodayPhoneDeals().catch((): PhoneDeal[] => []),
      getHotDealsConfig(),
    ]);
    if (deals.length === 0 && phoneDeals.length === 0) return NextResponse.json({ deals: [] });

    const pkgMap = new Map<string, EsimPackage>(
      (cached?.packageList ?? []).map((p: EsimPackage) => [p.packageCode, p])
    );

    // Deals expire (visually) at the end of the UTC day; checkout keeps a grace window.
    const endsAt = `${deals[0]?.dealDay ?? phoneDeals[0].dealDay}T23:59:59.999Z`;

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

    /*
      Ticket 042: up to two of the day's slots go to phone plans (computed, never stored — see
      lib/phone-deals.ts). They open each row of three, so a phone deal is always in sight.
    */
    const phonePayload = phoneDeals.map((d) => {
      const p = d.plan;
      const locationCode = p.region === 'us' ? 'US' : p.region === 'europe' ? 'EU' : p.region === 'global' ? 'GLOBAL' : p.numberCountry;
      return {
        id: `phone-${p.code}-${d.dealDay}`,
        packageCode: p.id,
        name: p.region === 'us' ? 'USA' : p.region === 'europe' ? 'Europe' : p.region === 'global' ? 'Global' : p.numberCountry,
        locationCode,
        flagCode: p.region === 'europe' ? 'eu' : p.region === 'global' ? 'un' : p.numberCountry.toLowerCase(),
        volume: p.dataGb * 1024 ** 3,
        duration: p.days,
        speed: p.speed,
        topUp: false,
        originalPrice: d.originalPrice,
        dealPrice: d.dealPrice,
        discountPercent: d.discountPercent,
        currency: 'USD',
        endsAt,
        phone: {
          region: p.region, numberCountry: p.numberCountry, dialCode: p.dialCode, voiceMinutes: p.voiceMinutes,
          sms: p.sms, coverageCount: p.coverage.length, renewable: p.renewable, dataGb: p.dataGb,
        },
      };
    });
    const esimSlots = Math.max(0, config.count - phonePayload.length);
    const esim = payload.slice(0, esimSlots);
    const merged: unknown[] = [];
    let pi = 0;
    let ei = 0;
    for (let pos = 0; pos < config.count && (pi < phonePayload.length || ei < esim.length); pos++) {
      const phoneTurn = pos % 3 === 0 && pi < phonePayload.length;
      if (phoneTurn || ei >= esim.length) merged.push(phonePayload[pi++]);
      else merged.push(esim[ei++]);
    }

    return NextResponse.json({ deals: merged.slice(0, config.count) });
  } catch (e) {
    console.error('[Hot deals]', e);
    return NextResponse.json({ deals: [] });
  }
}
