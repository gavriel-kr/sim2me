import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getPublishedArticles, toArticleLocale } from '@/lib/articles';
import { getArticlesDefaultImage } from '@/lib/articles-default-image';
import { ArticlesIndexClient } from './ArticlesIndexClient';
import { MainLayout } from '@/components/layout/MainLayout';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const INDEX_META: Record<string, { title: string; desc: string }> = {
  en: {
    title: 'eSIM Travel Guides | Sim2Me',
    desc: 'Practical eSIM guides for international travelers. Compare plans, learn setup, and stay connected in 200+ countries.',
  },
  he: {
    title: 'מדריכי eSIM לטיול | Sim2Me',
    desc: 'מדריכים מעשיים ל-eSIM לנסיעות בינלאומיות. השוו תוכניות, למדו התקנה והישארו מחוברים ב-200+ מדינות.',
  },
  ar: {
    title: 'أدلة eSIM للسفر | Sim2Me',
    desc: 'أدلة عملية لشرائح eSIM للمسافرين دوليًا. قارن الخطط وتعلم الإعداد وابق متصلًا في أكثر من 200 دولة.',
  },
  hi: {
    title: 'eSIM यात्रा गाइड (अंग्रेज़ी में) | Sim2Me',
    desc: 'अंतरराष्ट्रीय यात्रियों के लिए व्यावहारिक eSIM गाइड, अंग्रेज़ी में। प्लान की तुलना करें, सेटअप सीखें और 200+ देशों में जुड़े रहें।',
  },
};

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = INDEX_META[locale] || INDEX_META.en;
  const prefix = `/${locale}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net';
  return {
    title: meta.title,
    description: meta.desc,
    // Hindi has no translated articles, so its index is the English list in a Hindi shell —
    // useful to a reader, not something to add to the index (ticket 038).
    robots: locale === 'hi' ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: `${siteUrl}${prefix}/articles`,
      languages: {
        en:          `${siteUrl}/en/articles`,
        he:          `${siteUrl}/he/articles`,
        ar:          `${siteUrl}/ar/articles`,
        'x-default': `${siteUrl}/en/articles`,
      },
    },
    openGraph: { title: meta.title, description: meta.desc },
  };
}

export default async function ArticlesIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const [articles, defaultImage] = await Promise.all([
    getPublishedArticles(toArticleLocale(locale)),
    getArticlesDefaultImage(),
  ]);

  const headings: Record<string, string> = {
    en: 'eSIM Travel Guides',
    he: 'מדריכי eSIM לטיול',
    ar: 'أدلة eSIM للسفر',
    hi: 'eSIM यात्रा गाइड (अंग्रेज़ी में)',
  };

  return (
    <MainLayout>
      <ArticlesIndexClient articles={articles} locale={locale} heading={headings[locale] || headings.en} defaultImage={defaultImage} />
    </MainLayout>
  );
}
