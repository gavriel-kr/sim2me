/**
 * Translates package/plan names to Hebrew/Arabic.
 * Same approach as translateCountryName: Intl.DisplayNames + REGION_TRANSLATIONS.
 */

const REGION_TRANSLATIONS: Record<string, Record<string, string>> = {
  he: {
    'Africa': 'אפריקה', 'Europe': 'אירופה', 'Asia': 'אסיה',
    'North America': 'צפון אמריקה', 'South America': 'דרום אמריקה',
    'North Africa': 'צפון אפריקה',
    'Oceania': 'אוקיאניה', 'Middle East': 'המזרח התיכון', 'Caribbean': 'הקריביים',
    'Global': 'עולמי', 'N. America': 'צפון אמריקה', 'S. America': 'דרום אמריקה',
  },
  ar: {
    'Africa': 'أفريقيا', 'Europe': 'أوروبا', 'Asia': 'آسيا',
    'North America': 'أمريكا الشمالية', 'South America': 'أمريكا الجنوبية',
    'North Africa': 'شمال أفريقيا',
    'Oceania': 'أوقيانوسيا', 'Middle East': 'الشرق الأوسط', 'Caribbean': 'الكاريبي',
    'Global': 'عالمي', 'N. America': 'أمريكا الشمالية', 'S. America': 'أمريكا الجنوبية',
  },
};

/** Country names that appear in multi-country package names (e.g. "Europe & Morocco") */
const COUNTRY_ISO: Record<string, string> = {
  Morocco: 'MA', Spain: 'ES', Tunisia: 'TN', Turkey: 'TR', Israel: 'IL',
  Egypt: 'EG', UAE: 'AE', 'Hong Kong': 'HK', Singapore: 'SG', Thailand: 'TH',
  Malaysia: 'MY', Japan: 'JP', Korea: 'KR', China: 'CN', Australia: 'AU',
  'New Zealand': 'NZ', Canada: 'CA', Mexico: 'MX', Brazil: 'BR',
};

const PLAN_TERMS: Record<string, Record<string, string>> = {
  he: { 'Days': ' ימים', 'Day': 'ליום', 'areas': 'אזורים', 'countries': 'מדינות' },
  ar: { 'Days': ' أيام', 'Day': 'لليوم', 'areas': 'مناطق', 'countries': 'دول' },
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
  // Replace Global+digits (Global139, Global120) - no word boundary between Global and number
  const regionTerms = REGION_TRANSLATIONS[locale];
  if (regionTerms?.Global) {
    out = out.replace(/\bGlobal(\d+)\b/g, (_, num) => regionTerms.Global + num);
  }
  // Replace region names (longest first: North Africa before Africa)
  // Global is included - Global+digits above only handles "Global139"/"Global120"; "Global (120+...)" needs this
  if (regionTerms) {
    const sorted = Object.entries(regionTerms).sort((a, b) => b[0].length - a[0].length);
    for (const [en, local] of sorted) {
      out = out.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), local);
    }
  }
  // Replace country names in "X & Country" format (Morocco, Spain, etc.)
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    for (const [enName, isoCode] of Object.entries(COUNTRY_ISO)) {
      const translated = displayNames.of(isoCode);
      if (translated && translated !== enName) {
        out = out.replace(new RegExp(`\\b${enName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), translated);
      }
    }
  } catch { /* fallback */ }
  return out;
}
