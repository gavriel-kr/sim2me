import { notFound } from 'next/navigation';
import { getDestinationBySlug } from '@/lib/api/repositories/destinationsRepository';
import { getPlanById } from '@/lib/api/repositories/plansRepository';
import { translatePlanName } from '@/lib/translate-plan-name';
import { MainLayout } from '@/components/layout/MainLayout';
import { PlanDetailClient } from './PlanDetailClient';
import type { Plan } from '@/types';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.sim2me.net';

const REGION_TRANSLATIONS: Record<string, Record<string, string>> = {
  he: {
    'Africa': 'אפריקה', 'Europe': 'אירופה', 'Asia': 'אסיה',
    'North America': 'צפון אמריקה', 'South America': 'דרום אמריקה',
    'Oceania': 'אוקיאניה', 'Middle East': 'המזרח התיכון', 'Caribbean': 'הקריביים',
    'Global': 'עולמי', 'N. America': 'צפון אמריקה', 'S. America': 'דרום אמריקה',
  },
  ar: {
    'Africa': 'أفريقيا', 'Europe': 'أوروبا', 'Asia': 'آسيا',
    'North America': 'أمريكا الشمالية', 'South America': 'أمريكا الجنوبية',
    'Oceania': 'أوقيانوسيا', 'Middle East': 'الشرق الأوسط', 'Caribbean': 'الكاريبي',
    'Global': 'عالمي', 'N. America': 'أمريكا الشمالية', 'S. America': 'أمريكا الجنوبية',
  },
};

function translateDestinationName(name: string, isoCode: string, locale: string): string {
  if (locale === 'en') return name;
  const isRegional = isoCode.length > 2;
  if (!isRegional && isoCode.length === 2) {
    try {
      const displayName = new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode.toUpperCase());
      if (displayName) return displayName;
    } catch {}
  }
  if (isRegional) {
    const translations = REGION_TRANSLATIONS[locale];
    if (translations) {
      for (const [en, local] of Object.entries(translations)) {
        if (name.includes(en)) return name.replace(en, local);
      }
    }
  }
  return name;
}

interface PageProps {
  params: Promise<{ locale: string; slug: string; planId: string }>;
}

function localizedPlan(plan: { name: string; destinationId: string }, destination: { name: string; isoCode: string }, locale: string) {
  const isRegional = destination.isoCode.length > 2;
  return {
    ...plan,
    name: translatePlanName(plan.name, destination.name, destination.isoCode, isRegional, locale),
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug, planId } = await params;
  const destination = await getDestinationBySlug(slug);
  const plan = await getPlanById(planId);
  if (!destination || !plan) return { title: 'Plan' };
  const localizedDestination = {
    ...destination,
    name: translateDestinationName(destination.name, destination.isoCode, locale),
  };
  const planLocalized = localizedPlan(plan, localizedDestination, locale);
  const prefix = `/${locale}`;
  return {
    title: `${planLocalized.name} – eSIM ${localizedDestination.name}`,
    description: `Buy ${planLocalized.name} eSIM for ${localizedDestination.name}. ${plan.networkType}, ${plan.dataDisplay} data, ${plan.days} days.`,
    alternates: {
      canonical: `${SITE_URL}${prefix}/destinations/${slug}/plan/${planId}`,
    },
  };
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { slug, planId, locale } = await params;
  const destination = await getDestinationBySlug(slug);
  const plan = await getPlanById(planId);
  if (!destination || !plan) notFound();

  const localizedDestination = {
    ...destination,
    name: translateDestinationName(destination.name, destination.isoCode, locale),
  };
  const planLocalized = localizedPlan(plan, localizedDestination, locale);

  return (
    <MainLayout>
      <PlanDetailClient destination={localizedDestination} plan={planLocalized as Plan} />
    </MainLayout>
  );
}
