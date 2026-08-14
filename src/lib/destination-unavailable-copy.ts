export type UiLang = 'he' | 'en' | 'ar' | 'hi';

export function toUiLang(locale: string): UiLang {
  if (locale === 'he') return 'he';
  if (locale === 'ar') return 'ar';
  if (locale === 'hi') return 'hi';
  return 'en';
}

export const EMPTY_STATE_COPY: Record<
  UiLang,
  { title: string; body: string; button: (n: number) => string; live: (n: number) => string }
> = {
  he: {
    title: 'אין כרגע חבילות ליעד הזה',
    body: 'אנחנו מוסיפים יעדים וחבילות כל הזמן. ייתכן שבקרוב יופיע גם כאן, בינתיים אפשר לעבור לרשימת כל היעדים הזמינים.',
    button: (n) => `מעבר לכל היעדים בעוד ${n} שניות`,
    live: (n) => `מעבר לכל היעדים בעוד ${n} שניות`,
  },
  en: {
    title: 'No packages for this destination yet',
    body: "We're adding destinations and plans all the time, this one may appear soon. Browse all available destinations below.",
    button: (n) => `All destinations in ${n}s, tap to go now`,
    live: (n) => `Redirecting to all destinations in ${n} seconds`,
  },
  ar: {
    title: 'لا توجد باقات لهذا الوجه حالياً',
    body: 'نضيف وجهات وباقات باستمرار، قد تتوفر قريباً. يمكنك تصفح جميع الوجهات المتاحة أدناه.',
    button: (n) => `الانتقال إلى كل الوجهات خلال ${n} ثانية`,
    live: (n) => `سيتم الانتقال إلى قائمة الوجهات خلال ${n} ثانية`,
  },
  hi: {
    title: 'इस गंतव्य के लिए अभी कोई प्लान नहीं है',
    body: 'हम लगातार नए गंतव्य और प्लान जोड़ते रहते हैं, यह भी जल्द उपलब्ध हो सकता है। तब तक नीचे सभी उपलब्ध गंतव्य देखें।',
    button: (n) => `${n} सेकंड में सभी गंतव्य, अभी जाने के लिए टैप करें`,
    live: (n) => `${n} सेकंड में सभी गंतव्य पर भेजा जा रहा है`,
  },
};

export const ERROR_STATE_COPY: Record<
  UiLang,
  { title: string; body: string; button: (n: number) => string; live: (n: number) => string }
> = {
  he: {
    title: 'לא הצלחנו להציג את העמוד',
    body: 'אירעה תקלה בטעינה. מעבר לרשימת היעדים בעוד רגע, או לחצו למטה למעבר מיידי.',
    button: (n) => `מעבר לכל היעדים בעוד ${n} שניות`,
    live: (n) => `מעבר לכל היעדים בעוד ${n} שניות`,
  },
  en: {
    title: "We couldn't load this page",
    body: "Something went wrong while loading. We'll open all destinations in a moment, or tap below to go now.",
    button: (n) => `All destinations in ${n}s, tap to go now`,
    live: (n) => `Redirecting to all destinations in ${n} seconds`,
  },
  ar: {
    title: 'تعذر عرض هذه الصفحة',
    body: 'حدث خطأ أثناء التحميل. سيتم فتح قائمة الوجهات خلال لحظات، أو اضغط للانتقال فوراً.',
    button: (n) => `الانتقال إلى كل الوجهات خلال ${n} ثانية`,
    live: (n) => `سيتم الانتقال إلى قائمة الوجهات خلال ${n} ثانية`,
  },
  hi: {
    title: 'हम यह पेज नहीं दिखा सके',
    body: 'लोड करते समय कुछ गड़बड़ हो गई। कुछ ही पल में सभी गंतव्य खुल जाएँगे, या अभी जाने के लिए नीचे टैप करें।',
    button: (n) => `${n} सेकंड में सभी गंतव्य, अभी जाने के लिए टैप करें`,
    live: (n) => `${n} सेकंड में सभी गंतव्य पर भेजा जा रहा है`,
  },
};

/** 404 page: body + countdown to home (no title field; h1 is "404" in page). */
export const NOT_FOUND_COPY: Record<
  UiLang,
  { body: string; button: (n: number) => string; live: (n: number) => string }
> = {
  he: {
    body: 'נראה שהגעת לדף שלא קיים אצלנו, לא נורא, בעוד רגע נעבור לדף הבית.',
    button: (n) => `מעבר לדף הבית בעוד ${n} שניות`,
    live: (n) => `מעבר לדף הבית בעוד ${n} שניות`,
  },
  en: {
    body: "We can't find this page, the link may be old or mistyped. We'll take you home in just a moment.",
    button: (n) => `Home in ${n}s, tap to go now`,
    live: (n) => `Redirecting to home in ${n} seconds`,
  },
  ar: {
    body: 'يبدو أن هذه الصفحة غير متوفرة، لا بأس، سننقلك إلى الصفحة الرئيسية خلال لحظات.',
    button: (n) => `الصفحة الرئيسية خلال ${n} ثانية`,
    live: (n) => `سيتم الانتقال إلى الصفحة الرئيسية خلال ${n} ثانية`,
  },
  hi: {
    body: 'यह पेज हमें नहीं मिला, लिंक पुराना या गलत हो सकता है। कुछ ही पल में हम आपको होम पेज पर ले जाएँगे।',
    button: (n) => `${n} सेकंड में होम, अभी जाने के लिए टैप करें`,
    live: (n) => `${n} सेकंड में होम पेज पर भेजा जा रहा है`,
  },
};

export const METADATA_TITLE_EMPTY: Record<UiLang, string> = {
  he: 'אין חבילות ליעד זה',
  en: 'No packages for this destination',
  ar: 'لا توجد باقات لهذا الوجه',
  hi: 'इस गंतव्य के लिए कोई प्लान नहीं',
};

export const METADATA_TITLE_ERROR: Record<UiLang, string> = {
  he: 'לא נטען',
  en: 'Page unavailable',
  ar: 'تعذر تحميل الصفحة',
  hi: 'पेज उपलब्ध नहीं',
};
