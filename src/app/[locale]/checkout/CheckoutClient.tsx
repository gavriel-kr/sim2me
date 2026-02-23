'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { travelerInfoSchema, type TravelerInfoForm } from '@/lib/validation/schemas';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { usePaddle } from '@/components/paddle/PaddleScript';
import { useToast } from '@/hooks/useToast';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

type Step = 'cart' | 'traveler' | 'payment';

export function CheckoutClient() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const setTravelerInfo = useCartStore((s) => s.setTravelerInfo);
  const { ready: paddleReady, openCheckout } = usePaddle();

  const [step, setStep] = useState<Step>('cart');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TravelerInfoForm>({
    resolver: zodResolver(travelerInfoSchema),
  });

  const onTravelerSubmit = (data: TravelerInfoForm) => {
    setTravelerInfo({ email: data.email, firstName: data.firstName, lastName: data.lastName });
    setStep('payment');
  };

  const onPayWithPaddle = async () => {
    const travelerData = useCartStore.getState().travelerInfo;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckoutClient.tsx:onPayWithPaddle-entry',message:'Pay now clicked',data:{hasTravelerInfo:!!travelerData,travelerEmail:travelerData?.email||null,itemsCount:items.length,paddleReady,firstItemPlanId:items[0]?.planId||null,firstItemPrice:items[0]?.plan?.price||null},timestamp:Date.now(),hypothesisId:'A+B+E'})}).catch(()=>{});
    // #endregion

    if (!travelerData?.email || !items.length) {
      setPaymentError(t('emailRequired') || 'Please enter your details first.');
      return;
    }
    if (items.length > 1) {
      setPaymentError(t('singlePlanOnly') || 'Please purchase one plan at a time.');
      return;
    }
    setPaymentError(null);
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/checkout/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            planId: i.planId,
            quantity: i.quantity,
            unitPrice: i.plan.price,
            planName: i.plan.name || `${i.destinationName} eSIM`,
          })),
          customerEmail: travelerData.email,
          customerName: [travelerData.firstName, travelerData.lastName].filter(Boolean).join(' ').trim() || undefined,
        }),
      });
      const data = await res.json();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckoutClient.tsx:after-create-transaction',message:'API response',data:{status:res.status,ok:res.ok,mode:data?.mode,transactionId:data?.transactionId||null,error:data?.error||null,hasItems:!!data?.items},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (!res.ok) {
        setPaymentError(data.error || 'Checkout unavailable');
        return;
      }
      if (!paddleReady || !openCheckout) {
        setPaymentError('Payment is loading. Please try again in a moment.');
        return;
      }
      if (data.mode === 'transaction' && data.transactionId) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckoutClient.tsx:opening-paddle-transactionId',message:'Opening Paddle with transactionId',data:{transactionId:data.transactionId},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        openCheckout({
          transactionId: data.transactionId,
          onCompleted: (transactionId: string) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckoutClient.tsx:onCompleted',message:'Checkout completed callback fired',data:{transactionId},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            clearCart();
            const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
            router.push(`${localePrefix}/success?transaction_id=${encodeURIComponent(transactionId)}`);
          },
        });
      } else {
        openCheckout({
          items: data.items,
          customData: data.customData,
          customerEmail: travelerData.email,
          onCompleted: (transactionId: string) => {
            clearCart();
            const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
            router.push(`${localePrefix}/success?transaction_id=${encodeURIComponent(transactionId)}`);
          },
        });
      }
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckoutClient.tsx:catch',message:'Exception in onPayWithPaddle',data:{error:String(e)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setPaymentError(t('paymentError') || 'Something went wrong. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">{t('cart')}</h1>
        <p className="mt-4 text-muted-foreground">Your cart is empty.</p>
        <IntlLink href="/destinations">
          <Button className="mt-4">Browse destinations</Button>
        </IntlLink>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          {step === 'cart' && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">{t('cart')}</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.planId}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.destinationName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.plan.dataDisplay} / {item.plan.days} days
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatPrice(item.plan.price * item.quantity, item.plan.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.planId)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 'traveler' && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">{t('travelerInfo')}</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onTravelerSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input id="email" type="email" className="mt-1" {...register('email')} />
                    {errors.email && (
                      <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">{t('firstName')}</Label>
                      <Input id="firstName" className="mt-1" {...register('firstName')} />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t('lastName')}</Label>
                      <Input id="lastName" className="mt-1" {...register('lastName')} />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  <Button type="submit">Continue to payment</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'payment' && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">{t('payment')}</h2>
              </CardHeader>
              <CardContent>
                {paymentError && (
                  <p className="mb-4 text-sm text-destructive" role="alert">{paymentError}</p>
                )}
                <Button
                  className="mt-4 w-full"
                  onClick={onPayWithPaddle}
                  disabled={paymentLoading || !paddleReady}
                >
                  {paymentLoading ? (t('processing') || 'Processing…') : (t('payNow') || 'Pay now')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Summary</h2>
            </CardHeader>
            <CardContent>
              {items.map((item) => (
                <div
                  key={item.planId}
                  className="flex justify-between text-sm py-2"
                >
                  <span>
                    {item.destinationName} – {item.plan.dataDisplay} / {item.plan.days}d
                  </span>
                  <span>
                    {formatPrice(item.plan.price * item.quantity, item.plan.currency)}
                  </span>
                </div>
              ))}
              <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
                <span>Total</span>
                <span>{items.length > 0 ? formatPrice(total, items[0].plan.currency) : '$0'}</span>
              </div>
              {step === 'cart' && (
                <Button
                  className="mt-6 w-full"
                  onClick={() => setStep('traveler')}
                >
                  Continue
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
