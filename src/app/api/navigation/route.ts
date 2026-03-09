import { NextResponse } from 'next/server';
import { getNavigationConfig } from '@/lib/navigation';

export const dynamic = 'force-dynamic';

/** Public API: returns main menu and footer links (from DB or defaults). */
export async function GET() {
  const config = await getNavigationConfig();
  return NextResponse.json(config);
}
