/**
 * SOURCE OF TRUTH: API base URL and auth endpoints for the app.
 * All API credentials (token) are obtained via login and stored in the auth store.
 * This file mirrors the web backend (sim2me.net) — same accounts, same API.
 */

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
const envBase = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;

/** Base URL for the sim2me web backend (no trailing slash) */
export const API_BASE_URL =
  envBase?.replace(/\/$/, '') ||
  extra?.apiBaseUrl?.replace(/\/$/, '') ||
  'https://www.sim2me.net';

/** Auth: get JWT for mobile/app (same secret as NextAuth on web) */
export const AUTH_TOKEN_PATH = '/api/auth/token';

/** Account: register (same as web) */
export const ACCOUNT_REGISTER_PATH = '/api/account/register';

/** Account: profile (requires Authorization: Bearer) */
export const ACCOUNT_PROFILE_PATH = '/api/account/profile';

/** Account: orders list (requires Authorization: Bearer) */
export const ACCOUNT_ORDERS_PATH = '/api/account/orders';

/** Account: eSIM usage by ICCID (requires Authorization: Bearer). Query: iccid, orderId */
export const ACCOUNT_ESIMS_USAGE_PATH = '/api/account/esims/usage';
