'use client';

/**
 * Sell an eSIM to a customer from the admin panel (ticket 032).
 *
 * Mounted from two places:
 *  - eSIM Packages → the package is preset, the customer is looked up here
 *  - Accounts      → the customer is preset, the package is searched here
 *
 * The price floor is the supplier cost. The server enforces it too; this only keeps
 * the admin from submitting something it will refuse.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Loader2, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';
import type { EsimPackage } from '@/lib/esimaccess';

export interface PickedPackage {
  packageCode: string;
  name: string;
  costUsd: number;
  location: string;
  meta: string;
}

export interface PickedCustomer {
  id: string;
  email: string;
  name: string;
  lastName?: string | null;
  phone?: string | null;
}

interface AccountHit {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  phone: string | null;
}

interface SaleResult {
  ok?: boolean;
  alreadyExisted?: boolean;
  pendingProfile?: boolean;
  message?: string;
  createdCustomer?: boolean;
  tempPassword?: string | null;
  order?: {
    id: string;
    orderNo: string;
    status: string;
    customerEmail: string;
    packageName: string;
    totalAmount: number;
    supplierCost: number | null;
    iccid: string | null;
  };
}

interface Props {
  presetPackage?: PickedPackage;
  presetCustomer?: PickedCustomer;
  onClose: () => void;
  /** Called after a successful sale, so the host page can refresh its data. */
  onSold?: () => void;
}

function formatVolume(bytes: number): string {
  if (bytes < 0) return 'Unlimited';
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

function toPicked(p: EsimPackage): PickedPackage {
  return {
    packageCode: p.packageCode,
    name: p.name,
    costUsd: (p.price ?? 0) / 10000,
    location: p.location || p.locationCode || '',
    meta: `${p.volume != null ? formatVolume(p.volume) : '—'} · ${p.duration ?? '—'} days`,
  };
}

const LABEL = 'block text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const FIELD =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export function InternalSaleModal({ presetPackage, presetCustomer, onClose, onSold }: Props) {
  // One key per opened modal — the database rejects a second order carrying it
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const [pkg, setPkg] = useState<PickedPackage | null>(presetPackage ?? null);
  const [catalogue, setCatalogue] = useState<EsimPackage[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [pkgQuery, setPkgQuery] = useState('');
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);

  const [customer, setCustomer] = useState<PickedCustomer | null>(presetCustomer ?? null);
  const [email, setEmail] = useState('');
  const [hits, setHits] = useState<AccountHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [price, setPrice] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [emailLocale, setEmailLocale] = useState<'he' | 'en' | 'ar'>('he');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);

  const cost = pkg?.costUsd ?? 0;
  const priceNum = parseFloat(price);
  const priceValid = Number.isFinite(priceNum) && priceNum >= cost - 0.005;
  const margin = Number.isFinite(priceNum) ? priceNum - cost : 0;

  // Price starts at cost, so the floor is also the default
  useEffect(() => {
    if (pkg && !price) setPrice(pkg.costUsd.toFixed(2));
  }, [pkg, price]);

  // Catalogue is only needed when the caller did not pick a package
  useEffect(() => {
    if (presetPackage || catalogue) return;
    setLoadingCatalogue(true);
    fetch('/api/admin/esimaccess/packages')
      .then((r) => r.json())
      .then((d: { packageList?: EsimPackage[]; balance?: number }) => {
        setCatalogue(d.packageList ?? []);
        if (typeof d.balance === 'number') setBalance(d.balance);
      })
      .catch(() => setCatalogue([]))
      .finally(() => setLoadingCatalogue(false));
  }, [presetPackage, catalogue]);

  // Email lookup, debounced like the orders search
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookup = useCallback((value: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length < 2) {
      setHits([]);
      setSearched(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/accounts?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setHits(Array.isArray(data.accounts) ? data.accounts : []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
        setSearched(true);
      }
    }, 350);
  }, []);

  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);

  const filteredPackages = useMemo(() => {
    if (!catalogue) return [];
    const q = pkgQuery.trim().toLowerCase();
    if (!q) return catalogue.slice(0, 30);
    return catalogue
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.locationCode?.toLowerCase().includes(q) ||
          p.packageCode?.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [catalogue, pkgQuery]);

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const customerReady = Boolean(customer) || (emailLooksValid && (!creating || (newName.trim() && newPhone.trim())));
  const canSubmit = Boolean(pkg) && customerReady && priceValid && !submitting;

  async function submit() {
    if (!pkg) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          packageCode: pkg.packageCode,
          ...(customer
            ? { customerId: customer.id }
            : {
                email: email.trim(),
                ...(creating
                  ? { name: newName.trim(), lastName: newLastName.trim() || undefined, phone: newPhone.trim() }
                  : {}),
              }),
          priceToCustomer: parseFloat(parseFloat(price).toFixed(2)),
          paymentNote: paymentNote.trim() || undefined,
          emailLocale,
        }),
      });
      const data: SaleResult & { error?: string; message?: string } = await res.json();

      if (res.status === 404 && data.error === 'CUSTOMER_NOT_FOUND') {
        setCreating(true);
        setError(`${data.message ?? 'No account for this email.'} Fill in a name and phone to create one.`);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'The sale failed.');
        return;
      }
      setResult(data);
      onSold?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success / pending panel ────────────────────────────────
  if (result?.order) {
    const o = result.order;
    return (
      <Shell onClose={onClose} title="eSIM sold">
        <div className="space-y-3">
          <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${result.pendingProfile ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
            {result.pendingProfile
              ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
            <p className="text-sm text-gray-700">
              {result.alreadyExisted
                ? 'This sale was already submitted — showing the order it created.'
                : result.pendingProfile
                  ? result.message
                  : `${o.packageName} is now on ${o.customerEmail}'s account, and the QR email is on its way.`}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Row label="Order" value={o.orderNo.slice(0, 18)} mono />
            <Row label="Status" value={o.status} />
            <Row label="Charged" value={`$${o.totalAmount.toFixed(2)}`} />
            <Row label="Cost" value={o.supplierCost != null ? `$${o.supplierCost.toFixed(2)}` : '—'} />
            {o.iccid && <Row label="ICCID" value={o.iccid} mono />}
          </dl>

          {result.tempPassword && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">New account created</p>
              <p className="mt-1 text-sm text-gray-700">
                Temporary password, also sent by email:{' '}
                <span className="font-mono font-semibold">{result.tempPassword}</span>
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Done
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── Form ───────────────────────────────────────────────────
  return (
    <Shell onClose={onClose} title="Sell an eSIM to a customer">
      <div className="space-y-4">
        {/* Package */}
        <section>
          <p className={LABEL}>Package</p>
          {pkg ? (
            <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{pkg.name}</p>
                <p className="text-xs text-gray-500">{pkg.location} · {pkg.meta}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-orange-600">${pkg.costUsd.toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">cost</p>
              </div>
              {!presetPackage && (
                <button type="button" onClick={() => { setPkg(null); setPrice(''); }} className="text-xs text-gray-400 hover:text-gray-600">
                  change
                </button>
              )}
            </div>
          ) : (
            <div className="mt-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={pkgQuery}
                  onChange={(e) => setPkgQuery(e.target.value)}
                  placeholder="Search by country, name or package code"
                  className={`${FIELD} pl-9`}
                />
              </div>
              <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-gray-200">
                {loadingCatalogue ? (
                  <p className="px-3 py-3 text-sm text-gray-400">Loading packages…</p>
                ) : filteredPackages.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-gray-400">No matching package.</p>
                ) : (
                  filteredPackages.map((p) => (
                    <button
                      key={p.packageCode}
                      type="button"
                      onClick={() => setPkg(toPicked(p))}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-emerald-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-gray-800">{p.name}</span>
                        <span className="block text-xs text-gray-500">
                          {p.location} · {p.volume != null ? formatVolume(p.volume) : '—'} · {p.duration} days
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-orange-600">
                        ${((p.price ?? 0) / 10000).toFixed(2)}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {balance !== null && (
                <p className="mt-1 text-[11px] text-gray-400">eSIMaccess balance: ${balance.toFixed(2)}</p>
              )}
            </div>
          )}
        </section>

        {/* Customer */}
        <section>
          <p className={LABEL}>Customer</p>
          {customer ? (
            <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {[customer.name, customer.lastName].filter(Boolean).join(' ') || customer.email}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {customer.email}{customer.phone ? ` · ${customer.phone}` : ''}
                </p>
              </div>
              {!presetCustomer && (
                <button type="button" onClick={() => setCustomer(null)} className="shrink-0 text-xs text-gray-400 hover:text-gray-600">
                  change
                </button>
              )}
            </div>
          ) : (
            <div className="mt-1 space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setCreating(false); lookup(e.target.value); }}
                placeholder="customer@example.com"
                className={FIELD}
              />
              {searching && (
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" /> searching…
                </p>
              )}
              {hits.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200">
                  {hits.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => { setCustomer(h); setHits([]); }}
                      className="block w-full px-3 py-2 text-left hover:bg-emerald-50"
                    >
                      <span className="block truncate text-sm text-gray-800">
                        {[h.name, h.lastName].filter(Boolean).join(' ') || h.email}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {h.email}{h.phone ? ` · ${h.phone}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searched && !searching && hits.length === 0 && emailLooksValid && !creating && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-800">No account exists for this email.</p>
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    <UserPlus className="h-3 w-3" /> Create account
                  </button>
                </div>
              )}
              {creating && (
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={LABEL}>First name</label>
                      <input value={newName} onChange={(e) => setNewName(e.target.value)} className={FIELD} />
                    </div>
                    <div>
                      <label className={LABEL}>Last name</label>
                      <input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className={FIELD} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Phone</label>
                    <div className="mt-1">
                      <PhoneInput value={newPhone} onChange={(v) => setNewPhone(v ?? '')} />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    A temporary password is generated and emailed with the eSIM.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Money */}
        <section className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Price to customer (USD)</label>
            <input
              type="number"
              step="0.01"
              min={cost}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={FIELD}
            />
            {pkg && !priceValid && price !== '' && (
              <p className="mt-1 text-[11px] font-medium text-red-600">
                Cannot go below the ${cost.toFixed(2)} supplier cost.
              </p>
            )}
          </div>
          <div>
            <label className={LABEL}>Email language</label>
            <select
              value={emailLocale}
              onChange={(e) => setEmailLocale(e.target.value as 'he' | 'en' | 'ar')}
              className={FIELD}
            >
              <option value="he">Hebrew</option>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
        </section>

        {pkg && (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-500">Cost ${cost.toFixed(2)} → price ${Number.isFinite(priceNum) ? priceNum.toFixed(2) : '—'}</span>
            <span className={margin > 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-gray-500'}>
              {margin > 0 ? `+$${margin.toFixed(2)} margin` : 'at cost'}
            </span>
          </div>
        )}

        <div>
          <label className={LABEL}>How it was settled (optional)</label>
          <input
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="bank transfer · Bit · compensation · no charge"
            className={FIELD}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <p className="text-[11px] text-gray-400">
            The eSIM is bought from eSIMaccess — the cost leaves your balance.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Buying…' : 'Buy and assign'}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className={`text-sm text-gray-800 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</dd>
    </div>
  );
}
