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
import { buildLocalePath } from '@/lib/locale-path';

const { usePathname: useIntlPathname, Link: IntlLink } = createSharedPathnamesNavigation(routing);

const defaultNavLinks = [
  { href: '/', key: 'home' },
  { href: '/destinations', key: 'destinations' },
  { href: '/app', key: 'app' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/compatible-devices', key: 'devices' },
  { href: '/help', key: 'help' },
  { href: '/contact', key: 'contact' },
];

const locales = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
] as const;

const defaultLogo = (
  <img src="/logo.png" alt={brandConfig.logoAlt} className="h-9 max-w-[180px] object-contain object-left" />
);

export function Header() {
  const t = useTranslations('nav');
  const pathname = useIntlPathname();
  const count = useCartStore((s) => s.count());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [navLinks, setNavLinks] = useState<{ href: string; key: string; label?: string }[]>(defaultNavLinks);
  const currentLocale = useLocale();

  useEffect(() => {
    fetch('/api/navigation')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { navMenu?: { href: string; key: string; label?: string }[] | null } | null) => {
        if (data?.navMenu && Array.isArray(data.navMenu) && data.navMenu.length > 0) {
          setNavLinks(data.navMenu);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/site-branding')
      .then((res) => res.ok ? res.json() : null)
      .then((data: { logoUrl?: string | null; brandingVersion?: number | null } | null) => {
        if (!data?.logoUrl?.trim()) return null;
        const url = data.logoUrl.trim();
        const version = data.brandingVersion ?? null;
        if (version != null && url.startsWith('/')) return `${url}?v=${version}`;
        return url;
      })
      .then(setLogoUrl)
      .catch(() => {});
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname?.startsWith(href));

  const isExternal = (href: string) => href.startsWith('http://') || href.startsWith('https://');
  const linkText = (link: { key: string; label?: string }) =>
    link.label?.trim() || (link.key?.trim() ? t(link.key) : '');

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
          {navLinks.filter((l) => l.href?.trim()).map((link, idx) => {
            const { href, key } = link;
            const text = linkText(link);
            const cn = `rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              !isExternal(href) && isActive(href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`;
            return isExternal(href) ? (
              <a key={`${key}-${idx}`} href={href} target="_blank" rel="noopener noreferrer" className={cn}>
                {text || href}
              </a>
            ) : (
              <IntlLink key={`${key}-${idx}`} href={href} className={cn}>
                {text || key}
              </IntlLink>
            );
          })}
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
                const localePath = buildLocalePath(pathname, code);
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
            {navLinks.filter((l) => l.href?.trim()).map((link, idx) => {
              const { href, key } = link;
              const text = linkText(link);
              const cn = `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                !isExternal(href) && isActive(href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`;
              return isExternal(href) ? (
                <a
                  key={`${key}-${idx}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn}
                  onClick={() => setMobileOpen(false)}
                >
                  {text || href}
                </a>
              ) : (
                <IntlLink key={`${key}-${idx}`} href={href} className={cn} onClick={() => setMobileOpen(false)}>
                  {text || key}
                </IntlLink>
              );
            })}
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
                  const localePath = buildLocalePath(pathname, code);
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
