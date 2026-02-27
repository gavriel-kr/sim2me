'use client';

import { useState, useRef } from 'react';
import { Download, Upload, Mail, CheckCheck, Circle } from 'lucide-react';
import { applyContactFilters, type ContactFiltersState } from './contactFilters';
import { ContactFilters } from './ContactFilters';
import { exportContactsToExcel, parseContactExcelFile } from './contactExcel';

interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  marketingConsent: boolean;
  read: boolean;
  createdAt: string;
}

const defaultFilters: ContactFiltersState = {
  search: '',
  readStatus: '',
  marketingConsent: '',
  dateFrom: '',
  dateTo: '',
  rules: [],
};

export function ContactSubmissionsClient({ submissions: initial }: { submissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initial);
  const [filters, setFilters] = useState<ContactFiltersState>(defaultFilters);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = applyContactFilters(submissions, filters);
  const unreadCount = submissions.filter((s) => !s.read).length;

  const toggleRead = async (id: string) => {
    setLoading((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/contact/${id}/read`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, read: data.read } : s))
        );
      }
    } finally {
      setLoading((p) => ({ ...p, [id]: false }));
    }
  };

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
      if (rows.length === 0) {
        setImportResult('No valid rows (need id column).');
        return;
      }
      const updates = rows.map((r) => ({ id: r.id, read: r.read?.toLowerCase() === 'yes' }));
      const res = await fetch('/api/admin/contact/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult(data?.error ?? 'Bulk update failed');
        return;
      }
      setSubmissions((prev) =>
        prev.map((s) => {
          const u = updates.find((x) => x.id === s.id);
          return u ? { ...s, read: u.read } : s;
        })
      );
      setImportResult(`Updated ${data.updated} of ${data.total} submissions.${data.errors?.length ? ` Errors: ${data.errors.join('; ')}` : ''}`);
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
      {unreadCount > 0 && (
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-200">
          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
          {unreadCount} unread
        </div>
      )}

      <ContactFilters filters={filters} onFiltersChange={setFilters} resultCount={filtered.length} />

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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          No submissions match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border bg-white shadow-sm transition-colors ${s.read ? 'border-gray-200' : 'border-emerald-300'}`}
            >
              {/* Main row */}
              <div
                className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 hover:bg-gray-50"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!s.read && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
                    <p className="font-medium text-gray-900 truncate">{s.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{s.email}</p>
                </div>
                <div className="flex-1 min-w-0 hidden md:block">
                  <p className="text-sm text-gray-700 truncate">{s.subject}</p>
                </div>
                {s.marketingConsent && (
                  <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 border border-blue-200">
                    Marketing ✓
                  </span>
                )}
                <span className="text-xs text-gray-400 shrink-0">{s.createdAt}</span>
                <span className="text-gray-400 text-sm">{expanded === s.id ? '▲' : '▼'}</span>
              </div>

              {/* Expanded */}
              {expanded === s.id && (
                <div className="border-t border-gray-100 px-4 py-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Message</p>
                    <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">
                      {s.message}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Email</p>
                      <a href={`mailto:${s.email}`} className="text-primary hover:underline">{s.email}</a>
                    </div>
                    <div>
                      <p className="text-gray-400">Marketing consent</p>
                      <p className="font-medium text-gray-700">{s.marketingConsent ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">ID</p>
                      <p className="font-mono text-gray-500 break-all">{s.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Date</p>
                      <p className="text-gray-700">{s.createdAt}</p>
                    </div>
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
                      onClick={() => toggleRead(s.id)}
                      disabled={loading[s.id]}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {loading[s.id] ? '…' : s.read ? 'Mark unread' : 'Mark as read'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
