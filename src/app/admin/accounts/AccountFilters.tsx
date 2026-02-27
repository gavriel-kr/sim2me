'use client';

import { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type AccountFiltersState,
  type FilterRule,
  type FilterField,
  type FilterOperator,
} from './accountFilters';

const FILTER_FIELDS: { value: FilterField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'googleAuth', label: 'Google Auth' },
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

const emptyRule = (): FilterRule => ({ field: 'name', operator: '=', value: '' });

interface AccountFiltersProps {
  filters: AccountFiltersState;
  onFiltersChange: (f: AccountFiltersState) => void;
  resultCount: number;
}

export function AccountFilters({ filters, onFiltersChange, resultCount }: AccountFiltersProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

  const update = (patch: Partial<AccountFiltersState>) => onFiltersChange({ ...filters, ...patch });

  const setRule = (index: number, patch: Partial<FilterRule>) => {
    const next = [...filters.rules];
    next[index] = { ...next[index], ...patch };
    update({ rules: next });
  };

  const addRule = () => {
    update({ rules: [...filters.rules, emptyRule()] });
    setRulesOpen(true);
  };

  const removeRule = (index: number) =>
    update({ rules: filters.rules.filter((_, i) => i !== index) });

  const clearAll = () =>
    onFiltersChange({ search: '', newsletter: '', googleAuth: '', dateFrom: '', dateTo: '', rules: [] });

  const hasActiveFilters =
    filters.search.trim() ||
    filters.newsletter ||
    filters.googleAuth ||
    filters.dateFrom.trim() ||
    filters.dateTo.trim() ||
    filters.rules.some((r) => r.value.trim());

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <Select
          value={filters.newsletter || '_'}
          onValueChange={(v) =>
            update({ newsletter: v === '_' ? '' : (v as AccountFiltersState['newsletter']) })
          }
        >
          <SelectTrigger className="w-[150px] border-gray-300 bg-gray-50">
            <SelectValue placeholder="Newsletter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">All accounts</SelectItem>
            <SelectItem value="yes">Subscribed</SelectItem>
            <SelectItem value="no">Not subscribed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.googleAuth || '_'}
          onValueChange={(v) =>
            update({ googleAuth: v === '_' ? '' : (v as AccountFiltersState['googleAuth']) })
          }
        >
          <SelectTrigger className="w-[150px] border-gray-300 bg-gray-50">
            <SelectValue placeholder="Auth type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">All auth types</SelectItem>
            <SelectItem value="yes">Google Sign-in</SelectItem>
            <SelectItem value="no">Email / Password</SelectItem>
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
                  aria-label="Remove rule"
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
        Showing {resultCount} account{resultCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
