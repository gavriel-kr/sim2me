'use client';

/**
 * Offers Hindi to a Hindi-preferring visitor, once (ticket 038).
 *
 * The site auto-detects Hebrew and Arabic from the browser and redirects, but Hindi is deliberately not
 * imposed that way: the copy has not been through a native review, and the legal pages and support are
 * English regardless of the interface. So a Hindi-preferring browser lands on English — the middleware
 * filters Hindi out of the detection header for exactly this reason — and gets this instead.
 *
 * Shown at most once. Whether accepted or dismissed, the answer is remembered, because a banner that
 * comes back on every page is worse than one that never appeared.
 */

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { X } from 'lucide-react';
import { buildLocalePath } from '@/lib/locale-path';

const DISMISS_KEY = 'sim2me:lang-suggest:hi';

export function LanguageSuggestBanner() {
  const locale = useLocale();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (locale === 'hi') return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
      // A locale cookie means the visitor has already chosen a language by hand. That choice stands.
      if (document.cookie.split('; ').some((c) => c.startsWith('NEXT_LOCALE='))) return;
      const prefersHindi = (navigator.languages ?? [navigator.language]).some((l) =>
        /^hi\b/i.test(l ?? '')
      );
      if (prefersHindi) setVisible(true);
    } catch {
      /* private mode, or storage blocked — then simply no banner */
    }
  }, [locale]);

  const remember = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* nothing to do: the worst case is being asked once more */
    }
  }, []);

  const accept = useCallback(() => {
    remember();
    document.cookie = 'NEXT_LOCALE=hi; path=/; max-age=31536000; SameSite=Lax';
    window.location.href = buildLocalePath(pathname || '/', 'hi');
  }, [pathname, remember]);

  const dismiss = useCallback(() => {
    remember();
    setVisible(false);
  }, [remember]);

  if (!visible) return null;

  return (
    <div
      dir="ltr"
      lang="hi"
      role="region"
      aria-label="Language suggestion"
      className="border-b border-border bg-secondary px-4 py-2.5"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
        <span className="text-secondary-foreground">क्या आप यह साइट हिन्दी में देखना चाहेंगे?</span>
        <button
          type="button"
          onClick={accept}
          className="rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          हिन्दी में देखें
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Keep English
        </button>
      </div>
    </div>
  );
}
