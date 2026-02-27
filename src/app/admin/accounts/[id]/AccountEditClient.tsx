'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

type Account = {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  googleId?: string | null;
  newsletter: boolean;
  createdAt: string;
  updatedAt: string;
};

type OrderRow = {
  id: string;
  packageName: string;
  destination: string | null;
  dataAmount: string | null;
  validity: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  iccid: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  errorMessage: string | null;
  paddleTransactionId: string | null;
  createdAt: Date | string;
};

type ContactSubmissionRow = {
  id: string;
  subject: string;
  message: string;
  status: string;
  read: boolean;
  createdAt: string;
};

const CONTACT_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
};

interface Props {
  account: Account;
  orders: OrderRow[];
  contactSubmissions: ContactSubmissionRow[];
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
};

export function AccountEditClient({ account: initial, orders, contactSubmissions }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    email: initial.email,
    name: initial.name || '',
    lastName: initial.lastName || '',
    phone: initial.phone || '',
    newsletter: initial.newsletter,
    newPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      email: initial.email,
      name: initial.name || '',
      lastName: initial.lastName || '',
      phone: initial.phone || '',
      newsletter: initial.newsletter,
      newPassword: '',
    });
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        lastName: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        newsletter: form.newsletter,
      };
      if (form.newPassword.length >= 8) body.password = form.newPassword;

      const res = await fetch(`/api/admin/accounts/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }
      setMessage('Saved.');
      if (form.newPassword) setForm((f) => ({ ...f, newPassword: '' }));
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <Card className="mt-6 max-w-2xl">
      <CardHeader>
        <h2 className="text-lg font-semibold">Personal details</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
              {message}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">First name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (one number only)</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password (leave blank to keep current)</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Min 8 characters"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              minLength={8}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            {initial.googleId && (
              <span className="text-sm text-gray-500">Signed up with Google</span>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.newsletter}
                onChange={(e) => setForm({ ...form, newsletter: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Newsletter / updates</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/accounts')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    {/* Contact submissions section */}
    {contactSubmissions.length > 0 && (
      <div className="mt-8 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Contact Submissions ({contactSubmissions.length})</h2>
          <Link href="/admin/contact" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            View all submissions →
          </Link>
        </div>
        <div className="space-y-3">
          {contactSubmissions.map((sub) => (
            <Card key={sub.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{sub.subject}</p>
                  <div className="flex items-center gap-2">
                    {!sub.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CONTACT_STATUS_COLORS[sub.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {sub.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{sub.createdAt}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-2">{sub.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )}

    {/* Orders section */}
    <div className="mt-8 max-w-4xl">
      <h2 className="text-xl font-semibold text-gray-900">Orders ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No orders found for this customer.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.packageName}</p>
                    <p className="text-xs text-gray-500">
                      {order.destination && <span>{order.destination} · </span>}
                      {order.dataAmount && <span>{order.dataAmount} · </span>}
                      {order.validity && <span>{order.validity} · </span>}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      ${Number(order.totalAmount).toFixed(2)} {order.currency.toUpperCase()}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {order.iccid && (
                  <p className="text-xs text-gray-600"><span className="font-medium">ICCID:</span> {order.iccid}</p>
                )}
                {order.smdpAddress && (
                  <p className="text-xs text-gray-600"><span className="font-medium">SM-DP+:</span> {order.smdpAddress}</p>
                )}
                {order.activationCode && (
                  <p className="text-xs text-gray-600"><span className="font-medium">Activation Code:</span> {order.activationCode}</p>
                )}
                {order.qrCodeUrl && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-emerald-600">Show QR Code</summary>
                    <img src={order.qrCodeUrl} alt="QR" className="mt-2 h-32 w-32 rounded border" />
                  </details>
                )}
                {order.errorMessage && (
                  <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"><span className="font-medium">Error:</span> {order.errorMessage}</p>
                )}
                {order.paddleTransactionId && (
                  <a
                    href={`https://vendors.paddle.com/transactions/${order.paddleTransactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 underline"
                  >
                    View in Paddle ↗
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
