/**
 * Account emails: verification, password reset, etc.
 * Uses Resend when RESEND_API_KEY is set.
 */

const FROM = `Sim2Me <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
const SITE_NAME = 'Sim2Me';

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return 'https://www.sim2me.net';
}

export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  const verifyUrl = `${baseUrl()}/account/verify-email?token=${encodeURIComponent(token)}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #059669;">Verify your email</h2>
      <p>Thanks for signing up for ${SITE_NAME}. Please verify your email by clicking the link below:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify email</a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Or copy this link: ${verifyUrl}</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">If you didn't create an account, you can ignore this email.</p>
    </div>
  `;
  return sendEmail(to, 'Verify your email – Sim2Me', html);
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const resetUrl = `${baseUrl()}/account/reset-password?token=${encodeURIComponent(token)}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #059669;">Reset your password</h2>
      <p>We received a request to reset your password for your ${SITE_NAME} account. Click the link below to set a new password:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset password</a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Or copy this link: ${resetUrl}</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">This link expires in 1 hour. If you didn't request a reset, you can ignore this email.</p>
    </div>
  `;
  return sendEmail(to, 'Reset your password – Sim2Me', html);
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] No RESEND_API_KEY — would send:', { to, subject });
    return true;
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to: [to], subject, html });
    return true;
  } catch (e) {
    console.error('[Email] Send failed:', e);
    return false;
  }
}
