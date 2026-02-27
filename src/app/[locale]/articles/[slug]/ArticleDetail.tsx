'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { ArticleFull, ArticleSummary } from '@/lib/articles';

interface Props {
  article: ArticleFull;
  locale: string;
  canonical: string;
  relatedArticles: ArticleSummary[];
  defaultImage?: { url: string; alt: string } | null;
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-AE' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(date));
}

function RelatedCardPlaceholder({ bgColor }: { bgColor?: string }) {
  return (
    <div
      className="h-32 w-full flex items-center justify-center"
      style={{ background: bgColor || 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}
    >
      <svg className="h-10 w-10 text-emerald-300 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      </svg>
    </div>
  );
}

export function ArticleDetail({ article, locale, relatedArticles, defaultImage }: Props) {
  const params = useParams();
  const prefix = (params.locale as string) === 'en' ? '' : `/${params.locale}`;
  const isRTL = locale === 'he' || locale === 'ar';

  const breadcrumbLabel = locale === 'he' ? 'מדריכים' : locale === 'ar' ? 'أدلة' : 'Articles';
  const relatedHeading = locale === 'he' ? 'עוד מדריכים מומלצים עבורך' : locale === 'ar' ? 'المزيد من الأدلة الموصى بها لك' : 'More recommended guides for you';

  return (
    <div className="bg-white min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero image */}
      {(article.featuredImage && !article.featuredImage.startsWith('bg:')) ? (
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          <Image src={article.featuredImage} alt={article.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : defaultImage?.url ? (
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          <Image src={defaultImage.url} alt={defaultImage.alt || article.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : null}

      <div className="container mx-auto max-w-3xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className={`mb-6 flex items-center gap-2 text-sm text-gray-500 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`} aria-label="breadcrumb">
          <Link href={`${prefix}/`} className="hover:text-emerald-600">
            {locale === 'he' ? 'בית' : locale === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <span>/</span>
          <Link href={`${prefix}/articles`} className="hover:text-emerald-600">{breadcrumbLabel}</Link>
          <span>/</span>
          <span className="text-gray-700 truncate max-w-xs">{article.title}</span>
        </nav>

        <header className="mb-8">
          <h1
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl leading-tight"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            {formatDate(article.createdAt, locale)}
            {article.updatedAt > article.createdAt && (
              <> · {locale === 'he' ? 'עודכן' : locale === 'ar' ? 'محدّث' : 'Updated'} {formatDate(article.updatedAt, locale)}</>
            )}
          </p>
        </header>

        {/* Article body */}
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="prose prose-gray max-w-none prose-headings:font-bold prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-table:text-sm"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Related articles (2–3 same language, random order) */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 border-t border-gray-100 pt-8" aria-label={relatedHeading}>
            <h2 className="text-lg font-bold text-gray-900 mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
              {relatedHeading}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedArticles.map((a) => {
                const isBgColor = a.featuredImage?.startsWith('bg:');
                const bgColor = isBgColor ? a.featuredImage!.slice(3) : undefined;
                return (
                  <Link
                    key={a.id}
                    href={`${prefix}/articles/${a.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {a.featuredImage && !isBgColor ? (
                      <div className="relative h-32 w-full overflow-hidden bg-gray-100">
                        <Image src={a.featuredImage} alt={a.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    ) : defaultImage?.url ? (
                      <div className="relative h-32 w-full overflow-hidden bg-gray-100">
                        <Image src={defaultImage.url} alt={defaultImage.alt || a.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    ) : (
                      <RelatedCardPlaceholder bgColor={bgColor} />
                    )}
                    <div className="flex flex-1 flex-col p-3" dir={isRTL ? 'rtl' : 'ltr'}>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{a.excerpt}</p>
                      )}
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        {isRTL ? '← קרא עוד' : locale === 'ar' ? '← اقرأ المزيد' : 'Read more →'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Back nav */}
        <div className="mt-10 border-t border-gray-100 pt-6">
          <Link href={`${prefix}/articles`} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900">
            {isRTL ? `${breadcrumbLabel} →` : `← ${breadcrumbLabel}`}
          </Link>
        </div>
      </div>
    </div>
  );
}
