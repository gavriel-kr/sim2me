import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContactForm } from './ContactForm';
import { EmailCopyButton } from './EmailCopyButton';
import { Mail, Clock, HelpCircle, Smartphone, Wifi, RefreshCw, AlertCircle, Lightbulb } from 'lucide-react';
import { getCmsPage } from '@/lib/cms';
import { prisma } from '@/lib/prisma';
import { brandConfig } from '@/config/brand';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('contact', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('contact');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: cms?.seoTitle || `${t('title')} – Sim2Me eSIM Support`,
    description: cms?.seoDesc || 'Need help with your eSIM? Contact Sim2Me support for installation help, activation issues, connectivity problems or refund requests.',
    alternates: { canonical: `${siteUrl}${prefix}/contact` },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('contact', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('contact');
  const isRTL = locale === 'he' || locale === 'ar';

  // Get contact info from site settings (fallback: brand config)
  let email = brandConfig.supportEmail;
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: ['support_email'] } },
    });
    for (const s of settings) {
      if (s.key === 'support_email' && s.value) email = s.value;
    }
  } catch { /* use defaults */ }

  const issueTypes = [
    { key: 'issueInstall', icon: Smartphone },
    { key: 'issueActivation', icon: Wifi },
    { key: 'issueConnectivity', icon: AlertCircle },
    { key: 'issueRefund', icon: RefreshCw },
    { key: 'issueOther', icon: HelpCircle },
  ] as const;

  return (
    <MainLayout>
      <section className="bg-gradient-to-b from-primary/[0.06] to-white py-16 sm:py-20" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{cms?.title || t('title')}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            {/* Info cards */}
            <div className="flex flex-col gap-5 lg:col-span-2">
              {/* Support info */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <h3 className="font-bold text-foreground">{t('supportTitle')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t('supportDesc')}</p>
              </div>

              {/* Email */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{t('emailLabel')}</h3>
                <EmailCopyButton email={email} />
              </div>

              {/* Response time */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{t('responseTime')}</p>
              </div>

              {/* Before contacting tips */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-900 text-sm">{t('beforeContact')}</h3>
                </div>
                <ul className="space-y-2 text-xs text-amber-800/80">
                  <li>• {t('beforeTip1')}</li>
                  <li>• {t('beforeTip2')}</li>
                  <li>• {t('beforeTip3')}</li>
                </ul>
              </div>

              {/* Issue types */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground text-sm mb-3">{t('issueTypes')}</h3>
                <div className="flex flex-wrap gap-2">
                  {issueTypes.map(({ key, icon: Icon }) => (
                    <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                      <Icon className="h-3 w-3" />
                      {t(key)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 lg:col-span-3">
              <h2 className="text-xl font-bold text-foreground">{t('send')}</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
