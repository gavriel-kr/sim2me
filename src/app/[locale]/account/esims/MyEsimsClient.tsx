'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

interface OrderRow {
  id: string;
  packageName: string;
  destination: string | null;
  dataAmount: string | null;
  validity: string | null;
  iccid: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  createdAt: Date;
}

interface Props {
  orders: OrderRow[];
}

export function MyEsimsClient({ orders }: Props) {
  const t = useTranslations('account');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('esims')}</h1>
      <p className="mt-2 text-muted-foreground">
        Install and manage your eSIMs. Scan the QR code or enter the activation code on your device.
      </p>

      {orders.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('noEsims')}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    {order.destination ? `${order.destination} – ` : ''}{order.packageName}
                  </h2>
                  {(order.dataAmount || order.validity) && (
                    <p className="text-sm text-muted-foreground">
                      {[order.dataAmount, order.validity].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{t('orderId')}: {order.id.slice(0, 8)}…</p>
                </div>
                <Badge variant="success">Active</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{t('installInstructions')}</p>
                  <ol className="mt-2 list-inside list-decimal text-sm text-muted-foreground">
                    <li>Open Settings → Cellular → Add Cellular Plan</li>
                    <li>Scan the QR code below or enter code manually</li>
                    <li>Activate when you arrive at your destination</li>
                  </ol>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{t('qrCode')}</p>
                    {order.qrCodeUrl ? (
                      <img
                        src={order.qrCodeUrl}
                        alt="eSIM QR Code"
                        className="mt-2 h-40 w-40 rounded-lg border"
                      />
                    ) : (
                      <div className="mt-2 flex h-40 w-40 items-center justify-center rounded-lg border border-dashed bg-muted text-xs text-muted-foreground">
                        QR not available
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {order.smdpAddress && (
                      <div>
                        <p className="text-sm font-medium">SM-DP+ Address</p>
                        <p className="mt-1 break-all font-mono text-xs">{order.smdpAddress}</p>
                      </div>
                    )}
                    {order.activationCode && (
                      <div>
                        <p className="text-sm font-medium">{t('activationCode')}</p>
                        <p className="mt-1 font-mono text-sm">{order.activationCode}</p>
                      </div>
                    )}
                    {order.iccid && (
                      <div>
                        <p className="text-sm font-medium">ICCID</p>
                        <p className="mt-1 font-mono text-xs">{order.iccid}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <IntlLink href="/account">
        <span className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          ← Back to account
        </span>
      </IntlLink>
    </div>
  );
}
