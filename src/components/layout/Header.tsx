'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Globe, ShoppingCart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
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

const { usePathname: useIntlPathname, Link: IntlLink } = createSharedPathnamesNavigation(routing);

const navLinks = [
  { href: '/', key: 'home' },
  { href: '/destinations', key: 'destinations' },
  { href: '/app', key: 'app' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/compatible-devices', key: 'devices' },
  { href: '/help', key: 'help' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const;

const locales = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
] as const;

const defaultLogo = (
  <>
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="1" width="8" height="14" rx="1.5" fill="white" fillOpacity="0.9"/>
        <circle cx="7" cy="12" r="1" fill="#059669"/>
        <path d="M12 5c1.5-0.7 3 0 3.5 1.5s0 3-1.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8"/>
        <path d="M13 3c2-1 4 0 5 2s0 4-2 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
      </svg>
    </div>
    <span className="text-lg font-extrabold tracking-tight text-foreground">
      Sim<span className="text-primary">2</span>Me
    </span>
  </>
);

export function Header() {
  const t = useTranslations('nav');
  const pathname = useIntlPathname();
  const count = useCartStore((s) => s.count());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const currentLocale = useLocale();

  useEffect(() => {
    fetch('/api/site-branding')
      .then((res) => res.ok ? res.json() : null)
      .then((data: { logoUrl?: string | null } | null) => data?.logoUrl?.trim() || null)
      .then(setLogoUrl)
      .catch(() => {});
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <IntlLink href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80" aria-label={`${brandConfig.name} – Home`}>
          {logoUrl ? (
            <img src={logoUrl} alt={brandConfig.logoAlt} className="h-9 max-w-[180px] object-contain object-left" />
          ) : (
            defaultLogo
          )}
        </IntlLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navLinks.map(({ href, key }) => (
            <IntlLink
              key={key}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive(href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t(key)}
            </IntlLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Globe className="h-[18px] w-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {locales.map(({ code, label, flag }) => {
                const localePath = `/${code}${pathname === '/' ? '' : pathname}`;
                return (
                  <DropdownMenuItem
                    key={code}
                    onSelect={() => {
                      document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
                      window.location.href = localePath;
                    }}
                    className="gap-2.5"
                  >
                    <span className="text-base">{flag}</span>
                    <span>{label}</span>
                    {currentLocale === code && (
                      <span className="ml-auto text-xs text-primary font-semibold">&#10003;</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart */}
          <IntlLink
            href="/checkout"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('cart')}
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                {count}
              </span>
            )}
          </IntlLink>

          {/* Account button - desktop */}
          <IntlLink
            href="/account"
            className="hidden h-9 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105 sm:inline-flex"
          >
            {t('account')}
          </IntlLink>

          {/* Mobile toggle */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/40 bg-white lg:hidden animate-fade-up">
          <nav className="container flex flex-col gap-0.5 px-4 py-3" aria-label="Mobile navigation">
            {navLinks.map(({ href, key }) => (
              <IntlLink
                key={key}
                href={href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {t(key)}
              </IntlLink>
            ))}
            <IntlLink
              href="/account"
              className="mt-1 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              {t('account')}
            </IntlLink>
            <div className="mt-2 border-t border-border/40 pt-3">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Language</p>
              <div className="flex gap-1.5 px-3">
                {locales.map(({ code, label, flag }) => {
                  const localePath = `/${code}${pathname === '/' ? '' : pathname}`;
                  return (
                    <a
                      key={code}
                      href={localePath}
                      onClick={() => {
                        document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        currentLocale === code
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <span>{flag}</span>
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
