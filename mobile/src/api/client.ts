const API_BASE = 'https://www.sim2me.net';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getPackages(location?: string) {
  const q = location ? `?location=${encodeURIComponent(location)}` : '';
  return apiFetch<{
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
      locationName: string;
      isRegional: boolean;
    }>;
    total: number;
  }>(`/api/packages${q}`);
}

export { API_BASE };
