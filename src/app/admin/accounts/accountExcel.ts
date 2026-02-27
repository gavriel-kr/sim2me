/**
 * Excel export/import for Admin Accounts.
 * Columns: id, name, last_name, email, phone, newsletter, google_auth, date.
 */

export interface AccountExcelRow {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone: string;
  newsletter: string;
  google_auth: string;
  date: string;
}

export interface AccountForExcel {
  id: string;
  name: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  googleId: string | null;
  newsletter: boolean;
  createdAt: string;
}

const COLUMNS: (keyof AccountExcelRow)[] = [
  'id', 'name', 'last_name', 'email', 'phone', 'newsletter', 'google_auth', 'date',
];

export function accountToExcelRows(items: AccountForExcel[]): AccountExcelRow[] {
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    last_name: i.lastName ?? '',
    email: i.email,
    phone: i.phone ?? '',
    newsletter: i.newsletter ? 'yes' : 'no',
    google_auth: i.googleId ? 'yes' : 'no',
    date: i.createdAt,
  }));
}

export async function exportAccountsToExcel(
  items: AccountForExcel[],
  filename = 'accounts.xlsx',
): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = accountToExcelRows(items);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Accounts');
  XLSX.writeFile(wb, filename);
}

export async function parseAccountExcelFile(file: File): Promise<AccountExcelRow[]> {
  const buf = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'array' });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
  if (raw.length === 0) return [];
  const first = raw[0];
  const keys = Object.keys(first);
  const hasId = keys.some((k) => k.toLowerCase().trim() === 'id');
  if (!hasId) return [];

  const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s-]/g, '_').trim();
  return raw.map((row) => {
    const get = (col: string): string => {
      const key = keys.find((k) => normalizeKey(k) === col);
      return key !== undefined ? String(row[key] ?? '') : '';
    };
    return {
      id: get('id'),
      name: get('name'),
      last_name: get('last_name'),
      email: get('email'),
      phone: get('phone'),
      newsletter: get('newsletter'),
      google_auth: get('google_auth'),
      date: get('date'),
    };
  });
}
