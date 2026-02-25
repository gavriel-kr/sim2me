/**
 * Unit tests for profit calculations. Run: npx tsx src/lib/profit.test.ts
 */
import assert from 'node:assert';
import {
  computeProfit,
  netProfit,
  profitMargin,
  breakEvenPrice,
  paddleFeeAmount,
  computeOtherFeesTotal,
  type AdditionalFeeItem,
} from './profit';

function round6(x: number): number {
  return Math.round(x * 1e6) / 1e6;
}

// Example from spec: sale_price=0.70, sim_cost=0.30, percentage_fee=0.05, fixed_fee=0.50 => profit = -0.135
assert.strictEqual(
  round6(netProfit({ salePrice: 0.7, simCost: 0.3, percentageFee: 0.05, fixedFee: 0.5, otherFeesTotal: 0 })),
  -0.135,
  'netProfit(0.70, 0.30, 0.05, 0.50) should be -0.135'
);

// Break-even: sim_cost=0.30, percentage_fee=0.05, fixed_fee=0.50 => ~0.842105...
const be = breakEvenPrice(0.3, 0.5, 0, 0.05);
assert.ok(Math.abs(be - 0.8 / 0.95) < 1e-6, `breakEvenPrice should be ~0.8421, got ${be}`);
assert.ok(Math.abs(be - 0.8421052631578947) < 1e-6, 'breakEvenPrice value');

// Full computeProfit for the same case
const result = computeProfit({
  salePrice: 0.7,
  simCost: 0.3,
  percentageFee: 0.05,
  fixedFee: 0.5,
  otherFeesTotal: 0,
});
assert.strictEqual(round6(result.netProfit), -0.135, 'computeProfit netProfit');
assert.strictEqual(round6(result.paddleFeeAmount), round6(0.7 * 0.05 + 0.5), 'paddleFeeAmount = 0.035 + 0.50');
assert.strictEqual(result.profitMargin, result.netProfit / 0.7, 'profitMargin = profit / sale_price');
assert.ok(Number.isFinite(result.breakEvenPrice) && Math.abs(result.breakEvenPrice - 0.8 / 0.95) < 1e-6, 'breakEvenPrice');

// profit_margin when sale_price > 0
assert.strictEqual(profitMargin(-0.135, 0.7), -0.135 / 0.7, 'profitMargin');
// profit_margin when sale_price <= 0
assert.strictEqual(profitMargin(1, 0), 0, 'profitMargin(sale_price=0) returns 0');

// break_even when percentage_fee >= 1 returns NaN (safe)
assert.ok(Number.isNaN(breakEvenPrice(0.3, 0.5, 0, 1)), 'breakEvenPrice(percentage_fee=1) is NaN');
assert.ok(Number.isNaN(breakEvenPrice(0.3, 0.5, 0, 1.2)), 'breakEvenPrice(percentage_fee>1) is NaN');

// paddleFeeAmount
assert.strictEqual(round6(paddleFeeAmount(10, 0.05, 0.5)), 1, 'paddleFeeAmount(10, 0.05, 0.5) = 1');

// Additional fees: fixed and percentage
const additionalFees: AdditionalFeeItem[] = [
  { type: 'fixed', value: 0.1, isActive: true, appliesTo: 'all_products' },
  { type: 'percentage', value: 0.02, isActive: true, appliesTo: 'all_products' },
];
const other = computeOtherFeesTotal(5, additionalFees, 'any');
assert.strictEqual(round6(other), round6(0.1 + 5 * 0.02), 'otherFeesTotal = 0.1 + 0.1 = 0.2');

// selected_products: only applies when packageCode in list
const feesSelected: AdditionalFeeItem[] = [
  { type: 'fixed', value: 1, isActive: true, appliesTo: 'selected_products', selectedProductIds: ['pkg-A'] },
];
assert.strictEqual(computeOtherFeesTotal(10, feesSelected, 'pkg-A'), 1, 'selected_products applies');
assert.strictEqual(computeOtherFeesTotal(10, feesSelected, 'pkg-B'), 0, 'selected_products does not apply');

// inactive fee excluded
const withInactive: AdditionalFeeItem[] = [
  { type: 'fixed', value: 1, isActive: false, appliesTo: 'all_products' },
];
assert.strictEqual(computeOtherFeesTotal(10, withInactive, 'x'), 0, 'inactive fee excluded');

console.log('All profit tests passed.');
export {};
