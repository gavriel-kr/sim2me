import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { HelpClient } from './HelpClient';
import { ContactBlock } from '@/components/sections/ContactBlock';
import { getCmsPage } from '@/lib/cms';
import { mockFaqs } from '@/data/faq';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
const seoByLocale: Record<string, { title: string; desc: string }> = {
  en: { title: 'eSIM Help Center & FAQ – Installation, Activation & Troubleshooting', desc: 'Find answers to common eSIM questions. How to install, activate, troubleshoot connectivity issues, refund policy, dual SIM usage, hotspot and more.' },
  he: { title: 'מרכז עזרה eSIM ושאלות נפוצות – התקנה, הפעלה ופתרון בעיות', desc: 'מצא תשובות לשאלות נפוצות על eSIM. התקנה, הפעלה, פתרון בעיות, מדיניות החזרים, Dual SIM ועוד.' },
  ar: { title: 'مركز مساعدة eSIM والأسئلة الشائعة – التثبيت والتفعيل واستكشاف الأخطاء', desc: 'اعثر على إجابات للأسئلة الشائعة حول eSIM. التثبيت، التفعيل، استكشاف الأخطاء، سياسة الاسترداد والمزيد.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('help', locale as 'en' | 'he' | 'ar');
  const seo = seoByLocale[locale] || seoByLocale.en;
  const prefix = `/${locale}`;
  return {
    title: cms?.seoTitle || seo.title,
    description: cms?.seoDesc || seo.desc,
    alternates: { canonical: `${siteUrl}${prefix}/help` },
  };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('help', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('help');
  const tFaq = await getTranslations('faq');
  const isRTL = locale === 'he' || locale === 'ar';

  /* FAQ JSON-LD structured data for Google rich snippets.
     Ticket 036: derived from `mockFaqs` rather than a second hand-maintained list. The two had already
     drifted — the page rendered a question the structured data did not know about. */
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: mockFaqs.map((faq) => ({
      '@type': 'Question',
      name: tFaq(faq.questionKey),
      acceptedAnswer: {
        '@type': 'Answer',
        text: tFaq(faq.answerKey),
      },
    })),
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container mx-auto max-w-3xl px-4 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mx-auto mb-10 flex flex-col items-center justify-center gap-4 text-center sm:flex-row">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold sm:text-4xl">{cms?.title || t('title')}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
          </div>
          <CharacterFigure
            slot="helpReassuring"
            height={148}
            heightLg={176}
            crop={0.5}
            className="shrink-0"
          />
        </div>
        <HelpClient />
      </div>

      {/*
        The contact page is out of the header menu, so the way to reach a person is at the
        end of the answers — read the FAQ, and if none of it fits, write from the same page.

        Its own section outside the `max-w-3xl` column above: the block is a two-column layout that
        needs the wider container, and the reading column for questions should stay narrow.
      */}
      <section id="contact" className="scroll-mt-20 border-t border-border bg-muted/20 py-14" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t('notFoundTitle')}</h2>
            <p className="mt-3 text-muted-foreground">{t('notFoundDesc')}</p>
          </div>
          <div className="mt-10">
            <ContactBlock onHelpPage />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
