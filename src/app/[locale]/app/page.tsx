import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Smartphone, Globe, Download, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: 'App – Sim2Me eSIM',
    description: 'Get the Sim2Me app. Use the website on your phone, or add to home screen. Native app coming soon to App Store and Google Play.',
    alternates: { canonical: `${siteUrl}${prefix}/app` },
  };
}

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('app');
  const isRTL = locale === 'he' || locale === 'ar';

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="space-y-6">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">{t('webNow')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('webDesc')}</p>
                  <a
                    href="https://www.sim2me.net"
                    className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    sim2me.net →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 border-dashed">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Smartphone className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">{t('pwaSoon')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('pwaDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 border-dashed">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">{t('nativeSoon')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('nativeDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="text-sm font-medium text-foreground">{t('notifyCta')}</p>
            <a
              href={locale === 'en' ? '/contact' : `/${locale}/contact`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Mail className="h-4 w-4" />
              {t('contactUs')}
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
