'use client';

import { useTranslations } from 'next-intl';
import { SearchDestination } from '@/components/forms/SearchDestination';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { Wifi, Globe2, Shield, Zap } from 'lucide-react';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function Hero() {
  const t = useTranslations('home');

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative container mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Text content */}
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Instant activation worldwide
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 max-w-md">
              <SearchDestination />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <IntlLink
                href="/destinations"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-all hover:shadow-glow hover:brightness-105"
              >
                {t('searchCta')}
              </IntlLink>
              <IntlLink
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
              >
                How it works
              </IntlLink>
            </div>
          </div>

          {/* Right: Visual illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              {/* Phone mockup */}
              <div className="animate-float relative h-[420px] w-[220px] rounded-[2.5rem] border-[3px] border-gray-800 bg-gray-900 p-2 shadow-2xl">
                <div className="h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-emerald-50 to-white">
                  {/* Screen content */}
                  <div className="flex h-full flex-col">
                    <div className="bg-gradient-to-r from-primary to-emerald-600 px-4 pb-6 pt-10 text-white">
                      <p className="text-xs font-medium opacity-80">Welcome back</p>
                      <p className="mt-1 text-lg font-bold">Your eSIMs</p>
                    </div>
                    <div className="flex-1 space-y-3 px-3 pt-4">
                      {/* eSIM cards */}
                      {[
                        { country: 'Japan', flag: '🇯🇵', data: '5GB', days: '7 days', active: true },
                        { country: 'France', flag: '🇫🇷', data: '3GB', days: '5 days', active: false },
                        { country: 'USA', flag: '🇺🇸', data: '10GB', days: '30 days', active: false },
                      ].map((esim) => (
                        <div
                          key={esim.country}
                          className={`rounded-xl border p-3 ${
                            esim.active
                              ? 'border-emerald-200 bg-emerald-50/80 shadow-sm'
                              : 'border-gray-100 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{esim.flag}</span>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-800">{esim.country}</p>
                              <p className="text-[10px] text-gray-500">{esim.data} &middot; {esim.days}</p>
                            </div>
                            {esim.active && (
                              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="animate-float-delayed absolute -left-16 top-16 rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                    <Wifi className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Connected</p>
                    <p className="text-[10px] text-muted-foreground">4G LTE &middot; Tokyo</p>
                  </div>
                </div>
              </div>

              <div className="animate-float absolute -right-12 top-52 rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                    <Globe2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">200+</p>
                    <p className="text-[10px] text-muted-foreground">Countries</p>
                  </div>
                </div>
              </div>

              <div className="animate-float-delayed absolute -left-8 bottom-20 rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                    <Shield className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Secure</p>
                    <p className="text-[10px] text-muted-foreground">Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
