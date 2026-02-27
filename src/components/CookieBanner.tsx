'use client';

import { useLocale } from 'next-intl';
import { cookieTranslations } from '@/lib/cookieConsent';
import { useCookieConsent } from '@/components/CookieConsentProvider';
import { useCallback } from 'react';

export function CookieBanner() {
  const locale = useLocale() as 'en' | 'he' | 'ar';
  const { setConsent, setShowBanner, openCookieSettings, showBanner } = useCookieConsent();
  const t = cookieTranslations[locale] ?? cookieTranslations.en;

  const acceptAll = useCallback(() => {
    setConsent({ analytics: true, marketing: true });
    setShowBanner(false);
  }, [setConsent, setShowBanner]);

  const rejectAll = useCallback(() => {
    setConsent({ analytics: false, marketing: false });
    setShowBanner(false);
  }, [setConsent, setShowBanner]);

  const customize = useCallback(() => {
    setShowBanner(false);
    openCookieSettings();
  }, [setShowBanner, openCookieSettings]);

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-label={t.title}
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border/60 bg-white/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:p-5"
    >
      <div className="container mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">{t.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            aria-label={t.rejectAll}
          >
            {t.rejectAll}
          </button>
          <button
            type="button"
            onClick={customize}
            className="rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            aria-label={t.customize}
          >
            {t.customize}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            aria-label={t.acceptAll}
          >
            {t.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
