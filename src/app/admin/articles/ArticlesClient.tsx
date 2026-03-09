'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Globe, Upload, Wand2, AlertCircle, Loader2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

type ArticleStatus = 'DRAFT' | 'PUBLISHED';

interface ArticleRow {
  id: string;
  slug: string;
  titleEn: string;
  titleHe: string;
  titleAr: string;
  contentEn?: string;
  contentHe?: string;
  contentAr?: string;
  excerptEn: string | null;
  excerptHe: string | null;
  excerptAr: string | null;
  focusKeywordEn: string | null;
  focusKeywordHe: string | null;
  focusKeywordAr: string | null;
  metaTitleEn: string | null;
  metaTitleHe: string | null;
  metaTitleAr: string | null;
  metaDescEn: string | null;
  metaDescHe: string | null;
  metaDescAr: string | null;
  ogTitleEn: string | null;
  ogTitleHe: string | null;
  ogTitleAr: string | null;
  ogDescEn: string | null;
  ogDescHe: string | null;
  ogDescAr: string | null;
  canonicalUrlEn: string | null;
  canonicalUrlHe: string | null;
  canonicalUrlAr: string | null;
  statusEn: ArticleStatus;
  statusHe: ArticleStatus;
  statusAr: ArticleStatus;
  featuredImage: string | null;
  articleOrder: number;
  showRelatedArticles: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ArticleForm = Omit<ArticleRow, 'id' | 'createdAt' | 'updatedAt'>;

const BLANK: ArticleForm = {
  slug: '',
  titleEn: '', titleHe: '', titleAr: '',
  contentEn: '', contentHe: '', contentAr: '',
  excerptEn: null, excerptHe: null, excerptAr: null,
  focusKeywordEn: null, focusKeywordHe: null, focusKeywordAr: null,
  metaTitleEn: null, metaTitleHe: null, metaTitleAr: null,
  metaDescEn: null, metaDescHe: null, metaDescAr: null,
  ogTitleEn: null, ogTitleHe: null, ogTitleAr: null,
  ogDescEn: null, ogDescHe: null, ogDescAr: null,
  canonicalUrlEn: null, canonicalUrlHe: null, canonicalUrlAr: null,
  statusEn: 'DRAFT', statusHe: 'DRAFT', statusAr: 'DRAFT',
  featuredImage: null, articleOrder: 0, showRelatedArticles: true,
};

const LOCALES = ['en', 'he', 'ar'] as const;
type Locale = (typeof LOCALES)[number];
const LOCALE_LABELS: Record<string, string> = { en: '🇬🇧 EN', he: '🇮🇱 HE', ar: '🇸🇦 AR' };

const SITE_URL = 'https://www.sim2me.net';

// ── SEO helpers ───────────────────────────────────────────────────────────────

/**
 * Extract destination from title/slug and build the standard focus keyword:
 *   HE "איסים למאוריטניה"  → "eSIM למאוריטניה"
 *   AR "eSIM لموريتانيا"   → "eSIM لموريتانيا"
 *   EN / slug              → "eSIM for Mauritania"
 */
function generateFocusKeyword(title: string, slug: string, locale: string): string | null {
  if (locale === 'he') {
    const match = title.match(/ל(\S{2,}(?:\s+\S+)*)$/u);
    if (match) return `eSIM ל${match[1].trim()}`;
    const cleaned = title.replace(/^(איסים|esim)\s*/iu, '').trim();
    if (cleaned) return `eSIM ${cleaned}`;
  }
  if (locale === 'ar') {
    const match = title.match(/ل[ـ]?(\S{2,}(?:\s+\S+)*)$/u);
    if (match) return `eSIM لـ${match[1].trim()}`;
    const cleaned = title.replace(/^(esim|إيسيم)\s*/iu, '').trim();
    if (cleaned) return `eSIM ${cleaned}`;
  }
  // English / fallback from slug
  const destFromSlug = slug
    .replace(/^esim[-_](for[-_])?/i, '')
    .replace(/[-_](esim|sim|card|plan|data|travel|guide|prepaid).*$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
  if (destFromSlug && destFromSlug.length > 2) {
    return `eSIM for ${destFromSlug.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
  }
  return null;
}

function articleUrl(slug: string, locale: string) {
  return `${SITE_URL}/${locale}/articles/${slug}`;
}

function getDisplayTitle(a: ArticleRow): string {
  return a.titleEn || a.titleHe || a.titleAr || a.slug;
}

// ── Article SERP Preview ──────────────────────────────────────────────────────

function ArticleSerpPreview({ title, description, slug, locale }: {
  title: string; description: string; slug: string; locale: string;
}) {
  const TITLE_LIMIT = 60;
  const DESC_LIMIT = 155;
  const url = articleUrl(slug, locale).replace(/^https?:\/\//, '');
  const titleOver = title.length > TITLE_LIMIT;
  const descOver = description.length > DESC_LIMIT;
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">SERP Preview</p>
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-1 shadow-sm">
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold">G</span>
          {url}
        </p>
        <p className={`text-base font-medium leading-snug truncate ${titleOver ? 'text-red-600' : 'text-blue-700'}`}>
          {title || 'Meta title will appear here'}
        </p>
        <p className="text-sm leading-relaxed text-gray-600">
          {(description || 'Meta description will appear here.').slice(0, 160)}
          {description.length > 160 ? '…' : ''}
        </p>
      </div>
      {(titleOver || descOver) && (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {titleOver ? `Title ${title.length - TITLE_LIMIT} chars over 60. ` : ''}
          {descOver ? `Description ${description.length - DESC_LIMIT} chars over 155.` : ''}
        </p>
      )}
    </div>
  );
}

// ── Featured Image Field ──────────────────────────────────────────────────────
function FeaturedImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isBgColor = value.startsWith('bg:');
  const bgColor = isBgColor ? value.slice(3) : '';

  return (
    <div>
      <label className={labelCls}>Featured Image</label>
      <p className="mb-2 text-[11px] text-gray-400">
        Recommended: <strong>1200 × 630 px</strong> (16:9) · JPG/PNG/WebP · max 500 KB.
        Leave empty to use a placeholder card.
      </p>

      {!isBgColor && (
        <div className="flex gap-2 mb-2">
          <input
            className={inputCls}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or upload below"
          />
          <button
            type="button"
            title="Upload from computer"
            onClick={() => fileRef.current?.click()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
        </div>
      )}

      {value && !isBgColor && (
        <div className="mb-2 h-24 w-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
          <input
            type="checkbox"
            checked={isBgColor}
            onChange={(e) => {
              if (e.target.checked) onChange('bg:#059669');
              else onChange('');
            }}
            className="rounded border-gray-300"
          />
          Use background color instead of image
        </label>
        {isBgColor && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor || '#059669'}
              onChange={(e) => onChange(`bg:${e.target.value}`)}
              className="h-7 w-10 cursor-pointer rounded border border-gray-200 p-0.5"
              title="Card background color"
            />
            <span className="text-xs text-gray-500">Card background color</span>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

type DefaultImageState = { url: string; alt: string } | null;

export function ArticlesClient({
  articles: initial,
  initialDefaultImage,
}: {
  articles: ArticleRow[];
  initialDefaultImage?: DefaultImageState;
}) {
  const [articles, setArticles] = useState<ArticleRow[]>(initial);
  const [defaultImage, setDefaultImage] = useState<DefaultImageState>(initialDefaultImage ?? null);
  const [defaultImageDraft, setDefaultImageDraft] = useState({ url: initialDefaultImage?.url ?? '', alt: initialDefaultImage?.alt ?? '' });
  const [savingDefault, setSavingDefault] = useState(false);
  const defaultImageFileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(BLANK);
  const [contentEn, setContentEn] = useState('');
  const [contentHe, setContentHe] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [saving, setSaving] = useState(false);
  const [localeTab, setLocaleTab] = useState<Locale>('en');
  const [sectionTab, setSectionTab] = useState<'main' | 'content' | 'seo'>('main');
  const [filterLocales, setFilterLocales] = useState<Set<string>>(() => new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [bulkFilling, setBulkFilling] = useState(false);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const bulkFillKeywords = async (overwrite = false) => {
    if (!confirm(overwrite
      ? 'This will overwrite ALL focus keywords with auto-generated values. Continue?'
      : 'Auto-fill focus keywords for articles that have none. Continue?'
    )) return;
    setBulkFilling(true);
    try {
      const res = await fetch('/api/admin/articles/bulk-fill-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite }),
      });
      const data = await res.json();
      if (!res.ok) { flash('err', data.error || 'Bulk fill failed'); return; }
      if (data.details?.length > 0) {
        const byId = new Map<string, { focusKeywordEn?: string; focusKeywordHe?: string; focusKeywordAr?: string }>();
        for (const d of data.details as { id: string; locale: string; keyword: string }[]) {
          const key = `focusKeyword${d.locale.charAt(0).toUpperCase() + d.locale.slice(1)}` as 'focusKeywordEn' | 'focusKeywordHe' | 'focusKeywordAr';
          const cur = byId.get(d.id) ?? {};
          cur[key] = d.keyword;
          byId.set(d.id, cur);
        }
        setArticles((prev) => prev.map((a) => {
          const upd = byId.get(a.id);
          return upd ? { ...a, ...upd } : a;
        }));
      }
      flash('ok', `✅ ${data.updated} articles updated, ${data.skipped} skipped.`);
    } catch {
      flash('err', 'Network error');
    } finally {
      setBulkFilling(false);
    }
  };

  const startNew = () => {
    setForm({ ...BLANK });
    setContentEn('');
    setContentHe('');
    setContentAr('');
    setEditing('new');
    setLocaleTab('en');
    setSectionTab('main');
  };

  const startEdit = (a: ArticleRow) => {
    setLocaleTab('en');
    setSectionTab('main');
    setForm({
      slug: a.slug,
      titleEn: a.titleEn ?? '', titleHe: a.titleHe ?? '', titleAr: a.titleAr ?? '',
      contentEn: a.contentEn ?? '', contentHe: a.contentHe ?? '', contentAr: a.contentAr ?? '',
      excerptEn: a.excerptEn, excerptHe: a.excerptHe, excerptAr: a.excerptAr,
      focusKeywordEn: a.focusKeywordEn, focusKeywordHe: a.focusKeywordHe, focusKeywordAr: a.focusKeywordAr,
      metaTitleEn: a.metaTitleEn, metaTitleHe: a.metaTitleHe, metaTitleAr: a.metaTitleAr,
      metaDescEn: a.metaDescEn, metaDescHe: a.metaDescHe, metaDescAr: a.metaDescAr,
      ogTitleEn: a.ogTitleEn, ogTitleHe: a.ogTitleHe, ogTitleAr: a.ogTitleAr,
      ogDescEn: a.ogDescEn, ogDescHe: a.ogDescHe, ogDescAr: a.ogDescAr,
      canonicalUrlEn: a.canonicalUrlEn, canonicalUrlHe: a.canonicalUrlHe, canonicalUrlAr: a.canonicalUrlAr,
      statusEn: a.statusEn ?? 'DRAFT', statusHe: a.statusHe ?? 'DRAFT', statusAr: a.statusAr ?? 'DRAFT',
      featuredImage: a.featuredImage, articleOrder: a.articleOrder, showRelatedArticles: a.showRelatedArticles !== false,
    });
    setContentEn(a.contentEn ?? '');
    setContentHe(a.contentHe ?? '');
    setContentAr(a.contentAr ?? '');
    setEditing(a.id);
    fetch(`/api/admin/articles/${a.id}`)
      .then((r) => r.json())
      .then((d) => {
        const art = d.article;
        if (!art) return;
        setForm({
          slug: art.slug,
          titleEn: art.titleEn ?? '', titleHe: art.titleHe ?? '', titleAr: art.titleAr ?? '',
          contentEn: art.contentEn ?? '', contentHe: art.contentHe ?? '', contentAr: art.contentAr ?? '',
          excerptEn: art.excerptEn, excerptHe: art.excerptHe, excerptAr: art.excerptAr,
          focusKeywordEn: art.focusKeywordEn, focusKeywordHe: art.focusKeywordHe, focusKeywordAr: art.focusKeywordAr,
          metaTitleEn: art.metaTitleEn, metaTitleHe: art.metaTitleHe, metaTitleAr: art.metaTitleAr,
          metaDescEn: art.metaDescEn, metaDescHe: art.metaDescHe, metaDescAr: art.metaDescAr,
          ogTitleEn: art.ogTitleEn, ogTitleHe: art.ogTitleHe, ogTitleAr: art.ogTitleAr,
          ogDescEn: art.ogDescEn, ogDescHe: art.ogDescHe, ogDescAr: art.ogDescAr,
          canonicalUrlEn: art.canonicalUrlEn, canonicalUrlHe: art.canonicalUrlHe, canonicalUrlAr: art.canonicalUrlAr,
          statusEn: art.statusEn ?? 'DRAFT', statusHe: art.statusHe ?? 'DRAFT', statusAr: art.statusAr ?? 'DRAFT',
          featuredImage: art.featuredImage, articleOrder: art.articleOrder, showRelatedArticles: art.showRelatedArticles !== false,
        });
        setContentEn(art.contentEn ?? '');
        setContentHe(art.contentHe ?? '');
        setContentAr(art.contentAr ?? '');
      })
      .catch(() => flash('err', 'Failed to load article'));
  };

  const save = useCallback(async () => {
    if (!form.slug?.trim()) {
      flash('err', 'Slug is required.');
      return;
    }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const url = isNew ? '/api/admin/articles' : `/api/admin/articles/${editing}`;
      const method = isNew ? 'POST' : 'PATCH';
      const payload = {
        ...form,
        contentEn: contentEn,
        contentHe: contentHe,
        contentAr: contentAr,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
  }, [editing, form, contentEn, contentHe, contentAr]);

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

  const saveDefaultImage = async () => {
    setSavingDefault(true);
    try {
      const res = await fetch('/api/admin/articles/default-image', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: defaultImageDraft.url.trim() || undefined,
          alt: defaultImageDraft.alt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash('err', data.error || 'Failed to save default image');
        return;
      }
      setDefaultImage(data.defaultImage ?? null);
      setDefaultImageDraft({ url: data.defaultImage?.url ?? '', alt: data.defaultImage?.alt ?? '' });
      flash('ok', 'Default image saved. Used for articles without a featured image.');
    } catch {
      flash('err', 'Network error');
    } finally {
      setSavingDefault(false);
    }
  };

  const onDefaultImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setDefaultImageDraft((d) => ({ ...d, url: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const searchLower = search.toLowerCase();
  const displayed = articles
    .filter((a) => {
      if (!searchLower) return true;
      return (
        (a.titleEn || '').toLowerCase().includes(searchLower) ||
        (a.titleHe || '').toLowerCase().includes(searchLower) ||
        (a.titleAr || '').toLowerCase().includes(searchLower) ||
        (a.slug || '').toLowerCase().includes(searchLower)
      );
    })
    .filter((a) => {
      if (filterLocales.size === 0) return true;
      return [...filterLocales].some((loc) => {
        const title = a[`title${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleRow] as string | undefined;
        return title?.trim()?.length ? true : false;
      });
    })
    .filter((a) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'has_published') {
        return a.statusEn === 'PUBLISHED' || a.statusHe === 'PUBLISHED' || a.statusAr === 'PUBLISHED';
      }
      if (filterStatus === 'all_draft') {
        return a.statusEn === 'DRAFT' && a.statusHe === 'DRAFT' && a.statusAr === 'DRAFT';
      }
      return true;
    })
    .sort((a, b) => {
      const titleA = getDisplayTitle(a);
      const titleB = getDisplayTitle(b);
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'az') return titleA.localeCompare(titleB);
      return titleB.localeCompare(titleA);
    });

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

  // Helper to get/set locale-specific fields
  const getTitle = (loc: Locale) => form[`title${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as string;
  const getExcerpt = (loc: Locale) => (form[`excerpt${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as string | null) ?? '';
  const getStatus = (loc: Locale) => form[`status${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as ArticleStatus;
  const getFocusKeyword = (loc: Locale) => (form[`focusKeyword${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as string | null) ?? '';
  const getMetaTitle = (loc: Locale) => (form[`metaTitle${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as string | null) ?? '';
  const getMetaDesc = (loc: Locale) => (form[`metaDesc${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as string | null) ?? '';
  const getOgTitle = (loc: Locale) => (form[`ogTitle${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as string | null) ?? '';
  const getOgDesc = (loc: Locale) => (form[`ogDesc${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as string | null) ?? '';
  const getCanonicalUrl = (loc: Locale) => (form[`canonicalUrl${loc.charAt(0).toUpperCase() + loc.slice(1)}` as keyof ArticleForm] as string | null) ?? '';

  const setLocaleField = <K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const editorTitle = editing === 'new' ? 'New Article' : `Edit: ${getDisplayTitle(form as ArticleRow) || '(untitled)'}`;

  return (
    <div className="mt-6">
      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {editing ? (
        /* ── Editor ── */
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">{editorTitle}</h2>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Locale tabs */}
          <div className="flex gap-0 border-b border-gray-200 px-6">
            {LOCALES.map((loc) => (
              <button key={loc} onClick={() => setLocaleTab(loc)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${localeTab === loc ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {LOCALE_LABELS[loc]}
              </button>
            ))}
          </div>

          {/* Section tabs */}
          <div className="flex gap-0 border-b border-gray-200 px-6">
            {(['main', 'content', 'seo'] as const).map((t) => (
              <button key={t} onClick={() => setSectionTab(t)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${sectionTab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {t === 'main' ? 'Main' : t === 'content' ? 'Content' : 'SEO'}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {sectionTab === 'main' && (
              <>
                {/* Shared fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Slug * (URL-safe)</label>
                    <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="e.g. best-esim-for-travel" />
                  </div>
                  <div>
                    <label className={labelCls}>Article Order</label>
                    <input type="number" className={inputCls} value={form.articleOrder} onChange={(e) => setForm({ ...form, articleOrder: Number(e.target.value) })} />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showRelated"
                      checked={form.showRelatedArticles !== false}
                      onChange={(e) => setForm({ ...form, showRelatedArticles: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="showRelated" className="text-sm font-medium text-gray-700">
                      Show related articles at end of post (2–3 same language, random order)
                    </label>
                  </div>
                </div>

                {/* Locale-specific fields for current locale */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Title ({LOCALE_LABELS[localeTab]})</label>
                    <input
                      className={inputCls}
                      dir={localeTab === 'he' || localeTab === 'ar' ? 'rtl' : 'ltr'}
                      value={getTitle(localeTab)}
                      onChange={(e) => setLocaleField(`title${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value)}
                      placeholder="Article title"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Status ({LOCALE_LABELS[localeTab]})</label>
                    <select
                      className={inputCls}
                      value={getStatus(localeTab)}
                      onChange={(e) => setLocaleField(`status${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value as ArticleStatus)}
                    >
                      <option value="DRAFT">Draft (noindex)</option>
                      <option value="PUBLISHED">Published (indexed)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Excerpt ({LOCALE_LABELS[localeTab]})</label>
                  <textarea
                    className={inputCls}
                    dir={localeTab === 'he' || localeTab === 'ar' ? 'rtl' : 'ltr'}
                    rows={3}
                    value={getExcerpt(localeTab)}
                    onChange={(e) => setLocaleField(`excerpt${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value || null)}
                    placeholder="Short summary for article index page…"
                  />
                </div>

                <FeaturedImageField
                  value={form.featuredImage || ''}
                  onChange={(v) => setForm({ ...form, featuredImage: v || null })}
                />
              </>
            )}

            {sectionTab === 'content' && (
              <div>
                <p className="mb-2 text-xs text-gray-500">
                  Full rich-text editor — fonts, colors, direction, tables, images, YouTube and more.
                  Click <code className="rounded bg-gray-100 px-1">&lt;/&gt;</code> to switch to raw HTML mode.
                </p>
                {localeTab === 'en' && (
                  <RichTextEditor
                    key={editing ? `en-${editing}` : 'en-new'}
                    value={contentEn}
                    onChange={setContentEn}
                    isRTL={false}
                  />
                )}
                {localeTab === 'he' && (
                  <RichTextEditor
                    key={editing ? `he-${editing}` : 'he-new'}
                    value={contentHe}
                    onChange={setContentHe}
                    isRTL={true}
                  />
                )}
                {localeTab === 'ar' && (
                  <RichTextEditor
                    key={editing ? `ar-${editing}` : 'ar-new'}
                    value={contentAr}
                    onChange={setContentAr}
                    isRTL={true}
                  />
                )}
              </div>
            )}

            {sectionTab === 'seo' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>Focus Keyword ({LOCALE_LABELS[localeTab]})</label>
                    <button
                      type="button"
                      onClick={() => {
                        const kw = generateFocusKeyword(getTitle(localeTab), form.slug, localeTab);
                        if (kw) setLocaleField(`focusKeyword${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, kw);
                        else flash('err', 'Could not detect destination from title/slug.');
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Wand2 className="h-3 w-3" />
                      Auto-fill from title
                    </button>
                  </div>
                  <input
                    className={inputCls}
                    dir={localeTab === 'he' || localeTab === 'ar' ? 'rtl' : 'ltr'}
                    value={getFocusKeyword(localeTab)}
                    onChange={(e) => setLocaleField(`focusKeyword${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value || null)}
                    placeholder={
                      localeTab === 'he' ? 'eSIM למאוריטניה'
                      : localeTab === 'ar' ? 'eSIM لموريتانيا'
                      : 'eSIM for Mauritania'
                    }
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Format: <code className="font-mono">
                      {localeTab === 'he' ? 'eSIM ל[יעד]' : localeTab === 'ar' ? 'eSIM لـ[وجهة]' : 'eSIM for [Destination]'}
                    </code>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>Meta Title ({LOCALE_LABELS[localeTab]})</label>
                    <span className={`text-xs tabular-nums ${getMetaTitle(localeTab).length > 60 ? 'text-red-500 font-semibold' : getMetaTitle(localeTab).length > 51 ? 'text-amber-500' : 'text-gray-400'}`}>
                      {getMetaTitle(localeTab).length}/60
                    </span>
                  </div>
                  <input
                    className={inputCls}
                    dir={localeTab === 'he' || localeTab === 'ar' ? 'rtl' : 'ltr'}
                    value={getMetaTitle(localeTab)}
                    onChange={(e) => setLocaleField(`metaTitle${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value || null)}
                    placeholder={getTitle(localeTab) || 'Meta title (ideal ≤60 chars)'}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>Meta Description ({LOCALE_LABELS[localeTab]})</label>
                    <span className={`text-xs tabular-nums ${getMetaDesc(localeTab).length > 155 ? 'text-red-500 font-semibold' : getMetaDesc(localeTab).length > 131 ? 'text-amber-500' : 'text-gray-400'}`}>
                      {getMetaDesc(localeTab).length}/155
                    </span>
                  </div>
                  <textarea
                    className={`${inputCls} resize-none`}
                    dir={localeTab === 'he' || localeTab === 'ar' ? 'rtl' : 'ltr'}
                    rows={3}
                    value={getMetaDesc(localeTab)}
                    onChange={(e) => setLocaleField(`metaDesc${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value || null)}
                    placeholder="Meta description (ideal: 120–155 chars)"
                  />
                </div>

                <ArticleSerpPreview
                  title={getMetaTitle(localeTab) || getTitle(localeTab)}
                  description={getMetaDesc(localeTab) || getExcerpt(localeTab)}
                  slug={form.slug}
                  locale={localeTab}
                />

                <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
                  <legend className="px-1 text-xs font-semibold text-gray-500">Open Graph (Social Sharing) ({LOCALE_LABELS[localeTab]})</legend>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>OG Title</label>
                      <span className={`text-xs tabular-nums ${getOgTitle(localeTab).length > 60 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {getOgTitle(localeTab).length}/60
                      </span>
                    </div>
                    <input
                      className={inputCls}
                      dir={localeTab === 'he' || localeTab === 'ar' ? 'rtl' : 'ltr'}
                      value={getOgTitle(localeTab)}
                      onChange={(e) => setLocaleField(`ogTitle${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value || null)}
                      placeholder="Social share title (defaults to Meta Title)"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>OG Description</label>
                      <span className={`text-xs tabular-nums ${getOgDesc(localeTab).length > 155 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {getOgDesc(localeTab).length}/155
                      </span>
                    </div>
                    <textarea
                      className={`${inputCls} resize-none`}
                      dir={localeTab === 'he' || localeTab === 'ar' ? 'rtl' : 'ltr'}
                      rows={2}
                      value={getOgDesc(localeTab)}
                      onChange={(e) => setLocaleField(`ogDesc${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value || null)}
                      placeholder="Social share description"
                    />
                  </div>
                </fieldset>

                <div>
                  <label className={labelCls}>Canonical URL ({LOCALE_LABELS[localeTab]})</label>
                  <input
                    className={inputCls}
                    value={getCanonicalUrl(localeTab)}
                    onChange={(e) => setLocaleField(`canonicalUrl${localeTab.charAt(0).toUpperCase() + localeTab.slice(1)}` as keyof ArticleForm, e.target.value || null)}
                    placeholder={articleUrl(form.slug || 'slug', localeTab)}
                  />
                  <p className="mt-1 text-xs text-gray-400">Leave blank to auto-generate from slug.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── List ── */
        <>
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder="Search title, slug…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => bulkFillKeywords(false)}
                  disabled={bulkFilling}
                  title="Auto-fill focus keywords for articles that have none"
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-colors"
                >
                  {bulkFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Auto-fill keywords
                </button>
                <button onClick={startNew} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  <Plus className="h-4 w-4" /> New Article
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1">
                <button
                  onClick={() => setFilterLocales(new Set())}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${filterLocales.size === 0 ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                >
                  All langs
                </button>
                {LOCALES.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setFilterLocales((prev) => {
                      const next = new Set(prev);
                      if (next.has(loc)) next.delete(loc);
                      else next.add(loc);
                      return next;
                    })}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${filterLocales.has(loc) ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {LOCALE_LABELS[loc]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {[
                  { v: 'all', l: 'All' },
                  { v: 'has_published', l: 'Any published' },
                  { v: 'all_draft', l: 'All draft' },
                ].map(({ v, l }) => (
                  <button key={v} onClick={() => setFilterStatus(v)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${filterStatus === v ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    {l}
                  </button>
                ))}
              </div>
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
              <span className="text-xs text-gray-400 ml-auto">{displayed.length} article{displayed.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Default article image</h3>
            <p className="text-xs text-gray-500 mb-3">
              Shown for all articles that have no featured image. Alt text is required for accessibility (screen readers, SEO).
            </p>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={defaultImageDraft.url}
                  onChange={(e) => setDefaultImageDraft((d) => ({ ...d, url: e.target.value }))}
                  placeholder="https://… or upload below"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Alt text (required for accessibility)</label>
                <input
                  type="text"
                  value={defaultImageDraft.alt}
                  onChange={(e) => setDefaultImageDraft((d) => ({ ...d, alt: e.target.value }))}
                  placeholder="Describe the image for screen readers"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => defaultImageFileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload
                </button>
                <button
                  type="button"
                  onClick={saveDefaultImage}
                  disabled={savingDefault}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingDefault ? 'Saving…' : 'Save default image'}
                </button>
              </div>
            </div>
            {defaultImageDraft.url && (
              <div className="mt-3 h-20 w-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={defaultImageDraft.url} alt={defaultImageDraft.alt || 'Preview'} className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              </div>
            )}
            <input ref={defaultImageFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onDefaultImageFile} />
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
                    <th className="px-4 py-3 text-left hidden md:table-cell">Slug</th>
                    <th className="px-4 py-3 text-center">EN / HE / AR</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayed.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-300"><GripVertical className="h-4 w-4" /></td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{getDisplayTitle(a)}</td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell font-mono text-xs">{a.slug}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${a.statusEn === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {a.statusEn === 'PUBLISHED' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            EN
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${a.statusHe === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {a.statusHe === 'PUBLISHED' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            HE
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${a.statusAr === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {a.statusAr === 'PUBLISHED' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            AR
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(a)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteArticle(a.id, getDisplayTitle(a))} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
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
