import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET all overrides */
export async function GET() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2055d3'},body:JSON.stringify({sessionId:'2055d3',location:'override/route.ts:GET',message:'GET override called',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    const session = await getServerSession(authOptions);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2055d3'},body:JSON.stringify({sessionId:'2055d3',location:'override/route.ts:GET',message:'session result',data:{hasSession:!!session,user:session?.user?.email},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const overrides = await prisma.packageOverride.findMany();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2055d3'},body:JSON.stringify({sessionId:'2055d3',location:'override/route.ts:GET',message:'findMany success',data:{count:overrides.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ overrides });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2055d3'},body:JSON.stringify({sessionId:'2055d3',location:'override/route.ts:GET',message:'ERROR caught',data:{error:msg},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST - create or update an override */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { packageCode, visible, customTitle, customPrice, simCost, paddlePriceId, saleBadge, featured, sortOrder, notes } = body;

  if (!packageCode) {
    return NextResponse.json({ error: 'packageCode is required' }, { status: 400 });
  }

  const override = await prisma.packageOverride.upsert({
    where: { packageCode },
    create: {
      packageCode,
      visible: visible ?? true,
      customTitle: customTitle || null,
      customPrice: customPrice != null ? customPrice : null,
      simCost: simCost != null ? simCost : null,
      paddlePriceId: typeof paddlePriceId === 'string' && paddlePriceId.trim() ? paddlePriceId.trim() : null,
      saleBadge: saleBadge || null,
      featured: featured ?? false,
      sortOrder: sortOrder ?? 0,
      notes: notes || null,
    },
    update: {
      visible: visible ?? true,
      customTitle: customTitle || null,
      customPrice: customPrice != null ? customPrice : null,
      ...(simCost !== undefined && { simCost: simCost != null ? simCost : null }),
      ...(paddlePriceId !== undefined && { paddlePriceId: typeof paddlePriceId === 'string' && paddlePriceId.trim() ? paddlePriceId.trim() : null }),
      saleBadge: saleBadge || null,
      featured: featured ?? false,
      sortOrder: sortOrder ?? 0,
      notes: notes || null,
    },
  });

  return NextResponse.json({ override });
}

/** PATCH - bulk update visibility */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { updates } = body as { updates: { packageCode: string; visible: boolean }[] };

  if (!updates?.length) {
    return NextResponse.json({ error: 'updates array required' }, { status: 400 });
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.packageOverride.upsert({
        where: { packageCode: u.packageCode },
        create: { packageCode: u.packageCode, visible: u.visible },
        update: { visible: u.visible },
      })
    )
  );

  return NextResponse.json({ success: true });
}
