import type { Metadata, Viewport } from 'next';
import { DM_Sans, Noto_Sans_Devanagari } from 'next/font/google';
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

/**
 * Devanagari, for the Hindi pages only (ticket 038).
 *
 * DM Sans has no Devanagari glyphs, so without this the browser falls back to whatever the device
 * happens to have — legible on most, but unrelated to the rest of the site's type.
 *
 * `preload: false` is the whole point of the arrangement: the class is attached only when the page is
 * Hindi, and preloading is off so English, Hebrew and Arabic visitors never pay for a font they cannot
 * read. The Hindi page then fetches it when the CSS rule in `globals.css` matches, showing the fallback
 * face for the moment in between.
 */
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-devanagari',
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
  const [{ logoUrl, brandingVersion }, globalSeo] = await Promise.all([
    getSiteBranding(),
    getGlobalSeoSettings(),
  ]);

  const siteUrl = globalSeo.canonicalDomain || 'https://www.sim2me.net';
  // Single static favicon everywhere – /favicon.ico rewrites to /favicon.png
  const iconUrl = '/favicon.ico?v=3';
  const appleIconUrl = '/icons/apple-touch-icon.png?v=3';

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
      alternateLocale: ['he_IL', 'ar_SA', 'hi_IN'],
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
        hi: `${siteUrl}/hi`,
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
      // Must be explicit: Next defaults `capable` to true whenever this object exists, which
      // emits mobile-web-app-capable and re-enables the install prompt we removed.
      capable: false,
      title: globalSeo.siteName || 'Sim2Me',
    },
    formatDetection: { telephone: false },
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

  const orgProfiles = [globalSeo.orgTwitter, globalSeo.orgFacebook, globalSeo.orgLinkedIn].filter(Boolean);

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: globalSeo.orgName || globalSeo.siteName || 'Sim2Me',
    url: globalSeo.orgUrl || siteUrl,
    ...(globalSeo.orgLogo && { logo: makeAbsolute(globalSeo.orgLogo, siteUrl) }),
    /* Omitted rather than published empty — every other optional key here follows the same rule. */
    ...(orgProfiles.length > 0 && { sameAs: orgProfiles }),
  };

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={locale === 'hi' ? `${dmSans.variable} ${notoDevanagari.variable}` : dmSans.variable}
    >
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
