import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f6f39'},body:JSON.stringify({sessionId:'3f6f39',location:'totp/generate/route.ts:11',message:'generate route called',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const session = await getServerSession(authOptions);
  const denied = requireAdmin(session);
  if (denied) return denied;

  const adminEmail = session!.user!.email!;

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f6f39'},body:JSON.stringify({sessionId:'3f6f39',location:'totp/generate/route.ts:22',message:'importing otplib',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const { authenticator } = await import('otplib');
    const secret = authenticator.generateSecret();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f6f39'},body:JSON.stringify({sessionId:'3f6f39',location:'totp/generate/route.ts:28',message:'secret generated, importing qrcode',data:{secretLen: secret.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    await prisma.adminUser.update({
      where: { email: adminEmail },
      data: { totpSecret: secret, totpEnabled: false },
    });

    const otpauthUrl = authenticator.keyuri(adminEmail, 'Sim2Me Admin', secret);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f6f39'},body:JSON.stringify({sessionId:'3f6f39',location:'totp/generate/route.ts:38',message:'generating QR code',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const QRCode = await import('qrcode');
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f6f39'},body:JSON.stringify({sessionId:'3f6f39',location:'totp/generate/route.ts:44',message:'QR code generated successfully',data:{qrLen: qrDataUrl.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ secret, qrDataUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack?.slice(0, 300) : '';
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c0f3d6c5-f7a1-48de-976d-653a33f6597b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f6f39'},body:JSON.stringify({sessionId:'3f6f39',location:'totp/generate/route.ts:ERROR',message:'CAUGHT ERROR',data:{msg, stack},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('[TOTP Generate] Error:', err);
    return NextResponse.json({ error: 'Failed to generate 2FA setup', detail: msg }, { status: 500 });
  }
}
