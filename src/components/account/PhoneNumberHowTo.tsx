'use client';

/**
 * Where the phone number shows on the phone itself: the iPhone and Android settings paths. PikaSim
 * does not report the number, so this is the only place a customer finds it (Gabriel, 2026-09-28).
 * Used under "your number is in your phone's settings" on the account page and the success page;
 * the purchase email and the FAQ carry the same paths.
 */

import { useTranslations } from 'next-intl';

export function PhoneNumberHowTo({ className = '' }: { className?: string }) {
  const t = useTranslations('phonePlans');
  return (
    <ul className={`space-y-0.5 text-xs leading-relaxed text-gray-700 ${className}`}>
      <li>{t('howToSeeIphone')}</li>
      <li>{t('howToSeeAndroid')}</li>
    </ul>
  );
}
