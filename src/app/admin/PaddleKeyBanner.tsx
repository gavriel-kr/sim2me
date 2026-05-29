'use client';

import { Key } from 'lucide-react';

export function PaddleKeyBanner({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;

  const expiry = new Date(expiresAt);
  if (isNaN(expiry.getTime())) return null;

  const now = new Date();
  const msLeft = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  const expired = daysLeft <= 0;
  const urgent = daysLeft <= 7;
  const warning = daysLeft <= 30;

  const colorClass = expired || urgent
    ? 'border-red-200 bg-red-50 text-red-800'
    : warning
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  const label = expired
    ? `Paddle API key expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`
    : daysLeft === 1
    ? 'Paddle API key expires tomorrow!'
    : `Paddle API key expires in ${daysLeft} days`;

  const dateStr = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className={`mt-4 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${colorClass}`}>
      <Key className="h-4 w-4 shrink-0" />
      <span>
        <strong>{label}</strong>
        {' '}— expires {dateStr}.
        {(expired || urgent) && (
          <> Renew in <a href="https://vendors.paddle.com/authentication" target="_blank" rel="noreferrer" className="underline font-semibold">Paddle Dashboard → Developer → Authentication</a> and update <code className="rounded bg-black/10 px-1 py-0.5 text-xs">PADDLE_API_KEY</code> in Vercel.</>
        )}
      </span>
    </div>
  );
}
