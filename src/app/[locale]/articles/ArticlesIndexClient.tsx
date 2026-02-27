'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { ArticleSummary } from '@/lib/articles';

interface Props {
  articles: ArticleSummary[];
  locale: string;
  heading: string;
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-AE' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(date));
}

export function ArticlesIndexClient({ articles, locale, heading }: Props) {
  const params = useParams();
  const prefix = (params.locale as string) === 'en' ? '' : `/${params.locale}`;

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{heading}</h1>
        <div className="mt-2 h-1 w-16 rounded-full bg-emerald-500" />
      </header>

      {articles.length === 0 ? (
        <p className="text-gray-500">No articles published yet. Check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <article key={a.id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              {a.featuredImage ? (
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  <Image src={a.featuredImage} alt={a.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
              ) : (
                <div className="h-44 w-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <span className="text-4xl">📡</span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs text-gray-400 mb-2">{formatDate(a.createdAt, locale)}</p>
                <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
                  <Link href={`${prefix}/articles/${a.slug}`}>{a.title}</Link>
                </h2>
                {a.excerpt && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3">{a.excerpt}</p>
                )}
                <div className="mt-4">
                  <Link
                    href={`${prefix}/articles/${a.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    {locale === 'he' ? 'קרא עוד →' : locale === 'ar' ? 'اقرأ المزيد ←' : 'Read more →'}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
