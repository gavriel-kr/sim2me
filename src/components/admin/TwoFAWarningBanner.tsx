'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, X } from 'lucide-react';

export function TwoFAWarningBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800">
      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
      <span className="flex-1">
        Your account has no two-factor authentication (2FA) protection. Your role has elevated permissions — we strongly recommend setting it up.
      </span>
      <Link
        href="/admin/security"
        className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 shrink-0"
      >
        Set up 2FA →
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 text-amber-500 hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
