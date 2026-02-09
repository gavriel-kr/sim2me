import type { Destination } from '@/types';

const API_BASE = typeof window !== 'undefined'
  ? ''  // client-side: relative URL
  : (process.env.NEXTAUTH_URL || 'http://localhost:3000');  // server-side: absolute URL

/**
 * Fetches real destinations from the public packages API.
 * Each unique locationCode from eSIMaccess becomes a destination.
 */
export async function getDestinations(): Promise<Destination[]> {
  try {
    const res = await fetch(`${API_BASE}/api/packages`, {
      next: { revalidate: 300 }, // cache for 5 min
    });
    if (!res.ok) throw new Error('Failed to fetch destinations');
    const data = await res.json();

    return (data.destinations || []).map((d: {
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
    }) => ({
      id: d.locationCode.toLowerCase(),
      name: d.name || d.locationCode,
      slug: d.locationCode.toLowerCase(),
      region: d.continent || '',
      isoCode: d.locationCode,
      flagUrl: d.flagCode
        ? `https://flagcdn.com/w80/${d.flagCode}.png`
        : `https://flagcdn.com/w80/${d.locationCode.toLowerCase()}.png`,
      popular: d.featured,
      operatorCount: 1,
      planCount: d.planCount,
      fromPrice: d.minPrice,
      fromCurrency: 'USD',
    }));
  } catch (err) {
    console.error('[getDestinations error]', err);
    return [];
  }
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const destinations = await getDestinations();
  return destinations.find((d) => d.slug === slug) ?? null;
}

export async function searchDestinations(query: string): Promise<Destination[]> {
  const destinations = await getDestinations();
  if (!query.trim()) return destinations;
  const q = query.toLowerCase().trim();

  return destinations.filter(
    (d) =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.slug || '').toLowerCase().includes(q) ||
      (d.isoCode || '').toLowerCase().includes(q)
  );
}
