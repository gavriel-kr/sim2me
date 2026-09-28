'use client';

/**
 * Ticket 042 — renew a customer's US / global number from the admin order view.
 *
 * Lists what PikaSim can add to this eSIM with our cost and price, then hands the chosen renewal to
 * the internal-sale modal with the customer already filled in. The renewal is paid from the PikaSim
 * wallet and keeps the same number; the customer gets a "renewed, number kept" email.
 */

import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { InternalSaleModal, type PickedPackage, type PickedCustomer } from '@/components/admin/InternalSaleModal';

interface RenewalData {
  renewable: boolean;
  phoneNumber: string | null;
  expireTime: string | null;
  expireExact?: boolean;
  installedOn?: string | null;
  daysLeft: number | null;
  customer: { id: string | null; email: string; name: string };
  options: { id: string; name: string; dataGb: number; days: number; priceUsd: number; costUsd: number }[];
}

export function RenewPhoneButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<RenewalData | null>(null);
  const [sale, setSale] = useState<{ pkg: PickedPackage; customer: PickedCustomer | undefined } | null>(null);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || data) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/renewal`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
      >
        <RefreshCw className="h-3 w-3" /> Renew (keep number)
      </button>
      {open && (
        <div className="mt-1.5 space-y-1 rounded-md border border-gray-200 bg-white p-2 text-xs">
          {loading && (
            <p className="flex items-center gap-1 text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading renewal options…
            </p>
          )}
          {error && <p className="text-red-600">{error}</p>}
          {data && (
            <>
              <p className="text-gray-600">
                {data.expireTime
                  ? `Ends ${new Date(data.expireTime).toLocaleDateString('en-GB', { timeZone: 'UTC' })}${data.expireExact ? ` (installed ${data.installedOn})` : ' at the earliest (from the purchase date; the customer has not given an installation date)'}`
                  : 'End date unknown'}
                {data.daysLeft != null && ` · ${data.daysLeft} days left`}
              </p>
              {!data.renewable ? (
                <p className="text-gray-600">This number cannot be renewed (only US and global numbers can; the order must be completed and installed).</p>
              ) : data.options.length === 0 ? (
                <p className="text-gray-600">PikaSim returned no renewal options for this eSIM.</p>
              ) : (
                data.options.map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-1">
                    <span>
                      {o.dataGb}GB · {o.days}d · cost ${o.costUsd.toFixed(2)} · price ${o.priceUsd.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSale({
                          pkg: {
                            packageCode: o.id,
                            name: `Renewal · ${o.name}`,
                            costUsd: o.costUsd,
                            location: data.phoneNumber ?? 'phone number',
                            meta: `${o.dataGb}GB · ${o.days} days · same number`,
                          },
                          customer: data.customer.id
                            ? { id: data.customer.id, email: data.customer.email, name: data.customer.name }
                            : undefined,
                        })
                      }
                      className="rounded bg-emerald-600 px-2 py-0.5 font-semibold text-white hover:bg-emerald-700"
                    >
                      Sell renewal
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
      {sale && (
        <InternalSaleModal presetPackage={sale.pkg} presetCustomer={sale.customer} onClose={() => setSale(null)} onSold={() => setSale(null)} />
      )}
    </div>
  );
}
