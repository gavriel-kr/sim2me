import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { DestinationDetailClient } from './DestinationDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getDestinationData(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const locationCode = slug.toUpperCase();

  try {
    const res = await fetch(`${baseUrl}/api/packages?location=${locationCode}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();

    const packages = data.packages || [];
    if (packages.length === 0) return null;

    // Build destination info from first package
    const firstPkg = packages[0];
    const flagCode = firstPkg.flagCode || slug;
    const destination = {
      id: slug,
      name: firstPkg.location || slug.toUpperCase(),
      slug,
      region: '',
      isoCode: firstPkg.locationCode || slug.toUpperCase(),
      flagUrl: `https://flagcdn.com/w80/${flagCode}.png`,
      isRegional: firstPkg.isRegional || false,
      popular: packages.some((p: { featured: boolean }) => p.featured),
      operatorCount: 1,
      planCount: packages.length,
      fromPrice: Math.min(...packages.map((p: { price: number }) => p.price)),
      fromCurrency: 'USD',
    };

    // Convert packages to Plan type
    const plans = packages.map((pkg: {
      packageCode: string;
      name: string;
      price: number;
      currency: string;
      volume: number;
      duration: number;
      speed: string;
      topUp: boolean;
      featured: boolean;
      saleBadge: string | null;
      locationCode: string;
    }) => {
      let networkType: '4G' | '5G' | '3G' = '4G';
      if (pkg.speed?.includes('5G')) networkType = '5G';
      else if (pkg.speed?.includes('3G')) networkType = '3G';

      const volumeBytes = pkg.volume;
      let dataDisplay: string;
      let dataAmountMb: number;
      if (volumeBytes < 0) {
        dataDisplay = 'Unlimited';
        dataAmountMb = -1;
      } else {
        const gb = volumeBytes / (1024 * 1024 * 1024);
        const mb = volumeBytes / (1024 * 1024);
        dataAmountMb = mb;
        dataDisplay = gb >= 1
          ? `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`
          : `${mb.toFixed(0)} MB`;
      }

      return {
        id: pkg.packageCode,
        destinationId: slug,
        name: pkg.name,
        dataAmount: dataAmountMb,
        dataDisplay,
        days: pkg.duration,
        price: pkg.price,
        currency: pkg.currency || 'USD',
        networkType,
        speed: pkg.speed,
        tethering: true,
        topUps: pkg.topUp,
        operatorName: pkg.speed || 'eSIMaccess',
        popular: pkg.featured,
        saleBadge: pkg.saleBadge,
      };
    });

    return { destination, plans };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = await getDestinationData(slug);
  if (!data) return { title: 'Destination' };
  const { destination } = data;
  const minPrice = destination.fromPrice > 0 ? ` from $${destination.fromPrice.toFixed(2)}` : '';
  return {
    title: `Buy eSIM for ${destination.name} – ${destination.planCount} Plans${minPrice}`,
    description: `Buy prepaid eSIM for ${destination.name}. ${destination.planCount} data plans available${minPrice}. Instant delivery, no physical SIM needed. Compare plans and connect in minutes.`,
    alternates: { canonical: `https://www.sim2me.net/destinations/${slug}` },
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getDestinationData(slug);
  if (!data) notFound();

  return (
    <MainLayout>
      <DestinationDetailClient destination={data.destination} initialPlans={data.plans} />
    </MainLayout>
  );
}
