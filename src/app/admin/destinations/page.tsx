import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DestinationsClient } from './DestinationsClient';

export const dynamic = 'force-dynamic';

export default async function AdminDestinationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const featured = await prisma.featuredDestination.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Homepage Destinations</h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose which destinations appear in the &quot;Popular destinations&quot; section on the homepage.
        Drag to reorder. If the list is empty, European countries are shown by default.
      </p>
      <DestinationsClient initialFeatured={featured.map((f) => f.locationCode)} />
    </div>
  );
}
