'use client';

import { useTranslations } from 'next-intl';
import type { Destination, Plan } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/useToast';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

interface PlanDetailClientProps {
  destination: Destination;
  plan: Plan;
}

export function PlanDetailClient({ destination, plan }: PlanDetailClientProps) {
  const t = useTranslations('plan');
  const addItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem({
      planId: plan.id,
      destinationId: plan.destinationId,
      destinationName: destination.name,
      destinationSlug: destination.slug,
      plan,
    });
    toast({
      title: 'Added to cart',
      description: `${plan.dataDisplay} / ${plan.days} days for ${destination.name}`,
      variant: 'success',
    });
  };

  return (
    <div className="container px-4 py-8">
      <IntlLink
        href={`/destinations/${destination.slug}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        ← Back to {destination.name}
      </IntlLink>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{plan.name}</h1>
                {plan.popular && <Badge>{plan.networkType}</Badge>}
                {plan.networkType === '5G' && (
                  <Badge variant="secondary">5G</Badge>
                )}
              </div>
              <p className="mt-2 text-muted-foreground">{plan.operatorName}</p>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('data')}</dt>
                  <dd className="font-medium">{plan.dataDisplay}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('validity')}</dt>
                  <dd className="font-medium">{plan.days} days</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('network')}</dt>
                  <dd className="font-medium">{plan.networkType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('tethering')}</dt>
                  <dd className="font-medium">{plan.tethering ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('topUps')}</dt>
                  <dd className="font-medium">{plan.topUps ? 'Available' : 'No'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold sm:text-3xl">
                {formatPrice(plan.price, plan.currency)}
              </div>
              {plan.days > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formatPrice(plan.price / plan.days, plan.currency)} {t('perDay')}
                </p>
              )}
              <Button className="mt-6 w-full" size="lg" onClick={handleAddToCart}>
                {t('addToCart')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
