'use client';

import { useState, useRef } from 'react';
import {
  UserCircle, Mail, Phone, Calendar, Download, Upload,
  ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2,
  CheckCheck, Globe, Bell,
} from 'lucide-react';
import { AccountFilters } from './AccountFilters';
import { applyAccountFilters, type AccountFiltersState } from './accountFilters';
import { exportAccountsToExcel } from './accountExcel';
import { CONTACT_SUBJECTS } from '@/lib/validation/schemas';

// ─── Types ────────────────────────────────────────────────────────────────────

type Account = {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  googleId: string | null;
  newsletter: boolean;
  createdAt: string;
};

type Note = { id: string; content: string; createdAt: string };

type ContactSubmission = {
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
};

type OrderRow = {
  id: string;
  packageName: string;
  destination: string | null;
  dataAmount: string | null;
  validity: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  iccid: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  errorMessage: string | null;
  paddleTransactionId: string | null;
  createdAt: string;
};

type AccountFull = Account & {
  orders: OrderRow[];
  contactSubmissions: ContactSubmission[];
};

// ─── Config ───────────────────────────────────────────────────────────────────

const CONTACT_STATUS_CONFIG = {
  NEW: { label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
} as const;

const ORDER_STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
};

const defaultFilters: AccountFiltersState = {
  search: '', newsletter: '', googleAuth: '', dateFrom: '', dateTo: '', rules: [],
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { accounts: Account[] }

export function AccountsClient({ accounts: initial }: Props) {
  const [accounts, setAccounts] = useState(initial);
  const [filters, setFilters] = useState<AccountFiltersState>(defaultFilters);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fullData, setFullData] = useState<Record<string, AccountFull>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Account edit state
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    email: '', name: '', lastName: '', phone: '', newsletter: false, newPassword: '',
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Contact submission state
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [contactEditForm, setContactEditForm] = useState<Partial<ContactSubmission>>({});
  const [savingContact, setSavingContact] = useState(false);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);

  // Bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkNewsletter, setBulkNewsletter] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);

  // Export / Import
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = applyAccountFilters(accounts, filters);
  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((a) => a.id)));

  const updateFullData = (accountId: string, patch: Partial<AccountFull>) =>
    setFullData((prev) => prev[accountId] ? { ...prev, [accountId]: { ...prev[accountId], ...patch } } : prev);

  const patchSubmission = (accountId: string, submissionId: string, patch: Partial<ContactSubmission>) =>
    setFullData((prev) => {
      if (!prev[accountId]) return prev;
      return {
        ...prev,
        [accountId]: {
          ...prev[accountId],
          contactSubmissions: prev[accountId].contactSubmissions.map((s) =>
            s.id === submissionId ? { ...s, ...patch } : s
          ),
        },
      };
    });

  // ─── Expand account ───────────────────────────────────────────────────────

  const handleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      setEditingAccount(null);
      setAccountMsg(null);
      return;
    }
    setExpanded(id);
    setEditingAccount(null);
    setAccountMsg(null);
    setExpandedContact(null);
    setEditingContact(null);
    if (!fullData[id]) {
      setLoadingId(id);
      try {
        const res = await fetch(`/api/admin/accounts/${id}?full=1`);
        const data = await res.json();
        setFullData((prev) => ({ ...prev, [id]: data }));
      } finally {
        setLoadingId(null);
      }
    }
  };

  // ─── Account edit ─────────────────────────────────────────────────────────

  const startEditAccount = (a: Account) => {
    setEditingAccount(a.id);
    setAccountForm({
      email: a.email,
      name: a.name || '',
      lastName: a.lastName || '',
      phone: a.phone || '',
      newsletter: a.newsletter,
      newPassword: '',
    });
    setAccountMsg(null);
  };

  const handleSaveAccount = async (id: string) => {
    setSavingAccount(true);
    setAccountMsg(null);
    try {
      const body: Record<string, unknown> = {
        email: accountForm.email.trim().toLowerCase(),
        name: accountForm.name.trim(),
        lastName: accountForm.lastName.trim() || null,
        phone: accountForm.phone.trim() || null,
        newsletter: accountForm.newsletter,
      };
      if (accountForm.newPassword.length >= 8) body.password = accountForm.newPassword;
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setAccountMsg({ type: 'err', text: data.error || 'Failed to save' }); return; }
      const patch = { email: data.email, name: data.name, lastName: data.lastName, phone: data.phone, newsletter: data.newsletter, googleId: data.googleId };
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a));
      updateFullData(id, patch);
      setAccountMsg({ type: 'ok', text: 'Saved.' });
      setEditingAccount(null);
    } catch {
      setAccountMsg({ type: 'err', text: 'Something went wrong' });
    } finally {
      setSavingAccount(false);
    }
  };

  // ─── Contact status / read ────────────────────────────────────────────────

  const handleContactStatus = async (accountId: string, subId: string, status: string) => {
    const res = await fetch(`/api/admin/contact/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, read: true }),
    });
    if (res.ok) patchSubmission(accountId, subId, { status, read: true });
  };

  const handleContactToggleRead = async (accountId: string, subId: string, currentRead: boolean) => {
    const res = await fetch(`/api/admin/contact/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: !currentRead }),
    });
    if (res.ok) patchSubmission(accountId, subId, { read: !currentRead });
  };

  // ─── Contact edit ─────────────────────────────────────────────────────────

  const startEditContact = (sub: ContactSubmission) => {
    setEditingContact(sub.id);
    setContactEditForm({ name: sub.name, email: sub.email, phone: sub.phone ?? '', subject: sub.subject, message: sub.message, marketingConsent: sub.marketingConsent });
  };

  const handleSaveContact = async (accountId: string, subId: string) => {
    setSavingContact(true);
    try {
      const res = await fetch(`/api/admin/contact/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactEditForm),
      });
      if (res.ok) {
        patchSubmission(accountId, subId, contactEditForm as Partial<ContactSubmission>);
        setEditingContact(null);
      }
    } finally {
      setSavingContact(false);
    }
  };

  // ─── Notes ───────────────────────────────────────────────────────────────

  const handleAddNote = async (accountId: string, subId: string) => {
    const content = noteInputs[subId]?.trim();
    if (!content) return;
    setSavingNote(subId);
    try {
      const res = await fetch(`/api/admin/contact/${subId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const note = await res.json();
        patchSubmission(accountId, subId, {
          notes: [...(fullData[accountId]?.contactSubmissions.find((s) => s.id === subId)?.notes ?? []), note],
        });
        setNoteInputs((p) => ({ ...p, [subId]: '' }));
      }
    } finally {
      setSavingNote(null);
    }
  };

  const handleDeleteNote = async (accountId: string, subId: string, noteId: string) => {
    const res = await fetch(`/api/admin/contact/${subId}/notes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    });
    if (res.ok) {
      const sub = fullData[accountId]?.contactSubmissions.find((s) => s.id === subId);
      if (sub) patchSubmission(accountId, subId, { notes: sub.notes.filter((n) => n.id !== noteId) });
    }
  };

  // ─── Bulk apply ───────────────────────────────────────────────────────────

  const handleBulkApply = async () => {
    if (selected.size === 0 || !bulkNewsletter) return;
    setApplyingBulk(true);
    try {
      const newsletter = bulkNewsletter === 'subscribe';
      const ids = Array.from(selected);
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/accounts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newsletter }),
          }),
        ),
      );
      setAccounts((prev) =>
        prev.map((a) => (selected.has(a.id) ? { ...a, newsletter } : a)),
      );
      setSelected(new Set());
      setBulkNewsletter('');
    } finally {
      setApplyingBulk(false);
    }
  };

  // ─── Export / Import ──────────────────────────────────────────────────────

  const handleExport = async () => {
    const toExport = selected.size > 0
      ? filtered.filter((a) => selected.has(a.id))
      : filtered;
    if (toExport.length === 0) return;
    setExporting(true);
    try {
      await exportAccountsToExcel(
        toExport,
        `accounts-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
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
      const { parseAccountExcelFile } = await import('./accountExcel');
      const rows = await parseAccountExcelFile(file);
      if (rows.length === 0) { setImportResult('No valid rows (need id column).'); return; }
      const updates = rows.filter((r) => r.id).map((r) => ({
        id: r.id,
        newsletter: r.newsletter?.toLowerCase() === 'yes',
      }));
      let updatedCount = 0;
      for (const u of updates) {
        const res = await fetch(`/api/admin/accounts/${u.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newsletter: u.newsletter }),
        });
        if (res.ok) updatedCount++;
      }
      setAccounts((prev) =>
        prev.map((a) => { const u = updates.find((x) => x.id === a.id); return u ? { ...a, newsletter: u.newsletter } : a; })
      );
      setImportResult(`Updated ${updatedCount} of ${updates.length} accounts.`);
    } catch (err) {
      setImportResult(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const googleCount = accounts.filter((a) => a.googleId).length;
  const newsletterCount = accounts.filter((a) => a.newsletter).length;

  return (
    <div className="mt-6 space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200">
          {accounts.length} total
        </span>
        {newsletterCount > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-200">
            <Bell className="h-3.5 w-3.5" /> {newsletterCount} subscribed
          </span>
        )}
        {googleCount > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-200">
            <Globe className="h-3.5 w-3.5" /> {googleCount} Google sign-in
          </span>
        )}
      </div>

      <AccountFilters filters={filters} onFiltersChange={setFilters} resultCount={filtered.length} />

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
            value={bulkNewsletter}
            onChange={(e) => setBulkNewsletter(e.target.value)}
            className="h-8 rounded border border-gray-300 bg-white px-2 text-sm"
          >
            <option value="">Newsletter…</option>
            <option value="subscribe">Subscribe</option>
            <option value="unsubscribe">Unsubscribe</option>
          </select>
          <button
            type="button"
            onClick={handleBulkApply}
            disabled={applyingBulk || !bulkNewsletter}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {applyingBulk ? 'Applying…' : 'Apply'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            <Download className="inline h-3.5 w-3.5 mr-1" />
            Export selected
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

      {/* Account cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          No accounts match the current filters.
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

          {filtered.map((account) => {
            const isExpanded = expanded === account.id;
            const isLoading = loadingId === account.id;
            const full = fullData[account.id];
            const isEditingAccount = editingAccount === account.id;
            const fullName = [account.name, account.lastName].filter(Boolean).join(' ') || '—';

            return (
              <div key={account.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* ── Account row ── */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-2xl"
                  onClick={() => handleExpand(account.id)}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(account.id)}
                    onChange={() => toggleSelect(account.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded accent-blue-600 shrink-0"
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{fullName}</p>
                      {account.googleId && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Google</span>
                      )}
                      {account.newsletter && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Newsletter</span>
                      )}
                    </div>
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 truncate mt-0.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> {account.email}
                    </p>
                    {account.phone && (
                      <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" /> {account.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(account.createdAt).toLocaleDateString()}
                    </span>
                    {isLoading
                      ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      : isExpanded
                        ? <ChevronUp className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />
                    }
                  </div>
                </div>

                {/* ── Expanded panel ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-5 space-y-6">
                    {isLoading || !full ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading account details…
                      </div>
                    ) : (
                      <>
                        {/* ── Account details section ── */}
                        <section>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Details</h3>
                            {!isEditingAccount && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); startEditAccount(account); }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                            )}
                          </div>

                          {accountMsg && (
                            <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${accountMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {accountMsg.text}
                            </div>
                          )}

                          {isEditingAccount ? (
                            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                  { key: 'email', label: 'Email', type: 'email' },
                                  { key: 'name', label: 'First name', type: 'text' },
                                  { key: 'lastName', label: 'Last name', type: 'text' },
                                  { key: 'phone', label: 'Phone', type: 'tel' },
                                ].map(({ key, label, type }) => (
                                  <div key={key}>
                                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                                    <input
                                      type={type}
                                      value={(accountForm as Record<string, string>)[key] ?? ''}
                                      onChange={(e) => setAccountForm((f) => ({ ...f, [key]: e.target.value }))}
                                      className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
                                    />
                                  </div>
                                ))}
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">New password</label>
                                  <input
                                    type="password"
                                    placeholder="Min 8 chars (leave blank to keep)"
                                    value={accountForm.newPassword}
                                    onChange={(e) => setAccountForm((f) => ({ ...f, newPassword: e.target.value }))}
                                    className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
                                  />
                                </div>
                              </div>
                              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={accountForm.newsletter}
                                  onChange={(e) => setAccountForm((f) => ({ ...f, newsletter: e.target.checked }))}
                                  className="h-3.5 w-3.5 accent-emerald-600"
                                />
                                Newsletter / updates
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveAccount(account.id)}
                                  disabled={savingAccount}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {savingAccount ? 'Saving…' : 'Save changes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingAccount(null); setAccountMsg(null); }}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                              <div><p className="text-xs text-gray-400">Email</p><a href={`mailto:${account.email}`} className="text-emerald-600 hover:underline">{account.email}</a></div>
                              <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700">{fullName}</p></div>
                              {account.phone && <div><p className="text-xs text-gray-400">Phone</p><p className="text-gray-700">{account.phone}</p></div>}
                              <div><p className="text-xs text-gray-400">Newsletter</p><p className="font-medium text-gray-700">{account.newsletter ? 'Subscribed' : 'Not subscribed'}</p></div>
                              <div><p className="text-xs text-gray-400">Auth</p><p className="text-gray-700">{account.googleId ? 'Google' : 'Email / Password'}</p></div>
                              <div><p className="text-xs text-gray-400">Created</p><p className="text-gray-700">{new Date(account.createdAt).toLocaleDateString()}</p></div>
                            </div>
                          )}
                        </section>

                        {/* ── Contact submissions section ── */}
                        <section className="border-t border-gray-100 pt-5">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Contact Submissions ({full.contactSubmissions.length})
                          </h3>
                          {full.contactSubmissions.length === 0 ? (
                            <p className="text-sm text-gray-400">No contact submissions from this customer.</p>
                          ) : (
                            <div className="space-y-2">
                              {full.contactSubmissions.map((sub) => {
                                const statusCfg = CONTACT_STATUS_CONFIG[sub.status as keyof typeof CONTACT_STATUS_CONFIG] ?? CONTACT_STATUS_CONFIG.NEW;
                                const isSubExpanded = expandedContact === sub.id;
                                const isSubEditing = editingContact === sub.id;

                                return (
                                  <div key={sub.id} className={`rounded-xl border ${!sub.read ? 'border-blue-200' : 'border-gray-200'} bg-gray-50`}>
                                    {/* Sub header */}
                                    <div
                                      className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                                      onClick={() => setExpandedContact(isSubExpanded ? null : sub.id)}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          {!sub.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                                          <p className="font-medium text-sm text-gray-900 truncate">{sub.subject}</p>
                                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border ${statusCfg.color}`}>
                                            {statusCfg.label}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{sub.message}</p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-gray-400">
                                          {new Date(sub.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-gray-400 text-xs">{isSubExpanded ? '▲' : '▼'}</span>
                                      </div>
                                    </div>

                                    {/* Status buttons */}
                                    <div className="flex gap-1.5 px-4 pb-2 -mt-1">
                                      {(['NEW', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                                        <button
                                          key={st}
                                          type="button"
                                          onClick={() => handleContactStatus(account.id, sub.id, st)}
                                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all ${sub.status === st ? CONTACT_STATUS_CONFIG[st].color : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}
                                        >
                                          {CONTACT_STATUS_CONFIG[st].label}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Expanded submission panel */}
                                    {isSubExpanded && (
                                      <div className="border-t border-gray-100 px-4 py-4 space-y-4 text-sm bg-white rounded-b-xl">
                                        {isSubEditing ? (
                                          /* Edit form */
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
                                                    value={(contactEditForm as Record<string, string>)[key] ?? ''}
                                                    onChange={(e) => setContactEditForm((f) => ({ ...f, [key]: e.target.value }))}
                                                    className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                                  />
                                                </div>
                                              ))}
                                              <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Subject</label>
                                                <select
                                                  value={contactEditForm.subject ?? ''}
                                                  onChange={(e) => setContactEditForm((f) => ({ ...f, subject: e.target.value }))}
                                                  className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                                >
                                                  {CONTACT_SUBJECTS.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                  ))}
                                                  {contactEditForm.subject && !CONTACT_SUBJECTS.includes(contactEditForm.subject as typeof CONTACT_SUBJECTS[number]) && (
                                                    <option value={contactEditForm.subject}>{contactEditForm.subject}</option>
                                                  )}
                                                </select>
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-xs text-gray-500 mb-1 block">Message</label>
                                              <textarea
                                                rows={4}
                                                value={contactEditForm.message ?? ''}
                                                onChange={(e) => setContactEditForm((f) => ({ ...f, message: e.target.value }))}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
                                              />
                                            </div>
                                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={contactEditForm.marketingConsent ?? false}
                                                onChange={(e) => setContactEditForm((f) => ({ ...f, marketingConsent: e.target.checked }))}
                                                className="h-3.5 w-3.5 accent-emerald-600"
                                              />
                                              Marketing consent
                                            </label>
                                            <div className="flex gap-2">
                                              <button
                                                type="button"
                                                onClick={() => handleSaveContact(account.id, sub.id)}
                                                disabled={savingContact}
                                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                              >
                                                {savingContact ? 'Saving…' : 'Save changes'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingContact(null)}
                                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          /* View mode */
                                          <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                              <div><p className="text-gray-400">Email</p><a href={`mailto:${sub.email}`} className="text-emerald-600 hover:underline">{sub.email}</a></div>
                                              {sub.phone && <div><p className="text-gray-400">Phone</p><p className="text-gray-700">{sub.phone}</p></div>}
                                              <div><p className="text-gray-400">Subject</p><p className="text-gray-700">{sub.subject}</p></div>
                                              <div><p className="text-gray-400">Marketing</p><p className="font-medium text-gray-700">{sub.marketingConsent ? 'Yes' : 'No'}</p></div>
                                              <div><p className="text-gray-400">Notes</p><p className="font-medium text-gray-700">{sub.notes.length}</p></div>
                                            </div>
                                            <div>
                                              <p className="text-xs text-gray-400 mb-1">Message</p>
                                              <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">{sub.message}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                              <a
                                                href={`mailto:${sub.email}?subject=Re: ${encodeURIComponent(sub.subject)}`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                              >
                                                <Mail className="h-3.5 w-3.5" /> Reply
                                              </a>
                                              <button
                                                type="button"
                                                onClick={() => startEditContact(sub)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                              >
                                                <Pencil className="h-3.5 w-3.5" /> Edit
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleContactToggleRead(account.id, sub.id, sub.read)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                              >
                                                <CheckCheck className="h-3.5 w-3.5" />
                                                {sub.read ? 'Mark unread' : 'Mark as read'}
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* ── Notes ── */}
                                        <div className="border-t border-gray-100 pt-3 space-y-3">
                                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Notes ({sub.notes.length})
                                          </p>
                                          {sub.notes.map((note) => (
                                            <div key={note.id} className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                  {new Date(note.createdAt).toLocaleString()}
                                                </p>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteNote(account.id, sub.id, note.id)}
                                                className="rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                                                aria-label="Delete note"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          ))}
                                          <div className="flex gap-2">
                                            <textarea
                                              rows={2}
                                              value={noteInputs[sub.id] ?? ''}
                                              onChange={(e) => setNoteInputs((p) => ({ ...p, [sub.id]: e.target.value }))}
                                              placeholder="Add a note about how this was handled…"
                                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleAddNote(account.id, sub.id)}
                                              disabled={savingNote === sub.id || !noteInputs[sub.id]?.trim()}
                                              className="self-end rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                              <Plus className="h-3.5 w-3.5" />
                                              {savingNote === sub.id ? '…' : 'Add'}
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
                        </section>

                        {/* ── Orders section ── */}
                        <section className="border-t border-gray-100 pt-5">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Orders ({full.orders.length})
                          </h3>
                          {full.orders.length === 0 ? (
                            <p className="text-sm text-gray-400">No orders from this customer.</p>
                          ) : (
                            <div className="space-y-3">
                              {full.orders.map((order) => (
                                <div key={order.id} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div>
                                      <p className="font-semibold text-sm text-gray-900">{order.packageName}</p>
                                      <p className="text-xs text-gray-500">
                                        {order.destination && <span>{order.destination} · </span>}
                                        {order.dataAmount && <span>{order.dataAmount} · </span>}
                                        {order.validity && <span>{order.validity} · </span>}
                                        {new Date(order.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        ${Number(order.totalAmount).toFixed(2)} {order.currency.toUpperCase()}
                                      </span>
                                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                        {order.status}
                                      </span>
                                    </div>
                                  </div>
                                  {order.iccid && <p className="text-xs text-gray-600"><span className="font-medium">ICCID:</span> {order.iccid}</p>}
                                  {order.smdpAddress && <p className="text-xs text-gray-600"><span className="font-medium">SM-DP+:</span> {order.smdpAddress}</p>}
                                  {order.activationCode && <p className="text-xs text-gray-600"><span className="font-medium">Activation Code:</span> {order.activationCode}</p>}
                                  {order.errorMessage && (
                                    <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                                      <span className="font-medium">Error:</span> {order.errorMessage}
                                    </p>
                                  )}
                                  {order.paddleTransactionId && (
                                    <a
                                      href={`https://vendors.paddle.com/transactions/${order.paddleTransactionId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-1 inline-block text-xs text-emerald-600 underline"
                                    >
                                      View in Paddle ↗
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </>
                    )}
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
