'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function VerifyEmailClient({ token }: { token: string }) {
  const t = useTranslations('account');
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/account/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        setStatus(res.ok ? 'ok' : 'error');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (status === 'loading') {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Verifying your email…</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'ok') {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">{t('verifyEmailSuccess')}</CardTitle>
          <CardDescription>You can now sign in to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => { router.push('/account/login'); router.refresh(); }}
          >
            {t('signIn')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-destructive">{t('verifyEmailFailed')}</CardTitle>
        <CardDescription>
          The verification link may have expired. You can sign in and we can send a new one, or create an account again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <IntlLink href="/account/login">
          <Button className="w-full">Go to sign in</Button>
        </IntlLink>
        <IntlLink href="/account/register">
          <Button variant="outline" className="w-full">Create account</Button>
        </IntlLink>
      </CardContent>
    </Card>
  );
}
