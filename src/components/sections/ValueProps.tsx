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
    <section className="border-y border-border/60 bg-gradient-to-b from-secondary/50 to-secondary/30 py-20">
      <div className="container px-4">
        <div className="grid gap-12 sm:grid-cols-3">
          {items.map(({ key, icon: Icon }) => (
            <div key={key} className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-foreground">{t(`${key}Title`)}</h3>
              <p className="mt-3 text-muted-foreground max-w-xs leading-relaxed">{t(`${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
