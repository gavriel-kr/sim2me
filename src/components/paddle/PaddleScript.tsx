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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaddleScript.tsx:usePaddle-mount',message:'usePaddle mounted',data:{windowPaddleExists:!!window.Paddle,windowPaddleCheckoutExists:!!(window.Paddle?.Checkout)},timestamp:Date.now(),hypothesisId:'B1+B2+B3'})}).catch(()=>{});
    // #endregion
    if (window.Paddle) {
      setReady(true);
      return;
    }
    const t = setInterval(() => {
      if (window.Paddle) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaddleScript.tsx:usePaddle-poll',message:'Paddle detected by poll',data:{checkoutExists:!!(window.Paddle?.Checkout)},timestamp:Date.now(),hypothesisId:'B2'})}).catch(()=>{});
        // #endregion
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
        console.error('Paddle not loaded');
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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaddleScript.tsx:PaddleScript-render',message:'PaddleScript rendered',data:{tokenExists:!!token,tokenPrefix:token?token.slice(0,9):'MISSING'},timestamp:Date.now(),hypothesisId:'B1'})}).catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // #endregion

  if (!token) return null;

  return (
    <Script
      src={PADDLE_CDN}
      strategy="afterInteractive"
      onLoad={() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaddleScript.tsx:onLoad',message:'Paddle CDN script loaded',data:{paddleExists:!!window.Paddle,token:token?token.slice(0,9):'MISSING'},timestamp:Date.now(),hypothesisId:'B2'})}).catch(()=>{});
        // #endregion
        if (typeof window !== 'undefined' && window.Paddle && token) {
          try {
            window.Paddle.Initialize({
              token,
              eventCallback: (e) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaddleScript.tsx:eventCallback',message:'Paddle event',data:{name:e.name,hasTransactionId:!!e.data?.transaction_id},timestamp:Date.now(),hypothesisId:'B3'})}).catch(()=>{});
                // #endregion
                if (e.name === 'checkout.completed' && e.data?.transaction_id) {
                  const cb = (window as unknown as { __paddleOnComplete?: (id: string) => void }).__paddleOnComplete;
                  if (cb) cb(e.data.transaction_id);
                }
              },
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaddleScript.tsx:Initialize-success',message:'Paddle.Initialize called successfully',data:{checkoutExists:!!(window.Paddle?.Checkout)},timestamp:Date.now(),hypothesisId:'B3'})}).catch(()=>{});
            // #endregion
          } catch(err) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaddleScript.tsx:Initialize-error',message:'Paddle.Initialize threw',data:{error:String(err)},timestamp:Date.now(),hypothesisId:'B3'})}).catch(()=>{});
            // #endregion
          }
        }
      }}
      onError={() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaddleScript.tsx:onError',message:'Paddle CDN script FAILED to load',data:{src:PADDLE_CDN},timestamp:Date.now(),hypothesisId:'B2'})}).catch(()=>{});
        // #endregion
      }}
    />
  );
}
