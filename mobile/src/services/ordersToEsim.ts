import type { OrderFromApi } from './api';
import type { ESim } from '../types';

/**
 * Map API orders to ESim list for My eSIMs.
 *
 * Backend: one Order = one eSIM (single plan per checkout). Each order has one iccid, qrCodeUrl, etc.
 * So we map 1:1. If the API ever returns multiple eSIMs per order (e.g. quantity > 1), we would
 * expand here: one order → multiple ESim items keyed by order.id + index or by iccid.
 */
export function ordersToEsims(orders: OrderFromApi[]): ESim[] {
  return orders.map((o) => ({
    id: o.id,
    orderId: o.id,
    destinationName: o.destination,
    planName: o.packageName,
    status: o.status === 'COMPLETED' && o.iccid ? 'active' : 'pending',
    activationCode: o.activationCode ?? '',
    iccid: o.iccid,
    qrCodeUrl: o.qrCodeUrl,
    smdpAddress: o.smdpAddress,
    dataAmount: o.dataAmount,
    validity: o.validity,
    qrPlaceholder: !o.qrCodeUrl && o.status === 'COMPLETED',
  }));
}
