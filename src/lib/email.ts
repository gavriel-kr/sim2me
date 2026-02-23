/**
 * Account emails: password reset, etc.
 * Uses Resend when RESEND_API_KEY is set.
 * (Email verification removed — sign up works without it.)
 */

const FROM = `Sim2Me <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
const SITE_NAME = 'Sim2Me';

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return 'https://www.sim2me.net';
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

export interface PostPurchaseEmailData {
  customerName: string;
  planName: string;
  dataGb: string;
  validityDays: string;
  qrCodeUrl: string | null;
  smdpAddress: string;
  activationCode: string;
  loginLink: string;
  email: string;
  tempPassword?: string | null;
}

/** Hebrew RTL post-purchase email. Subject and body as per SIM2ME spec. */
export async function sendPostPurchaseEmail(to: string, data: PostPurchaseEmailData): Promise<boolean> {
  const subject = 'ה-eSIM שלך מ-SIM2ME מוכן להפעלה! ✈️';
  const name = data.customerName || 'לקוח/ה';
  const planName = data.planName || 'חבילת נתונים';
  const dataGb = data.dataGb || '—';
  const validityDays = data.validityDays || '—';
  const smdp = data.smdpAddress || '—';
  const code = data.activationCode || '—';
  const loginLink = data.loginLink || baseUrl() + '/account';
  const email = data.email || to;

  const qrBlock = data.qrCodeUrl
    ? `<p style="margin:16px 0;"><strong>סריקת QR:</strong> מצורף להודעה זו קוד ה-QR שלך. סרוק אותו דרך הגדרות הסלולר במכשיר.</p>
       <p style="margin:12px 0;"><img src="${data.qrCodeUrl}" alt="QR Code" width="200" height="200" style="display:block; border-radius:8px;" /></p>`
    : '<p style="margin:16px 0;"><strong>סריקת QR:</strong> קוד ה-QR זמין בעמוד ההזמנה ובחשבון שלך.</p>';

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #1e293b;">
  <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <h1 style="color: #0d9f6e; font-size: 1.5rem; margin: 0 0 16px 0;">ה-eSIM שלך מ-SIM2ME מוכן להפעלה! ✈️</h1>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">שלום ${escapeHtml(name)},</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">איזה כיף שאתה טס עם SIM2ME! החבילה שלך הופעלה בהצלחה ומוכנה לשימוש.</p>
    <p style="margin: 0 0 8px 0; font-weight: 600;">פרטי החבילה שלך:</p>
    <ul style="margin: 0 0 20px 0; padding-right: 20px;">
      <li><strong>חבילה:</strong> ${escapeHtml(planName)}</li>
      <li><strong>נפח גלישה:</strong> ${escapeHtml(dataGb)}</li>
      <li><strong>תוקף:</strong> ${escapeHtml(validityDays)}</li>
    </ul>
    <p style="margin: 0 0 8px 0; font-weight: 600;">איך מתקינים את ה-eSIM?</p>
    ${qrBlock}
    <p style="margin: 16px 0 8px 0;"><strong>התקנה ידנית:</strong> אם אינך יכול לסרוק, השתמש בפרטים הבאים:</p>
    <ul style="margin: 0 0 20px 0; padding-right: 20px;">
      <li><strong>SM-DP+ Address:</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(smdp)}</code></li>
      <li><strong>Activation Code:</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(code)}</code></li>
    </ul>
    <p style="margin: 0 0 8px 0; font-weight: 600;">כניסה לחשבון וניהול חבילה:</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">תוכל לעקוב אחר צריכת הנתונים שלך ולהוסיף חבילות בקישור הבא: <a href="${escapeHtml(loginLink)}" style="color: #0d9f6e;">${escapeHtml(loginLink)}</a></p>
    <p style="margin: 0 0 4px 0;">שם משתמש: <strong>${escapeHtml(email)}</strong></p>
    ${data.tempPassword ? `<p style="margin: 4px 0 0 0;">סיסמה זמנית: <strong style="font-family:monospace; background:#f1f5f9; padding:2px 8px; border-radius:4px;">${escapeHtml(data.tempPassword)}</strong> (מומלץ לשנות לאחר הכניסה)</p>` : ''}
    <p style="margin: 24px 0 0 0; font-size: 0.9rem; color: #64748b;">חשוב לדעת: מומלץ להפעיל את ה-eSIM עוד בארץ תחת רשת Wi-Fi יציבה, ולהפעיל 'נדידת נתונים' (Data Roaming) רק ברגע הנחיתה בחו"ל.</p>
    <p style="margin: 20px 0 0 0;">נסיעה טובה!<br/>צוות SIM2ME</p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(to, subject, html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
