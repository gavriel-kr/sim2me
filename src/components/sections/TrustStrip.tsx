'use client';

import { useTranslations } from 'next-intl';
import { brandConfig } from '@/config/brand';
import { Shield, HeadphonesIcon, Globe } from 'lucide-react';

export function TrustStrip() {
  const t = useTranslations('home');

  return (
    <section className="border-y border-border/60 bg-secondary/40 py-12">
      <div className="container px-4">
        <h2 className="text-center text-lg font-bold text-foreground">
          {t('trustTitle')}
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              {brandConfig.destinationsCount} {t('trustDestinations')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('trustSecure')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <HeadphonesIcon className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t('trustSupport')}</span>
          </div>
          {brandConfig.rating && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{brandConfig.rating}</span>
              <span className="text-sm text-muted-foreground">
                {brandConfig.reviewCount} reviews
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
