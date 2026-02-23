import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { policies } from '@/content/policies';

// Import translation files directly
import en from '@/messages/en.json';
import he from '@/messages/he.json';
import ar from '@/messages/ar.json';

export const dynamic = 'force-dynamic';

/** Map page slug → translation section keys + how to format content */
function getPageContent(slug: string, lang: typeof en) {
  const l = lang as Record<string, Record<string, string>>;

  switch (slug) {
    case 'home': {
      const h = l.home;
      return {
        title: h?.heroTitle || '',
        content: [
          h?.heroSubtitle,
          '',
          `## ${h?.value1Title}`,
          h?.value1Desc,
          '',
          `## ${h?.value2Title}`,
          h?.value2Desc,
          '',
          `## ${h?.value3Title}`,
          h?.value3Desc,
          '',
          `## ${h?.ctaTitle}`,
          h?.ctaSubtitle,
        ].filter(Boolean).join('\n'),
      };
    }
    case 'about': {
      const a = l.about;
      return { title: a?.title || '', content: a?.mission || '' };
    }
    case 'contact': {
      const c = l.contact;
      return { title: c?.title || '', content: c?.subtitle || '' };
    }
    case 'how-it-works': {
      const h = l.howItWorks;
      return {
        title: h?.title || '',
        content: [
          `## ${h?.step1Title}`,
          h?.step1Desc,
          '',
          `## ${h?.step2Title}`,
          h?.step2Desc,
          '',
          `## ${h?.step3Title}`,
          h?.step3Desc,
        ].filter(Boolean).join('\n'),
      };
    }
    case 'compatible-devices': {
      const d = l.devices;
      return {
        title: d?.title || '',
        content: [
          d?.subtitle,
          '',
          `**iPhone:** ${d?.iphone}`,
          '',
          `**Android:** ${d?.android}`,
          '',
          d?.checkCompatibility,
        ].filter(Boolean).join('\n'),
      };
    }
    case 'help': {
      const h = l.help;
      const f = l.faq;
      const faqEntries = f ? Object.entries(f)
        .filter(([k]) => !k.startsWith('answer'))
        .map(([k, q]) => {
          const answerKey = `answer${k.charAt(0).toUpperCase() + k.slice(1)}`;
          return `### ${q}\n${f[answerKey] || ''}`;
        }) : [];
      return {
        title: h?.title || '',
        content: [
          h?.subtitle,
          '',
          '## FAQ',
          '',
          ...faqEntries,
        ].filter(Boolean).join('\n\n'),
      };
    }
    case 'destinations': {
      const d = l.destinations;
      return { title: d?.title || '', content: d?.subtitle || '' };
    }
    case 'terms':
      return {
        title: lang === en ? policies.terms.titleEn : lang === he ? policies.terms.titleHe : policies.terms.titleAr,
        content: lang === en ? policies.terms.contentEn : lang === he ? policies.terms.contentHe : policies.terms.contentAr,
      };
    case 'privacy':
      return {
        title: lang === en ? policies.privacy.titleEn : lang === he ? policies.privacy.titleHe : policies.privacy.titleAr,
        content: lang === en ? policies.privacy.contentEn : lang === he ? policies.privacy.contentHe : policies.privacy.contentAr,
      };
    case 'refund':
      return {
        title: lang === en ? policies.refund.titleEn : lang === he ? policies.refund.titleHe : policies.refund.titleAr,
        content: lang === en ? policies.refund.contentEn : lang === he ? policies.refund.contentHe : policies.refund.contentAr,
      };
    default:
      return { title: slug, content: '' };
  }
}

/**
 * POST /api/admin/pages/sync
 * Reads translation files and populates CMS pages with the existing content.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allSlugs = [
    'home', 'about', 'contact', 'how-it-works',
    'compatible-devices', 'help', 'destinations',
    'terms', 'privacy', 'refund',
  ];

  const results: string[] = [];

  for (const slug of allSlugs) {
    const enContent = getPageContent(slug, en);
    const heContent = getPageContent(slug, he);
    const arContent = getPageContent(slug, ar);

    await prisma.page.upsert({
      where: { slug },
      update: {
        titleEn: enContent.title,
        titleHe: heContent.title,
        titleAr: arContent.title,
        contentEn: enContent.content,
        contentHe: heContent.content,
        contentAr: arContent.content,
      },
      create: {
        slug,
        titleEn: enContent.title,
        titleHe: heContent.title,
        titleAr: arContent.title,
        contentEn: enContent.content,
        contentHe: heContent.content,
        contentAr: arContent.content,
        published: true,
      },
    });
    results.push(slug);
  }

  return NextResponse.json({
    message: `Synced ${results.length} pages`,
    pages: results,
  });
}
