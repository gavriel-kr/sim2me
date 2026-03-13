/**
 * Contact submission filter state and apply logic for Admin Contact page.
 */

export type ContactForFilter = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  marketingConsent: boolean;
  read: boolean;
  status: string;
  createdAt: string;
};

export type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains';

export type FilterField = 'name' | 'email' | 'phone' | 'subject' | 'message' | 'marketing_consent' | 'read' | 'status' | 'date';

export interface FilterRule {
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export interface ContactFiltersState {
  search: string;
  readStatus: '' | 'read' | 'unread';
  status: string;
  marketingConsent: '' | 'yes' | 'no';
  dateFrom: string;
  dateTo: string;
  rules: FilterRule[];
}

function parseDate(s: string): number | null {
  if (!s?.trim()) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function getContactValue(item: ContactForFilter, field: FilterField): string | number | boolean {
  switch (field) {
    case 'name': return item.name;
    case 'email': return item.email;
    case 'phone': return item.phone ?? '';
    case 'subject': return item.subject;
    case 'message': return item.message;
    case 'marketing_consent': return item.marketingConsent;
    case 'read': return item.read;
    case 'status': return item.status;
    case 'date': return item.createdAt;
    default: return '';
  }
}

function matchRule(item: ContactForFilter, rule: FilterRule): boolean {
  const raw = getContactValue(item, rule.field);
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

export function applyContactFilters(items: ContactForFilter[], filters: ContactFiltersState): ContactForFilter[] {
  return items.filter((item) => {
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        (item.phone ?? '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.readStatus === 'read' && !item.read) return false;
    if (filters.readStatus === 'unread' && item.read) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.marketingConsent === 'yes' && !item.marketingConsent) return false;
    if (filters.marketingConsent === 'no' && item.marketingConsent) return false;
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
