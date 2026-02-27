'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download, Upload, RefreshCw, Search, X,
  TrendingDown, ShoppingCart, CheckCircle2, DollarSign, CloudDownload,
} from 'lucide-react';

interface EsimAccessOrder {
  id: string;
  orderNo: string;
  esimOrderId: string | null;
  esimTransactionId: string | null;
  customerName: string;
  customerEmail: string;
  packageName: string;
  packageCode: string;
  destination: string;
  dataAmount: string;
  validity: string;
  totalAmount: number;
  supplierCost: number | null;
  status: string;
  iccid: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface ApiResponse {
  orders: EsimAccessOrder[];
  total: number;
  balance: number | null;
  totalSpent: number;
  completedCount: number;
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

const ESIM_STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
  PAID: 'Paid',
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 shrink-0 rounded px-1 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      title="Copy"
    >
      {copied ? '✓' : 'Copy'}
    </button>
  );
}

export function EsimAccessOrdersClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ imported: number; alreadyExist: number; errors: string[]; message?: string } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const buildUrl = useCallback((from: string, to: string) => {
    const params = new URLSearchParams();
    if (from) params.set('dateFrom', from);
    if (to) params.set('dateTo', to);
    return `/api/admin/esimaccess/orders?${params.toString()}`;
  }, []);

  const fetchData = useCallback(async (from: string, to: string, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(buildUrl(from, to));
      if (res.ok) {
        const json: ApiResponse = await res.json();
        setData(json);
        setLastRefreshed(new Date());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildUrl]);

  // Initial load
  useEffect(() => {
    fetchData(dateFrom, dateTo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      fetchData(dateFrom, dateTo, true);
    }, 60_000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [fetchData, dateFrom, dateTo]);

  const handleSearch = () => fetchData(dateFrom, dateTo);
  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    fetchData('', '');
  };

  // ─── Sync from eSIMaccess ────────────────────────────────────
  const handleSync = async () => {
    if (!confirm('This will import all eSIMaccess orders missing from the database as unassigned stub records. Continue?')) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/esimaccess/sync', { method: 'POST' });
      const data = await res.json();
      setSyncResult(data);
      if (data.imported > 0) fetchData(dateFrom, dateTo, true);
    } catch (err) {
      setSyncResult({ imported: 0, alreadyExist: 0, errors: [(err as Error).message] });
    } finally {
      setSyncing(false);
    }
  };

  // ─── Export ──────────────────────────────────────────────────
  const handleExport = async () => {
    if (!data?.orders.length) return;
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const rows = data.orders.map((o) => ({
        batch_id: o.esimOrderId ?? '',
        transaction_id: o.esimTransactionId ?? '',
        our_order_id: o.orderNo,
        customer_name: o.customerName,
        customer_email: o.customerEmail,
        package: o.packageName,
        destination: o.destination,
        data_amount: o.dataAmount,
        validity: o.validity,
        esim_cost: o.supplierCost ?? '',
        retail_price: o.totalAmount,
        status: o.status,
        iccid: o.iccid ?? '',
        smdp_address: o.smdpAddress ?? '',
        activation_code: o.activationCode ?? '',
        created_at: formatDate(o.createdAt),
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'eSIMaccess Orders');
      XLSX.writeFile(wb, `esimaccess-orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  // ─── Import ──────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const buf = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) { setImportResult('Empty file'); return; }
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (raw.length === 0) { setImportResult('No rows found'); return; }

      // Expects columns: our_order_id, status
      const updates = raw
        .map((r) => ({ order_id: String(r['our_order_id'] || r['order_id'] || ''), status: String(r['status'] || '') }))
        .filter((u) => u.order_id && u.status);

      if (updates.length === 0) { setImportResult('No valid rows (need our_order_id and status columns)'); return; }

      const res = await fetch('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const result = await res.json();
      if (!res.ok) { setImportResult(result?.error ?? 'Update failed'); return; }

      setImportResult(`Updated ${result.updated} of ${result.total} orders.`);
      fetchData(dateFrom, dateTo, true);
    } catch (err) {
      setImportResult(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="mt-6 space-y-4">

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={ShoppingCart}
            label="Total eSIM Purchases"
            value={data.total}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={TrendingDown}
            label="Total Spent at eSIMaccess"
            value={`$${data.totalSpent.toFixed(2)}`}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={data.completedCount}
            color="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            icon={DollarSign}
            label="Account Balance"
            value={data.balance !== null ? `$${data.balance.toFixed(2)}` : '—'}
            color={data.balance !== null && data.balance < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">From date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">To date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Search className="h-4 w-4" /> Search
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <X className="h-4 w-4" /> Reset
        </button>

        <div className="ml-auto flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-400">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchData(dateFrom, dateTo, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          title="Fetch all eSIMaccess orders and import missing ones as unassigned stubs"
        >
          <CloudDownload className="h-4 w-4" />
          {syncing ? 'Syncing…' : 'Sync from eSIMaccess'}
        </button>
        <button
          onClick={handleExport}
          disabled={exporting || !data?.orders.length}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export to Excel'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {importing ? 'Importing…' : 'Import from Excel'}
        </button>
        {data && (
          <span className="ml-auto text-xs text-gray-400">
            {data.orders.length} of {data.total} orders shown
          </span>
        )}
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${syncResult.errors.length > 0 && syncResult.imported === 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
          {syncResult.message ? (
            <p className="text-gray-700">{syncResult.message}</p>
          ) : (
            <p className="font-medium text-gray-800">
              Sync complete — <span className="text-emerald-700">{syncResult.imported} imported</span>
              {' '}· {syncResult.alreadyExist} already in DB
            </p>
          )}
          {syncResult.errors.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-red-600">
              {syncResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <p className="text-sm text-gray-600">{importResult}</p>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !data?.orders.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500">
          No eSIMaccess orders found for the selected period.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Table header */}
          <div className="hidden grid-cols-[180px_1fr_1fr_1fr_90px_110px_160px] items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid">
            <span>Batch ID</span>
            <span>Customer</span>
            <span>Package</span>
            <span>Destination</span>
            <span>eSIM Cost</span>
            <span>Status</span>
            <span>Created At</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {data.orders.map((order) => (
              <div key={order.id}>
                {/* Main row */}
                <div
                  className="grid cursor-pointer grid-cols-1 gap-2 px-4 py-3 hover:bg-gray-50 md:grid-cols-[180px_1fr_1fr_1fr_90px_110px_160px] md:items-center md:gap-3"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  {/* Batch ID */}
                  <div className="font-mono text-xs text-gray-700">
                    {order.esimOrderId ?? <span className="text-gray-400">—</span>}
                  </div>

                  {/* Customer */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{order.customerName || '—'}</p>
                    <p className="truncate text-xs text-gray-500">{order.customerEmail}</p>
                  </div>

                  {/* Package */}
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-700">{order.packageName}</p>
                    <p className="text-xs text-gray-400">{order.dataAmount} · {order.validity}d</p>
                  </div>

                  {/* Destination */}
                  <p className="text-sm text-gray-600">{order.destination}</p>

                  {/* eSIM Cost */}
                  <p className="text-sm font-semibold text-gray-800">
                    {order.supplierCost !== null ? `$${order.supplierCost.toFixed(2)}` : <span className="text-gray-400">—</span>}
                  </p>

                  {/* Status */}
                  <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ESIM_STATUS_LABEL[order.status] ?? order.status}
                  </span>

                  {/* Date */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    <span className="text-xs text-gray-400">{expanded === order.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded === order.id && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4 space-y-4 text-sm">
                    {order.errorMessage && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase text-red-600">Error</p>
                        <p className="font-mono text-xs text-red-700 break-all">{order.errorMessage}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {order.esimOrderId && (
                        <div>
                          <p className="text-xs text-gray-400">eSIMaccess Batch ID</p>
                          <div className="flex items-center">
                            <p className="font-mono text-xs text-gray-700">{order.esimOrderId}</p>
                            <CopyButton text={order.esimOrderId} />
                          </div>
                        </div>
                      )}
                      {order.esimTransactionId && (
                        <div>
                          <p className="text-xs text-gray-400">eSIMaccess Transaction ID</p>
                          <div className="flex items-center">
                            <p className="font-mono text-xs text-gray-700">{order.esimTransactionId}</p>
                            <CopyButton text={order.esimTransactionId} />
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400">Our Order ID</p>
                        <div className="flex items-center">
                          <p className="font-mono text-xs text-gray-700">{order.orderNo.slice(0, 20)}…</p>
                          <CopyButton text={order.orderNo} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Package Code</p>
                        <p className="font-mono text-xs text-gray-700">{order.packageCode || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Retail Price (charged to customer)</p>
                        <p className="text-sm font-semibold text-gray-800">${order.totalAmount.toFixed(2)}</p>
                      </div>
                      {order.supplierCost !== null && (
                        <div>
                          <p className="text-xs text-gray-400">Supplier Cost (eSIMaccess)</p>
                          <p className="text-sm font-semibold text-red-700">${order.supplierCost.toFixed(2)}</p>
                        </div>
                      )}
                      {order.iccid && (
                        <div>
                          <p className="text-xs text-gray-400">ICCID</p>
                          <div className="flex items-center">
                            <p className="font-mono text-xs text-gray-700">{order.iccid}</p>
                            <CopyButton text={order.iccid} />
                          </div>
                        </div>
                      )}
                      {order.smdpAddress && (
                        <div>
                          <p className="text-xs text-gray-400">SM-DP+ Address</p>
                          <div className="flex items-center">
                            <p className="font-mono text-xs text-gray-700 break-all">{order.smdpAddress}</p>
                            <CopyButton text={order.smdpAddress} />
                          </div>
                        </div>
                      )}
                      {order.activationCode && (
                        <div>
                          <p className="text-xs text-gray-400">Activation Code</p>
                          <div className="flex items-center">
                            <p className="font-mono text-xs text-gray-700 break-all">{order.activationCode}</p>
                            <CopyButton text={order.activationCode} />
                          </div>
                        </div>
                      )}
                    </div>

                    {order.qrCodeUrl && (
                      <div>
                        <p className="mb-1 text-xs text-gray-400">QR Code</p>
                        <img src={order.qrCodeUrl} alt="eSIM QR" className="h-32 w-32 rounded-xl border border-gray-200" />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={`mailto:${order.customerEmail}?subject=Your eSIM from SIM2ME`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        ✉ Email Customer
                      </a>
                      <a
                        href={`/admin/orders`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        ↗ View in Orders
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
