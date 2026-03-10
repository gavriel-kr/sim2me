'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { brandConfig } from '@/config/brand';
import { Mail, ExternalLink } from 'lucide-react';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { useCookieConsent } from '@/components/CookieConsentProvider';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const defaultProductLinks = [
  { href: '/destinations', key: 'destinations' },
  { href: '/app', key: 'app' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/compatible-devices', key: 'devices' },
];

const defaultCompanyLinks = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/help', key: 'help' },
];

const defaultLegalLinks = [
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
  { href: '/refund', key: 'refund' },
  { href: '/accessibility-statement', key: 'accessibilityStatement' },
];

const defaultGuidesLinks = [
  { href: '/articles', key: 'guidesAll' },
  { href: '/articles/esim-europe-guide', key: 'guidesEurope' },
  { href: '/articles/how-does-esim-work', key: 'guidesHowTo' },
  { href: '/articles/esim-vs-physical-sim-vs-roaming', key: 'guidesVsRoaming' },
];

const LOCALE_COOKIE = 'NEXT_LOCALE';

const defaultFooterLogo = (
  <img src="/logo.png" alt={brandConfig.logoAlt} className="h-8 max-w-[180px] object-contain object-left" />
);

export function Footer() {
  const t = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const { openCookieSettings } = useCookieConsent();
  const locale = useLocale();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [productLinks, setProductLinks] = useState(defaultProductLinks);
  const [companyLinks, setCompanyLinks] = useState(defaultCompanyLinks);
  const [legalLinks, setLegalLinks] = useState(defaultLegalLinks);
  const [guidesLinks, setGuidesLinks] = useState(defaultGuidesLinks);

  useEffect(() => {
    fetch('/api/navigation')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: {
        footer?: {
          product?: { href: string; key: string; label?: string }[] | null;
          company?: { href: string; key: string; label?: string }[] | null;
          legal?: { href: string; key: string; label?: string }[] | null;
          guides?: { href: string; key: string; label?: string }[] | null;
        };
      } | null) => {
        if (!data?.footer) return;
        if (data.footer.product && data.footer.product.length > 0) setProductLinks(data.footer.product);
        if (data.footer.company && data.footer.company.length > 0) setCompanyLinks(data.footer.company);
        if (data.footer.legal && data.footer.legal.length > 0) setLegalLinks(data.footer.legal);
        if (data.footer.guides && data.footer.guides.length > 0) setGuidesLinks(data.footer.guides);
      })
      .catch(() => {});
  }, []);

  const isExternal = (href: string) => href.startsWith('http://') || href.startsWith('https://');
  const linkText = (
    link: { key: string; label?: string },
    getT: (k: string) => string
  ) => link.label?.trim() || (link.key?.trim() ? getT(link.key) : '');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

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

  return (
    <footer className="border-t border-border/40 bg-gray-50">
      <div className="container px-4 py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2 sm:col-span-2">
            <IntlLink href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80" aria-label="Sim2Me – Home">
              {logoUrl ? (
                <img src={logoUrl} alt={brandConfig.logoAlt} className="h-8 max-w-[180px] object-contain object-left" />
              ) : (
                defaultFooterLogo
              )}
            </IntlLink>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {brandConfig.tagline}. Instant eSIM data plans for 200+ countries. No SIM swap, no roaming charges.
            </p>
            <div className="mt-5 flex gap-3">
              {brandConfig.social.twitter && (
                <a
                  href={brandConfig.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label="Twitter"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {brandConfig.social.instagram && (
                <a
                  href={brandConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label="Instagram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {brandConfig.social.facebook && (
                <a
                  href={brandConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label="Facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-bold text-foreground">{tFooter('products')}</h3>
            <ul className="mt-4 space-y-2.5">
              {productLinks.filter((l) => l.href?.trim()).map((link, idx) => {
                const { href, key } = link;
                const text = linkText(link, t);
                const cls = "text-sm text-muted-foreground transition-colors hover:text-foreground";
                return (
                  <li key={`${key}-${idx}`}>
                    {isExternal(href) ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {text || href}
                      </a>
                    ) : (
                      <IntlLink href={href} className={cls}>
                        {text || key}
                      </IntlLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold text-foreground">{tFooter('company')}</h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.filter((l) => l.href?.trim()).map((link, idx) => {
                const { href, key } = link;
                const text = linkText(link, t);
                const cls = "text-sm text-muted-foreground transition-colors hover:text-foreground";
                return (
                  <li key={`${key}-${idx}`}>
                    {isExternal(href) ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {text || href}
                      </a>
                    ) : (
                      <IntlLink href={href} className={cls}>
                        {text || key}
                      </IntlLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* eSIM Guides */}
          <div>
            <h3 className="text-sm font-bold text-foreground">{tFooter('guides')}</h3>
            <ul className="mt-4 space-y-2.5">
              {guidesLinks.filter((l) => l.href?.trim()).map((link, idx) => {
                const { href, key } = link;
                const text = linkText(link, tFooter);
                const cls = "text-sm text-muted-foreground transition-colors hover:text-foreground";
                return (
                  <li key={`${key}-${idx}`}>
                    {isExternal(href) ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {text || href}
                      </a>
                    ) : (
                      <IntlLink href={href} className={cls}>
                        {text || key}
                      </IntlLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold text-foreground">{tFooter('legal')}</h3>
            <ul className="mt-4 space-y-2.5">
              {legalLinks.filter((l) => l.href?.trim()).map((link, idx) => {
                const { href, key } = link;
                const text = linkText(link, tFooter);
                const cls = "text-sm text-muted-foreground transition-colors hover:text-foreground";
                return (
                  <li key={`${key}-${idx}`}>
                    {isExternal(href) ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {text || href}
                      </a>
                    ) : (
                      <IntlLink href={href} className={cls}>
                        {text || key}
                      </IntlLink>
                    )}
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={tFooter('cookieSettings')}
                >
                  {tFooter('cookieSettings')}
                </button>
              </li>
            </ul>
          </div>
        </div>


        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {brandConfig.name}. {tFooter('allRightsReserved')}
          </p>
          <a
            href={`mailto:${brandConfig.supportEmail}`}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            {brandConfig.supportEmail}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
