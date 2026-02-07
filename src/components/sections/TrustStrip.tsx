'use client';

import { useTranslations } from 'next-intl';
import { brandConfig } from '@/config/brand';
import { Shield, HeadphonesIcon, Globe, Star } from 'lucide-react';

export function TrustStrip() {
  const t = useTranslations('home');

  const stats = [
    {
      icon: Globe,
      value: brandConfig.destinationsCount,
      label: t('trustDestinations'),
      color: 'text-emerald-600 bg-emerald-100',
    },
    {
      icon: Shield,
      value: '',
      label: t('trustSecure'),
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: HeadphonesIcon,
      value: '',
      label: t('trustSupport'),
      color: 'text-violet-600 bg-violet-100',
    },
  ];

  return (
    <section className="border-y border-border/40 bg-muted/20 py-10 sm:py-14">
      <div className="container px-4">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-16">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                {value && <span className="block text-sm font-extrabold text-foreground">{value}</span>}
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
              </div>
            </div>
          ))}
          {brandConfig.rating && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <div>
                <span className="block text-sm font-extrabold text-foreground">{brandConfig.rating}/5</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {brandConfig.reviewCount} reviews
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
