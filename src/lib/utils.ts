import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * "10 GB" → "10 ג'יגה" / "10 جيجا".
 *
 * Not cosmetic. A Latin unit inside a right-to-left line becomes its own left-to-right island, and
 * "10 GB · 30 ימים" ends up rendering the two figures side by side with no way to tell which one is
 * the data and which one is the days. Every surface that prints a data amount beside a duration has
 * to go through this.
 */
export function localizeDataDisplay(dataDisplay: string, locale: string): string {
  if (locale === 'he') {
    return dataDisplay
      .replace(/\bGB\b/g, "ג'יגה")
      .replace(/\bMB\b/g, 'מגה')
      .replace(/\bUnlimited\b/gi, 'ללא הגבלה');
  }
  if (locale === 'ar') {
    return dataDisplay
      .replace(/\bGB\b/g, 'جيجا')
      .replace(/\bMB\b/g, 'ميجا')
      .replace(/\bUnlimited\b/gi, 'غير محدود');
  }
  return dataDisplay;
}

export function formatDataAmount(mb: number): string {
  if (mb < 0) return 'Unlimited';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}
