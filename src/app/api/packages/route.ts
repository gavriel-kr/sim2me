import { NextResponse, NextRequest } from 'next/server';
import { getPackages, type EsimPackage } from '@/lib/esimaccess';
import { prisma } from '@/lib/prisma';
import { getContinent } from '@/lib/continents';
import { getDbCachedPackages, setDbCachedPackages } from '@/lib/packagesCache';

export const dynamic = 'force-dynamic';

// In-memory stale cache: short-lived, used when DB is unavailable
const STALE_CACHE_MS = 15 * 60 * 1000;
const packagesCache = new Map<string, { packages: unknown[]; destinations: unknown[]; total: number; ts: number }>();

// eSIMaccess sometimes returns "system busy" for empty locationCode.
// Strategy: check DB cache first, then try empty locationCode, then curated seeds.
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
    const [overrides, featuredDestinations, apiData] = await Promise.all([
      prisma.packageOverride.findMany(),
      prisma.featuredDestination.findMany({ orderBy: { displayOrder: 'asc' } }),
      locationCode
        ? getPackages(locationCode)
        : (async () => {
            // 1. Try persistent DB cache (stale-while-revalidate: always serve if available)
            const dbCached = await getDbCachedPackages();
            if (dbCached) {
              // If stale, refresh in background without blocking response
              if (dbCached.stale) {
                getPackages('').then(r => {
                  if (r?.packageList?.length >= 500) setDbCachedPackages(r.packageList);
                }).catch(() => {});
              }
              return { packageList: dbCached.packageList };
            }

            // 2. Cache missing — try empty locationCode to get ALL packages (25s timeout)
            const allPkgs = await getPackages('').catch(() => null);
            if (allPkgs && allPkgs.packageList.length >= 500) {
              setDbCachedPackages(allPkgs.packageList);
              return allPkgs;
            }

            // 3. Last resort: fetch from curated seeds in parallel
            const seedStart = Date.now();
            const results = await Promise.all(
              FALLBACK_SEEDS.map((seed) => getPackages(seed).catch(() => ({ packageList: [] as EsimPackage[] })))
            );
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

    // Build set of admin-curated featured destination codes
    const featuredSet = new Set(featuredDestinations.map((f) => f.locationCode));

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
      displayOrder: number;
    }>();

    for (const pkg of packages) {
      const dataMB = pkg.volume > 0 ? Math.round(pkg.volume / (1024 * 1024)) : 0;
      const isFeatured = featuredSet.has(pkg.locationCode) || pkg.featured;
      const existing = destinationsMap.get(pkg.locationCode);
      if (existing) {
        existing.planCount++;
        existing.minPrice = Math.min(existing.minPrice, pkg.price);
        if (dataMB > existing.maxDataMB) existing.maxDataMB = dataMB;
        if (pkg.speed && !existing.speeds.includes(pkg.speed)) existing.speeds.push(pkg.speed);
        if (isFeatured) existing.featured = true;
      } else {
        const featuredEntry = featuredDestinations.find((f) => f.locationCode === pkg.locationCode);
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
          featured: isFeatured,
          displayOrder: featuredEntry?.displayOrder ?? 999,
        });
      }
    }

    // Sort: featured first (by displayOrder), then regions, then alphabetical
    const destinations = Array.from(destinationsMap.values())
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.featured && b.featured) return a.displayOrder - b.displayOrder;
        if (a.isRegional !== b.isRegional) return a.isRegional ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    const payload = { packages, destinations, total: packages.length };
    packagesCache.set(locationCode, { ...payload, ts: Date.now() });
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
