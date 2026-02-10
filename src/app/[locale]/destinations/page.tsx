import { MainLayout } from '@/components/layout/MainLayout';
import { DestinationsClient } from './DestinationsClient';
import { setRequestLocale } from 'next-intl/server';

const siteUrl = 'https://www.sim2me.net';
const seoByLocale: Record<string, { title: string; desc: string }> = {
  en: { title: 'eSIM Destinations – Browse Plans for 200+ Countries & Regions', desc: 'Find eSIM data plans for any country or region. Compare prices, data allowances, and coverage. Europe, Asia, Americas, Africa, Middle East and more.' },
  he: { title: 'יעדי eSIM – חבילות ל-200+ מדינות ואזורים', desc: 'מצא חבילות eSIM לכל מדינה או אזור. השווה מחירים, נפחי נתונים וכיסוי. אירופה, אסיה, אמריקה, אפריקה, המזרח התיכון ועוד.' },
  ar: { title: 'وجهات eSIM – خطط لأكثر من 200 دولة ومنطقة', desc: 'اعثر على خطط بيانات eSIM لأي دولة أو منطقة. قارن الأسعار وحجم البيانات والتغطية. أوروبا، آسيا، أمريكا، أفريقيا والمزيد.' },
};

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const seo = seoByLocale[locale] || seoByLocale.en;
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return {
    title: seo.title,
    description: seo.desc,
    alternates: { canonical: `${siteUrl}${prefix}/destinations` },
  };
}

export default async function DestinationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <MainLayout>
      <DestinationsClient locale={locale} />
    </MainLayout>
  );
}
