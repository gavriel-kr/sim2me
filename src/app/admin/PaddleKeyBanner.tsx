'use client';

import { useEffect, useState } from 'react';
import { Key, Timer } from 'lucide-react';

function useCountdown(expiryMs: number) {
  const [msLeft, setMsLeft] = useState(() => expiryMs - Date.now());

  useEffect(() => {
    const tick = () => setMsLeft(expiryMs - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiryMs]);

  return msLeft;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, expired: false };
}

function Pad({ n }: { n: number }) {
  return <>{String(n).padStart(2, '0')}</>;
}

export function PaddleKeyBanner({ expiresAt }: { expiresAt: string | null }) {
  const expiry = expiresAt ? new Date(expiresAt) : null;
  if (!expiry || isNaN(expiry.getTime())) return null;

  const msLeft = useCountdown(expiry.getTime());
  const { days, hours, minutes, seconds, expired } = formatCountdown(msLeft);

  const urgent = days < 7;
  const warning = days < 30;

  const colorClass = expired || urgent
    ? 'border-red-200 bg-red-50 text-red-800'
    : warning
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  const segClass = expired || urgent
    ? 'bg-red-100 text-red-900'
    : warning
    ? 'bg-amber-100 text-amber-900'
    : 'bg-emerald-100 text-emerald-900';

  const dateStr = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className={`mt-4 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${colorClass}`}>
      <Key className="h-4 w-4 shrink-0" />
      <span className="font-semibold">
        {expired ? 'Paddle API key EXPIRED' : 'Paddle API key expires'} — {dateStr}
      </span>

      {!expired && (
        <div className="flex items-center gap-1 font-mono text-sm">
          <Timer className="h-3.5 w-3.5" />
          {[{ v: days, l: 'd' }, { v: hours, l: 'h' }, { v: minutes, l: 'm' }, { v: seconds, l: 's' }].map(({ v, l }) => (
            <span key={l} className={`inline-flex items-baseline gap-0.5 rounded px-1.5 py-0.5 font-bold ${segClass}`}>
              <Pad n={v} /><span className="text-xs font-normal">{l}</span>
            </span>
          ))}
        </div>
      )}

      {(expired || urgent) && (
        <a
          href="https://vendors.paddle.com/authentication"
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-lg border border-current px-3 py-1 text-xs font-semibold hover:opacity-80"
        >
          Renew API key →
        </a>
      )}
    </div>
  );
}
