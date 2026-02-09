'use client';

import { useState } from 'react';
import { Save, Globe, Search as SearchIcon } from 'lucide-react';

interface PageData {
  id: string;
  slug: string;
  titleEn: string;
  titleHe: string;
  titleAr: string;
  contentEn: string;
  contentHe: string;
  contentAr: string;
  published: boolean;
  seo: {
    metaTitleEn: string;
    metaTitleHe: string;
    metaTitleAr: string;
    metaDescEn: string;
    metaDescHe: string;
    metaDescAr: string;
    ogImage: string;
    keywords: string;
  } | null;
}

interface Props {
  pages: PageData[];
}

export function PagesClient({ pages: initialPages }: Props) {
  const [pages, setPages] = useState(initialPages);
  const [editing, setEditing] = useState<string | null>(null);
  const [tab, setTab] = useState<'en' | 'he' | 'ar'>('en');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState<PageData | null>(null);

  async function syncTranslations() {
    if (!confirm('This will load the existing website content into all CMS pages. Continue?')) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/pages/sync', { method: 'POST' });
      if (res.ok) {
        // Reload the page to get fresh data
        window.location.reload();
      } else {
        alert('Sync failed');
      }
    } catch {
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  function startEdit(page: PageData) {
    setEditing(page.id);
    setForm({ ...page });
    setTab('en');
  }

  async function savePage() {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setPages(pages.map((p) => p.id === form.id ? data.page : p));
        setEditing(null);
        setForm(null);
      }
    } catch {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (editing && form) {
    const langSuffix = tab.charAt(0).toUpperCase() + tab.slice(1);
    const titleKey = `title${langSuffix}` as keyof PageData;
    const contentKey = `content${langSuffix}` as keyof PageData;

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Editing: /{form.slug}</h2>
          <button onClick={() => { setEditing(null); setForm(null); }} className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </div>

        {/* Language tabs */}
        <div className="mt-4 flex gap-1 rounded-xl bg-gray-100 p-1">
          {(['en', 'he', 'ar'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setTab(lang)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === lang ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'he' ? 'Hebrew' : 'Arabic'}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Page Title</label>
            <input
              value={form[titleKey] as string}
              onChange={(e) => setForm({ ...form, [titleKey]: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Page Content</label>
            <textarea
              rows={10}
              value={form[contentKey] as string}
              onChange={(e) => setForm({ ...form, [contentKey]: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none resize-y"
            />
          </div>

          {/* SEO section */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <SearchIcon className="h-4 w-4" /> SEO Settings ({tab.toUpperCase()})
            </h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Meta Title</label>
                <input
                  value={(form.seo as Record<string, string>)?.[`metaTitle${langSuffix}`] || ''}
                  onChange={(e) => setForm({
                    ...form,
                    seo: { ...form.seo!, [`metaTitle${langSuffix}`]: e.target.value },
                  })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Meta Description</label>
                <textarea
                  rows={2}
                  value={(form.seo as Record<string, string>)?.[`metaDesc${langSuffix}`] || ''}
                  onChange={(e) => setForm({
                    ...form,
                    seo: { ...form.seo!, [`metaDesc${langSuffix}`]: e.target.value },
                  })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Keywords (comma separated)</label>
                <input
                  value={form.seo?.keywords || ''}
                  onChange={(e) => setForm({ ...form, seo: { ...form.seo!, keywords: e.target.value } })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={savePage}
          disabled={saving}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {/* Sync button */}
      <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3">
        <div>
          <p className="text-sm font-medium text-blue-900">Load existing website content</p>
          <p className="text-xs text-blue-600">Import content from translation files into all CMS pages</p>
        </div>
        <button
          onClick={syncTranslations}
          disabled={syncing}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {pages.length === 0 ? (
        <p className="text-sm text-gray-500">No pages yet. Click &quot;Sync Now&quot; above to import content.</p>
      ) : (
        pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => startEdit(page)}
          >
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">/{page.slug}</p>
                <p className="text-xs text-gray-500">{page.titleEn || 'No title set'}</p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              page.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {page.published ? 'Published' : 'Draft'}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
