'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, Globe } from 'lucide-react';

interface Package {
  packageCode: string;
  name: string;
  price: number;
  currencyCode: string;
  volume: number;
  duration: number;
  location: string;
  locationCode: string;
  speed: string;
}

export function PackagesClient() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  async function fetchPackages() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/esimaccess/packages');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPackages(data.packageList || []);
      setBalance(data.balance ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPackages(); }, []);

  const filtered = packages.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase()) ||
    p.locationCode?.toLowerCase().includes(search.toLowerCase())
  );

  const formatVolume = (bytes: number) => {
    if (bytes < 0) return 'Unlimited';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
    return `${bytes} B`;
  };

  const formatPrice = (apiUnits: number) => {
    return `$${(apiUnits / 10000).toFixed(2)}`;
  };

  return (
    <div className="mt-6">
      {/* Balance + controls */}
      <div className="flex flex-wrap items-center gap-4">
        {balance !== null && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm">
            <span className="text-gray-600">Account Balance: </span>
            <span className="font-bold text-emerald-700">${balance.toFixed(2)}</span>
          </div>
        )}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <button
          onClick={fetchPackages}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="mt-4 text-xs text-gray-500">
          Showing {filtered.length} of {packages.length} packages
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      )}

      {/* Package grid */}
      {!loading && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 100).map((pkg) => (
            <div
              key={pkg.packageCode}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold text-gray-900">{pkg.location}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{pkg.name}</p>
                </div>
                <span className="text-lg font-bold text-emerald-600">
                  {formatPrice(pkg.price)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {formatVolume(pkg.volume)}
                </span>
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                  {pkg.duration} days
                </span>
                {pkg.speed && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {pkg.speed}
                  </span>
                )}
              </div>
              <p className="mt-2 font-mono text-[10px] text-gray-400">{pkg.packageCode}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
