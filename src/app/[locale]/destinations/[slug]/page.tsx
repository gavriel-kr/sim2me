import { notFound } from 'next/navigation';
import { getDestinationBySlug } from '@/lib/api/repositories/destinationsRepository';
import { getPlansByDestination } from '@/lib/api/repositories/plansRepository';
import { MainLayout } from '@/components/layout/MainLayout';
import { DestinationDetailClient } from './DestinationDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return { title: 'Destination' };
  return {
    title: `eSIM ${destination.name} – Data plans`,
    description: `Buy eSIM for ${destination.name}. Instant delivery, best prices. ${destination.planCount} plans available.`,
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();
  const plans = await getPlansByDestination(destination.id);

  return (
    <MainLayout>
      <DestinationDetailClient destination={destination} initialPlans={plans} />
    </MainLayout>
  );
}
