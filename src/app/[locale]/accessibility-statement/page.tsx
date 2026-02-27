import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('accessibilityStatement');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: `${t('title')} – Sim2Me`,
    description:
      'Sim2Me accessibility statement. We aim to conform to WCAG 2.2 Level AA and the European Accessibility Act where applicable.',
    alternates: { canonical: `${siteUrl}${prefix}/accessibility-statement` },
  };
}

export default async function AccessibilityStatementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('accessibilityStatement');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('lastUpdated')}: February 2025
        </p>

        <section className="mt-8 space-y-6 text-muted-foreground">
          <p>{t('intro')}</p>

          <h2 className="text-lg font-semibold text-foreground">{t('conformanceTitle')}</h2>
          <p>{t('conformanceBody')}</p>

          <h2 className="text-lg font-semibold text-foreground">{t('whatWeHaveDoneTitle')}</h2>
          <p>{t('whatWeHaveDoneBody')}</p>

          <h2 className="text-lg font-semibold text-foreground">{t('knownIssuesTitle')}</h2>
          <p>{t('knownIssuesBody')}</p>

          <h2 className="text-lg font-semibold text-foreground">{t('feedbackTitle')}</h2>
          <p>
            {t('feedbackBody')}{' '}
            <IntlLink href="/contact" className="text-primary underline hover:no-underline">
              {t('contactLink')}
            </IntlLink>
            .
          </p>

          <h2 className="text-lg font-semibold text-foreground">{t('auditTitle')}</h2>
          <p>{t('auditBody')}</p>

          <p className="text-sm italic">{t('disclaimer')}</p>
        </section>
      </div>
    </MainLayout>
  );
}
