import { NextResponse, NextRequest } from 'next/server';
import { getPackages, type EsimPackage } from '@/lib/esimaccess';
import { prisma } from '@/lib/prisma';
import { getContinent } from '@/lib/continents';

export const dynamic = 'force-dynamic';

// Stale cache: when eSIMaccess returns "system busy", serve last good response (up to 15 min)
const STALE_CACHE_MS = 15 * 60 * 1000;
const packagesCache = new Map<string, { packages: unknown[]; destinations: unknown[]; total: number; ts: number }>();

// eSIMaccess sometimes returns "system busy" for empty locationCode.
// Strategy: try empty first (gets ALL packages in one call). If it fails, use curated seeds.
const FALLBACK_SEEDS = [
  // Americas
  'US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL',
  // Europe
  'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'PT', 'GR', 'PL', 'SE', 'TR', 'CH',
  // Asia-Pacific
  'JP', 'KR', 'CN', 'TH', 'VN', 'SG', 'MY', 'ID', 'IN', 'AU', 'NZ',
  // Middle East & Africa
  'AE', 'IL', 'SA', 'EG', 'MA', 'ZA',
  // Regional bundles
  'EU-42', 'AS-20', 'NA-3',
];

// ─── Regional code → friendly name & flag ────────────────────
const REGION_NAMES: Record<string, { name: string; flag: string }> = {
  'EU-42': { name: 'Europe (42 countries)', flag: 'eu' },
  'EU-43': { name: 'Europe (43 countries)', flag: 'eu' },
  'EU-30': { name: 'Europe (30+ countries)', flag: 'eu' },
  'EU-7':  { name: 'Western Europe', flag: 'eu' },
  'NA-3':  { name: 'North America', flag: 'us' },
  'USCA-2':{ name: 'USA & Canada', flag: 'us' },
  'SA-18': { name: 'South America', flag: 'br' },
  'AF-29': { name: 'Africa', flag: 'za' },
  'AS-7':  { name: 'Asia (7 countries)', flag: 'sg' },
  'AS-20': { name: 'Asia (20 countries)', flag: 'sg' },
  'AS-21': { name: 'Asia (21 countries)', flag: 'sg' },
  'AS-12': { name: 'Southeast Asia', flag: 'sg' },
  'AS-5':  { name: 'East Asia', flag: 'jp' },
  'ME-13': { name: 'Middle East', flag: 'ae' },
  'ME-6':  { name: 'Middle East (6 countries)', flag: 'ae' },
  'ME-12': { name: 'Middle East (12 countries)', flag: 'ae' },
  'GL-139':{ name: 'Global (139 countries)', flag: 'un' },
  'GL-120':{ name: 'Global (120 countries)', flag: 'un' },
  'CB-25': { name: 'Caribbean', flag: 'jm' },
  'CN-3':  { name: 'Greater China', flag: 'cn' },
  'CNHK-2':{ name: 'China & Hong Kong', flag: 'cn' },
  'CNJPKR-3':{ name: 'China, Japan & Korea', flag: 'jp' },
  'SGMYTH-3':{ name: 'Singapore, Malaysia & Thailand', flag: 'sg' },
  'SGMY-2':{ name: 'Singapore & Malaysia', flag: 'sg' },
  'SGMYVNTHID-5':{ name: 'Southeast Asia (5 countries)', flag: 'sg' },
  'AUNZ-2':{ name: 'Australia & New Zealand', flag: 'au' },
  'SAAEQAKWOMBH-6':{ name: 'Gulf States', flag: 'ae' },
};

function isRegionalCode(code: string): boolean {
  return code.length > 2;
}

/**
 * Extract country name from package name by removing data/duration suffix.
 * e.g. "United States 20GB 30Days" -> "United States"
 * e.g. "Hong Kong (China) 500MB/Day" -> "Hong Kong (China)"
 */
function extractCountryName(packageName: string): string {
  // Remove common suffixes: "1GB 7Days", "500MB/Day", "100MB 7Days", "20GB 30Days", etc.
  return packageName
    .replace(/\s+\d+(\.\d+)?\s*(GB|MB|TB|KB)(\/Day)?\s*.*$/i, '')
    .replace(/\s+Unlimited.*$/i, '')
    .trim();
}

// Cache: locationCode -> country name (built from first package seen)
const countryNameCache = new Map<string, string>();

function getDestinationName(locationCode: string, location: string, packageName?: string): string {
  if (isRegionalCode(locationCode)) {
    return REGION_NAMES[locationCode]?.name || `Region (${locationCode})`;
  }
  // Check cache first
  if (countryNameCache.has(locationCode)) {
    return countryNameCache.get(locationCode)!;
  }
  // Extract from package name (most reliable)
  if (packageName) {
    const extracted = extractCountryName(packageName);
    if (extracted && extracted.length > 2) {
      countryNameCache.set(locationCode, extracted);
      return extracted;
    }
  }
  return location;
}

function getFlagCode(locationCode: string): string {
  if (isRegionalCode(locationCode)) {
    return REGION_NAMES[locationCode]?.flag || 'un';
  }
  return locationCode.toLowerCase();
}

/**
 * Public API: returns eSIMaccess packages merged with admin overrides.
 * - Only visible packages are returned
 * - Custom prices/titles/badges are applied
 * - Regional packages get proper names
 * - Optional ?location=XX filter
 */
export async function GET(req: NextRequest) {
  const locationCode = req.nextUrl.searchParams.get('location') || '';

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7158f'},body:JSON.stringify({sessionId:'f7158f',location:'route.ts:GET-start',message:'packages API called',data:{locationCode,ts:Date.now()},timestamp:Date.now(),hypothesisId:'A',runId:'run1'})}).catch(()=>{});
    // #endregion
    const [overrides, apiData] = await Promise.all([
      prisma.packageOverride.findMany(),
      locationCode
        ? getPackages(locationCode)
        : (async () => {
            // Try empty locationCode first — returns ALL packages in one call when API cooperates
            const allPkgs = await getPackages('').catch(() => null);
            if (allPkgs && allPkgs.packageList.length > 0) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7158f'},body:JSON.stringify({sessionId:'f7158f',location:'route.ts:all-pkgs',message:'empty locationCode succeeded',data:{count:allPkgs.packageList.length},timestamp:Date.now(),hypothesisId:'A',runId:'run1'})}).catch(()=>{});
              // #endregion
              return allPkgs;
            }
            // Fallback: fetch from curated seeds in parallel
            const seedStart = Date.now();
            const results = await Promise.all(
              FALLBACK_SEEDS.map((seed) => getPackages(seed).catch(() => ({ packageList: [] as EsimPackage[] })))
            );
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7158f'},body:JSON.stringify({sessionId:'f7158f',location:'route.ts:seeds-done',message:'seed fallback completed',data:{durationMs:Date.now()-seedStart,pkgCounts:results.map(r=>r.packageList?.length??0)},timestamp:Date.now(),hypothesisId:'A',runId:'run1'})}).catch(()=>{});
            // #endregion
            const seen = new Set<string>();
            const merged: EsimPackage[] = [];
            for (const r of results) {
              for (const p of r.packageList || []) {
                if (!seen.has(p.packageCode)) {
                  seen.add(p.packageCode);
                  merged.push(p);
                }
              }
            }
            return { packageList: merged };
          })(),
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
          price: override?.customPrice != null ? Number(override.customPrice) : retailPriceUsd,
          wholesalePrice: pkg.price / 10000,
          currency: 'USD',
          volume: pkg.volume,
          duration: pkg.duration,
          durationUnit: pkg.durationUnit || 'DAY',
          location: getDestinationName(pkg.locationCode, pkg.location, pkg.name),
          locationCode: pkg.locationCode,
          flagCode: getFlagCode(pkg.locationCode),
          isRegional: isRegionalCode(pkg.locationCode),
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
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.price - b.price;
      });

    // Group by locationCode for destinations list
    const destinationsMap = new Map<string, {
      locationCode: string;
      name: string;
      flagCode: string;
      isRegional: boolean;
      continent: string;
      planCount: number;
      minPrice: number;
      maxDataMB: number;
      speeds: string[];
      featured: boolean;
    }>();

    for (const pkg of packages) {
      const dataMB = pkg.volume > 0 ? Math.round(pkg.volume / (1024 * 1024)) : 0;
      const existing = destinationsMap.get(pkg.locationCode);
      if (existing) {
        existing.planCount++;
        existing.minPrice = Math.min(existing.minPrice, pkg.price);
        if (dataMB > existing.maxDataMB) existing.maxDataMB = dataMB;
        if (pkg.speed && !existing.speeds.includes(pkg.speed)) existing.speeds.push(pkg.speed);
        if (pkg.featured) existing.featured = true;
      } else {
        destinationsMap.set(pkg.locationCode, {
          locationCode: pkg.locationCode,
          name: pkg.location,
          flagCode: pkg.flagCode,
          isRegional: pkg.isRegional,
          continent: getContinent(pkg.locationCode),
          planCount: 1,
          minPrice: pkg.price,
          maxDataMB: dataMB,
          speeds: pkg.speed ? [pkg.speed] : [],
          featured: pkg.featured,
        });
      }
    }

    // Sort: featured first, then regions first, then alphabetical
    const destinations = Array.from(destinationsMap.values())
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.isRegional !== b.isRegional) return a.isRegional ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    const payload = { packages, destinations, total: packages.length };
    packagesCache.set(locationCode, { ...payload, ts: Date.now() });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7158f'},body:JSON.stringify({sessionId:'f7158f',location:'route.ts:success',message:'packages API returning data',data:{pkgCount:packages.length,destCount:destinations.length},timestamp:Date.now(),hypothesisId:'A',runId:'run1'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(payload);
  } catch (error) {
    const errMsg = (error as Error).message;
    const isBusy = /system is busy|try again|busy/i.test(errMsg);
    if (isBusy) {
      const cached = packagesCache.get(locationCode);
      if (cached && Date.now() - cached.ts < STALE_CACHE_MS && cached.destinations.length > 0) {
        return NextResponse.json({ packages: cached.packages, destinations: cached.destinations, total: cached.total });
      }
    }
    console.error('[Public packages error]', error);
    return NextResponse.json(
      { error: errMsg, packages: [], destinations: [] },
      { status: 500 }
    );
  }
}
