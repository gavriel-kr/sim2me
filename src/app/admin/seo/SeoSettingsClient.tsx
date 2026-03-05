'use client';

import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Globe, X, Check, AlertCircle } from 'lucide-react';

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
  path: '',
  title: null,
  description: null,
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  canonicalUrl: null,
};

const TITLE_LIMIT = 60;
const DESC_LIMIT = 155;

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

function SerpPreview({ title, description, path }: { title: string; description: string; path: string }) {
  const displayTitle = title || 'Page Title';
  const displayDesc = description || 'Meta description will appear here…';
  const displayPath = path ? `sim2me.net${path}` : 'sim2me.net/path';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 font-sans">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">SERP Preview</p>
      <div className="space-y-0.5">
        <p className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px]">G</span>
          {displayPath}
        </p>
        <p className={`text-lg font-medium leading-snug text-blue-700 hover:underline cursor-pointer truncate ${displayTitle.length > TITLE_LIMIT ? 'text-red-600' : ''}`}>
          {displayTitle.slice(0, 70)}{displayTitle.length > 70 ? '…' : ''}
        </p>
        <p className="text-sm leading-relaxed text-gray-600">
          {displayDesc.slice(0, 160)}{displayDesc.length > 160 ? '…' : ''}
        </p>
      </div>
      {(displayTitle.length > TITLE_LIMIT || displayDesc.length > DESC_LIMIT) && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          {displayTitle.length > TITLE_LIMIT ? `Title is ${displayTitle.length - TITLE_LIMIT} chars over limit. ` : ''}
          {displayDesc.length > DESC_LIMIT ? `Description is ${displayDesc.length - DESC_LIMIT} chars over limit.` : ''}
        </p>
      )}
    </div>
  );
}

interface FormState extends Omit<SeoSetting, 'id'> {}

function SeoForm({
  initial,
  isNew,
  onSave,
  onCancel,
}: {
  initial: FormState;
  isNew: boolean;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.path.trim()) { setError('Path is required'); return; }
    if (!form.path.startsWith('/')) { setError('Path must start with /'); return; }
    setSaving(true);
    try {
      await onSave(form);
    } catch (e: unknown) {
      setError((e as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="space-y-5">
      {/* Path */}
      <div>
        <label className={labelCls}>
          URL Path <span className="text-red-500">*</span>
        </label>
        <input
          className={inputCls}
          placeholder="/en/about"
          value={form.path}
          onChange={(e) => set('path', e.target.value)}
          disabled={!isNew}
        />
        <p className="mt-1 text-xs text-gray-400">
          Full locale-prefixed path · e.g. <code className="font-mono">/en/about</code> · <code className="font-mono">/he/contact</code>
        </p>
      </div>

      {/* Search snippet */}
      <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-xs font-semibold text-gray-500">Search Snippet</legend>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>Title</label>
            <CharCounter value={form.title || ''} limit={TITLE_LIMIT} />
          </div>
          <input
            className={inputCls}
            placeholder="Page Title – Site Name (ideal ≤60 chars)"
            value={form.title || ''}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>Description</label>
            <CharCounter value={form.description || ''} limit={DESC_LIMIT} />
          </div>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Meta description that appears in Google results (ideal ≤155 chars)"
            value={form.description || ''}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
      </fieldset>

      {/* SERP Preview */}
      <SerpPreview
        title={form.title || ''}
        description={form.description || ''}
        path={form.path}
      />

      {/* Open Graph */}
      <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-xs font-semibold text-gray-500">Open Graph (Social Sharing)</legend>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>OG Title</label>
            <CharCounter value={form.ogTitle || ''} limit={TITLE_LIMIT} />
          </div>
          <input
            className={inputCls}
            placeholder="Social share title (defaults to Title if blank)"
            value={form.ogTitle || ''}
            onChange={(e) => set('ogTitle', e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>OG Description</label>
            <CharCounter value={form.ogDescription || ''} limit={DESC_LIMIT} />
          </div>
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            placeholder="Social share description"
            value={form.ogDescription || ''}
            onChange={(e) => set('ogDescription', e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>OG Image URL</label>
          <input
            className={inputCls}
            placeholder="https://www.sim2me.net/og-image.png (1200×630 recommended)"
            value={form.ogImage || ''}
            onChange={(e) => set('ogImage', e.target.value)}
          />
          {form.ogImage && (
            <img
              src={form.ogImage}
              alt="OG preview"
              className="mt-2 h-24 w-full rounded-lg object-cover border border-gray-200"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      </fieldset>

      {/* Canonical */}
      <div>
        <label className={labelCls}>Canonical URL</label>
        <input
          className={inputCls}
          placeholder="https://www.sim2me.net/en/about (leave blank = current URL)"
          value={form.canonicalUrl || ''}
          onChange={(e) => set('canonicalUrl', e.target.value)}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Saving…' : isNew ? 'Create' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function SeoSettingsClient({ initial }: { initial: SeoSetting[] }) {
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
    const res = await fetch('/api/admin/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Create failed');
    setSettings((prev) => [...prev, json.setting].sort((a, b) => a.path.localeCompare(b.path)));
    setCreating(false);
  }, []);

  const handleUpdate = useCallback(async (data: Omit<SeoSetting, 'id'>) => {
    if (!editing) return;
    const res = await fetch(`/api/admin/seo/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Update failed');
    setSettings((prev) => prev.map((s) => (s.id === editing.id ? json.setting : s)));
    setEditing(null);
  }, [editing]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    const res = await fetch(`/api/admin/seo/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSettings((prev) => prev.filter((s) => s.id !== id));
      setDeleteId(null);
      if (editing?.id === id) setEditing(null);
    }
    setDeleting(false);
  }, [editing]);

  const activePanel = creating
    ? 'create'
    : editing
    ? 'edit'
    : null;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Path-based overrides for meta tags, Open Graph, and canonical URLs
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Override
        </button>
      </div>

      {/* Info banner */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Globe className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Overrides apply globally via the root layout. For pages with their own metadata (e.g. articles),
          Open Graph and canonical fields will be overridden; page-level title/description may take precedence.
          Use full locale-prefixed paths: <code className="font-mono text-xs">/en/about</code>, <code className="font-mono text-xs">/he/contact</code>.
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left: list */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Filter by path or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
              {settings.length === 0 ? 'No overrides yet. Click "Add Override" to create one.' : 'No results for this search.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { setEditing(s); setCreating(false); }}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50 ${
                    editing?.id === s.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 font-mono">{s.path}</p>
                    <p className="truncate text-xs text-gray-500">{s.title || <span className="italic">no title override</span>}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {s.ogImage && (
                      <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">OG IMG</span>
                    )}
                    {s.canonicalUrl && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">CANONICAL</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}
                      className="ml-1 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: form panel */}
        {activePanel && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">
                {creating ? 'New Override' : `Edit: ${editing?.path}`}
              </h2>
              <button
                onClick={() => { setCreating(false); setEditing(null); }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SeoForm
              key={creating ? 'new' : editing?.id}
              initial={creating ? BLANK : (editing as FormState)}
              isNew={creating}
              onSave={creating ? handleCreate : handleUpdate}
              onCancel={() => { setCreating(false); setEditing(null); }}
            />
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-900">Delete this override?</h3>
            <p className="mt-1 text-sm text-gray-500">
              This will remove the SEO override for{' '}
              <code className="font-mono text-xs text-gray-700">
                {settings.find((s) => s.id === deleteId)?.path}
              </code>
              . The page will fall back to its default metadata.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
