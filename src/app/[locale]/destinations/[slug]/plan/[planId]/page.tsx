import { notFound } from 'next/navigation';
import { getDestinationBySlug } from '@/lib/api/repositories/destinationsRepository';
import { getPlanById } from '@/lib/api/repositories/plansRepository';
import { MainLayout } from '@/components/layout/MainLayout';
import { PlanDetailClient } from './PlanDetailClient';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.sim2me.net';

interface PageProps {
  params: Promise<{ locale: string; slug: string; planId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug, planId } = await params;
  const destination = await getDestinationBySlug(slug);
  const plan = await getPlanById(planId);
  if (!destination || !plan) return { title: 'Plan' };
  const prefix = `/${locale}`;
  return {
    title: `${plan.name} – eSIM ${destination.name}`,
    description: `Buy ${plan.name} eSIM for ${destination.name}. ${plan.networkType}, ${plan.dataDisplay} data, ${plan.days} days.`,
    alternates: {
      canonical: `${SITE_URL}${prefix}/destinations/${slug}/plan/${planId}`,
    },
  };
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { slug, planId } = await params;
  const destination = await getDestinationBySlug(slug);
  const plan = await getPlanById(planId);
  if (!destination || !plan) notFound();

  return (
    <MainLayout>
      <PlanDetailClient destination={destination} plan={plan} />
    </MainLayout>
  );
}
