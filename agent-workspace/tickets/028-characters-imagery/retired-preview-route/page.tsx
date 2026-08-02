import type { Metadata } from 'next';
import { HeroMock } from './HeroMock';

export const metadata: Metadata = {
  title: 'Character preview',
  robots: { index: false, follow: false },
};

/**
 * Ticket 028, phase 1 — local-only cutout QA. Not linked from anywhere, noindex.
 * Delete this route once the characters are wired into real pages.
 */

const CHARACTERS = [
  { id: 'simi', name: 'סימי', src: '/characters/simi-generic', note: 'מג\'נטה — הרווח בין הרגליים נקי' },
  { id: 'sima', name: 'סימה', src: '/characters/sima-generic', note: 'מג\'נטה — נקי' },
] as const;

const COPY = {
  he: {
    title: 'הישארו מחוברים בכל העולם. בלי דמי נדידה.',
    subtitle: 'נוחתים מחוברים — בלי להחליף סים ובלי לחפש WiFi בשדה התעופה.',
    searchLabel: 'מצאו eSIM',
    dir: 'rtl' as const,
  },
  en: {
    title: 'Stay connected worldwide. No roaming fees.',
    subtitle: 'Land connected — no SIM swapping, no hunting for airport Wi-Fi.',
    searchLabel: 'Find your eSIM',
    dir: 'ltr' as const,
  },
  ar: {
    title: 'ابقوا متصلين في كل العالم. بدون رسوم تجوال.',
    subtitle: 'اهبط متصلاً — دون تبديل شريحة ودون البحث عن واي فاي في المطار.',
    searchLabel: 'اعثر على eSIM',
    dir: 'rtl' as const,
  },
};

function Scroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <div className="flex">{children}</div>
    </div>
  );
}

const BACKDROPS = [
  { id: 'white', label: 'לבן', className: 'bg-white' },
  { id: 'page', label: 'רקע האתר', className: 'bg-[hsl(220_14%_96%)]' },
  { id: 'navy', label: 'נייבי כהה', className: 'bg-[#0b1220]' },
  { id: 'green', label: 'ירוק המותג', className: 'bg-[hsl(160_84%_39%)]' },
] as const;

function Cutout({ src, alt, height, flip }: { src: string; alt: string; height: number; flip?: boolean }) {
  return (
    <picture>
      <source srcSet={`${src}.avif`} type="image/avif" />
      <img
        src={`${src}.webp`}
        alt={alt}
        style={{ height }}
        className={`w-auto object-contain ${flip ? '-scale-x-100' : ''}`}
      />
    </picture>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function CharacterPreviewPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[hsl(214_20%_97%)] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-14">
        <header>
          <h1 className="text-2xl font-extrabold text-gray-900">טיקט 028 — בדיקת גזירה</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            הרקע הכהה הוא הבדיקה האמיתית — שאריות רקע סביב שיער, ובתוך רווחים סגורים כמו זה שבין
            הרגליים, מתגלות רק עליו. כל הגזירים כאן מיוצרים במתכון המג'נטה.
          </p>
        </header>

        <Section
          title="ההירו — ארבעה רוחבי מסך"
          subtitle="הגלובוס ירד מההיקף. הבדיקה שנשארה: שכרטיס ההצעה יושב על קו המותן ומסתיר את קצה החיתוך בכל רוחב, ושהפנים נשארות גדולות מספיק ב-1024."
        >
          <div className="space-y-4">
            {[1024, 1280, 1440, 1920].map((w) => (
              <div key={w}>
                <p className="mb-2 text-sm font-semibold text-gray-800">{w}px</p>
                <Scroller>
                  <HeroMock width={w} {...COPY.he} />
                </Scroller>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="שלוש השפות"
          subtitle="אנגלית משקפת את כל הפריסה, כך שהצמד והכרטיס עוברים לצד הנגדי."
        >
          <div className="space-y-4">
            {(['he', 'en', 'ar'] as const).map((l) => (
              <div key={l}>
                <p className="mb-2 text-sm font-semibold text-gray-800">{l}</p>
                <Scroller>
                  <HeroMock width={1280} {...COPY[l]} />
                </Scroller>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="ביט 1 — הצמד מקבל את הפנים"
          subtitle="הדוגמה החדשה. שניהם מסתכלים אליך, סימה פותחת כף יד לעבר המקום שבו יישב כרטיס ההצעה. חתוך מהמותן למעלה, כי בעמודה של ההירו פנים בגובה 40 פיקסל לא מוסרות שום חום."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {BACKDROPS.map((bd) => (
              <div key={bd.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className={`flex h-[420px] items-end justify-center ${bd.className}`}>
                  <Cutout src="/characters/pair-hero" alt="סימי וסימה" height={400} />
                </div>
                <p className="px-3 py-2 text-center text-xs font-semibold text-gray-700">{bd.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="mb-4 text-sm text-gray-600">
              בגודל אמיתי בהירו, רגיל ומשוקף ל-RTL. השטח הריק מלפנים ומתחת הוא מקומו של כרטיס ההצעה.
            </p>
            <div className="flex flex-wrap items-end justify-center gap-10 rounded-xl bg-[hsl(220_14%_96%)] p-6">
              <Cutout src="/characters/pair-hero" alt="סימי וסימה" height={340} />
              <Cutout src="/characters/pair-hero" alt="סימי וסימה משוקפים" height={340} flip />
            </div>
          </div>
        </Section>

        <Section
          title="ביטים 2 ו-3 — המשך הסיפור בעמוד הבית"
          subtitle="אותם בגדים בדיוק כמו בהירו, וזה לא קוסמטיקה: אם סימה מחליפה קרדיגן בין סקשן לסקשן, העמוד מפסיק להיות רגע אחד ונהיה אוסף תמונות סטוק. סימה מגיבה למבצעים, סימי חותם ליד ההרשמה."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              { src: '/characters/sima-reacting-v1', name: 'ביט 2 — סימה מול המבצעים החמים', note: 'מפנפת לעצמה — "וואו, זה חם". מסתכלת הצידה ולמטה, לכיוון שורת המבצעים' },
              { src: '/characters/simi-closing-v1', name: 'ביט 3 — סימי בקריאה לפעולה', note: 'ישר למצלמה, אגודל למעלה. רגוע ומרגיע — כאן לא צריך התלהבות, צריך ביטחון' },
            ].map((b) => (
              <div key={b.src} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex h-[440px] items-end justify-center gap-6 rounded-xl bg-[hsl(220_14%_96%)]">
                  <Cutout src={b.src} alt={b.name} height={410} />
                  <Cutout src={b.src} alt={`${b.name} משוקף`} height={410} flip />
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-gray-800">{b.name}</p>
                <p className="text-center text-xs text-gray-500">{b.note}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="mb-4 text-sm text-gray-600">
              שלושת הביטים זה ליד זה, בגובה זהה. כאן בודקים המשכיות: אותה תאורה, אותו גובה, אותם בגדים.
            </p>
            <div className="flex flex-wrap items-end justify-center gap-8 rounded-xl bg-[hsl(220_14%_96%)] p-6">
              <Cutout src="/characters/pair-hero" alt="ביט 1" height={300} />
              <Cutout src="/characters/sima-reacting-v1" alt="ביט 2" height={300} />
              <Cutout src="/characters/simi-closing-v1" alt="ביט 3" height={300} />
            </div>
          </div>
        </Section>

        <Section
          title="הדמויות לבד — על ארבעה רקעים"
          subtitle="אותה תמונה בדיוק. חפש הילה בהירה סביב השיער בעמודת הנייבי."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BACKDROPS.map((bd) => (
              <div key={bd.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className={`flex h-[420px] items-end justify-center gap-2 ${bd.className}`}>
                  {CHARACTERS.map((c) => (
                    <Cutout key={c.id} src={c.src} alt={c.name} height={400} />
                  ))}
                </div>
                <p className="px-3 py-2 text-center text-xs font-semibold text-gray-700">{bd.label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="בגדלים אמיתיים"
          subtitle="מימין לשמאל: באנר יעד, ליווי סקשן, אזכור קטן. בגודל האמיתי הפגמים הזעירים נעלמים."
        >
          <div className="flex flex-wrap items-end gap-8 rounded-2xl border border-gray-200 bg-white p-6">
            {[520, 380, 260, 160].map((h) => (
              <div key={h} className="flex items-end gap-3">
                {CHARACTERS.map((c) => (
                  <Cutout key={c.id} src={c.src} alt={c.name} height={h} />
                ))}
                <span className="pb-1 text-xs text-gray-500">{h}px</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="היפוך RTL"
          subtitle="כל גזיר מוצג רגיל ואז משוקף. השיקוף חייב להיות בלתי מורגש — זו הסיבה שאסור טקסט או סמל א-סימטרי על הבגד."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {CHARACTERS.map((c) => (
              <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex h-[360px] items-end justify-center gap-6 rounded-xl bg-[hsl(220_14%_96%)]">
                  <Cutout src={c.src} alt={c.name} height={330} />
                  <Cutout src={c.src} alt={`${c.name} משוקף`} height={330} flip />
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-gray-800">{c.name}</p>
                <p className="text-center text-xs text-gray-500">{c.note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="השניים יחד"
          subtitle="הבדיקה שהכי קל לפספס: תאורה, גובה וגוון עור חייבים להתאים כששניהם באותה סצנה."
        >
          <div className="flex h-[520px] items-end justify-center gap-4 rounded-2xl border border-gray-200 bg-white">
            {CHARACTERS.map((c) => (
              <Cutout key={c.id} src={c.src} alt={c.name} height={480} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
