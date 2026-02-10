import type { Metadata } from 'next';
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
        <meta name="theme-color" content="#0d9f6e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-sans">
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
