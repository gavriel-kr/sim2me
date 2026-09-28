'use client';

/**
 * Ticket 042 — the day passes behind the "unlimited" tab: which 2GB/day pass each destination sells,
 * what it costs us per day, and what the customer pays and we keep at a few day counts. A pass can be
 * hidden (the destination falls back to its next-best pass) and sold to a customer for any number
 * of days through the internal-sale modal.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, ShoppingCart } from 'lucide-react';
import { InternalSaleModal, type PickedPackage } from '@/components/admin/InternalSaleModal';

interface Row {
  locationCode: string;
  location: string;
  packageCode: string;
  name: string;
  costPerDay: number;
  fupKbps: number;
  speed: string;
  hiddenPass: string | null;
  selling: boolean;
  samples: { days: number; price: number; cost: number; profit: number }[];
}

function speedLabel(kbps: number) {
  if (!kbps) return '—';
  return kbps >= 1000 ? `${kbps / 1000} Mbps` : `${kbps} kbps`;
}

export function DayPassesAdminClient({ canSell }: { canSell: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [hiddenCodes, setHiddenCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [days, setDays] = useState<Record<string, string>>({});
  const [saleFor, setSaleFor] = useState<PickedPackage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/day-passes');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setRows(json.rows);
      setHiddenCodes(new Set(json.hiddenCodes));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (row: Row) => {
    const hide = !hiddenCodes.has(row.packageCode);
    setBusy(row.packageCode);
    try {
      await fetch('/api/admin/day-passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageCode: row.packageCode, visible: !hide }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => r.location.toLowerCase().includes(q) || r.locationCode.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs text-gray-500">
        Price for N days = cost per day × N × 1.5 + about $0.60, ending in .90 (about 29% net after Paddle). The customer picks any number of
        days from 1 to 30. Hiding a pass writes a visibility row to the shared database; the live site also hides that package from its
        full list, so hide only what you really want gone.
      </p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search destination…"
        className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading day passes…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-start">Destination</th>
                <th className="px-3 py-2 text-start">Pass sold</th>
                <th className="px-3 py-2 text-end">Cost / day</th>
                <th className="px-3 py-2 text-start">After 2GB</th>
                {[1, 3, 7, 15, 30].map((d) => (
                  <th key={d} className="px-3 py-2 text-end">{d}d price / profit</th>
                ))}
                <th className="px-3 py-2 text-start">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const hidden = hiddenCodes.has(row.packageCode);
                const n = Math.min(30, Math.max(1, Number(days[row.packageCode] || 7)));
                return (
                  <tr key={row.locationCode} className={`border-t border-gray-100 ${row.selling ? '' : 'bg-gray-50 text-gray-400'}`}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900">{row.location}</p>
                      <p className="text-[11px] text-gray-400">{row.locationCode}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p>{row.name}</p>
                      <p className="font-mono text-[11px] text-gray-400">{row.packageCode}</p>
                      {!row.selling && <p className="text-[11px] text-red-600">Tab hidden: every 2GB/day pass here is hidden</p>}
                      {row.hiddenPass && <p className="text-[11px] text-amber-700">Replaces hidden {row.hiddenPass}</p>}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">${row.costPerDay.toFixed(2)}</td>
                    <td className="px-3 py-2">{speedLabel(row.fupKbps)}</td>
                    {row.samples.map((s) => (
                      <td key={s.days} className="whitespace-nowrap px-3 py-2 text-end tabular-nums">
                        ${s.price.toFixed(2)}
                        <p className={`text-[11px] ${s.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>${s.profit.toFixed(2)}</p>
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggle(row)}
                          disabled={busy === row.packageCode}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          {busy === row.packageCode ? <Loader2 className="h-3 w-3 animate-spin" /> : hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {hidden ? 'Show' : 'Hide'}
                        </button>
                        {canSell && row.selling && (
                          <>
                            <input
                              id={`days-${row.packageCode}`}
                              value={days[row.packageCode] ?? '7'}
                              onChange={(e) => setDays((prev) => ({ ...prev, [row.packageCode]: e.target.value.replace(/\D/g, '') }))}
                              aria-label="Days"
                              className="w-12 rounded-md border border-gray-200 px-1.5 py-1 text-center text-xs tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setSaleFor({
                                  packageCode: `dp:${row.packageCode}:${n}`,
                                  name: `${row.location} Unlimited ${n} days (2GB/day)`,
                                  costUsd: Math.round(row.costPerDay * n * 10000) / 10000,
                                  location: row.location,
                                  meta: `${n} days · 2GB/day then ${speedLabel(row.fupKbps)}`,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              <ShoppingCart className="h-3 w-3" /> Sell
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {saleFor && <InternalSaleModal presetPackage={saleFor} onClose={() => setSaleFor(null)} onSold={() => load()} />}
    </div>
  );
}
