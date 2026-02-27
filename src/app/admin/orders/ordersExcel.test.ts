/**
 * Unit tests for Excel row mapping (no file I/O). Run: npx tsx src/app/admin/orders/ordersExcel.test.ts
 */
import assert from 'node:assert';
import {
  ordersToExcelRows,
  excelRowsToOrders,
  type OrderExcelRow,
  type OrderForExcel,
} from './ordersExcel';

const sampleOrders: OrderForExcel[] = [
  {
    orderNo: 'cmlzumw4000311x',
    customerName: 'Gabriel Kreskas',
    customerEmail: 'gavriel.kr@gmail.com',
    packageName: 'Uzbekistan 500MB 7Days',
    destination: 'UZ',
    totalAmount: 0.8,
    status: 'COMPLETED',
    createdAt: '2/24/2026',
  },
];

// Export mapping: our fields -> Excel columns
const rows = ordersToExcelRows(sampleOrders);
assert.strictEqual(rows.length, 1);
const row = rows[0];
assert.strictEqual(row.order_id, 'cmlzumw4000311x');
assert.strictEqual(row.customer_name, 'Gabriel Kreskas');
assert.strictEqual(row.customer_email, 'gavriel.kr@gmail.com');
assert.strictEqual(row.package_details, 'Uzbekistan 500MB 7Days');
assert.strictEqual(row.country_code, 'UZ');
assert.strictEqual(row.price, 0.8);
assert.strictEqual(row.status, 'COMPLETED');
assert.strictEqual(row.date, '2/24/2026');

// Round-trip: orders -> rows -> back to order-like objects
const back = excelRowsToOrders(rows);
assert.strictEqual(back.length, 1);
assert.strictEqual(back[0].order_id, sampleOrders[0].orderNo);
assert.strictEqual(back[0].orderNo, sampleOrders[0].orderNo);
assert.strictEqual(back[0].customerName, sampleOrders[0].customerName);
assert.strictEqual(back[0].status, sampleOrders[0].status);
assert.strictEqual(back[0].totalAmount, sampleOrders[0].totalAmount);

// Column set
const expectedCols: (keyof OrderExcelRow)[] = [
  'order_id',
  'customer_name',
  'customer_email',
  'package_details',
  'country_code',
  'price',
  'status',
  'date',
];
for (const col of expectedCols) {
  assert.ok(col in row, `Excel row must have column ${col}`);
}

console.log('ordersExcel.test.ts: all assertions passed');
process.exit(0);
