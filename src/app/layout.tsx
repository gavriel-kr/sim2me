import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { brandConfig } from '@/config/brand';
import { Providers } from '@/components/providers/Providers';
import '@/app/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const siteUrl = 'https://www.sim2me.net';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brandConfig.name} – Buy eSIM Online for 200+ Countries | Instant Delivery`,
    template: `%s | ${brandConfig.name}`,
  },
  description:
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
    title: `${brandConfig.name} – Buy eSIM Online for 200+ Countries`,
    description: 'Instant eSIM delivery for travelers. No physical SIM, no roaming fees. Compare plans and get connected in minutes.',
    locale: 'en_US',
    alternateLocale: ['he_IL', 'ar_SA'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@sim2me',
    title: `${brandConfig.name} – Buy eSIM Online`,
    description: 'Instant eSIM for 200+ countries. Best prices, instant delivery.',
  },
  alternates: {
    canonical: siteUrl,
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
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
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
        {/* Google Tag Manager - as high in head as possible */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NSQKP7XQ');`,
          }}
        />
        {/* Google tag (gtag.js) - GA4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Y5BJ7VNNYM" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-Y5BJ7VNNYM');`,
          }}
        />
      </head>
      <body className="font-sans">
        {/* Google Tag Manager (noscript) - immediately after opening body */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NSQKP7XQ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
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
