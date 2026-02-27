/**
 * Excel export/import for Admin Contact Submissions.
 * Columns: id, name, email, subject, message, marketing_consent, read, date.
 */

export interface ContactExcelRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  marketing_consent: string;
  read: string;
  date: string;
}

export interface ContactForExcel {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  marketingConsent: boolean;
  read: boolean;
  createdAt: string;
}

const COLUMNS: (keyof ContactExcelRow)[] = [
  'id', 'name', 'email', 'subject', 'message', 'marketing_consent', 'read', 'date',
];

export function contactToExcelRows(items: ContactForExcel[]): ContactExcelRow[] {
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
    subject: i.subject,
    message: i.message,
    marketing_consent: i.marketingConsent ? 'yes' : 'no',
    read: i.read ? 'yes' : 'no',
    date: i.createdAt,
  }));
}

export function excelRowsToContacts(rows: ContactExcelRow[]): Array<{ id: string; read: boolean }> {
  return rows
    .filter((r) => r.id)
    .map((r) => ({
      id: r.id,
      read: r.read?.toLowerCase() === 'yes' || r.read === 'true',
    }));
}

export async function exportContactsToExcel(items: ContactForExcel[], filename = 'contact-submissions.xlsx'): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = contactToExcelRows(items);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Submissions');
  XLSX.writeFile(wb, filename);
}

export async function parseContactExcelFile(file: File): Promise<ContactExcelRow[]> {
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

  const normalizeKey = (k: string) => k.toLowerCase().replace(/\s/g, '_').trim();
  return raw.map((row) => {
    const get = (col: keyof ContactExcelRow): string => {
      const key = keys.find((k) => normalizeKey(k) === col);
      return key !== undefined ? String(row[key] ?? '') : '';
    };
    return {
      id: get('id'),
      name: get('name'),
      email: get('email'),
      subject: get('subject'),
      message: get('message'),
      marketing_consent: get('marketing_consent'),
      read: get('read'),
      date: get('date'),
    };
  });
}
