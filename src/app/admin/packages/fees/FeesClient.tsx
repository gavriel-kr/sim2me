'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';

interface FeeSettingsData {
  paddlePercentageFee: number;
  paddleFixedFee: number;
  currency: string;
}

interface AdditionalFeeData {
  id?: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  isActive: boolean;
  appliesTo: 'all_products' | 'selected_products';
  selectedProductIds: string[];
  sortOrder: number;
}

export function FeesClient() {
  const [feeSettings, setFeeSettings] = useState<FeeSettingsData>({
    paddlePercentageFee: 0.05,
    paddleFixedFee: 0.5,
    currency: 'USD',
  });
  const [esimAdditionalCost, setEsimAdditionalCost] = useState<number>(0);
  const [additionalFees, setAdditionalFees] = useState<AdditionalFeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/fees');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.feeSettings) {
        setFeeSettings({
          paddlePercentageFee: data.feeSettings.paddlePercentageFee ?? 0.05,
          paddleFixedFee: data.feeSettings.paddleFixedFee ?? 0.5,
          currency: data.feeSettings.currency ?? 'USD',
        });
      }
      setEsimAdditionalCost(data.esimAdditionalCost ?? 0);
      setAdditionalFees((data.additionalFees || []).map((f: AdditionalFeeData, i: number) => ({
        ...f,
        sortOrder: f.sortOrder ?? i,
        selectedProductIds: Array.isArray(f.selectedProductIds) ? f.selectedProductIds : [],
      })));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeSettings: {
            paddlePercentageFee: feeSettings.paddlePercentageFee,
            paddleFixedFee: feeSettings.paddleFixedFee,
            currency: feeSettings.currency,
          },
          esimAdditionalCost,
          additionalFees: additionalFees.map((f) => ({
            name: f.name,
            type: f.type,
            value: f.value,
            isActive: f.isActive,
            appliesTo: f.appliesTo,
            selectedProductIds: f.appliesTo === 'selected_products' ? f.selectedProductIds : [],
            sortOrder: f.sortOrder,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess('Saved.');
      setAdditionalFees((data.additionalFees || []).map((f: AdditionalFeeData, i: number) => ({
        ...f,
        sortOrder: f.sortOrder ?? i,
        selectedProductIds: Array.isArray(f.selectedProductIds) ? f.selectedProductIds : [],
      })));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addAdditionalFee = () => {
    setAdditionalFees((prev) => [
      ...prev,
      {
        name: '',
        type: 'fixed',
        value: 0,
        isActive: true,
        appliesTo: 'all_products',
        selectedProductIds: [],
        sortOrder: prev.length,
      },
    ]);
  };

  const updateAdditionalFee = (index: number, updates: Partial<AdditionalFeeData>) => {
    setAdditionalFees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const removeAdditionalFee = (index: number) => {
    setAdditionalFees((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="mt-6 h-40 animate-pulse rounded-2xl bg-gray-100" />
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Paddle fees */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Paddle fees</h2>
        <p className="mt-1 text-sm text-gray-500">Applied to every transaction.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Percentage fee</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.001}
              value={feeSettings.paddlePercentageFee}
              onChange={(e) => setFeeSettings((s) => ({ ...s, paddlePercentageFee: parseFloat(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-0.5 text-xs text-gray-500">0–1 (e.g. 0.05 = 5%)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fixed fee ($)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={feeSettings.paddleFixedFee}
              onChange={(e) => setFeeSettings((s) => ({ ...s, paddleFixedFee: parseFloat(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <input
              type="text"
              value={feeSettings.currency}
              onChange={(e) => setFeeSettings((s) => ({ ...s, currency: e.target.value.trim() || 'USD' }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* eSIM cost adjustment */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">eSIM cost adjustment ($)</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add manual costs for eSIM purchases made directly on eSIMaccess outside the app (e.g. test purchases).
          This amount is added to the tracked eSIM cost on the dashboard and affects profit.
        </p>
        <div className="mt-4 max-w-xs">
          <label className="block text-sm font-medium text-gray-700">Additional eSIM cost ($)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={esimAdditionalCost}
            onChange={(e) => setEsimAdditionalCost(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="0.00"
          />
          <p className="mt-0.5 text-xs text-gray-500">
            Example: if eSIMaccess balance shows $2.20 spent but the dashboard shows $1.30, enter $0.90 here.
          </p>
        </div>
      </section>

      {/* Additional fees */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Additional fees</h2>
        <p className="mt-1 text-sm text-gray-500">Extensible list; fixed or percentage, all products or selected.</p>
        <div className="mt-4 space-y-4">
          {additionalFees.map((fee, index) => (
            <div
              key={index}
              className="flex flex-wrap items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="grid min-w-[200px] flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tax"
                    value={fee.name}
                    onChange={(e) => updateAdditionalFee(index, { name: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Type</label>
                  <select
                    value={fee.type}
                    onChange={(e) => updateAdditionalFee(index, { type: e.target.value as 'fixed' | 'percentage' })}
                    className="mt-0.5 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Value</label>
                  <input
                    type="number"
                    min={0}
                    step={fee.type === 'percentage' ? 0.01 : 0.01}
                    value={fee.value}
                    onChange={(e) => updateAdditionalFee(index, { value: parseFloat(e.target.value) || 0 })}
                    className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  {fee.type === 'percentage' && <span className="text-[10px] text-gray-400">0–1</span>}
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={fee.isActive}
                      onChange={(e) => updateAdditionalFee(index, { isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-medium text-gray-500">Applies to</label>
                <select
                  value={fee.appliesTo}
                  onChange={(e) => updateAdditionalFee(index, { appliesTo: e.target.value as 'all_products' | 'selected_products' })}
                  className="mt-0.5 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm sm:w-40"
                >
                  <option value="all_products">All products</option>
                  <option value="selected_products">Selected products</option>
                </select>
              </div>
              {fee.appliesTo === 'selected_products' && (
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-500">Package codes (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="pkg-A, pkg-B"
                    value={fee.selectedProductIds.join(', ')}
                    onChange={(e) =>
                      updateAdditionalFee(index, {
                        selectedProductIds: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAdditionalFee(index)}
                className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                title="Remove fee"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAdditionalFee}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add fee
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
