'use client';

import { useState } from 'react';

interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  totalAmount: number;
  status: string;
  errorMessage: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  iccid: string | null;
  paddleTransactionId: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export function AdminOrdersClient({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const setOrderLoading = (id: string, val: boolean) =>
    setLoading((prev) => ({ ...prev, [id]: val }));

  const handleRetry = async (order: Order) => {
    if (!confirm(`Retry fulfillment for order ${order.orderNo.slice(0, 12)}?`)) return;
    setOrderLoading(order.id, true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: 'COMPLETED', errorMessage: null } : o));
        setMessage({ id: order.id, text: '✓ Fulfilled successfully', ok: true });
      } else {
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: 'FAILED', errorMessage: data.error } : o));
        setMessage({ id: order.id, text: `✗ ${data.error}`, ok: false });
      }
    } catch {
      setMessage({ id: order.id, text: '✗ Network error', ok: false });
    } finally {
      setOrderLoading(order.id, false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-gray-500">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Main row */}
          <div
            className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 hover:bg-gray-50"
            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
          >
            <span className="font-mono text-xs text-gray-400 w-32 shrink-0">{order.orderNo.slice(0, 16)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{order.customerName || '—'}</p>
              <p className="text-xs text-gray-500 truncate">{order.customerEmail}</p>
            </div>
            <div className="hidden md:block flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{order.packageName}</p>
              <p className="text-xs text-gray-400">{order.destination}</p>
            </div>
            <span className="font-semibold text-gray-800">${order.totalAmount.toFixed(2)}</span>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
              {order.status}
            </span>
            <span className="text-xs text-gray-400 shrink-0">{order.createdAt}</span>
            <span className="text-gray-400 text-sm">{expanded === order.id ? '▲' : '▼'}</span>
          </div>

          {/* Expanded details */}
          {expanded === order.id && (
            <div className="border-t border-gray-100 px-4 py-4 space-y-3 text-sm">
              {/* Error message */}
              {order.errorMessage && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="font-semibold text-red-700 text-xs uppercase mb-1">Error</p>
                  <p className="text-red-600 font-mono text-xs break-all">{order.errorMessage}</p>
                </div>
              )}

              {/* eSIM details */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {order.paddleTransactionId && (
                  <div>
                    <p className="text-xs text-gray-400">Paddle Transaction</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{order.paddleTransactionId}</p>
                  </div>
                )}
                {order.iccid && (
                  <div>
                    <p className="text-xs text-gray-400">ICCID</p>
                    <p className="font-mono text-xs text-gray-700">{order.iccid}</p>
                  </div>
                )}
                {order.smdpAddress && (
                  <div>
                    <p className="text-xs text-gray-400">SM-DP+ Address</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{order.smdpAddress}</p>
                  </div>
                )}
                {order.activationCode && (
                  <div>
                    <p className="text-xs text-gray-400">Activation Code</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{order.activationCode}</p>
                  </div>
                )}
              </div>

              {order.qrCodeUrl && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">QR Code</p>
                  <img src={order.qrCodeUrl} alt="eSIM QR" className="h-32 w-32 rounded-lg border" />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(order.status === 'FAILED' || order.status === 'PROCESSING' || order.status === 'PENDING') && (
                  <button
                    onClick={() => handleRetry(order)}
                    disabled={loading[order.id]}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading[order.id] ? 'Retrying…' : '↺ Retry Fulfillment'}
                  </button>
                )}
                <a
                  href={`mailto:${order.customerEmail}?subject=Your eSIM from SIM2ME&body=Hi ${order.customerName || 'Customer'},`}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ✉ Email Customer
                </a>
                {order.paddleTransactionId && (
                  <a
                    href={`https://vendors.paddle.com/transactions-v2`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    ↗ View in Paddle
                  </a>
                )}
              </div>

              {/* Action feedback */}
              {message?.id === order.id && (
                <p className={`text-xs font-medium ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                  {message.text}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
