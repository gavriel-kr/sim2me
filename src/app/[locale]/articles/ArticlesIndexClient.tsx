'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { ArticleSummary } from '@/lib/articles';

// Derive a unique visual identity per article from its slug
function getArticleVisual(slug: string): { gradient: string; icon: string } {
  const map: Record<string, { gradient: string; icon: string }> = {
    'best-esim-for-travel':          { gradient: 'from-emerald-400 to-teal-600',   icon: '✈️' },
    'esim-europe-guide':             { gradient: 'from-blue-400 to-indigo-600',    icon: '🇪🇺' },
    'esim-usa-guide':                { gradient: 'from-red-400 to-rose-600',       icon: '🗽' },
    'esim-vs-physical-sim-vs-roaming': { gradient: 'from-violet-400 to-purple-600', icon: '⚖️' },
    'how-does-esim-work':            { gradient: 'from-cyan-400 to-blue-600',      icon: '📡' },
    'esim-japan-guide':              { gradient: 'from-pink-400 to-red-500',       icon: '🗾' },
    'esim-thailand-guide':           { gradient: 'from-yellow-400 to-orange-500',  icon: '🌴' },
    'esim-australia-guide':          { gradient: 'from-amber-400 to-yellow-600',   icon: '🦘' },
    'esim-for-iphone':               { gradient: 'from-slate-400 to-gray-700',     icon: '📱' },
    'esim-uae-dubai-guide':          { gradient: 'from-yellow-300 to-amber-500',   icon: '🏙️' },
    'esim-letayel-madrich-shalem':   { gradient: 'from-emerald-400 to-teal-600',   icon: '✈️' },
    'esim-artsot-habrit':            { gradient: 'from-red-400 to-rose-600',       icon: '🗽' },
    'esim-europa-madrich':           { gradient: 'from-blue-400 to-indigo-600',    icon: '🇪🇺' },
    'esim-thailand-he':              { gradient: 'from-yellow-400 to-orange-500',  icon: '🌴' },
    'esim-dubai-he':                 { gradient: 'from-yellow-300 to-amber-500',   icon: '🏙️' },
    'afdal-esim-lissafar':           { gradient: 'from-emerald-400 to-teal-600',   icon: '✈️' },
    'esim-alimarat-dubai':           { gradient: 'from-yellow-300 to-amber-500',   icon: '🏙️' },
    'kayfiyyat-tafeel-esim':         { gradient: 'from-cyan-400 to-blue-600',      icon: '📡' },
    'esim-moqabil-sim-taqlidi':      { gradient: 'from-violet-400 to-purple-600',  icon: '⚖️' },
    'esim-assaoudiyya-khaleej':      { gradient: 'from-green-400 to-emerald-600',  icon: '🕌' },
  };
  // fallback: derive from slug hash
  const fallbacks = [
    { gradient: 'from-emerald-400 to-teal-600',  icon: '🌍' },
    { gradient: 'from-blue-400 to-indigo-600',   icon: '📶' },
    { gradient: 'from-orange-400 to-red-500',    icon: '📡' },
  ];
  return map[slug] ?? fallbacks[slug.length % fallbacks.length];
}

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
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <header className={`mb-10 ${locale === 'he' || locale === 'ar' ? 'text-right' : ''}`}>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{heading}</h1>
        <div className={`mt-2 h-1 w-16 rounded-full bg-emerald-500 ${locale === 'he' || locale === 'ar' ? 'mr-0 ml-auto' : ''}`} />
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
              ) : (() => {
                const visual = getArticleVisual(a.slug);
                return (
                  <div className={`h-44 w-full bg-gradient-to-br ${visual.gradient} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                    <span className="text-5xl drop-shadow-md">{visual.icon}</span>
                  </div>
                );
              })()}
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
    </div>
  );
}
