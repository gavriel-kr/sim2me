import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { ContactBlock } from '@/components/sections/ContactBlock';
import { getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.sim2me.net';
const seoByLocale: Record<string, { title: string; desc: string }> = {
  en: { title: 'Contact Sim2Me – eSIM Support & Help', desc: 'Need help with your eSIM? Contact Sim2Me support for installation help, activation issues, connectivity problems or refund requests.' },
  he: { title: 'יצירת קשר ותמיכה – eSIM למעל 200 מדינות', desc: 'צריכים עזרה עם ה-eSIM? צרו קשר עם התמיכה של Sim2Me בנוגע להתקנה, הפעלה, בעיות חיבור או בקשות החזר.' },
  ar: { title: 'اتصل بـ Sim2Me – دعم ومساعدة eSIM', desc: 'هل تحتاج مساعدة في eSIM؟ تواصل مع دعم Sim2Me بخصوص التثبيت أو التفعيل أو مشاكل الاتصال أو طلبات الاسترداد.' },
  hi: { title: 'Sim2Me से संपर्क करें – eSIM सहायता', desc: 'eSIM में मदद चाहिए? इंस्टॉलेशन, सक्रियण, कनेक्टिविटी की समस्या या रिफ़ंड के लिए Sim2Me सहायता से संपर्क करें। सहायता ईमेल पर, अंग्रेज़ी में।' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('contact', locale as 'en' | 'he' | 'ar');
  const seo = seoByLocale[locale] || seoByLocale.en;
  const prefix = `/${locale}`;
  return {
    title: cms?.seoTitle || seo.title,
    description: cms?.seoDesc || seo.desc,
    alternates: { canonical: `${siteUrl}${prefix}/contact` },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cms = await getCmsPage('contact', locale as 'en' | 'he' | 'ar');
  const t = await getTranslations('contact');
  const isRTL = locale === 'he' || locale === 'ar';

  return (
    <MainLayout>
      <section className="bg-gradient-to-b from-primary/[0.06] to-white py-16 sm:py-20" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 text-center sm:flex-row">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{cms?.title || t('title')}</h1>
              <p className="mt-3 text-lg text-muted-foreground">{t('subtitle')}</p>
            </div>
            <CharacterFigure
              slot="contactWaving"
              height={150}
              heightLg={200}
              crop={0.5}
              className="shrink-0"
            />
          </div>

          <div className="mt-12">
            <ContactBlock />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
