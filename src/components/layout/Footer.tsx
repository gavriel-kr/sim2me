'use client';

import { useTranslations } from 'next-intl';
import { brandConfig } from '@/config/brand';
import { Mail } from 'lucide-react';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const productLinks = [
  { href: '/destinations', key: 'destinations' },
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
];

export function Footer() {
  const t = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const tHome = useTranslations('home');

  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="container px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <IntlLink href="/" className="text-lg font-semibold text-foreground hover:text-primary">
              {brandConfig.name}
            </IntlLink>
            <p className="mt-2 text-sm text-muted-foreground">{brandConfig.tagline}</p>
            <div className="mt-4 flex gap-4">
              {brandConfig.social.twitter && (
                <a
                  href={brandConfig.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  aria-label="Twitter"
                >
                  Twitter
                </a>
              )}
              {brandConfig.social.instagram && (
                <a
                  href={brandConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  aria-label="Instagram"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{tFooter('products')}</h3>
            <ul className="mt-3 space-y-2">
              {productLinks.map(({ href, key }) => (
                <li key={key}>
                  <IntlLink href={href} className="text-sm text-muted-foreground hover:text-foreground">
                    {t(key)}
                  </IntlLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{tFooter('company')}</h3>
            <ul className="mt-3 space-y-2">
              {companyLinks.map(({ href, key }) => (
                <li key={key}>
                  <IntlLink href={href} className="text-sm text-muted-foreground hover:text-foreground">
                    {t(key)}
                  </IntlLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{tFooter('legal')}</h3>
            <ul className="mt-3 space-y-2">
              {legalLinks.map(({ href, key }) => (
                <li key={key}>
                  <IntlLink href={href} className="text-sm text-muted-foreground hover:text-foreground">
                    {tFooter(key)}
                  </IntlLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {brandConfig.appStoreComingSoon && (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 text-center">
            <p className="font-medium text-foreground">{tHome('appComingSoon')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tHome('appNotify')}</p>
            <IntlLink
              href="/contact"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {tHome('appNotify')}
            </IntlLink>
          </div>
        )}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brandConfig.name}. {tFooter('allRightsReserved')}
          </p>
          <a
            href={`mailto:${brandConfig.supportEmail}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            {brandConfig.supportEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
