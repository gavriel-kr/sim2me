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

// Placeholder SVG card when no featured image
function CardPlaceholder({ bgColor }: { bgColor?: string }) {
  return (
    <div
      className="h-44 w-full flex items-center justify-center"
      style={{ background: bgColor || 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}
    >
      <svg className="h-12 w-12 text-emerald-300 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  );
}

export function ArticlesIndexClient({ articles, locale, heading }: Props) {
  const params = useParams();
  const prefix = (params.locale as string) === 'en' ? '' : `/${params.locale}`;
  const isRTL = locale === 'he' || locale === 'ar';

  // Read-more label with correct arrow direction
  const readMore = locale === 'he' ? '← קרא עוד'
    : locale === 'ar' ? '← اقرأ المزيد'
    : 'Read more →';

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{heading}</h1>
        <div className={`mt-2 h-1 w-16 rounded-full bg-emerald-500 ${isRTL ? 'mr-0 ml-auto' : ''}`} />
      </header>

      {articles.length === 0 ? (
        <p className={`text-gray-500 ${isRTL ? 'text-right' : ''}`}>
          {locale === 'he' ? 'אין מאמרים עדיין. חזרו בקרוב.' : locale === 'ar' ? 'لا توجد مقالات بعد. تحقق قريبًا.' : 'No articles published yet. Check back soon.'}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => {
            // Support bg: prefix for custom card background color
            const isBgColor = a.featuredImage?.startsWith('bg:');
            const bgColor = isBgColor ? a.featuredImage!.slice(3) : undefined;

            return (
              <article key={a.id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                {a.featuredImage && !isBgColor ? (
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                    <Image src={a.featuredImage} alt={a.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                ) : (
                  <CardPlaceholder bgColor={bgColor} />
                )}

                <div className="flex flex-1 flex-col p-5" dir={isRTL ? 'rtl' : 'ltr'}>
                  <p className="text-xs text-gray-400 mb-2">{formatDate(a.createdAt, locale)}</p>
                  <h2 className="text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">
                    <Link href={`${prefix}/articles/${a.slug}`}>{a.title}</Link>
                  </h2>
                  {a.excerpt && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3">{a.excerpt}</p>
                  )}
                  <div className="mt-auto pt-4">
                    <Link
                      href={`${prefix}/articles/${a.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
                    >
                      {readMore}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
