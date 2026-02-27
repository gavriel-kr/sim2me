'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

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

interface Props {
  initialSettings: Record<string, string>;
}

export function SettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="mt-6 max-w-2xl">
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
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
