'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, X } from 'lucide-react';

interface Props {
  days: number;
}

export function PasswordAgeWarningBanner({ days }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 bg-orange-50 border-b border-orange-200 px-4 py-3 text-sm text-orange-800">
      <KeyRound className="h-4 w-4 shrink-0 text-orange-500" />
      <span className="flex-1">
        Your admin password hasn&apos;t been changed in over {days} days. Consider updating it regularly for better security.
      </span>
      <Link
        href="/admin/settings"
        className="rounded-lg bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-700 shrink-0"
      >
        Change password →
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 text-orange-500 hover:bg-orange-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
