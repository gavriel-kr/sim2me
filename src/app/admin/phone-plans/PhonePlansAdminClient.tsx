'use client';

/**
 * Ticket 042 — PikaSim phone plans in the admin, in the spirit of "eSIM Packages": every plan with
 * its cost, our price, profit and visibility, editable in place, and sellable to a customer through
 * the same internal-sale modal (which spends from the PikaSim wallet).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, RotateCcw, Save, ShoppingCart, Wallet } from 'lucide-react';
import { InternalSaleModal, type PickedPackage } from '@/components/admin/InternalSaleModal';
import type { PhonePlanFull, PhoneRegion } from '@/lib/phone-plans';

interface ApiData {
  configured: boolean;
  plans: PhonePlanFull[];
  balance: number | null;
  accountStatus?: string | null;
  fees?: { percentageFee: number; fixedFee: number };
}

interface Edit {
  price: string;
  visible: boolean;
  badge: string;
  featured: boolean;
  title: string;
}

const REGION_LABEL: Record<PhoneRegion, string> = { us: 'USA · +1', europe: 'Europe · +33', global: 'Global · +1', local: 'Local' };
const HIDDEN_REASON: Record<string, string> = {
  aboveMarket: '≥15% above market',
  noCalls: 'no calls / SMS',
  activationDate: 'needs activation date (not supported)',
};

function money(n: number | null | undefined) {
  return n == null ? '—' : `$${n.toFixed(2)}`;
}

export function PhonePlansAdminClient({ canSell }: { canSell: boolean }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [region, setRegion] = useState<'all' | PhoneRegion>('all');
  const [visibility, setVisibility] = useState<'all' | 'shown' | 'hidden'>('all');
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [flash, setFlash] = useState('');
  const [saleFor, setSaleFor] = useState<PickedPackage | null>(null);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/phone-plans${refresh ? '?refresh=1' : ''}`);
      const json = (await res.json()) as ApiData & { error?: string };
      if (!res.ok) throw new Error(json.error || res.statusText);
      setData(json);
      setEdits({});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fees = data?.fees ?? { percentageFee: 0.05, fixedFee: 0.5 };
  const profitOf = (price: number, cost: number) => price - cost - (price * fees.percentageFee + fees.fixedFee);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.plans ?? []).filter(
      (p) =>
        (region === 'all' || p.region === region) &&
        (visibility === 'all' || (visibility === 'shown' ? p.visible : !p.visible)) &&
        (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
    );
  }, [data, region, visibility, search]);

  const editOf = (p: PhonePlanFull): Edit =>
    edits[p.code] ?? {
      price: p.priceUsd !== p.rulePriceUsd ? p.priceUsd.toFixed(2) : '',
      visible: p.visible,
      badge: p.saleBadge ?? '',
      featured: p.featured,
      title: p.name === p.code ? '' : '',
    };
  const setEdit = (p: PhonePlanFull, patch: Partial<Edit>) => setEdits((prev) => ({ ...prev, [p.code]: { ...editOf(p), ...patch } }));

  const save = async (p: PhonePlanFull, action: 'save' | 'reset') => {
    const e = editOf(p);
    setSaving(p.code);
    try {
      const price = e.price.trim() ? Number(e.price) : null;
      if (price != null && !(price > 0)) throw new Error('Price must be a positive number');
      const res = await fetch('/api/admin/phone-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: p.code,
          action,
          visible: e.visible,
          customPrice: price,
          saleBadge: e.badge || null,
          featured: e.featured,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setFlash(action === 'reset' ? `Reset ${p.code} to the rules` : `Saved ${p.code}`);
      await load();
    } catch (err) {
      setFlash(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(null);
      setTimeout(() => setFlash(''), 4000);
    }
  };

  if (loading && !data) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading PikaSim plans…
      </div>
    );
  }
  if (data && !data.configured) {
    return <p className="mt-8 text-sm text-red-600">PIKASIM_API_KEY is not set in .env.</p>;
  }

  const shownCount = data?.plans.filter((p) => p.visible).length ?? 0;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm">
          <Wallet className="h-4 w-4 text-sky-600" />
          <span className="text-gray-600">PikaSim wallet:</span>
          <span className="font-bold text-gray-900">{money(data?.balance)}</span>
          {data?.accountStatus && <span className="text-xs text-gray-500">({data.accountStatus})</span>}
        </div>
        <span className="text-sm text-gray-600">
          {shownCount} shown · {(data?.plans.length ?? 0) - shownCount} hidden · {data?.plans.length ?? 0} total
        </span>
        <button
          type="button"
          onClick={() => load(true)}
          className="ms-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh from PikaSim
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Price rule: cost + ~10% net after Paddle ({(fees.percentageFee * 100).toFixed(0)}% + ${fees.fixedFee.toFixed(2)}), ending in .90.
        Hidden by default: plans ≥15% above the market price, plans without calls/SMS, and plans that need a booked activation date.
        The global plan is always shown. Leave the price empty to use the rule. Changes are saved to the shared database; the live
        site ignores these rows until this feature is released.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'us', 'europe', 'global', 'local'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${region === r ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-gray-200 bg-white text-gray-600'}`}
          >
            {r === 'all' ? 'All regions' : REGION_LABEL[r]}
          </button>
        ))}
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as typeof visibility)}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
        >
          <option value="all">Shown + hidden</option>
          <option value="shown">Shown only</option>
          <option value="hidden">Hidden only</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or code…"
          className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
        />
      </div>

      {flash && <p className={`text-sm ${flash.startsWith('Error') ? 'text-red-600' : 'text-emerald-700'}`}>{flash}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2 text-start">Plan</th>
              <th className="px-3 py-2 text-start">Number</th>
              <th className="px-3 py-2 text-start">Data · days</th>
              <th className="px-3 py-2 text-start">Min / SMS</th>
              <th className="px-3 py-2 text-end">Cost</th>
              <th className="px-3 py-2 text-start">Our price</th>
              <th className="px-3 py-2 text-end">Profit</th>
              <th className="px-3 py-2 text-end">vs market</th>
              <th className="px-3 py-2 text-start">Shown</th>
              <th className="px-3 py-2 text-start">Badge / featured</th>
              <th className="px-3 py-2 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const e = editOf(p);
              const effective = e.price.trim() ? Number(e.price) : p.rulePriceUsd;
              const profit = profitOf(effective, p.costUsd);
              const margin = effective > 0 ? (profit / effective) * 100 : 0;
              const dirty = Boolean(edits[p.code]);
              return (
                <tr key={p.code} className={`border-t border-gray-100 align-top ${p.visible ? '' : 'bg-gray-50/70 text-gray-500'}`}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="font-mono text-[11px] text-gray-400">{p.code}</p>
                    {!p.defaultVisible && p.hiddenReason && (
                      <p className="mt-0.5 text-[11px] text-amber-700">Rule hides: {HIDDEN_REASON[p.hiddenReason]}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {REGION_LABEL[p.region]}
                    {p.region === 'local' && <span className="ms-1 text-xs">{p.numberCountry} {p.dialCode}</span>}
                    {p.coverage.length > 1 && <p className="text-[11px] text-gray-400">{p.coverage.length} countries</p>}
                    <p className={`text-[11px] ${p.renewable ? 'text-emerald-700' : 'text-gray-400'}`}>{p.renewable ? 'Renewable · keeps number' : 'Single-cycle · new number'}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{p.dataGb}GB · {p.days}d</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                    {p.voiceMinutes < 0 ? '∞' : p.voiceMinutes} / {p.sms < 0 ? '∞' : p.sms}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums">{money(p.costUsd)}</td>
                  <td className="px-3 py-2">
                    <input
                      id={`price-${p.code}`}
                      value={e.price}
                      onChange={(ev) => setEdit(p, { price: ev.target.value })}
                      placeholder={p.rulePriceUsd.toFixed(2)}
                      inputMode="decimal"
                      className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm tabular-nums"
                    />
                    <p className="text-[11px] text-gray-400">rule {money(p.rulePriceUsd)}</p>
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2 text-end tabular-nums ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {money(profit)}
                    <p className="text-[11px]">{margin.toFixed(0)}%</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums">
                    {p.marketUsd ? (
                      <>
                        <span className={(effective / p.marketUsd - 1) * 100 >= 15 ? 'text-red-600' : 'text-gray-700'}>
                          {((effective / p.marketUsd - 1) * 100).toFixed(0)}%
                        </span>
                        <p className="text-[11px] text-gray-400">market {money(p.marketUsd)}</p>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={e.visible}
                        disabled={p.requiresActivationDate}
                        onChange={(ev) => setEdit(p, { visible: ev.target.checked })}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      {e.visible ? 'Shown' : 'Hidden'}
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={e.badge}
                      onChange={(ev) => setEdit(p, { badge: ev.target.value })}
                      placeholder="e.g. HOT"
                      className="w-20 rounded-md border border-gray-200 px-2 py-1 text-xs"
                    />
                    <label className="mt-1 flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={e.featured} onChange={(ev) => setEdit(p, { featured: ev.target.checked })} className="h-3.5 w-3.5 accent-amber-500" />
                      Featured (homepage)
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => save(p, 'save')}
                        disabled={!dirty || saving === p.code}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {saving === p.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                      </button>
                      <button
                        type="button"
                        onClick={() => save(p, 'reset')}
                        disabled={saving === p.code}
                        title="Back to the pricing and visibility rules"
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <RotateCcw className="h-3 w-3" /> Rules
                      </button>
                      {canSell && !p.requiresActivationDate && (
                        <button
                          type="button"
                          onClick={() =>
                            setSaleFor({
                              packageCode: p.id,
                              name: p.name,
                              costUsd: p.costUsd,
                              location: REGION_LABEL[p.region],
                              meta: `${p.dataGb}GB · ${p.days}d · ${p.voiceMinutes < 0 ? '∞' : p.voiceMinutes} min · ${p.sms < 0 ? '∞' : p.sms} SMS`,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          <ShoppingCart className="h-3 w-3" /> Sell
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {saleFor && <InternalSaleModal presetPackage={saleFor} onClose={() => setSaleFor(null)} onSold={() => load()} />}
    </div>
  );
}
