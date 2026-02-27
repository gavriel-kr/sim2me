import { prisma } from '@/lib/prisma';

const KEY = 'articles_default_image';

export interface ArticlesDefaultImage {
  url: string;
  alt: string;
}

/** Server-side: get default image for articles (when no featured image). Public and admin use. */
export async function getArticlesDefaultImage(): Promise<ArticlesDefaultImage | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: KEY },
  });
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as { url?: string; alt?: string };
    if (typeof parsed.url === 'string' && parsed.url.trim()) {
      return {
        url: parsed.url.trim(),
        alt: typeof parsed.alt === 'string' ? parsed.alt.trim() : '',
      };
    }
  } catch {
    // ignore invalid JSON
  }
  return null;
}
