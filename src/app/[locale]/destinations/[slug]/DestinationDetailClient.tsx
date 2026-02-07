'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import type { Destination, Plan } from '@/types';
import { PlanCard } from '@/components/sections/PlanCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DestinationDetailClientProps {
  destination: Destination;
  initialPlans: Plan[];
}

export function DestinationDetailClient({
  destination,
  initialPlans,
}: DestinationDetailClientProps) {
  const t = useTranslations('destinations');
  const [dataFilter, setDataFilter] = useState<string>('');
  const [daysFilter, setDaysFilter] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [show5GOnly, setShow5GOnly] = useState(false);

  const plans = useMemo(() => {
    let list = [...initialPlans];
    if (dataFilter) {
      const gb = parseFloat(dataFilter);
      if (!isNaN(gb)) list = list.filter((p) => p.dataAmount >= gb * 1024 || p.dataAmount < 0);
    }
    if (daysFilter) {
      const days = parseInt(daysFilter, 10);
      if (!isNaN(days)) list = list.filter((p) => p.days >= days);
    }
    if (maxPrice) {
      const price = parseFloat(maxPrice);
      if (!isNaN(price)) list = list.filter((p) => p.price <= price);
    }
    if (show5GOnly) list = list.filter((p) => p.networkType === '5G');
    return list;
  }, [initialPlans, dataFilter, daysFilter, maxPrice, show5GOnly]);

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img
            src={destination.flagUrl}
            alt=""
            className="h-14 w-20 rounded-xl object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold">{destination.name}</h1>
            <p className="text-muted-foreground">
              {destination.planCount} {t('plansCount')} · {destination.operatorCount} operators
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4">
        <h2 className="mb-3 font-semibold">Filters</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs">{t('filterData')} (GB min)</Label>
            <Input
              type="number"
              placeholder="e.g. 1"
              className="mt-1 w-24"
              value={dataFilter}
              onChange={(e) => setDataFilter(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">{t('filterDays')}</Label>
            <Input
              type="number"
              placeholder="e.g. 7"
              className="mt-1 w-24"
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">{t('filterPrice')} max (USD)</Label>
            <Input
              type="number"
              placeholder="e.g. 50"
              className="mt-1 w-24"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <Button
            variant={show5GOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShow5GOnly(!show5GOnly)}
          >
            {t('filter5G')}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            destinationName={destination.name}
            destinationSlug={destination.slug}
          />
        ))}
      </div>
      {plans.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No plans match your filters.</p>
      )}
    </div>
  );
}
