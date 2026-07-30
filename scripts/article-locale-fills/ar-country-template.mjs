/**
 * Standard Arabic destination article (RTL, CTA to /ar/destinations/{dest}).
 */
const SITE = 'https://www.sim2me.net';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ctaAr(dest, countryAr) {
  const href = `${SITE}/ar/destinations/${dest}`;
  return `<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${href}" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">شراء eSIM لـ ${esc(countryAr)} — اضغط هنا</a></p><a href="${href}" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">شراء eSIM لـ ${esc(countryAr)}</a></div>`;
}

export function buildArStandardDestinationHtml({ countryAr, dest }) {
  const p1 = `<p class="my-3" dir="rtl">أثناء السفر في ${esc(countryAr)}، يحتاج المسافر إلى إنترنت موثوق للخرائط والحجوزات والتواصل. مع <strong>eSIM لـ ${esc(countryAr)} من Sim2Me</strong> تفعّل خط بيانات رقميًا دون تبديل الشريحة الفيزيائية، مع إبقاء خطك الأساسي للمكالمات ورموز التحقق عند الحاجة.</p>`;
  const h1 = `<h2 class="text-xl font-bold mt-8 mb-3" dir="rtl">لماذا Sim2Me</h2>`;
  const p2 = `<p class="my-3" dir="rtl">توفر Sim2Me باقات مرنة تناسب مدة الإقامة، عادةً عبر شبكات محلية قوية حيث نعمل. التفعيل سريع عبر QR أو رابط — يُفضّل على Wi‑Fi قبل السفر.</p>`;
  const h2 = `<h2 class="text-xl font-bold mt-8 mb-3" dir="rtl">ما الذي تحصل عليه عادةً</h2>`;
  const ul = `<ul class="list-disc pr-6 my-3 space-y-1" dir="rtl"><li>بيانات سريعة في المدن الرئيسية وممرات السياحة الشائعة</li><li>بدون عقد طويل — اختر الباقة المناسبة للرحلة</li><li>إدارة سهلة عبر الحساب والبريد</li><li>دعم للأسئلة التقنية</li></ul>`;
  const h3 = `<h2 class="text-xl font-bold mt-8 mb-3" dir="rtl">نصائح سريعة</h2>`;
  const p3 = `<p class="my-3" dir="rtl">ثبّت على Wi‑Fi، وأوقف التجوال على الخط الأساسي عند استخدام eSIM للبيانات، وقلل التحديثات الثقيلة في الخلفية ليبقى المزيد من الحصة للخرائط والرسائل.</p>`;
  return `${p1}\n${h1}\n${p2}\n${h2}\n${ul}\n${h3}\n${p3}\n${ctaAr(dest, countryAr)}\n${ctaAr(dest, countryAr)}`;
}

export function buildSeoAr(titleAr, plainExcerpt) {
  const excerpt = plainExcerpt.slice(0, 220);
  const metaDesc = plainExcerpt.slice(0, 155);
  return {
    excerptAr: excerpt,
    metaTitleAr: titleAr.slice(0, 60),
    metaDescAr: metaDesc,
    ogTitleAr: titleAr.slice(0, 60),
    ogDescAr: excerpt.slice(0, 200),
    focusKeywordAr: titleAr.slice(0, 80),
  };
}
