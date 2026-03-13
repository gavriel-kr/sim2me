'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshCacheButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch('/api/admin/packages/refresh-cache', { method: 'POST' });
      const data = await r.json();
      if (r.ok) {
        setResult(`✓ Cached ${data.count} packages`);
        setTimeout(() => setResult(null), 5000);
      } else {
        setResult(`✗ ${data.error}`);
      }
    } catch {
      setResult('✗ Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Refreshing…' : 'Refresh Package Cache'}
      </button>
      {result && (
        <span className={`text-xs font-medium ${result.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
          {result}
        </span>
      )}
    </div>
  );
}
