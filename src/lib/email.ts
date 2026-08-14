/**
 * Every email the site sends, and the one function that sends them.
 *
 * Templates are inline HTML strings rather than a template engine: mail clients need table-ish,
 * inline-styled markup anyway, and a build step for six emails would cost more than it saves.
 *
 * Ticket 033 added, on top of the original account emails:
 *  - the receipt block on the purchase email, so a buyer has an order number and an amount
 *  - `sendOrderDelayedEmail`, so nobody who paid is ever left with silence
 *  - the QR as a real attachment, because Gmail and Outlook block remote images by default
 *  - Simi and Sima, from `public/characters/email` — PNG, because Outlook renders neither AVIF nor WebP
 *  - a plain-text alternative and a reply-to on customer mail, both deliverability
 */

import { getSiteBranding } from '@/lib/site-branding';
import { brandConfig } from '@/config/brand';

const FROM = `Sim2Me <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
const SITE_NAME = 'Sim2Me';
const SUPPORT_EMAIL = brandConfig.supportEmail;

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return 'https://www.sim2me.net';
}

function adminRecipient(): string {
  return process.env.ADMIN_NOTIFICATION_EMAIL || 'info.sim2me@gmail.com';
}

async function logoImgTag(): Promise<string> {
  const { logoUrl, brandingVersion } = await getSiteBranding();
  const src = logoUrl?.startsWith('/') ? logoUrl : '/logo.png';
  const url = `${baseUrl()}${src}${brandingVersion != null && logoUrl ? `?v=${brandingVersion}` : ''}`;
  return `<p style="margin:0 0 20px 0;"><img src="${url}" alt="Sim2Me" width="160" height="48" style="display:block; max-height:48px; object-fit:contain;" /></p>`;
}

/*
  Simi and Sima in the inbox.

  Separate files from `public/characters`, and separate from the `character-art.ts` slot map, for two
  reasons that only apply to email. Outlook for Windows renders through Word and supports neither
  AVIF nor WebP, so the site's assets would show as broken images; and Outlook ignores CSS
  `transform`, so the mirroring that turns a figure inward for RTL cannot work. Only pair poses and
  camera-facing figures are used here — nothing that points — so one file is correct in all three
  languages. Sizes are baked in because a mail client will not infer them.

  Decorative, like everywhere else on the site: `alt=""`, so a blocked image leaves a clean gap
  rather than a line of placeholder text.
*/
const EMAIL_CHARACTERS = {
  /** Delighted at a working phone — the eSIM is ready. */
  checkingPhone: { file: 'pair-checking-phone-v1', w: 187, h: 150 },
  /** Simi mid-explanation over a phone — beside the install steps. */
  explaining: { file: 'pair-explaining-v1', w: 159, h: 150 },
  /** Open palm, hand on chest — reassurance when something is late. */
  reassuring: { file: 'pair-reassuring-v1', w: 198, h: 150 },
  /** Simi waving hello — account mail. */
  waving: { file: 'simi-waving-v1', w: 127, h: 150 },
} as const;

type CharacterKey = keyof typeof EMAIL_CHARACTERS;

function characterImg(key: CharacterKey): string {
  const c = EMAIL_CHARACTERS[key];
  return `<img src="${baseUrl()}/characters/email/${c.file}.png" width="${c.w}" height="${c.h}" alt="" style="display:block; border:0; outline:none; text-decoration:none; max-width:100%; height:auto;" />`;
}

/** Supported email locales. Falls back to 'he' for legacy flows without a locale. */
export type EmailLocale = 'he' | 'en' | 'ar' | 'hi';

export function toEmailLocale(value: unknown): EmailLocale {
  return value === 'en' || value === 'ar' || value === 'he' || value === 'hi' ? value : 'he';
}

/**
 * Text direction for the message body.
 *
 * Named by the RTL locales rather than by "anything that is not English", which is how it read until
 * Hindi arrived — a Devanagari email would have been laid out right to left.
 */
function emailDir(locale: EmailLocale): 'ltr' | 'rtl' {
  return locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A date a human reads the same way in every client.
 *
 * Written out rather than handed to `Intl`, which resolves Arabic to Eastern Arabic numerals on
 * some runtimes and Western on others. An order number that renders differently depending on where
 * the mail was generated is not a reference anybody can quote back to support.
 */
function formatDate(d: Date, locale: EmailLocale): string {
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.getUTCMonth();
  const year = d.getUTCFullYear();
  if (locale === 'en') return `${EN_MONTHS[month]} ${day}, ${year}`;
  return `${day}/${String(month + 1).padStart(2, '0')}/${year}`;
}

function formatMoney(amount: number, currency: string): string {
  const c = (currency || 'USD').toUpperCase();
  const n = amount.toFixed(2);
  return c === 'USD' ? `$${n}` : `${c} ${n}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * A plain-text alternative derived from the HTML we already built.
 *
 * Generated rather than authored so the copy stays in one place — a second hand-written body is a
 * second thing to forget to update. It exists because an HTML-only message with no text part is a
 * spam signal, and because some clients still render the text part by preference.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    // Links sitting side by side in one paragraph — the iPhone and Android install buttons — would
    // otherwise run together into a single unreadable string once the tags come off.
    .replace(/<\/a>\s*<a\b/gi, '</a>\n<a')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const text = String(label).replace(/<[^>]+>/g, '').trim();
      const url = String(href);
      // A mailto whose label is the address itself would otherwise read "x@y: mailto:x@y".
      if (url.startsWith('mailto:') && url.slice(7) === text) return text;
      return text && text !== url ? `${text}: ${url}` : url;
    })
    // Middot separators are a visual device between inline links; on their own line they are noise.
    .replace(/\s·\s/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h1|h2|h3|ul|table)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    // Source indentation between `<li>` tags turns into a blank line between every bullet.
    .replace(/\n{2,}(?=- )/g, '\n')
    .trim();
}

// ─── Account emails ───────────────────────────────────────────────────────────

const VERIFY_COPY: Record<EmailLocale, {
  subject: string; title: string; body: string; button: string; copyLink: string; expiry: string;
}> = {
  en: {
    subject: `Verify your ${SITE_NAME} account`,
    title: 'Verify your email',
    body: `Hi! To complete your ${SITE_NAME} registration, click the button below to verify your email address.`,
    button: 'Verify email',
    copyLink: 'Or copy this link:',
    expiry: 'This link expires in 24 hours. If you did not register, you can safely ignore this email.',
  },
  he: {
    subject: `אימות חשבון ${SITE_NAME}`,
    title: 'אמת את כתובת האימייל שלך',
    body: `שלום! כדי להשלים את הרישום שלך ל-${SITE_NAME}, לחץ על הכפתור למטה לאימות כתובת האימייל.`,
    button: 'אימות אימייל',
    copyLink: 'או העתק את הקישור:',
    expiry: 'הקישור תקף ל-24 שעות. אם לא נרשמת, ניתן להתעלם מהודעה זו.',
  },
  ar: {
    subject: `تأكيد حسابك في ${SITE_NAME}`,
    title: 'تأكيد بريدك الإلكتروني',
    body: `مرحبًا! لإكمال تسجيلك في ${SITE_NAME}، اضغط على الزر أدناه لتأكيد بريدك الإلكتروني.`,
    button: 'تأكيد البريد الإلكتروني',
    copyLink: 'أو انسخ هذا الرابط:',
    expiry: 'تنتهي صلاحية هذا الرابط خلال 24 ساعة. إذا لم تسجّل، يمكنك تجاهل هذه الرسالة.',
  },
  hi: {
    subject: `अपना ${SITE_NAME} खाता सत्यापित करें`,
    title: 'अपना ईमेल सत्यापित करें',
    body: `नमस्ते! ${SITE_NAME} पर अपना रजिस्ट्रेशन पूरा करने के लिए, नीचे दिए बटन पर क्लिक करके अपना ईमेल पता सत्यापित करें।`,
    button: 'ईमेल सत्यापित करें',
    copyLink: 'या यह लिंक कॉपी करें:',
    expiry: 'यह लिंक 24 घंटे तक मान्य है। यदि आपने रजिस्ट्रेशन नहीं किया है, तो इस संदेश को अनदेखा कर सकते हैं।',
  },
};

/** Verification, on sign-up. */
export async function sendVerificationEmail(to: string, token: string, locale: EmailLocale = 'he'): Promise<boolean> {
  const c = VERIFY_COPY[locale];
  const dir = emailDir(locale);
  const align = dir === 'rtl' ? 'right' : 'left';
  const verifyUrl = `${baseUrl()}/api/account/verify-email?token=${encodeURIComponent(token)}`;
  const logo = await logoImgTag();
  const html = `
    <div dir="${dir}" style="font-family: sans-serif; max-width: 560px; margin: 0 auto; text-align: ${align};">
      ${logo}
      <p style="margin:0 0 12px 0;">${characterImg('waving')}</p>
      <h2 style="color: #059669;">${c.title}</h2>
      <p>${c.body}</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">${c.button}</a>
      </p>
      <p style="font-size: 13px; color: #64748b;">${c.copyLink} ${verifyUrl}</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">${c.expiry}</p>
    </div>
  `;
  return sendEmail(to, c.subject, html, {
    text: htmlToText(html),
    replyTo: SUPPORT_EMAIL,
  });
}

const RESET_COPY: Record<EmailLocale, {
  subject: string; title: string; body: string; button: string; copyLink: string; expiry: string;
}> = {
  en: {
    subject: 'Reset your password – Sim2Me',
    title: 'Reset your password',
    body: `We received a request to reset your password for your ${SITE_NAME} account. Click the link below to set a new password:`,
    button: 'Reset password',
    copyLink: 'Or copy this link:',
    expiry: "This link expires in 1 hour. If you didn't request a reset, you can ignore this email.",
  },
  he: {
    subject: 'איפוס סיסמה – Sim2Me',
    title: 'איפוס הסיסמה שלך',
    body: `קיבלנו בקשה לאיפוס הסיסמה לחשבון ${SITE_NAME} שלך. לחץ על הכפתור למטה כדי להגדיר סיסמה חדשה:`,
    button: 'איפוס סיסמה',
    copyLink: 'או העתק את הקישור:',
    expiry: 'הקישור תקף לשעה אחת. אם לא ביקשת איפוס, ניתן להתעלם מהודעה זו.',
  },
  ar: {
    subject: 'إعادة تعيين كلمة المرور – Sim2Me',
    title: 'إعادة تعيين كلمة المرور',
    body: `تلقّينا طلبًا لإعادة تعيين كلمة المرور لحسابك في ${SITE_NAME}. اضغط على الزر أدناه لتعيين كلمة مرور جديدة:`,
    button: 'إعادة تعيين كلمة المرور',
    copyLink: 'أو انسخ هذا الرابط:',
    expiry: 'تنتهي صلاحية هذا الرابط خلال ساعة واحدة. إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.',
  },
  hi: {
    subject: 'अपना पासवर्ड रीसेट करें – Sim2Me',
    title: 'अपना पासवर्ड रीसेट करें',
    body: `हमें आपके ${SITE_NAME} खाते का पासवर्ड रीसेट करने का अनुरोध मिला है। नया पासवर्ड सेट करने के लिए नीचे दिए बटन पर क्लिक करें:`,
    button: 'पासवर्ड रीसेट करें',
    copyLink: 'या यह लिंक कॉपी करें:',
    expiry: 'यह लिंक एक घंटे तक मान्य है। यदि आपने रीसेट का अनुरोध नहीं किया है, तो इस संदेश को अनदेखा कर सकते हैं।',
  },
};

export async function sendPasswordResetEmail(to: string, token: string, locale: EmailLocale = 'en'): Promise<boolean> {
  const c = RESET_COPY[locale];
  const dir = emailDir(locale);
  const align = dir === 'rtl' ? 'right' : 'left';
  const resetUrl = `${baseUrl()}/${locale}/account/reset-password?token=${encodeURIComponent(token)}`;
  const logo = await logoImgTag();
  const html = `
    <div dir="${dir}" style="font-family: sans-serif; max-width: 560px; margin: 0 auto; text-align: ${align};">
      ${logo}
      <p style="margin:0 0 12px 0;">${characterImg('reassuring')}</p>
      <h2 style="color: #059669;">${c.title}</h2>
      <p>${c.body}</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">${c.button}</a>
      </p>
      <p style="font-size: 13px; color: #64748b;">${c.copyLink} ${resetUrl}</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">${c.expiry}</p>
    </div>
  `;
  return sendEmail(to, c.subject, html, { text: htmlToText(html), replyTo: SUPPORT_EMAIL });
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

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
  /*
    Ticket 033 — the receipt half of the email. All optional: the five call sites were migrated one
    at a time, and a caller that genuinely does not hold a field should omit it rather than invent
    one. Anything absent is left out of the rendered block, never printed as an empty row.

    No destination field, deliberately. `Order.destination` holds whatever the supplier returned in
    `location || locationCode`, which is sometimes "Turkey" and sometimes "TR" — and the plan name
    beside it already reads "Turkey 1GB 7Days". A row that is redundant when it works and looks
    unfinished when it does not is worth leaving out. Admin mail keeps it; admins read codes fine.
  */
  orderNo?: string | null;
  amountPaid?: number | null;
  currency?: string | null;
  orderDate?: Date | null;
  iccid?: string | null;
}

const POST_PURCHASE_COPY: Record<EmailLocale, {
  subject: string; nameFallback: string; planFallback: string;
  greeting: string; intro: string; detailsTitle: string;
  labelPlan: string; labelData: string; labelValidity: string;
  howToInstall: string; quickInstall: string; quickInstallHint: string;
  qrTitle: string; qrAttached: string; qrInAccount: string;
  manualTitle: string; manualIntro: string;
  accountTitle: string; accountText: string; usernameLabel: string;
  tempPasswordLabel: string; tempPasswordHint: string;
  /*
    Ticket 036 — the golden tip, in the one message every buyer opens. Deliberately the same wording
    as `howItWorks.golden*` in the message files: a customer who reads the email and then the site
    must not find two different sequences.
  */
  goldenTitle: string; goldenSteps: readonly string[]; goldenWarning: string;
  signOff: string;
  receiptTitle: string; labelOrderNo: string;
  labelPaid: string; labelDate: string; labelIccid: string;
  supportTitle: string; supportText: string; guideLabel: string; contactLabel: string;
}> = {
  he: {
    subject: 'ה-eSIM שלך מ-SIM2ME מוכן להפעלה! ✈️',
    nameFallback: 'לקוח/ה',
    planFallback: 'חבילת נתונים',
    greeting: 'שלום',
    intro: 'איזה כיף שאתה טס עם SIM2ME! החבילה שלך הופעלה בהצלחה ומוכנה לשימוש.',
    detailsTitle: 'פרטי החבילה שלך:',
    labelPlan: 'חבילה:',
    labelData: 'נפח גלישה:',
    labelValidity: 'תוקף:',
    howToInstall: 'איך מתקינים את ה-eSIM?',
    quickInstall: 'התקנה מהירה בלחיצה:',
    quickInstallHint: 'לחץ על הכפתור המתאים למכשיר שלך להתקנה ישירה. אם לא עובד, השתמש בפרטים הידניים למטה.',
    qrTitle: 'סריקת QR:',
    qrAttached: 'מצורף להודעה זו קוד ה-QR שלך, גם כקובץ להורדה. סרוק אותו דרך הגדרות הסלולר במכשיר.',
    qrInAccount: 'קוד ה-QR זמין בעמוד ההזמנה ובחשבון שלך.',
    manualTitle: 'התקנה ידנית:',
    manualIntro: 'אם אינך יכול לסרוק, השתמש בפרטים הבאים:',
    accountTitle: 'כניסה לחשבון וניהול חבילה:',
    accountText: 'תוכל לעקוב אחר צריכת הנתונים שלך ולהוסיף חבילות בקישור הבא:',
    usernameLabel: 'שם משתמש:',
    tempPasswordLabel: 'סיסמה זמנית:',
    tempPasswordHint: '(מומלץ לשנות לאחר הכניסה)',
    goldenTitle: 'הטיפ הזהב: מה לעשות ברגע שנחתתם',
    goldenSteps: [
      'התקינו את ה-eSIM לפני הנסיעה, בזמן שאתם על Wi-Fi. ההתקנה לבדה לא מפעילה את החבילה ולא מתחילה את התוקף.',
      'אחרי הנחיתה — ורק אחרי הנחיתה — כבו את המכשיר ל-10 שניות והדליקו אותו מחדש.',
      'הפעילו נדידת נתונים על קו ה-eSIM, והשאירו אותה כבויה על הקו הישראלי.',
      'הגדירו את קו ה-eSIM כקו שדרכו עוברים הנתונים הסלולריים.',
      'תנו לזה 2–3 דקות. אם עדיין אין חיבור, בחרו רשת ידנית: הגדרות → סלולרי → בחירת רשת → כבו "אוטומטי" ובחרו רשת מהרשימה.',
    ],
    goldenWarning: 'אל תפעילו את קו ה-eSIM בעודכם בארץ. אם הוא נתפס לרשת עוד לפני הנסיעה, ספירת התוקף עלולה להתחיל מוקדם מהמתוכנן.',
    signOff: 'נסיעה טובה!<br/>צוות SIM2ME',
    receiptTitle: 'אישור הזמנה:',
    labelOrderNo: 'מספר הזמנה:',
    labelPaid: 'סכום ששולם:',
    labelDate: 'תאריך:',
    labelIccid: 'מספר ICCID:',
    supportTitle: 'צריכים עזרה?',
    supportText: 'אפשר להשיב ישירות להודעה הזו, ואנחנו כאן:',
    guideLabel: 'מדריך התקנה מלא',
    contactLabel: 'יצירת קשר',
  },
  en: {
    subject: 'Your SIM2ME eSIM is ready to activate! ✈️',
    nameFallback: 'Traveler',
    planFallback: 'Data plan',
    greeting: 'Hi',
    intro: 'Great to have you flying with SIM2ME! Your plan was activated successfully and is ready to use.',
    detailsTitle: 'Your plan details:',
    labelPlan: 'Plan:',
    labelData: 'Data:',
    labelValidity: 'Validity:',
    howToInstall: 'How to install your eSIM',
    quickInstall: 'One-tap quick install:',
    quickInstallHint: 'Tap the button matching your device for direct installation. If it does not work, use the manual details below.',
    qrTitle: 'QR scan:',
    qrAttached: 'Your QR code is in this email and attached as a file. Scan it from your device cellular settings.',
    qrInAccount: 'Your QR code is available on the order page and in your account.',
    manualTitle: 'Manual installation:',
    manualIntro: 'If you cannot scan, use the following details:',
    accountTitle: 'Account access & plan management:',
    accountText: 'Track your data usage and add plans at the following link:',
    usernameLabel: 'Username:',
    tempPasswordLabel: 'Temporary password:',
    tempPasswordHint: '(we recommend changing it after signing in)',
    goldenTitle: 'The golden tip: what to do the moment you land',
    goldenSteps: [
      'Install the eSIM before you travel, while you are on Wi-Fi. Installing on its own does not start the plan and does not start the validity period.',
      'After you land — and only after you land — turn the phone off for ten seconds and back on.',
      'Turn Data Roaming on for the eSIM line, and leave it off on your home line.',
      'Set the eSIM line as the one your mobile data goes through.',
      'Give it two or three minutes. If there is still nothing, pick a network by hand: Settings → Cellular → Network Selection → turn off Automatic and choose an operator from the list.',
    ],
    goldenWarning: 'Do not switch the eSIM line on while you are still at home. If it attaches to a network before you travel, the validity period can start earlier than you planned.',
    signOff: 'Have a great trip!<br/>The SIM2ME Team',
    receiptTitle: 'Order confirmation:',
    labelOrderNo: 'Order number:',
    labelPaid: 'Amount paid:',
    labelDate: 'Date:',
    labelIccid: 'ICCID:',
    supportTitle: 'Need a hand?',
    supportText: 'Just reply to this email — or reach us here:',
    guideLabel: 'Full installation guide',
    contactLabel: 'Contact us',
  },
  ar: {
    subject: 'شريحة eSIM الخاصة بك من SIM2ME جاهزة للتفعيل! ✈️',
    nameFallback: 'عميلنا العزيز',
    planFallback: 'باقة بيانات',
    greeting: 'مرحبًا',
    intro: 'يسعدنا أنك تسافر مع SIM2ME! تم تفعيل باقتك بنجاح وهي جاهزة للاستخدام.',
    detailsTitle: 'تفاصيل باقتك:',
    labelPlan: 'الباقة:',
    labelData: 'حجم البيانات:',
    labelValidity: 'الصلاحية:',
    howToInstall: 'كيف تُثبّت شريحة eSIM؟',
    quickInstall: 'تثبيت سريع بنقرة واحدة:',
    quickInstallHint: 'اضغط على الزر المناسب لجهازك للتثبيت المباشر. إذا لم ينجح، استخدم البيانات اليدوية أدناه.',
    qrTitle: 'مسح رمز QR:',
    qrAttached: 'رمز QR الخاص بك موجود في هذه الرسالة ومرفق أيضًا كملف. امسحه من إعدادات شبكة الجوال في جهازك.',
    qrInAccount: 'رمز QR متاح في صفحة الطلب وفي حسابك.',
    manualTitle: 'التثبيت اليدوي:',
    manualIntro: 'إذا تعذّر عليك المسح، استخدم البيانات التالية:',
    accountTitle: 'الدخول إلى الحساب وإدارة الباقة:',
    accountText: 'يمكنك متابعة استهلاك البيانات وإضافة باقات عبر الرابط التالي:',
    usernameLabel: 'اسم المستخدم:',
    tempPasswordLabel: 'كلمة مرور مؤقتة:',
    tempPasswordHint: '(ننصح بتغييرها بعد تسجيل الدخول)',
    goldenTitle: 'النصيحة الذهبية: ما تفعله لحظة الوصول',
    goldenSteps: [
      'ثبّت شريحة eSIM قبل السفر وأنت متصل بشبكة Wi-Fi. التثبيت وحده لا يبدأ الخطة ولا يبدأ فترة الصلاحية.',
      'بعد الوصول — وبعده فقط — أطفئ الهاتف عشر ثوانٍ ثم أعد تشغيله.',
      'فعّل تجوال البيانات لخط eSIM، واتركه مُطفأً على خطك الأصلي.',
      'اجعل خط eSIM هو الخط الذي تمر عبره بيانات الجوال.',
      'انتظر دقيقتين أو ثلاثًا. إن لم يحدث شيء، اختر شبكة يدويًا: الإعدادات → خلوي → اختيار الشبكة → أوقف «تلقائي» واختر مشغلًا من القائمة.',
    ],
    goldenWarning: 'لا تشغّل خط eSIM وأنت ما زلت في بلدك. إذا اتصل بشبكة قبل السفر فقد تبدأ فترة الصلاحية أبكر مما خططت.',
    signOff: 'رحلة سعيدة!<br/>فريق SIM2ME',
    receiptTitle: 'تأكيد الطلب:',
    labelOrderNo: 'رقم الطلب:',
    labelPaid: 'المبلغ المدفوع:',
    labelDate: 'التاريخ:',
    labelIccid: 'رقم ICCID:',
    supportTitle: 'تحتاج مساعدة؟',
    supportText: 'يمكنك الرد مباشرة على هذه الرسالة، ونحن هنا:',
    guideLabel: 'دليل التثبيت الكامل',
    contactLabel: 'تواصل معنا',
  },
  hi: {
    subject: 'आपका SIM2ME eSIM सक्रिय करने के लिए तैयार है! ✈️',
    nameFallback: 'यात्री',
    planFallback: 'डेटा प्लान',
    greeting: 'नमस्ते',
    intro: 'SIM2ME के साथ यात्रा करने के लिए धन्यवाद! आपका प्लान सफलतापूर्वक सक्रिय हो गया है और उपयोग के लिए तैयार है।',
    detailsTitle: 'आपके प्लान का विवरण:',
    labelPlan: 'प्लान:',
    labelData: 'डेटा:',
    labelValidity: 'वैधता:',
    howToInstall: 'अपना eSIM कैसे इंस्टॉल करें',
    quickInstall: 'एक टैप में तेज़ इंस्टॉल:',
    quickInstallHint: 'सीधे इंस्टॉल के लिए अपने डिवाइस के अनुरूप बटन पर टैप करें। यदि यह काम न करे, तो नीचे दिए मैनुअल विवरण का उपयोग करें।',
    qrTitle: 'QR स्कैन:',
    qrAttached: 'आपका QR कोड इस ईमेल में है और फ़ाइल के रूप में भी संलग्न है। इसे अपने डिवाइस की सेल्युलर सेटिंग्स से स्कैन करें।',
    qrInAccount: 'आपका QR कोड ऑर्डर पेज पर और आपके खाते में उपलब्ध है।',
    manualTitle: 'मैनुअल इंस्टॉलेशन:',
    manualIntro: 'यदि आप स्कैन नहीं कर सकते, तो निम्न विवरण का उपयोग करें:',
    accountTitle: 'खाते में प्रवेश और प्लान प्रबंधन:',
    accountText: 'अपना डेटा उपयोग देखें और नए प्लान जोड़ें, इस लिंक पर:',
    usernameLabel: 'उपयोगकर्ता नाम:',
    tempPasswordLabel: 'अस्थायी पासवर्ड:',
    tempPasswordHint: '(साइन इन के बाद इसे बदलने की सलाह देते हैं)',
    goldenTitle: 'सबसे ज़रूरी सुझाव: उतरते ही क्या करना है',
    goldenSteps: [
      'यात्रा से पहले, Wi-Fi पर रहते हुए eSIM इंस्टॉल कर लें। सिर्फ़ इंस्टॉल करने से प्लान शुरू नहीं होता और वैधता की अवधि भी शुरू नहीं होती।',
      'उतरने के बाद — और केवल उतरने के बाद — फ़ोन को दस सेकंड के लिए बंद करें और फिर चालू करें।',
      'eSIM लाइन पर डेटा रोमिंग चालू करें, और अपनी घरेलू लाइन पर बंद रखें।',
      'मोबाइल डेटा के लिए eSIM लाइन को चुनें।',
      'दो-तीन मिनट दें। अगर फिर भी कुछ न हो, नेटवर्क खुद चुनें: सेटिंग्स → सेल्युलर → नेटवर्क चयन → ऑटोमैटिक बंद करें और सूची से कोई ऑपरेटर चुनें।',
    ],
    goldenWarning: 'घर पर रहते हुए eSIM लाइन चालू न करें। अगर यह यात्रा से पहले किसी नेटवर्क से जुड़ गई, तो वैधता की अवधि आपकी योजना से पहले शुरू हो सकती है।',
    signOff: 'यात्रा शुभ हो!<br/>SIM2ME टीम',
    receiptTitle: 'ऑर्डर की पुष्टि:',
    labelOrderNo: 'ऑर्डर नंबर:',
    labelPaid: 'भुगतान की गई राशि:',
    labelDate: 'तारीख:',
    labelIccid: 'ICCID:',
    supportTitle: 'मदद चाहिए?',
    supportText: 'इस ईमेल का सीधे उत्तर दें — या यहाँ संपर्क करें (सहायता अंग्रेज़ी में):',
    guideLabel: 'पूरा इंस्टॉलेशन गाइड',
    contactLabel: 'संपर्क करें',
  },
};

interface EmailAttachment {
  filename: string;
  content: string;
}

/**
 * The supplier's QR, pulled down so it can ride along as a file.
 *
 * Gmail and Outlook block remote images until the reader clicks "show images", which today means a
 * customer can open the one email that matters and find no QR code in it. An attachment survives
 * that. Fetched with a short timeout and a size ceiling, and any failure returns null so the email
 * goes out exactly as it does now.
 *
 * Not generated locally from the activation payload, even though `qrcode` is installed: the
 * supplier's image is the authoritative artifact, and re-encoding it ourselves creates a way to
 * hand somebody a QR that does not match their eSIM.
 */
async function fetchQrAttachment(url: string | null | undefined): Promise<EmailAttachment | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 2_000_000) return null;
    return { filename: 'sim2me-esim-qr.png', content: buf.toString('base64') };
  } catch {
    return null;
  }
}

/** Localized post-purchase email (he/en/ar). Defaults to Hebrew for legacy flows. */
export async function sendPostPurchaseEmail(to: string, data: PostPurchaseEmailData, locale: EmailLocale = 'he'): Promise<boolean> {
  const c = POST_PURCHASE_COPY[locale];
  const dir = emailDir(locale);
  const listPad = dir === 'rtl' ? 'padding-right: 20px;' : 'padding-left: 20px;';
  const btnGap = dir === 'rtl' ? 'margin-left:8px;' : 'margin-right:8px;';
  const subject = c.subject;
  const name = data.customerName || c.nameFallback;
  const planName = data.planName || c.planFallback;
  const dataGb = data.dataGb || '—';
  const validityDays = data.validityDays || '—';
  const smdp = data.smdpAddress || '—';
  const code = data.activationCode || '—';
  const loginLink = data.loginLink || `${baseUrl()}/${locale}/account`;
  const email = data.email || to;

  const hasLinks = smdp !== '—' && code !== '—';
  const lpa = hasLinks ? ('LPA:1$' + smdp + '$' + code) : null;
  const iosUrl = lpa ? ('https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=' + encodeURIComponent(lpa)) : null;
  const androidUrl = lpa ? ('https://esimsetup.android.com/esim_qrcode_provisioning?carddata=' + encodeURIComponent(lpa)) : null;

  /*
    The receipt. Every row is conditional on its own field, because the five call sites hold
    different amounts of context — the resend route, for instance, has an order but no live currency
    figure — and a row reading "Amount paid: —" is worse than no row.
  */
  const receiptRows: string[] = [];
  const row = (label: string, value: string) =>
    `<li><strong>${label}</strong> ${value}</li>`;
  if (data.orderNo) receiptRows.push(row(c.labelOrderNo, `<code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(data.orderNo)}</code>`));
  if (data.amountPaid != null) receiptRows.push(row(c.labelPaid, `<strong>${escapeHtml(formatMoney(data.amountPaid, data.currency || 'USD'))}</strong>`));
  if (data.orderDate) receiptRows.push(row(c.labelDate, escapeHtml(formatDate(data.orderDate, locale))));
  if (data.iccid) receiptRows.push(row(c.labelIccid, `<code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(data.iccid)}</code>`));

  const receiptBlock = receiptRows.length
    ? `<p style="margin: 0 0 8px 0; font-weight: 600;">${c.receiptTitle}</p>
    <ul style="margin: 0 0 20px 0; ${listPad}">${receiptRows.join('')}</ul>`
    : '';

  const installBlock = lpa
    ? '<p style="margin:16px 0 8px 0; font-weight:600;">' + c.quickInstall + '</p>' +
      '<p style="margin:0 0 8px 0;">' +
        '<a href="' + iosUrl + '" style="display:inline-block; background:#0d9f6e; color:white; padding:10px 18px; text-decoration:none; border-radius:8px; font-weight:600; font-size:14px; ' + btnGap + '">📲 iPhone</a>' +
        '<a href="' + androidUrl + '" style="display:inline-block; background:#1a73e8; color:white; padding:10px 18px; text-decoration:none; border-radius:8px; font-weight:600; font-size:14px;">🤖 Android</a>' +
      '</p>' +
      '<p style="margin:4px 0 16px 0; font-size:12px; color:#64748b;">' + c.quickInstallHint + '</p>' +
      '<p style="margin:0 0 4px 0; font-size:12px; color:#64748b;"><strong>Activation Link (LPA):</strong></p>' +
      '<p style="margin:0 0 16px 0; background:#f1f5f9; padding:6px 10px; border-radius:6px; font-family:monospace; font-size:11px; word-break:break-all;">' + escapeHtml(lpa) + '</p>'
    : '';

  const qrBlock = data.qrCodeUrl
    ? '<p style="margin:16px 0;"><strong>' + c.qrTitle + '</strong> ' + c.qrAttached + '</p><p style="margin:12px 0;"><img src="' + data.qrCodeUrl + '" alt="QR Code" width="200" height="200" style="display:block; border-radius:8px;" /></p>'
    : '<p style="margin:16px 0;"><strong>' + c.qrTitle + '</strong> ' + c.qrInAccount + '</p>';

  const goldenBlock = `
    <div style="margin: 24px 0 0 0; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:16px;">
      <p style="margin:0 0 10px 0; font-weight:600; color:#065f46;">${c.goldenTitle}</p>
      <ol style="margin:0; ${listPad} color:#065f46; font-size:0.9rem; line-height:1.7;">
        ${c.goldenSteps.map((s) => `<li>${s}</li>`).join('')}
      </ol>
      <p style="margin:12px 0 0 0; font-size:0.85rem; font-weight:600; color:#92400e;">${c.goldenWarning}</p>
    </div>`;

  const supportBlock = `
    <p style="margin: 24px 0 6px 0; font-weight: 600;">${c.supportTitle}</p>
    <p style="margin: 0 0 4px 0; line-height: 1.6;">${c.supportText}
      <a href="${baseUrl()}/${locale}/installation-guide" style="color:#0d9f6e;">${c.guideLabel}</a> ·
      <a href="${baseUrl()}/${locale}/contact" style="color:#0d9f6e;">${c.contactLabel}</a> ·
      <a href="mailto:${SUPPORT_EMAIL}" style="color:#0d9f6e;">${SUPPORT_EMAIL}</a>
    </p>`;

  const logo = await logoImgTag();
  const html = `
<!DOCTYPE html>
<html dir="${dir}" lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #1e293b;">
  <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    ${logo}
    <p style="margin:0 0 12px 0;">${characterImg('checkingPhone')}</p>
    <h1 style="color: #0d9f6e; font-size: 1.5rem; margin: 0 0 16px 0;">${subject}</h1>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.greeting} ${escapeHtml(name)},</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.intro}</p>
    ${receiptBlock}
    <p style="margin: 0 0 8px 0; font-weight: 600;">${c.detailsTitle}</p>
    <ul style="margin: 0 0 20px 0; ${listPad}">
      <li><strong>${c.labelPlan}</strong> ${escapeHtml(planName)}</li>
      <li><strong>${c.labelData}</strong> ${escapeHtml(dataGb)}</li>
      <li><strong>${c.labelValidity}</strong> ${escapeHtml(validityDays)}</li>
    </ul>
    <p style="margin:20px 0 4px 0;">${characterImg('explaining')}</p>
    <p style="margin: 0 0 8px 0; font-weight: 600;">${c.howToInstall}</p>
    ${installBlock}
    ${qrBlock}
    <p style="margin: 16px 0 8px 0;"><strong>${c.manualTitle}</strong> ${c.manualIntro}</p>
    <ul style="margin: 0 0 20px 0; ${listPad}">
      <li><strong>SM-DP+ Address:</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(smdp)}</code></li>
      <li><strong>Activation Code:</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(code)}</code></li>
    </ul>
    <p style="margin: 0 0 8px 0; font-weight: 600;">${c.accountTitle}</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.accountText} <a href="${escapeHtml(loginLink)}" style="color: #0d9f6e;">${escapeHtml(loginLink)}</a></p>
    <p style="margin: 0 0 4px 0;">${c.usernameLabel} <strong>${escapeHtml(email)}</strong></p>
    ${data.tempPassword ? `<p style="margin: 4px 0 0 0;">${c.tempPasswordLabel} <strong style="font-family:monospace; background:#f1f5f9; padding:2px 8px; border-radius:4px;">${escapeHtml(data.tempPassword)}</strong> ${c.tempPasswordHint}</p>` : ''}
    ${goldenBlock}
    ${supportBlock}
    <p style="margin: 20px 0 0 0;">${c.signOff}</p>
  </div>
</body>
</html>
  `.trim();

  const qrAttachment = await fetchQrAttachment(data.qrCodeUrl);

  return sendEmail(to, subject, html, {
    text: htmlToText(html),
    replyTo: SUPPORT_EMAIL,
    attachments: qrAttachment ? [qrAttachment] : undefined,
  });
}

// ─── Fulfillment is late ──────────────────────────────────────────────────────

export interface OrderDelayedEmailData {
  customerName: string;
  orderNo: string;
  planName: string;
  amountPaid?: number | null;
  currency?: string | null;
  accountLink: string;
}

const DELAYED_COPY: Record<EmailLocale, {
  subject: string; nameFallback: string; greeting: string;
  intro: string; whatNowTitle: string; whatNowText: string;
  detailsTitle: string; labelOrderNo: string; labelPlan: string;
  labelPaid: string;
  supportTitle: string; supportText: string; contactLabel: string;
  accountLabel: string; signOff: string;
}> = {
  he: {
    subject: 'קיבלנו את ההזמנה שלך — ה-eSIM בדרך',
    nameFallback: 'לקוח/ה',
    greeting: 'שלום',
    intro: 'התשלום שלך התקבל וההזמנה נקלטה במערכת. הפעלת ה-eSIM לוקחת הפעם קצת יותר זמן מהרגיל, וכבר מטפלים בזה.',
    whatNowTitle: 'מה קורה עכשיו?',
    whatNowText: 'ברגע שה-eSIM יהיה מוכן תקבלו מאיתנו הודעה נוספת עם קוד ה-QR והוראות ההתקנה. אין צורך לעשות דבר, ואין צורך להזמין שוב.',
    detailsTitle: 'פרטי ההזמנה:',
    labelOrderNo: 'מספר הזמנה:',
    labelPlan: 'חבילה:',
    labelPaid: 'סכום ששולם:',
    supportTitle: 'רוצים לדבר איתנו?',
    supportText: 'אפשר להשיב ישירות להודעה הזו עם מספר ההזמנה, או לכתוב לנו:',
    contactLabel: 'יצירת קשר',
    accountLabel: 'צפייה בהזמנות שלי',
    signOff: 'תודה על הסבלנות,<br/>צוות SIM2ME',
  },
  en: {
    subject: 'We have your order — your eSIM is on its way',
    nameFallback: 'Traveler',
    greeting: 'Hi',
    intro: 'Your payment went through and your order is in our system. Activating this eSIM is taking a little longer than usual, and we are already on it.',
    whatNowTitle: 'What happens now?',
    whatNowText: 'As soon as your eSIM is ready you will get a second email with the QR code and install instructions. There is nothing for you to do, and no need to order again.',
    detailsTitle: 'Your order:',
    labelOrderNo: 'Order number:',
    labelPlan: 'Plan:',
    labelPaid: 'Amount paid:',
    supportTitle: 'Want to talk to us?',
    supportText: 'Reply straight to this email with your order number, or reach us here:',
    contactLabel: 'Contact us',
    accountLabel: 'View my orders',
    signOff: 'Thanks for your patience,<br/>The SIM2ME Team',
  },
  ar: {
    subject: 'استلمنا طلبك — شريحة eSIM في الطريق',
    nameFallback: 'عميلنا العزيز',
    greeting: 'مرحبًا',
    intro: 'تم استلام دفعتك وتسجيل طلبك لدينا. تفعيل شريحة eSIM يستغرق هذه المرة وقتًا أطول قليلًا من المعتاد، ونحن نعمل على ذلك بالفعل.',
    whatNowTitle: 'ماذا يحدث الآن؟',
    whatNowText: 'بمجرد أن تصبح شريحتك جاهزة ستصلك رسالة أخرى تحتوي على رمز QR وتعليمات التثبيت. لا حاجة لفعل أي شيء، ولا داعي لإعادة الطلب.',
    detailsTitle: 'تفاصيل الطلب:',
    labelOrderNo: 'رقم الطلب:',
    labelPlan: 'الباقة:',
    labelPaid: 'المبلغ المدفوع:',
    supportTitle: 'هل تريد التحدث إلينا؟',
    supportText: 'يمكنك الرد مباشرة على هذه الرسالة مع ذكر رقم الطلب، أو التواصل معنا هنا:',
    contactLabel: 'تواصل معنا',
    accountLabel: 'عرض طلباتي',
    signOff: 'شكرًا لصبرك،<br/>فريق SIM2ME',
  },
  hi: {
    subject: 'आपका ऑर्डर हमें मिल गया — आपका eSIM रास्ते में है',
    nameFallback: 'यात्री',
    greeting: 'नमस्ते',
    intro: 'आपका भुगतान हो गया है और ऑर्डर हमारे सिस्टम में दर्ज है। इस बार eSIM सक्रिय होने में सामान्य से कुछ अधिक समय लग रहा है, और हम इस पर काम कर रहे हैं।',
    whatNowTitle: 'अब आगे क्या?',
    whatNowText: 'आपका eSIM तैयार होते ही आपको QR कोड और इंस्टॉलेशन निर्देशों के साथ दूसरा ईमेल मिलेगा। आपको कुछ करने की ज़रूरत नहीं है, और दोबारा ऑर्डर करने की भी नहीं।',
    detailsTitle: 'आपका ऑर्डर:',
    labelOrderNo: 'ऑर्डर नंबर:',
    labelPlan: 'प्लान:',
    labelPaid: 'भुगतान की गई राशि:',
    supportTitle: 'हमसे बात करनी है?',
    supportText: 'अपने ऑर्डर नंबर के साथ इस ईमेल का सीधे उत्तर दें, या यहाँ संपर्क करें (सहायता अंग्रेज़ी में):',
    contactLabel: 'संपर्क करें',
    accountLabel: 'मेरे ऑर्डर देखें',
    signOff: 'आपके धैर्य के लिए धन्यवाद,<br/>SIM2ME टीम',
  },
};

/**
 * Sent when a paid order does not produce an eSIM profile.
 *
 * This is the gap ticket 033 exists to close: fulfilment used to email the admin and say nothing at
 * all to the person who had just been charged.
 *
 * It carries no error message on purpose. An English exception fragment inside a Hebrew apology
 * tells the customer nothing they can act on and tells anyone else who reads the mailbox more about
 * our internals than they need.
 */
export async function sendOrderDelayedEmail(to: string, data: OrderDelayedEmailData, locale: EmailLocale = 'he'): Promise<boolean> {
  const c = DELAYED_COPY[locale];
  const dir = emailDir(locale);
  const listPad = dir === 'rtl' ? 'padding-right: 20px;' : 'padding-left: 20px;';
  const name = data.customerName || c.nameFallback;

  const rows: string[] = [
    `<li><strong>${c.labelOrderNo}</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(data.orderNo)}</code></li>`,
    `<li><strong>${c.labelPlan}</strong> ${escapeHtml(data.planName)}</li>`,
  ];
  if (data.amountPaid != null) rows.push(`<li><strong>${c.labelPaid}</strong> ${escapeHtml(formatMoney(data.amountPaid, data.currency || 'USD'))}</li>`);

  const logo = await logoImgTag();
  const html = `
<!DOCTYPE html>
<html dir="${dir}" lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #1e293b;">
  <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    ${logo}
    <p style="margin:0 0 12px 0;">${characterImg('reassuring')}</p>
    <h1 style="color: #0d9f6e; font-size: 1.4rem; margin: 0 0 16px 0;">${c.subject}</h1>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.greeting} ${escapeHtml(name)},</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.intro}</p>
    <p style="margin: 0 0 8px 0; font-weight: 600;">${c.detailsTitle}</p>
    <ul style="margin: 0 0 20px 0; ${listPad}">${rows.join('')}</ul>
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 20px; margin:0 0 20px 0;">
      <p style="margin:0 0 6px 0; font-weight:600; color:#047857;">${c.whatNowTitle}</p>
      <p style="margin:0; line-height:1.6;">${c.whatNowText}</p>
    </div>
    <p style="margin: 0 0 6px 0; font-weight: 600;">${c.supportTitle}</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.supportText}
      <a href="${baseUrl()}/${locale}/contact" style="color:#0d9f6e;">${c.contactLabel}</a> ·
      <a href="mailto:${SUPPORT_EMAIL}" style="color:#0d9f6e;">${SUPPORT_EMAIL}</a>
    </p>
    <p style="margin: 0 0 20px 0;"><a href="${escapeHtml(data.accountLink)}" style="color:#0d9f6e;">${c.accountLabel}</a></p>
    <p style="margin: 20px 0 0 0;">${c.signOff}</p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(to, c.subject, html, { text: htmlToText(html), replyTo: SUPPORT_EMAIL });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

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
  /**
   * eSIMaccess wallet balance in USD, or null when the lookup failed.
   *
   * Admin-only, by explicit instruction. It is deliberately not a field on
   * `PostPurchaseEmailData`, so there is no type-level route by which it could reach a customer.
   */
  esimBalanceUsd?: number | null;
}

/** Below this the balance renders as a warning. */
const BALANCE_ALERT_USD = Number(process.env.ESIM_BALANCE_ALERT_USD ?? 20);

/** Sends an order notification to the admin email. Fire-and-forget — never blocks order flow. */
export async function sendAdminOrderNotificationEmail(data: AdminOrderNotificationData): Promise<void> {
  const to = adminRecipient();
  const profit = (data.amountCharged - data.supplierCost).toFixed(2);
  const profitColor = data.amountCharged >= data.supplierCost ? '#059669' : '#dc2626';

  const bal = data.esimBalanceUsd;
  const balLow = bal != null && bal < BALANCE_ALERT_USD;
  const balanceRow = `<tr><td style="padding: 6px 12px 6px 0; color: #64748b; white-space:nowrap;">eSIMaccess Balance</td><td style="padding: 6px 0; color: ${balLow ? '#dc2626' : '#0f172a'};"><strong>${bal != null ? `$${bal.toFixed(2)}` : '—'}</strong>${balLow ? ' ⚠️ low — top up' : ''}</td></tr>`;

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
    ${balanceRow}
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
  const to = adminRecipient();
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
  const to = adminRecipient();
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
  const to = adminRecipient();
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
  const to = adminRecipient();
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
  const to = adminRecipient();
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
  const to = adminRecipient();
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
  const to = adminRecipient();
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

// ─── Contact form ─────────────────────────────────────────────────────────────

export interface ContactAutoReplyData {
  customerName: string;
  /** `SM-XXXXXX`, from `contactRef()`. The same token the admin notification carries. */
  ref: string;
  /** One of `CONTACT_SUBJECTS`, used to pick which self-help links are worth offering. */
  subject: string;
}

/**
 * Ticket 026. Deliberately free of any timing promise, in any language.
 *
 * That is a product decision, not an omission: the site makes no response-time claim anywhere, so an
 * acknowledgement that quietly invented one here would be the same false promise moved into the inbox.
 * It says the message arrived, gives the reference, and points at the pages that answer the most common
 * version of the question.
 */
const CONTACT_AUTOREPLY_COPY: Record<EmailLocale, {
  subject: (ref: string) => string;
  nameFallback: string; greeting: string; title: string;
  intro: string; refLabel: string;
  meanwhileTitle: string; meanwhileText: string;
  replyNote: string; signOff: string;
}> = {
  he: {
    subject: (ref) => `קיבלנו את ההודעה שלך — ${ref}`,
    nameFallback: 'לקוח/ה',
    greeting: 'שלום',
    title: 'ההודעה שלך הגיעה',
    intro: 'תודה שכתבתם לנו. ההודעה נקלטה אצלנו ואנחנו קוראים כל אחת מהן. נחזור אליכם במייל.',
    refLabel: 'מספר האסמכתא שלכם:',
    meanwhileTitle: 'בינתיים, אולי זה יעזור',
    meanwhileText: 'הרבה שאלות מקבלות תשובה מיידית בעמודים האלה:',
    replyNote: 'אפשר להשיב ישירות להודעה הזו, ומספר האסמכתא יישאר צמוד לפנייה.',
    signOff: 'תודה,<br/>צוות SIM2ME',
  },
  en: {
    subject: (ref) => `We have your message — ${ref}`,
    nameFallback: 'Traveler',
    greeting: 'Hi',
    title: 'Your message reached us',
    intro: 'Thank you for writing to us. Your message is in our inbox and we read every one of them. We will get back to you by email.',
    refLabel: 'Your reference:',
    meanwhileTitle: 'In the meantime, this might help',
    meanwhileText: 'A lot of questions are answered straight away on these pages:',
    replyNote: 'You can reply directly to this email, and your reference stays attached to the conversation.',
    signOff: 'Thank you,<br/>The SIM2ME Team',
  },
  ar: {
    subject: (ref) => `استلمنا رسالتك — ${ref}`,
    nameFallback: 'عميلنا العزيز',
    greeting: 'مرحبًا',
    title: 'وصلتنا رسالتك',
    intro: 'شكرًا لتواصلك معنا. رسالتك وصلت إلينا ونقرأ كل رسالة. سنعود إليك عبر البريد الإلكتروني.',
    refLabel: 'رقم مرجعك:',
    meanwhileTitle: 'في الأثناء، قد يساعدك هذا',
    meanwhileText: 'الكثير من الأسئلة تجد جوابها فورًا في هذه الصفحات:',
    replyNote: 'يمكنك الرد مباشرة على هذه الرسالة، وسيبقى رقم المرجع مرتبطًا بمحادثتك.',
    signOff: 'شكرًا،<br/>فريق SIM2ME',
  },
  hi: {
    subject: (ref) => `आपका संदेश हमें मिल गया — ${ref}`,
    nameFallback: 'यात्री',
    greeting: 'नमस्ते',
    title: 'आपका संदेश हम तक पहुँच गया',
    intro: 'हमें लिखने के लिए धन्यवाद। आपका संदेश हमारे इनबॉक्स में है और हम हर संदेश पढ़ते हैं। हम ईमेल से उत्तर देंगे, अंग्रेज़ी में।',
    refLabel: 'आपका रेफ़रेंस:',
    meanwhileTitle: 'तब तक, यह मदद कर सकता है',
    meanwhileText: 'बहुत से सवालों का उत्तर इन पेजों पर तुरंत मिल जाता है:',
    replyNote: 'आप इस ईमेल का सीधे उत्तर दे सकते हैं, और आपका रेफ़रेंस उसी बातचीत से जुड़ा रहेगा।',
    signOff: 'धन्यवाद,<br/>SIM2ME टीम',
  },
};

/** Paths, not URLs — the locale prefix is added when the mail is built. */
const AUTOREPLY_LINKS: Record<string, readonly string[]> = {
  'Installation Help': ['/installation-guide', '/compatible-devices', '/help'],
  'Activation Issue': ['/installation-guide', '/help', '/account'],
  'Connectivity Problem': ['/help', '/installation-guide'],
  'Refund Request': ['/refund', '/terms'],
  'Billing & Payment': ['/account', '/terms'],
  'General Inquiry': ['/help'],
};

const LINK_LABELS: Record<EmailLocale, Record<string, string>> = {
  he: {
    '/installation-guide': 'מדריך התקנה',
    '/compatible-devices': 'מכשירים תואמים',
    '/help': 'מרכז העזרה',
    '/refund': 'מדיניות החזרים',
    '/terms': 'תנאי שימוש',
    '/account': 'החשבון שלי',
  },
  en: {
    '/installation-guide': 'Installation guide',
    '/compatible-devices': 'Compatible devices',
    '/help': 'Help centre',
    '/refund': 'Refund policy',
    '/terms': 'Terms of service',
    '/account': 'My account',
  },
  ar: {
    '/installation-guide': 'دليل التثبيت',
    '/compatible-devices': 'الأجهزة المتوافقة',
    '/help': 'مركز المساعدة',
    '/refund': 'سياسة الاسترداد',
    '/terms': 'شروط الاستخدام',
    '/account': 'حسابي',
  },
  hi: {
    '/installation-guide': 'इंस्टॉलेशन गाइड',
    '/compatible-devices': 'समर्थित डिवाइस',
    '/help': 'सहायता केंद्र',
    // Legal pages are published in English only, so the label says so before the reader clicks.
    '/refund': 'Refund policy (अंग्रेज़ी में)',
    '/terms': 'Terms of service (अंग्रेज़ी में)',
    '/account': 'मेरा खाता',
  },
};

/** Confirms to the customer that their message arrived, and hands them a reference. */
export async function sendContactAutoReplyEmail(to: string, data: ContactAutoReplyData, locale: EmailLocale = 'he'): Promise<boolean> {
  const c = CONTACT_AUTOREPLY_COPY[locale];
  const dir = emailDir(locale);
  const listPad = dir === 'rtl' ? 'padding-right: 20px;' : 'padding-left: 20px;';
  const name = data.customerName || c.nameFallback;
  const subject = c.subject(data.ref);

  const paths = AUTOREPLY_LINKS[data.subject] ?? AUTOREPLY_LINKS['General Inquiry'];
  const links = paths
    .map((p) => `<li><a href="${baseUrl()}/${locale}${p}" style="color:#0d9f6e;">${LINK_LABELS[locale][p] ?? p}</a></li>`)
    .join('');

  const logo = await logoImgTag();
  const html = `
<!DOCTYPE html>
<html dir="${dir}" lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #1e293b;">
  <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    ${logo}
    <p style="margin:0 0 12px 0;">${characterImg('reassuring')}</p>
    <h1 style="color: #0d9f6e; font-size: 1.4rem; margin: 0 0 16px 0;">${c.title}</h1>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.greeting} ${escapeHtml(name)},</p>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.intro}</p>
    <p style="margin: 0 0 20px 0;"><strong>${c.refLabel}</strong>
      <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px;">${escapeHtml(data.ref)}</code>
    </p>
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 20px; margin:0 0 20px 0;">
      <p style="margin:0 0 6px 0; font-weight:600; color:#047857;">${c.meanwhileTitle}</p>
      <p style="margin:0 0 8px 0; line-height:1.6;">${c.meanwhileText}</p>
      <ul style="margin:0; ${listPad}">${links}</ul>
    </div>
    <p style="margin: 0 0 20px 0; line-height: 1.6;">${c.replyNote}</p>
    <p style="margin: 20px 0 0 0;">${c.signOff}</p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail(to, subject, html, { text: htmlToText(html), replyTo: SUPPORT_EMAIL });
}

export interface ContactAdminNotificationData {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  ref: string;
  /** Raised for the subjects where someone is standing in an airport unable to connect. */
  urgent: boolean;
  marketingConsent: boolean;
}

/**
 * The admin side of a contact submission.
 *
 * Moved out of the route and onto `sendEmail` so it inherits the preview sink, the plain-text part and
 * the no-API-key development branch that every other email already had. The phone number, the
 * reference and the deep link are here because the previous version left Gabriel with a name, an email
 * and no way to act without first going to look the person up.
 */
export function sendContactAdminNotificationEmail(data: ContactAdminNotificationData): void {
  const to = adminRecipient();
  const subject = `${data.urgent ? '[URGENT] ' : ''}[Sim2Me] ${data.subject} — ${data.ref}`;
  const phoneRow = data.phone
    ? `<tr><td style="padding:6px 0; font-weight:bold; color:#555;">Phone:</td><td style="padding:6px 0;"><a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></td></tr>`
    : '';
  const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  ${data.urgent ? '<p style="margin:0 0 12px 0; padding:10px 14px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; color:#b91c1c; font-weight:600;">Urgent subject — a customer may be unable to connect right now.</p>' : ''}
  <h2 style="color: #0d9668; margin:0 0 12px 0;">New contact submission</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding:6px 0; font-weight:bold; color:#555; width:110px;">Reference:</td><td style="padding:6px 0;"><code>${escapeHtml(data.ref)}</code></td></tr>
    <tr><td style="padding:6px 0; font-weight:bold; color:#555;">Name:</td><td style="padding:6px 0;">${escapeHtml(data.name)}</td></tr>
    <tr><td style="padding:6px 0; font-weight:bold; color:#555;">Email:</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
    ${phoneRow}
    <tr><td style="padding:6px 0; font-weight:bold; color:#555;">Subject:</td><td style="padding:6px 0;">${escapeHtml(data.subject)}</td></tr>
    <tr><td style="padding:6px 0; font-weight:bold; color:#555;">Marketing:</td><td style="padding:6px 0;">${data.marketingConsent ? 'Opted in' : 'No'}</td></tr>
  </table>
  <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
    <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
  </div>
  <p style="margin-top: 20px;"><a href="${baseUrl()}/admin/contact" style="display:inline-block; background:#0f172a; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-size:14px;">Open in admin</a></p>
</div>`.trim();

  sendEmail(to, subject, html, { text: htmlToText(html), replyTo: data.email }).catch(() => {});
}

// ──────────────────────────────────────────────────────────────────────────────

const OTP_COPY: Record<EmailLocale, {
  subject: (code: string) => string; title: string; body: string; ignore: string;
}> = {
  en: {
    subject: (code) => `${code} — your ${SITE_NAME} login code`,
    title: 'Your login code',
    body: `Use this code to complete your ${SITE_NAME} login. It expires in <strong>10 minutes</strong>.`,
    ignore: 'If you did not try to log in, you can safely ignore this email.',
  },
  he: {
    subject: (code) => `${code} — קוד הכניסה שלך ל-${SITE_NAME}`,
    title: 'קוד הכניסה שלך',
    body: `השתמש בקוד הזה כדי להשלים את הכניסה ל-${SITE_NAME}. הקוד תקף ל-<strong>10 דקות</strong>.`,
    ignore: 'אם לא ניסית להיכנס, ניתן להתעלם מהודעה זו.',
  },
  ar: {
    subject: (code) => `${code} — رمز الدخول إلى ${SITE_NAME}`,
    title: 'رمز الدخول الخاص بك',
    body: `استخدم هذا الرمز لإكمال تسجيل الدخول إلى ${SITE_NAME}. تنتهي صلاحيته خلال <strong>10 دقائق</strong>.`,
    ignore: 'إذا لم تحاول تسجيل الدخول، يمكنك تجاهل هذه الرسالة.',
  },
  hi: {
    subject: (code) => `${code} — आपका ${SITE_NAME} लॉगिन कोड`,
    title: 'आपका लॉगिन कोड',
    body: `${SITE_NAME} में लॉगिन पूरा करने के लिए इस कोड का उपयोग करें। यह <strong>10 मिनट</strong> तक मान्य है।`,
    ignore: 'यदि आपने लॉगिन की कोशिश नहीं की है, तो इस संदेश को अनदेखा कर सकते हैं।',
  },
};

/**
 * Sends a 6-digit OTP login code to the customer.
 *
 * Login OTP is currently disabled in `src/lib/auth.ts`; this template is kept working so that
 * re-enabling it is a one-line change rather than a rewrite.
 */
export async function sendOtpEmail(to: string, code: string, locale: EmailLocale = 'he'): Promise<boolean> {
  const c = OTP_COPY[locale];
  const dir = emailDir(locale);
  const align = dir === 'rtl' ? 'right' : 'left';
  const logo = await logoImgTag();
  const html = `
    <div dir="${dir}" style="font-family: sans-serif; max-width: 480px; margin: 0 auto; text-align: ${align};">
      ${logo}
      <p style="margin:0 0 12px 0;">${characterImg('waving')}</p>
      <h2 style="color: #0f172a; margin: 0 0 8px 0;">${c.title}</h2>
      <p style="color: #475569; margin: 0 0 24px 0;">${c.body}</p>
      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span dir="ltr" style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #0f172a; font-family: monospace;">${escapeHtml(code)}</span>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">${c.ignore}</p>
    </div>
  `;
  return sendEmail(to, c.subject(code), html, {
    text: htmlToText(html),
    replyTo: SUPPORT_EMAIL,
  });
}

interface SendOptions {
  /** Plain-text alternative. Its absence is a spam signal on an HTML-only message. */
  text?: string;
  /** Where a reply lands. Without it, a customer who hits reply reaches nobody. */
  replyTo?: string;
  attachments?: EmailAttachment[];
}

async function sendEmail(to: string, subject: string, html: string, opts?: SendOptions): Promise<boolean> {
  /*
    Preview sink, for `agent-workspace/scripts/email-preview.ts`.

    The point of a preview is to show what would actually arrive, so it is taken from inside the one
    function every email passes through rather than from a parallel set of render helpers that could
    drift from the real thing. Guarded by an env var that exists only on a developer's machine, and
    the fs import is dynamic so nothing is pulled into the server bundle when it is unset.
  */
  const previewDir = process.env.EMAIL_PREVIEW_DIR;
  if (previewDir) {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const slug = `${to.replace(/[^a-z0-9]/gi, '_')}__${subject.replace(/[^a-z0-9]/gi, '_').slice(0, 60)}`;
    await mkdir(previewDir, { recursive: true });
    await writeFile(join(previewDir, `${slug}.html`), html, 'utf8');
    if (opts?.text) await writeFile(join(previewDir, `${slug}.txt`), opts.text, 'utf8');
    console.log(`[Email preview] ${slug}.html${opts?.attachments?.length ? ` (+${opts.attachments.length} attachment)` : ''}`);
    return true;
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] No RESEND_API_KEY — would send:', { to, subject });
    return true;
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: [to],
      subject,
      html,
      ...(opts?.text ? { text: opts.text } : {}),
      ...(opts?.replyTo ? { replyTo: opts.replyTo } : {}),
      ...(opts?.attachments?.length ? { attachments: opts.attachments } : {}),
    });
    return true;
  } catch (e) {
    console.error('[Email] Send failed:', e);
    return false;
  }
}
