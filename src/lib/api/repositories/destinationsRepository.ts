import { mockDestinations } from '@/data/destinations';
import type { Destination } from '@/types';

/**
 * Data access for destinations. Replace implementation with real API later.
 */
export async function getDestinations(): Promise<Destination[]> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 50));
  return [...mockDestinations];
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  await new Promise((r) => setTimeout(r, 30));
  return mockDestinations.find((d) => d.slug === slug) ?? null;
}

export async function searchDestinations(query: string): Promise<Destination[]> {
  await new Promise((r) => setTimeout(r, 80));
  const q = query.toLowerCase().trim();
  if (!q) return mockDestinations;
  return mockDestinations.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.slug.toLowerCase().includes(q) ||
      d.isoCode.toLowerCase().includes(q)
  );
}
