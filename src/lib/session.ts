/**
 * Session resolution for API routes: supports both NextAuth cookie session
 * and Authorization Bearer JWT (for mobile/app clients).
 * Use this in account API routes so web and mobile share the same auth.
 */

import { getServerSession } from 'next-auth';
import { decode } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';
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
          const user = token as { id?: string; email?: string; name?: string; type?: SessionUserType; role?: string };
          if (user.type === 'customer' || user.type === 'admin') {
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
  return session;
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
