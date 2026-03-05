import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Extract destination name from article title per locale:
 *   HE "איסים למאוריטניה"  → "מאוריטניה" → keyword "eSIM למאוריטניה"
 *   AR "eSIM لموريتانيا"   → "موريتانيا"  → keyword "eSIM لموريتانيا"
 *   EN title or slug       → "Mauritania"  → keyword "eSIM for Mauritania"
 */
function generateFocusKeyword(title: string, slug: string, locale: string): string | null {
  if (locale === 'he') {
    // Find "ל[destination]" — the directional lamed attached to the destination
    const match = title.match(/ל(\S{2,}(?:\s+\S+)*)$/u);
    if (match) return `eSIM ל${match[1].trim()}`;
    // Fallback: strip "איסים" and prepend "eSIM"
    const cleaned = title.replace(/^(איסים|esim)\s*/iu, '').trim();
    if (cleaned) return `eSIM ${cleaned}`;
  }

  if (locale === 'ar') {
    // Find "لـ[dest]" or "ل[dest]"
    const match = title.match(/ل[ـ]?(\S{2,}(?:\s+\S+)*)$/u);
    if (match) return `eSIM لـ${match[1].trim()}`;
    const cleaned = title.replace(/^(esim|إيسيم)\s*/iu, '').trim();
    if (cleaned) return `eSIM ${cleaned}`;
  }

  // English / fallback: extract from slug
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
 * Auto-fills focusKeyword for articles that currently have none.
 * Returns { updated: number, skipped: number, details: [...] }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const overwrite = body?.overwrite === true; // if true, also overwrite existing keywords

  const articles = await prisma.article.findMany({
    select: { id: true, title: true, slug: true, locale: true, focusKeyword: true },
  });

  let updated = 0;
  let skipped = 0;
  const details: { id: string; title: string; keyword: string }[] = [];

  const ops = articles
    .filter((a) => overwrite || !a.focusKeyword?.trim())
    .map((a) => {
      const keyword = generateFocusKeyword(a.title, a.slug, a.locale);
      if (!keyword) { skipped++; return null; }
      updated++;
      details.push({ id: a.id, title: a.title, keyword });
      return prisma.article.update({
        where: { id: a.id },
        data: { focusKeyword: keyword },
      });
    })
    .filter(Boolean) as ReturnType<typeof prisma.article.update>[];

  skipped += articles.filter((a) => !overwrite && a.focusKeyword?.trim()).length;

  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  return NextResponse.json({ updated, skipped, details });
}
