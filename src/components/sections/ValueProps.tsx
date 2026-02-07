'use client';

import { useTranslations } from 'next-intl';
import { Zap, DollarSign, Smartphone } from 'lucide-react';

const items = [
  { key: 'value1', icon: Zap },
  { key: 'value2', icon: DollarSign },
  { key: 'value3', icon: Smartphone },
];

export function ValueProps() {
  const t = useTranslations('home');

  return (
    <section className="border-y border-border/50 bg-muted/30 py-16">
      <div className="container px-4">
        <div className="grid gap-10 sm:grid-cols-3">
          {items.map(({ key, icon: Icon }) => (
            <div key={key} className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{t(`${key}Title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">{t(`${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
