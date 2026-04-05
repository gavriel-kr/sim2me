/**
 * Server-side Cloudflare Turnstile token verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Turnstile response token from the client.
 * Returns true if valid, false otherwise (fail-closed for security).
 * If TURNSTILE_SECRET_KEY is not set, returns true (dev bypass).
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Dev bypass: if no secret key configured, skip verification
  if (!secret) {
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not set — skipping verification');
    return true;
  }

  // Empty token is always invalid
  if (!token || token.trim() === '') return false;

  try {
    const body: Record<string, string> = {
      secret,
      response: token,
    };
    if (ip) body.remoteip = ip;

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return data.success === true;
  } catch {
    // Network error — fail closed
    return false;
  }
}
