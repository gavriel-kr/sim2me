'use client';

import { useCallback, useEffect, useState } from 'react';
import { Flame, Pin, RefreshCw, Power, Loader2 } from 'lucide-react';

interface AdminDeal {
  id: string;
  packageCode: string;
  packageName: string;
  locationCode: string;
  discountPercent: number;
  originalPrice: number;
  dealPrice: number;
  netProfit: number;
  pinned: boolean;
  active: boolean;
}

interface DealsConfig {
  enabled: boolean;
  count: number;
  minProfit: number;
  discountMin: number;
  discountMax: number;
  minPrice: number;
}

export function HotDealsClient() {
  const [deals, setDeals] = useState<AdminDeal[]>([]);
  const [config, setConfig] = useState<DealsConfig | null>(null);
  const [dealDay, setDealDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/hot-deals');
    if (res.ok) {
      const data = await res.json();
      setDeals(data.deals);
      setConfig(data.config);
      setDealDay(data.dealDay);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (action: string, id?: string) => {
    setBusy(true);
    await fetch('/api/admin/hot-deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    });
    await load();
    setBusy(false);
  };

  const saveConfig = async () => {
    if (!config) return;
    setBusy(true);
    const res = await fetch('/api/admin/hot-deals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data.config);
      setSavedMsg('Settings saved');
      setTimeout(() => setSavedMsg(''), 2500);
    }
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="mt-10 flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {/* Today's deals */}
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Deals for {dealDay} (UTC)</h2>
          </div>
          <button
            onClick={() => act('regenerate')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
            Regenerate (keeps pinned)
          </button>
        </div>

        {deals.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-500">
            No eligible deals today — check that featured destinations exist and the profit floor is reachable.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {deals.map((d) => (
              <div key={d.id} className={`flex flex-wrap items-center gap-3 px-5 py-4 ${d.active ? '' : 'opacity-50'}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {d.locationCode} · {d.packageName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    <span className="line-through">${d.originalPrice.toFixed(2)}</span>
                    {' → '}
                    <span className="font-bold text-emerald-600">${d.dealPrice.toFixed(2)}</span>
                    {' '}(-{d.discountPercent}%) · net profit{' '}
                    <span className={`font-bold ${d.netProfit >= 3 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${d.netProfit.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => act('pin', d.id)}
                    disabled={busy}
                    title={d.pinned ? 'Unpin (rotates tomorrow)' : 'Pin (carries into tomorrow)'}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                      d.pinned
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Pin className="h-3.5 w-3.5" />
                    {d.pinned ? 'Pinned' : 'Pin'}
                  </button>
                  <button
                    onClick={() => act('toggle', d.id)}
                    disabled={busy}
                    title={d.active ? 'Disable this deal' : 'Enable this deal'}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                      d.active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-600'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {d.active ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      {config && (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Settings</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Changes apply from the next generation (regenerate or tomorrow&apos;s rotation).
            </p>
          </div>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600"
              />
              Hot deals enabled
            </label>
            <NumField label="Number of deals" value={config.count} min={1} max={6}
              onChange={(v) => setConfig({ ...config, count: v })} />
            <NumField label="Min net profit ($)" value={config.minProfit} min={0} max={1000} step={0.5}
              onChange={(v) => setConfig({ ...config, minProfit: v })} />
            <NumField label="Discount min (%)" value={config.discountMin} min={1} max={50}
              onChange={(v) => setConfig({ ...config, discountMin: v })} />
            <NumField label="Discount max (%)" value={config.discountMax} min={1} max={50}
              onChange={(v) => setConfig({ ...config, discountMax: v })} />
            <NumField label="Min package price ($)" value={config.minPrice} min={0} max={1000} step={0.5}
              onChange={(v) => setConfig({ ...config, minPrice: v })} />
          </div>
          <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-4">
            <button
              onClick={saveConfig}
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Save settings
            </button>
            {savedMsg && <span className="text-sm font-medium text-emerald-600">{savedMsg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  );
}
