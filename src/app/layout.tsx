import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import { brandConfig } from '@/config/brand';
import { getSiteBranding } from '@/lib/site-branding';
import { getSeoOverride } from '@/lib/seo-override';
import { getGlobalSeoSettings } from '@/lib/global-seo';
import { Providers } from '@/components/providers/Providers';
import { CookieConsentProvider } from '@/components/CookieConsentProvider';
import { CookieBanner } from '@/components/CookieBanner';
import '@/app/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

function withCacheBust(url: string, version: number | null): string {
  if (version == null || !url.startsWith('/')) return url;
  return `${url}?v=${version}`;
}

function makeAbsolute(url: string, domain: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${domain}${url}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ logoUrl, faviconUrl, brandingVersion }, globalSeo] = await Promise.all([
    getSiteBranding(),
    getGlobalSeoSettings(),
  ]);

  const siteUrl = globalSeo.canonicalDomain || 'https://www.sim2me.net';
  // Use /favicon.ico (static file from public/) as canonical URL for Google search results
  const iconUrl = '/favicon.ico';
  const appleIconUrl = faviconUrl && faviconUrl.startsWith('/') ? withCacheBust(faviconUrl, brandingVersion) : '/icons/apple-touch-icon.png';

  // Favicon/logo from branding upload; use as OG fallback only if no global OG image is set
  const brandingOgImage = logoUrl && logoUrl.startsWith('/') ? `${siteUrl}${withCacheBust(logoUrl, brandingVersion)}` : undefined;
  const globalOgImage = globalSeo.ogImage ? makeAbsolute(globalSeo.ogImage, siteUrl) : brandingOgImage;

  // Read the current page path injected by middleware, look up path-specific override
  const headersList = await headers();
  const pathname = headersList.get('x-pathname');
  const override = pathname ? await getSeoOverride(pathname) : null;

  // Determine locale from the URL path injected by middleware (/he/... or /ar/...)
  const locale = pathname?.startsWith('/he') ? 'he' : pathname?.startsWith('/ar') ? 'ar' : 'en';

  // Pick locale-specific snippet (title, description, keywords) with EN fallback
  const localeTitle = locale === 'he' ? globalSeo.defaultTitleHe || globalSeo.defaultTitle
    : locale === 'ar' ? globalSeo.defaultTitleAr || globalSeo.defaultTitle
    : globalSeo.defaultTitle;
  const localeDesc = locale === 'he' ? globalSeo.defaultDescriptionHe || globalSeo.defaultDescription
    : locale === 'ar' ? globalSeo.defaultDescriptionAr || globalSeo.defaultDescription
    : globalSeo.defaultDescription;
  const localeKeywords = locale === 'he' ? globalSeo.defaultKeywordsHe || globalSeo.defaultKeywords
    : locale === 'ar' ? globalSeo.defaultKeywordsAr || globalSeo.defaultKeywords
    : globalSeo.defaultKeywords;

  // Layer: path override > locale-specific DB setting > code default
  const resolvedTitle = override?.title || localeTitle;
  const resolvedDesc = override?.description || localeDesc;
  const resolvedOgTitle = override?.ogTitle || globalSeo.ogTitle || resolvedTitle;
  const resolvedOgDesc = override?.ogDescription || globalSeo.ogDescription || resolvedDesc;
  const resolvedOgImage = override?.ogImage
    ? makeAbsolute(override.ogImage, siteUrl)
    : globalOgImage;
  const resolvedCanonical = override?.canonicalUrl || siteUrl;

  const robotsIndex = globalSeo.robotsIndex !== 'false';
  const robotsFollow = globalSeo.robotsFollow !== 'false';
  const maxSnippet = parseInt(globalSeo.googleMaxSnippet || '-1', 10);
  const maxVideoPreview = parseInt(globalSeo.googleMaxVideoPreview || '-1', 10);
  const maxImagePreview = (globalSeo.googleMaxImagePreview || 'large') as 'none' | 'standard' | 'large';

  const keywords = localeKeywords
    ? localeKeywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  const verificationObj: Record<string, string> = {};
  if (globalSeo.googleVerification) verificationObj.google = globalSeo.googleVerification;
  if (globalSeo.bingVerification) verificationObj.other = `msvalidate.01=${globalSeo.bingVerification}`;
  if (globalSeo.yandexVerification) verificationObj.yandex = globalSeo.yandexVerification;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: resolvedTitle,
      template: globalSeo.titleTemplate || `%s | ${globalSeo.siteName}`,
    },
    description: resolvedDesc,
    ...(keywords.length > 0 && { keywords }),
    openGraph: {
      type: 'website',
      siteName: globalSeo.siteName || brandConfig.name,
      url: siteUrl,
      title: resolvedOgTitle,
      description: resolvedOgDesc,
      locale: 'en_US',
      alternateLocale: ['he_IL', 'ar_SA'],
      ...(resolvedOgImage && {
        images: [{ url: resolvedOgImage, width: 1200, height: 630, alt: globalSeo.siteName || brandConfig.logoAlt }],
      }),
    },
    twitter: {
      card: (globalSeo.twitterCard as 'summary' | 'summary_large_image') || 'summary_large_image',
      site: globalSeo.twitterHandle || undefined,
      title: resolvedOgTitle,
      description: resolvedOgDesc,
      ...(resolvedOgImage && { images: [resolvedOgImage] }),
    },
    alternates: {
      canonical: resolvedCanonical,
      languages: {
        en: siteUrl,
        he: `${siteUrl}/he`,
        ar: `${siteUrl}/ar`,
      },
    },
    robots: {
      index: robotsIndex,
      follow: robotsFollow,
      googleBot: {
        index: robotsIndex,
        follow: robotsFollow,
        'max-video-preview': maxVideoPreview,
        'max-image-preview': maxImagePreview,
        'max-snippet': maxSnippet,
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
      title: globalSeo.siteName || 'Sim2Me',
    },
    formatDetection: { telephone: false },
    other: { 'mobile-web-app-capable': 'yes' },
    ...(Object.keys(verificationObj).length > 0 && { verification: verificationObj }),
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

  // Fetch global SEO for Organization JSON-LD (cached — no extra DB hit)
  const globalSeo = await getGlobalSeoSettings();
  const siteUrl = globalSeo.canonicalDomain || 'https://www.sim2me.net';

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: globalSeo.orgName || globalSeo.siteName || 'Sim2Me',
    url: globalSeo.orgUrl || siteUrl,
    ...(globalSeo.orgLogo && { logo: makeAbsolute(globalSeo.orgLogo, siteUrl) }),
    sameAs: [globalSeo.orgTwitter, globalSeo.orgFacebook, globalSeo.orgLinkedIn].filter(Boolean),
  };

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
        {/* Organization structured data for Google Knowledge Panel */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </body>
    </html>
  );
}
