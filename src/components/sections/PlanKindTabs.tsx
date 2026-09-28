'use client';

/**
 * Ticket 042 — the tabs at the top of a destination page.
 *
 * Two, in this order (Gabriel, 2026-09-28): "With a phone number" first and the default wherever the
 * destination has one, then "eSIM only" — unlimited by days and the by-GB shelf together. A tab with
 * nothing behind it is not drawn, and a single tab is not drawn as a tab at all.
 */

import { useTranslations } from 'next-intl';
import { Phone, Wifi } from 'lucide-react';

export type PlanKindTab = 'phone' | 'esim';

interface Props {
  value: PlanKindTab;
  onChange: (tab: PlanKindTab) => void;
  available: PlanKindTab[];
}

export function PlanKindTabs({ value, onChange, available }: Props) {
  const tP = useTranslations('phonePlans');
  const tD = useTranslations('destinations');

  const all: { key: PlanKindTab; label: string; hint: string; icon: typeof Phone; tone: string }[] = [
    { key: 'phone', label: tP('tabLabel'), hint: tP('tabHint'), icon: Phone, tone: 'text-sky-600' },
    { key: 'esim', label: tD('tabEsimLabel'), hint: tD('tabEsimHint'), icon: Wifi, tone: 'text-emerald-600' },
  ];
  const tabs = all.filter((tab) => available.includes(tab.key));
  if (tabs.length < 2) return null;

  return (
    <div role="tablist" aria-label={tD('tabsLabel')} className="grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-gray-50/80 p-1.5">
      {tabs.map(({ key, label, hint, icon: Icon, tone }) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            id={`plan-tab-${key}`}
            aria-selected={selected}
            aria-controls={`plan-panel-${key}`}
            onClick={() => onChange(key)}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center transition-all sm:flex-row sm:justify-center sm:gap-2.5 sm:py-3 ${
              selected
                ? 'bg-white shadow-md shadow-emerald-900/5 ring-1 ring-emerald-200'
                : 'text-gray-500 hover:bg-white/70 hover:text-gray-800'
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${selected ? tone : 'text-gray-400'}`} aria-hidden />
            <span className="flex flex-col sm:items-start">
              <span className={`text-sm font-bold leading-tight ${selected ? 'text-gray-800' : ''}`}>{label}</span>
              <span className="text-xs font-normal text-muted-foreground">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
