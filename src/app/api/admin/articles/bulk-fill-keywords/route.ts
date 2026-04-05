import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Extract destination name from article title per locale:
 *   HE "איסים למאוריטניה"  → "מאוריטניה" → keyword "eSIM למאוריטניה"
 *   AR "eSIM لموريتانيا"   → "موريتانيا"  → keyword "eSIM لموريتانيا"
 *   EN title or slug       → "Mauritania"  → keyword "eSIM for Mauritania"
 */
function generateFocusKeyword(title: string, slug: string, locale: string): string | null {
  if (locale === 'he') {
    const match = title.match(/ל(\S{2,}(?:\s+\S+)*)$/u);
    if (match) return `eSIM ל${match[1].trim()}`;
    const cleaned = title.replace(/^(איסים|esim)\s*/iu, '').trim();
    if (cleaned) return `eSIM ${cleaned}`;
  }

  if (locale === 'ar') {
    const match = title.match(/ل[ـ]?(\S{2,}(?:\s+\S+)*)$/u);
    if (match) return `eSIM لـ${match[1].trim()}`;
    const cleaned = title.replace(/^(esim|إيسيم)\s*/iu, '').trim();
    if (cleaned) return `eSIM ${cleaned}`;
  }

  const destFromSlug = slug
    .replace(/^esim[-_](for[-_])?/i, '')
    .replace(/[-_](esim|sim|card|plan|data|travel|guide|prepaid|sim-card).*$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (destFromSlug && destFromSlug.length > 2) {
    const titleCase = destFromSlug
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `eSIM for ${titleCase}`;
  }

  return null;
}

/**
 * POST /api/admin/articles/bulk-fill-keywords
 * Auto-fills focusKeywordEn/He/Ar for articles that have none (per locale).
 * Returns { updated: number, skipped: number, details: [...] }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const overwrite = body?.overwrite === true;

  const articles = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleHe: true,
      titleAr: true,
      focusKeywordEn: true,
      focusKeywordHe: true,
      focusKeywordAr: true,
    },
  });

  let updated = 0;
  let skipped = 0;
  const details: { id: string; locale: string; title: string; keyword: string }[] = [];

  const ops: ReturnType<typeof prisma.article.update>[] = [];

  for (const a of articles) {
    const data: { focusKeywordEn?: string; focusKeywordHe?: string; focusKeywordAr?: string } = {};
    let changed = false;

    for (const locale of ['en', 'he', 'ar'] as const) {
      const title = a[`title${locale.charAt(0).toUpperCase() + locale.slice(1)}` as 'titleEn' | 'titleHe' | 'titleAr'];
      const currentKw = a[`focusKeyword${locale.charAt(0).toUpperCase() + locale.slice(1)}` as 'focusKeywordEn' | 'focusKeywordHe' | 'focusKeywordAr'];
      if (!title?.trim()) continue;
      if (!overwrite && currentKw?.trim()) {
        skipped++;
        continue;
      }
      const keyword = generateFocusKeyword(title, a.slug, locale);
      if (!keyword) {
        skipped++;
        continue;
      }
      data[`focusKeyword${locale.charAt(0).toUpperCase() + locale.slice(1)}` as 'focusKeywordEn' | 'focusKeywordHe' | 'focusKeywordAr'] = keyword;
      details.push({ id: a.id, locale, title, keyword });
      updated++;
      changed = true;
    }

    if (changed) {
      ops.push(
        prisma.article.update({
          where: { id: a.id },
          data,
        })
      );
    }
  }

  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  return NextResponse.json({ updated, skipped, details });
}
