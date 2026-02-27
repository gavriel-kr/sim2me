import { NextResponse } from 'next/server';
import { getSiteBranding } from '@/lib/site-branding';

export const dynamic = 'force-dynamic';

/** Public API: returns logo and favicon URLs for header and client use. */
export async function GET() {
  const branding = await getSiteBranding();
  return NextResponse.json(branding);
}
