/**
 * Order filter state and apply logic for Admin Orders page.
 * Maps to fields: order_id (orderNo), customer_name, customer_email,
 * package_details (packageName), country_code (destination), price (totalAmount),
 * status, date (createdAt).
 */

export type OrderForFilter = {
  id: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains';

export type FilterField = 'order_id' | 'customer_name' | 'customer_email' | 'package_details' | 'country_code' | 'price' | 'status' | 'date';

export interface FilterRule {
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export interface OrderFiltersState {
  search: string;
  status: string;
  countryCode: string;
  dateFrom: string;
  dateTo: string;
  rules: FilterRule[];
}

export const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'] as const;

/** Parse a date string (e.g. "2/24/2026" or "2026-02-24") to timestamp for comparison */
function parseDate(s: string): number | null {
  if (!s?.trim()) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function getOrderValue(order: OrderForFilter, field: FilterField): string | number {
  switch (field) {
    case 'order_id': return order.orderNo;
    case 'customer_name': return order.customerName;
    case 'customer_email': return order.customerEmail;
    case 'package_details': return order.packageName;
    case 'country_code': return order.destination;
    case 'price': return order.totalAmount;
    case 'status': return order.status;
    case 'date': return order.createdAt;
    default: return '';
  }
}

function matchRule(order: OrderForFilter, rule: FilterRule): boolean {
  const raw = getOrderValue(order, rule.field);
  const orderVal = typeof raw === 'number' ? raw : String(raw ?? '').toLowerCase();
  const ruleVal = (rule.value ?? '').trim().toLowerCase();
  const ruleNum = parseFloat(rule.value);
  const orderNum = typeof raw === 'number' ? raw : parseFloat(String(raw));
  const isDateField = rule.field === 'date';
  const orderCompare = isDateField ? (parseDate(String(raw)) ?? 0) : orderNum;
  const ruleCompare = isDateField ? (parseDate(rule.value) ?? 0) : ruleNum;

  switch (rule.operator) {
    case '=':
      if (isDateField) return orderCompare === ruleCompare;
      if (typeof raw === 'number') return orderNum === ruleNum;
      return orderVal === ruleVal;
    case '!=':
      if (isDateField) return orderCompare !== ruleCompare;
      if (typeof raw === 'number') return orderNum !== ruleNum;
      return orderVal !== ruleVal;
    case '>':
      return orderCompare > ruleCompare;
    case '>=':
      return orderCompare >= ruleCompare;
    case '<':
      return orderCompare < ruleCompare;
    case '<=':
      return orderCompare <= ruleCompare;
    case 'contains':
      return String(orderVal).includes(ruleVal);
    default:
      return true;
  }
}

/**
 * Apply filters to the given orders. Combines: free-text search, status, country_code,
 * date range, and all custom rules (AND together).
 */
export function applyOrderFilters(orders: OrderForFilter[], filters: OrderFiltersState): OrderForFilter[] {
  return orders.filter((order) => {
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const matchSearch =
        order.orderNo.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    if (filters.status && order.status !== filters.status) return false;
    if (filters.countryCode && order.destination !== filters.countryCode) return false;
    if (filters.dateFrom.trim()) {
      const orderTime = parseDate(order.createdAt);
      const from = parseDate(filters.dateFrom);
      if (orderTime == null || from == null || orderTime < from) return false;
    }
    if (filters.dateTo.trim()) {
      const orderTime = parseDate(order.createdAt);
      const to = parseDate(filters.dateTo);
      if (orderTime == null || to == null || orderTime > to) return false;
    }
    for (const rule of filters.rules) {
      if (!rule.value.trim()) continue;
      if (!matchRule(order, rule)) return false;
    }
    return true;
  });
}

export function getUniqueCountryCodes(orders: OrderForFilter[]): string[] {
  const set = new Set(orders.map((o) => o.destination).filter(Boolean));
  return Array.from(set).sort();
}
