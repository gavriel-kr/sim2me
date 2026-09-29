import { cache } from 'react';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { countPublishedArticles, getArticlesForReader } from '@/lib/articles';
import { getArticlesDefaultImage } from '@/lib/articles-default-image';
import { ArticlesIndexClient } from './ArticlesIndexClient';
import { MainLayout } from '@/components/layout/MainLayout';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const INDEX_META: Record<string, { title: string; desc: string }> = {
  en: {
    title: 'eSIM Travel Guides | Sim2Me',
    desc: 'Practical eSIM guides for international travelers: data plans, eSIMs with a phone number, setup and coverage in 200+ countries.',
  },
  he: {
    title: 'מדריכי eSIM לטיול | Sim2Me',
    desc: 'מדריכים מעשיים ל-eSIM בחו״ל: חבילות גלישה, eSIM עם מספר טלפון, התקנה וכיסוי ב-200+ מדינות.',
  },
  ar: {
    title: 'أدلة eSIM للسفر | Sim2Me',
    desc: 'أدلة عملية لشرائح eSIM للمسافرين: باقات الإنترنت، وeSIM مع رقم هاتف، والتثبيت والتغطية في أكثر من 200 دولة.',
  },
  hi: {
    title: 'eSIM यात्रा गाइड | Sim2Me',
    desc: 'विदेश यात्रा के लिए eSIM गाइड: डेटा प्लान, फ़ोन नंबर वाला eSIM, सेटअप और 200+ देशों में कवरेज।',
  },
};

type Props = { params: Promise<{ locale: string }> };

const loadArticles = cache((locale: string) => getArticlesForReader(locale));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = INDEX_META[locale] || INDEX_META.en;
  const prefix = `/${locale}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net';
  // The Hindi index is worth indexing once it lists Hindi articles; until then it is the English
  // list in a Hindi shell (ticket 038).
  const hasHindi = (await countPublishedArticles('hi').catch(() => 0)) > 0;
  return {
    // Already ends with the brand; `absolute` stops the layout's "%s | Sim2Me" template adding it twice.
    title: { absolute: meta.title },
    description: meta.desc,
    robots: locale === 'hi' && !hasHindi ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: `${siteUrl}${prefix}/articles`,
      languages: {
        en:          `${siteUrl}/en/articles`,
        he:          `${siteUrl}/he/articles`,
        ar:          `${siteUrl}/ar/articles`,
        ...(hasHindi && { hi: `${siteUrl}/hi/articles` }),
        'x-default': `${siteUrl}/en/articles`,
      },
    },
    openGraph: { title: meta.title, description: meta.desc, url: `${siteUrl}${prefix}/articles`, type: 'website' },
  };
}

export default async function ArticlesIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const [articles, defaultImage] = await Promise.all([
    loadArticles(locale),
    getArticlesDefaultImage(),
  ]);

  const headings: Record<string, string> = {
    en: 'eSIM Travel Guides',
    he: 'מדריכי eSIM לטיול',
    ar: 'أدلة eSIM للسفر',
    hi: 'eSIM यात्रा गाइड',
  };

  return (
    <MainLayout>
      <ArticlesIndexClient articles={articles} locale={locale} heading={headings[locale] || headings.en} defaultImage={defaultImage} />
    </MainLayout>
  );
}
