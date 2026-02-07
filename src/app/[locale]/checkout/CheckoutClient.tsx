'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

type Step = 'cart' | 'traveler' | 'payment' | 'confirmation';

export function CheckoutClient() {
  const t = useTranslations('checkout');
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);
  const removeItem = useCartStore((s) => s.removeItem);

  const [step, setStep] = useState<Step>('cart');
  const [orderId, setOrderId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TravelerInfoForm>({
    resolver: zodResolver(travelerInfoSchema),
  });

  const onTravelerSubmit = (data: TravelerInfoForm) => {
    setStep('payment');
  };

  const onPayMock = () => {
    const id = `ord_${Date.now()}`;
    setOrderId(id);
    clearCart();
    setStep('confirmation');
  };

  if (items.length === 0 && step !== 'confirmation') {
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

  if (step === 'confirmation' && orderId) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-primary">{t('orderComplete')}</h1>
        <p className="mt-2 text-muted-foreground">Order {orderId}</p>
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('installSteps')}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">1. {t('step1')}</p>
            <p className="text-sm">2. {t('step2')}</p>
            <p className="text-sm">3. {t('step3')}</p>
            <p className="text-sm">4. {t('step4')}</p>
            <div className="flex justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-8">
              <div className="h-32 w-32 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm sm:h-48 sm:w-48">
                QR code placeholder
              </div>
            </div>
          </CardContent>
        </Card>
        <IntlLink href="/">
          <Button className="mt-8">{t('backToHome')}</Button>
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
                <p className="text-sm text-muted-foreground">{t('mockPayment')}</p>
                <Button className="mt-4 w-full" onClick={onPayMock}>
                  {t('payNow')}
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
