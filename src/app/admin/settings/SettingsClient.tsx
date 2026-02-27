'use client';

import { useState, useRef } from 'react';
import { Save, Upload } from 'lucide-react';

const settingFields = [
  { key: 'site_name', label: 'Site Name', placeholder: 'Sim2Me' },
  { key: 'tagline', label: 'Tagline', placeholder: 'Stay connected worldwide' },
  { key: 'support_email', label: 'Support Email', placeholder: 'support@sim2me.net' },
  { key: 'support_phone', label: 'Support Phone', placeholder: '+972...' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', placeholder: '972501234567' },
  { key: 'twitter_url', label: 'Twitter URL', placeholder: 'https://twitter.com/sim2me' },
  { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/sim2me' },
  { key: 'facebook_url', label: 'Facebook URL', placeholder: 'https://facebook.com/sim2me' },
  { key: 'google_analytics_id', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX' },
  { key: 'price_markup_percent', label: 'Price Markup (%)', placeholder: '30' },
];

const LOGO_RECOMMENDED = 'Recommended: width up to 400px, height up to 120px (or SVG). Formats: SVG, PNG, JPG, WebP.';
const FAVICON_RECOMMENDED = 'Recommended: 32×32 px or 48×48 px. Formats: ICO, PNG, or SVG.';

interface Props {
  initialSettings: Record<string, string>;
}

export function SettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.set('type', 'logo');
      form.set('file', file);
      const res = await fetch('/api/admin/settings/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const { url } = await res.json();
      setSettings((s) => ({ ...s, logo_url: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const form = new FormData();
      form.set('type', 'favicon');
      form.set('file', file);
      const res = await fetch('/api/admin/settings/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const { url } = await res.json();
      setSettings((s) => ({ ...s, favicon_url: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
      e.target.value = '';
    }
  }

  const logoUrl = settings.logo_url || '';
  const faviconUrl = settings.favicon_url || '';

  return (
    <div className="mt-6 max-w-2xl space-y-8">
      {/* Logo & Favicon */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-6">
        <h2 className="text-sm font-semibold text-gray-900">Logo & Favicon</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Logo</label>
          <p className="mt-0.5 text-xs text-gray-500">{LOGO_RECOMMENDED}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              ref={logoInputRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploadingLogo ? 'Uploading...' : 'Upload / Update'}
            </button>
            {logoUrl && (
              <div className="h-10 flex items-center border border-gray-200 rounded-lg bg-white px-2 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo preview" className="max-h-8 max-w-[200px] object-contain" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Favicon</label>
          <p className="mt-0.5 text-xs text-gray-500">{FAVICON_RECOMMENDED}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              ref={faviconInputRef}
              type="file"
              accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml"
              onChange={handleFaviconUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => faviconInputRef.current?.click()}
              disabled={uploadingFavicon}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploadingFavicon ? 'Uploading...' : 'Upload / Update'}
            </button>
            {faviconUrl && (
              <div className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faviconUrl} alt="Favicon preview" className="w-8 h-8 object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {settingFields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <input
              value={settings[key] || ''}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
              placeholder={placeholder}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
