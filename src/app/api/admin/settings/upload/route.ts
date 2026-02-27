import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_LOGO = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'] as const;
const ALLOWED_FAVICON = ['image/x-icon', 'image/png', 'image/svg+xml'] as const;
const EXT_BY_MIME: Record<string, string> = {
  'image/svg+xml': '.svg',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/x-icon': '.ico',
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const type = formData.get('type') as string | null;
  const file = formData.get('file') as File | null;

  if (!type || !file || !(type === 'logo' || type === 'favicon')) {
    return NextResponse.json({ error: 'Missing type (logo|favicon) or file' }, { status: 400 });
  }

  const mime = file.type?.toLowerCase() || '';
  const allowed = type === 'logo' ? ALLOWED_LOGO : ALLOWED_FAVICON;
  if (!allowed.includes(mime as never)) {
    return NextResponse.json(
      { error: type === 'logo' ? 'Logo: use SVG, PNG, JPG or WebP' : 'Favicon: use ICO, PNG or SVG' },
      { status: 400 }
    );
  }

  const ext = EXT_BY_MIME[mime] || (type === 'favicon' ? '.ico' : '.png');
  const basename = type === 'logo' ? 'logo' : 'favicon';
  const filename = basename + ext;

  try {
    const publicDir = path.join(process.cwd(), 'public');
    const siteDir = path.join(publicDir, 'site');
    await mkdir(siteDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const outPath = path.join(siteDir, filename);
    await writeFile(outPath, Buffer.from(bytes));

    const url = '/site/' + filename;

    await prisma.siteSetting.upsert({
      where: { key: type === 'logo' ? 'logo_url' : 'favicon_url' },
      create: { key: type === 'logo' ? 'logo_url' : 'favicon_url', value: url },
      update: { value: url },
    });

    return NextResponse.json({ url });
  } catch (e) {
    console.error('Settings upload error:', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
