/**
 * Shared profit calculation utilities (server and client).
 * Used by Admin products list, product edit, and dashboard.
 */

export interface PaddleFeeParams {
  percentageFee: number; // 0–1, e.g. 0.05 = 5%
  fixedFee: number;      // USD per transaction
}

export interface AdditionalFeeItem {
  type: 'fixed' | 'percentage';
  value: number;
  isActive: boolean;
  appliesTo: 'all_products' | 'selected_products';
  selectedProductIds?: string[]; // packageCode list when appliesTo = selected_products
}

export interface ProfitInput {
  salePrice: number;
  simCost: number;
  percentageFee: number;
  fixedFee: number;
  otherFeesTotal: number;
}

export interface ProfitResult {
  paddleFeeAmount: number;
  otherFeesTotal: number;
  netProfit: number;
  profitMargin: number;
  breakEvenPrice: number;
}

/**
 * Paddle fee amount for a given sale price.
 */
export function paddleFeeAmount(salePrice: number, percentageFee: number, fixedFee: number): number {
  return salePrice * percentageFee + fixedFee;
}

/**
 * Sum of additional fees that apply to this product.
 * Fixed fees add `value`; percentage fees add `salePrice * value`.
 */
export function computeOtherFeesTotal(
  salePrice: number,
  additionalFees: AdditionalFeeItem[],
  packageCode: string
): number {
  let total = 0;
  for (const fee of additionalFees) {
    if (!fee.isActive) continue;
    const applies =
      fee.appliesTo === 'all_products' ||
      (fee.appliesTo === 'selected_products' && fee.selectedProductIds?.includes(packageCode));
    if (!applies) continue;
    if (fee.type === 'fixed') {
      total += fee.value;
    } else {
      total += salePrice * fee.value;
    }
  }
  return total;
}

/**
 * Net profit per transaction.
 * profit = sale_price - sim_cost - (sale_price * percentage_fee) - fixed_fee - other_fees_total
 */
export function netProfit(input: ProfitInput): number {
  const { salePrice, simCost, percentageFee, fixedFee, otherFeesTotal } = input;
  const paddle = salePrice * percentageFee + fixedFee;
  return salePrice - simCost - paddle - otherFeesTotal;
}

/**
 * Profit margin (0–1). Returns 0 if sale_price <= 0.
 */
export function profitMargin(profit: number, salePrice: number): number {
  if (salePrice <= 0) return 0;
  return profit / salePrice;
}

/**
 * Break-even price: (sim_cost + fixed_fee + other_fees_total) / (1 - percentage_fee).
 * Returns NaN if percentage_fee >= 1 (avoids division by zero).
 */
export function breakEvenPrice(
  simCost: number,
  fixedFee: number,
  otherFeesTotal: number,
  percentageFee: number
): number {
  const denom = 1 - percentageFee;
  if (denom <= 0) return NaN;
  return (simCost + fixedFee + otherFeesTotal) / denom;
}

/**
 * All profit metrics in one call. Use this everywhere for consistency.
 */
export function computeProfit(input: ProfitInput): ProfitResult {
  const paddleFee = paddleFeeAmount(input.salePrice, input.percentageFee, input.fixedFee);
  const profit = netProfit(input);
  const margin = profitMargin(profit, input.salePrice);
  const bePrice = breakEvenPrice(
    input.simCost,
    input.fixedFee,
    input.otherFeesTotal,
    input.percentageFee
  );
  return {
    paddleFeeAmount: paddleFee,
    otherFeesTotal: input.otherFeesTotal,
    netProfit: profit,
    profitMargin: margin,
    breakEvenPrice: Number.isFinite(bePrice) ? bePrice : NaN,
  };
}
