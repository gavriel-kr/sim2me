'use client';

/**
 * Loads one eSIM's status for the customer's account page — once per eSIM, however often the page
 * re-renders.
 *
 * Why this is its own hook (2026-09-28): the loader used to live inside `UsageBar` with the parent's
 * `onStatusChange` callback in its effect dependencies. The parent passes that callback as an inline
 * arrow and re-renders whenever a status arrives, so every answer produced a new callback, which
 * re-ran the effect, which fetched again — about five requests a second per eSIM for as long as the
 * page stayed open, each one forwarded to the supplier. That loop got the PikaSim reseller account
 * suspended (≈1,200 requests in four minutes) and hammered eSIMaccess for every customer since May.
 *
 * The callback is therefore read through a ref: it never restarts the load. Only a different eSIM
 * (`orderId`, `iccid`) does.
 */

import { useEffect, useRef, useState } from 'react';

export interface UsageResponse {
  usage?: {
    esimStatus: string | null;
    smdpStatus: string | null;
    orderVolume: number | null;
    usedVolume: number | null;
    remainingVolume: number | null;
    expiredTime: string | null;
    activateTime: string | null;
    totalDuration: number | null;
    durationUnit: string | null;
  } | null;
  phonePlan?: boolean;
  phoneNumber?: string | null;
  renewable?: boolean;
}

export type UsageState = { status: 'loading' } | { status: 'done'; data: UsageResponse | null };

/**
 * `onLoaded` is called once per load with the response (or null on failure). It may be a new
 * function on every render; that does not trigger another request.
 */
export function useEsimUsage(
  orderId: string,
  iccid: string,
  onLoaded?: (data: UsageResponse | null) => void,
): UsageState {
  const [state, setState] = useState<UsageState>({ status: 'loading' });
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetch(`/api/account/esims/usage?iccid=${encodeURIComponent(iccid)}&orderId=${encodeURIComponent(orderId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data: UsageResponse | null) => {
        if (cancelled) return;
        setState({ status: 'done', data });
        onLoadedRef.current?.(data);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, iccid]);

  return state;
}
