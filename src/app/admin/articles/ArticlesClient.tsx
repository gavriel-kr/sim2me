'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Globe, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon, Code, Heading2, Heading3 } from 'lucide-react';

type ArticleStatus = 'DRAFT' | 'PUBLISHED';

interface ArticleRow {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  focusKeyword: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
  canonicalUrl: string | null;
  articleOrder: number;
  status: ArticleStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BLANK: Omit<ArticleRow, 'id' | 'createdAt' | 'updatedAt'> = {
  slug: '', locale: 'en', title: '', excerpt: null,
  featuredImage: null, focusKeyword: null,
  metaTitle: null, metaDesc: null, ogTitle: null, ogDesc: null,
  canonicalUrl: null, articleOrder: 0, status: 'DRAFT',
};

const LOCALE_LABELS: Record<string, string> = { en: '🇬🇧 EN', he: '🇮🇱 HE', ar: '🇸🇦 AR' };

// ── Rich Text Editor ─────────────────────────────────────────────────────────
function RichTextEditor({ value, onChange, isRTL }: { value: string; onChange: (v: string) => void; isRTL: boolean }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSource, setIsSource] = useState(false);

  // Sync contentEditable → state
  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  // When switching from source mode back to visual, sync
  const syncFromSource = useCallback((html: string) => {
    if (editorRef.current) editorRef.current.innerHTML = html;
  }, []);

  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleInput();
  }, [handleInput]);

  const insertHTML = useCallback((html: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    handleInput();
  }, [handleInput]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  }, [exec]);

  const toolbarBtns = [
    { icon: <Bold className="h-4 w-4" />, title: 'Bold', action: () => exec('bold') },
    { icon: <Italic className="h-4 w-4" />, title: 'Italic', action: () => exec('italic') },
    { icon: <UnderlineIcon className="h-4 w-4" />, title: 'Underline', action: () => exec('underline') },
    { type: 'sep' },
    { icon: <Heading2 className="h-4 w-4" />, title: 'H2', action: () => exec('formatBlock', '<h2>') },
    { icon: <Heading3 className="h-4 w-4" />, title: 'H3', action: () => exec('formatBlock', '<h3>') },
    { type: 'sep' },
    { icon: <List className="h-4 w-4" />, title: 'Bullet list', action: () => exec('insertUnorderedList') },
    { icon: <ListOrdered className="h-4 w-4" />, title: 'Numbered list', action: () => exec('insertOrderedList') },
    { type: 'sep' },
    { icon: <LinkIcon className="h-4 w-4" />, title: 'Insert link', action: insertLink },
    { icon: <Code className="h-4 w-4" />, title: 'Inline code', action: () => insertHTML('<code>code</code>') },
    { type: 'sep' },
    { icon: <span className="text-xs font-bold">¶</span>, title: 'Paragraph', action: () => exec('formatBlock', '<p>') },
    { icon: <span className="text-xs font-semibold">—</span>, title: 'Horizontal rule', action: () => exec('insertHorizontalRule') },
  ] as const;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        {toolbarBtns.map((btn, i) =>
          'type' in btn ? (
            <div key={i} className="mx-1 h-5 w-px bg-gray-300" />
          ) : (
            <button
              key={i}
              type="button"
              title={btn.title}
              onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            >
              {btn.icon}
            </button>
          )
        )}
        <div className="ml-auto">
          <button
            type="button"
            title="Toggle HTML source"
            onMouseDown={(e) => {
              e.preventDefault();
              if (!isSource) {
                // entering source mode: show raw HTML
                setIsSource(true);
              } else {
                // leaving source mode: parse HTML back
                setIsSource(false);
                syncFromSource(value);
              }
            }}
            className={`rounded px-2 py-0.5 text-xs font-mono font-medium ${isSource ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            {'</>'}
          </button>
        </div>
      </div>

      {isSource ? (
        <textarea
          className="w-full p-3 font-mono text-xs text-gray-700 outline-none resize-y min-h-[420px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={isRTL ? 'rtl' : 'ltr'}
          spellCheck={false}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir={isRTL ? 'rtl' : 'ltr'}
          className="min-h-[420px] p-4 text-sm text-gray-800 outline-none prose prose-sm max-w-none focus:ring-0 overflow-auto"
          dangerouslySetInnerHTML={{ __html: value }}
          onInput={handleInput}
          onBlur={handleInput}
        />
      )}
    </div>
  );
}

export function ArticlesClient({ articles: initial }: { articles: ArticleRow[] }) {
  const [articles, setArticles] = useState<ArticleRow[]>(initial);
  const [editing, setEditing] = useState<string | null>(null); // id or 'new'
  const [form, setForm] = useState<Omit<ArticleRow, 'id' | 'createdAt' | 'updatedAt'> & { content?: string }>(BLANK);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'main' | 'seo' | 'content'>('main');
  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const startNew = () => {
    setForm({ ...BLANK });
    setContent('');
    setEditing('new');
    setTab('main');
  };

  const startEdit = (a: ArticleRow) => {
    setForm({
      slug: a.slug, locale: a.locale, title: a.title,
      excerpt: a.excerpt, featuredImage: a.featuredImage,
      focusKeyword: a.focusKeyword, metaTitle: a.metaTitle,
      metaDesc: a.metaDesc, ogTitle: a.ogTitle, ogDesc: a.ogDesc,
      canonicalUrl: a.canonicalUrl, articleOrder: a.articleOrder, status: a.status,
    });
    // Fetch full content
    fetch(`/api/admin/articles/${a.id}`)
      .then((r) => r.json())
      .then((d) => setContent(d.article?.content || ''));
    setEditing(a.id);
    setTab('main');
  };

  const save = useCallback(async () => {
    if (!form.title || !form.slug || !form.locale) {
      flash('err', 'Title, slug, and locale are required.');
      return;
    }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const url = isNew ? '/api/admin/articles' : `/api/admin/articles/${editing}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash('err', data.error || 'Save failed');
        return;
      }
      if (isNew) {
        setArticles((prev) => [data.article, ...prev]);
      } else {
        setArticles((prev) => prev.map((a) => (a.id === editing ? { ...a, ...data.article } : a)));
      }
      setEditing(null);
      flash('ok', isNew ? 'Article created.' : 'Article saved.');
    } catch {
      flash('err', 'Network error');
    } finally {
      setSaving(false);
    }
  }, [editing, form, content]);

  const deleteArticle = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      if (editing === id) setEditing(null);
      flash('ok', 'Article deleted.');
    } else {
      flash('err', 'Delete failed');
    }
  };

  const toggleStatus = async (a: ArticleRow) => {
    const newStatus: ArticleStatus = a.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const res = await fetch(`/api/admin/articles/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: newStatus } : x)));
    }
  };

  const displayed = articles
    .filter((a) => filterLocale === 'all' || a.locale === filterLocale)
    .filter((a) => filterStatus === 'all' || a.status === filterStatus)
    .filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.slug.includes(search.toLowerCase()) || (a.focusKeyword || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'az') return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

  return (
    <div className="mt-6">
      {/* Flash message */}
      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {editing ? (
        /* ── Editor ── */
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              {editing === 'new' ? 'New Article' : `Edit: ${form.title || '(untitled)'}`}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-gray-200 px-6">
            {(['main', 'content', 'seo'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {t === 'main' ? 'Main Info' : t === 'content' ? 'Content (HTML)' : 'SEO & Meta'}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {tab === 'main' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Title *</label>
                    <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" />
                  </div>
                  <div>
                    <label className={labelCls}>Slug * (URL-safe)</label>
                    <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="e.g. best-esim-for-travel" />
                  </div>
                  <div>
                    <label className={labelCls}>Language *</label>
                    <select className={inputCls} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}>
                      <option value="en">English (EN)</option>
                      <option value="he">Hebrew (HE)</option>
                      <option value="ar">Arabic (AR)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ArticleStatus })}>
                      <option value="DRAFT">Draft (noindex)</option>
                      <option value="PUBLISHED">Published (indexed)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Article Order</label>
                    <input type="number" className={inputCls} value={form.articleOrder} onChange={(e) => setForm({ ...form, articleOrder: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelCls}>Focus Keyword</label>
                    <input className={inputCls} value={form.focusKeyword || ''} onChange={(e) => setForm({ ...form, focusKeyword: e.target.value || null })} placeholder="e.g. best esim for travel" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Excerpt (shown in index/listing)</label>
                  <textarea className={inputCls} rows={3} value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value || null })} placeholder="Short summary for article index page…" />
                </div>
                <div>
                  <label className={labelCls}>Featured Image URL</label>
                  <input className={inputCls} value={form.featuredImage || ''} onChange={(e) => setForm({ ...form, featuredImage: e.target.value || null })} placeholder="https://…" />
                </div>
                <div>
                  <label className={labelCls}>Canonical URL (leave blank to auto-generate)</label>
                  <input className={inputCls} value={form.canonicalUrl || ''} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value || null })} placeholder="https://www.sim2me.net/articles/…" />
                </div>
              </>
            )}

            {tab === 'content' && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    Use the toolbar for visual editing, or press <code className="bg-gray-100 px-1 rounded text-xs">&lt;/&gt;</code> to edit raw HTML.
                    RTL (HE/AR) is applied automatically on the frontend.
                  </p>
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  isRTL={form.locale === 'ar' || form.locale === 'he'}
                />
              </div>
            )}

            {tab === 'seo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Meta Title (≤60 chars)</label>
                    <input className={inputCls} value={form.metaTitle || ''} maxLength={60} onChange={(e) => setForm({ ...form, metaTitle: e.target.value || null })} />
                    <p className="mt-1 text-xs text-gray-400">{(form.metaTitle || '').length}/60</p>
                  </div>
                  <div>
                    <label className={labelCls}>OG Title</label>
                    <input className={inputCls} value={form.ogTitle || ''} onChange={(e) => setForm({ ...form, ogTitle: e.target.value || null })} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Meta Description (≤155 chars)</label>
                  <textarea className={inputCls} rows={3} value={form.metaDesc || ''} maxLength={155} onChange={(e) => setForm({ ...form, metaDesc: e.target.value || null })} />
                  <p className="mt-1 text-xs text-gray-400">{(form.metaDesc || '').length}/155</p>
                </div>
                <div>
                  <label className={labelCls}>OG Description</label>
                  <textarea className={inputCls} rows={2} value={form.ogDesc || ''} onChange={(e) => setForm({ ...form, ogDesc: e.target.value || null })} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── List ── */
        <>
          {/* Filter toolbar */}
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder="Search title, slug, keyword…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button onClick={startNew} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shrink-0">
                <Plus className="h-4 w-4" /> New Article
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Language */}
              <div className="flex gap-1">
                {['all', 'en', 'he', 'ar'].map((loc) => (
                  <button key={loc} onClick={() => setFilterLocale(loc)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${filterLocale === loc ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    {loc === 'all' ? 'All langs' : LOCALE_LABELS[loc]}
                  </button>
                ))}
              </div>
              {/* Status */}
              <div className="flex gap-1">
                {[{ v: 'all', l: 'All status' }, { v: 'PUBLISHED', l: '✅ Live' }, { v: 'DRAFT', l: '🟡 Draft' }].map(({ v, l }) => (
                  <button key={v} onClick={() => setFilterStatus(v)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${filterStatus === v ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {/* Sort */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 focus:outline-none focus:border-emerald-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">Title A→Z</option>
                <option value="za">Title Z→A</option>
              </select>
              {/* Result count */}
              <span className="text-xs text-gray-400 ml-auto">{displayed.length} article{displayed.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {displayed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
              <Globe className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No articles yet. Click <strong>New Article</strong> to create one.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left w-8"></th>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Lang</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Slug</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Focus KW</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayed.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-300"><GripVertical className="h-4 w-4" /></td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{a.title}</td>
                      <td className="px-4 py-3 text-gray-500">{LOCALE_LABELS[a.locale] || a.locale}</td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell font-mono text-xs">{a.slug}</td>
                      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell text-xs">{a.focusKeyword || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleStatus(a)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${a.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {a.status === 'PUBLISHED' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {a.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(a)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteArticle(a.id, a.title)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
