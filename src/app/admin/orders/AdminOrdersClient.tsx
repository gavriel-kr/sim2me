'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Download, Upload, Copy, Check } from 'lucide-react';
import { DashboardCubicks, type CubickStat } from '../DashboardCubicks';
import { applyOrderFilters, type OrderFiltersState, ORDER_STATUSES } from './orderFilters';
import { OrdersFilters } from './OrdersFilters';
import { exportOrdersToExcel, parseOrdersExcelFile } from './ordersExcel';
import { ConfirmDialog } from './ConfirmDialog';

// ─── Types ───────────────────────────────────────────────────

interface DbOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  totalAmount: number;
  currency: string;
  status: string;
  errorMessage: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  iccid: string | null;
  paddleTransactionId: string | null;
  esimOrderId: string | null;
  notes: string | null;
  archivedAt: string | null; // ISO string
  createdAt: string;         // ISO string
}

interface DisplayOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  totalAmount: number;
  currency: string;
  status: string;
  errorMessage: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  iccid: string | null;
  paddleTransactionId: string | null;
  esimOrderId: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  source: 'db' | 'paddle';
}

interface EsimStatusData {
  status?: string | null;
  usedVolume?: number | null;
  remainingVolume?: number | null;
  orderVolume?: number | null;
  expiredTime?: number | null;
  iccid?: string | null;
  qrCodeUrl?: string | null;
  smdpAddress?: string | null;
  activationCode?: string | null;
  error?: string;
  noEsim?: boolean;
}

interface EditValues {
  customerEmail: string;
  customerName: string;
  notes: string;
  status: string;
  errorMessage: string;
}

type ConfirmState = {
  type: 'archive' | 'unarchive' | 'cancel-esim' | 'refund' | 'resend-email';
  orderId: string;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
} | null;

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes < 0) return 'Unlimited';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  return `${bytes} B`;
}

function formatExpiry(ms: number | null | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function esimStatusDot(status: string | null | undefined): string {
  if (!status) return 'bg-gray-300';
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('enable')) return 'bg-emerald-500';
  if (s.includes('expire') || s.includes('cancel')) return 'bg-red-500';
  return 'bg-yellow-400';
}

function esimStatusColor(status: string | null | undefined): string {
  if (!status) return 'text-gray-400';
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('enable')) return 'text-emerald-600';
  if (s.includes('expire') || s.includes('cancel')) return 'text-red-500';
  return 'text-yellow-600';
}

// ─── Status badge colors ──────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  ABANDONED: 'bg-amber-50 text-amber-700 border border-dashed border-amber-400',
};

// ─── Copy button ──────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <button type="button" onClick={copy} className="ml-1 inline-flex items-center rounded p-0.5 text-gray-400 hover:text-gray-600" title="Copy">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// ─── eSIM Status Panel ────────────────────────────────────────

function EsimStatusPanel({ data, order }: { data: EsimStatusData; order: DisplayOrder }) {
  const [showQr, setShowQr] = useState(false);

  const usedPct =
    data.orderVolume && data.usedVolume != null
      ? Math.min(100, Math.round((data.usedVolume / data.orderVolume) * 100))
      : null;

  const iccid = data.iccid || order.iccid;
  const smdpAddress = data.smdpAddress || order.smdpAddress;
  const activationCode = data.activationCode || order.activationCode;
  const qrCodeUrl = data.qrCodeUrl || order.qrCodeUrl;

  return (
    <div className="space-y-2">
      {data.status && (
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${esimStatusDot(data.status)}`} />
          <span className={`text-xs font-medium ${esimStatusColor(data.status)}`}>{data.status}</span>
        </div>
      )}
      {usedPct !== null && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Used: {formatBytes(data.usedVolume)}</span>
            <span>{formatBytes(data.orderVolume)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${usedPct > 80 ? 'bg-red-500' : usedPct > 50 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="mt-0.5 text-xs text-gray-400">Remaining: {formatBytes(data.remainingVolume)}</p>
        </div>
      )}
      {data.expiredTime && (
        <div>
          <p className="text-xs text-gray-400">Expires</p>
          <p className="text-xs text-gray-700">{formatExpiry(data.expiredTime)}</p>
        </div>
      )}
      {iccid && (
        <div>
          <p className="text-xs text-gray-400">ICCID</p>
          <div className="flex items-center">
            <p className="font-mono text-xs text-gray-700">{iccid}</p>
            <CopyButton text={iccid} />
          </div>
        </div>
      )}
      {smdpAddress && (
        <div>
          <p className="text-xs text-gray-400">SM-DP+</p>
          <div className="flex items-center">
            <p className="break-all font-mono text-xs text-gray-700">{smdpAddress}</p>
            <CopyButton text={smdpAddress} />
          </div>
        </div>
      )}
      {activationCode && (
        <div>
          <p className="text-xs text-gray-400">Activation Code</p>
          <div className="flex items-center">
            <p className="break-all font-mono text-xs text-gray-700">{activationCode}</p>
            <CopyButton text={activationCode} />
          </div>
        </div>
      )}
      {qrCodeUrl && (
        <div>
          <button type="button" onClick={() => setShowQr(!showQr)} className="text-xs text-blue-600 hover:underline">
            {showQr ? 'Hide QR' : 'Show QR Code'}
          </button>
          {showQr && <img src={qrCodeUrl} alt="eSIM QR" className="mt-1 h-32 w-32 rounded-lg border" />}
        </div>
      )}
    </div>
  );
}

// ─── Inline Edit Form ─────────────────────────────────────────

function InlineEditForm({
  values,
  onChange,
  onSave,
  onCancel,
  loading,
}: {
  values: EditValues;
  onChange: (patch: Partial<EditValues>) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30';
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-0.5 block text-xs text-gray-400">Customer Email</label>
          <input className={inputCls} value={values.customerEmail} onChange={(e) => onChange({ customerEmail: e.target.value })} />
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-400">Customer Name</label>
          <input className={inputCls} value={values.customerName} onChange={(e) => onChange({ customerName: e.target.value })} />
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-400">Status</label>
          <select className={inputCls} value={values.status} onChange={(e) => onChange({ status: e.target.value })}>
            {ORDER_STATUSES.filter((s) => s !== 'ABANDONED').map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-400">Error Message (clear to remove)</label>
          <input className={inputCls} value={values.errorMessage} onChange={(e) => onChange({ errorMessage: e.target.value })} placeholder="—" />
        </div>
      </div>
      <div>
        <label className="mb-0.5 block text-xs text-gray-400">Internal Notes</label>
        <textarea
          className={`${inputCls} min-h-[60px] resize-y`}
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Notes visible only to admins…"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Default filters ──────────────────────────────────────────

const defaultFilters: OrderFiltersState = {
  search: '',
  status: '',
  countryCode: '',
  dateFrom: '',
  dateTo: '',
  rules: [],
};

// ─── Main component ───────────────────────────────────────────

export function AdminOrdersClient({ stats, orders: initialOrders }: { stats: CubickStat[]; orders: DbOrder[] }) {
  const [dbOrders, setDbOrders] = useState<DisplayOrder[]>(
    initialOrders.map((o) => ({ ...o, source: 'db' as const })),
  );
  const [abandonedOrders, setAbandonedOrders] = useState<DisplayOrder[]>([]);
  const [abandonedLoading, setAbandonedLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState<OrderFiltersState>(defaultFilters);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [esimStatusMap, setEsimStatusMap] = useState<Record<string, EsimStatusData | 'loading' | 'error'>>({});
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ customerEmail: '', customerName: '', notes: '', status: '', errorMessage: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [esimBalance, setEsimBalance] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/esimaccess/packages')
      .then((r) => r.json())
      .then((d) => { if (typeof d.balance === 'number') setEsimBalance(d.balance); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/orders/abandoned')
      .then((r) => r.json())
      .then((d) => {
        const items: DisplayOrder[] = (d.abandoned ?? []).map((a: {
          paddleTransactionId: string;
          customerEmail: string | null;
          totalAmount: number;
          currency: string;
          createdAt: string;
        }) => ({
          id: a.paddleTransactionId,
          orderNo: a.paddleTransactionId,
          customerName: '',
          customerEmail: a.customerEmail ?? '',
          packageName: '',
          destination: '',
          totalAmount: a.totalAmount,
          currency: a.currency,
          status: 'ABANDONED',
          errorMessage: null,
          qrCodeUrl: null,
          smdpAddress: null,
          activationCode: null,
          iccid: null,
          paddleTransactionId: a.paddleTransactionId,
          esimOrderId: null,
          notes: null,
          archivedAt: null,
          createdAt: a.createdAt,
          source: 'paddle' as const,
        }));
        setAbandonedOrders(items);
      })
      .catch(() => {})
      .finally(() => setAbandonedLoading(false));
  }, []);

  const allOrders = useMemo<DisplayOrder[]>(() => {
    const merged = [...dbOrders, ...abandonedOrders];
    const filtered = showArchived ? merged : merged.filter((o) => !o.archivedAt);
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [dbOrders, abandonedOrders, showArchived]);

  const filteredOrders = applyOrderFilters(allOrders, filters);

  const setOrderLoading = (id: string, val: boolean) =>
    setActionLoading((prev) => ({ ...prev, [id]: val }));

  const showMessage = (id: string, text: string, ok: boolean) =>
    setMessage({ id, text, ok });

  // ─── Expand ───────────────────────────────────────────────

  const handleExpand = (orderId: string, order: DisplayOrder) => {
    if (expanded === orderId) {
      setExpanded(null);
      setEditingOrderId(null);
      return;
    }
    setExpanded(orderId);
    if (order.source === 'db' && (order.iccid || order.esimOrderId) && !esimStatusMap[orderId]) {
      setEsimStatusMap((prev) => ({ ...prev, [orderId]: 'loading' }));
      fetch(`/api/admin/orders/${orderId}/esim-status`)
        .then((r) => r.json())
        .then((data: EsimStatusData) => setEsimStatusMap((prev) => ({ ...prev, [orderId]: data })))
        .catch(() => setEsimStatusMap((prev) => ({ ...prev, [orderId]: 'error' })));
    }
  };

  const refreshEsimStatus = (orderId: string) => {
    setEsimStatusMap((prev) => ({ ...prev, [orderId]: 'loading' }));
    fetch(`/api/admin/orders/${orderId}/esim-status`)
      .then((r) => r.json())
      .then((data: EsimStatusData) => setEsimStatusMap((prev) => ({ ...prev, [orderId]: data })))
      .catch(() => setEsimStatusMap((prev) => ({ ...prev, [orderId]: 'error' })));
  };

  // ─── Retry ────────────────────────────────────────────────

  const handleRetry = async (order: DisplayOrder) => {
    if (!confirm(`Retry fulfillment for order ${order.orderNo.slice(0, 16)}?`)) return;
    setOrderLoading(order.id, true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setDbOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: 'COMPLETED', errorMessage: null } : o));
        showMessage(order.id, '✓ Fulfilled successfully', true);
        refreshEsimStatus(order.id);
      } else {
        setDbOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: 'FAILED', errorMessage: data.error } : o));
        showMessage(order.id, `✗ ${data.error}`, false);
      }
    } catch {
      showMessage(order.id, '✗ Network error', false);
    } finally {
      setOrderLoading(order.id, false);
    }
  };

  // ─── Confirm Dialog executor ──────────────────────────────

  const executeConfirm = async () => {
    if (!confirmState) return;
    setConfirmLoading(true);

    const { type, orderId } = confirmState;

    try {
      if (type === 'archive' || type === 'unarchive') {
        const res = await fetch(`/api/admin/orders/${orderId}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: type === 'archive' }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setDbOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, archivedAt: data.archivedAt } : o));
          showMessage(orderId, type === 'archive' ? '✓ Archived' : '✓ Restored', true);
        } else {
          showMessage(orderId, `✗ ${data.error ?? 'Failed'}`, false);
        }
      }

      if (type === 'cancel-esim') {
        const res = await fetch(`/api/admin/orders/${orderId}/cancel-esim`, { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
          setDbOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
          showMessage(orderId, '✓ eSIM cancelled', true);
        } else {
          showMessage(orderId, `✗ ${data.error}`, false);
        }
      }

      if (type === 'refund') {
        const res = await fetch(`/api/admin/orders/${orderId}/refund`, { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
          setDbOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'REFUNDED' } : o));
          showMessage(orderId, '✓ Refund issued', true);
        } else {
          showMessage(orderId, `✗ ${data.error}`, false);
        }
      }

      if (type === 'resend-email') {
        const res = await fetch(`/api/admin/orders/${orderId}/resend-email`, { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
          showMessage(orderId, '✓ Email sent', true);
        } else {
          showMessage(orderId, `✗ ${data.error}`, false);
        }
      }
    } catch {
      showMessage(confirmState.orderId, '✗ Network error', false);
    } finally {
      setConfirmLoading(false);
      setConfirmState(null);
    }
  };

  // ─── Edit ─────────────────────────────────────────────────

  const startEdit = (order: DisplayOrder) => {
    setEditingOrderId(order.id);
    setEditValues({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      notes: order.notes ?? '',
      status: order.status === 'ABANDONED' ? 'PENDING' : order.status,
      errorMessage: order.errorMessage ?? '',
    });
  };

  const handleEditSave = async (orderId: string) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      const data = await res.json();
      if (data.ok && data.order) {
        setDbOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  customerEmail: data.order.customerEmail,
                  customerName: data.order.customerName,
                  status: data.order.status,
                  errorMessage: data.order.errorMessage,
                  notes: data.order.notes,
                  archivedAt: data.order.archivedAt,
                }
              : o,
          ),
        );
        showMessage(orderId, '✓ Order updated', true);
        setEditingOrderId(null);
      } else {
        showMessage(orderId, `✗ ${data.error ?? 'Update failed'}`, false);
      }
    } catch {
      showMessage(orderId, '✗ Network error', false);
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Excel ────────────────────────────────────────────────

  const handleExportExcel = async () => {
    if (filteredOrders.length === 0) return;
    setExporting(true);
    try {
      await exportOrdersToExcel(filteredOrders, `orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const rows = await parseOrdersExcelFile(file);
      if (rows.length === 0) { setImportResult('No valid rows (need order_id column).'); return; }
      const updates = rows.map((r) => ({ order_id: r.order_id, status: r.status }));
      const res = await fetch('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) { setImportResult(data?.error ?? 'Bulk update failed'); return; }
      setDbOrders((prev) =>
        prev.map((o) => {
          const u = updates.find((x) => x.order_id === o.orderNo);
          return u ? { ...o, status: u.status } : o;
        }),
      );
      setImportResult(`Updated ${data.updated} of ${data.total} orders.${data.errors?.length ? ` Errors: ${data.errors.join('; ')}` : ''}`);
    } catch (err) {
      setImportResult(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (dbOrders.length === 0 && !abandonedLoading && abandonedOrders.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-gray-500">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Confirm dialog */}
      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          loading={confirmLoading}
          onConfirm={executeConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      <DashboardCubicks stats={stats} />

      {esimBalance !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">eSIMaccess balance:</span>
          <Link
            href="/admin/esimaccess-orders"
            className={`font-semibold underline-offset-2 hover:underline ${esimBalance < 10 ? 'text-red-600' : 'text-emerald-600'}`}
          >
            ${esimBalance.toFixed(2)}
          </Link>
        </div>
      )}

      <OrdersFilters filters={filters} onFiltersChange={setFilters} orders={allOrders} resultCount={filteredOrders.length} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={exporting || filteredOrders.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export to Excel
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {importing ? 'Importing…' : 'Import from Excel'}
        </button>

        {/* Archived toggle */}
        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${showArchived ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          {showArchived ? '📁 Hiding archived' : '📁 Show archived'}
        </button>

        {importResult && <p className="text-sm text-gray-600">{importResult}</p>}
        {abandonedLoading && <span className="text-xs text-gray-400">Loading abandoned checkouts…</span>}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          No orders match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const esimData = esimStatusMap[order.id];
            const isExpanded = expanded === order.id;
            const hasEsim = order.source === 'db' && (!!order.iccid || !!order.esimOrderId);
            const isArchived = !!order.archivedAt;
            const isEditing = editingOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`rounded-2xl border bg-white shadow-sm transition-opacity ${
                  order.status === 'ABANDONED' ? 'border-dashed border-amber-300' : 'border-gray-200'
                } ${isArchived ? 'opacity-60' : ''}`}
              >
                {/* Main row */}
                <div
                  className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 hover:bg-gray-50"
                  onClick={() => handleExpand(order.id, order)}
                >
                  <span className="w-32 shrink-0 font-mono text-xs text-gray-400">
                    {(order.source === 'paddle' ? order.paddleTransactionId : order.orderNo)?.slice(0, 16)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{order.customerName || '—'}</p>
                    <p className="truncate text-xs text-gray-500">{order.customerEmail || '—'}</p>
                  </div>
                  <div className="hidden min-w-0 flex-1 md:block">
                    <p className="truncate text-sm text-gray-700">{order.packageName || '—'}</p>
                    <p className="text-xs text-gray-400">{order.destination || '—'}</p>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {order.totalAmount > 0 ? `$${order.totalAmount.toFixed(2)}` : '—'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    {isArchived && (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                        ARCHIVED
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                  <span className="text-sm text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-4">
                    {/* Error */}
                    {order.errorMessage && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase text-red-700">Error</p>
                        <p className="break-all font-mono text-xs text-red-600">{order.errorMessage}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && !isEditing && (
                      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase text-blue-600">Admin Notes</p>
                        <p className="text-xs text-blue-700">{order.notes}</p>
                      </div>
                    )}

                    {/* Edit form */}
                    {isEditing && (
                      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
                        <p className="mb-3 text-xs font-semibold uppercase text-gray-500">Edit Order</p>
                        <InlineEditForm
                          values={editValues}
                          onChange={(patch) => setEditValues((prev) => ({ ...prev, ...patch }))}
                          onSave={() => handleEditSave(order.id)}
                          onCancel={() => setEditingOrderId(null)}
                          loading={editLoading}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      {/* Section A: Paddle */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Paddle</p>
                        {order.paddleTransactionId ? (
                          <>
                            <div>
                              <p className="text-xs text-gray-400">Transaction ID</p>
                              <div className="flex items-start">
                                <p className="break-all font-mono text-xs text-gray-700">{order.paddleTransactionId}</p>
                                <CopyButton text={order.paddleTransactionId} />
                              </div>
                            </div>
                            <a
                              href={`https://vendors.paddle.com/transactions-v2/${order.paddleTransactionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              ↗ View in Paddle
                            </a>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">No Paddle transaction</p>
                        )}
                      </div>

                      {/* Section B: eSIM Access */}
                      {hasEsim ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">eSIM Access</p>
                            {esimData && esimData !== 'loading' && (
                              <button type="button" onClick={() => refreshEsimStatus(order.id)} className="text-xs text-gray-400 hover:text-gray-600" title="Refresh">↺</button>
                            )}
                          </div>
                          {!esimData && <p className="text-xs text-gray-400">Loading eSIM data…</p>}
                          {esimData === 'loading' && <p className="text-xs text-gray-400">Loading…</p>}
                          {esimData === 'error' && <p className="text-xs text-red-500">Failed to load eSIM data</p>}
                          {esimData && esimData !== 'loading' && esimData !== 'error' && (
                            esimData.noEsim ? (
                              <p className="text-xs text-gray-400">No eSIM provisioned</p>
                            ) : esimData.error ? (
                              <p className="text-xs text-red-500">{esimData.error}</p>
                            ) : (
                              <EsimStatusPanel data={esimData} order={order} />
                            )
                          )}
                          {/* Static DB fields while loading */}
                          {!esimData && (
                            <div className="space-y-2">
                              {order.iccid && (
                                <div>
                                  <p className="text-xs text-gray-400">ICCID</p>
                                  <div className="flex items-center"><p className="font-mono text-xs text-gray-700">{order.iccid}</p><CopyButton text={order.iccid} /></div>
                                </div>
                              )}
                              {order.smdpAddress && (
                                <div>
                                  <p className="text-xs text-gray-400">SM-DP+</p>
                                  <div className="flex items-center"><p className="break-all font-mono text-xs text-gray-700">{order.smdpAddress}</p><CopyButton text={order.smdpAddress} /></div>
                                </div>
                              )}
                              {order.activationCode && (
                                <div>
                                  <p className="text-xs text-gray-400">Activation Code</p>
                                  <div className="flex items-center"><p className="break-all font-mono text-xs text-gray-700">{order.activationCode}</p><CopyButton text={order.activationCode} /></div>
                                </div>
                              )}
                              {order.qrCodeUrl && <img src={order.qrCodeUrl} alt="eSIM QR" className="h-28 w-28 rounded-lg border" />}
                            </div>
                          )}
                        </div>
                      ) : order.source === 'paddle' ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">eSIM Access</p>
                          <p className="text-xs text-gray-400">No eSIM — checkout was not completed</p>
                        </div>
                      ) : null}

                      {/* Section C: Actions */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</p>
                        <div className="flex flex-col gap-2">
                          {/* Retry */}
                          {order.source === 'db' && ['FAILED', 'PROCESSING', 'PENDING'].includes(order.status) && (
                            <button
                              onClick={() => handleRetry(order)}
                              disabled={actionLoading[order.id]}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {actionLoading[order.id] ? 'Retrying…' : '↺ Retry Fulfillment'}
                            </button>
                          )}

                          {/* Cancel eSIM */}
                          {order.source === 'db' && order.esimOrderId && !['CANCELLED', 'COMPLETED', 'REFUNDED'].includes(order.status) && (
                            <button
                              onClick={() => setConfirmState({
                                type: 'cancel-esim',
                                orderId: order.id,
                                title: 'Cancel eSIM at eSIMAccess?',
                                description: `This will cancel the eSIM order at eSIMAccess and refund your supplier balance (only if the eSIM is unused). Order: ${order.orderNo.slice(0, 16)}`,
                                confirmLabel: 'Yes, Cancel eSIM',
                                danger: true,
                              })}
                              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              🚫 Cancel eSIM
                            </button>
                          )}

                          {/* Refund */}
                          {order.source === 'db' && order.paddleTransactionId && order.status !== 'REFUNDED' && (
                            <button
                              onClick={() => setConfirmState({
                                type: 'refund',
                                orderId: order.id,
                                title: 'Issue Paddle Refund?',
                                description: `Issue a full refund of $${order.totalAmount.toFixed(2)} ${order.currency} to ${order.customerName || order.customerEmail}. This cannot be undone.`,
                                confirmLabel: 'Issue Refund',
                                danger: true,
                              })}
                              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              💸 Refund
                            </button>
                          )}

                          {/* Resend email */}
                          {order.source === 'db' && order.status === 'COMPLETED' && order.iccid && (
                            <button
                              onClick={() => setConfirmState({
                                type: 'resend-email',
                                orderId: order.id,
                                title: 'Resend eSIM Instructions?',
                                description: `Resend the post-purchase email with eSIM instructions to ${order.customerEmail}.`,
                                confirmLabel: 'Send Email',
                              })}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                              ✉ Resend Email
                            </button>
                          )}

                          {/* Edit */}
                          {order.source === 'db' && !isEditing && (
                            <button
                              onClick={() => startEdit(order)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                              ✏ Edit Order
                            </button>
                          )}

                          {/* Email customer */}
                          {order.customerEmail && (
                            <a
                              href={`mailto:${order.customerEmail}?subject=Your eSIM from SIM2ME&body=Hi ${order.customerName || 'Customer'},`}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-center text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                              ✉ Email Customer
                            </a>
                          )}

                          {/* Archive / Unarchive */}
                          {order.source === 'db' && (
                            <button
                              onClick={() => setConfirmState({
                                type: isArchived ? 'unarchive' : 'archive',
                                orderId: order.id,
                                title: isArchived ? 'Restore Order?' : 'Archive Order?',
                                description: isArchived
                                  ? `Restore order ${order.orderNo.slice(0, 16)} to the main list.`
                                  : `Hide order ${order.orderNo.slice(0, 16)} from the main list. You can restore it later.`,
                                confirmLabel: isArchived ? 'Restore' : 'Archive',
                              })}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 ${isArchived ? 'border-emerald-300 text-emerald-600' : 'border-gray-300 text-gray-500'}`}
                            >
                              {isArchived ? '📤 Restore' : '📁 Archive'}
                            </button>
                          )}

                          {/* Block Email */}
                          {order.customerEmail && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Block email: ${order.customerEmail}?`)) return;
                                const res = await fetch('/api/admin/blocklist', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ type: 'EMAIL', value: order.customerEmail, reason: 'Admin manual block from orders page' }),
                                });
                                showMessage(order.id, res.ok ? '🚫 Email blocked' : '✗ Block failed', res.ok);
                              }}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                            >
                              🚫 Block Email
                            </button>
                          )}
                        </div>

                        {/* Action feedback */}
                        {message?.id === order.id && (
                          <p className={`text-xs font-medium ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                            {message.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
