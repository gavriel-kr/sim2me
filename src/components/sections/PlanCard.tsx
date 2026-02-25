'use client';

import { useTranslations } from 'next-intl';
import type { Plan } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

interface PlanCardProps {
  plan: Plan;
  destinationName: string;
  destinationSlug: string;
}

export function PlanCard({ plan, destinationName, destinationSlug }: PlanCardProps) {
  const t = useTranslations('plan');
  const tDest = useTranslations('destinations');
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  const MIN_PURCHASE = 1.20;

  const handleAddToCart = () => {
    addItem({
      planId: plan.id,
      destinationId: plan.destinationId,
      destinationName,
      destinationSlug,
      plan,
    });
    if (plan.price < MIN_PURCHASE) {
      toast({
        title: 'Added to cart — minimum order notice',
        description: `This plan costs $${plan.price.toFixed(2)}. Minimum purchase is $${MIN_PURCHASE.toFixed(2)}.`,
        variant: 'warning',
      });
    } else {
      toast({
        title: 'Added to cart',
        description: `${plan.dataDisplay} / ${plan.days} days for ${destinationName}`,
        variant: 'success',
      });
    }
  };

  const perDay = plan.days > 0 ? (plan.price / plan.days).toFixed(2) : plan.price;

  return (
    <Card className={`flex flex-col ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
      {plan.popular && (
        <div className="rounded-t-xl bg-primary/10 px-4 py-1.5 text-center text-sm font-medium text-primary">
          {tDest('mostPopular')}
        </div>
      )}
      <CardContent className="flex-1 p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{plan.name}</p>
            <p className="text-sm text-muted-foreground">{plan.operatorName}</p>
          </div>
          <div className="text-end">
            <span className="text-2xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
            {plan.days > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatPrice(plan.price / plan.days, plan.currency)} {t('perDay')}
              </p>
            )}
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">{t('data')}:</span> {plan.dataDisplay}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('validity')}:</span> {plan.days} days
          </li>
          <li>
            <span className="font-medium text-foreground">{t('network')}:</span> {plan.networkType}
            {plan.networkType === '5G' && (
              <Badge variant="secondary" className="ms-2 text-xs">5G</Badge>
            )}
          </li>
          {plan.tethering && (
            <li>
              <span className="font-medium text-foreground">{t('tethering')}:</span> Yes
            </li>
          )}
          {plan.topUps && (
            <li>
              <span className="font-medium text-foreground">{t('topUps')}:</span> Available
            </li>
          )}
        </ul>
      </CardContent>
      <CardFooter className="flex gap-2 p-6 pt-0">
        <Button className="flex-1" onClick={handleAddToCart}>
          {t('addToCart')}
        </Button>
        <IntlLink href={`/destinations/${destinationSlug}/plan/${plan.id}`}>
          <Button variant="outline">View details</Button>
        </IntlLink>
      </CardFooter>
    </Card>
  );
}
