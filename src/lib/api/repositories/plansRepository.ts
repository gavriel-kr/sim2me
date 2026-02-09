import type { Plan, NetworkType } from '@/types';

const API_BASE = typeof window !== 'undefined'
  ? ''
  : (process.env.NEXTAUTH_URL || 'http://localhost:3000');

/**
 * Fetches real plans for a destination (locationCode) from the public packages API.
 */
export async function getPlansByDestination(destinationId: string): Promise<Plan[]> {
  try {
    const locationCode = destinationId.toUpperCase();
    const res = await fetch(`${API_BASE}/api/packages?location=${locationCode}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error('Failed to fetch plans');
    const data = await res.json();

    return (data.packages || []).map((pkg: {
      packageCode: string;
      slug: string;
      name: string;
      price: number;
      currency: string;
      volume: number;
      duration: number;
      speed: string;
      topUp: boolean;
      featured: boolean;
      saleBadge: string | null;
      locationCode: string;
    }) => {
      // Determine network type from speed string
      let networkType: NetworkType = '4G';
      if (pkg.speed?.includes('5G')) networkType = '5G';
      else if (pkg.speed?.includes('3G')) networkType = '3G';

      // Format data display
      const volumeBytes = pkg.volume;
      let dataDisplay: string;
      let dataAmountMb: number;
      if (volumeBytes < 0) {
        dataDisplay = 'Unlimited';
        dataAmountMb = -1;
      } else {
        const gb = volumeBytes / (1024 * 1024 * 1024);
        const mb = volumeBytes / (1024 * 1024);
        dataAmountMb = mb;
        dataDisplay = gb >= 1
          ? `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`
          : `${mb.toFixed(0)} MB`;
      }

      return {
        id: pkg.packageCode,
        destinationId: pkg.locationCode.toLowerCase(),
        name: pkg.name,
        dataAmount: dataAmountMb,
        dataDisplay,
        days: pkg.duration,
        price: pkg.price,
        currency: pkg.currency || 'USD',
        networkType,
        speed: pkg.speed,
        tethering: true,
        topUps: pkg.topUp,
        operatorName: pkg.speed || 'eSIMaccess',
        popular: pkg.featured,
        saleBadge: pkg.saleBadge,
      };
    });
  } catch (err) {
    console.error('[getPlansByDestination error]', err);
    return [];
  }
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  // Fetch all packages and find the one with matching packageCode
  try {
    const res = await fetch(`${API_BASE}/api/packages`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();

    const pkg = (data.packages || []).find((p: { packageCode: string }) => p.packageCode === planId);
    if (!pkg) return null;

    let networkType: NetworkType = '4G';
    if (pkg.speed?.includes('5G')) networkType = '5G';
    else if (pkg.speed?.includes('3G')) networkType = '3G';

    const volumeBytes = pkg.volume;
    let dataDisplay: string;
    let dataAmountMb: number;
    if (volumeBytes < 0) {
      dataDisplay = 'Unlimited';
      dataAmountMb = -1;
    } else {
      const gb = volumeBytes / (1024 * 1024 * 1024);
      const mb = volumeBytes / (1024 * 1024);
      dataAmountMb = mb;
      dataDisplay = gb >= 1
        ? `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`
        : `${mb.toFixed(0)} MB`;
    }

    return {
      id: pkg.packageCode,
      destinationId: pkg.locationCode.toLowerCase(),
      name: pkg.name,
      dataAmount: dataAmountMb,
      dataDisplay,
      days: pkg.duration,
      price: pkg.price,
      currency: pkg.currency || 'USD',
      networkType,
      speed: pkg.speed,
      tethering: true,
      topUps: pkg.topUp,
      operatorName: pkg.speed || 'eSIMaccess',
      popular: pkg.featured,
    };
  } catch (err) {
    console.error('[getPlanById error]', err);
    return null;
  }
}
