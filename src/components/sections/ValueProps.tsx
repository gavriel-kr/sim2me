'use client';

import { useTranslations } from 'next-intl';
import { Zap, DollarSign, Smartphone, ArrowRight } from 'lucide-react';

const items = [
  { key: 'value1', icon: Zap, color: 'bg-emerald-100 text-emerald-600' },
  { key: 'value2', icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
  { key: 'value3', icon: Smartphone, color: 'bg-violet-100 text-violet-600' },
];

export function ValueProps() {
  const t = useTranslations('home');

  return (
    <section className="relative bg-white py-20 sm:py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Why travelers choose Sim2Me
          </h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">
            The simplest way to stay connected abroad
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {items.map(({ key, icon: Icon, color }, i) => (
            <div
              key={key}
              className="group relative rounded-2xl border border-border/60 bg-white p-8 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/30"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${color} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">{t(`${key}Title`)}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t(`${key}Desc`)}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-all group-hover:opacity-100">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
