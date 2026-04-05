'use client';

import { useState } from 'react';

interface Props {
  totpEnabled: boolean;
  totpVerifiedAt: Date | null;
}

export function SecurityClient({ totpEnabled: initialEnabled, totpVerifiedAt }: Props) {
  const [totpEnabled, setTotpEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/totp/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to start 2FA setup. Please try again.');
        setLoading(false);
        return;
      }
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setStep('setup');
      // Generate QR code in the browser to avoid server-side canvas dependency
      try {
        const QRCode = await import('qrcode');
        const url = await QRCode.toDataURL(data.otpauthUrl, { width: 200, margin: 2 });
        setQrDataUrl(url);
      } catch {
        // QR code generation failed in browser — user can still use manual key
        setQrDataUrl('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/totp/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return; }
    setTotpEnabled(true);
    setStep('idle');
    setCode('');
    setSuccess('2FA enabled successfully!');
    setLoading(false);
  }

  async function confirmDisable() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/totp/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return; }
    setTotpEnabled(false);
    setStep('idle');
    setCode('');
    setSuccess('2FA disabled.');
    setLoading(false);
  }

  return (
    <div className="mt-6 max-w-lg">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication (TOTP)</h2>
            <p className="mt-1 text-sm text-gray-500">
              Use Google Authenticator or Authy to generate time-based codes.
            </p>
            {totpEnabled && totpVerifiedAt && (
              <p className="mt-1 text-xs text-emerald-600">
                ✓ Enabled since {new Date(totpVerifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${totpEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
            {totpEnabled ? 'Active' : 'Disabled'}
          </span>
        </div>

        {success && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {step === 'idle' && !totpEnabled && (
          <button onClick={startSetup} disabled={loading} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Loading…' : 'Set up 2FA'}
          </button>
        )}

        {step === 'idle' && totpEnabled && (
          <button onClick={() => { setStep('disable'); setError(''); setSuccess(''); }} className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
            Disable 2FA
          </button>
        )}

        {step === 'setup' && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-700">
              1. Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>.
            </p>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR Code" className="mx-auto block rounded-lg border border-gray-200 p-2" width={200} height={200} />
              : otpauthUrl && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-700">
                  QR image unavailable — use the manual key below or{' '}
                  <a href={otpauthUrl} className="underline">tap here</a> to open your authenticator app directly.
                </div>
              )
            }
            <p className="text-sm text-gray-500">
              Enter this key manually in your app: <code className="rounded bg-gray-100 px-1 font-mono text-xs break-all">{secret}</code>
            </p>
            <p className="text-sm text-gray-700">2. Enter the 6-digit code from your app to confirm setup:</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button onClick={confirmEnable} disabled={loading || code.length !== 6} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {loading ? 'Verifying…' : 'Enable 2FA'}
              </button>
              <button onClick={() => setStep('idle')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'disable' && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-700">Enter your current authenticator code to disable 2FA:</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <button onClick={confirmDisable} disabled={loading || code.length !== 6} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Verifying…' : 'Disable 2FA'}
              </button>
              <button onClick={() => setStep('idle')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
