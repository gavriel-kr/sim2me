/**
 * eSIMaccess API Client
 * Docs: https://docs.esimaccess.com/
 */

const BASE_URL = 'https://api.esimaccess.com/api/v1';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'RT-AccessCode': process.env.ESIMACCESS_ACCESS_CODE!,
  };
}

async function apiCall<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      ...body,
      accessCode: process.env.ESIMACCESS_ACCESS_CODE,
      secretKey: process.env.ESIMACCESS_SECRET_KEY,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eSIMaccess API error ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Types ───────────────────────────────────────────────────

export interface EsimPackage {
  packageCode: string;
  slug: string;
  name: string;
  price: number;
  currencyCode: string;
  volume: number;        // MB
  duration: number;      // days
  location: string;
  locationCode: string;
  description: string;
  speed: string;
  supportTopUp: boolean;
  retailPrice?: number;
}

export interface EsimBalance {
  success: boolean;
  balance: number;
  currencyCode: string;
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
}

// ─── API Methods ─────────────────────────────────────────────

/** Check merchant balance */
export async function getBalance(): Promise<EsimBalance> {
  return apiCall<EsimBalance>('/open/balance');
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
  return apiCall<EsimOrderResult>('/open/esim/order', {
    packageCode,
    quantity,
  });
}

/** Get eSIM profile (QR code, ICCID, etc.) after purchase */
export async function getEsimProfile(orderNo: string): Promise<{ esimList: EsimProfile[] }> {
  return apiCall<{ esimList: EsimProfile[] }>('/open/esim/query', {
    orderNo,
  });
}

/** Cancel/refund an unused eSIM order */
export async function cancelOrder(orderNo: string): Promise<{ success: boolean; message: string }> {
  return apiCall<{ success: boolean; message: string }>('/open/esim/cancel', {
    orderNo,
  });
}

// ─── Helpers ─────────────────────────────────────────────────

/** Convert MB to human-readable */
export function formatDataVolume(mb: number): string {
  if (mb < 0) return 'Unlimited';
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
  return `${mb} MB`;
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
