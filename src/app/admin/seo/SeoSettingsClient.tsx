'use client';

import { useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Search, Globe, X, Check, AlertCircle,
  Settings, FileSearch, ChevronDown, ChevronUp, Save, RotateCcw,
} from 'lucide-react';
import type { GlobalSeoSettings } from '@/lib/global-seo';
import { GLOBAL_SEO_DEFAULTS } from '@/lib/global-seo';

// ── Shared field components ───────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

function CharCounter({ value, limit }: { value: string; limit: number }) {
  const len = value.length;
  const over = len > limit;
  const near = len > limit * 0.85;
  return (
    <span className={`text-xs tabular-nums ${over ? 'text-red-500 font-semibold' : near ? 'text-amber-500' : 'text-gray-400'}`}>
      {len}/{limit}
    </span>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Section({
  title, icon: Icon, defaultOpen = true, children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-5 space-y-4">{children}</div>}
    </div>
  );
}

// ── SERP Preview ──────────────────────────────────────────────────────────────

function SerpPreview({ title, description, domain }: { title: string; description: string; domain: string }) {
  const TITLE_LIMIT = 60;
  const DESC_LIMIT = 155;
  const displayPath = domain.replace(/^https?:\/\//, '');
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Google SERP Preview</p>
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-1 shadow-sm">
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold">G</span>
          {displayPath}
        </p>
        <p className={`text-base font-medium leading-snug text-blue-700 truncate ${title.length > TITLE_LIMIT ? 'text-red-600' : ''}`}>
          {title || 'Page Title will appear here'}
        </p>
        <p className="text-sm leading-relaxed text-gray-600">
          {(description || 'Meta description will appear here in Google search results.').slice(0, 160)}
          {description.length > 160 ? '…' : ''}
        </p>
      </div>
      {(title.length > TITLE_LIMIT || description.length > DESC_LIMIT) && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {title.length > TITLE_LIMIT ? `Title ${title.length - TITLE_LIMIT} chars over 60. ` : ''}
          {description.length > DESC_LIMIT ? `Description ${description.length - DESC_LIMIT} chars over 155.` : ''}
        </p>
      )}
    </div>
  );
}

// ── Global SEO Tab ────────────────────────────────────────────────────────────

function GlobalSeoTab({ initial }: { initial: GlobalSeoSettings }) {
  const [form, setForm] = useState<GlobalSeoSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof GlobalSeoSettings, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setForm(GLOBAL_SEO_DEFAULTS);

  return (
    <div className="space-y-4">
      {/* 1. Search Snippet */}
      <Section title="Search Snippet Defaults" icon={Search}>
        <Field label="Site Name" hint="Appears in title templates and rich results.">
          <input className={inputCls} value={form.siteName} onChange={(e) => set('siteName', e.target.value)} placeholder="Sim2Me" />
        </Field>
        <Field label="Title Template" hint='Use %s for the page title. Example: "%s | Sim2Me"'>
          <input className={inputCls} value={form.titleTemplate} onChange={(e) => set('titleTemplate', e.target.value)} placeholder="%s | Sim2Me" />
        </Field>
        <Field label="Default Title">
          <div className="flex items-center justify-between mb-1">
            <span />
            <CharCounter value={form.defaultTitle} limit={60} />
          </div>
          <input className={inputCls} value={form.defaultTitle} onChange={(e) => set('defaultTitle', e.target.value)} placeholder="Sim2Me – Buy eSIM Online for 200+ Countries" />
        </Field>
        <Field label="Default Meta Description">
          <div className="flex items-center justify-between mb-1">
            <span />
            <CharCounter value={form.defaultDescription} limit={155} />
          </div>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.defaultDescription} onChange={(e) => set('defaultDescription', e.target.value)} placeholder="Short summary of your site (ideal: 120–155 chars)." />
        </Field>
        <Field label="Default Keywords" hint="Comma-separated. Used as fallback meta keywords (minor ranking signal).">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.defaultKeywords} onChange={(e) => set('defaultKeywords', e.target.value)} placeholder="eSIM, buy eSIM, travel eSIM, ..." />
        </Field>
      </Section>

      {/* SERP Preview */}
      <SerpPreview
        title={form.defaultTitle}
        description={form.defaultDescription}
        domain={form.canonicalDomain}
      />

      {/* 2. Open Graph */}
      <Section title="Open Graph (Social Sharing)" icon={Globe}>
        <Field label="OG Title" hint="Social share title. If blank, falls back to Default Title.">
          <div className="flex items-center justify-between mb-1">
            <span />
            <CharCounter value={form.ogTitle} limit={60} />
          </div>
          <input className={inputCls} value={form.ogTitle} onChange={(e) => set('ogTitle', e.target.value)} placeholder="Sim2Me – Buy eSIM Online for 200+ Countries" />
        </Field>
        <Field label="OG Description">
          <div className="flex items-center justify-between mb-1">
            <span />
            <CharCounter value={form.ogDescription} limit={155} />
          </div>
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.ogDescription} onChange={(e) => set('ogDescription', e.target.value)} placeholder="Social share description." />
        </Field>
        <Field label="Default OG Image URL" hint="Recommended: 1200×630px absolute URL. Used when no page-specific image is set.">
          <input className={inputCls} value={form.ogImage} onChange={(e) => set('ogImage', e.target.value)} placeholder="https://www.sim2me.net/og-default.png" />
          {form.ogImage && (
            <img
              src={form.ogImage}
              alt="OG preview"
              className="mt-2 h-28 w-full rounded-lg object-cover border border-gray-200"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </Field>
      </Section>

      {/* 3. Twitter */}
      <Section title="Twitter / X Card" icon={Globe} defaultOpen={false}>
        <Field label="Card Type" hint='"summary_large_image" is recommended for best engagement.'>
          <select className={inputCls} value={form.twitterCard} onChange={(e) => set('twitterCard', e.target.value)}>
            <option value="summary_large_image">summary_large_image (Large image card)</option>
            <option value="summary">summary (Small thumbnail)</option>
          </select>
        </Field>
        <Field label="Twitter @Handle" hint="Your site's Twitter/X account handle. Include the @.">
          <input className={inputCls} value={form.twitterHandle} onChange={(e) => set('twitterHandle', e.target.value)} placeholder="@sim2me" />
        </Field>
      </Section>

      {/* 4. Canonical & Robots */}
      <Section title="Canonical Domain & Robots" icon={Settings}>
        <Field label="Canonical Domain" hint="The authoritative base URL of your site. Always use https:// with www if that's the preferred version.">
          <input className={inputCls} value={form.canonicalDomain} onChange={(e) => set('canonicalDomain', e.target.value)} placeholder="https://www.sim2me.net" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Index">
            <select className={inputCls} value={form.robotsIndex} onChange={(e) => set('robotsIndex', e.target.value)}>
              <option value="true">✅ index (Recommended)</option>
              <option value="false">🚫 noindex</option>
            </select>
          </Field>
          <Field label="Follow">
            <select className={inputCls} value={form.robotsFollow} onChange={(e) => set('robotsFollow', e.target.value)}>
              <option value="true">✅ follow (Recommended)</option>
              <option value="false">🚫 nofollow</option>
            </select>
          </Field>
        </div>
        <p className="text-xs font-semibold text-gray-500 mt-1">Googlebot Crawl Directives</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Max Snippet" hint="-1 = unlimited">
            <select className={inputCls} value={form.googleMaxSnippet} onChange={(e) => set('googleMaxSnippet', e.target.value)}>
              <option value="-1">-1 (Unlimited ✅)</option>
              <option value="0">0 (No snippet)</option>
              <option value="120">120</option>
              <option value="320">320</option>
            </select>
          </Field>
          <Field label="Max Image Preview" hint="large = full image">
            <select className={inputCls} value={form.googleMaxImagePreview} onChange={(e) => set('googleMaxImagePreview', e.target.value)}>
              <option value="large">large (Full ✅)</option>
              <option value="standard">standard</option>
              <option value="none">none</option>
            </select>
          </Field>
          <Field label="Max Video Preview" hint="-1 = unlimited">
            <select className={inputCls} value={form.googleMaxVideoPreview} onChange={(e) => set('googleMaxVideoPreview', e.target.value)}>
              <option value="-1">-1 (Unlimited ✅)</option>
              <option value="0">0 (No preview)</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* 5. Search Console Verification */}
      <Section title="Search Console Verification" icon={FileSearch} defaultOpen={false}>
        <p className="text-xs text-gray-500 -mt-1">
          Paste the content value from your verification meta tag (not the full tag). Leave blank if using file-based verification.
        </p>
        <Field label="Google Search Console" hint='From: <meta name="google-site-verification" content="PASTE_THIS" />'>
          <input className={inputCls} value={form.googleVerification} onChange={(e) => set('googleVerification', e.target.value)} placeholder="abc123XYZ..." />
        </Field>
        <Field label="Bing Webmaster Tools" hint='From: <meta name="msvalidate.01" content="PASTE_THIS" />'>
          <input className={inputCls} value={form.bingVerification} onChange={(e) => set('bingVerification', e.target.value)} placeholder="abc123XYZ..." />
        </Field>
        <Field label="Yandex Webmaster">
          <input className={inputCls} value={form.yandexVerification} onChange={(e) => set('yandexVerification', e.target.value)} placeholder="abc123XYZ..." />
        </Field>
      </Section>

      {/* 6. Organization Schema */}
      <Section title="Organization Schema (JSON-LD)" icon={Globe} defaultOpen={false}>
        <p className="text-xs text-gray-500 -mt-1">
          Powers Google's Knowledge Panel and rich results. Injected as structured data on every page.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organization Name">
            <input className={inputCls} value={form.orgName} onChange={(e) => set('orgName', e.target.value)} placeholder="Sim2Me" />
          </Field>
          <Field label="Organization URL">
            <input className={inputCls} value={form.orgUrl} onChange={(e) => set('orgUrl', e.target.value)} placeholder="https://www.sim2me.net" />
          </Field>
        </div>
        <Field label="Logo URL" hint="Absolute URL to your logo (recommended: 112×112px or larger, square).">
          <input className={inputCls} value={form.orgLogo} onChange={(e) => set('orgLogo', e.target.value)} placeholder="https://www.sim2me.net/logo.png" />
        </Field>
        <p className="text-xs font-semibold text-gray-500">Social Profiles</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Twitter / X URL">
            <input className={inputCls} value={form.orgTwitter} onChange={(e) => set('orgTwitter', e.target.value)} placeholder="https://twitter.com/sim2me" />
          </Field>
          <Field label="Facebook URL">
            <input className={inputCls} value={form.orgFacebook} onChange={(e) => set('orgFacebook', e.target.value)} placeholder="https://facebook.com/sim2me" />
          </Field>
          <Field label="LinkedIn URL">
            <input className={inputCls} value={form.orgLinkedIn} onChange={(e) => set('orgLinkedIn', e.target.value)} placeholder="https://linkedin.com/company/sim2me" />
          </Field>
        </div>

        {/* Live JSON-LD Preview */}
        <details className="mt-1">
          <summary className="cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-700">Preview JSON-LD output ↓</summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 text-[11px] text-green-400 leading-relaxed">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: form.orgName || 'Sim2Me',
              url: form.orgUrl || 'https://www.sim2me.net',
              ...(form.orgLogo && { logo: form.orgLogo }),
              sameAs: [form.orgTwitter, form.orgFacebook, form.orgLinkedIn].filter(Boolean),
            }, null, 2)}
          </pre>
        </details>
      </Section>

      {/* Actions */}
      {error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save All Settings'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

// ── Page Overrides Tab ────────────────────────────────────────────────────────

interface SeoSetting {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
}

const BLANK: Omit<SeoSetting, 'id'> = {
  path: '', title: null, description: null,
  ogTitle: null, ogDescription: null, ogImage: null, canonicalUrl: null,
};

const TITLE_LIMIT = 60;
const DESC_LIMIT = 155;

function OverrideCharCounter({ value, limit }: { value: string; limit: number }) {
  const len = value.length;
  const over = len > limit;
  const near = len > limit * 0.85;
  return (
    <span className={`text-xs tabular-nums ${over ? 'text-red-500 font-semibold' : near ? 'text-amber-500' : 'text-gray-400'}`}>
      {len}/{limit}
    </span>
  );
}

function OverrideSerpPreview({ title, description, path }: { title: string; description: string; path: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">SERP Preview</p>
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold">G</span>
        sim2me.net{path || '/path'}
      </p>
      <p className={`mt-0.5 text-base font-medium leading-snug text-blue-700 truncate ${(title || '').length > TITLE_LIMIT ? 'text-red-600' : ''}`}>
        {title || 'Page Title'}
      </p>
      <p className="text-sm leading-relaxed text-gray-600">
        {(description || 'Meta description will appear here.').slice(0, 160)}
        {(description || '').length > 160 ? '…' : ''}
      </p>
    </div>
  );
}

function OverrideForm({
  initial, isNew, onSave, onCancel,
}: {
  initial: Omit<SeoSetting, 'id'>;
  isNew: boolean;
  onSave: (data: Omit<SeoSetting, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setErr(null);
    if (!form.path.trim()) { setErr('Path is required'); return; }
    if (!form.path.startsWith('/')) { setErr('Path must start with /'); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (e: unknown) { setErr((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>URL Path <span className="text-red-500">*</span></label>
        <input className={inputCls} placeholder="/en/about" value={form.path} onChange={(e) => set('path', e.target.value)} disabled={!isNew} />
        <p className="mt-1 text-xs text-gray-400">Full locale-prefixed path · <code className="font-mono">/en/about</code> · <code className="font-mono">/he/contact</code></p>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-xs font-semibold text-gray-500">Search Snippet</legend>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>Title</label>
            <OverrideCharCounter value={form.title || ''} limit={TITLE_LIMIT} />
          </div>
          <input className={inputCls} placeholder="Page Title (≤60 chars)" value={form.title || ''} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>Description</label>
            <OverrideCharCounter value={form.description || ''} limit={DESC_LIMIT} />
          </div>
          <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Meta description (≤155 chars)" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
        </div>
      </fieldset>

      <OverrideSerpPreview title={form.title || ''} description={form.description || ''} path={form.path} />

      <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-xs font-semibold text-gray-500">Open Graph</legend>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>OG Title</label>
            <OverrideCharCounter value={form.ogTitle || ''} limit={TITLE_LIMIT} />
          </div>
          <input className={inputCls} value={form.ogTitle || ''} onChange={(e) => set('ogTitle', e.target.value)} placeholder="Social share title" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>OG Description</label>
            <OverrideCharCounter value={form.ogDescription || ''} limit={DESC_LIMIT} />
          </div>
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.ogDescription || ''} onChange={(e) => set('ogDescription', e.target.value)} placeholder="Social share description" />
        </div>
        <div>
          <label className={labelCls}>OG Image URL</label>
          <input className={inputCls} value={form.ogImage || ''} onChange={(e) => set('ogImage', e.target.value)} placeholder="https://www.sim2me.net/og-image.png" />
          {form.ogImage && (
            <img src={form.ogImage} alt="OG" className="mt-2 h-20 w-full rounded-lg object-cover border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>
      </fieldset>

      <div>
        <label className={labelCls}>Canonical URL</label>
        <input className={inputCls} placeholder="https://www.sim2me.net/en/about (blank = current URL)" value={form.canonicalUrl || ''} onChange={(e) => set('canonicalUrl', e.target.value)} />
      </div>

      {err && (
        <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />{err}
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
          <Check className="h-4 w-4" />
          {saving ? 'Saving…' : isNew ? 'Create' : 'Save Changes'}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function PageOverridesTab({ initial }: { initial: SeoSetting[] }) {
  const [settings, setSettings] = useState<SeoSetting[]>(initial);
  const [editing, setEditing] = useState<SeoSetting | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = settings.filter((s) =>
    s.path.toLowerCase().includes(search.toLowerCase()) ||
    (s.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = useCallback(async (data: Omit<SeoSetting, 'id'>) => {
    const res = await fetch('/api/admin/seo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Create failed');
    setSettings((prev) => [...prev, json.setting].sort((a, b) => a.path.localeCompare(b.path)));
    setCreating(false);
  }, []);

  const handleUpdate = useCallback(async (data: Omit<SeoSetting, 'id'>) => {
    if (!editing) return;
    const res = await fetch(`/api/admin/seo/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Update failed');
    setSettings((prev) => prev.map((s) => (s.id === editing.id ? json.setting : s)));
    setEditing(null);
  }, [editing]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    const res = await fetch(`/api/admin/seo/${id}`, { method: 'DELETE' });
    if (res.ok) { setSettings((prev) => prev.filter((s) => s.id !== id)); setDeleteId(null); if (editing?.id === id) setEditing(null); }
    setDeleting(false);
  }, [editing]);

  const activePanel = creating ? 'create' : editing ? 'edit' : null;

  return (
    <div>
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Globe className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Override SEO for specific URL paths. OG and canonical fields override globally.
          Page-level title/description may take precedence for pages with their own metadata.
          Use locale-prefixed paths: <code className="font-mono text-xs">/en/about</code>, <code className="font-mono text-xs">/he/contact</code>.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Filter by path or title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setCreating(true); setEditing(null); }} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
          <Plus className="h-4 w-4" />Add Override
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
              {settings.length === 0 ? 'No overrides yet. Click "Add Override" to create one.' : 'No results.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div key={s.id} onClick={() => { setEditing(s); setCreating(false); }} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50 ${editing?.id === s.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 font-mono">{s.path}</p>
                    <p className="truncate text-xs text-gray-500">{s.title || <span className="italic">no title override</span>}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {s.ogImage && <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">OG</span>}
                    {s.canonicalUrl && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">CAN</span>}
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }} className="ml-1 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activePanel && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{creating ? 'New Override' : `Edit: ${editing?.path}`}</h3>
              <button onClick={() => { setCreating(false); setEditing(null); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <OverrideForm key={creating ? 'new' : editing?.id} initial={creating ? BLANK : (editing as Omit<SeoSetting, 'id'>)} isNew={creating} onSave={creating ? handleCreate : handleUpdate} onCancel={() => { setCreating(false); setEditing(null); }} />
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-900">Delete this override?</h3>
            <p className="mt-1 text-sm text-gray-500">Path: <code className="font-mono text-xs">{settings.find((s) => s.id === deleteId)?.path}</code>. The page will revert to default metadata.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => handleDelete(deleteId)} disabled={deleting} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">{deleting ? 'Deleting…' : 'Delete'}</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export function SeoSettingsClient({
  globalSettings,
  overrides,
}: {
  globalSettings: GlobalSeoSettings;
  overrides: SeoSetting[];
}) {
  const [tab, setTab] = useState<'global' | 'overrides'>('global');

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global metadata defaults applied site-wide, plus per-path overrides for specific pages
        </p>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        <button
          onClick={() => setTab('global')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === 'global' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings className="h-4 w-4" />
          Global SEO
        </button>
        <button
          onClick={() => setTab('overrides')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === 'overrides' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FileSearch className="h-4 w-4" />
          Page Overrides
          {overrides.length > 0 && (
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              {overrides.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'global' ? (
        <GlobalSeoTab initial={globalSettings} />
      ) : (
        <PageOverridesTab initial={overrides} />
      )}
    </div>
  );
}
