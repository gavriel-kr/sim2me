import { setRequestLocale, getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Hero } from '@/components/sections/Hero';
import { HotDealsSection } from '@/components/sections/HotDealsSection';
import { ForYouSection } from '@/components/sections/ForYouSection';
import { FeaturedPlans } from '@/components/sections/FeaturedPlans';
import { FAQSection } from '@/components/sections/FAQSection';
import { CTASection } from '@/components/sections/CTASection';
import { brandConfig } from '@/config/brand';
type Props = { params: Promise<{ locale: string }> };

const siteUrl = 'https://www.sim2me.net';

const seoByLocale: Record<string, { title: string; description: string }> = {
  en: {
    title: 'Buy eSIM Online – Instant Travel Data for 200+ Countries',
    description: 'Get instant eSIM for travel. No physical SIM, no roaming fees. Compare plans for 200+ countries, scan QR code and connect in minutes. Best prices guaranteed.',
  },
  he: {
    title: 'eSIM אונליין – נתונים מיידיים ל-200+ מדינות',
    description: 'קבל eSIM מיידי לנסיעות. בלי סים פיזי, בלי דמי נדידה. השווה חבילות ל-200+ מדינות, סרוק QR והתחבר תוך דקות.',
  },
  ar: {
    title: 'اشترِ eSIM أونلاين – بيانات سفر فورية لأكثر من 200 دولة',
    description: 'احصل على eSIM فوري للسفر. بدون شريحة فيزيائية، بدون رسوم تجوال. قارن الخطط لأكثر من 200 دولة واتصل في دقائق.',
  },
  hi: {
    title: 'ऑनलाइन eSIM खरीदें – 200+ देशों के लिए तुरंत ट्रैवल डेटा',
    description: 'यात्रा के लिए तुरंत eSIM पाएँ। कोई फ़िज़िकल SIM नहीं, कोई रोमिंग शुल्क नहीं। 200+ देशों के प्लान की तुलना करें, QR कोड स्कैन करें और मिनटों में जुड़ जाएँ।',
  },
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const seo = seoByLocale[locale] || seoByLocale.en;
  const prefix = `/${locale}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${siteUrl}${prefix}`,
      languages: {
        en:        `${siteUrl}/en`,
        he:        `${siteUrl}/he`,
        ar:        `${siteUrl}/ar`,
        hi:        `${siteUrl}/hi`,
        'x-default': `${siteUrl}/en`,
      },
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

  /* Derived from the brand config rather than listed here, so a profile we do not own cannot be
     published. Every entry is null today, and the key is omitted entirely rather than sent empty. */
  const socialProfiles = [
    brandConfig.social.facebook,
    brandConfig.social.instagram,
    brandConfig.social.twitter,
    brandConfig.social.linkedin,
  ].filter((url): url is string => Boolean(url));

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sim2Me',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: brandConfig.supportEmail,
      contactType: 'customer service',
      availableLanguage: ['English', 'Hebrew', 'Arabic'],
    },
    ...(socialProfiles.length > 0 && { sameAs: socialProfiles }),
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
      {/*
        `ValueProps` was dropped from the homepage on 2026-07-31 as redundant, and is left in the
        codebase unreferenced so restoring it is one import and one line. `TrustStrip` was dropped the
        same day and deleted in ticket 026: it repeated the hero's micro-trust row almost word for word,
        including the "24/7 support" claim, so an unreferenced file kept a false promise alive in every
        future audit of the copy.
      */}
      <Hero />
      <HotDealsSection />
      <ForYouSection />
      <FeaturedPlans />
      <FAQSection />
      <CTASection />
    </MainLayout>
  );
}
