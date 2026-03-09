'use client';

import { useState } from 'react';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import type { NavLink } from '@/lib/navigation';

const NAV_KEYS = ['home', 'destinations', 'app', 'howItWorks', 'devices', 'help', 'about', 'contact'];
const FOOTER_LEGAL_KEYS = ['terms', 'privacy', 'refund', 'accessibilityStatement'];
const FOOTER_GUIDES_KEYS = ['guidesAll', 'guidesEurope', 'guidesHowTo', 'guidesVsRoaming'];

const SECTION_LABELS: Record<string, string> = {
  navMenu: 'Main menu (header)',
  footerProduct: 'Footer – Products',
  footerCompany: 'Footer – Company',
  footerLegal: 'Footer – Legal',
  footerGuides: 'Footer – eSIM Guides',
};

const KEY_OPTIONS: Record<string, string[]> = {
  navMenu: NAV_KEYS,
  footerProduct: ['destinations', 'app', 'howItWorks', 'devices'],
  footerCompany: ['about', 'contact', 'help'],
  footerLegal: FOOTER_LEGAL_KEYS,
  footerGuides: FOOTER_GUIDES_KEYS,
};

const DEFAULT_HREFS: Record<string, Record<string, string>> = {
  navMenu: {
    home: '/',
    destinations: '/destinations',
    app: '/app',
    howItWorks: '/how-it-works',
    devices: '/compatible-devices',
    help: '/help',
    about: '/about',
    contact: '/contact',
  },
  footerProduct: {
    destinations: '/destinations',
    app: '/app',
    howItWorks: '/how-it-works',
    devices: '/compatible-devices',
  },
  footerCompany: { about: '/about', contact: '/contact', help: '/help' },
  footerLegal: {
    terms: '/terms',
    privacy: '/privacy',
    refund: '/refund',
    accessibilityStatement: '/accessibility-statement',
  },
  footerGuides: {
    guidesAll: '/articles',
    guidesEurope: '/articles/esim-europe-guide',
    guidesHowTo: '/articles/how-does-esim-work',
    guidesVsRoaming: '/articles/esim-vs-physical-sim-vs-roaming',
  },
};

type SectionKey = keyof typeof SECTION_LABELS;

interface Props {
  initial: Record<SectionKey, NavLink[]>;
}

function LinkRow({
  link,
  keys,
  defaultHrefs,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: {
  link: NavLink;
  keys: string[];
  defaultHrefs: Record<string, string>;
  onChange: (link: NavLink) => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 transition-opacity ${isDragging ? 'opacity-50' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing touch-none"
        role="button"
        tabIndex={0}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      </div>
      <select
        value={link.key}
        onChange={(e) => onChange({ ...link, key: e.target.value, href: defaultHrefs[e.target.value] ?? link.href })}
        className="flex-1 min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
      >
        {keys.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={link.href}
        onChange={(e) => onChange({ ...link, href: e.target.value })}
        placeholder="/path"
        className="flex-1 min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
        aria-label="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

type DragState = { sectionKey: SectionKey; index: number } | null;

export function NavigationClient({ initial }: Props) {
  const [sections, setSections] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState<DragState>(null);

  function updateSection(key: SectionKey, links: NavLink[]) {
    setSections((s) => ({ ...s, [key]: links }));
  }

  function addLink(key: SectionKey) {
    const keys = KEY_OPTIONS[key];
    const defaults = DEFAULT_HREFS[key];
    const used = new Set(sections[key].map((l) => l.key));
    const firstUnused = keys.find((k) => !used.has(k)) ?? keys[0];
    const newLink: NavLink = { href: defaults[firstUnused] ?? '/', key: firstUnused };
    updateSection(key, [...sections[key], newLink]);
  }

  function removeLink(key: SectionKey, index: number) {
    updateSection(key, sections[key].filter((_, i) => i !== index));
  }

  function changeLink(key: SectionKey, index: number, link: NavLink) {
    updateSection(
      key,
      sections[key].map((l, i) => (i === index ? link : l))
    );
  }

  function moveLink(key: SectionKey, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const links = [...sections[key]];
    const [removed] = links.splice(fromIndex, 1);
    links.splice(toIndex, 0, removed);
    updateSection(key, links);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const settings: Record<string, string> = {
        nav_menu: JSON.stringify(sections.navMenu),
        footer_product: JSON.stringify(sections.footerProduct),
        footer_company: JSON.stringify(sections.footerCompany),
        footer_legal: JSON.stringify(sections.footerLegal),
        footer_guides: JSON.stringify(sections.footerGuides),
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 max-w-2xl space-y-8">
      {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
        <div key={key} className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
          <h2 className="text-sm font-semibold text-gray-900">{SECTION_LABELS[key]}</h2>
          <div className="mt-3 space-y-2">
            {sections[key].map((link, i) => (
              <LinkRow
                key={`${key}-${link.key}-${i}`}
                link={link}
                keys={KEY_OPTIONS[key]}
                defaultHrefs={DEFAULT_HREFS[key]}
                onChange={(l) => changeLink(key, i, l)}
                onRemove={() => removeLink(key, i)}
                onDragStart={(e) => {
                  setDragging({ sectionKey: key, index: i });
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', `${key}:${i}`);
                  e.dataTransfer.setData('application/json', JSON.stringify({ sectionKey: key, index: i }));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!dragging || dragging.sectionKey !== key) return;
                  moveLink(key, dragging.index, i);
                  setDragging(null);
                }}
                onDragEnd={() => setDragging(null)}
                isDragging={dragging?.sectionKey === key && dragging?.index === i}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => addLink(key)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add link
          </button>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Navigation'}
      </button>
    </div>
  );
}
