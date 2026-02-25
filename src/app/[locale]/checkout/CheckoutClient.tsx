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

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

type Step = 'cart' | 'traveler' | 'payment';

export function CheckoutClient() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const locale = useLocale();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const setTravelerInfo = useCartStore((s) => s.setTravelerInfo);
  const { ready: paddleReady, openCheckout } = usePaddle();

  const MIN_PURCHASE = 0.70;
  const belowMinimum = total < MIN_PURCHASE;

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

    if (!travelerData?.email || !items.length) {
      setPaymentError(t('emailRequired') || 'Please enter your details first.');
      return;
    }
    if (items.length > 1) {
      setPaymentError(t('singlePlanOnly') || 'Please purchase one plan at a time.');
      return;
    }
    if (belowMinimum) {
      setPaymentError(`Minimum purchase is $${MIN_PURCHASE.toFixed(2)}. Current total: $${total.toFixed(2)}.`);
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

      if (!res.ok) {
        const detail = data.details ? ` (${data.details})` : '';
        setPaymentError((data.error || 'Checkout unavailable') + detail);
        return;
      }
      if (!paddleReady || !openCheckout) {
        setPaymentError('Payment is loading. Please try again in a moment.');
        return;
      }
      if (data.mode === 'transaction' && data.transactionId) {
        openCheckout({
          transactionId: data.transactionId,
          onCompleted: (transactionId: string) => {
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
      console.error('[Checkout] error:', e);
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
                {belowMinimum && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <strong>Minimum purchase is $0.70.</strong> Your current total is ${total.toFixed(2)}.
                    Only plans priced $0.70 or above can be purchased.
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={belowMinimum}
                  onClick={() => setStep('traveler')}
                >
                  Continue to details
                </Button>
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
                {belowMinimum && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <strong>Minimum purchase is $0.70.</strong> This plan (${total.toFixed(2)}) cannot be purchased individually.
                  </div>
                )}
                {paymentError && (
                  <p className="mb-4 text-sm text-destructive" role="alert">{paymentError}</p>
                )}
                <Button
                  className="mt-4 w-full"
                  onClick={onPayWithPaddle}
                  disabled={paymentLoading || !paddleReady || belowMinimum}
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
