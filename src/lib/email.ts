/**
 * Account emails: password reset, etc.
 * Uses Resend when RESEND_API_KEY is set.
 * (Email verification removed — sign up works without it.)
 */

import { getSiteBranding } from '@/lib/site-branding';

const FROM = `Sim2Me <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
const SITE_NAME = 'Sim2Me';

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return 'https://www.sim2me.net';
}

async function logoImgTag(): Promise<string> {
  const { logoUrl, brandingVersion } = await getSiteBranding();
  const src = logoUrl?.startsWith('/') ? logoUrl : '/logo.png';
  const url = `${baseUrl()}${src}${brandingVersion != null && logoUrl ? `?v=${brandingVersion}` : ''}`;
  return `<p style="margin:0 0 20px 0;"><img src="${url}" alt="Sim2Me" width="160" height="48" style="display:block; max-height:48px; object-fit:contain;" /></p>`;
}

export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  const verifyUrl = `${baseUrl()}/api/account/verify-email?token=${encodeURIComponent(token)}`;
  const logo = await logoImgTag();
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      ${logo}
      <h2 style="color: #059669;">אמת את כתובת האימייל שלך / Verify your email</h2>
      <p style="direction:rtl; text-align:right;">שלום! כדי להשלים את הרישום שלך ל-Sim2Me, לחץ על הכפתור למטה לאימות האימייל שלך.</p>
      <p>Hi! To complete your Sim2Me registration, click the button below to verify your email.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email / אמת אימייל</a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Or copy this link: ${verifyUrl}</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">This link expires in 24 hours. If you did not register, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail(to, 'Verify your Sim2Me account / אמת את חשבונך', html);
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const resetUrl = `${baseUrl()}/account/reset-password?token=${encodeURIComponent(token)}`;
  const logo = await logoImgTag();
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      ${logo}
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

  const logo = await logoImgTag();
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
    ${logo}
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

export interface AdminOrderNotificationData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  dataAmount: string;
  validity: string;
  amountCharged: number;
  supplierCost: number;
  orderId: string;
  orderNo: string;
  adminOrdersUrl: string;
}

/** Sends an order notification to the admin email. Fire-and-forget — never blocks order flow. */
export async function sendAdminOrderNotificationEmail(data: AdminOrderNotificationData): Promise<void> {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
  const profit = (data.amountCharged - data.supplierCost).toFixed(2);
  const profitColor = data.amountCharged >= data.supplierCost ? '#059669' : '#dc2626';
  const html = `
<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 16px 0; color: #0f172a;">🧾 New Order — Sim2Me</h2>
  <table style="width:100%; border-collapse: collapse; font-size: 14px;">
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b; white-space:nowrap;">Customer</td><td style="padding: 6px 0;"><strong>${escapeHtml(data.customerName)}</strong> &lt;${escapeHtml(data.customerEmail)}&gt;</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Package</td><td style="padding: 6px 0;">${escapeHtml(data.packageName)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Destination</td><td style="padding: 6px 0;">${escapeHtml(data.destination)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Data / Validity</td><td style="padding: 6px 0;">${escapeHtml(data.dataAmount)} / ${escapeHtml(data.validity)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Charged</td><td style="padding: 6px 0;"><strong>$${data.amountCharged.toFixed(2)}</strong></td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Supplier Cost</td><td style="padding: 6px 0;">$${data.supplierCost.toFixed(2)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Profit</td><td style="padding: 6px 0; color: ${profitColor};"><strong>$${profit}</strong></td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Order ID</td><td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${escapeHtml(data.orderNo)}</td></tr>
  </table>
  <p style="margin: 20px 0 0 0;">
    <a href="${escapeHtml(data.adminOrdersUrl)}" style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">View in Admin</a>
  </p>
</div>`.trim();

  sendEmail(to, `New Order: ${data.packageName} — $${data.amountCharged.toFixed(2)}`, html).catch(() => {});
}

export interface FraudAlertEmailData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  amountPaid: number;
  supplierCost: number;
  deficit: number;
  paddleTransactionId: string;
  orderId: string;
  orderNo: string;
  adminOrdersUrl: string;
}

/** Sends an urgent fraud alert when payment is below supplier cost. Fire-and-forget. */
export async function sendFraudAlertEmail(data: FraudAlertEmailData): Promise<void> {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
  const html = `
<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 8px 0; color: #dc2626; font-size: 20px;">🚨 FRAUD ALERT — Underpayment Blocked</h2>
    <p style="margin: 0; color: #7f1d1d; font-size: 14px;">A transaction was blocked because the customer payment was below the supplier cost. No eSIM was purchased.</p>
  </div>
  <table style="width:100%; border-collapse: collapse; font-size: 14px;">
    <tr><td style="padding: 7px 12px 7px 0; color: #64748b; white-space:nowrap;">Customer</td><td style="padding: 7px 0;"><strong>${escapeHtml(data.customerName)}</strong> &lt;${escapeHtml(data.customerEmail)}&gt;</td></tr>
    <tr><td style="padding: 7px 12px 7px 0; color: #64748b;">Package</td><td style="padding: 7px 0;">${escapeHtml(data.packageName)}</td></tr>
    <tr><td style="padding: 7px 12px 7px 0; color: #64748b;">Destination</td><td style="padding: 7px 0;">${escapeHtml(data.destination)}</td></tr>
    <tr style="background:#fef2f2;"><td style="padding: 7px 12px 7px 0; color: #dc2626; font-weight:600;">Amount Paid</td><td style="padding: 7px 0; color: #dc2626; font-weight:700;">$${data.amountPaid.toFixed(2)}</td></tr>
    <tr style="background:#fef2f2;"><td style="padding: 7px 12px 7px 0; color: #dc2626; font-weight:600;">Supplier Cost</td><td style="padding: 7px 0; color: #dc2626; font-weight:700;">$${data.supplierCost.toFixed(2)}</td></tr>
    <tr style="background:#fef2f2;"><td style="padding: 7px 12px 7px 0; color: #dc2626; font-weight:600;">Deficit (Loss Prevented)</td><td style="padding: 7px 0; color: #dc2626; font-weight:700;">$${data.deficit.toFixed(2)}</td></tr>
    <tr><td style="padding: 7px 12px 7px 0; color: #64748b;">Paddle Transaction</td><td style="padding: 7px 0; font-family: monospace; font-size: 12px;">${escapeHtml(data.paddleTransactionId)}</td></tr>
    <tr><td style="padding: 7px 12px 7px 0; color: #64748b;">Order ID</td><td style="padding: 7px 0; font-family: monospace; font-size: 12px;">${escapeHtml(data.orderNo)}</td></tr>
  </table>
  <div style="margin: 20px 0 0 0; padding: 14px; background: #fff7ed; border: 1px solid #f97316; border-radius: 8px; font-size: 13px; color: #7c2d12;">
    ⚠️ The order is marked <strong>FAILED</strong>. No eSIM was purchased from the supplier. Consider issuing a refund via Paddle Dashboard.
  </div>
  <p style="margin: 16px 0 0 0;">
    <a href="${escapeHtml(data.adminOrdersUrl)}" style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">View Order in Admin</a>
  </p>
</div>`.trim();

  sendEmail(to, `🚨 FRAUD ALERT: Payment $${data.amountPaid.toFixed(2)} below supplier cost $${data.supplierCost.toFixed(2)} — ${data.packageName}`, html).catch(() => {});
}

// ─── Admin event email helpers ────────────────────────────────────────────────

interface AdminOrderEventData {
  orderNo: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  totalAmount: number;
  currency: string;
}

function adminUrl(): string {
  return `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sim2me.net').replace(/\/$/, '')}/admin/orders`;
}

function orderTable(d: AdminOrderEventData): string {
  return `
<table style="width:100%; border-collapse: collapse; font-size: 14px; margin-bottom:16px;">
  <tr><td style="padding: 6px 12px 6px 0; color: #64748b; white-space:nowrap;">Order</td><td style="padding: 6px 0; font-family:monospace; font-size:12px;">#${escapeHtml(d.orderNo)}</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Customer</td><td style="padding: 6px 0;"><strong>${escapeHtml(d.customerName)}</strong> &lt;${escapeHtml(d.customerEmail)}&gt;</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Package</td><td style="padding: 6px 0;">${escapeHtml(d.packageName)}</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Destination</td><td style="padding: 6px 0;">${escapeHtml(d.destination)}</td></tr>
  <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Amount</td><td style="padding: 6px 0;">${escapeHtml(d.currency)} ${d.totalAmount.toFixed(2)}</td></tr>
</table>
<p style="margin:0;"><a href="${escapeHtml(adminUrl())}" style="display:inline-block; background:#0f172a; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-size:14px;">View Orders</a></p>`;
}

/** Admin alert: order reached FAILED status (eSIM or fraud). Fire-and-forget. */
export function sendOrderFailedEmail(data: AdminOrderEventData & { errorMessage: string }): void {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
  const html = `
<div style="font-family:sans-serif; max-width:560px; margin:0 auto; padding:24px;">
  <div style="background:#fef2f2; border:2px solid #dc2626; border-radius:10px; padding:16px 20px; margin-bottom:16px;">
    <h2 style="margin:0 0 6px 0; color:#dc2626; font-size:18px;">⚠️ Order FAILED — Sim2Me</h2>
    <p style="margin:0; color:#7f1d1d; font-size:13px;">${escapeHtml(data.errorMessage)}</p>
  </div>
  ${orderTable(data)}
</div>`.trim();
  sendEmail(to, `⚠️ Order FAILED: #${data.orderNo} — ${data.customerName}`, html).catch(() => {});
}

/** Admin alert: admin retry succeeded. Fire-and-forget. */
export function sendRetrySucceededEmail(data: AdminOrderEventData & { iccid?: string | null }): void {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
  const iccidRow = data.iccid
    ? `<tr><td style="padding: 6px 12px 6px 0; color: #64748b;">ICCID</td><td style="padding: 6px 0; font-family:monospace; font-size:12px;">${escapeHtml(data.iccid)}</td></tr>`
    : '';
  const html = `
<div style="font-family:sans-serif; max-width:560px; margin:0 auto; padding:24px;">
  <div style="background:#f0fdf4; border:2px solid #16a34a; border-radius:10px; padding:16px 20px; margin-bottom:16px;">
    <h2 style="margin:0; color:#16a34a; font-size:18px;">✅ Retry Succeeded — eSIM Provisioned</h2>
  </div>
  <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:16px;">
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Order</td><td style="padding: 6px 0; font-family:monospace; font-size:12px;">#${escapeHtml(data.orderNo)}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Customer</td><td style="padding: 6px 0;"><strong>${escapeHtml(data.customerName)}</strong> &lt;${escapeHtml(data.customerEmail)}&gt;</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Package</td><td style="padding: 6px 0;">${escapeHtml(data.packageName)}</td></tr>
    ${iccidRow}
  </table>
  <p style="margin:0;"><a href="${escapeHtml(adminUrl())}" style="display:inline-block; background:#16a34a; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-size:14px;">View Orders</a></p>
</div>`.trim();
  sendEmail(to, `✅ Retry Succeeded: #${data.orderNo} — ${data.customerName}`, html).catch(() => {});
}

/** Admin alert: admin retry failed again. Fire-and-forget. */
export function sendRetryFailedEmail(data: AdminOrderEventData & { errorMessage: string }): void {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
  const html = `
<div style="font-family:sans-serif; max-width:560px; margin:0 auto; padding:24px;">
  <div style="background:#fef2f2; border:2px solid #dc2626; border-radius:10px; padding:16px 20px; margin-bottom:16px;">
    <h2 style="margin:0 0 6px 0; color:#dc2626; font-size:18px;">❌ Retry Failed — Sim2Me</h2>
    <p style="margin:0; color:#7f1d1d; font-size:13px;">${escapeHtml(data.errorMessage)}</p>
  </div>
  ${orderTable(data)}
</div>`.trim();
  sendEmail(to, `❌ Retry Failed: #${data.orderNo} — ${data.customerName}`, html).catch(() => {});
}

/** Admin alert: eSIM was cancelled via admin. Fire-and-forget. */
export function sendEsimCancelledEmail(data: AdminOrderEventData): void {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
  const html = `
<div style="font-family:sans-serif; max-width:560px; margin:0 auto; padding:24px;">
  <div style="background:#fff7ed; border:2px solid #f97316; border-radius:10px; padding:16px 20px; margin-bottom:16px;">
    <h2 style="margin:0; color:#ea580c; font-size:18px;">🚫 eSIM Cancelled by Admin</h2>
  </div>
  ${orderTable(data)}
</div>`.trim();
  sendEmail(to, `🚫 eSIM Cancelled: #${data.orderNo} — ${data.customerName}`, html).catch(() => {});
}

/** Admin alert: refund issued via Paddle. Fire-and-forget. */
export function sendRefundIssuedEmail(data: AdminOrderEventData): void {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
  const html = `
<div style="font-family:sans-serif; max-width:560px; margin:0 auto; padding:24px;">
  <div style="background:#eff6ff; border:2px solid #3b82f6; border-radius:10px; padding:16px 20px; margin-bottom:16px;">
    <h2 style="margin:0; color:#1d4ed8; font-size:18px;">💸 Refund Issued via Paddle</h2>
  </div>
  ${orderTable(data)}
</div>`.trim();
  sendEmail(to, `💸 Refund Issued: #${data.orderNo} — ${data.currency} ${data.totalAmount.toFixed(2)}`, html).catch(() => {});
}

export interface AbandonedCheckoutItem {
  paddleTransactionId: string;
  customerEmail?: string;
  amount?: number;
  currency?: string;
  minutesAgo: number;
}

/** Admin digest: new abandoned checkouts detected by cron. Fire-and-forget. */
export function sendAbandonedCheckoutEmail(items: AbandonedCheckoutItem[]): void {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
  const rows = items.map((it) => `
  <tr>
    <td style="padding:6px 8px; font-family:monospace; font-size:12px;">${escapeHtml(it.paddleTransactionId)}</td>
    <td style="padding:6px 8px;">${escapeHtml(it.customerEmail ?? '—')}</td>
    <td style="padding:6px 8px;">${it.currency ?? ''} ${it.amount != null ? it.amount.toFixed(2) : '—'}</td>
    <td style="padding:6px 8px;">${it.minutesAgo}m ago</td>
  </tr>`).join('');
  const html = `
<div style="font-family:sans-serif; max-width:640px; margin:0 auto; padding:24px;">
  <h2 style="margin:0 0 16px 0; color:#0f172a;">👻 ${items.length} Abandoned Checkout${items.length === 1 ? '' : 's'} — Sim2Me</h2>
  <table style="width:100%; border-collapse:collapse; font-size:14px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
    <thead style="background:#f8fafc;">
      <tr>
        <th style="padding:8px; text-align:left; color:#64748b; font-weight:600;">Transaction ID</th>
        <th style="padding:8px; text-align:left; color:#64748b; font-weight:600;">Email</th>
        <th style="padding:8px; text-align:left; color:#64748b; font-weight:600;">Amount</th>
        <th style="padding:8px; text-align:left; color:#64748b; font-weight:600;">When</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin: 20px 0 0 0;"><a href="${escapeHtml(adminUrl())}" style="display:inline-block; background:#0f172a; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-size:14px;">View Orders</a></p>
</div>`.trim();
  sendEmail(to, `👻 ${items.length} Abandoned Checkout${items.length === 1 ? '' : 's'} Detected`, html).catch(() => {});
}

// ──────────────────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Sends a 6-digit OTP login code to the customer. */
export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const logo = await logoImgTag();
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      ${logo}
      <h2 style="color: #0f172a; margin: 0 0 8px 0;">קוד הכניסה שלך / Your Login Code</h2>
      <p style="color: #475569; margin: 0 0 24px 0;">Use this code to complete your Sim2Me login. It expires in <strong>10 minutes</strong>.</p>
      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #0f172a; font-family: monospace;">${escapeHtml(code)}</span>
      </div>
      <p style="direction:rtl; text-align:right; color: #475569;">זהו קוד חד-פעמי לכניסה לאתר Sim2Me. הקוד פג תוקף תוך 10 דקות.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">If you did not try to log in, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail(to, `${code} — Your Sim2Me login code / קוד הכניסה שלך`, html);
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
