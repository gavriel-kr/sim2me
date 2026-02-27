'use client';

import { useTranslations } from 'next-intl';
import { brandConfig } from '@/config/brand';
import { Mail, ExternalLink } from 'lucide-react';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import { useCookieConsent } from '@/components/CookieConsentProvider';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const productLinks = [
  { href: '/destinations', key: 'destinations' },
  { href: '/app', key: 'app' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/compatible-devices', key: 'devices' },
];

const companyLinks = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/help', key: 'help' },
];

const legalLinks = [
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
  { href: '/refund', key: 'refund' },
  { href: '/accessibility-statement', key: 'accessibilityStatement' },
];

export function Footer() {
  const t = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const tHome = useTranslations('home');
  const { openCookieSettings } = useCookieConsent();

  return (
    <footer className="border-t border-border/40 bg-gray-50">
      <div className="container px-4 py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <IntlLink href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80" aria-label="Sim2Me – Home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="3" y="1" width="8" height="14" rx="1.5" fill="white" fillOpacity="0.9"/>
                  <circle cx="7" cy="12" r="1" fill="#059669"/>
                  <path d="M12 5c1.5-0.7 3 0 3.5 1.5s0 3-1.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8"/>
                </svg>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                Sim<span className="text-primary">2</span>Me
              </span>
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
              {productLinks.map(({ href, key }) => (
                <li key={key}>
                  <IntlLink href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {t(key)}
                  </IntlLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold text-foreground">{tFooter('company')}</h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map(({ href, key }) => (
                <li key={key}>
                  <IntlLink href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {t(key)}
                  </IntlLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold text-foreground">{tFooter('legal')}</h3>
            <ul className="mt-4 space-y-2.5">
              {legalLinks.map(({ href, key }) => (
                <li key={key}>
                  <IntlLink href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {tFooter(key)}
                  </IntlLink>
                </li>
              ))}
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

        {brandConfig.appStoreComingSoon && (
          <div className="mt-12 rounded-2xl border border-border/60 bg-white p-6 text-center shadow-card sm:p-8">
            <p className="font-bold text-foreground">{tHome('appComingSoon')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tHome('appNotify')}</p>
            <IntlLink
              href="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Mail className="h-4 w-4" />
              Get notified
            </IntlLink>
          </div>
        )}

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
