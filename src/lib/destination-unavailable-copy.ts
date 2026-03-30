export type UiLang = 'he' | 'en' | 'ar';

export function toUiLang(locale: string): UiLang {
  if (locale === 'he') return 'he';
  if (locale === 'ar') return 'ar';
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
};

export const METADATA_TITLE_EMPTY: Record<UiLang, string> = {
  he: 'אין חבילות ליעד זה',
  en: 'No packages for this destination',
  ar: 'لا توجد باقات لهذا الوجه',
};

export const METADATA_TITLE_ERROR: Record<UiLang, string> = {
  he: 'לא נטען',
  en: 'Page unavailable',
  ar: 'تعذر تحميل الصفحة',
};
