'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Account = {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  emailVerified: boolean;
  newsletter: boolean;
  createdAt: string;
  updatedAt: string;
};

interface Props {
  account: Account;
}

export function AccountEditClient({ account: initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    email: initial.email,
    name: initial.name || '',
    lastName: initial.lastName || '',
    phone: initial.phone || '',
    emailVerified: initial.emailVerified,
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
      emailVerified: initial.emailVerified,
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
        emailVerified: form.emailVerified,
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.emailVerified}
                onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Email verified</span>
            </label>
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
  );
}
