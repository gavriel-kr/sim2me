'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type CookieConsentState,
  getConsent,
  hasConsent as libHasConsent,
  onConsentChange,
  resetConsentForDevelopment,
  setConsent as libSetConsent,
  type ConsentCategory,
} from '@/lib/cookieConsent';
import { CookiePreferencesModal } from '@/components/CookiePreferencesModal';

const GTM_ID = 'GTM-NSQKP7XQ';
const GA_ID = 'G-Y5BJ7VNNYM';

type CookieContextValue = {
  consent: CookieConsentState | null;
  setConsent: (state: Partial<CookieConsentState>) => void;
  showBanner: boolean;
  setShowBanner: (v: boolean) => void;
  openCookieSettings: () => void;
  hasConsent: (category: ConsentCategory) => boolean;
};

const CookieConsentContext = createContext<CookieContextValue | null>(null);

export function useCookieConsent(): CookieContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}

function loadGTM(): void {
  if (typeof window === 'undefined' || (window as unknown as { __gtmLoaded?: boolean }).__gtmLoaded)
    return;
  (window as unknown as { __gtmLoaded: boolean }).__gtmLoaded = true;
  const script = document.createElement('script');
  script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;
  document.head.appendChild(script);
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  iframe.title = 'Google Tag Manager';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

function loadGA(): void {
  if (typeof window === 'undefined' || (window as unknown as { __gaLoaded?: boolean }).__gaLoaded)
    return;
  (window as unknown as { __gaLoaded: boolean }).__gaLoaded = true;
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(gtagScript);
  const configScript = document.createElement('script');
  configScript.innerHTML = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`;
  document.head.appendChild(configScript);
}

function loadTrackingScripts(): void {
  loadGTM();
  loadGA();
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<CookieConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const scriptsLoadedRef = useRef(false);

  const setConsent = useCallback((state: Partial<CookieConsentState>) => {
    const next = libSetConsent(state);
    setConsentState(next);
    setShowBanner(false);
  }, []);

  const openCookieSettings = useCallback(() => {
    setShowModal(true);
  }, []);

  const hasConsent = useCallback((category: ConsentCategory) => libHasConsent(category), []);

  // Hydrate from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = getConsent();
    setConsentState(saved);
    setShowBanner(saved == null);
  }, []);

  // Load scripts when consent includes analytics or marketing
  useEffect(() => {
    if (!consent || scriptsLoadedRef.current) return;
    if (consent.analytics || consent.marketing) {
      scriptsLoadedRef.current = true;
      loadTrackingScripts();
    }
  }, [consent]);

  // Listen for consent changes (e.g. from another tab or onConsentChange)
  useEffect(() => {
    const unsub = onConsentChange((next) => {
      setConsentState(next);
      if ((next.analytics || next.marketing) && !scriptsLoadedRef.current) {
        scriptsLoadedRef.current = true;
        loadTrackingScripts();
      }
    });
    return unsub;
  }, []);

  // Development-only reset helper
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;
    (window as unknown as { __resetCookieConsent?: () => void }).__resetCookieConsent = () => {
      resetConsentForDevelopment();
      setConsentState(null);
      setShowBanner(true);
      setShowModal(false);
      scriptsLoadedRef.current = false;
    };
    return () => {
      delete (window as unknown as { __resetCookieConsent?: () => void }).__resetCookieConsent;
    };
  }, []);

  const value: CookieContextValue = {
    consent,
    setConsent,
    showBanner,
    setShowBanner,
    openCookieSettings,
    hasConsent,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {showModal && (
        <CookiePreferencesModal
          consent={consent}
          onSave={(state) => {
            setConsent(state);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </CookieConsentContext.Provider>
  );
}
