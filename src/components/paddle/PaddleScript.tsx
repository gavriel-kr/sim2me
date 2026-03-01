'use client';

import Script from 'next/script';
import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: { token: string; eventCallback?: (e: { name: string; data?: { transaction_id?: string } }) => void }) => void;
      Checkout?: {
        open: (opts: {
          transactionId?: string;
          items?: Array<{ priceId: string; quantity: number }>;
          customData?: Record<string, string>;
          customer?: { email?: string };
          settings?: {
            displayMode?: string;
            successUrl?: string;
            theme?: string;
            locale?: string;
          };
        }) => void;
      };
    };
  }
}

const PADDLE_CDN = 'https://cdn.paddle.com/paddle/v2/paddle.js';

export function usePaddle() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Paddle) {
      setReady(true);
      return;
    }
    const t = setInterval(() => {
      if (window.Paddle) {
        setReady(true);
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  const openCheckout = useCallback(
    (opts: {
      transactionId?: string;
      items?: Array<{ priceId: string; quantity: number }>;
      customData?: Record<string, string>;
      customerEmail?: string;
      successUrl?: string;
      onCompleted?: (transactionId: string) => void;
    }) => {
      if (typeof window === 'undefined' || !window.Paddle?.Checkout) {
        return false;
      }
      const { onCompleted, ...rest } = opts;
      if (onCompleted) {
        const prev = (window as unknown as { __paddleOnComplete?: (id: string) => void }).__paddleOnComplete;
        (window as unknown as { __paddleOnComplete?: (id: string) => void }).__paddleOnComplete = (txnId: string) => {
          if (prev) prev(txnId);
          onCompleted(txnId);
        };
      }
      const settings = {
        displayMode: 'overlay' as const,
        theme: 'light' as const,
        ...(rest.successUrl && { successUrl: rest.successUrl }),
      };
      if (rest.transactionId) {
        window.Paddle.Checkout!.open({ transactionId: rest.transactionId, settings });
      } else {
        window.Paddle.Checkout!.open({
          items: rest.items,
          customData: rest.customData,
          ...(rest.customerEmail && { customer: { email: rest.customerEmail } }),
          settings,
        });
      }
      return true;
    },
    []
  );

  return { ready, openCheckout };
}

export function PaddleScript() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  if (!token) return null;

  return (
    <Script
      src={PADDLE_CDN}
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined' && window.Paddle && token) {
          window.Paddle.Initialize({
            token,
            eventCallback: (e) => {
              if (e.name === 'checkout.completed' && e.data?.transaction_id) {
                const cb = (window as unknown as { __paddleOnComplete?: (id: string) => void }).__paddleOnComplete;
                if (cb) cb(e.data.transaction_id);
              }
            },
          });
        }
      }}
    />
  );
}
