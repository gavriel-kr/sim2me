'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/PhoneInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User, ShoppingBag, Wifi, Settings, LogOut, Phone, Mail,
  Calendar, Shield, CheckCircle, AlertCircle, ChevronRight, QrCode,
  RotateCcw, ChevronDown, ChevronUp, HelpCircle, Download,
} from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

type Profile = {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  newsletter: boolean;
  createdAt: string;
};

type Order = {
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
  createdAt: string;
  paddleTransactionId: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

function getInitials(name: string, lastName?: string | null) {
  const first = name?.[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  return first + last || '?';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

function UsageBar({ orderId, iccid }: { orderId: string; iccid: string }) {
  const [usage, setUsage] = useState<{
    orderVolume: number | null;
    usedVolume: number | null;
    remainingVolume: number | null;
    expiredTime: number | null;
    status: string;
  } | null | 'loading' | 'unavailable'>('loading');

  useEffect(() => {
    fetch(`/api/account/esims/usage?iccid=${encodeURIComponent(iccid)}&orderId=${encodeURIComponent(orderId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.usage) setUsage(data.usage);
        else setUsage('unavailable');
      })
      .catch(() => setUsage('unavailable'));
  }, [iccid, orderId]);

  if (usage === 'loading') return <p className="text-xs text-muted-foreground animate-pulse">Loading usage data…</p>;
  if (usage === 'unavailable' || !usage) return null;

  const total = usage.orderVolume;
  const used = usage.usedVolume;
  const remaining = usage.remainingVolume;

  if (!total || total <= 0) return null;

  const usedPct = Math.min(100, Math.round(((used ?? 0) / total) * 100));
  const fmt = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">Data usage</span>
        <span className="font-mono">
          {used != null ? fmt(used) : '—'} / {fmt(total)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${usedPct > 80 ? 'bg-red-500' : usedPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{usedPct}% used</span>
        {remaining != null && <span>{fmt(remaining)} remaining</span>}
      </div>
      {usage.expiredTime && (
        <p className="text-xs text-muted-foreground">
          Expires: {new Date(usage.expiredTime).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export function AccountClient() {
  const t = useTranslations('account');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryMsg, setRetryMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', lastName: '', phone: '', newsletter: false });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/account/profile').then((r) => r.ok ? r.json() : null),
      fetch('/api/account/orders').then((r) => r.ok ? r.json() : null),
    ]).then(([profileData, ordersData]) => {
      if (cancelled) return;
      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          name: profileData.name || '',
          lastName: profileData.lastName || '',
          phone: profileData.phone || '',
          newsletter: profileData.newsletter ?? false,
        });
      }
      if (ordersData?.orders) setOrders(ordersData.orders);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleRetryOrder(orderId: string) {
    setRetrying(orderId);
    setRetryMsg(null);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/retry`, { method: 'POST' });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'COMPLETED' } : o));
        setRetryMsg({ id: orderId, ok: true, text: '✓ eSIM activated successfully! Check your email.' });
      } else {
        const data = await res.json();
        setRetryMsg({ id: orderId, ok: false, text: data.error || 'Retry failed. Please contact support.' });
      }
    } catch {
      setRetryMsg({ id: orderId, ok: false, text: 'Network error. Please try again.' });
    } finally {
      setRetrying(null);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
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
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError('Something went wrong');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || 'Failed to change password');
        return;
      }
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 4000);
    } catch {
      setPwError('Something went wrong');
    } finally {
      setPwSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading your account…</p>
        </div>
      </div>
    );
  }

  const displayName = [profile.name, profile.lastName].filter(Boolean).join(' ') || profile.email;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {getInitials(profile.name, profile.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{displayName}</h1>
              <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive hidden sm:flex"
              onClick={() => signOut({ callbackUrl: '/account/login' })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('signOut')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Quick info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orders</p>
              <p className="font-semibold text-sm">{orders.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">eSIMs</p>
              <p className="font-semibold text-sm">{orders.filter((o) => o.status === 'COMPLETED').length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <Phone className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-semibold text-sm truncate max-w-[80px]">{profile.phone ? '✓' : 'Missing'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="font-semibold text-sm">{new Date(profile.createdAt).getFullYear()}</p>
            </div>
          </div>
        </div>

        {/* Missing phone alert */}
        {!profile.phone && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Phone number required</p>
              <p className="text-xs text-amber-600 mt-0.5">Please add your phone number in Profile settings.</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="bg-white border grid w-full grid-cols-4 h-auto p-1 gap-1">
            <TabsTrigger value="orders" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('orders')}</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="esims" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('esims')}</span>
              <span className="sm:hidden">eSIMs</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('profile')}</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders */}
          <TabsContent value="orders">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="font-medium text-muted-foreground">{t('noOrders')}</p>
                    <p className="text-sm text-muted-foreground mt-1">Your orders will appear here after purchase.</p>
                    <IntlLink href="/destinations">
                      <Button className="mt-6" size="sm">
                        Browse destinations
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </IntlLink>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const isExpanded = expandedOrder === order.id;
                      const isFailed = order.status === 'FAILED';
                      const isCompleted = order.status === 'COMPLETED';
                      return (
                        <div key={order.id} className="rounded-xl border overflow-hidden">
                          {/* Row */}
                          <button
                            className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {order.destination ? `${order.destination} — ` : ''}{order.packageName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {[order.dataAmount, order.validity].filter(Boolean).join(' / ')}
                                {' · '}{new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm font-medium">${Number(order.totalAmount).toFixed(2)}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                {order.status}
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </button>

                          {/* Expanded panel */}
                          {isExpanded && (
                            <div className="border-t bg-gray-50/50 p-4 space-y-4">
                              {/* Retry message */}
                              {retryMsg?.id === order.id && (
                                <div className={`rounded-lg px-3 py-2 text-sm ${retryMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                  {retryMsg.text}
                                </div>
                              )}

                              {/* FAILED: retry + support */}
                              {isFailed && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                                  <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    There was an issue activating your eSIM
                                  </p>
                                  <p className="text-xs text-amber-700">
                                    You can try activating again or contact support for assistance.
                                  </p>
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      onClick={() => handleRetryOrder(order.id)}
                                      disabled={retrying === order.id}
                                      className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                      {retrying === order.id ? 'Retrying…' : 'Retry Activation'}
                                    </Button>
                                    <a
                                      href="mailto:support@sim2me.net?subject=Order%20Issue"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                                    >
                                      Contact Support
                                    </a>
                                  </div>
                                </div>
                              )}

                              {/* COMPLETED: QR + install details */}
                              {isCompleted && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                  {order.qrCodeUrl ? (
                                    <div className="flex-shrink-0">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">QR Code</p>
                                      <img
                                        src={order.qrCodeUrl}
                                        alt="eSIM QR"
                                        className="h-40 w-40 rounded-xl border object-contain bg-white"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-40 w-40 rounded-xl border border-dashed flex items-center justify-center bg-white flex-shrink-0">
                                      <QrCode className="w-10 h-10 text-muted-foreground/30" />
                                    </div>
                                  )}
                                  <div className="space-y-3 text-sm min-w-0">
                                    {order.smdpAddress && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SM-DP+ Address</p>
                                        <p className="font-mono text-xs break-all mt-1 select-all">{order.smdpAddress}</p>
                                      </div>
                                    )}
                                    {order.activationCode && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activation Code</p>
                                        <p className="font-mono text-sm mt-1 select-all">{order.activationCode}</p>
                                      </div>
                                    )}
                                    {order.iccid && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ICCID</p>
                                        <p className="font-mono text-xs mt-1 select-all">{order.iccid}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* eSIMs */}
          <TabsContent value="esims">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-primary" />
                  My eSIMs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.filter((o) => o.status === 'COMPLETED').length === 0 ? (
                  <div className="text-center py-12">
                    <Wifi className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="font-medium text-muted-foreground">{t('noEsims')}</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                      After purchase, your eSIMs will appear here with QR code and install instructions.
                    </p>
                    <IntlLink href="/destinations">
                      <Button className="mt-6" size="sm">
                        Browse destinations
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </IntlLink>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders
                      .filter((o) => o.status === 'COMPLETED')
                      .map((order) => (
                        <div key={order.id} className="rounded-xl border p-4 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">
                                {order.destination ? `${order.destination} — ` : ''}{order.packageName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {[order.dataAmount, order.validity].filter(Boolean).join(' / ')}
                                {' · '}{new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 bg-green-100 text-green-700">
                              Active
                            </span>
                          </div>

                          {/* Usage bar — live from eSIMaccess */}
                          {order.iccid && (
                            <UsageBar orderId={order.id} iccid={order.iccid} />
                          )}

                          {/* QR + credentials */}
                          <div className="flex flex-col sm:flex-row gap-4">
                            {order.qrCodeUrl ? (
                              <div className="flex-shrink-0">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">QR Code</p>
                                <img
                                  src={order.qrCodeUrl}
                                  alt="eSIM QR Code"
                                  className="h-40 w-40 rounded-xl border object-contain bg-white"
                                />
                                <a
                                  href={order.qrCodeUrl}
                                  download="esim-qr.png"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download QR
                                </a>
                              </div>
                            ) : (
                              <div className="h-40 w-40 rounded-xl border border-dashed flex items-center justify-center bg-muted flex-shrink-0">
                                <QrCode className="w-10 h-10 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="space-y-3 text-sm min-w-0">
                              {order.smdpAddress && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SM-DP+ Address</p>
                                  <p className="font-mono text-xs break-all mt-1 select-all bg-muted/50 rounded px-2 py-1">{order.smdpAddress}</p>
                                </div>
                              )}
                              {order.activationCode && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activation Code</p>
                                  <p className="font-mono text-sm mt-1 select-all bg-muted/50 rounded px-2 py-1">{order.activationCode}</p>
                                </div>
                              )}
                              {order.iccid && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ICCID</p>
                                  <p className="font-mono text-xs mt-1 select-all bg-muted/50 rounded px-2 py-1">{order.iccid}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Installation instructions */}
                          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 space-y-1.5">
                            <p className="text-xs font-semibold text-blue-800">Installation steps</p>
                            <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
                              <li>Go to Settings → Cellular → Add Cellular Plan</li>
                              <li>Scan QR code above, or tap &ldquo;Enter Details Manually&rdquo;</li>
                              <li>For manual: enter SM-DP+ Address and Activation Code</li>
                              <li>Label the plan (e.g. &ldquo;Travel eSIM&rdquo;) and save</li>
                              <li>Enable Data Roaming when you land abroad</li>
                            </ol>
                          </div>

                          {/* Troubleshooting */}
                          <button
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowTroubleshooting(showTroubleshooting === order.id ? null : order.id)}
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            Troubleshooting & FAQ
                            {showTroubleshooting === order.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {showTroubleshooting === order.id && (
                            <div className="rounded-lg bg-gray-50 border p-3 space-y-2.5 text-xs text-gray-700">
                              <div>
                                <p className="font-semibold">QR code won&apos;t scan?</p>
                                <p>Use the manual installation: go to Settings → Cellular → Add Cellular Plan → Enter Manually, then enter the SM-DP+ Address and Activation Code above.</p>
                              </div>
                              <div>
                                <p className="font-semibold">No internet abroad?</p>
                                <p>Make sure Data Roaming is enabled in Settings → Cellular → (your eSIM) → Data Roaming. Also check the correct SIM is selected for data.</p>
                              </div>
                              <div>
                                <p className="font-semibold">eSIM not showing after scan?</p>
                                <p>Restart your device. The eSIM may take a few minutes to provision after scanning.</p>
                              </div>
                              <div>
                                <p className="font-semibold">Still need help?</p>
                                <a href="mailto:support@sim2me.net" className="text-primary underline">Contact support</a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                  {profileError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      Profile updated successfully
                    </div>
                  )}

                  {/* Email (read-only) */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {t('email')}
                    </Label>
                    <Input value={profile.email} disabled className="bg-muted h-10" />
                    <p className="text-xs text-muted-foreground">To change your email, contact support.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium">{t('name')}</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                        className="h-10"
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm font-medium">{t('lastName')}</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="h-10"
                        placeholder="Last name (optional)"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {t('phone')}
                      <span className="text-destructive">*</span>
                    </Label>
                    <PhoneInput
                      id="phone"
                      value={profileForm.phone}
                      onChange={(v) => setProfileForm({ ...profileForm, phone: v || '' })}
                      placeholder={t('phonePlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">Required for eSIM support and account recovery.</p>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3">
                    <input
                      type="checkbox"
                      id="newsletter"
                      checked={profileForm.newsletter}
                      onChange={(e) => setProfileForm({ ...profileForm, newsletter: e.target.checked })}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor="newsletter" className="font-normal text-sm cursor-pointer">
                      {t('newsletter')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" disabled={profileSaving} className="min-w-[120px]">
                      {profileSaving ? 'Saving…' : 'Save changes'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Member since {formatDate(profile.createdAt)}
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <div className="space-y-4">
              {/* Change password */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                    {pwError && (
                      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {pwError}
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        Password changed successfully
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPassword" className="text-sm font-medium">Current password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-sm font-medium">New password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        required
                        className="h-10"
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm new password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        required
                        className="h-10"
                      />
                    </div>
                    <Button type="submit" disabled={pwSaving} className="min-w-[140px]">
                      {pwSaving ? 'Changing…' : 'Change password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Account info */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Account ID</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{profile.id.slice(0, 12)}…</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Email</span>
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Member since</span>
                      <span>{formatDate(profile.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Newsletter</span>
                      <span className={profile.newsletter ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                        {profile.newsletter ? 'Subscribed' : 'Not subscribed'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/5 w-full sm:w-auto"
                      onClick={() => signOut({ callbackUrl: '/account/login' })}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out of all devices
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
