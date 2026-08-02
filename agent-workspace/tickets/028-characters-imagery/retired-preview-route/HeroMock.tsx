import { Zap, Flame, Shield, Headphones, Search } from 'lucide-react';

/**
 * Ticket 028, phase 2 — a faithful copy of the hero's structure with the phone replaced by the
 * pair and an offer card. Static on purpose: no data, no cart, no translations. It exists to test
 * composition and legibility at real widths, then gets deleted with the rest of this route.
 *
 * Dimensions mirror `Hero.tsx`: max-w-6xl container, px-4, two columns with gap-12, so each column
 * is about 536 px at full width. That number is the whole reason the hero art is cropped waist-up.
 */

type Props = {
  width: number;
  dir?: 'rtl' | 'ltr';
  title: string;
  subtitle: string;
  searchLabel: string;
};

function OfferCard() {
  return (
    <div className="w-[320px] rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
        <Flame className="h-3 w-3" aria-hidden="true" />
        הדיל של היום
      </div>
      <div className="flex items-center gap-3">
        <img
          src="https://flagcdn.com/w40/jp.png"
          alt=""
          className="h-6 w-9 rounded-sm object-cover shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">יפן</p>
          <p className="text-xs text-muted-foreground">5GB &middot; 7 ימים</p>
        </div>
        <div className="text-end">
          <p className="text-xl font-extrabold text-primary">$9.90</p>
          <p className="text-xs text-gray-400 line-through">$14.90</p>
        </div>
      </div>
      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
      >
        הוספה לסל
      </button>
    </div>
  );
}

export function HeroMock({ width, dir = 'rtl', title, subtitle, searchLabel }: Props) {
  return (
    <div dir={dir} style={{ width }} className="shrink-0">
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="relative container mx-auto max-w-6xl px-4 py-16 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  הפעלה מיידית
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-700">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  יפן 5GB ב-$9.90
                  <span className="text-orange-400 line-through">$14.90</span>
                </span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                {title}
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {subtitle}
              </p>

              <div className="mt-8 flex max-w-md items-center gap-2 rounded-xl border border-border bg-white p-2 shadow-sm">
                <Search className="ms-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1 text-sm text-muted-foreground">לאן טסים?</span>
                <span className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                  {searchLabel}
                </span>
              </div>

              <div className="mt-4 flex max-w-lg flex-wrap items-center gap-2">
                {['יפן', 'ארה"ב', 'איטליה', 'תאילנד'].map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground shadow-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  התקנה בדקות
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  תשלום מאובטח
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Headphones className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  תמיכה 24/7
                </span>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative mx-auto h-[470px] w-full max-w-[536px]">
                <picture>
                  <source srcSet="/characters/pair-hero.avif" type="image/avif" />
                  <img
                    src="/characters/pair-hero.webp"
                    alt=""
                    className="absolute bottom-[52px] left-1/2 h-[418px] w-auto -translate-x-1/2 object-contain"
                  />
                </picture>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                  <OfferCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
