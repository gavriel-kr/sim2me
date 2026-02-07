'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

// Mock data for demo: one sample eSIM
type MockEsimStatus = 'pending' | 'activated';
const mockEsims: Array<{
  id: string;
  orderId: string;
  destinationName: string;
  planName: string;
  status: MockEsimStatus;
  activationCode: string;
  qrPlaceholder: boolean;
}> = [
  {
    id: 'esim_1',
    orderId: 'ord_demo',
    destinationName: 'United States',
    planName: '3 GB / 15 days',
    status: 'pending',
    activationCode: 'DEMO-CODE-123',
    qrPlaceholder: true,
  },
];

export function MyEsimsClient() {
  const t = useTranslations('account');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('esims')}</h1>
      <p className="mt-2 text-muted-foreground">
        Install and manage your eSIMs. Scan the QR code or enter the activation code on your device.
      </p>

      {mockEsims.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('noEsims')}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          {mockEsims.map((esim) => (
            <Card key={esim.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="font-semibold">{esim.destinationName} – {esim.planName}</h2>
                  <p className="text-sm text-muted-foreground">{t('orderId')}: {esim.orderId}</p>
                </div>
                <Badge variant={esim.status === 'activated' ? 'success' : 'secondary'}>
                  {t(esim.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{t('installInstructions')}</p>
                  <ol className="mt-2 list-inside list-decimal text-sm text-muted-foreground">
                    <li>Open Settings → Cellular → Add Cellular Plan</li>
                    <li>Scan the QR code below</li>
                    <li>Activate when you arrive at your destination</li>
                  </ol>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{t('qrCode')}</p>
                    <div className="mt-2 flex h-40 w-40 items-center justify-center rounded-lg border border-dashed bg-muted text-xs text-muted-foreground">
                      QR placeholder
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('activationCode')}</p>
                    <p className="mt-1 font-mono text-sm">{esim.activationCode}</p>
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
