'use client';

/**
 * Ticket 042 — checkboxes, in the spirit of "Hot deals enabled": whether the homepage shows the
 * "Popular destinations" section, the "For you" shelf and the "Instant activation worldwide" badge.
 * Each checkbox saves immediately. The badge's wording per language saves with its own button; a
 * language left empty keeps the site's default text (shown as the placeholder).
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BADGE_LOCALES, BADGE_TEXT_MAX, type BadgeLocale, type HomepageSections } from '@/lib/homepage-sections-shared';

const LANGUAGE_NAMES: Record<BadgeLocale, string> = { he: 'Hebrew', en: 'English', ar: 'Arabic', hi: 'Hindi' };
const RTL = new Set<BadgeLocale>(['he', 'ar']);

interface Props {
  initial: HomepageSections;
  /** The site's own badge text per language, shown when the admin leaves a language empty. */
  badgeDefaults: Record<BadgeLocale, string>;
}

export function HomepageSectionsToggle({ initial, badgeDefaults }: Props) {
  const [value, setValue] = useState<HomepageSections>(initial);
  const [drafts, setDrafts] = useState<Partial<Record<BadgeLocale, string>>>(initial.activationBadgeText);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const textChanged = BADGE_LOCALES.some(
    (l) => (drafts[l] ?? '').trim() !== (value.activationBadgeText[l] ?? ''),
  );

  /** Saves and returns what the server stored (trimmed, empty languages dropped), or null on failure. */
  const save = async (next: HomepageSections): Promise<HomepageSections | null> => {
    const previous = value;
    setValue(next);
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/homepage-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || res.statusText);
      const stored: HomepageSections = {
        popularDestinations: body.popularDestinations,
        forYou: body.forYou,
        activationBadge: body.activationBadge,
        activationBadgeText: body.activationBadgeText ?? {},
      };
      setValue(stored);
      setMessage('Saved');
      return stored;
    } catch (e) {
      setValue(previous);
      setMessage(`Error: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // A checkbox saves the texts as last saved, never a half-typed draft, and leaves the draft alone.
  const toggle = (patch: Partial<HomepageSections>) => save({ ...value, ...patch });
  const saveText = async () => {
    const stored = await save({ ...value, activationBadgeText: drafts });
    if (stored) setDrafts(stored.activationBadgeText);
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Homepage sections</h2>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : message ? (
          <span className={`text-xs ${message.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>{message}</span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            id="section-popular"
            checked={value.popularDestinations}
            disabled={saving}
            onChange={(e) => toggle({ popularDestinations: e.target.checked })}
            className="h-4 w-4 accent-emerald-600"
          />
          Show &quot;Popular destinations&quot; on the homepage
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            id="section-foryou"
            checked={value.forYou}
            disabled={saving}
            onChange={(e) => toggle({ forYou: e.target.checked })}
            className="h-4 w-4 accent-emerald-600"
          />
          Show the &quot;For you&quot; section (&quot;Pick up where you left off&quot; / &quot;Today&apos;s recommended destination&quot;)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            id="section-badge"
            checked={value.activationBadge}
            disabled={saving}
            onChange={(e) => toggle({ activationBadge: e.target.checked })}
            className="h-4 w-4 accent-emerald-600"
          />
          Show the badge above the hero headline (&quot;{badgeDefaults.en}&quot;)
        </label>
      </div>

      <div className={`mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 ${value.activationBadge ? '' : 'opacity-60'}`}>
        <p className="text-xs text-gray-500">
          Badge text per language. Leave a language empty to keep the default shown in grey.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {BADGE_LOCALES.map((locale) => (
            <label key={locale} className="block text-xs font-medium text-gray-600">
              {LANGUAGE_NAMES[locale]}
              <input
                type="text"
                id={`badge-text-${locale}`}
                dir={RTL.has(locale) ? 'rtl' : 'ltr'}
                value={drafts[locale] ?? ''}
                placeholder={badgeDefaults[locale]}
                maxLength={BADGE_TEXT_MAX}
                disabled={saving}
                onChange={(e) => setDrafts((d) => ({ ...d, [locale]: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          {textChanged && (
            <button
              type="button"
              disabled={saving}
              onClick={() => setDrafts(value.activationBadgeText)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={saving || !textChanged}
            onClick={saveText}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save badge text
          </button>
        </div>
      </div>
    </div>
  );
}
