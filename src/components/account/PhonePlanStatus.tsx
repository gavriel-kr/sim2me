'use client';

/**
 * Ticket 042 (2026-09-28) — a phone plan's status on the customer's account page.
 *
 * PikaSim reports nothing live for phone plans, so this shows what we know from our own orders: where
 * to find the number (the phone's settings), when the plan was bought, how long it runs, and when it
 * ends. The end is counted from the purchase until the customer gives their installation date here,
 * after which it is exact; the 48-hour renewal reminder follows the same date. Nothing here calls
 * PikaSim: saving the date is one request to our own API.
 */

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, Loader2 } from 'lucide-react';
import { PhoneNumberHowTo } from '@/components/account/PhoneNumberHowTo';

export interface PhonePlanWindow {
  baseOrderId: string;
  canSetInstallDate: boolean;
  purchasedAt: string;
  planDays: number;
  renewalDays: number;
  installedOn: string | null;
  endsOn: string;
  endsAt: string;
  exact: boolean;
}

function formatDay(isoDay: string, locale: string): string {
  return new Date(`${isoDay}T00:00:00Z`).toLocaleDateString(locale === 'he' ? 'he-IL' : locale, { timeZone: 'UTC' });
}

/** A moment (ISO time) as a date in the reader's own calendar. */
function formatMoment(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'he' ? 'he-IL' : locale);
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PhonePlanStatus({ initial, renewable }: { initial: PhonePlanWindow; renewable: boolean }) {
  const t = useTranslations('phonePlans');
  const locale = useLocale();
  const [plan, setPlan] = useState<PhonePlanWindow>(initial);
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(initial.installedOn ?? localToday());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const purchasedDay = plan.purchasedAt.slice(0, 10);
  const minDay = new Date(Date.parse(`${purchasedDay}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

  const save = async () => {
    setSaving(true);
    setError(false);
    try {
      const res = await fetch('/api/account/esims/installed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: plan.baseOrderId, date }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.plan) throw new Error(body?.error ?? String(res.status));
      setPlan((p) => ({ ...p, ...body.plan }));
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-sky-800">{t('numberPending')}</p>
        <p className="text-xs text-muted-foreground">{t('numberPendingHint')}</p>
        <PhoneNumberHowTo className="mt-1" />
      </div>

      <div className="space-y-0.5 border-t border-sky-200/70 pt-2 text-xs text-gray-700">
        <p>
          {t('statusPurchased', { date: formatMoment(plan.purchasedAt, locale) })}
          {' · '}
          {t('statusValidity', { days: plan.planDays })}
          {plan.renewalDays > 0 && <> ({t('statusRenewed', { days: plan.renewalDays })})</>}
        </p>
        {/* Where it can be changed, the button below shows the date instead. */}
        {plan.installedOn && !plan.canSetInstallDate && <p>{t('statusInstalledOn', { date: formatDay(plan.installedOn, locale) })}</p>}
        <p className="font-semibold text-gray-900">
          {plan.exact
            ? t('statusEnds', { date: formatDay(plan.endsOn, locale) })
            : // The same calendar day the reminder email names; for a 'no earlier than' date the earlier reading is the safe one.
              t('statusEndsEarliest', { date: formatDay(plan.endsOn, locale) })}
        </p>
        {!plan.exact && <p className="text-muted-foreground">{t('statusEarliestHint')}</p>}
        {renewable && <p className="text-muted-foreground">{t('statusReminder')}</p>}
      </div>

      {plan.canSetInstallDate &&
        (editing ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-gray-700">
              {t('installLabel')}
              <input
                type="date"
                value={date}
                min={minDay}
                max={localToday()}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={save}
              disabled={saving || !date}
              className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {t('installSave')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(false);
              }}
              className="rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
            >
              {t('installCancel')}
            </button>
            {error && <p className="w-full text-xs text-red-600">{t('installError')}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {plan.installedOn ? `${t('statusInstalledOn', { date: formatDay(plan.installedOn, locale) })} · ${t('installChange')}` : t('installSet')}
          </button>
        ))}
    </div>
  );
}
