'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { routing } from '@/i18n/routing';
import { brandConfig } from '@/config/brand';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

interface OrderData {
  orderNo: string;
  status: string;
  customerName: string;
  packageName: string;
  dataAmount: string;
  validity: string;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  createdAt: string;
}

type Status = 'loading' | 'completed' | 'failed' | 'not_found';

export function SuccessClient({ transactionId }: { transactionId: string | null }) {
  const t = useTranslations('success');
  const [status, setStatus] = useState<Status>(transactionId ? 'loading' : 'not_found');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!transactionId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/by-transaction/${encodeURIComponent(transactionId)}`);
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          if (data.order.status === 'COMPLETED') {
            setStatus('completed');
            return;
          }
          if (data.order.status === 'FAILED') {
            setStatus('failed');
            return;
          }
        }
        setAttempts((a) => {
          if (a >= MAX_POLL_ATTEMPTS) {
            setStatus('not_found');
            return a;
          }
          return a + 1;
        });
      } catch {
        setAttempts((a) => a + 1);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [transactionId]);

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

  if (status === 'loading' || (status === 'loading' && !order)) {
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
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent">
            <h2 className="text-lg font-semibold">{order.packageName}</h2>
            <p className="text-sm text-muted-foreground">
              {order.dataAmount} · {order.validity}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {order.qrCodeUrl ? (
              <div className="flex flex-col items-center space-y-4">
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
              </div>
            ) : (
              <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-left">
                <p className="text-sm font-medium">{t('manualInstall')}</p>
                {order.smdpAddress && (
                  <p className="text-xs break-all"><strong>SM-DP+:</strong> {order.smdpAddress}</p>
                )}
                {order.activationCode && (
                  <p className="text-xs break-all"><strong>Activation:</strong> {order.activationCode}</p>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t('emailSent')} {brandConfig.supportEmail}
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
