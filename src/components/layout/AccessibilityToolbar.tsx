'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const STORAGE_KEY = 'sim2me-a11y';

type PositionHorizontal = 'start' | 'end';
type PositionVertical = 'top' | 'middle' | 'bottom';

interface Prefs {
  fontScale: number;
  textSpacing: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  highlightLinks: boolean;
  highlightFocus: boolean;
  positionHorizontal: PositionHorizontal;
  positionVertical: PositionVertical;
}

const DEFAULT: Prefs = {
  fontScale: 1,
  textSpacing: false,
  highContrast: false,
  reduceMotion: false,
  highlightLinks: false,
  highlightFocus: false,
  positionHorizontal: 'start',
  positionVertical: 'bottom',
};

type BoolKey = 'textSpacing' | 'highContrast' | 'reduceMotion' | 'highlightLinks' | 'highlightFocus';

const CLASS_MAP: Record<BoolKey, string> = {
  textSpacing: 'a11y-text-spacing',
  highContrast: 'a11y-high-contrast',
  reduceMotion: 'a11y-reduce-motion',
  highlightLinks: 'a11y-highlight-links',
  highlightFocus: 'a11y-highlight-focus',
};

function applyPrefs(prefs: Prefs) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.style.fontSize = prefs.fontScale === 1 ? '' : `${Math.round(prefs.fontScale * 100)}%`;
  for (const [key, cls] of Object.entries(CLASS_MAP) as [BoolKey, string][]) {
    html.classList.toggle(cls, prefs[key]);
  }
}

/**
 * Standard accessibility figure: person with arms extended (T-shape),
 * matching the widely-recognized digital accessibility symbol.
 */
function ISAIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx="12" cy="4.5" r="2.5" fill="currentColor" stroke="none" />
      {/* Torso */}
      <line x1="12" y1="8" x2="12" y2="15.5" />
      {/* Arms extended */}
      <line x1="6" y1="11.5" x2="18" y2="11.5" />
      {/* Left leg */}
      <line x1="12" y1="15.5" x2="9" y2="21" />
      {/* Right leg */}
      <line x1="12" y1="15.5" x2="15" y2="21" />
    </svg>
  );
}

export function AccessibilityToolbar() {
  const t = useTranslations('a11y');
  const locale = useLocale() as string;
  const isRTL = locale === 'he' || locale === 'ar';

  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = 'a11y-panel-heading';
  const initialLoadDone = useRef(false);

  // Load from localStorage and respect prefers-reduced-motion on first visit.
  // Default horizontal position is locale-aware so the button never overlaps
  // the help button (StickyHelpButton is always physical right-6 via dir="ltr").
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    // Physical-left default: 'start' in LTR, 'end' in RTL
    const safeH: PositionHorizontal = isRTL ? 'end' : 'start';
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;


    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        // Migrate old RTL default ('start' → 'end') so existing users stop overlapping
        const resolvedH: PositionHorizontal =
          parsed.positionHorizontal === 'start' && isRTL ? 'end' : (parsed.positionHorizontal ?? safeH);
        const merged: Prefs = { ...DEFAULT, ...parsed, positionHorizontal: resolvedH };
        setPrefs(merged);
        applyPrefs(merged);
      } else {
        const firstDefault: Prefs = { ...DEFAULT, positionHorizontal: safeH, reduceMotion: prefersReduced };
        setPrefs(firstDefault);
        applyPrefs(firstDefault);
      }
    } catch {
      const firstDefault: Prefs = { ...DEFAULT, positionHorizontal: safeH, reduceMotion: prefersReduced };
      setPrefs(firstDefault);
      applyPrefs(firstDefault);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    applyPrefs(prefs);
  }, [prefs]);

  // Focus trap and Escape
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, [tabindex]:not([tabindex="-1"])')
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    panel.addEventListener('keydown', handleKey);
    return () => panel.removeEventListener('keydown', handleKey);
  }, [open]);

  const toggle = useCallback((key: BoolKey) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setFontScale = useCallback((delta: number) => {
    setPrefs(prev => ({
      ...prev,
      fontScale: Math.round(Math.min(1.5, Math.max(0.8, prev.fontScale + delta)) * 10) / 10,
    }));
  }, []);

  const setPositionHorizontal = useCallback((value: PositionHorizontal) => {
    setPrefs(prev => ({ ...prev, positionHorizontal: value }));
  }, []);

  const setPositionVertical = useCallback((value: PositionVertical) => {
    setPrefs(prev => ({ ...prev, positionVertical: value }));
  }, []);

  const reset = useCallback(() => {
    setPrefs(DEFAULT);
    applyPrefs(DEFAULT);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const TOGGLES: { key: BoolKey; labelKey: keyof typeof t; descKey: keyof typeof t }[] = [
    { key: 'textSpacing', labelKey: 'textSpacing' as never, descKey: 'textSpacingDesc' as never },
    { key: 'highContrast', labelKey: 'highContrast' as never, descKey: 'highContrastDesc' as never },
    { key: 'reduceMotion', labelKey: 'reduceMotion' as never, descKey: 'reduceMotionDesc' as never },
    { key: 'highlightLinks', labelKey: 'highlightLinks' as never, descKey: 'highlightLinksDesc' as never },
    { key: 'highlightFocus', labelKey: 'highlightFocus' as never, descKey: 'highlightFocusDesc' as never },
  ];

  const activeCount = [
    prefs.fontScale !== 1,
    prefs.textSpacing,
    prefs.highContrast,
    prefs.reduceMotion,
    prefs.highlightLinks,
    prefs.highlightFocus,
  ].filter(Boolean).length;

  const triggerPositionClasses = [
    prefs.positionVertical === 'top' && 'top-4',
    prefs.positionVertical === 'middle' && 'top-1/2 -translate-y-1/2',
    prefs.positionVertical === 'bottom' && 'bottom-6',
    prefs.positionHorizontal === 'start' && 'start-4',
    prefs.positionHorizontal === 'end' && 'end-4',
  ]
    .filter(Boolean)
    .join(' ');

  const panelPositionClasses = [
    prefs.positionVertical === 'top' && 'top-24',
    prefs.positionVertical === 'middle' && 'top-1/2 -translate-y-1/2',
    prefs.positionVertical === 'bottom' && 'bottom-24',
    prefs.positionHorizontal === 'start' && 'start-4',
    prefs.positionHorizontal === 'end' && 'end-4',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          id="a11y-toolbar-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className={`fixed z-[60] w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ${panelPositionClasses}`}
        >
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <ISAIcon className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
              <h2 id={headingId} className="text-sm font-bold text-foreground">
                {t('panelTitle')}
              </h2>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label={t('closePanelLabel')}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Position */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t('positionTitle')}
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-xl border border-border bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setPositionHorizontal('start')}
                    aria-pressed={prefs.positionHorizontal === 'start'}
                    aria-label={t('positionStart')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      prefs.positionHorizontal === 'start' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('positionStart')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPositionHorizontal('end')}
                    aria-pressed={prefs.positionHorizontal === 'end'}
                    aria-label={t('positionEnd')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      prefs.positionHorizontal === 'end' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t('positionEnd')}
                  </button>
                </div>
                <div className="flex rounded-xl border border-border bg-muted/30 p-1">
                  {(['top', 'middle', 'bottom'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPositionVertical(v)}
                      aria-pressed={prefs.positionVertical === v}
                      aria-label={t(`position${v.charAt(0).toUpperCase() + v.slice(1)}` as 'positionTop' | 'positionMiddle' | 'positionBottom')}
                      className={`rounded-lg px-2 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        prefs.positionVertical === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t(`position${v.charAt(0).toUpperCase() + v.slice(1)}` as 'positionTop' | 'positionMiddle' | 'positionBottom')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Font size */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t('textSizeTitle')}
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setFontScale(-0.1)}
                  disabled={prefs.fontScale <= 0.8}
                  aria-label={t('decreaseLabel')}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg text-sm font-bold text-foreground transition hover:bg-background disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-base" aria-hidden="true">A</span>
                  <span className="text-[10px]" aria-hidden="true">−</span>
                </button>
                <span
                  className="min-w-[3rem] text-center text-sm font-semibold tabular-nums text-foreground"
                  aria-live="polite"
                  aria-label={t('fontSizeAnnounce', { percent: Math.round(prefs.fontScale * 100) })}
                >
                  {Math.round(prefs.fontScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setFontScale(0.1)}
                  disabled={prefs.fontScale >= 1.5}
                  aria-label={t('increaseLabel')}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg text-sm font-bold text-foreground transition hover:bg-background disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-lg" aria-hidden="true">A</span>
                  <span className="text-xs" aria-hidden="true">+</span>
                </button>
              </div>
            </div>

            {/* Toggle switches */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t('displayTitle')}
              </p>
              <div className="space-y-0.5">
                {TOGGLES.map(({ key, labelKey, descKey }) => {
                  const checked = prefs[key];
                  const label = t(labelKey as Parameters<typeof t>[0]);
                  const desc = t(descKey as Parameters<typeof t>[0]);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-muted/60"
                    >
                      <span id={`a11y-lbl-${key}`} className="text-sm text-foreground select-none">
                        {label}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        aria-labelledby={`a11y-lbl-${key}`}
                        aria-describedby={`a11y-desc-${key}`}
                        onClick={() => toggle(key)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          checked ? 'bg-primary' : 'bg-muted-foreground/25'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            checked ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                          }`}
                        />
                        <span id={`a11y-desc-${key}`} className="sr-only">{desc}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t('reset')}
            </button>

            <p className="text-center text-[10px] leading-tight text-muted-foreground">
              {t('savedNote')}
            </p>
          </div>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? t('closeLabel') : t('openLabel')}
        aria-expanded={open}
        aria-controls="a11y-toolbar-panel"
        className={`fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${triggerPositionClasses}`}
      >
        {activeCount > 0 && (
          <span
            aria-label={t('activeBadge', { count: activeCount })}
            className="absolute -end-1 -top-1 flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black"
          >
            {activeCount}
          </span>
        )}
        <ISAIcon className="h-7 w-7" aria-hidden="true" />
      </button>
    </>
  );
}
