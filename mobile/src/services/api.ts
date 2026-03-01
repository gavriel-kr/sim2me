/**
 * API client for sim2me backend. Uses @nav for base URL and auth store for token.
 */

import {
  API_BASE_URL,
  AUTH_TOKEN_PATH,
  ACCOUNT_REGISTER_PATH,
  ACCOUNT_PROFILE_PATH,
  ACCOUNT_ORDERS_PATH,
  ACCOUNT_ESIMS_USAGE_PATH,
} from '../nav';
import { useAuthStore } from '../store/authStore';

type LoginResponse = { token: string };
type RegisterResponse = { success: boolean; message?: string };
type ErrorResponse = { error?: string; details?: unknown };
type ProfileResponse = { id: string; email: string; name: string; lastName?: string | null };

async function getToken(): Promise<string | null> {
  return useAuthStore.getState().token;
}

export async function login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  const res = await fetch(`${API_BASE_URL}${AUTH_TOKEN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const data = (await res.json()) as LoginResponse & ErrorResponse;
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  if (!data.token) throw new Error('Invalid response');
  const token = data.token;
  const profileRes = await fetch(`${API_BASE_URL}${ACCOUNT_PROFILE_PATH}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!profileRes.ok) {
    const user = { id: '', email: email.trim().toLowerCase(), name: '' };
    return { token, user };
  }
  const profile = (await profileRes.json()) as ProfileResponse;
  const user = { id: profile.id, email: profile.email, name: profile.name ?? '' };
  return { token, user };
}

export async function register(params: {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  phone: string;
  newsletter?: boolean;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${ACCOUNT_REGISTER_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email.trim().toLowerCase(),
      password: params.password,
      name: params.name.trim(),
      lastName: params.lastName?.trim() || undefined,
      phone: params.phone,
      newsletter: params.newsletter ?? false,
    }),
  });
  const data = (await res.json()) as RegisterResponse & ErrorResponse;
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
}

/**
 * Authenticated fetch for account APIs. Adds Authorization: Bearer when token exists.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getToken();
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init?.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as ErrorResponse).error || res.statusText || 'Request failed');
  }
  return json as T;
}

/** Get customer orders (eSIMs). Requires auth. */
export async function getOrders(): Promise<OrderFromApi[]> {
  return apiFetch<{ orders: OrderFromApi[] }>(ACCOUNT_ORDERS_PATH).then((r) => r.orders ?? []);
}

export interface OrderFromApi {
  id: string;
  packageName: string;
  destination: string;
  dataAmount: string;
  validity: string;
  totalAmount: number;
  currency: string;
  status: string;
  iccid: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  activationCode: string | null;
  createdAt: string;
  paddleTransactionId?: string | null;
}

export interface EsimUsageFromApi {
  status: string | null;
  orderVolume: number | null;
  usedVolume: number | null;
  remainingVolume: number | null;
  expiredTime: number | null;
}

/** Get eSIM usage for an order. Requires auth. */
export async function getEsimUsage(iccid: string, orderId: string): Promise<EsimUsageFromApi | null> {
  const params = new URLSearchParams({ iccid, orderId });
  const res = await apiFetch<{ usage: EsimUsageFromApi | null }>(
    `${ACCOUNT_ESIMS_USAGE_PATH}?${params.toString()}`
  );
  return res.usage ?? null;
}

export { API_BASE_URL };
