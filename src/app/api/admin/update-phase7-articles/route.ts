import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runPhase7Update } from '@/lib/update-phase7-articles';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST: Run Phase 7 article update (75 articles from HTML files).
 * Uses the app's database (production DB when called on sim2me.net).
 * Admin session required.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const root = process.cwd();
  const hePath = path.join(root, 'prisma', 'content-phase7-update-he.html');
  const enArPath = path.join(root, 'prisma', 'content-phase7-update-en-ar.html');

  if (!fs.existsSync(enArPath)) {
    return NextResponse.json(
      { error: 'Missing prisma/content-phase7-update-en-ar.html' },
      { status: 500 }
    );
  }

  let heHtml: string | null = null;
  if (fs.existsSync(hePath)) {
    heHtml = fs.readFileSync(hePath, 'utf-8');
  }

  const enArHtml = fs.readFileSync(enArPath, 'utf-8');
  const result = await runPhase7Update(prisma, { heHtml, enArHtml });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, updated: result.updated });
}
