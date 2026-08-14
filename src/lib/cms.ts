import { prisma } from '@/lib/prisma';

type Locale = 'en' | 'he' | 'ar';

/**
 * The locales that have their own CMS columns.
 *
 * Exhaustive on purpose. The suffix used to be resolved with a trailing `: 'Ar'`, so any locale that
 * was not English or Hebrew read the Arabic columns — which meant Hindi would have served Arabic terms
 * and privacy text on a left-to-right page, with no error to notice it by. A locale that is absent here
 * gets `null`, and every caller already treats `null` as "no CMS page, use the message file".
 */
const COLUMN_SUFFIX: Record<string, string> = { en: 'En', he: 'He', ar: 'Ar' };

interface CmsPage {
  title: string;
  content: string;
  seoTitle: string;
  seoDesc: string;
}

/**
 * Fetch CMS page content for a given slug and locale.
 * Returns null if no page exists or content is empty.
 */
export async function getCmsPage(slug: string, locale: Locale | string): Promise<CmsPage | null> {
  if (!process.env.DATABASE_URL) return null;
  const suffix = COLUMN_SUFFIX[locale];
  if (!suffix) return null;
  try {
    const page = await prisma.page.findUnique({
      where: { slug },
      include: { seo: true },
    });

    if (!page) return null;

    const title = (page as Record<string, unknown>)[`title${suffix}`] as string || '';
    const content = (page as Record<string, unknown>)[`content${suffix}`] as string || '';

    // Only return if there's actual content
    if (!title && !content) return null;

    const seoTitle = page.seo
      ? ((page.seo as Record<string, unknown>)[`metaTitle${suffix}`] as string || '')
      : '';
    const seoDesc = page.seo
      ? ((page.seo as Record<string, unknown>)[`metaDesc${suffix}`] as string || '')
      : '';

    return { title, content, seoTitle, seoDesc };
  } catch {
    return null;
  }
}
