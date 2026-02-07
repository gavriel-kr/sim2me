'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Globe, ShoppingCart, Menu } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { brandConfig } from '@/config/brand';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { useRouter, usePathname: useIntlPathname, Link: IntlLink } = createSharedPathnamesNavigation(routing);

const navLinks = [
  { href: '/', key: 'home' },
  { href: '/destinations', key: 'destinations' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/compatible-devices', key: 'devices' },
  { href: '/help', key: 'help' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const;

const locales = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' },
  { code: 'ar', label: 'العربية' },
] as const;

const currencies = [{ code: 'USD', label: 'USD' }, { code: 'EUR', label: 'EUR' }];

export function Header() {
  const t = useTranslations('nav');
  const pathname = useIntlPathname();
  const router = useRouter();
  const count = useCartStore((s) => s.count());
  const [currency, setCurrency] = useState('USD');
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentLocale = useLocale();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        <IntlLink href="/" className="flex items-center gap-2 font-semibold text-foreground">
          {brandConfig.logoUrl ? (
            <img
              src={brandConfig.logoUrl}
              alt={brandConfig.logoAlt}
              className="h-8 w-auto"
            />
          ) : (
            <span className="text-xl">{brandConfig.name}</span>
          )}
        </IntlLink>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, key }) => (
            <IntlLink
              key={key}
              href={href}
              className={`text-sm font-medium transition-colors ${
                isActive(href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(key)}
            </IntlLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Globe className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map(({ code, label }) => {
                const localePath = code === 'en'
                  ? (pathname ?? '/')
                  : `/${code}${pathname === '/' ? '' : pathname}`;
                return (
                  <DropdownMenuItem
                    key={code}
                    onSelect={() => { window.location.href = localePath; }}
                  >
                    {label} {currentLocale === code ? '✓' : ''}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="hidden sm:inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              {currency}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currencies.map(({ code, label }) => (
                <DropdownMenuItem key={code} onClick={() => setCurrency(code)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <IntlLink
            href="/checkout"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground relative"
            aria-label={t('cart')}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </IntlLink>

          <IntlLink
            href="/account"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            {t('account')}
          </IntlLink>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-white md:hidden">
          <nav className="container flex flex-col gap-1 px-4 py-4">
            {navLinks.map(({ href, key }) => (
              <IntlLink
                key={key}
                href={href}
                className="py-3 text-sm font-medium text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {t(key)}
              </IntlLink>
            ))}
            <IntlLink
              href="/account"
              className="py-3 text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {t('account')}
            </IntlLink>
          </nav>
        </div>
      )}
    </header>
  );
}
