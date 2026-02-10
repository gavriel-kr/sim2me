import { setRequestLocale, getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Hero } from '@/components/sections/Hero';
import { ValueProps } from '@/components/sections/ValueProps';
import { FeaturedPlans } from '@/components/sections/FeaturedPlans';
import { TrustStrip } from '@/components/sections/TrustStrip';
import { FAQSection } from '@/components/sections/FAQSection';
import { CTASection } from '@/components/sections/CTASection';
import { NewsletterSection } from '@/components/sections/NewsletterSection';

type Props = { params: Promise<{ locale: string }> };

const siteUrl = 'https://www.sim2me.net';

const seoByLocale: Record<string, { title: string; description: string }> = {
  en: {
    title: 'Buy eSIM Online – Instant Travel Data for 200+ Countries',
    description: 'Get instant eSIM for travel. No physical SIM, no roaming fees. Compare plans for 200+ countries, scan QR code and connect in minutes. Best prices guaranteed.',
  },
  he: {
    title: 'קנה eSIM אונליין – נתונים מיידיים ל-200+ מדינות',
    description: 'קבל eSIM מיידי לנסיעות. בלי סים פיזי, בלי דמי נדידה. השווה חבילות ל-200+ מדינות, סרוק QR והתחבר תוך דקות.',
  },
  ar: {
    title: 'اشترِ eSIM أونلاين – بيانات سفر فورية لأكثر من 200 دولة',
    description: 'احصل على eSIM فوري للسفر. بدون شريحة فيزيائية، بدون رسوم تجوال. قارن الخطط لأكثر من 200 دولة واتصل في دقائق.',
  },
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const seo = seoByLocale[locale] || seoByLocale.en;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${siteUrl}${prefix}`,
      languages: { en: siteUrl, he: `${siteUrl}/he`, ar: `${siteUrl}/ar` },
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${siteUrl}${prefix}`,
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  /* JSON-LD structured data for SEO */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sim2Me',
    url: siteUrl,
    description: seoByLocale.en.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/destinations?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sim2Me',
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'gavriel.kr@gmail.com',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hebrew', 'Arabic'],
    },
    sameAs: [
      'https://twitter.com/sim2me',
      'https://facebook.com/sim2me',
      'https://instagram.com/sim2me',
    ],
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Hero />
      <ValueProps />
      <FeaturedPlans />
      <TrustStrip />
      <FAQSection />
      <CTASection />
      <NewsletterSection />
    </MainLayout>
  );
}
