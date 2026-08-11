/**
 * Ticket 034 — checks the autocomplete matcher against the live catalogue.
 *
 * The matcher itself lives in `src/components/forms/SearchDestination.tsx`; this mirrors it so the
 * acceptance queries can be verified against the real destination list without a browser. If the two
 * ever drift, this file is the copy that is wrong.
 *
 * Usage: node agent-workspace/scripts/034-search-match-check.mjs [baseUrl]
 */

const BASE = process.argv[2] || 'http://localhost:3001';

const COUNTRY_ALIASES = {
  US: ['ארהב', 'אמריקה', 'ארצות הברית', 'usa', 'america', 'united states', 'أمريكا'],
  GB: ['אנגליה', 'בריטניה', 'uk', 'england', 'britain', 'إنجلترا', 'بريطانيا'],
  AE: ['דובאי', 'איחוד האמירויות', 'dubai', 'emirates', 'دبي'],
  GR: ['יוון', 'greece', 'اليونان'],
  NL: ['הולנד', 'holland', 'هولندا'],
  CZ: ['צכיה', 'פראג', 'czech', 'prague'],
  KR: ['קוריאה', 'korea', 'كوريا'],
  CN: ['סין', 'china', 'الصين'],
};

const REGION_ALIASES = {
  EU: ['אירופה', 'اوروبا', 'أوروبا'],
  AS: ['אסיה', 'آسيا'],
  AF: ['אפריקה', 'افريقيا', 'أفريقيا'],
  ME: ['המזרח התיכון', 'מזרח תיכון', 'الشرق الأوسط'],
  NA: ['אמריקה הצפונית', 'צפון אמריקה'],
  SA: ['אמריקה הדרומית', 'דרום אמריקה', 'أمريكا الجنوبية'],
  CB: ['קריביים', 'הקריביים', 'الكاريبي'],
  GL: ['גלובלי', 'עולמי', 'כל העולם', 'global', 'عالمي'],
  CN: ['סין', 'china', 'الصين'],
  USCA: ['ארהב וקנדה', 'אמריקה וקנדה', 'אמריקה'],
  AUNZ: ['אוסטרליה', 'ניו זילנד', 'australia'],
  SAAEQAKWOMBH: ['מדינות המפרץ', 'המפרץ', 'الخليج'],
};

const aliasesFor = (code) =>
  code.length <= 2 ? COUNTRY_ALIASES[code] : REGION_ALIASES[code] ?? REGION_ALIASES[code.split('-')[0]];

const normalize = (v) => v.toLowerCase().replace(/["'׳״`.\-\s]/g, '');

function localizedName(name, code, locale) {
  if (locale === 'en' || code.length > 2) return name;
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) || name;
  } catch {
    return name;
  }
}

const res = await fetch(`${BASE}/api/packages`);
const { destinations } = await res.json();
const options = destinations.map((d) => ({
  englishName: d.name,
  locationCode: d.locationCode,
  name: localizedName(d.name, d.locationCode, 'he'),
}));

function match(query) {
  const q = normalize(query);
  if (!q) return [];
  return options.filter((d) => {
    if (normalize(d.name).includes(q)) return true;
    if (normalize(d.englishName).includes(q)) return true;
    if (normalize(d.locationCode).includes(q)) return true;
    const aliases = aliasesFor(d.locationCode);
    return aliases ? aliases.some((a) => normalize(a).includes(q)) : false;
  });
}

const queries = [
  'japan', 'usa', 'italy', 'יפן', 'ארה"ב', 'ארהב', 'אמריקה', 'אירופה', 'אסיה',
  'תאילנד', 'דובאי', 'אנגליה', 'המפרץ', 'jp', 'qqqqq',
];

let failures = 0;
for (const q of queries) {
  const hits = match(q).slice(0, 7);
  const expectEmpty = q === 'qqqqq';
  const ok = expectEmpty ? hits.length === 0 : hits.length > 0;
  if (!ok) failures += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${q.padEnd(12)} ${hits.length} hit(s): ` +
      hits.map((h) => `${h.name} [${h.locationCode}]`).join(', ')
  );
}
console.log(failures === 0 ? '\nall queries behave as specified' : `\n${failures} failing quer(ies)`);
process.exitCode = failures === 0 ? 0 : 1;
