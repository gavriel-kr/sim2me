'use client';

import { useLocale } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { cookieTranslations } from '@/lib/cookieConsent';
import type { CookieConsentState } from '@/lib/cookieConsent';

type Props = {
  consent: CookieConsentState | null;
  onSave: (state: { analytics: boolean; marketing: boolean }) => void;
  onClose: () => void;
};

export function CookiePreferencesModal({ consent, onSave, onClose }: Props) {
  const locale = useLocale() as 'en' | 'he' | 'ar';
  const t = cookieTranslations[locale] ?? cookieTranslations.en;

  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  useEffect(() => {
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
  }, [consent]);

  const handleSave = useCallback(() => {
    onSave({ analytics, marketing });
  }, [analytics, marketing, onSave]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl"
        dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <h2 id="cookie-modal-title" className="text-xl font-semibold text-foreground">
          {t.settings}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>

        <div className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
            <div>
              <p className="font-medium text-foreground">{t.necessary}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.necessaryDesc}</p>
            </div>
            <span className="flex h-6 flex-shrink-0 items-center rounded-full bg-emerald-100 px-2.5 text-xs font-medium text-emerald-800">
              {locale === 'en' ? 'Always on' : locale === 'he' ? 'פעיל תמיד' : 'دائمًا مفعل'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4">
            <div>
              <p className="font-medium text-foreground">{t.analytics}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.analyticsDesc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={analytics}
              aria-label={t.analytics}
              onClick={() => setAnalytics((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                analytics ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{
                  [locale === 'he' || locale === 'ar' ? 'right' : 'left']: 2,
                  transform: analytics
                    ? locale === 'he' || locale === 'ar'
                      ? 'translateX(-20px)'
                      : 'translateX(20px)'
                    : 'translateX(0)',
                }}
              />
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4">
            <div>
              <p className="font-medium text-foreground">{t.marketing}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.marketingDesc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={marketing}
              aria-label={t.marketing}
              onClick={() => setMarketing((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                marketing ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{
                  [locale === 'he' || locale === 'ar' ? 'right' : 'left']: 2,
                  transform: marketing
                    ? locale === 'he' || locale === 'ar'
                      ? 'translateX(-20px)'
                      : 'translateX(20px)'
                    : 'translateX(0)',
                }}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            {locale === 'en' ? 'Cancel' : locale === 'he' ? 'ביטול' : 'إلغاء'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
