'use client';

/**
 * "How do I see the number on my phone?" — iPhone and Android settings paths, folded away under one
 * line so it does not crowd the order card. Shown wherever the customer is still waiting for their
 * number (account page, success page); the emails carry the same text (Gabriel, 2026-09-28).
 */

import { useTranslations } from 'next-intl';

export function PhoneNumberHowTo({ className = '' }: { className?: string }) {
  const t = useTranslations('phonePlans');
  return (
    <details className={`text-xs text-muted-foreground ${className}`}>
      <summary className="cursor-pointer font-medium text-sky-800">{t('howToSeeTitle')}</summary>
      <ul className="mt-1 space-y-0.5 leading-relaxed">
        <li>{t('howToSeeIphone')}</li>
        <li>{t('howToSeeAndroid')}</li>
        <li>{t('howToSeeNote')}</li>
      </ul>
    </details>
  );
}
