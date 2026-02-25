'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCw, Globe, Eye, EyeOff, Star, Tag, Save, Filter, ChevronDown, ChevronUp, ArrowUpCircle } from 'lucide-react';
import { computeProfit, computeOtherFeesTotal, type AdditionalFeeItem } from '@/lib/profit';

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

interface EditState {
  visible: boolean;
  customTitle: string;
  customPrice: string;
  simCost: string;
  paddlePriceId: string;
  saleBadge: string;
  featured: boolean;
  notes: string;
}

export function PackagesClient() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [overrides, setOverrides] = useState<Map<string, Override>>(new Map());
  const [feeSettings, setFeeSettings] = useState<FeeSettings | null>(null);
  const [additionalFees, setAdditionalFees] = useState<AdditionalFeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [speedFilter, setSpeedFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Editing
  const [editingPkg, setEditingPkg] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    visible: true, customTitle: '', customPrice: '', simCost: '', paddlePriceId: '', saleBadge: '', featured: false, notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Price floor
  const [applyingFloor, setApplyingFloor] = useState(false);
  const [floorResult, setFloorResult] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgRes, overRes, feesRes] = await Promise.all([
        fetch('/api/admin/esimaccess/packages'),
        fetch('/api/admin/packages/override'),
        fetch('/api/admin/fees'),
      ]);
      const pkgData = await pkgRes.json();
      const overData = await overRes.json();
      const feesData = await feesRes.json();
      if (pkgData.error) throw new Error(pkgData.error);
      setPackages(pkgData.packageList || []);
      setBalance(pkgData.balance ?? null);
      const map = new Map<string, Override>();
      (overData.overrides || []).forEach((o: Override) => map.set(o.packageCode, o));
      setOverrides(map);
      if (feesData.feeSettings) {
        setFeeSettings(feesData.feeSettings);
        setAdditionalFees(feesData.additionalFees || []);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const applyPriceFloor = async () => {
    setApplyingFloor(true);
    setFloorResult('');
    try {
      const res = await fetch('/api/admin/packages/apply-price-floor', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFloorResult(`✓ ${data.updated} packages updated to $0.70`);
      await fetchAll();
    } catch (err) {
      setFloorResult('Error: ' + (err as Error).message);
    } finally {
      setApplyingFloor(false);
      setTimeout(() => setFloorResult(''), 5000);
    }
  };

  // Unique locations for filter dropdown
  const locations = useMemo(() => {
    const locs = new Map<string, string>();
    packages.forEach((p) => locs.set(p.locationCode, p.location));
    return Array.from(locs.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [packages]);

  // Unique speeds
  const speeds = useMemo(() => {
    const s = new Set<string>();
    packages.forEach((p) => { if (p.speed) s.add(p.speed); });
    return Array.from(s).sort();
  }, [packages]);

  // Filter packages
  const filtered = useMemo(() => {
    return packages.filter((p) => {
      const override = overrides.get(p.packageCode);
      const isVisible = override?.visible ?? true;

      if (visibilityFilter === 'visible' && !isVisible) return false;
      if (visibilityFilter === 'hidden' && isVisible) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchLoc = p.location?.toLowerCase().includes(q);
        const matchCode = p.locationCode?.toLowerCase().includes(q);
        const matchPkgCode = p.packageCode?.toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchCode && !matchPkgCode) return false;
      }
      if (locationFilter && p.locationCode !== locationFilter) return false;
      if (minVolume) {
        const minBytes = parseFloat(minVolume) * 1024 * 1024 * 1024;
        if (p.volume < minBytes && p.volume >= 0) return false;
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice);
        const effectivePrice = override?.customPrice != null
          ? Number(override.customPrice)
          : (p.retailPrice || p.price) / 10000;
        if (effectivePrice > max) return false;
      }
      if (speedFilter && p.speed !== speedFilter) return false;
      return true;
    });
  }, [packages, overrides, search, locationFilter, minVolume, maxPrice, speedFilter, visibilityFilter]);

  const getSalePrice = (pkg: Package, override: Override | undefined) =>
    override?.customPrice != null ? Number(override.customPrice) : (pkg.retailPrice ?? pkg.price) / 10000;
  const getSimCost = (pkg: Package, override: Override | undefined) =>
    override?.simCost != null ? Number(override.simCost) : pkg.price / 10000;

  const getProfitForPackage = useCallback(
    (pkg: Package, override: Override | undefined, salePrice?: number, simCostOverride?: number) => {
      const sp = salePrice ?? getSalePrice(pkg, override);
      const sc = simCostOverride ?? getSimCost(pkg, override);
      if (!feeSettings) return null;
      const other = computeOtherFeesTotal(sp, additionalFees, pkg.packageCode);
      return computeProfit({
        salePrice: sp,
        simCost: sc,
        percentageFee: feeSettings.paddlePercentageFee,
        fixedFee: feeSettings.paddleFixedFee,
        otherFeesTotal: other,
      });
    },
    [feeSettings, additionalFees]
  );

  const formatVolume = (bytes: number) => {
    if (bytes < 0) return 'Unlimited';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
    return `${bytes} B`;
  };

  const formatApiPrice = (apiUnits: number) => `$${(apiUnits / 10000).toFixed(2)}`;

  const startEdit = (pkg: Package) => {
    const override = overrides.get(pkg.packageCode);
    setEditingPkg(pkg.packageCode);
    setEditState({
      visible: override?.visible ?? true,
      customTitle: override?.customTitle || '',
      customPrice: override?.customPrice != null ? String(override.customPrice) : '',
      simCost: override?.simCost != null ? String(override.simCost) : '',
      paddlePriceId: override?.paddlePriceId || '',
      saleBadge: override?.saleBadge || '',
      featured: override?.featured ?? false,
      notes: override?.notes || '',
    });
  };

  const saveOverride = async (packageCode: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/packages/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageCode,
          visible: editState.visible,
          customTitle: editState.customTitle || null,
          customPrice: editState.customPrice ? parseFloat(editState.customPrice) : null,
          simCost: editState.simCost ? parseFloat(editState.simCost) : null,
          paddlePriceId: editState.paddlePriceId.trim() || null,
          saleBadge: editState.saleBadge || null,
          featured: editState.featured,
          notes: editState.notes || null,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Update local overrides
      setOverrides((prev) => {
        const next = new Map(prev);
        next.set(packageCode, data.override);
        return next;
      });
      setSaveSuccess(packageCode);
      setTimeout(() => setSaveSuccess(''), 2000);
      setEditingPkg(null);
    } catch (err) {
      alert('Save failed: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (packageCode: string) => {
    const current = overrides.get(packageCode)?.visible ?? true;
    try {
      const res = await fetch('/api/admin/packages/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageCode, visible: !current }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOverrides((prev) => {
        const next = new Map(prev);
        next.set(packageCode, data.override);
        return next;
      });
    } catch (err) {
      alert('Toggle failed: ' + (err as Error).message);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Balance + top controls */}
      <div className="flex flex-wrap items-center gap-3">
        {balance !== null && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm">
            <span className="text-gray-600">Balance: </span>
            <span className="font-bold text-emerald-700">${balance.toFixed(2)}</span>
          </div>
        )}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, location, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filters
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          onClick={applyPriceFloor}
          disabled={applyingFloor || loading}
          title="Set customPrice = $0.70 for all packages priced $0.55–$0.69"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          <ArrowUpCircle className={`h-4 w-4 ${applyingFloor ? 'animate-spin' : ''}`} />
          Apply Price Floor
        </button>
        {floorResult && (
          <span className={`text-sm font-medium ${floorResult.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
            {floorResult}
          </span>
        )}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All locations</option>
                {locations.map(([code, name]) => (
                  <option key={code} value={code}>{name} ({code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Data (GB)</label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={minVolume}
                onChange={(e) => setMinVolume(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Price ($)</label>
              <input
                type="number"
                placeholder="e.g. 25"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Network Speed</label>
              <select
                value={speedFilter}
                onChange={(e) => setSpeedFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All speeds</option>
                {speeds.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Visibility</label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'visible' | 'hidden')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="visible">Visible only</option>
                <option value="hidden">Hidden only</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => { setLocationFilter(''); setMinVolume(''); setMaxPrice(''); setSpeedFilter(''); setVisibilityFilter('all'); }}
            className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Count */}
      {!loading && !error && (
        <p className="text-xs text-gray-500">
          Showing {filtered.length} of {packages.length} packages
          {overrides.size > 0 && ` · ${Array.from(overrides.values()).filter(o => !o.visible).length} hidden`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      )}

      {/* Package grid */}
      {!loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 150).map((pkg) => {
            const override = overrides.get(pkg.packageCode);
            const isVisible = override?.visible ?? true;
            const isEditing = editingPkg === pkg.packageCode;
            const justSaved = saveSuccess === pkg.packageCode;

            return (
              <div
                key={pkg.packageCode}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                  !isVisible ? 'opacity-50 border-gray-300 bg-gray-50' :
                  isEditing ? 'border-emerald-400 shadow-md ring-2 ring-emerald-200' :
                  justSaved ? 'border-green-400 bg-green-50' :
                  'border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {override?.customTitle || pkg.name}
                      </span>
                    </div>
                    {override?.customTitle && (
                      <p className="mt-0.5 text-[10px] text-gray-400 truncate">Original: {pkg.name}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-500">{pkg.location} ({pkg.locationCode})</p>
                  </div>
                  <div className="text-right shrink-0">
                    {override?.customPrice != null ? (
                      <>
                        <span className="text-lg font-bold text-emerald-600">${Number(override.customPrice).toFixed(2)}</span>
                        <p className="text-[10px] text-gray-400">
                          <span className="line-through">{formatApiPrice(pkg.retailPrice || pkg.price)}</span>
                          <span className="ml-1 not-italic text-gray-400">API</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-emerald-600">{formatApiPrice(pkg.retailPrice || pkg.price)}</span>
                        <p className="text-[10px] text-gray-400">API Price</p>
                      </>
                    )}
                    <p className="text-[10px] text-orange-400 font-medium">Cost: {formatApiPrice(pkg.price)}</p>
                    {feeSettings && (() => {
                      const profit = getProfitForPackage(pkg, override);
                      if (!profit) return null;
                      return (
                        <div className="mt-1.5 space-y-0.5 text-[10px]">
                          <p className="text-gray-500">Net: <span className={profit.netProfit >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>${profit.netProfit.toFixed(2)}</span></p>
                          <p className="text-gray-500">Margin: <span className="font-medium">{(profit.profitMargin * 100).toFixed(1)}%</span></p>
                          <p className="text-gray-500">Break-even: <span className="font-medium">${Number.isFinite(profit.breakEvenPrice) ? profit.breakEvenPrice.toFixed(2) : '—'}</span></p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-2 flex flex-wrap gap-1.5">
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
                  {override?.saleBadge && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      {override.saleBadge}
                    </span>
                  )}
                  {override?.featured && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      ★ Featured
                    </span>
                  )}
                </div>

                {/* Quick actions */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(pkg.packageCode)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                      isVisible
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {isVisible ? 'Visible' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => isEditing ? setEditingPkg(null) : startEdit(pkg)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    <Tag className="h-3 w-3" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                  <span className="font-mono text-[9px] text-gray-300 ml-auto">{pkg.packageCode}</span>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase">Custom Title</label>
                        <input
                          type="text"
                          placeholder={pkg.name}
                          value={editState.customTitle}
                          onChange={(e) => setEditState({ ...editState, customTitle: e.target.value })}
                          className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase">Custom Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={`${((pkg.retailPrice || pkg.price) / 10000).toFixed(2)}`}
                          value={editState.customPrice}
                          onChange={(e) => setEditState({ ...editState, customPrice: e.target.value })}
                          className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase">SIM cost ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={`${(pkg.price / 10000).toFixed(2)} (API)`}
                          value={editState.simCost}
                          onChange={(e) => setEditState({ ...editState, simCost: e.target.value })}
                          className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <p className="mt-0.5 text-[10px] text-gray-400">Override wholesale cost; leave empty to use API.</p>
                      </div>
                    </div>
                    {feeSettings && (() => {
                      const salePrice = editState.customPrice ? parseFloat(editState.customPrice) : (pkg.retailPrice ?? pkg.price) / 10000;
                      const simCost = editState.simCost ? parseFloat(editState.simCost) : pkg.price / 10000;
                      const other = computeOtherFeesTotal(salePrice, additionalFees, pkg.packageCode);
                      const profit = computeProfit({ salePrice, simCost, percentageFee: feeSettings.paddlePercentageFee, fixedFee: feeSettings.paddleFixedFee, otherFeesTotal: other });
                      return (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase text-gray-500 mb-2">Profit</p>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <span className="text-gray-500">Net profit</span>
                            <span className={profit.netProfit >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>${profit.netProfit.toFixed(2)}</span>
                            <span className="text-gray-500">Profit margin</span>
                            <span className="font-medium">{(profit.profitMargin * 100).toFixed(1)}%</span>
                            <span className="text-gray-500">Paddle fee</span>
                            <span>${profit.paddleFeeAmount.toFixed(2)}</span>
                            <span className="text-gray-500">Other fees total</span>
                            <span>${profit.otherFeesTotal.toFixed(2)}</span>
                            <span className="text-gray-500">Break-even price</span>
                            <span>{Number.isFinite(profit.breakEvenPrice) ? `$${profit.breakEvenPrice.toFixed(2)}` : '—'}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase">Sale Badge</label>
                        <input
                          type="text"
                          placeholder="e.g. 20% OFF"
                          value={editState.saleBadge}
                          onChange={(e) => setEditState({ ...editState, saleBadge: e.target.value })}
                          className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="flex items-end gap-3 pb-0.5">
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={editState.featured}
                            onChange={(e) => setEditState({ ...editState, featured: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Star className="h-3 w-3 text-yellow-500" /> Featured
                        </label>
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={editState.visible}
                            onChange={(e) => setEditState({ ...editState, visible: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Eye className="h-3 w-3" /> Visible
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 uppercase">Paddle Price ID (pri_xxx)</label>
                      <input
                        type="text"
                        placeholder="e.g. pri_01h2..."
                        value={editState.paddlePriceId}
                        onChange={(e) => setEditState({ ...editState, paddlePriceId: e.target.value })}
                        className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-mono"
                      />
                      <p className="mt-0.5 text-[10px] text-gray-400">Required for checkout. From Paddle → Products → Price ID.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 uppercase">Notes (internal)</label>
                      <input
                        type="text"
                        placeholder="Admin notes..."
                        value={editState.notes}
                        onChange={(e) => setEditState({ ...editState, notes: e.target.value })}
                        className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <button
                      onClick={() => saveOverride(pkg.packageCode)}
                      disabled={saving}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Save className="h-3 w-3" />
                      {saving ? 'Saving...' : 'Save Override'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
