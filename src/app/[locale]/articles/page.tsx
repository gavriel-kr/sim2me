import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getPublishedArticles, type ArticleLocale } from '@/lib/articles';
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
};

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = INDEX_META[locale] || INDEX_META.en;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net';
  return {
    title: meta.title,
    description: meta.desc,
    alternates: {
      canonical: `${siteUrl}${prefix}/articles`,
      languages: {
        en: `${siteUrl}/articles`,
        he: `${siteUrl}/he/articles`,
        ar: `${siteUrl}/ar/articles`,
      },
    },
    openGraph: { title: meta.title, description: meta.desc },
  };
}

export default async function ArticlesIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'en' | 'he' | 'ar')) notFound();
  setRequestLocale(locale);

  const articles = await getPublishedArticles(locale as ArticleLocale);

  const headings: Record<string, string> = {
    en: 'eSIM Travel Guides',
    he: 'מדריכי eSIM לטיול',
    ar: 'أدلة eSIM للسفر',
  };

  return (
    <MainLayout>
      <ArticlesIndexClient articles={articles} locale={locale} heading={headings[locale] || headings.en} />
    </MainLayout>
  );
}
