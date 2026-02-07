import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { brandConfig } from '@/config/brand';
import { Providers } from '@/components/providers/Providers';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    default: `${brandConfig.name} – ${brandConfig.tagline}`,
    template: `%s | ${brandConfig.name}`,
  },
  description:
    'Instant eSIM for 200+ countries. No physical SIM, no roaming fees. Buy online and get connected in minutes.',
  keywords: ['eSIM', 'travel', 'roaming', 'data', 'international'],
  openGraph: {
    type: 'website',
    siteName: brandConfig.name,
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
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
