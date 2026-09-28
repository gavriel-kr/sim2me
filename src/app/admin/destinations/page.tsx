import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DestinationsClient } from './DestinationsClient';
import { HomepageSectionsToggle } from './HomepageSectionsToggle';
import { getHomepageSections, type BadgeLocale } from '@/lib/homepage-sections';
import he from '@/messages/he.json';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';
import hi from '@/messages/hi.json';

/** The site's own "Instant activation worldwide" text per language, for the admin's placeholders. */
const BADGE_DEFAULTS: Record<BadgeLocale, string> = {
  he: he.home.instantActivation,
  en: en.home.instantActivation,
  ar: ar.home.instantActivation,
  hi: hi.home.instantActivation,
};

export const dynamic = 'force-dynamic';

export default async function AdminDestinationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const [featured, sections] = await Promise.all([
    prisma.featuredDestination.findMany({ orderBy: { displayOrder: 'asc' } }),
    getHomepageSections(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Homepage Destinations</h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose which destinations appear in the &quot;Popular destinations&quot; section on the homepage.
        Drag to reorder. If the list is empty, European countries are shown by default.
      </p>
      <HomepageSectionsToggle initial={sections} badgeDefaults={BADGE_DEFAULTS} />
      <DestinationsClient initialFeatured={featured.map((f: typeof featured[number]) => f.locationCode)} />
    </div>
  );
}
