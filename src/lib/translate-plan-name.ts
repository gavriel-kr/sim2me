/**
 * Translates package/plan names to Hebrew/Arabic.
 * Same approach as translateCountryName: Intl.DisplayNames + REGION_TRANSLATIONS.
 */

const REGION_TRANSLATIONS: Record<string, Record<string, string>> = {
  he: {
    'Africa': 'אפריקה', 'Europe': 'אירופה', 'Asia': 'אסיה',
    'North America': 'צפון אמריקה', 'South America': 'דרום אמריקה',
    'Oceania': 'אוקיאניה', 'Middle East': 'המזרח התיכון', 'Caribbean': 'הקריביים',
    'Global': 'עולמי', 'N. America': 'צפון אמריקה', 'S. America': 'דרום אמריקה',
  },
  ar: {
    'Africa': 'أفريقيا', 'Europe': 'أوروبا', 'Asia': 'آسيا',
    'North America': 'أمريكا الشمالية', 'South America': 'أمريكا الجنوبية',
    'Oceania': 'أوقيانوسيا', 'Middle East': 'الشرق الأوسط', 'Caribbean': 'الكاريبي',
    'Global': 'عالمي', 'N. America': 'أمريكا الشمالية', 'S. America': 'أمريكا الجنوبية',
  },
};

const PLAN_TERMS: Record<string, Record<string, string>> = {
  he: { 'Days': 'ימים', 'Day': 'ליום', 'areas': 'אזורים', 'countries': 'מדינות' },
  ar: { 'Days': 'أيام', 'Day': 'لليوم', 'areas': 'مناطق', 'countries': 'دول' },
};

function translateCountryPart(name: string, isoCode: string, isRegional: boolean, locale: string): string {
  if (locale === 'en') return name;
  if (!isRegional && isoCode.length === 2) {
    try {
      const displayName = new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode.toUpperCase());
      if (displayName) return displayName;
    } catch { /* fallback */ }
  }
  if (isRegional) {
    const translations = REGION_TRANSLATIONS[locale];
    if (translations) {
      for (const [en, local] of Object.entries(translations)) {
        if (name.includes(en)) return name.replace(en, local);
      }
    }
  }
  return name;
}

export function translatePlanName(
  name: string,
  englishLocation: string,
  locationCode: string,
  isRegional: boolean,
  locale: string,
): string {
  if (locale === 'en') return name;
  let out = name;
  const translatedLocation = translateCountryPart(englishLocation, locationCode, isRegional, locale);
  if (translatedLocation !== englishLocation) {
    out = out.replace(englishLocation, translatedLocation);
  }
  const terms = PLAN_TERMS[locale];
  if (terms) {
    for (const [en, local] of Object.entries(terms)) {
      out = out.replace(new RegExp(en, 'gi'), local);
    }
  }
  // Replace any remaining region names (Europe, Global, etc.) that appear as standalone words
  const regionTerms = REGION_TRANSLATIONS[locale];
  if (regionTerms) {
    for (const [en, local] of Object.entries(regionTerms)) {
      out = out.replace(new RegExp(`\\b${en}\\b`, 'g'), local);
    }
  }
  return out;
}
