'use client';

/**
 * "Which countries?" — the full list of countries a phone plan works in, in a pop-up (Gabriel,
 * 2026-09-28: a card only said "works in 36 countries", and a traveller could not tell whether their
 * country was one of them). Names come from the browser in the reader's language, sorted the way that
 * language sorts; the codes come from PikaSim's network list for the plan.
 */

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Props {
  /** ISO-2 codes. Fewer than two means there is nothing to list, and nothing is rendered. */
  codes: string[];
  className?: string;
}

export function PhoneCountriesDialog({ codes, className }: Props) {
  const t = useTranslations('phonePlans');
  const locale = useLocale();

  const countries = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      names = null;
    }
    const collator = new Intl.Collator(locale);
    return [...new Set(codes.map((c) => c.toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))]
      .map((code) => {
        let name = code;
        try {
          name = names?.of(code) ?? code;
        } catch {
          /* an unknown code keeps its letters */
        }
        return { code, name };
      })
      .sort((a, b) => collator.compare(a.name, b.name));
  }, [codes, locale]);

  if (countries.length < 2) return null;
  const title = t('countriesTitle', { count: countries.length });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={className ?? 'font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-800'}
        >
          {t('whichCountries')}
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
        <DialogTitle className="pe-8 text-lg font-bold text-gray-900 rtl:pe-0 rtl:ps-8">{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
        <ul className="grid min-h-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto pe-1 sm:grid-cols-3">
          {countries.map((c) => (
            <li key={c.code} className="flex min-w-0 items-center gap-2 text-sm text-gray-800">
              <img
                src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                alt=""
                loading="lazy"
                className="h-3.5 w-5 shrink-0 rounded-sm object-cover ring-1 ring-black/5"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden';
                }}
              />
              <span className="truncate">{c.name}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
