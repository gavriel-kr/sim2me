'use client';

import { useState, useEffect } from 'react';
import { Search, Star, StarOff, Save, Loader2, GripVertical, Info } from 'lucide-react';

interface DestItem {
  locationCode: string;
  name: string;
  flagCode: string;
  continent: string;
  planCount: number;
  minPrice: number;
}

interface Props {
  initialFeatured: string[];
}

export function DestinationsClient({ initialFeatured }: Props) {
  const [allDestinations, setAllDestinations] = useState<DestItem[]>([]);
  const [featured, setFeatured] = useState<string[]>(initialFeatured);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [continent, setContinent] = useState('All');

  useEffect(() => {
    fetch('/api/packages')
      .then((r) => r.json())
      .then((data) => {
        const dests: DestItem[] = (data.destinations || [])
          .filter((d: { locationCode: string }) => d.locationCode.length === 2)
          .map((d: { locationCode: string; name: string; flagCode: string; continent: string; planCount: number; minPrice: number }) => ({
            locationCode: d.locationCode,
            name: d.name,
            flagCode: d.flagCode,
            continent: d.continent,
            planCount: d.planCount,
            minPrice: d.minPrice,
          }));
        setAllDestinations(dests);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // European defaults — what shows on homepage when nothing is configured
  const europeanDefaults = allDestinations
    .filter((d) => d.continent === 'Europe')
    .slice(0, 8);

  const isUsingDefaults = featured.length === 0;

  const continents = ['All', ...Array.from(new Set(allDestinations.map((d) => d.continent))).sort()];

  const filtered = allDestinations.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.locationCode.toLowerCase().includes(search.toLowerCase());
    const matchContinent = continent === 'All' || d.continent === continent;
    return matchSearch && matchContinent;
  });

  const toggle = (code: string) => {
    setFeatured((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
    setSaveOk(false);
  };

  const moveUp = (code: string) => {
    setFeatured((prev) => {
      const idx = prev.indexOf(code);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    setSaveOk(false);
  };

  const moveDown = (code: string) => {
    setFeatured((prev) => {
      const idx = prev.indexOf(code);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
    setSaveOk(false);
  };

  const save = async () => {
    setSaving(true);
    setSaveOk(false);
    try {
      await fetch('/api/admin/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationCodes: featured }),
      });
      setSaveOk(true);
    } finally {
      setSaving(false);
    }
  };

  const getFlagUrl = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  const getDestInfo = (code: string) => allDestinations.find((d) => d.locationCode === code);

  return (
    <div className="mt-6 space-y-6">
      {/* Featured list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {isUsingDefaults ? 'Currently showing (default — Europe)' : 'Featured on Homepage'}
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {isUsingDefaults ? europeanDefaults.length : featured.length}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {isUsingDefaults
                ? 'No custom selection saved. European countries are shown by default. Pick destinations below to override.'
                : 'These destinations appear on the homepage in this order.'}
            </p>
          </div>
          {!isUsingDefaults && (
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : saveOk ? 'Saved ✓' : 'Save'}
            </button>
          )}
        </div>

        {/* Default mode — show European countries as read-only preview */}
        {isUsingDefaults && !loading && (
          <div>
            <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">
                Select destinations from the list below and click <strong>Save</strong> to override these defaults.
              </p>
            </div>
            <ul className="divide-y divide-gray-50">
              {europeanDefaults.map((d, idx) => (
                <li key={d.locationCode} className="flex items-center gap-3 px-5 py-3 opacity-70">
                  <span className="w-5 text-xs font-mono text-gray-400">{idx + 1}</span>
                  <img src={getFlagUrl(d.flagCode || d.locationCode)} alt="" className="h-5 w-7 rounded object-cover shadow-sm ring-1 ring-black/5" />
                  <span className="flex-1 text-sm text-gray-700">{d.name}</span>
                  <span className="text-xs text-gray-400">{d.continent}</span>
                  {d.minPrice > 0 && (
                    <span className="text-xs font-medium text-emerald-600">${d.minPrice.toFixed(2)}</span>
                  )}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">default</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Custom configured list */}
        {!isUsingDefaults && (
          <ul className="divide-y divide-gray-50">
            {featured.map((code, idx) => {
              const info = getDestInfo(code);
              return (
                <li key={code} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(code)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▲</button>
                    <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                    <button onClick={() => moveDown(code)} disabled={idx === featured.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-xs">▼</button>
                  </div>
                  <span className="w-5 text-xs font-mono text-gray-400">{idx + 1}</span>
                  <img src={getFlagUrl(code)} alt="" className="h-5 w-7 rounded object-cover shadow-sm ring-1 ring-black/5" />
                  <span className="flex-1 text-sm font-medium text-gray-900">{info?.name ?? code}</span>
                  <span className="text-xs text-gray-400">{info?.continent}</span>
                  {info && info.minPrice > 0 && (
                    <span className="text-xs font-medium text-emerald-600">${info.minPrice.toFixed(2)}</span>
                  )}
                  <button
                    onClick={() => toggle(code)}
                    className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 transition hover:bg-red-50"
                  >
                    <StarOff className="h-3.5 w-3.5" /> Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Save button at bottom when custom list exists */}
        {!isUsingDefaults && (
          <div className="border-t border-gray-100 px-5 py-3 flex justify-between items-center">
            <button
              onClick={() => { setFeatured([]); setSaveOk(false); }}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              Reset to defaults
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : saveOk ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* All destinations picker */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">All Destinations</h2>
          <div className="mt-3 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search country…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <select
              value={continent}
              onChange={(e) => setContinent(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            >
              {continents.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="border-b border-gray-100 px-5 py-2.5 flex justify-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  {saving ? 'Saving…' : saveOk ? 'Saved ✓' : `Save (${featured.length} selected)`}
                </button>
              </div>
            )}
            <div className="grid gap-1 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((d) => {
                const isFeatured = featured.includes(d.locationCode);
                const isDefault = isUsingDefaults && europeanDefaults.some((e) => e.locationCode === d.locationCode);
                return (
                  <button
                    key={d.locationCode}
                    onClick={() => toggle(d.locationCode)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                      isFeatured
                        ? 'bg-emerald-50 ring-1 ring-emerald-300'
                        : isDefault
                        ? 'bg-amber-50 ring-1 ring-amber-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <img src={getFlagUrl(d.flagCode || d.locationCode)} alt="" className="h-5 w-7 rounded object-cover shadow-sm ring-1 ring-black/5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-medium ${isFeatured ? 'text-emerald-800' : isDefault ? 'text-amber-800' : 'text-gray-800'}`}>
                        {d.name}
                      </span>
                      <span className="text-[11px] text-gray-400">{d.continent}</span>
                    </div>
                    {isFeatured
                      ? <Star className="h-3.5 w-3.5 shrink-0 text-emerald-500 fill-emerald-500" />
                      : isDefault
                      ? <span className="text-[10px] text-amber-500 shrink-0">default</span>
                      : <Star className="h-3.5 w-3.5 shrink-0 text-gray-200" />
                    }
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
