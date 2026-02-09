import { prisma } from '@/lib/prisma';

type Locale = 'en' | 'he' | 'ar';

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
export async function getCmsPage(slug: string, locale: Locale): Promise<CmsPage | null> {
  try {
    const suffix = locale === 'en' ? 'En' : locale === 'he' ? 'He' : 'Ar';

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
