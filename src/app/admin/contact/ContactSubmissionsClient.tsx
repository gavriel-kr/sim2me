'use client';

import { useState, useRef } from 'react';
import { Download, Upload, Mail, CheckCheck, Circle, Pencil, X, Plus, Trash2 } from 'lucide-react';
import { applyContactFilters, type ContactFiltersState } from './contactFilters';
import { ContactFilters } from './ContactFilters';
import { exportContactsToExcel, parseContactExcelFile } from './contactExcel';
import { CONTACT_SUBJECTS } from '@/lib/validation/schemas';

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  marketingConsent: boolean;
  read: boolean;
  status: string;
  createdAt: string;
  notes: Note[];
}

const STATUS_CONFIG = {
  NEW: { label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
} as const;

const STATUS_BORDER: Record<string, string> = {
  NEW: 'border-blue-300',
  IN_PROGRESS: 'border-amber-300',
  RESOLVED: 'border-emerald-200',
};

const defaultFilters: ContactFiltersState = {
  search: '',
  readStatus: '',
  status: '',
  marketingConsent: '',
  dateFrom: '',
  dateTo: '',
  rules: [],
};

export function ContactSubmissionsClient({ submissions: initial }: { submissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initial);
  const [filters, setFilters] = useState<ContactFiltersState>(defaultFilters);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Submission>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkRead, setBulkRead] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = applyContactFilters(submissions, filters);
  const unreadCount = submissions.filter((s) => !s.read).length;
  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const updateLocal = (id: string, patch: Partial<Submission>) =>
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((s) => s.id)));

  // ─── Status ──────────────────────────────────────────────────────────────

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/contact/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, read: true }),
    });
    if (res.ok) updateLocal(id, { status, read: true });
  };

  // ─── Read toggle ─────────────────────────────────────────────────────────

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    const res = await fetch(`/api/admin/contact/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: !currentRead }),
    });
    if (res.ok) updateLocal(id, { read: !currentRead });
  };

  // ─── Edit submission ─────────────────────────────────────────────────────

  const startEdit = (s: Submission) => {
    setEditing(s.id);
    setEditForm({ name: s.name, email: s.email, phone: s.phone ?? '', subject: s.subject, message: s.message, marketingConsent: s.marketingConsent });
  };

  const handleSaveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        updateLocal(id, editForm as Partial<Submission>);
        setEditing(null);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Notes ───────────────────────────────────────────────────────────────

  const handleAddNote = async (id: string) => {
    const content = noteInputs[id]?.trim();
    if (!content) return;
    setSavingNote(id);
    try {
      const res = await fetch(`/api/admin/contact/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const note = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, notes: [...s.notes, note] } : s))
        );
        setNoteInputs((p) => ({ ...p, [id]: '' }));
      }
    } finally {
      setSavingNote(null);
    }
  };

  const handleDeleteNote = async (submissionId: string, noteId: string) => {
    const res = await fetch(`/api/admin/contact/${submissionId}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    });
    if (res.ok) {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, notes: s.notes.filter((n) => n.id !== noteId) } : s
        )
      );
    }
  };

  // ─── Bulk actions ─────────────────────────────────────────────────────────

  const handleBulkApply = async () => {
    if (selected.size === 0 || (!bulkStatus && !bulkRead)) return;
    setApplyingBulk(true);
    try {
      const updates = Array.from(selected).map((id) => ({
        id,
        ...(bulkStatus && { status: bulkStatus }),
        ...(bulkRead && { read: bulkRead === 'read' }),
      }));
      const res = await fetch('/api/admin/contact/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) {
        for (const u of updates) updateLocal(u.id, u as Partial<Submission>);
        setSelected(new Set());
        setBulkStatus('');
        setBulkRead('');
      }
    } finally {
      setApplyingBulk(false);
    }
  };

  // ─── Excel ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      await exportContactsToExcel(filtered, `contact-submissions-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const rows = await parseContactExcelFile(file);
      if (rows.length === 0) { setImportResult('No valid rows (need id column).'); return; }
      const updates = rows.map((r) => ({ id: r.id, read: r.read?.toLowerCase() === 'yes' }));
      const res = await fetch('/api/admin/contact/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) { setImportResult(data?.error ?? 'Bulk update failed'); return; }
      setSubmissions((prev) =>
        prev.map((s) => { const u = updates.find((x) => x.id === s.id); return u ? { ...s, read: u.read } : s; })
      );
      setImportResult(`Updated ${data.updated} of ${data.total} submissions.`);
    } catch (err) {
      setImportResult(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-gray-500">No contact submissions yet</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {unreadCount > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-200">
            <Circle className="h-2 w-2 fill-blue-500 text-blue-500" /> {unreadCount} unread
          </span>
        )}
        {(['NEW', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => {
          const count = submissions.filter((s) => s.status === st).length;
          if (!count) return null;
          return (
            <span key={st} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${STATUS_CONFIG[st].color}`}>
              {STATUS_CONFIG[st].label}: {count}
            </span>
          );
        })}
      </div>

      <ContactFilters filters={filters} onFiltersChange={setFilters} resultCount={filtered.length} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export to Excel
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {importing ? 'Importing…' : 'Import from Excel'}
        </button>
        {importResult && <p className="text-sm text-gray-600">{importResult}</p>}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-semibold text-blue-800">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="h-8 rounded border border-gray-300 bg-white px-2 text-sm"
          >
            <option value="">Status…</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select
            value={bulkRead}
            onChange={(e) => setBulkRead(e.target.value)}
            className="h-8 rounded border border-gray-300 bg-white px-2 text-sm"
          >
            <option value="">Read status…</option>
            <option value="read">Mark read</option>
            <option value="unread">Mark unread</option>
          </select>
          <button
            type="button"
            onClick={handleBulkApply}
            disabled={applyingBulk || (!bulkStatus && !bulkRead)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {applyingBulk ? 'Applying…' : 'Apply'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-white"
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          No submissions match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select all */}
          <label className="flex items-center gap-2 px-1 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded accent-blue-600"
            />
            Select all ({filtered.length})
          </label>

          {filtered.map((s) => {
            const statusCfg = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.NEW;
            const isExpanded = expanded === s.id;
            const isEditing = editing === s.id;

            return (
              <div key={s.id} className={`rounded-2xl border bg-white shadow-sm transition-colors ${!s.read ? STATUS_BORDER[s.status] ?? 'border-blue-300' : 'border-gray-200'}`}>
                {/* Main row */}
                <div className="flex items-start gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    className="mt-1 h-4 w-4 rounded accent-blue-600 shrink-0"
                  />
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : s.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {!s.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                      <p className="font-medium text-gray-900 truncate">{s.name}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      {s.marketingConsent && (
                        <span className="inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600 border border-purple-200">
                          Marketing ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                    <p className="text-sm text-gray-700 truncate mt-0.5">{s.subject}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-gray-400">{s.createdAt}</span>
                    <span className="text-gray-400 text-sm cursor-pointer" onClick={() => setExpanded(isExpanded ? null : s.id)}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex gap-1.5 px-4 pb-3 -mt-1">
                  {(['NEW', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatus(s.id, st)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all ${s.status === st ? STATUS_CONFIG[st].color : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}
                    >
                      {STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4 text-sm">
                    {isEditing ? (
                      /* ── Edit form ── */
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            { key: 'name', label: 'Name', type: 'text' },
                            { key: 'email', label: 'Email', type: 'email' },
                            { key: 'phone', label: 'Phone', type: 'tel' },
                          ].map(({ key, label, type }) => (
                            <div key={key}>
                              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                              <input
                                type={type}
                                value={(editForm as Record<string, string>)[key] ?? ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                              />
                            </div>
                          ))}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
                            <select
                              value={editForm.subject ?? ''}
                              onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            >
                              {CONTACT_SUBJECTS.map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                              {editForm.subject && !CONTACT_SUBJECTS.includes(editForm.subject as typeof CONTACT_SUBJECTS[number]) && (
                                <option value={editForm.subject}>{editForm.subject}</option>
                              )}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Message</label>
                          <textarea
                            rows={4}
                            value={editForm.message ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, message: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.marketingConsent ?? false}
                            onChange={(e) => setEditForm((f) => ({ ...f, marketingConsent: e.target.checked }))}
                            className="h-3.5 w-3.5 accent-primary"
                          />
                          Marketing consent
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(s.id)}
                            disabled={savingEdit}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {savingEdit ? 'Saving…' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── View mode ── */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><p className="text-gray-400">Email</p><a href={`mailto:${s.email}`} className="text-primary hover:underline">{s.email}</a></div>
                          {s.phone && <div><p className="text-gray-400">Phone</p><p className="text-gray-700">{s.phone}</p></div>}
                          <div><p className="text-gray-400">Subject</p><p className="text-gray-700">{s.subject}</p></div>
                          <div><p className="text-gray-400">Marketing</p><p className="font-medium text-gray-700">{s.marketingConsent ? 'Yes' : 'No'}</p></div>
                          <div><p className="text-gray-400">Date</p><p className="text-gray-700">{s.createdAt}</p></div>
                          <div><p className="text-gray-400">ID</p><p className="font-mono text-gray-400 text-xs break-all">{s.id}</p></div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Message</p>
                          <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">{s.message}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a
                            href={`mailto:${s.email}?subject=Re: ${encodeURIComponent(s.subject)}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            <Mail className="h-3.5 w-3.5" /> Reply
                          </a>
                          <button
                            type="button"
                            onClick={() => startEdit(s)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleRead(s.id, s.read)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            {s.read ? 'Mark unread' : 'Mark as read'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Notes ── */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes ({s.notes.length})</p>
                      {s.notes.length > 0 && (
                        <div className="space-y-2">
                          {s.notes.map((note) => (
                            <div key={note.id} className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                <p className="text-xs text-gray-400 mt-1">{note.createdAt}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(s.id, note.id)}
                                className="rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                                aria-label="Delete note"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={noteInputs[s.id] ?? ''}
                          onChange={(e) => setNoteInputs((p) => ({ ...p, [s.id]: e.target.value }))}
                          placeholder="Add a note about how this was handled…"
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddNote(s.id)}
                          disabled={savingNote === s.id || !noteInputs[s.id]?.trim()}
                          className="self-end rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" /> {savingNote === s.id ? '…' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
