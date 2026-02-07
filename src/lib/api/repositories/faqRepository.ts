import { mockFaqs } from '@/data/faq';
import type { FAQ } from '@/types';

export async function getFaqs(): Promise<FAQ[]> {
  await new Promise((r) => setTimeout(r, 30));
  return [...mockFaqs];
}
