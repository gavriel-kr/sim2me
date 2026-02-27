'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { ArticleFull } from '@/lib/articles';

interface Props {
  article: ArticleFull;
  locale: string;
  canonical: string;
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-AE' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(date));
}

export function ArticleDetail({ article, locale }: Props) {
  const params = useParams();
  const pathname = usePathname();
  const prefix = (params.locale as string) === 'en' ? '' : `/${params.locale}`;
  const isRTL = locale === 'he' || locale === 'ar';

  // #region agent log — H-A: confirm MainLayout is present after fix
  useEffect(() => {
    const hasHeader = !!document.querySelector('header');
    fetch('http://127.0.0.1:7242/ingest/31d3162a-817c-4d6a-9841-464cdcbf3b94', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ArticleDetail.tsx:mount',message:'H-A post-fix: article page rendered',data:{hasHeader,pathname,locale},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
  }, [pathname, locale]);
  // #endregion

  const breadcrumbLabel = locale === 'he' ? 'מדריכים' : locale === 'ar' ? 'أدلة' : 'Articles';

  return (
    <div className="bg-white min-h-screen">
      {/* Hero image */}
      {article.featuredImage && (
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          <Image src={article.featuredImage} alt={article.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

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

        <header className={`mb-8 ${isRTL ? 'text-right' : ''}`}>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl leading-tight">
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            {formatDate(article.createdAt, locale)}
            {article.updatedAt > article.createdAt && (
              <> · {locale === 'he' ? 'עודכן' : locale === 'ar' ? 'محدّث' : 'Updated'} {formatDate(article.updatedAt, locale)}</>
            )}
          </p>
        </header>

        {/* Article body — RTL handled at HTML level by root layout */}
        <div
          className={`prose prose-gray max-w-none prose-headings:font-bold prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-table:text-sm ${isRTL ? '[&_*]:text-right [&_h1]:text-right [&_h2]:text-right [&_h3]:text-right [&_li]:text-right' : ''}`}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Back nav */}
        <div className={`mt-12 border-t border-gray-100 pt-6 ${isRTL ? 'text-right' : ''}`}>
          <Link href={`${prefix}/articles`} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900">
            {isRTL ? `${breadcrumbLabel} →` : `← ${breadcrumbLabel}`}
          </Link>
        </div>
      </div>
    </div>
  );
}
