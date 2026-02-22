'use client';

import Link from 'next/link';
import { UserCircle, Mail, Phone, Calendar, Check, X } from 'lucide-react';

type Account = {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  emailVerified: boolean;
  newsletter: boolean;
  createdAt: string;
};

interface Props {
  accounts: Account[];
}

export function AccountsClient({ accounts }: Props) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 font-semibold text-gray-900">Account</th>
              <th className="px-5 py-3 font-semibold text-gray-900">Contact</th>
              <th className="px-5 py-3 font-semibold text-gray-900">Status</th>
              <th className="px-5 py-3 font-semibold text-gray-900">Created</th>
              <th className="px-5 py-3 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                  No customer accounts yet.
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {[a.name, a.lastName].filter(Boolean).join(' ') || '—'}
                        </p>
                        <p className="flex items-center gap-1.5 text-gray-500">
                          <Mail className="h-3.5 w-3.5" />
                          {a.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {a.phone ? (
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <Phone className="h-3.5 w-3.5" />
                        {a.phone}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {a.emailVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <Check className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <X className="h-3 w-3" /> Unverified
                        </span>
                      )}
                      {a.newsletter && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Newsletter
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/accounts/${a.id}`}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
