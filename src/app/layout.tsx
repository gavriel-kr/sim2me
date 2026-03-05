import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import { brandConfig } from '@/config/brand';
import { getSiteBranding } from '@/lib/site-branding';
import { getSeoOverride } from '@/lib/seo-override';
import { Providers } from '@/components/providers/Providers';
import { CookieConsentProvider } from '@/components/CookieConsentProvider';
import { CookieBanner } from '@/components/CookieBanner';
import '@/app/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const siteUrl = 'https://www.sim2me.net';

function withCacheBust(url: string, version: number | null): string {
  if (version == null || !url.startsWith('/')) return url;
  return `${url}?v=${version}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const { logoUrl, faviconUrl, brandingVersion } = await getSiteBranding();
  const iconUrl = faviconUrl ? withCacheBust(faviconUrl, brandingVersion) : '/favicon.svg';
  const appleIconUrl = faviconUrl && faviconUrl.startsWith('/') ? withCacheBust(faviconUrl, brandingVersion) : '/icons/apple-touch-icon.png';
  const defaultOgImageUrl = logoUrl && logoUrl.startsWith('/') ? `${siteUrl}${withCacheBust(logoUrl, brandingVersion)}` : undefined;

  // Read the current page path injected by middleware
  const headersList = await headers();
  const pathname = headersList.get('x-pathname');
  const override = pathname ? await getSeoOverride(pathname) : null;

  // Resolve OG image — override wins, must be absolute URL
  const resolvedOgImage = override?.ogImage
    ? (override.ogImage.startsWith('http') ? override.ogImage : `${siteUrl}${override.ogImage}`)
    : defaultOgImageUrl;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: override?.title || `${brandConfig.name} – Buy eSIM Online for 200+ Countries | Instant Delivery`,
      template: `%s | ${brandConfig.name}`,
    },
    description:
      override?.description ||
      'Buy prepaid eSIM online for 200+ countries. Instant delivery, no physical SIM needed. Compare plans, scan QR code and get connected in minutes. Best prices for travel data.',
    keywords: [
      'eSIM', 'buy eSIM', 'travel eSIM', 'prepaid eSIM', 'eSIM online',
      'international data plan', 'roaming alternative', 'travel data',
      'eSIM for iPhone', 'eSIM for Android', 'digital SIM card',
      'no roaming fees', 'global eSIM', 'cheap eSIM', 'eSIM QR code',
    ],
    openGraph: {
      type: 'website',
      siteName: brandConfig.name,
      url: siteUrl,
      title: override?.ogTitle || `${brandConfig.name} – Buy eSIM Online for 200+ Countries`,
      description: override?.ogDescription || 'Instant eSIM delivery for travelers. No physical SIM, no roaming fees. Compare plans and get connected in minutes.',
      locale: 'en_US',
      alternateLocale: ['he_IL', 'ar_SA'],
      ...(resolvedOgImage && { images: [{ url: resolvedOgImage, width: 1200, height: 630, alt: brandConfig.logoAlt }] }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@sim2me',
      title: override?.ogTitle || `${brandConfig.name} – Buy eSIM Online`,
      description: override?.ogDescription || 'Instant eSIM for 200+ countries. Best prices, instant delivery.',
      ...(resolvedOgImage && { images: [resolvedOgImage] }),
    },
    alternates: {
      canonical: override?.canonicalUrl || siteUrl,
      languages: {
        'en': siteUrl,
        'he': `${siteUrl}/he`,
        'ar': `${siteUrl}/ar`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: iconUrl,
      apple: appleIconUrl,
    },
    manifest: '/manifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Sim2Me',
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
    verification: {
      // Add Google Search Console verification when available
      // google: 'your-verification-code',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0d9f6e',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={dmSans.variable}>
      <head>
        {/* Analytics/marketing scripts loaded only after cookie consent (see CookieConsentProvider) */}
      </head>
      <body className="font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <CookieConsentProvider>
              {children}
              <CookieBanner />
            </CookieConsentProvider>
          </Providers>
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </body>
    </html>
  );
}
