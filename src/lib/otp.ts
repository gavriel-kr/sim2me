/**
 * Email OTP utilities for customer 2FA.
 * Codes are 6-digit numeric, hashed with SHA-256 before DB storage.
 * Single-use, 10-minute expiry, max 5 attempts.
 */

import { createHash, randomInt } from 'crypto';

/** Generate a cryptographically random 6-digit OTP code string. */
export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000)).padStart(6, '0');
}

/** SHA-256 hex digest of a code — stored in DB, never the plain code. */
export function hashOtpCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

/** Returns the expiry date 10 minutes from now. */
export function otpExpiresAt(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/** Check whether a submitted code matches the stored hash and is not expired. */
export function isOtpValid(
  submittedCode: string,
  storedHash: string,
  expiresAt: Date,
): boolean {
  if (new Date() > expiresAt) return false;
  const hash = hashOtpCode(submittedCode);
  return hash === storedHash;
}
