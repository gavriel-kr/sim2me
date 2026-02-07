import { getMockPlansByDestination, getMockPlanById } from '@/data/plans';
import type { Plan } from '@/types';

/**
 * Data access for plans. Replace with real API later.
 */
export async function getPlansByDestination(destinationId: string): Promise<Plan[]> {
  await new Promise((r) => setTimeout(r, 60));
  return getMockPlansByDestination(destinationId);
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  await new Promise((r) => setTimeout(r, 40));
  return getMockPlanById(planId) ?? null;
}
