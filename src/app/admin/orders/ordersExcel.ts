/**
 * Excel export/import for Admin Orders.
 * Columns: order_id, customer_name, customer_email, package_details, country_code, price, status, date.
 */

export interface OrderExcelRow {
  order_id: string;
  customer_name: string;
  customer_email: string;
  package_details: string;
  country_code: string;
  price: number;
  status: string;
  date: string;
}

export interface OrderForExcel {
  orderNo: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const COLUMNS: (keyof OrderExcelRow)[] = [
  'order_id',
  'customer_name',
  'customer_email',
  'package_details',
  'country_code',
  'price',
  'status',
  'date',
];

export function ordersToExcelRows(orders: OrderForExcel[]): OrderExcelRow[] {
  return orders.map((o) => ({
    order_id: o.orderNo,
    customer_name: o.customerName,
    customer_email: o.customerEmail,
    package_details: o.packageName,
    country_code: o.destination,
    price: o.totalAmount,
    status: o.status,
    date: o.createdAt,
  }));
}

export function excelRowsToOrders(rows: OrderExcelRow[]): Array<Partial<OrderForExcel> & { order_id: string }> {
  return rows.map((r) => ({
    order_id: r.order_id,
    orderNo: r.order_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    packageName: r.package_details,
    destination: r.country_code,
    totalAmount: Number(r.price),
    status: r.status,
    createdAt: r.date,
  }));
}

/** Export filtered orders to .xlsx and trigger download */
export async function exportOrdersToExcel(orders: OrderForExcel[], filename = 'orders.xlsx'): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = ordersToExcelRows(orders);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Orders');
  XLSX.writeFile(wb, filename);
}

/** Parse .xlsx file and return rows with expected columns; validates header row */
export async function parseOrdersExcelFile(file: File): Promise<OrderExcelRow[]> {
  const buf = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'array' });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
  if (raw.length === 0) return [];
  const first = raw[0];
  const keys = Object.keys(first);
  const hasOrderId =
    keys.some((k) => k.toLowerCase().replace(/\s/g, '_') === 'order_id') ||
    keys.includes('order_id');
  if (!hasOrderId) return [];

  const normalizeKey = (k: string): string =>
    k.toLowerCase().replace(/\s/g, '_').trim();
  const rows: OrderExcelRow[] = raw.map((row) => {
    const get = (col: keyof OrderExcelRow): string | number => {
      const key = keys.find((k) => normalizeKey(k) === col);
      if (key !== undefined && row[key] !== undefined && row[key] !== null)
        return row[key] as string | number;
      return col === 'price' ? 0 : '';
    };
    return {
      order_id: String(get('order_id')),
      customer_name: String(get('customer_name')),
      customer_email: String(get('customer_email')),
      package_details: String(get('package_details')),
      country_code: String(get('country_code')),
      price: Number(get('price')),
      status: String(get('status')),
      date: String(get('date')),
    };
  });
  return rows;
}
