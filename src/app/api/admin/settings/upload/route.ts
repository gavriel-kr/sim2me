import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_LOGO = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'] as const;
const ALLOWED_FAVICON = ['image/x-icon', 'image/png', 'image/svg+xml'] as const;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Could not parse form data' }, { status: 400 });
  }

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

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${mime};base64,${base64}`;

    const dbKey = type === 'logo' ? 'logo_url' : 'favicon_url';

    await prisma.siteSetting.upsert({
      where: { key: dbKey },
      create: { key: dbKey, value: dataUrl },
      update: { value: dataUrl },
    });

    // Logo: return data URL directly (works as <img src>)
    // Favicon: return the serving API route URL (browser-compatible)
    const url = type === 'favicon' ? '/api/site-branding/favicon' : dataUrl;

    return NextResponse.json({ url });
  } catch (e) {
    console.error('Settings upload error:', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
