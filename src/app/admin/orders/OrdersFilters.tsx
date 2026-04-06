'use client';

import { Filter, ChevronDown, ChevronRight, Plus, X, Search, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type OrderFiltersState,
  type FilterRule,
  type FilterField,
  type FilterOperator,
  ORDER_STATUSES,
} from './orderFilters';

const FILTER_FIELDS: { value: FilterField; label: string }[] = [
  { value: 'order_id', label: 'Order ID' },
  { value: 'customer_name', label: 'Customer Name' },
  { value: 'customer_email', label: 'Email' },
  { value: 'package_details', label: 'Package' },
  { value: 'country_code', label: 'Country Code' },
  { value: 'price', label: 'Price' },
  { value: 'status', label: 'Status' },
  { value: 'date', label: 'Date' },
];

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: 'contains', label: 'contains' },
];

const emptyRule = (): FilterRule => ({ field: 'order_id', operator: '=', value: '' });

interface OrdersFiltersProps {
  filters: OrderFiltersState;
  onFiltersChange: (f: OrderFiltersState) => void;
  localSearch: string;
  onSearchChange: (v: string) => void;
  availableCountries: string[];
  archived: string;
  onArchivedChange: (v: string) => void;
  resultCount: number;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export function OrdersFilters({
  filters,
  onFiltersChange,
  localSearch,
  onSearchChange,
  availableCountries,
  archived,
  onArchivedChange,
  resultCount,
  totalCount,
  currentPage,
  pageSize,
}: OrdersFiltersProps) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedStatuses = filters.status ? filters.status.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const toggleStatus = (s: string) => {
    const next = selectedStatuses.includes(s)
      ? selectedStatuses.filter((x) => x !== s)
      : [...selectedStatuses, s];
    update({ status: next.join(',') });
  };

  const statusLabel = selectedStatuses.length === 0
    ? 'All statuses'
    : selectedStatuses.length === 1
      ? selectedStatuses[0]
      : `${selectedStatuses.length} statuses`;

  const update = (patch: Partial<OrderFiltersState>) => onFiltersChange({ ...filters, ...patch });

  const setRule = (index: number, patch: Partial<FilterRule>) => {
    const next = [...filters.rules];
    next[index] = { ...next[index], ...patch };
    update({ rules: next });
  };

  const addRule = () => { update({ rules: [...filters.rules, emptyRule()] }); setRulesOpen(true); };
  const removeRule = (index: number) => update({ rules: filters.rules.filter((_, i) => i !== index) });

  const clearAll = () => {
    onSearchChange('');
    onFiltersChange({ search: '', status: '', countryCode: '', dateFrom: '', dateTo: '', rules: [] });
    onArchivedChange('active');
  };

  const hasActiveFilters =
    localSearch.trim() ||
    selectedStatuses.length > 0 ||
    filters.countryCode ||
    filters.dateFrom.trim() ||
    filters.dateTo.trim() ||
    (archived && archived !== 'active') ||
    filters.rules.some((r) => r.value.trim());

  const dbStart = Math.min((currentPage - 1) * pageSize + 1, totalCount);
  const dbEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Row 1: search + dropdowns + dates */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ID, name, email, ICCID, IP…"
            value={localSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* Multi-select status dropdown */}
        <div ref={statusRef} className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen((o) => !o)}
            className={`flex h-10 w-[160px] items-center justify-between rounded-lg border px-3 text-sm transition-colors ${
              selectedStatuses.length > 0
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-medium'
                : 'border-gray-300 bg-gray-50 text-gray-700'
            }`}
          >
            <span className="truncate">{statusLabel}</span>
            <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-60" />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-11 z-50 w-[180px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {/* Clear all */}
              <button
                type="button"
                onClick={() => { update({ status: '' }); setStatusOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedStatuses.length === 0 ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                  {selectedStatuses.length === 0 && <Check className="h-3 w-3 text-white" />}
                </span>
                All statuses
              </button>
              <div className="my-1 border-t border-gray-100" />
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedStatuses.includes(s) ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                    {selectedStatuses.includes(s) && <Check className="h-3 w-3 text-white" />}
                  </span>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <Select value={filters.countryCode || '_'} onValueChange={(v) => update({ countryCode: v === '_' ? '' : v })}>
          <SelectTrigger className="w-[120px] border-gray-300 bg-gray-50">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">All countries</SelectItem>
            {availableCountries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={archived || 'active'} onValueChange={onArchivedChange}>
          <SelectTrigger className="w-[130px] border-gray-300 bg-gray-50">
            <SelectValue placeholder="Archived" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="archived">Archived only</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm focus:border-gray-400 focus:outline-none"
          />
          <span className="text-gray-400">–</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Custom rules */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setRulesOpen(!rulesOpen)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {rulesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Filter className="h-4 w-4" />
          Custom rules {filters.rules.length > 0 && `(${filters.rules.length})`}
        </button>
        {rulesOpen && (
          <div className="mt-2 space-y-2">
            {filters.rules.map((rule, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  value={rule.field}
                  onChange={(e) => setRule(i, { field: e.target.value as FilterField })}
                  className="h-9 rounded border border-gray-300 bg-white px-2 text-sm"
                >
                  {FILTER_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <select
                  value={rule.operator}
                  onChange={(e) => setRule(i, { operator: e.target.value as FilterOperator })}
                  className="h-9 rounded border border-gray-300 bg-white px-2 text-sm"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => setRule(i, { value: e.target.value })}
                  placeholder="Value"
                  className="h-9 min-w-[120px] rounded border border-gray-300 px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeRule(i)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRule}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" /> Add rule
            </button>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {totalCount > pageSize
          ? `Showing ${dbStart}–${dbEnd} of ${totalCount} DB orders · ${resultCount} visible on this page`
          : `${resultCount} order${resultCount !== 1 ? 's' : ''}`}
      </p>
    </div>
  );
}
