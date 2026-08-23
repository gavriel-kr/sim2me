import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const SITE_URL = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'howItWorks' });
  return {
    title: t('installTitle'),
    description: t('subtitle'),
    alternates: { canonical: `${SITE_URL}/${locale}/installation-guide` },
  };
}

export default async function InstallationGuidePage() {
  const t = await getTranslations('howItWorks');
  const tSuccess = await getTranslations('success');
  const iphoneSteps = ['iphoneStep1', 'iphoneStep2', 'iphoneStep3', 'iphoneStep4', 'iphoneStep5'] as const;
  const androidSteps = ['androidStep1', 'androidStep2', 'androidStep3', 'androidStep4', 'androidStep5'] as const;

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-primary">{t('installTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('printHint')}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('guideMailAccount')}</p>

        <div className="mt-8 space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
          <section>
            <h2 className="text-lg font-semibold">{t('iphoneTitle')}</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {iphoneSteps.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ol>
          </section>
          <section>
            <h2 className="text-lg font-semibold">{t('androidTitle')}</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {androidSteps.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ol>
          </section>
          <section>
            <h2 className="text-lg font-semibold">{t('oneTapTitle')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('oneTapHint')}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>{t('oneTapApple')}</li>
              <li>{t('oneTapAndroid')}</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold">{t('goldenTitle')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('goldenIntro')}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>{t('goldenStep1')}</li>
              <li>{t('goldenStep2')}</li>
              <li>{t('goldenStep3')}</li>
              <li>{t('goldenStep4')}</li>
              <li>{t('goldenStep5')}</li>
            </ol>
            <p className="mt-3 text-sm font-semibold text-amber-800">{t('goldenWarning')}</p>
          </section>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <IntlLink href="/" className="text-primary hover:underline">{tSuccess('backToHome')}</IntlLink>
        </p>
      </div>
    </MainLayout>
  );
}
