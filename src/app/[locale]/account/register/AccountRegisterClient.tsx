'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/PhoneInput';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function AccountRegisterClient() {
  const t = useTranslations('account');
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    phone: '',
    newsletter: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          name: form.name.trim(),
          lastName: form.lastName.trim() || undefined,
          phone: form.phone || undefined,
          newsletter: form.newsletter,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Account created</CardTitle>
          <CardDescription>You can sign in now with your email or phone and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push('/account/login')}>
            Go to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t('register')}</CardTitle>
        <CardDescription>Create an account — phone required for all countries</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p id="register-error" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="h-11"
              aria-invalid={!!error}
              aria-describedby={error ? 'register-error' : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                autoComplete="given-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('lastName')}</Label>
              <Input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Optional"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('phone')}</Label>
            <PhoneInput
              id="phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v || '' })}
              placeholder={t('phonePlaceholder')}
            />
            <p className="text-xs text-muted-foreground">Select country and enter number. Required.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newsletter"
              checked={form.newsletter}
              onChange={(e) => setForm({ ...form, newsletter: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="newsletter" className="font-normal text-muted-foreground cursor-pointer">
              {t('newsletter')}
            </Label>
          </div>
          <Button type="submit" className="w-full h-11" size="lg" disabled={loading || !form.phone}>
            {loading ? 'Creating account…' : t('createAccount')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('hasAccount')}{' '}
          <IntlLink href="/account/login" className="font-medium text-primary hover:underline">
            {t('signIn')}
          </IntlLink>
        </p>
      </CardContent>
    </Card>
  );
}
