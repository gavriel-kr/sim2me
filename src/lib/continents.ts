/** Map ISO country codes to continents for filtering */
const CONTINENT_MAP: Record<string, string> = {
  // Europe
  AD:'Europe',AL:'Europe',AT:'Europe',AX:'Europe',BA:'Europe',BE:'Europe',BG:'Europe',
  BY:'Europe',CH:'Europe',CY:'Europe',CZ:'Europe',DE:'Europe',DK:'Europe',EE:'Europe',
  ES:'Europe',FI:'Europe',FO:'Europe',FR:'Europe',GB:'Europe',GG:'Europe',GI:'Europe',
  GR:'Europe',HR:'Europe',HU:'Europe',IE:'Europe',IM:'Europe',IS:'Europe',IT:'Europe',
  JE:'Europe',LI:'Europe',LT:'Europe',LU:'Europe',LV:'Europe',MC:'Europe',MD:'Europe',
  ME:'Europe',MK:'Europe',MT:'Europe',NL:'Europe',NO:'Europe',PL:'Europe',PT:'Europe',
  RO:'Europe',RS:'Europe',SE:'Europe',SI:'Europe',SK:'Europe',SM:'Europe',UA:'Europe',
  VA:'Europe',XK:'Europe',
  // Asia
  AE:'Asia',AF:'Asia',AM:'Asia',AZ:'Asia',BD:'Asia',BH:'Asia',BN:'Asia',BT:'Asia',
  CN:'Asia',GE:'Asia',HK:'Asia',ID:'Asia',IL:'Asia',IN:'Asia',IQ:'Asia',IR:'Asia',
  JO:'Asia',JP:'Asia',KG:'Asia',KH:'Asia',KR:'Asia',KW:'Asia',KZ:'Asia',LA:'Asia',
  LB:'Asia',LK:'Asia',MM:'Asia',MN:'Asia',MO:'Asia',MV:'Asia',MY:'Asia',NP:'Asia',
  OM:'Asia',PH:'Asia',PK:'Asia',PS:'Asia',QA:'Asia',SA:'Asia',SG:'Asia',SY:'Asia',
  TH:'Asia',TJ:'Asia',TL:'Asia',TM:'Asia',TR:'Asia',TW:'Asia',UZ:'Asia',VN:'Asia',
  YE:'Asia',
  // North America
  AG:'N. America',AI:'N. America',AW:'N. America',BB:'N. America',BM:'N. America',
  BS:'N. America',BZ:'N. America',CA:'N. America',CR:'N. America',CU:'N. America',
  CW:'N. America',DM:'N. America',DO:'N. America',GD:'N. America',GP:'N. America',
  GT:'N. America',HN:'N. America',HT:'N. America',JM:'N. America',KN:'N. America',
  KY:'N. America',LC:'N. America',MF:'N. America',MQ:'N. America',MS:'N. America',
  MX:'N. America',NI:'N. America',PA:'N. America',PR:'N. America',SV:'N. America',
  SX:'N. America',TC:'N. America',TT:'N. America',US:'N. America',VC:'N. America',
  VG:'N. America',VI:'N. America',
  // South America
  AR:'S. America',BO:'S. America',BR:'S. America',CL:'S. America',CO:'S. America',
  EC:'S. America',FK:'S. America',GF:'S. America',GY:'S. America',PE:'S. America',
  PY:'S. America',SR:'S. America',UY:'S. America',VE:'S. America',
  // Africa
  AO:'Africa',BF:'Africa',BI:'Africa',BJ:'Africa',BW:'Africa',CD:'Africa',CF:'Africa',
  CG:'Africa',CI:'Africa',CM:'Africa',CV:'Africa',DJ:'Africa',DZ:'Africa',EG:'Africa',
  ER:'Africa',ET:'Africa',GA:'Africa',GH:'Africa',GM:'Africa',GN:'Africa',GW:'Africa',
  KE:'Africa',LR:'Africa',LS:'Africa',LY:'Africa',MA:'Africa',MG:'Africa',ML:'Africa',
  MR:'Africa',MU:'Africa',MW:'Africa',MZ:'Africa',NA:'Africa',NE:'Africa',NG:'Africa',
  RE:'Africa',RW:'Africa',SC:'Africa',SD:'Africa',SL:'Africa',SN:'Africa',SO:'Africa',
  SS:'Africa',ST:'Africa',SZ:'Africa',TD:'Africa',TG:'Africa',TN:'Africa',TZ:'Africa',
  UG:'Africa',ZA:'Africa',ZM:'Africa',ZW:'Africa',
  // Oceania
  AU:'Oceania',FJ:'Oceania',GU:'Oceania',NZ:'Oceania',PG:'Oceania',WS:'Oceania',
  TO:'Oceania',VU:'Oceania',NC:'Oceania',PF:'Oceania',
  // Russia/CIS
  RU:'Europe',
};

export function getContinent(locationCode: string): string {
  if (locationCode.length > 2) {
    // Regional codes
    if (locationCode.startsWith('EU')) return 'Europe';
    // Check specific multi-country codes first
    if (locationCode.startsWith('SAAE') || locationCode.startsWith('ME')) return 'Asia'; // Gulf/Middle East
    if (locationCode.startsWith('AS') || locationCode.startsWith('SG') || locationCode.startsWith('CN') || locationCode.startsWith('JP') || locationCode.startsWith('KR')) return 'Asia';
    if (locationCode.startsWith('NA') || locationCode.startsWith('US') || locationCode.startsWith('CB')) return 'N. America';
    if (locationCode.startsWith('SA')) return 'S. America';
    if (locationCode.startsWith('AF')) return 'Africa';
    if (locationCode.startsWith('AU') || locationCode.startsWith('NZ')) return 'Oceania';
    if (locationCode.startsWith('GL')) return 'Global';
    return 'Global';
  }
  return CONTINENT_MAP[locationCode] || 'Other';
}
