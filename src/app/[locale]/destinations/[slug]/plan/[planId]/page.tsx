import { notFound } from 'next/navigation';
import { getDestinationBySlug } from '@/lib/api/repositories/destinationsRepository';
import { getPlanById } from '@/lib/api/repositories/plansRepository';
import { translatePlanName } from '@/lib/translate-plan-name';
import { MainLayout } from '@/components/layout/MainLayout';
import { PlanDetailClient } from './PlanDetailClient';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.sim2me.net';

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
  const planLocalized = localizedPlan(plan, destination, locale);
  const prefix = `/${locale}`;
  return {
    title: `${planLocalized.name} – eSIM ${destination.name}`,
    description: `Buy ${planLocalized.name} eSIM for ${destination.name}. ${plan.networkType}, ${plan.dataDisplay} data, ${plan.days} days.`,
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

  const planLocalized = localizedPlan(plan, destination, locale);

  return (
    <MainLayout>
      <PlanDetailClient destination={destination} plan={planLocalized} />
    </MainLayout>
  );
}
