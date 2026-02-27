/**
 * Unit tests for order filter logic. Run: npx tsx src/app/admin/orders/orderFilters.test.ts
 */
import assert from 'node:assert';
import { applyOrderFilters, getUniqueCountryCodes, type OrderFiltersState, type OrderForFilter } from './orderFilters';

const sampleOrders: OrderForFilter[] = [
  {
    id: '1',
    orderNo: 'ord_abc123',
    customerName: 'Gabriel Kreskas',
    customerEmail: 'gavriel.kr@gmail.com',
    packageName: 'Uzbekistan 500MB 7Days',
    destination: 'UZ',
    totalAmount: 0.8,
    status: 'COMPLETED',
    createdAt: '2/24/2026',
  },
  {
    id: '2',
    orderNo: 'ord_def456',
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    packageName: 'Armenia 1GB 30Days',
    destination: 'AM',
    totalAmount: 1.2,
    status: 'PENDING',
    createdAt: '2/25/2026',
  },
  {
    id: '3',
    orderNo: 'ord_ghi789',
    customerName: 'Bob Smith',
    customerEmail: 'bob@test.com',
    packageName: 'Uzbekistan 500MB 7Days',
    destination: 'UZ',
    totalAmount: 0.7,
    status: 'COMPLETED',
    createdAt: '2/23/2026',
  },
];

const emptyFilters: OrderFiltersState = {
  search: '',
  status: '',
  countryCode: '',
  dateFrom: '',
  dateTo: '',
  rules: [],
};

// No filters => all orders
const all = applyOrderFilters(sampleOrders, emptyFilters);
assert.strictEqual(all.length, 3, 'empty filters returns all orders');

// Search by order_id
const byOrderId = applyOrderFilters(sampleOrders, { ...emptyFilters, search: 'ord_abc' });
assert.strictEqual(byOrderId.length, 1);
assert.strictEqual(byOrderId[0].orderNo, 'ord_abc123');

// Search by customer name
const byName = applyOrderFilters(sampleOrders, { ...emptyFilters, search: 'Gabriel' });
assert.strictEqual(byName.length, 1);
assert.strictEqual(byName[0].customerName, 'Gabriel Kreskas');

// Search by email
const byEmail = applyOrderFilters(sampleOrders, { ...emptyFilters, search: 'jane@example' });
assert.strictEqual(byEmail.length, 1);
assert.strictEqual(byEmail[0].customerEmail, 'jane@example.com');

// Status filter
const completed = applyOrderFilters(sampleOrders, { ...emptyFilters, status: 'COMPLETED' });
assert.strictEqual(completed.length, 2);
assert.ok(completed.every((o) => o.status === 'COMPLETED'));

// Country filter
const uz = applyOrderFilters(sampleOrders, { ...emptyFilters, countryCode: 'UZ' });
assert.strictEqual(uz.length, 2);
assert.ok(uz.every((o) => o.destination === 'UZ'));

// Custom rule: price > 0.70
const priceRule = applyOrderFilters(sampleOrders, {
  ...emptyFilters,
  rules: [{ field: 'price', operator: '>', value: '0.70' }],
});
assert.strictEqual(priceRule.length, 2);
assert.ok(priceRule.every((o) => o.totalAmount > 0.7));

// Custom rule: price >= 0.80
const priceGte = applyOrderFilters(sampleOrders, {
  ...emptyFilters,
  rules: [{ field: 'price', operator: '>=', value: '0.80' }],
});
assert.strictEqual(priceGte.length, 2);

// Custom rule: status equals COMPLETED
const statusRule = applyOrderFilters(sampleOrders, {
  ...emptyFilters,
  rules: [{ field: 'status', operator: '=', value: 'COMPLETED' }],
});
assert.strictEqual(statusRule.length, 2);

// Combined: country UZ + status COMPLETED
const combined = applyOrderFilters(sampleOrders, {
  ...emptyFilters,
  countryCode: 'UZ',
  status: 'COMPLETED',
});
assert.strictEqual(combined.length, 2);
assert.ok(combined.every((o) => o.destination === 'UZ' && o.status === 'COMPLETED'));

// getUniqueCountryCodes
const countries = getUniqueCountryCodes(sampleOrders);
assert.deepStrictEqual(countries, ['AM', 'UZ']);

console.log('orderFilters.test.ts: all assertions passed');
process.exit(0);
