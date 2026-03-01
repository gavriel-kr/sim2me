import { API_BASE_URL } from '../nav';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getPackages(location?: string) {
  const q = location ? `?location=${encodeURIComponent(location)}` : '';
  const res = await apiFetch<{
    destinations: Array<{
      locationCode: string;
      name: string;
      flagCode: string;
      isRegional: boolean;
      planCount: number;
      minPrice: number;
      maxDataMB: number;
      speeds: string[];
      continent: string;
      featured: boolean;
    }>;
    packages: Array<{
      packageCode: string;
      name: string;
      slug: string;
      price: number;
      currencyCode: string;
      dataAmount: string;
      duration: string;
      speed: string;
      locationCode: string;
      flagCode: string;
      location: string;
      locationName?: string;
      isRegional: boolean;
      featured?: boolean;
      saleBadge?: string | null;
      topUp?: boolean;
    }>;
    total: number;
  }>(`/api/packages${q}`);
  const packages = (res.packages ?? []).map((p) => ({
    ...p,
    locationName: p.locationName ?? p.location ?? '',
  }));
  return { ...res, packages };
}

export { API_BASE_URL as API_BASE };
