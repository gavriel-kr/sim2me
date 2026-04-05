'use client';

import { useRouter } from 'next/navigation';

interface LogEntry {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ip: string | null;
  createdAt: Date;
}

interface Props {
  logs: LogEntry[];
  total: number;
  page: number;
  pages: number;
}

function formatDate(d: Date) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function actionColor(action: string) {
  if (action.startsWith('DELETE')) return 'bg-red-100 text-red-800';
  if (action.startsWith('CREATE')) return 'bg-green-100 text-green-800';
  if (action.startsWith('UPDATE') || action.startsWith('BULK') || action.startsWith('UPSERT') || action.startsWith('APPLY')) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
}

export function AuditLogClient({ logs, total, page, pages }: Props) {
  const router = useRouter();

  return (
    <div className="mt-6">
      <p className="mb-3 text-sm text-gray-500">{total} total entries</p>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Admin</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Target</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Details</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit log entries yet</td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-xs">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-2">
                  <p className="font-medium text-gray-900">{log.adminName}</p>
                  <p className="text-xs text-gray-500">{log.adminEmail}</p>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${actionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {log.targetType && <span className="font-medium">{log.targetType}</span>}
                  {log.targetId && <span className="block text-xs text-gray-500">{log.targetId}</span>}
                </td>
                <td className="px-4 py-2 text-xs text-gray-600 max-w-xs truncate" title={log.details ?? ''}>
                  {log.details}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">{log.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => router.push(`/admin/audit-log?page=${page - 1}`)}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => router.push(`/admin/audit-log?page=${page + 1}`)}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
