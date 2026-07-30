/**
 * Builds Part7-style short articles (2 CTAs, "Why Sim2Me") for EN/AR.
 * English destination links follow existing articles: https://www.sim2me.net/destinations/{code}
 * Arabic: https://www.sim2me.net/ar/destinations/{code}
 */
const SITE = 'https://www.sim2me.net';

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ctaBlockEn(dest, countryEn) {
  const href = `${SITE}/destinations/${dest}`;
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${href}" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">Get eSIM for ${esc(countryEn)} – Click here</a></p><a href="${href}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">Get eSIM for ${esc(countryEn)}</a></div>`;
}

function ctaBlockAr(dest, countryAr) {
  const href = `${SITE}/ar/destinations/${dest}`;
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${href}" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">شراء eSIM لـ ${esc(countryAr)} – اضغط هنا</a></p><a href="${href}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">شراء eSIM لـ ${esc(countryAr)}</a></div>`;
}

export function buildShortTemplateHtml(locale, { dest, countryEn, countryAr, p4en, p4ar }) {
  if (locale === 'en') {
    const p1 = `<p>When you land in ${esc(countryEn)}, your phone becomes an essential tool: navigation, booking rides, check-in, and sharing your location with people waiting for you. Roaming data from home might seem convenient, but it can turn into a surprisingly large bill after just one day of maps, photos, and messages.</p>`;
    const p2 = `<p>A local SIM can work, but it isn't always available right away, sometimes requires an open store or ID, and it can get confusing when your phone number changes and verification codes don't arrive. An eSIM solves that: install digitally in advance and connect without swapping a physical card.</p>`;
    const h2 = `<h2>Why Sim2Me</h2>`;
    const p3 = `<p>Sim2Me lets you choose an eSIM plan for ${esc(countryEn)} online, receive activation details, and set the eSIM as your data line. That way you keep your primary SIM in the device (for calls and OTPs if needed) and get separate, predictable data for your trip.</p>`;
    const p4 = `<p>${esc(p4en)}</p>`;
    const p5 = `<p>Quick technical tip that makes a difference: install the eSIM on Wi‑Fi, turn off roaming on your home line, and enable data saver. It's also wise to turn off automatic photo backups and background uploads so you save data for what really matters (maps, messages, and work calls).</p>`;
    const p6 = `<p>If you're moving between areas in the same day, keep the eSIM active and only push heavy use to hotel Wi‑Fi so your plan lasts for the whole trip in ${esc(countryEn)} without surprises.</p>`;
    return `${p1}\n  ${p2}\n  ${h2}\n  ${p3}\n  ${ctaBlockEn(dest, countryEn)}\n  ${p4}\n  ${p5}\n  ${p6}\n  ${ctaBlockEn(dest, countryEn)}`;
  }
  if (locale === 'ar') {
    const p1 = `<p>عند وصولك إلى ${esc(countryAr)}، يصبح الهاتف أداة أساسية: التنقل، حجز التنقلات، تسجيل الوصول، ومشاركة الموقع مع من ينتظرك. قد يبدو التجوال من البلد الأصلي مريحًا، لكنه قد يتحول إلى فاتورة مفاجئة بعد يوم واحد من الخرائط والصور والرسائل.</p>`;
    const p2 = `<p>قد يعمل شريح محلي، لكنه ليس متاحًا دائمًا فورًا، وأحيانًا يتطلب متجرًا مفتوحًا أو هوية، وقد يحدث ارتباك عند تغيّر رقم الهاتف وعدم وصول رموز التحقق. يحل eSIM ذلك: تثبيت رقمي مسبقًا والاتصال دون تبديل بطاقة فعلية.</p>`;
    const h2 = `<h2>لماذا Sim2Me</h2>`;
    const p3 = `<p>يتيح لك Sim2Me اختيار باقة eSIM لـ ${esc(countryAr)} عبر الإنترنت، واستلام تفاصيل التفعيل، وتعيين eSIM كخط البيانات. بهذه الطريقة تحتفظ بشريحتك الأساسية في الجهاز (للمكالمات ورموز OTP عند الحاجة) وتحصل على بيانات منفصلة وواضحة للرحلة.</p>`;
    const p4 = `<p>${esc(p4ar)}</p>`;
    const p5 = `<p>نصيحة تقنية سريعة: ثبّت eSIM على Wi‑Fi، وأوقف التجوال على خطك الأساسي، وفعّل توفير البيانات. يُفضّل أيضًا إيقاف النسخ الاحتياطي التلقائي للصور في الخلفية لتوفير الحجم للخرائط والرسائل.</p>`;
    const p6 = `<p>إذا انتقلت بين مناطق في اليوم نفسه، أبقِ eSIM نشطًا وحدّ الاستخدام الثقيل إلى Wi‑Fi في الفندق حتى تكفي الباقية لكامل الرحلة في ${esc(countryAr)} دون مفاجآت.</p>`;
    return `${p1}\n  ${p2}\n  ${h2}\n  ${p3}\n  ${ctaBlockAr(dest, countryAr)}\n  ${p4}\n  ${p5}\n  ${p6}\n  ${ctaBlockAr(dest, countryAr)}`;
  }
  throw new Error(`Unsupported locale ${locale}`);
}

export function buildSeo(locale, title, plainExcerpt) {
  const excerpt = plainExcerpt.slice(0, 220);
  const metaDesc = plainExcerpt.slice(0, 155);
  const fk =
    locale === 'en'
      ? title.replace(/^eSIM for /i, 'eSIM for ') // keep
      : locale === 'ar'
        ? title.replace(/^eSIM\s+/i, 'eSIM ')
        : title;
  return {
    excerpt,
    metaTitle: title.slice(0, 60),
    metaDesc,
    ogTitle: title.slice(0, 60),
    ogDesc: excerpt.slice(0, 200),
    focusKeyword: fk.slice(0, 80),
  };
}
