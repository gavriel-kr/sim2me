'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'sim2me-a11y';

interface Prefs {
  fontScale: number;
  textSpacing: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  highlightLinks: boolean;
  highlightFocus: boolean;
}

const DEFAULT: Prefs = {
  fontScale: 1,
  textSpacing: false,
  highContrast: false,
  reduceMotion: false,
  highlightLinks: false,
  highlightFocus: false,
};

type BoolKey = 'textSpacing' | 'highContrast' | 'reduceMotion' | 'highlightLinks' | 'highlightFocus';

const CLASS_MAP: Record<BoolKey, string> = {
  textSpacing: 'a11y-text-spacing',
  highContrast: 'a11y-high-contrast',
  reduceMotion: 'a11y-reduce-motion',
  highlightLinks: 'a11y-highlight-links',
  highlightFocus: 'a11y-highlight-focus',
};

const TOGGLES: { key: BoolKey; label: string; description: string }[] = [
  { key: 'textSpacing', label: 'Text Spacing', description: 'Increase letter, word and line spacing' },
  { key: 'highContrast', label: 'High Contrast', description: 'Boost page contrast ratio' },
  { key: 'reduceMotion', label: 'Reduce Motion', description: 'Pause animations and transitions' },
  { key: 'highlightLinks', label: 'Highlight Links', description: 'Underline all links' },
  { key: 'highlightFocus', label: 'Highlight Focus', description: 'Show strong focus indicator' },
];

function applyPrefs(prefs: Prefs) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.style.fontSize = prefs.fontScale === 1 ? '' : `${Math.round(prefs.fontScale * 100)}%`;
  for (const [key, cls] of Object.entries(CLASS_MAP) as [BoolKey, string][]) {
    html.classList.toggle(cls, prefs[key]);
  }
}

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = 'a11y-panel-heading';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const merged = { ...DEFAULT, ...JSON.parse(raw) } as Prefs;
        setPrefs(merged);
        applyPrefs(merged);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    applyPrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])')
    );
    focusable[0]?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
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

  const reset = useCallback(() => {
    setPrefs(DEFAULT);
    applyPrefs(DEFAULT);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const activeCount = Object.values(prefs).filter((v, i) =>
    i === 0 ? v !== 1 : Boolean(v)
  ).length;

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          id="a11y-toolbar-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className="fixed bottom-24 start-4 z-[60] w-72 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              {/* Accessibility icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-blue-600">
                <circle cx="12" cy="5" r="2.5" fill="currentColor" />
                <path d="M7 13h5l1.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 13V9.5a2.5 2.5 0 0 1 5 0V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 13h1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M14.5 18.5A4 4 0 1 0 7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h2 id={headingId} className="text-sm font-bold text-foreground">
                Accessibility
              </h2>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close accessibility panel"
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Font size */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Text Size
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setFontScale(-0.1)}
                  disabled={prefs.fontScale <= 0.8}
                  aria-label="Decrease text size"
                  className="flex h-9 flex-1 items-center justify-center rounded-lg text-sm font-bold text-foreground transition hover:bg-background disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-base" aria-hidden="true">A</span>
                  <span className="text-[10px]" aria-hidden="true">−</span>
                </button>
                <span
                  className="min-w-[3rem] text-center text-sm font-semibold tabular-nums text-foreground"
                  aria-live="polite"
                  aria-label={`Text size ${Math.round(prefs.fontScale * 100)} percent`}
                >
                  {Math.round(prefs.fontScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setFontScale(0.1)}
                  disabled={prefs.fontScale >= 1.5}
                  aria-label="Increase text size"
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
                Display
              </p>
              <div className="space-y-0.5">
                {TOGGLES.map(({ key, label, description }) => {
                  const checked = prefs[key];
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
                          checked ? 'bg-blue-600' : 'bg-muted-foreground/25'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            checked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                        <span id={`a11y-desc-${key}`} className="sr-only">{description}</span>
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
              Reset to default
            </button>

            <p className="text-center text-[10px] leading-tight text-muted-foreground">
              Saved locally · No data sent to servers
            </p>
          </div>
        </div>
      )}

      {/* Floating trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close accessibility toolbar' : 'Accessibility options'}
        aria-expanded={open}
        aria-controls="a11y-toolbar-panel"
        className="fixed bottom-6 start-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
      >
        {activeCount > 0 && (
          <span
            aria-label={`${activeCount} accessibility settings active`}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black"
          >
            {activeCount}
          </span>
        )}
        {/* Universal accessibility symbol */}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="5" r="2.5" fill="currentColor" />
          <path d="M7 13h5l1.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 13V9.5a2.5 2.5 0 0 1 5 0V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14.5 18.5A4 4 0 1 0 7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
