'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, ChevronRight, Loader2, Save, FolderOpen } from 'lucide-react';
import { computeProfit, computeOtherFeesTotal, type AdditionalFeeItem } from '@/lib/profit';
import type {
  BulkEditEdits,
  BulkEditConditions,
  NumericEditMode,
} from '@/lib/bulk-edit-types';

interface Package {
  packageCode: string;
  slug: string;
  name: string;
  price: number;
  retailPrice?: number;
  currencyCode: string;
  volume: number;
  duration: number;
  location: string;
  locationCode: string;
  speed: string;
  favorite: boolean;
}

interface Override {
  packageCode: string;
  visible: boolean;
  customTitle: string | null;
  customPrice: number | null;
  simCost: number | null;
  paddlePriceId: string | null;
  saleBadge: string | null;
  featured: boolean;
  sortOrder: number;
  notes: string | null;
}

interface FeeSettings {
  paddlePercentageFee: number;
  paddleFixedFee: number;
  currency: string;
}

const TEMPLATE_KEY = 'sim2me_bulk_edit_templates';

const NUMERIC_MODES: { value: NumericEditMode; label: string }[] = [
  { value: 'set_exact', label: 'Set exact value' },
  { value: 'increase_percent', label: 'Increase by %' },
  { value: 'decrease_percent', label: 'Decrease by %' },
  { value: 'increase_fixed', label: 'Increase by fixed' },
  { value: 'decrease_fixed', label: 'Decrease by fixed' },
];

function applyNumericEdit(current: number, mode: NumericEditMode, value: number): number {
  switch (mode) {
    case 'set_exact':
      return value;
    case 'increase_percent':
      return current * (1 + value / 100);
    case 'decrease_percent':
      return current * (1 - value / 100);
    case 'increase_fixed':
      return current + value;
    case 'decrease_fixed':
      return Math.max(0, current - value);
    default:
      return current;
  }
}

interface BulkEditDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedCodes: string[];
  packages: Package[];
  overrides: Map<string, Override>;
  feeSettings: FeeSettings | null;
  additionalFees: AdditionalFeeItem[];
  onSuccess: () => void;
}

export function BulkEditDrawer({
  open,
  onClose,
  selectedCodes,
  packages,
  overrides,
  feeSettings,
  additionalFees,
  onSuccess,
}: BulkEditDrawerProps) {
  const [step, setStep] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Section A — edits form
  const [retailMode, setRetailMode] = useState<NumericEditMode>('set_exact');
  const [retailValue, setRetailValue] = useState('');
  const [simCostMode, setSimCostMode] = useState<NumericEditMode>('set_exact');
  const [simCostValue, setSimCostValue] = useState('');
  const [saleBadgeValue, setSaleBadgeValue] = useState('');
  const [notesValue, setNotesValue] = useState('');
  const [paddlePriceIdValue, setPaddlePriceIdValue] = useState('');
  const [applySaleBadge, setApplySaleBadge] = useState(false);
  const [applyNotes, setApplyNotes] = useState(false);
  const [applyPaddlePriceId, setApplyPaddlePriceId] = useState(false);

  // Section C — conditions
  const [conditions, setConditions] = useState<BulkEditConditions>({});
  const [marginLessThan, setMarginLessThan] = useState('');
  const [marginGreaterThan, setMarginGreaterThan] = useState('');
  const [netProfitLessThan, setNetProfitLessThan] = useState('');
  const [netProfitGreaterThan, setNetProfitGreaterThan] = useState('');
  const [retailPriceMin, setRetailPriceMin] = useState('');
  const [retailPriceMax, setRetailPriceMax] = useState('');
  const [countryEquals, setCountryEquals] = useState('');
  const [dataAmountEquals, setDataAmountEquals] = useState('');
  const [durationEquals, setDurationEquals] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(TEMPLATE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        setSavedTemplates(Array.isArray(list) ? list : []);
      } catch {
        setSavedTemplates([]);
      }
    }
  }, [open]);

  const saveAsTemplate = () => {
    const name = templateName.trim() || `Bulk edit ${new Date().toISOString().slice(0, 10)}`;
    const template = {
      id: `t_${Date.now()}`,
      name,
      edits,
      conditions: conditionsPayload,
      retailMode,
      retailValue,
      simCostMode,
      simCostValue,
      saleBadgeValue,
      notesValue,
      paddlePriceIdValue,
      applySaleBadge,
      applyNotes,
      applyPaddlePriceId,
      marginLessThan,
      marginGreaterThan,
      netProfitLessThan,
      netProfitGreaterThan,
      retailPriceMin,
      retailPriceMax,
      countryEquals,
      dataAmountEquals,
      durationEquals,
    };
    try {
      const raw = localStorage.getItem(TEMPLATE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? [...list] : [];
      const meta = { id: template.id, name: template.name };
      const existing = next.find((t: { id: string }) => t.id === template.id);
      if (existing) {
        existing.name = meta.name;
      } else {
        next.push(meta);
      }
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(next));
      localStorage.setItem(`${TEMPLATE_KEY}_${template.id}`, JSON.stringify(template));
      setSavedTemplates(next);
      setTemplateName('');
    } catch (e) {
      setError('Failed to save template');
    }
  };

  const loadTemplate = (id: string) => {
    try {
      const raw = localStorage.getItem(`${TEMPLATE_KEY}_${id}`);
      if (!raw) return;
      const t = JSON.parse(raw);
      if (t.retailMode != null) setRetailMode(t.retailMode);
      if (t.retailValue != null) setRetailValue(t.retailValue);
      if (t.simCostMode != null) setSimCostMode(t.simCostMode);
      if (t.simCostValue != null) setSimCostValue(t.simCostValue);
      if (t.saleBadgeValue != null) setSaleBadgeValue(t.saleBadgeValue);
      if (t.notesValue != null) setNotesValue(t.notesValue);
      if (t.paddlePriceIdValue != null) setPaddlePriceIdValue(t.paddlePriceIdValue);
      if (t.applySaleBadge != null) setApplySaleBadge(t.applySaleBadge);
      if (t.applyNotes != null) setApplyNotes(t.applyNotes);
      if (t.applyPaddlePriceId != null) setApplyPaddlePriceId(t.applyPaddlePriceId);
      if (t.marginLessThan != null) setMarginLessThan(t.marginLessThan);
      if (t.marginGreaterThan != null) setMarginGreaterThan(t.marginGreaterThan);
      if (t.netProfitLessThan != null) setNetProfitLessThan(t.netProfitLessThan);
      if (t.netProfitGreaterThan != null) setNetProfitGreaterThan(t.netProfitGreaterThan);
      if (t.retailPriceMin != null) setRetailPriceMin(t.retailPriceMin);
      if (t.retailPriceMax != null) setRetailPriceMax(t.retailPriceMax);
      if (t.countryEquals != null) setCountryEquals(t.countryEquals);
      if (t.dataAmountEquals != null) setDataAmountEquals(String(t.dataAmountEquals));
      if (t.durationEquals != null) setDurationEquals(String(t.durationEquals));
    } catch {
      setError('Failed to load template');
    }
  };

  const packageMap = useMemo(() => new Map(packages.map((p) => [p.packageCode, p])), [packages]);

  const edits = useMemo((): BulkEditEdits => {
    const e: BulkEditEdits = {};
    const rv = parseFloat(retailValue);
    if (retailValue !== '' && Number.isFinite(rv)) {
      e.retailPrice = { mode: retailMode, value: rv };
    }
    const sv = parseFloat(simCostValue);
    if (simCostValue !== '' && Number.isFinite(sv)) {
      e.simCost = { mode: simCostMode, value: sv };
    }
    if (applySaleBadge) {
      e.saleBadge = { mode: 'set_exact', value: saleBadgeValue.trim() || null };
    }
    if (applyNotes) {
      e.notes = { mode: 'set_exact', value: notesValue.trim() || null };
    }
    if (applyPaddlePriceId) {
      e.paddlePriceId = { mode: 'set_exact', value: paddlePriceIdValue.trim() || null };
    }
    return e;
  }, [
    retailMode,
    retailValue,
    simCostMode,
    simCostValue,
    applySaleBadge,
    saleBadgeValue,
    applyNotes,
    notesValue,
    applyPaddlePriceId,
    paddlePriceIdValue,
  ]);

  const conditionsPayload = useMemo((): BulkEditConditions | undefined => {
    const c: BulkEditConditions = {};
    const ml = parseFloat(marginLessThan);
    if (marginLessThan !== '' && Number.isFinite(ml)) c.marginLessThan = ml;
    const mg = parseFloat(marginGreaterThan);
    if (marginGreaterThan !== '' && Number.isFinite(mg)) c.marginGreaterThan = mg;
    const npl = parseFloat(netProfitLessThan);
    if (netProfitLessThan !== '' && Number.isFinite(npl)) c.netProfitLessThan = npl;
    const npg = parseFloat(netProfitGreaterThan);
    if (netProfitGreaterThan !== '' && Number.isFinite(npg)) c.netProfitGreaterThan = npg;
    const rmin = parseFloat(retailPriceMin);
    if (retailPriceMin !== '' && Number.isFinite(rmin)) c.retailPriceMin = rmin;
    const rmax = parseFloat(retailPriceMax);
    if (retailPriceMax !== '' && Number.isFinite(rmax)) c.retailPriceMax = rmax;
    if (countryEquals.trim()) c.countryEquals = countryEquals.trim();
    const da = parseFloat(dataAmountEquals);
    if (dataAmountEquals !== '' && Number.isFinite(da)) c.dataAmountEquals = da;
    const du = parseInt(durationEquals, 10);
    if (durationEquals !== '' && Number.isFinite(du)) c.durationEquals = du;
    if (Object.keys(c).length === 0) return undefined;
    return c;
  }, [
    marginLessThan,
    marginGreaterThan,
    netProfitLessThan,
    netProfitGreaterThan,
    retailPriceMin,
    retailPriceMax,
    countryEquals,
    dataAmountEquals,
    durationEquals,
  ]);

  const hasAnyEdit = Object.keys(edits).length > 0;

  // Preview: first selected package that exists in list
  const previewPackage = useMemo(() => {
    for (const code of selectedCodes) {
      const pkg = packageMap.get(code);
      if (pkg) return pkg;
    }
    return null;
  }, [selectedCodes, packageMap]);

  const previewBeforeAfter = useMemo(() => {
    if (!previewPackage || !feeSettings) return null;
    const override = overrides.get(previewPackage.packageCode);
    const beforeRetail =
      override?.customPrice != null
        ? Number(override.customPrice)
        : (previewPackage.retailPrice ?? previewPackage.price) / 10000;
    const beforeSimCost =
      override?.simCost != null ? Number(override.simCost) : previewPackage.price / 10000;

    let afterRetail = beforeRetail;
    let afterSimCost = beforeSimCost;
    if (edits.retailPrice) {
      afterRetail = applyNumericEdit(
        beforeRetail,
        edits.retailPrice.mode,
        edits.retailPrice.value
      );
      afterRetail = Math.round(afterRetail * 100) / 100;
    }
    if (edits.simCost) {
      afterSimCost = applyNumericEdit(
        beforeSimCost,
        edits.simCost.mode,
        edits.simCost.value
      );
      afterSimCost = Math.round(afterSimCost * 10000) / 10000;
    }

    const otherBefore = computeOtherFeesTotal(
      beforeRetail,
      additionalFees,
      previewPackage.packageCode
    );
    const otherAfter = computeOtherFeesTotal(
      afterRetail,
      additionalFees,
      previewPackage.packageCode
    );
    const profitBefore = computeProfit({
      salePrice: beforeRetail,
      simCost: beforeSimCost,
      percentageFee: feeSettings.paddlePercentageFee,
      fixedFee: feeSettings.paddleFixedFee,
      otherFeesTotal: otherBefore,
    });
    const profitAfter = computeProfit({
      salePrice: afterRetail,
      simCost: afterSimCost,
      percentageFee: feeSettings.paddlePercentageFee,
      fixedFee: feeSettings.paddleFixedFee,
      otherFeesTotal: otherAfter,
    });

    return {
      name: previewPackage.name,
      location: previewPackage.location,
      beforeRetail,
      afterRetail,
      beforeNet: profitBefore.netProfit,
      afterNet: profitAfter.netProfit,
      beforeMargin: profitBefore.profitMargin * 100,
      afterMargin: profitAfter.profitMargin * 100,
    };
  }, [
    previewPackage,
    overrides,
    feeSettings,
    additionalFees,
    edits.retailPrice,
    edits.simCost,
  ]);

  const handleClose = () => {
    setStep('edit');
    setError('');
    setProgress(0);
    onClose();
  };

  const handleApply = async () => {
    if (!hasAnyEdit) return;
    setLoading(true);
    setError('');
    setProgress(10);
    try {
      setProgress(30);
      const res = await fetch('/api/admin/packages/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageCodes: selectedCodes,
          edits,
          conditions: conditionsPayload,
        }),
      });
      setProgress(80);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProgress(100);
      onSuccess();
      handleClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        aria-hidden
        onClick={handleClose}
      />
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] overflow-y-auto border-l border-gray-200 bg-white shadow-xl"
        role="dialog"
        aria-label="Bulk edit packages"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'edit' ? 'Bulk Edit' : 'Preview & Apply'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 'edit' && (
            <>
              {/* Section A — Pricing */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Pricing fields</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Retail Price
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={retailMode}
                        onChange={(e) => setRetailMode(e.target.value as NumericEditMode)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                      >
                        {NUMERIC_MODES.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={retailMode === 'set_exact' ? 'e.g. 12' : 'e.g. 10 or 0.50'}
                        value={retailValue}
                        onChange={(e) => setRetailValue(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      SIM Cost
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={simCostMode}
                        onChange={(e) => setSimCostMode(e.target.value as NumericEditMode)}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                      >
                        {NUMERIC_MODES.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 0.50"
                        value={simCostValue}
                        onChange={(e) => setSimCostValue(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                      <input
                        type="checkbox"
                        checked={applySaleBadge}
                        onChange={(e) => setApplySaleBadge(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Sale Badge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 20% OFF"
                      value={saleBadgeValue}
                      onChange={(e) => setSaleBadgeValue(e.target.value)}
                      disabled={!applySaleBadge}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                      <input
                        type="checkbox"
                        checked={applyNotes}
                        onChange={(e) => setApplyNotes(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Internal notes"
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      disabled={!applyNotes}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                      <input
                        type="checkbox"
                        checked={applyPaddlePriceId}
                        onChange={(e) => setApplyPaddlePriceId(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Paddle Price ID
                    </label>
                    <input
                      type="text"
                      placeholder="pri_..."
                      value={paddlePriceIdValue}
                      onChange={(e) => setPaddlePriceIdValue(e.target.value)}
                      disabled={!applyPaddlePriceId}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-mono disabled:opacity-50"
                    />
                  </div>
                </div>
              </section>

              {/* Section B — Profit info */}
              {feeSettings && (
                <section className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Profit recalculation</h3>
                  <p className="text-xs text-gray-600">
                    Paddle Fee = (Retail × {((feeSettings.paddlePercentageFee ?? 0) * 100).toFixed(1)}%) + $
                    {(feeSettings.paddleFixedFee ?? 0).toFixed(2)}. Net = Retail − SIM Cost − Paddle Fees − Other.
                    Margin % = Net / Retail. Values from Admin → Fees / Charges.
                  </p>
                </section>
              )}

              {/* Save / Load template */}
              <section className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Templates</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={saveAsTemplate}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                </div>
                {savedTemplates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <select
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) loadTemplate(id);
                        e.target.value = '';
                      }}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="">Load preset…</option>
                      {savedTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </section>

              {/* Section C — Conditions */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Apply only if (optional)
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Margin &lt; %"
                    value={marginLessThan}
                    onChange={(e) => setMarginLessThan(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Margin &gt; %"
                    value={marginGreaterThan}
                    onChange={(e) => setMarginGreaterThan(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Net profit &lt; $"
                    value={netProfitLessThan}
                    onChange={(e) => setNetProfitLessThan(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Net profit &gt; $"
                    value={netProfitGreaterThan}
                    onChange={(e) => setNetProfitGreaterThan(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Retail min $"
                    value={retailPriceMin}
                    onChange={(e) => setRetailPriceMin(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Retail max $"
                    value={retailPriceMax}
                    onChange={(e) => setRetailPriceMax(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="Country (code)"
                    value={countryEquals}
                    onChange={(e) => setCountryEquals(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Data (GB)"
                    value={dataAmountEquals}
                    onChange={(e) => setDataAmountEquals(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                  <input
                    type="number"
                    placeholder="Duration (days)"
                    value={durationEquals}
                    onChange={(e) => setDurationEquals(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                </div>
              </section>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  disabled={!hasAnyEdit}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Preview
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <p className="text-sm text-gray-600">
                About <strong>{selectedCodes.length}</strong> packages will be updated
                {conditionsPayload && Object.keys(conditionsPayload).length > 0 && ' (filtered by conditions)'}.
              </p>
              {previewBeforeAfter && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Example: {previewBeforeAfter.name} ({previewBeforeAfter.location})
                  </p>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 text-gray-600">Retail</td>
                        <td className="py-1">
                          ${previewBeforeAfter.beforeRetail.toFixed(2)} →{' '}
                          <strong>${previewBeforeAfter.afterRetail.toFixed(2)}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-600">Net</td>
                        <td className="py-1">
                          <span className={previewBeforeAfter.beforeNet >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                            ${previewBeforeAfter.beforeNet.toFixed(2)}
                          </span>
                          {' → '}
                          <strong className={previewBeforeAfter.afterNet >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                            ${previewBeforeAfter.afterNet.toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-600">Margin</td>
                        <td className="py-1">
                          {previewBeforeAfter.beforeMargin.toFixed(1)}% →{' '}
                          <strong>{previewBeforeAfter.afterMargin.toFixed(1)}%</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {loading && (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying updates…
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {!loading && (
                  <>
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={!hasAnyEdit}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Confirm & Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('edit')}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
