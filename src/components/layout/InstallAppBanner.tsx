'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const defaultBannerIcon = (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="1" width="8" height="14" rx="1.5" fill="white" fillOpacity="0.9"/>
      <circle cx="7" cy="12" r="1" fill="#059669"/>
      <path d="M12 5c1.5-0.7 3 0 3.5 1.5s0 3-1.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M13 3c2-1 4 0 5 2s0 4-2 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
    </svg>
  </div>
);

export function InstallAppBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [bannerIconUrl, setBannerIconUrl] = useState<string | null>(null);

  useEffect(() => {
    // Don't show if already installed as PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Don't show if user dismissed it
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Only show on mobile
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Listen for Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show banner after a delay
    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    // For Android, also show after delay if prompt hasn't fired
    const fallbackTimer = setTimeout(() => setShowBanner(true), 3000);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  useEffect(() => {
    fetch('/api/site-branding')
      .then((res) => res.ok ? res.json() : null)
      .then((data: { faviconUrl?: string | null; brandingVersion?: number | null } | null) => {
        if (!data?.faviconUrl?.trim()) return null;
        const url = data.faviconUrl.trim();
        const version = data.brandingVersion ?? null;
        if (version != null && url.startsWith('/')) return `${url}?v=${version}`;
        return url;
      })
      .then(setBannerIconUrl)
      .catch(() => {});
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      // Android: only native install prompt (no custom overlay)
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS has no beforeinstallprompt: show manual steps
      setShowIOSGuide(true);
    }
    // Android without prompt: do nothing (no overlay)
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  }, []);

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Bottom banner */}
      <div className="fixed bottom-0 inset-x-0 z-[60] safe-area-pb animate-slide-up">
        <div className="mx-3 mb-3 rounded-2xl border border-border bg-white shadow-2xl">
          {/* iOS guide overlay */}
          {showIOSGuide ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-base">Install Sim2Me App</h3>
                <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-muted" aria-label="Close">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {isIOS ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Add Sim2Me to your home screen for the best experience:</p>
                  <div className="space-y-3">
                    <Step number={1} icon={<Share className="h-4 w-4" />}>
                      Tap the <strong>Share</strong> button <Share className="inline h-3.5 w-3.5 text-primary" /> at the bottom of Safari
                    </Step>
                    <Step number={2} icon={<Plus className="h-4 w-4" />}>
                      Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                    </Step>
                    <Step number={3} icon={<Download className="h-4 w-4" />}>
                      Tap <strong>&quot;Add&quot;</strong> — the Sim2Me icon will appear on your home screen
                    </Step>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Add Sim2Me to your home screen:</p>
                  <div className="space-y-3">
                    <Step number={1}>
                      Tap the <strong>three dots ⋮</strong> menu in the top-right corner of Chrome
                    </Step>
                    <Step number={2}>
                      Tap <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>
                    </Step>
                    <Step number={3}>
                      Tap <strong>&quot;Add&quot;</strong> to confirm
                    </Step>
                  </div>
                </div>
              )}

              <button
                onClick={handleDismiss}
                className="mt-4 w-full rounded-xl bg-muted py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Got it, maybe later
              </button>
            </div>
          ) : (
            /* Compact banner */
            <div className="flex items-center gap-3 p-3.5">
              {/* App icon: symbol from admin (favicon) when set */}
              {bannerIconUrl ? (
                <img src={bannerIconUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-contain shadow-sm" role="presentation" />
              ) : (
                defaultBannerIcon
              )}

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Get the Sim2Me App</p>
                <p className="text-xs text-muted-foreground">Quick access to eSIM plans</p>
              </div>

              {/* Install button */}
              <button
                onClick={handleInstall}
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
              >
                Install
              </button>

              {/* Dismiss */}
              <button onClick={handleDismiss} className="shrink-0 p-1.5" aria-label="Close">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Step({ number, icon, children }: { number: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
        {number}
      </span>
      <p className="text-sm text-foreground leading-relaxed pt-0.5">{children}</p>
    </div>
  );
}
