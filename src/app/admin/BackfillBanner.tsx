'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function BackfillBanner({ missingCount }: { missingCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  if (missingCount === 0 && !result) return null;

  const run = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/orders/backfill-costs', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(`✓ Updated ${data.updated} of ${data.total} orders. Refresh page to see new totals.`);
    } catch (err) {
      setResult('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <span className="text-amber-800">
        <strong>{missingCount} orders</strong> are missing supplier cost data (created before cost tracking was added).
      </span>
      {!result ? (
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Backfilling...' : 'Backfill Costs Now'}
        </button>
      ) : (
        <span className={`font-medium ${result.startsWith('✓') ? 'text-emerald-700' : 'text-red-700'}`}>
          {result}
        </span>
      )}
    </div>
  );
}
