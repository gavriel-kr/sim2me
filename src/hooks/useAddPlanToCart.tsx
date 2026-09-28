'use client';

/**
 * Ticket 042 — add a day pass or a phone plan to the cart, the way `PlanCard` adds a package.
 *
 * Same store, same analytics event, same "go to checkout" toast. `buyNow` skips the toast and goes
 * straight to checkout, because on these two products the customer has already made every choice
 * there is by the time they press the button.
 */

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import type { Plan } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { ToastAction } from '@/components/ui/toast';
import { planToGaItem, trackAddToCart } from '@/lib/analytics';

const { Link: IntlLink, useRouter } = createSharedPathnamesNavigation(routing);

export function useAddPlanToCart() {
  const t = useTranslations('plan');
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();
  const router = useRouter();

  const add = useCallback(
    (plan: Plan, destinationName: string, destinationSlug: string, description: string) => {
      addItem({ planId: plan.id, destinationId: plan.destinationId, destinationName, destinationSlug, plan });
      trackAddToCart(planToGaItem(plan, destinationName));
      toast({
        title: t('toastAdded'),
        description,
        variant: 'success',
        duration: 9000,
        action: (
          <ToastAction asChild altText={t('toastGoToCheckout')}>
            <IntlLink href="/checkout">{t('toastGoToCheckout')}</IntlLink>
          </ToastAction>
        ),
      });
    },
    [addItem, t, toast],
  );

  const buyNow = useCallback(
    (plan: Plan, destinationName: string, destinationSlug: string) => {
      addItem({ planId: plan.id, destinationId: plan.destinationId, destinationName, destinationSlug, plan });
      trackAddToCart(planToGaItem(plan, destinationName));
      router.push('/checkout');
    },
    [addItem, router],
  );

  return { add, buyNow };
}

/** 1000 → "1Mbps", 512 → "512kbps". Empty when unknown. */
export function formatFupSpeed(kbps: number): string {
  if (!kbps) return '';
  return kbps >= 1000 ? `${kbps / 1000}Mbps` : `${kbps}kbps`;
}
