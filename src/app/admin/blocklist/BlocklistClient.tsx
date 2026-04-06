'use client';

import { useState } from 'react';
import { Ban, Trash2, Plus, RefreshCw, Shield, Mail, Wifi } from 'lucide-react';

interface BlockedItem {
  id: string;
  type: string;
  value: string;
  reason: string | null;
  autoBlocked: boolean;
  createdAt: string;
}

interface Props {
  initialItems: BlockedItem[];
}

export function BlocklistClient({ initialItems }: Props) {
  const [items, setItems] = useState<BlockedItem[]>(initialItems);
  const [addType, setAddType] = useState<'IP' | 'EMAIL'>('EMAIL');
  const [addValue, setAddValue] = useState('');
  const [addReason, setAddReason] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addValue.trim()) return;
    setAddLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/blocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: addType, value: addValue.trim(), reason: addReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      setItems((prev) => {
        const filtered = prev.filter((i) => !(i.type === data.item.type && i.value === data.item.value));
        return [data.item, ...filtered];
      });
      setAddValue('');
      setAddReason('');
    } catch {
      setError('Network error');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/admin/blocklist/${id}`, { method: 'DELETE' });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setRemovingId(null);
    }
  }

  async function handleScan() {
    setScanLoading(true);
    setScanResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/blocklist/scan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Scan failed'); return; }
      setScanResult(`Scan complete: ${data.blocked} item(s) blocked.`);
      // Refresh list
      const listRes = await fetch('/api/admin/blocklist');
      if (listRes.ok) {
        const listData = await listRes.json();
        setItems(listData.items ?? []);
      }
    } catch {
      setError('Network error');
    } finally {
      setScanLoading(false);
    }
  }

  const ipItems = items.filter((i) => i.type === 'IP');
  const emailItems = items.filter((i) => i.type === 'EMAIL');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ban className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Blocklist</h1>
          <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-0.5">{items.length} blocked</span>
        </div>
        <button
          onClick={handleScan}
          disabled={scanLoading}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${scanLoading ? 'animate-spin' : ''}`} />
          {scanLoading ? 'Scanning…' : 'Run Retroactive Scan'}
        </button>
      </div>

      {scanResult && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{scanResult}</div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>
      )}

      {/* Add block form */}
      <form onSubmit={handleAdd} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Plus className="h-4 w-4" /> Add Block</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value as 'IP' | 'EMAIL')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="EMAIL">Email</option>
            <option value="IP">IP Address</option>
          </select>
          <input
            type="text"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            placeholder={addType === 'EMAIL' ? 'user@example.com' : '1.2.3.4'}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <input
            type="text"
            value={addReason}
            onChange={(e) => setAddReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={addLoading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {addLoading ? 'Adding…' : 'Block'}
          </button>
        </div>
      </form>

      {/* Blocked items table */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
          <Shield className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No blocked items. The system is open to all.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[{ label: 'IP Addresses', icon: Wifi, list: ipItems }, { label: 'Emails', icon: Mail, list: emailItems }].map(({ label, icon: Icon, list }) =>
            list.length === 0 ? null : (
              <div key={label} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <span className="ml-auto text-xs text-gray-400">{list.length}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500">
                      <th className="px-5 py-2 text-left font-medium">Value</th>
                      <th className="px-4 py-2 text-left font-medium">Reason</th>
                      <th className="px-4 py-2 text-left font-medium">Source</th>
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                        <td className="px-5 py-3 font-mono text-xs font-medium text-gray-900">{item.value}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.reason ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.autoBlocked ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                            {item.autoBlocked ? 'Auto' : 'Manual'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={removingId === item.id}
                            className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                            title="Unblock"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
