import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('cookies', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('footer');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: cms?.seoTitle || `${t('cookieSettings')} – Sim2Me`,
    description:
      cms?.seoDesc ||
      'Learn how Sim2Me uses cookies and how to manage your preferences. Necessary, analytics, and marketing cookies explained.',
    alternates: { canonical: `${siteUrl}${prefix}/cookies` },
  };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('cookies', locale as 'en' | 'he' | 'ar');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {cms?.title || (locale === 'en' ? 'Cookie Policy' : locale === 'he' ? 'מדיניות עוגיות' : 'سياسة ملفات تعريف الارتباط')}
        </h1>
        <div className="prose prose-sm mt-6 text-muted-foreground whitespace-pre-line">
          {cms?.content || (
            <>
              <p>
                {locale === 'en' &&
                  'We use cookies to improve your experience, analyze traffic, and personalize content. You can accept all, reject all, or customize your preferences at any time using the "Cookie settings" link in the footer.'}
                {locale === 'he' &&
                  'אנו משתמשים בעוגיות כדי לשפר את חוויית המשתמש, לנתח תנועה ולהתאים תוכן. ניתן לאשר הכל, לדחות הכל או להתאים העדפות בכל עת באמצעות הקישור "הגדרות עוגיות" בתחתית האתר.'}
                {locale === 'ar' &&
                  'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة المرور وتخصيص المحتوى. يمكنك قبول الكل أو رفض الكل أو تخصيص تفضيلاتك في أي وقت باستخدام رابط "إعدادات ملفات تعريف الارتباط" في التذييل.'}
              </p>
              <p>
                {locale === 'en' && 'Necessary cookies are required for the site to function. Analytics and marketing cookies are optional and only loaded with your consent.'}
                {locale === 'he' && 'עוגיות הכרחיות נדרשות לפעילות האתר. עוגיות אנליטיקה ושיווק הן אופציונליות ונטענות רקכמתך.'}
                {locale === 'ar' && 'ملفات تعريف الارتباط الضرورية مطلوبة لعمل الموقع. ملفات التحليلات والتسويق اختيارية وتُحمّل فقط بموافقتك.'}
              </p>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
