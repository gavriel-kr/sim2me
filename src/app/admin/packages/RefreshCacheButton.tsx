'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface CacheStatus {
  ts: number | null;
  count: number;
}

function formatAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''} ago`;
}

function formatNextRefresh(ts: number): string {
  const minsElapsed = Math.floor((Date.now() - ts) / 60000);
  const minsLeft = Math.max(0, 360 - minsElapsed);
  if (minsLeft === 0) return 'due now';
  if (minsLeft < 60) return `in ${minsLeft}m`;
  const hrs = Math.floor(minsLeft / 60);
  const rem = minsLeft % 60;
  return `in ${hrs}h${rem > 0 ? ` ${rem}m` : ''}`;
}

export function RefreshCacheButton() {
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  async function fetchStatus() {
    try {
      const r = await fetch('/api/admin/packages/cache-status');
      if (r.ok) setStatus(await r.json());
    } catch {}
  }

  useEffect(() => {
    fetchStatus();
    // Tick every minute to keep displayed times fresh
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Suppress unused warning — `now` is used implicitly via re-render
  void now;

  async function handleRefresh() {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch('/api/admin/packages/refresh-cache', { method: 'POST' });
      const data = await r.json();
      if (r.ok) {
        setResult(`✓ Cached ${data.count} packages`);
        await fetchStatus();
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

      {status?.ts ? (
        <span className="text-xs text-gray-400">
          {status.count.toLocaleString()} packages · updated {formatAgo(status.ts)} · next auto-refresh {formatNextRefresh(status.ts)}
        </span>
      ) : status && !status.ts ? (
        <span className="text-xs text-amber-500">Cache empty — click Refresh to populate</span>
      ) : null}

      {result && (
        <span className={`text-xs font-medium ${result.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
          {result}
        </span>
      )}
    </div>
  );
}
