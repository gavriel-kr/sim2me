'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { routing } from '@/i18n/routing';
import { trackPurchase } from '@/lib/analytics';
import { CharacterFigure } from '@/components/brand/CharacterFigure';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

interface OrderData {
  orderNo: string;
  status: string;
  customerName: string;
  packageName: string;
  packageCode?: string;
  dataAmount: string;
  validity: string;
  totalAmount?: number;
  currency?: string;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  createdAt: string;
  credsExpiresAt: string | null;
}

type Status = 'loading' | 'completed' | 'failed' | 'not_found';

function hasSecrets(order: OrderData | null): boolean {
  if (!order) return false;
  return Boolean(order.qrCodeUrl || (order.smdpAddress && order.activationCode));
}

function lpaHref(smdp: string, code: string, platform: 'apple' | 'android'): string {
  const carddata = encodeURIComponent(`LPA:1$${smdp}$${code}`);
  const host = platform === 'apple' ? 'esimsetup.apple.com' : 'esimsetup.android.com';
  return `https://${host}/esim_qrcode_provisioning?carddata=${carddata}`;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SuccessClient({ transactionId }: { transactionId: string | null }) {
  const t = useTranslations('success');
  const tPhone = useTranslations('phonePlans');
  const [status, setStatus] = useState<Status>(transactionId ? 'loading' : 'not_found');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!transactionId) return;

    /* Stops for good once the order is settled. The interval used to keep firing every two seconds
       for as long as the page stayed open, long after the order was complete (found 2026-09-28). */
    let done = false;
    let tries = 0;
    const poll = async () => {
      if (done) return;
      tries++;
      try {
        const res = await fetch(`/api/orders/by-transaction/${encodeURIComponent(transactionId)}`);
        const data = await res.json();
        if (done) return; // a request still in flight when an earlier one settled the order
        if (data.order) {
          setOrder(data.order);
          if (data.order.status === 'COMPLETED') {
            stop();
            setStatus('completed');
            trackPurchase(
              transactionId,
              [{
                item_id: data.order.packageCode || data.order.packageName,
                item_name: data.order.packageName,
                price: data.order.totalAmount ?? 0,
                quantity: 1,
              }],
              data.order.totalAmount ?? 0,
            );
            return;
          }
          if (data.order.status === 'FAILED') {
            stop();
            setStatus('failed');
            return;
          }
        }
      } catch {
        /* network hiccup: counts as an attempt like any other */
      }
      if (tries > MAX_POLL_ATTEMPTS) {
        stop();
        setStatus('not_found');
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    // poll() only calls stop() after an await, by which time both exist.
    const stop = () => {
      done = true;
      clearInterval(interval);
    };
    poll();
    return stop;
  }, [transactionId]);

  const remainingMs = order?.credsExpiresAt
    ? new Date(order.credsExpiresAt).getTime() - now
    : 0;
  // Ticket 042: a renewal keeps the eSIM already installed, so there are no install details to show.
  const isRenewal = Boolean(order?.packageCode?.startsWith('rn:'));
  const showSecrets = status === 'completed' && hasSecrets(order) && remainingMs > 0 && !isRenewal;

  useEffect(() => {
    if (!showSecrets) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [showSecrets]);

  if (!transactionId) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">{t('noTransaction')}</p>
        <IntlLink href="/">
          <Button className="mt-6">{t('backToHome')}</Button>
        </IntlLink>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative h-24 w-24" aria-hidden>
            <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
            <div className="absolute inset-0 animate-ping rounded-full border-4 border-primary/20" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-primary/10">
              <span className="text-3xl">✈️</span>
            </div>
          </div>
          <div className="mt-2 flex items-end justify-center gap-2">
            <CharacterFigure slot="genericSimi" height={160} heightLg={200} />
            <CharacterFigure slot="genericSima" height={160} heightLg={200} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-primary">{t('activating')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('activatingDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-full bg-destructive/10 p-4 inline-flex mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-xl font-semibold">{t('failed')}</h1>
        <p className="mt-2 text-muted-foreground">{t('failedDesc')}</p>
        <IntlLink href="/contact">
          <Button className="mt-6">{t('contactSupport')}</Button>
        </IntlLink>
      </div>
    );
  }

  if (status === 'not_found' && !order) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">{t('stillProcessing')}</p>
        <IntlLink href="/account">
          <Button className="mt-6">{t('viewAccount')}</Button>
        </IntlLink>
      </div>
    );
  }

  if (status === 'completed' && order) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-8 sm:py-12">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="rounded-full bg-primary/10 p-4 mb-4 animate-in fade-in zoom-in duration-500">
            <span className="text-5xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">{t('thankYou')}</h1>
          <p className="mt-2 text-muted-foreground">{t('readyToUse')}</p>
          <div className="mt-6 flex items-end justify-center gap-2">
            <CharacterFigure slot="genericSimi" height={200} heightLg={260} />
            <CharacterFigure slot="genericSima" height={200} heightLg={260} />
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent">
            <h2 className="text-lg font-semibold">{order.packageName}</h2>
            <p className="text-sm text-muted-foreground">
              {order.dataAmount} · {order.validity}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Ticket 042: a phone plan's number only exists after installation — say so up front. */}
            {isRenewal && status === 'completed' && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-emerald-800">{tPhone('renewDone')}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{tPhone('renewKeepsNumber')}</p>
              </div>
            )}
            {order.packageCode?.startsWith('pk:') && (
              <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50/70 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-sky-800">{tPhone('numberPending')}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{tPhone('numberPendingHint')}</p>
              </div>
            )}
            {showSecrets ? (
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="w-full rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 text-center"
                  role="timer"
                  aria-live="polite"
                >
                  <p className="text-sm font-semibold text-amber-950">{t('countdownLabel')}</p>
                  <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-amber-900">
                    {formatRemaining(remainingMs)}
                  </p>
                  <p className="mt-1 text-xs text-amber-800">{t('countdownHint')}</p>
                </div>
                {order.qrCodeUrl ? (
                  <>
                    <p className="text-sm font-medium">{t('scanQR')}</p>
                    <div className="rounded-xl border-2 border-primary/20 bg-white p-4 shadow-sm">
                      <img
                        src={order.qrCodeUrl}
                        alt="eSIM QR Code"
                        width={220}
                        height={220}
                        className="rounded-lg"
                      />
                    </div>
                  </>
                ) : null}
                {order.smdpAddress && order.activationCode ? (
                  <div className="flex w-full flex-wrap justify-center gap-2">
                    <a
                      href={lpaHref(order.smdpAddress, order.activationCode, 'apple')}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {t('installIphone')}
                    </a>
                    <a
                      href={lpaHref(order.smdpAddress, order.activationCode, 'android')}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {t('installAndroid')}
                    </a>
                  </div>
                ) : null}
                {(order.smdpAddress || order.activationCode) && (
                  <div className="w-full space-y-2 rounded-lg bg-muted/50 p-4 text-left">
                    <p className="text-sm font-medium">{t('manualInstall')}</p>
                    {order.smdpAddress && (
                      <p className="text-xs break-all"><strong>SM-DP+:</strong> {order.smdpAddress}</p>
                    )}
                    {order.activationCode && (
                      <p className="text-xs break-all"><strong>Activation:</strong> {order.activationCode}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                {t('detailsInEmail')}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center flex-wrap">
              <IntlLink
                href="/installation-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                {t('downloadGuide')}
              </IntlLink>
              <IntlLink href="/account">
                <Button variant="outline">{t('viewAccount')}</Button>
              </IntlLink>
              <IntlLink href="/">
                <Button>{t('backToHome')}</Button>
              </IntlLink>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t('emailSent')}
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {t.rich('questionsHelp', {
            help: (chunks) => (
              <IntlLink href="/help" className="font-medium text-primary hover:underline">
                {chunks}
              </IntlLink>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-muted-foreground">{t('stillProcessing')}</p>
      <IntlLink href="/">
        <Button className="mt-6">{t('backToHome')}</Button>
      </IntlLink>
    </div>
  );
}
