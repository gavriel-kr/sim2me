'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

type Profile = {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  newsletter: boolean;
  emailVerified: boolean;
  createdAt: string;
};

export function AccountClient() {
  const t = useTranslations('account');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: '', lastName: '', phone: '', newsletter: false });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setProfile(data);
          setProfileForm({
            name: data.name || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            newsletter: data.newsletter ?? false,
          });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          lastName: profileForm.lastName.trim() || undefined,
          phone: profileForm.phone.trim() || undefined,
          newsletter: profileForm.newsletter,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setProfileError(data.error || 'Failed to save');
        return;
      }
      if (profile) {
        setProfile({
          ...profile,
          name: profileForm.name.trim(),
          lastName: profileForm.lastName.trim() || null,
          phone: profileForm.phone.trim() || null,
          newsletter: profileForm.newsletter,
        });
      }
    } catch {
      setProfileError('Something went wrong');
    } finally {
      setProfileSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <p className="text-muted-foreground">Loading account…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: '/account/login' })}
        >
          {t('signOut')}
        </Button>
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
              <IntlLink href="/destinations">
                <Button variant="outline" className="mt-4">Browse destinations</Button>
              </IntlLink>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('editProfile')}</h2>
              {profile.emailVerified && (
                <p className="text-xs text-primary font-medium mt-1">{t('emailVerified')}</p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                {profileError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {profileError}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact support if needed.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('lastName')}</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="One number only"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={profileForm.newsletter}
                    onChange={(e) => setProfileForm({ ...profileForm, newsletter: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="newsletter" className="font-normal text-muted-foreground cursor-pointer">
                    {t('newsletter')}
                  </Label>
                </div>
                <Button type="submit" disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
