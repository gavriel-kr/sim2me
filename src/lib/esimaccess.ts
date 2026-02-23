/**
 * eSIMaccess API Client
 * Docs: https://docs.esimaccess.com/
 * Endpoints discovered from Postman collection.
 */

const BASE_URL = 'https://api.esimaccess.com/api/v1';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'RT-AccessCode': process.env.ESIMACCESS_ACCESS_CODE!,
  };
}

interface ApiResponse<T> {
  success: boolean;
  errorCode: string | null;
  errorMsg: string | null;
  obj: T;
}

async function apiCall<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : '',
  });

  const json = await res.json() as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(`eSIMaccess API error: ${json.errorMsg || res.statusText}`);
  }

  return json.obj;
}

// ─── Types ───────────────────────────────────────────────────

export interface EsimPackage {
  packageCode: string;
  slug: string;
  name: string;
  price: number;          // in cents (USD)
  currencyCode: string;
  volume: number;          // in bytes
  duration: number;        // days
  durationUnit: string;
  location: string;
  locationCode: string;
  description: string;
  speed: string;
  supportTopUpType: number;
  retailPrice?: number;    // in cents (USD)
  favorite: boolean;
  activeType: number;
  locationNetworkList?: { locationCode: string; locationName: string; operatorList: { operatorName: string }[] }[];
}

export interface EsimBalance {
  balance: number;         // in cents (USD)
}

export interface EsimOrderResult {
  success: boolean;
  orderNo: string;
  transactionId: string;
  message?: string;
}

export interface EsimProfile {
  iccid: string;
  smdpAddress: string;
  activationCode: string;
  qrCodeUrl: string;
  status: string;
  // Usage data (returned by esim/query when available)
  orderVolume?: number;    // bytes ordered
  usedVolume?: number;     // bytes used
  remainingVolume?: number; // bytes remaining
  expiredTime?: number;    // unix timestamp ms
}

// ─── API Methods ─────────────────────────────────────────────

/** Check merchant balance */
export async function getBalance(): Promise<EsimBalance> {
  return apiCall<EsimBalance>('/open/balance/query');
}

/** List all available packages (optionally filter by location) */
export async function getPackages(locationCode?: string): Promise<{ packageList: EsimPackage[] }> {
  return apiCall<{ packageList: EsimPackage[] }>('/open/package/list', {
    locationCode: locationCode || '',
    type: '',
  });
}

/** Get packages for a specific location */
export async function getPackagesByLocation(locationCode: string): Promise<EsimPackage[]> {
  const result = await getPackages(locationCode);
  return result.packageList || [];
}

/** Purchase an eSIM package */
export async function purchasePackage(packageCode: string, quantity: number = 1): Promise<EsimOrderResult> {
  const transactionId = `sim2me-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return apiCall<EsimOrderResult>('/open/esim/order', {
    transactionId,
    packageInfoList: [{ packageCode, count: quantity }],
  });
}

/** Get eSIM profile (QR code, ICCID, etc.) after purchase */
export async function getEsimProfile(orderNo: string): Promise<{ esimList: EsimProfile[] }> {
  return apiCall<{ esimList: EsimProfile[] }>('/open/esim/query', {
    orderNo,
    pager: { pageNum: 1, pageSize: 10 },
  });
}

/** Query eSIM usage by ICCID */
export async function getEsimUsage(iccid: string): Promise<EsimProfile | null> {
  try {
    const result = await apiCall<{ esimList: EsimProfile[] }>('/open/esim/query', {
      iccid,
      pager: { pageNum: 1, pageSize: 1 },
    });
    return result?.esimList?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Cancel/refund an unused eSIM order */
export async function cancelOrder(orderNo: string): Promise<{ success: boolean; message: string }> {
  return apiCall<{ success: boolean; message: string }>('/open/esim/cancel', {
    orderNo,
  });
}

// ─── Helpers ─────────────────────────────────────────────────

/** Convert bytes to human-readable */
export function formatDataVolume(bytes: number): string {
  if (bytes < 0) return 'Unlimited';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  return `${bytes} B`;
}

/** Convert price from cents to dollars */
export function formatPrice(cents: number): string {
  return `$${(cents / 10000).toFixed(2)}`;
}

/** Group packages by location for the destinations page */
export function groupPackagesByLocation(packages: EsimPackage[]): Map<string, EsimPackage[]> {
  const map = new Map<string, EsimPackage[]>();
  for (const pkg of packages) {
    const key = pkg.locationCode || pkg.location;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(pkg);
  }
  return map;
}
