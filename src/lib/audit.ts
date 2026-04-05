/**
 * Admin audit log helper.
 * All writes are fire-and-forget — never blocks or throws.
 */

import { prisma } from '@/lib/prisma';

export interface AuditLogParams {
  adminEmail: string;
  adminName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: object;
  ip?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminEmail: params.adminEmail,
        adminName: params.adminName,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        details: params.details ? JSON.stringify(params.details) : null,
        ip: params.ip ?? null,
      },
    });
  } catch {
    // Never block admin actions due to audit log failure
  }
}
