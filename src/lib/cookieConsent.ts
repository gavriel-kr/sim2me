/**
 * GDPR-compliant cookie consent: storage, types, and script gating helpers.
 * All non-necessary scripts must be gated until consent is given.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'cookie_consent_v1';
export const CONSENT_VERSION = 1;

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookieConsentState {
  version: number;
  updatedAt: string;
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultConsent: CookieConsentState = {
  version: CONSENT_VERSION,
  updatedAt: new Date().toISOString(),
  necessary: true,
  analytics: false,
  marketing: false,
};

function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function getConsent(): CookieConsentState | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setConsent(state: Partial<CookieConsentState>): CookieConsentState {
  const current = getConsent() ?? defaultConsent;
  const next: CookieConsentState = {
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    necessary: true,
    analytics: state.analytics ?? current.analytics,
    marketing: state.marketing ?? current.marketing,
  };
  if (isClient()) {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(next));
    consentListeners.forEach((cb) => cb(next));
  }
  return next;
}

export function hasConsent(category: ConsentCategory): boolean {
  const c = getConsent();
  if (!c) return category === 'necessary';
  if (category === 'necessary') return true;
  if (category === 'analytics') return c.analytics;
  if (category === 'marketing') return c.marketing;
  return false;
}

export function hasSavedConsent(): boolean {
  return getConsent() != null;
}

type ConsentListener = (state: CookieConsentState) => void;
const consentListeners = new Set<ConsentListener>();

export function onConsentChange(callback: ConsentListener): () => void {
  consentListeners.add(callback);
  return () => consentListeners.delete(callback);
}

/** Development-only: clear consent and allow banner to show again. */
export function resetConsentForDevelopment(): void {
  if (!isClient() || process.env.NODE_ENV !== 'development') return;
  localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  consentListeners.forEach((cb) => cb(defaultConsent));
}

export const cookieTranslations: Record<
  'en' | 'he' | 'ar',
  {
    title: string;
    description: string;
    acceptAll: string;
    rejectAll: string;
    customize: string;
    save: string;
    necessary: string;
    analytics: string;
    marketing: string;
    necessaryDesc: string;
    analyticsDesc: string;
    marketingDesc: string;
    settings: string;
  }
> = {
  en: {
    title: 'We use cookies',
    description:
      'We use cookies to improve your experience, analyze traffic, and personalize content.',
    acceptAll: 'Accept all',
    rejectAll: 'Reject all',
    customize: 'Customize',
    save: 'Save preferences',
    necessary: 'Necessary cookies',
    analytics: 'Analytics cookies',
    marketing: 'Marketing cookies',
    necessaryDesc: 'Required for the website to function properly.',
    analyticsDesc: 'Help us understand how visitors use the website.',
    marketingDesc: 'Used for advertising and retargeting.',
    settings: 'Cookie settings',
  },
  he: {
    title: 'אנו משתמשים בעוגיות',
    description:
      'אנו משתמשים בעוגיות כדי לשפר את חוויית המשתמש, לנתח תנועה ולהתאים תוכן.',
    acceptAll: 'אשר הכל',
    rejectAll: 'דחה הכל',
    customize: 'התאמה אישית',
    save: 'שמור העדפות',
    necessary: 'עוגיות הכרחיות',
    analytics: 'עוגיות אנליטיקה',
    marketing: 'עוגיות שיווק',
    necessaryDesc: 'נדרשות לפעילות התקינה של האתר.',
    analyticsDesc: 'מסייעות לנו להבין כיצד משתמשים באתר.',
    marketingDesc: 'משמשות לפרסום ורימרקטינג.',
    settings: 'הגדרות עוגיות',
  },
  ar: {
    title: 'نحن نستخدم ملفات تعريف الارتباط',
    description:
      'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة المرور وتخصيص المحتوى.',
    acceptAll: 'قبول الكل',
    rejectAll: 'رفض الكل',
    customize: 'تخصيص',
    save: 'حفظ التفضيلات',
    necessary: 'ملفات تعريف الارتباط الضرورية',
    analytics: 'ملفات التحليلات',
    marketing: 'ملفات التسويق',
    necessaryDesc: 'مطلوبة لعمل الموقع بشكل صحيح.',
    analyticsDesc: 'تساعدنا على فهم كيفية استخدام الموقع.',
    marketingDesc: 'تستخدم للإعلانات وإعادة الاستهداف.',
    settings: 'إعدادات ملفات تعريف الارتباط',
  },
};
