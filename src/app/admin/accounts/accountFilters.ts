/**
 * Account filter state and apply logic for Admin Accounts page.
 */

export type AccountForFilter = {
  id: string;
  name: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  googleId: string | null;
  newsletter: boolean;
  createdAt: string;
};

export type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains';

export type FilterField = 'name' | 'email' | 'phone' | 'newsletter' | 'googleAuth' | 'date';

export interface FilterRule {
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export interface AccountFiltersState {
  search: string;
  newsletter: '' | 'yes' | 'no';
  googleAuth: '' | 'yes' | 'no';
  dateFrom: string;
  dateTo: string;
  rules: FilterRule[];
}

function parseDate(s: string): number | null {
  if (!s?.trim()) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function getAccountValue(item: AccountForFilter, field: FilterField): string | number | boolean {
  switch (field) {
    case 'name': return [item.name, item.lastName].filter(Boolean).join(' ');
    case 'email': return item.email;
    case 'phone': return item.phone ?? '';
    case 'newsletter': return item.newsletter;
    case 'googleAuth': return !!item.googleId;
    case 'date': return item.createdAt;
    default: return '';
  }
}

function matchRule(item: AccountForFilter, rule: FilterRule): boolean {
  const raw = getAccountValue(item, rule.field);
  const itemVal = typeof raw === 'boolean' ? String(raw) : String(raw ?? '').toLowerCase();
  const ruleVal = (rule.value ?? '').trim().toLowerCase();
  const isDateField = rule.field === 'date';
  const itemCompare = isDateField ? (parseDate(String(raw)) ?? 0) : 0;
  const ruleCompare = isDateField ? (parseDate(rule.value) ?? 0) : 0;

  switch (rule.operator) {
    case '=':
      if (isDateField) return itemCompare === ruleCompare;
      return itemVal === ruleVal;
    case '!=':
      if (isDateField) return itemCompare !== ruleCompare;
      return itemVal !== ruleVal;
    case '>': return itemCompare > ruleCompare;
    case '>=': return itemCompare >= ruleCompare;
    case '<': return itemCompare < ruleCompare;
    case '<=': return itemCompare <= ruleCompare;
    case 'contains': return itemVal.includes(ruleVal);
    default: return true;
  }
}

export function applyAccountFilters(
  items: AccountForFilter[],
  filters: AccountFiltersState,
): AccountForFilter[] {
  return items.filter((item) => {
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const fullName = [item.name, item.lastName].filter(Boolean).join(' ').toLowerCase();
      const match =
        fullName.includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.phone ?? '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.newsletter === 'yes' && !item.newsletter) return false;
    if (filters.newsletter === 'no' && item.newsletter) return false;
    if (filters.googleAuth === 'yes' && !item.googleId) return false;
    if (filters.googleAuth === 'no' && item.googleId) return false;
    if (filters.dateFrom.trim()) {
      const t = parseDate(item.createdAt);
      const from = parseDate(filters.dateFrom);
      if (t == null || from == null || t < from) return false;
    }
    if (filters.dateTo.trim()) {
      const t = parseDate(item.createdAt);
      const to = parseDate(filters.dateTo);
      if (t == null || to == null || t > to) return false;
    }
    for (const rule of filters.rules) {
      if (!rule.value.trim()) continue;
      if (!matchRule(item, rule)) return false;
    }
    return true;
  });
}
