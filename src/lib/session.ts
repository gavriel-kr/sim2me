/**
 * Session resolution for API routes: supports both NextAuth cookie session
 * and Authorization Bearer JWT (for mobile/app clients).
 * Use this in account API routes so web and mobile share the same auth.
 */

import { getServerSession } from 'next-auth';
import { decode, getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';
import type { SessionUserType } from '@/lib/auth';

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  type: SessionUserType;
  role?: string;
};

/** Session-like object returned from getSessionForRequest */
export type RequestSession = Session | { user: SessionUser; expires: string };

/**
 * Returns the current session from either:
 * 1. Authorization: Bearer <jwt> (mobile/app)
 * 2. NextAuth cookie session (web)
 * Use in API route handlers: const session = await getSessionForRequest(request);
 */
export async function getSessionForRequest(request?: Request): Promise<RequestSession | null> {
  // 1. Try Bearer token (mobile)
  if (request) {
    const authz = request.headers.get('authorization');
    const bearer = authz?.startsWith('Bearer ') ? authz.slice(7).trim() : null;
    if (bearer) {
      try {
        const token = await decode({
          token: bearer,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        if (token) {
          const user = token as { id?: string; email?: string; name?: string; type?: SessionUserType; role?: string; iat?: number };
          if (user.type === 'customer' || user.type === 'admin') {
            if (user.type === 'customer' && user.id && user.iat) {
              const stale = await isSessionStale(user.id, user.iat);
              if (stale) return null;
            }
            return {
              user: {
                id: user.id ?? '',
                email: (user.email as string) ?? '',
                name: user.name ?? null,
                type: (user.type as SessionUserType) ?? 'customer',
                role: user.role,
              },
              expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            };
          }
        }
      } catch {
        // invalid or expired token
      }
    }
  }

  // 2. NextAuth cookie session (web)
  const session = await getServerSession(authOptions);
  if (session && (session.user as SessionUser).type === 'customer' && request) {
    const userId = (session.user as SessionUser).id;
    if (userId) {
      try {
        // getToken reads the NextAuth JWT from cookies; requires NextRequest in App Router
        const rawToken = await getToken({
          req: request as NextRequest,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        if (rawToken?.iat) {
          const stale = await isSessionStale(userId, rawToken.iat as number);
          if (stale) return null;
        }
      } catch {
        // Fail-open: if token read fails, allow session to continue
      }
    }
  }
  return session;
}

/** Returns true if passwordChangedAt in DB is newer than the token's iat (issued-at timestamp). */
async function isSessionStale(customerId: string, tokenIat: number): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { passwordChangedAt: true },
    });
    if (!customer?.passwordChangedAt) return false;
    return customer.passwordChangedAt.getTime() / 1000 > tokenIat;
  } catch {
    return false;
  }
}

/** Type guard: session is customer (for account routes) */
export function isCustomerSession(session: RequestSession | null): session is RequestSession & { user: SessionUser } {
  return session != null && (session.user as SessionUser).type === 'customer';
}

/** Get customer id from session or null */
export function getCustomerId(session: RequestSession | null): string | null {
  if (!isCustomerSession(session)) return null;
  return (session.user as SessionUser).id ?? null;
}

/**
 * Admin authorization guard for API routes.
 * Returns a NextResponse (401 or 403) if the request is not from an admin,
 * or null if the session is valid and the user is an admin.
 *
 * Usage:
 *   const session = await getServerSession(authOptions);
 *   const denied = requireAdmin(session);
 *   if (denied) return denied;
 */
export function requireAdmin(session: Session | null): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if ((session.user as { type?: string }).type !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
