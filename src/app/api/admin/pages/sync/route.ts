import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        title: lang === en ? 'Terms of Service' : lang === he ? 'תנאי שימוש' : 'شروط الخدمة',
        content: lang === en
          ? 'These Terms of Service govern your use of Sim2Me eSIM services.\n\nPlease review the following terms carefully before using our services.'
          : lang === he
          ? 'תנאי שימוש אלו חלים על השימוש בשירותי eSIM של Sim2Me.\n\nאנא עיינו בתנאים הבאים בקפידה לפני השימוש בשירותינו.'
          : 'تحكم شروط الخدمة هذه استخدامك لخدمات eSIM من Sim2Me.\n\nيرجى مراجعة الشروط التالية بعناية قبل استخدام خدماتنا.',
      };
    case 'privacy':
      return {
        title: lang === en ? 'Privacy Policy' : lang === he ? 'מדיניות פרטיות' : 'سياسة الخصوصية',
        content: lang === en
          ? 'Your privacy is important to us. This policy explains how we collect, use, and protect your information.'
          : lang === he
          ? 'הפרטיות שלך חשובה לנו. מדיניות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך.'
          : 'خصوصيتك مهمة لنا. توضح هذه السياسة كيف نجمع معلوماتك ونستخدمها ونحميها.',
      };
    case 'refund':
      return {
        title: lang === en ? 'Refund Policy' : lang === he ? 'מדיניות החזרים' : 'سياسة الاسترداد',
        content: lang === en
          ? 'Unused eSIMs can be refunded within 14 days of purchase. Once installed or activated, plans are non-refundable.'
          : lang === he
          ? 'eSIM שלא נעשה בו שימוש ניתן להחזרה תוך 14 יום מהרכישה. לאחר התקנה או הפעלה, החבילות אינן ניתנות להחזרה.'
          : 'يمكن استرداد eSIM غير المستخدم خلال 14 يومًا من الشراء. بعد التثبيت أو التفعيل، الخطط غير قابلة للاسترداد.',
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
