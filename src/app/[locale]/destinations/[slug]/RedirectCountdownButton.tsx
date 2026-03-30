'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  EMPTY_STATE_COPY,
  ERROR_STATE_COPY,
  type UiLang,
} from './destination-unavailable-copy';

interface RedirectCountdownButtonProps {
  href: string;
  seconds: number;
  variant: 'empty' | 'error';
  lang: UiLang;
}

export function RedirectCountdownButton({ href, seconds, variant, lang }: RedirectCountdownButtonProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);
  const copy = variant === 'empty' ? EMPTY_STATE_COPY[lang] : ERROR_STATE_COPY[lang];

  useEffect(() => {
    let cancelled = false;
    let r = seconds;
    const id = setInterval(() => {
      if (cancelled) return;
      r -= 1;
      if (r <= 0) {
        clearInterval(id);
        router.push(href);
        return;
      }
      setRemaining(r);
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [href, router, seconds]);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="sr-only" aria-live="polite">
        {copy.live(remaining)}
      </span>
      <button
        type="button"
        onClick={() => router.push(href)}
        className="inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
      >
        {copy.button(remaining)}
      </button>
    </div>
  );
}
