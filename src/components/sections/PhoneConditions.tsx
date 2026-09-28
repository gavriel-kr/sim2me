'use client';

/**
 * Ticket 042 — the terms of a plan with a phone number, as a plain list.
 *
 * Shown under the phone plans and again at checkout, from one component so the two never drift
 * apart. The no-refund line is one condition among the others, not a warning of its own
 * (Gabriel's call). Renewal is stated per kind of number, because only US and global numbers can be
 * kept: a promise to "renew and keep your number" on a French number would be false.
 */

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

interface Props {
  includeEurope?: boolean;
  /** A US or global number is among the plans shown. */
  includeRenewable?: boolean;
  /** A French or local number is among the plans shown. */
  includeNotRenewable?: boolean;
  className?: string;
}

export function PhoneConditions({ includeEurope, includeRenewable, includeNotRenewable, className }: Props) {
  const t = useTranslations('phonePlans');
  const items = [
    t('condDevice'),
    t('condNumber'),
    t('condValidity'),
    ...(includeEurope ? [t('condEurope')] : []),
    ...(includeRenewable ? [t('condRenewable')] : []),
    ...(includeNotRenewable ? [t('condNotRenewable')] : []),
    t('condRefund'),
  ];
  return (
    <ul className={`space-y-1.5 text-sm text-gray-700 ${className ?? ''}`}>
      {items.map((text) => (
        <li key={text} className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}
