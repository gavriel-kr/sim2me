/**
 * Standard destination article in Hebrew (structure similar to EN country pages).
 * CTA → https://www.sim2me.net/he/destinations/{dest}
 */
const SITE = 'https://www.sim2me.net';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ctaHe(dest, labelHe) {
  const href = `${SITE}/he/destinations/${dest}`;
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${href}" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">קנו eSIM ל${esc(labelHe)} — לחצו כאן</a></p><a href="${href}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">קנו eSIM ל${esc(labelHe)}</a></div>`;
}

export function buildHeStandardDestinationHtml({ countryHe, dest }) {
  const p1 = `<p class="my-3" dir="rtl">בטיול ב${esc(countryHe)} חיבור יציב לנתונים הוא חלק מרכזי בניווט, בהזמנות ובשיחות עם המשפחה. עם <strong>eSIM ל${esc(countryHe)} מ‑Sim2Me</strong> תוכלו להפעיל קו נתונים דיגיטלי בלי להחליף כרטיס פיזי, ולשמור את הקו הביתי במכשיר לשיחות ו‑SMS לפי הצורך.</p>`;
  const h1 = `<h2 class="text-xl font-bold mt-8 mb-3" dir="rtl">למה לבחור ב‑Sim2Me</h2>`;
  const p2 = `<p class="my-3" dir="rtl">Sim2Me מציעה בקשות גמישות לפי משך השהייה, עם כיסוי ברשתות מקומיות מובילות בכל מקום שבו אנו פועלים. ההפעלה מתבצעת סריקת QR או קישור — בדרך כלל לפני הנסיעה, כדי לצאת לדרך מחוברים.</p>`;
  const h2 = `<h2 class="text-xl font-bold mt-8 mb-3" dir="rtl">מה כלול בדרך כלל</h2>`;
  const ul = `<ul class="list-disc pr-6 my-3 space-y-1" dir="rtl"><li>נתונים סלולריים מהירים בערים המרכזיות ובמסלולי תיירות פופולריים</li><li>ללא התחייבות ארוכת טווח — בוחרים את הבקשה שמתאימה לטיול</li><li>ניהול קל דרך החשבון והמייל</li><li>תמיכה בעברית ובאנגלית לשאלות הפעלה</li></ul>`;
  const h3 = `<h2 class="text-xl font-bold mt-8 mb-3" dir="rtl">טיפים קצרים לפני הנסיעה</h2>`;
  const p3 = `<p class="my-3" dir="rtl">התקינו את ה‑eSIM כשאתם מחוברים ל‑Wi‑Fi, כבו נתונים בנדרים על הקו הביתי כשאתם משתמשים ב‑eSIM לנתונים, והפעילו חיסכון בנתונים באפליקציות שצורכות הרבה רקע. כך נשמר יותר מיכסה לניווט ולתקשורת החשובה באמת.</p>`;
  return `${p1}\n${h1}\n${p2}\n${h2}\n${ul}\n${h3}\n${p3}\n${ctaHe(dest, countryHe)}\n${ctaHe(dest, countryHe)}`;
}

export function buildSeoHe(titleHe, plainExcerpt) {
  const excerpt = plainExcerpt.slice(0, 220);
  const metaDesc = plainExcerpt.slice(0, 155);
  return {
    excerptHe: excerpt,
    metaTitleHe: titleHe.slice(0, 60),
    metaDescHe: metaDesc,
    ogTitleHe: titleHe.slice(0, 60),
    ogDescHe: excerpt.slice(0, 200),
    focusKeywordHe: titleHe.slice(0, 80),
  };
}
