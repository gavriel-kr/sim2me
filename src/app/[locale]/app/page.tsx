import { MainLayout } from '@/components/layout/MainLayout';
import { Smartphone, Globe, Download, ArrowRight, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const siteUrl = 'https://www.sim2me.net';
const APK_URL = 'https://expo.dev/accounts/sim2me/projects/sim2me/builds/dd2909ae-1689-4f7b-b4ef-1d3c1fc10856';

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

        {/* Android APK — primary CTA */}
        <div className="rounded-2xl bg-primary p-6 text-center mb-4 shadow-lg">
          <p className="text-primary-foreground/80 text-sm font-medium mb-1 uppercase tracking-wide">
            Android · Free Download
          </p>
          <p className="text-2xl font-bold text-primary-foreground mb-4">
            Download the Android App
          </p>
          <a
            href={APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-bold text-primary transition-opacity hover:opacity-90 shadow"
          >
            <Download className="h-5 w-5" />
            Download APK (Android)
          </a>
          <p className="mt-3 text-primary-foreground/70 text-xs">
            After downloading: open the file and tap Install
          </p>
        </div>

        {/* iOS notice */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-center mb-8">
          <p className="text-sm font-semibold text-foreground">iPhone (iOS) — Coming Soon</p>
          <p className="text-sm text-muted-foreground mt-1">
            iOS app is in development. Until then, use the web app below.
          </p>
        </div>

        {/* Web app fallback */}
        <div className="rounded-2xl border-2 border-primary/30 p-5 text-center mb-8">
          <p className="text-sm font-semibold text-foreground mb-2">Use the Web App (iOS + Android)</p>
          <p className="text-sm text-muted-foreground mb-4">
            Works on all devices. Add to Home Screen for the full app experience.
          </p>
          <a
            href="/app/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Smartphone className="h-4 w-4" />
            Open Web App
            <ArrowRight className="h-4 w-4" />
          </a>
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
        </div>

        {/* How to install APK */}
        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-5">
          <p className="text-sm font-semibold text-foreground mb-2">How to install the Android APK</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Tap "Download APK" above</li>
            <li>Open the downloaded file on your Android phone</li>
            <li>If asked, allow "Install from unknown sources" in Settings</li>
            <li>Tap Install — done!</li>
          </ol>
        </div>

      </div>
    </MainLayout>
  );
}
