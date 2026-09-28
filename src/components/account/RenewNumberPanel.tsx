'use client';

/**
 * Ticket 042 — "renew and keep my number", inside the customer's order card.
 *
 * Asks the server what this eSIM can be renewed with (US and global numbers only) and shows each
 * option at our price. Choosing one puts a renewal line in the cart and goes to checkout; the
 * server checks there that the signed-in customer owns the number.
 */

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { renewalToPlan } from '@/lib/new-product-plans';
import { useAddPlanToCart } from '@/hooks/useAddPlanToCart';

interface RenewalResponse {
  renewable: boolean;
  region: 'us' | 'europe' | 'global' | 'local' | null;
  phoneNumber: string | null;
  expireTime: string | null;
  daysLeft: number | null;
  baseOrderId: string;
  options: { id: string; code: string; name: string; dataGb: number; days: number; voiceMinutes: number | null; sms: number | null; priceUsd: number }[];
}

export function RenewNumberPanel({ orderId }: { orderId: string }) {
  const t = useTranslations('phonePlans');
  const locale = useLocale();
  const { buyNow } = useAddPlanToCart();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [data, setData] = useState<RenewalResponse | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/account/esims/renewal?orderId=${encodeURIComponent(orderId)}`);
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setState('ready');
    } catch {
      setState('error');
    }
  }, [orderId]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && state === 'idle') load();
  };

  const dateText = data?.expireTime ? new Date(data.expireTime).toLocaleDateString(locale === 'he' ? 'he-IL' : locale) : null;

  return (
    <div className="mt-2 border-t border-sky-200/70 pt-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        {t('renewTitle')}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {state === 'loading' && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('renewLoading')}
            </p>
          )}
          {state === 'error' && <p className="text-xs text-red-600">{t('renewError')}</p>}

          {state === 'ready' && data && (
            <>
              {(dateText || data.daysLeft != null) && (
                <p className="text-xs text-gray-700">
                  {dateText && t('renewValidUntil', { date: dateText })}
                  {data.daysLeft != null && (
                    <span className={`ms-1.5 font-semibold ${data.daysLeft <= 7 ? 'text-amber-700' : 'text-gray-600'}`}>
                      · {data.daysLeft < 0 ? t('renewExpired') : t('renewDaysLeft', { days: data.daysLeft })}
                    </span>
                  )}
                </p>
              )}

              {!data.renewable ? (
                <p className="text-xs text-muted-foreground">{t('renewNotPossible')}</p>
              ) : data.options.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('renewNone')}</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{t('renewKeepsNumber')}</p>
                  <ul className="space-y-1.5">
                    {data.options.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <span className="text-sm text-gray-800">
                          {t('data', { gb: o.dataGb })} · {t('days', { days: o.days })}
                          {o.voiceMinutes != null && o.voiceMinutes !== 0 && (
                            <span className="text-xs text-muted-foreground">
                              {' · '}
                              {o.voiceMinutes < 0 ? t('minutesUnlimited') : t('minutes', { count: o.voiceMinutes })}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            buyNow(
                              renewalToPlan(o, { baseOrderId: data.baseOrderId, phoneNumber: data.phoneNumber, region: data.region }),
                              data.phoneNumber ? `‎${data.phoneNumber}` : t('renewCartLineNoNumber'),
                              'phone-renewal',
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          {t('renewButton')} · <span className="tabular-nums">{formatPrice(o.priceUsd)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
