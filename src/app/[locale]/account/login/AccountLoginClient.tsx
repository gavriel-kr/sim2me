'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function AccountLoginClient() {
  const t = useTranslations('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setLoading(true);
    try {
      const res = await signIn('credentials-customer', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true);
        return;
      }
      if (res?.error) {
        setError('Invalid email or password. Please try again.');
        return;
      }
      if (res?.ok) {
        window.location.href = '/account';
        return;
      }
      setError('Something went wrong. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendSent(false);
    await fetch('/api/account/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    setResendSent(true);
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t('login')}</CardTitle>
        <CardDescription>Sign in with your email and password</CardDescription>
      </CardHeader>
      <CardContent>
        {unverified && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Please verify your email before signing in.</p>
            <p className="mt-1">Check your inbox for the verification link.</p>
            {resendSent ? (
              <p className="mt-2 text-emerald-700 font-medium">✓ Verification email sent!</p>
            ) : (
              <button onClick={handleResend} className="mt-2 underline text-amber-700 hover:text-amber-900 cursor-pointer">
                Resend verification email
              </button>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p id="login-error" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('password')}</Label>
              <IntlLink
                href="/account/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t('forgotPassword')}
              </IntlLink>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          <Button type="submit" className="w-full h-11" size="lg" disabled={loading}>
            {loading ? 'Signing in…' : t('signIn')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <IntlLink href="/account/register" className="font-medium text-primary hover:underline">
            {t('register')}
          </IntlLink>
        </p>
      </CardContent>
    </Card>
  );
}
