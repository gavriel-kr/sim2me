'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function AccountClient() {
  const t = useTranslations('account');
  const [signedIn] = useState(true); // Mock: always "signed in" for demo

  if (!signedIn) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="mt-4 text-muted-foreground">Sign in to view orders and eSIMs.</p>
        <Button className="mt-4">{t('signIn')}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button variant="outline">{t('signOut')}</Button>
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">{t('orders')}</TabsTrigger>
          <TabsTrigger value="esims">{t('esims')}</TabsTrigger>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('orders')}</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('noOrders')}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="esims" className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('esims')}</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('noEsims')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                After purchase, your eSIMs will appear here with QR code and install instructions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('profile')}</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Demo account. No profile data to edit.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
