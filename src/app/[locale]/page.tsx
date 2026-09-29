import { setRequestLocale, getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Hero } from '@/components/sections/Hero';
import { HotDealsSection } from '@/components/sections/HotDealsSection';
import { ForYouSection } from '@/components/sections/ForYouSection';
import { FeaturedPlans } from '@/components/sections/FeaturedPlans';
import { FAQSection } from '@/components/sections/FAQSection';
import { CTASection } from '@/components/sections/CTASection';
import { PhonePlansSection, type PhoneSectionData } from '@/components/sections/PhonePlansSection';
import { getPhonePlans } from '@/lib/phone-catalog';
import { getHomepageSections, type BadgeLocale } from '@/lib/homepage-sections';
import { brandConfig } from '@/config/brand';
type Props = { params: Promise<{ locale: string }> };

const siteUrl = 'https://www.sim2me.net';

const seoByLocale: Record<string, { title: string; description: string }> = {
  // Ticket 043: the description names the plans with a phone number as well as the data plans.
  en: {
    title: 'Buy eSIM Online – Data & Phone Numbers for 200+ Countries',
    description: 'Instant travel eSIM: data plans for 200+ countries, and eSIMs with a phone number for calls and SMS (US, Europe, global). No physical SIM, ready in minutes.',
  },
  he: {
    title: 'eSIM אונליין – גלישה ומספר טלפון ל-200+ מדינות',
    description: 'eSIM מיידי לחו״ל: חבילות גלישה ל-200+ מדינות, וגם eSIM עם מספר טלפון לשיחות ו-SMS (אמריקאי, אירופי וגלובלי). בלי סים פיזי, מוכן תוך דקות.',
  },
  ar: {
    title: 'اشترِ eSIM أونلاين – إنترنت ورقم هاتف لأكثر من 200 دولة',
    description: 'شريحة eSIM فورية للسفر: باقات إنترنت لأكثر من 200 دولة، وشرائح eSIM مع رقم هاتف للمكالمات والرسائل (أمريكي وأوروبي وعالمي). بدون شريحة فعلية، جاهزة خلال دقائق.',
  },
  hi: {
    title: 'ऑनलाइन eSIM – 200+ देशों के लिए डेटा और फ़ोन नंबर',
    description: 'यात्रा के लिए तुरंत eSIM: 200+ देशों के डेटा प्लान, और कॉल व SMS के लिए फ़ोन नंबर वाले eSIM (अमेरिका, यूरोप, ग्लोबल)। कोई फ़िज़िकल SIM नहीं, मिनटों में तैयार।',
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

  // Ticket 042: sections the admin can hide on Homepage Destinations (all shown by default), and
  // the activation badge's wording for this language if the admin wrote one.
  const sections = await getHomepageSections();
  const activationBadge = {
    show: sections.activationBadge,
    text: sections.activationBadgeText[locale as BadgeLocale] ?? null,
  };

  // Ticket 042: "from" prices per kind of number, from the plans the site actually shows.
  const phonePlans = (await getPhonePlans().catch(() => [])).filter((p) => p.visible);
  const cheapest = (region: string, maxDays = Infinity) => {
    const prices = phonePlans.filter((p) => p.region === region && p.days <= maxDays).map((p) => p.priceUsd);
    return prices.length ? Math.min(...prices) : null;
  };
  const featured = phonePlans.find((p) => p.featured) ?? null;
  const coverageOf = (region: string) => [...new Set(phonePlans.filter((p) => p.region === region).flatMap((p) => p.coverage))].sort();
  const phoneSection: PhoneSectionData = {
    fromUs: cheapest('us'),
    fromEurope: cheapest('europe'),
    fromGlobal: cheapest('global', 30),
    globalCount: phonePlans.find((p) => p.region === 'global')?.coverage.length ?? 0,
    coverage: { us: coverageOf('us'), europe: coverageOf('europe'), global: coverageOf('global') },
    coverageNames: Object.assign({}, ...phonePlans.map((p) => p.coverageNames)),
    spotlight: featured
      ? { region: featured.region, dataGb: featured.dataGb, days: featured.days, priceUsd: featured.priceUsd, badge: featured.saleBadge }
      : null,
  };

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
      <Hero phoneSection={phoneSection} activationBadge={activationBadge} />
      {/* Ticket 042: the phone-number section leads, above the day's deals (Gabriel, 2026-09-28). */}
      <PhonePlansSection data={phoneSection} />
      <HotDealsSection />
      {sections.forYou && <ForYouSection />}
      {sections.popularDestinations && <FeaturedPlans />}
      <FAQSection />
      <CTASection />
    </MainLayout>
  );
}
