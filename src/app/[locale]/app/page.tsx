import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Smartphone, Globe, Download, ArrowRight, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: 'App – Sim2Me eSIM',
    description: 'Get the Sim2Me app. Manage your eSIMs, browse plans, and stay connected anywhere.',
    alternates: { canonical: `${siteUrl}${prefix}/app` },
  };
}

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isRTL = locale === 'he' || locale === 'ar';

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Wifi className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl tracking-tight">Sim2Me App</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Manage your eSIMs and browse plans — right from your phone.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="rounded-2xl bg-primary p-6 text-center mb-8 shadow-lg">
          <p className="text-primary-foreground/80 text-sm font-medium mb-2 uppercase tracking-wide">
            Available now · No download needed
          </p>
          <p className="text-2xl font-bold text-primary-foreground mb-4">
            Open the Sim2Me App
          </p>
          <a
            href="/app/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-bold text-primary transition-opacity hover:opacity-90 shadow"
          >
            <Smartphone className="h-5 w-5" />
            Install &amp; Open App
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-primary-foreground/70 text-xs">
            Add to Home Screen for the full app experience
          </p>
        </div>

        {/* Feature cards */}
        <div className="space-y-4">
          <Card className="border-gray-200">
            <CardContent className="pt-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Browse &amp; Buy Plans</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Search 200+ destinations and buy eSIM data plans from your phone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Manage Your eSIMs</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    View data usage, QR codes, and activation codes for all your eSIMs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Native Apps — Coming Soon</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    iOS App Store and Google Play versions are in development.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to install hint */}
        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-5">
          <p className="text-sm font-semibold text-foreground mb-2">How to add to Home Screen</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li><strong>iPhone:</strong> Open in Safari → Share → Add to Home Screen</li>
            <li><strong>Android:</strong> Open in Chrome → Menu → Add to Home Screen</li>
          </ol>
        </div>

      </div>
    </MainLayout>
  );
}
