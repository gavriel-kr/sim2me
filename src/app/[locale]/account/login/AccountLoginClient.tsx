'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TurnstileWidget } from '@/components/ui/TurnstileWidget';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

type Step = 'credentials' | 'otp';

export function AccountLoginClient() {
  const t = useTranslations('account');
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [step]);

  // Countdown timer for resend button cooldown
  function startCooldown() {
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setLoading(true);
    try {
      // Verify Turnstile before attempting login
      if (turnstileToken) {
        const check = await fetch('/api/account/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        if (!check.ok) {
          setError('Security check failed. Please try again.');
          setTurnstileToken(null);
          return;
        }
      }

      const res = await signIn('credentials-customer', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true);
        return;
      }
      if (res?.error === 'OTP_REQUIRED') {
        // Server sent the OTP email — move to OTP step
        setStep('otp');
        setOtpCode('');
        setError('');
        startCooldown();
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
      setTurnstileToken(null);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials-customer', {
        email: email.trim().toLowerCase(),
        password,
        otpCode: otpCode.trim(),
        redirect: false,
      });

      if (res?.error === 'OTP_INVALID') {
        setError('Incorrect code. Please check your email and try again.');
        setOtpCode('');
        return;
      }
      if (res?.error === 'OTP_EXPIRED') {
        setError('This code has expired. Please request a new one.');
        setOtpCode('');
        return;
      }
      if (res?.error === 'OTP_TOO_MANY_ATTEMPTS') {
        setError('Too many failed attempts. Please request a new code.');
        setOtpCode('');
        return;
      }
      if (res?.error) {
        setError('Something went wrong. Please try again.');
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
    if (resendCooldown > 0) return;
    setResendSent(false);
    setError('');
    try {
      await fetch('/api/account/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setResendSent(true);
      setOtpCode('');
      startCooldown();
    } catch {
      setError('Failed to resend. Please try again.');
    }
  }

  async function handleResendVerification() {
    setResendSent(false);
    await fetch('/api/account/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    setResendSent(true);
  }

  // ── Step 2: OTP verification ────────────────────────────────────────
  if (step === 'otp') {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {resendSent && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                ✓ New code sent — check your inbox.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="otp-code">6-digit code</Label>
              <Input
                id="otp-code"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-14 text-center text-2xl font-mono tracking-widest"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11"
              size="lg"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? 'Verifying…' : 'Verify Code'}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStep('credentials'); setError(''); setOtpCode(''); }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="flex items-center gap-1 text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
            >
              <Mail className="h-4 w-4" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Step 1: Email + password ─────────────────────────────────────────
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
              <button onClick={handleResendVerification} className="mt-2 underline text-amber-700 hover:text-amber-900 cursor-pointer">
                Resend verification email
              </button>
            )}
          </div>
        )}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
          <TurnstileWidget
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            className="my-2"
          />
          <Button type="submit" className="w-full h-11" size="lg" disabled={loading || !turnstileToken}>
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
