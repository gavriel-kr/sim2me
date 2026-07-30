/**
 * Long / non-template articles: Hebrew body (may be padded to match EN word ratio in apply-he-bulk).
 */
const SITE = 'https://www.sim2me.net';

export const SPECIAL_HE = {
  'global-esim-card': {
    titleHe: 'כרטיס eSIM גלובלי — בקשה אחת לכל היעדים במסלול',
    excerptPlain:
      'כרטיס eSIM גלובלי מספק חיבור דיגיטלי למספר יבשות ומדינות בבקשה אחת, עם הפעלה מהירה ב‑QR וללא כרטיס פיזי.',
    contentHe: `
<div class="quick-summary rounded-xl border border-emerald-100 bg-emerald-50 p-5 mb-8" dir="rtl">
  <h2 class="text-lg font-bold text-emerald-800 mt-0 mb-2">תקציר מהיר</h2>
  <ul class="text-sm text-emerald-900 space-y-1 mb-0">
    <li>✅ SIM דיגיטלי אחד, תקף במאות יעדים</li>
    <li>✅ מעבר אוטומטי לרשת המקומית הטובה בכל מדינה</li>
    <li>✅ אירופה, אסיה, אמריקה, המזרח התיכון — אזורים מרובים בבקשה אחת</li>
    <li>✅ הפעלה מיידית ב‑QR — בלי טיפול בכרטיס פיזי</li>
  </ul>
</div>
<h2 dir="rtl">למי מתאים כרטיס eSIM גלובלי?</h2>
<p class="my-3" dir="rtl">מטיילים לטווח ארוך, נוודים דיגיטליים, עסקים עם פגישות במספר מדינות, זוגות בירח דבש ומשפחות — <strong>כרטיס eSIM גלובלי</strong> מ‑Sim2Me מכסה יעדים באירופה, אסיה, המזרח התיכון, האמריקות ועוד, עם ניהול אחד מהטלפון.</p>
<h2 dir="rtl">איך מפעילים</h2>
<ol dir="rtl">
  <li>רוכשים ב‑Sim2Me</li>
  <li>מקבלים QR במייל</li>
  <li>סורקים בהגדרות ה‑eSIM בטלפון</li>
  <li>הקו מופעל לפי המדינה — לפי הבקשה שבחרתם</li>
</ol>
<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${SITE}/he/destinations" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">לרכישת eSIM — לחצו כאן</a></p><a href="${SITE}/he/destinations" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">לרכישת eSIM</a></div>
`.trim(),
  },

  'esim-japan-guide': {
    titleHe: 'eSIM ליפן 2025: בקשות, כיסוי והתקנה — מדריך Sim2Me',
    excerptPlain:
      'כל מה שצריך לדעת על eSIM ליפן: רשתות, השוואת עלויות, בחירת נפח וטיפים להפעלה לפני הטיסה.',
    contentHe: `
<div class="quick-summary rounded-xl border border-emerald-100 bg-emerald-50 p-5 mb-8" dir="rtl">
  <h2 class="text-lg font-bold text-emerald-800 mt-0 mb-2">תקציר מהיר</h2>
  <ul class="text-sm text-emerald-900 space-y-1 mb-0">
    <li>✅ יפן מציעה עשרות בקשות eSIM ב‑Sim2Me — גמישות רבה</li>
    <li>✅ 4G/5G מהירים ברוב הארץ, כולל אזורים מרוחקים</li>
    <li>✅ כיסוי טוב ברכבות שינקנסן ובכבישים מהירים (עם ירידות קצרות במנהרות)</li>
    <li>✅ בחירת נפח לפי משך הטיול ולפי יצירת תוכן / עבודה מרחוק</li>
  </ul>
</div>
<h2 dir="rtl">למה יפן יעד מצוין ל‑eSIM</h2>
<p class="my-3" dir="rtl">התשתית ביפן בין המובילות בעולם — NTT Docomo, SoftBank ו‑au מספקים 4G/5G מהירים ויציבים. ב‑Sim2Me תמצאו מגוון בקשות ליפן כדי להתאים מחיר, משך ונפח.</p>
<p class="my-3" dir="rtl">הכיסוי חזק לא רק בטוקיו ואוסקה אלא גם ביישובים הרריים רבים, באוקינאווה ובקווי רכבות — כמעט בכל מקום שמטיילים אליו בפועל.</p>
<a href="${SITE}/he/destinations/jp" class="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white my-4 hover:bg-emerald-700">לכל בקשות ה‑eSIM ליפן ←</a>
<h2 dir="rtl">השוואה: eSIM מול SIM לתיירים מול Pocket Wi‑Fi</h2>
<table class="w-full text-sm border-collapse mb-6" dir="rtl">
  <thead><tr class="bg-gray-100"><th class="p-3 border">אפשרות</th><th class="p-3 border">עלות (14 יום)</th><th class="p-3 border">התקנה</th><th class="p-3 border">הערות</th></tr></thead>
  <tbody>
    <tr><td class="p-3 border"><strong>eSIM (Sim2Me)</strong></td><td class="p-3 border">נמוכה–בינונית</td><td class="p-3 border">דקות, לפני הטיסה</td><td class="p-3 border">נתונים, Dual SIM</td></tr>
    <tr><td class="p-3 border">SIM תיירותי</td><td class="p-3 border">בינונית</td><td class="p-3 border">נמל תעופה / דואר</td><td class="p-3 border">נתונים בלבד</td></tr>
    <tr><td class="p-3 border">Pocket Wi‑Fi</td><td class="p-3 border">גבוהה</td><td class="p-3 border">דלפק</td><td class="p-3 border">מכשיר נפרד</td></tr>
    <tr><td class="p-3 border">רומינג מולדתי</td><td class="p-3 border">גבוהה מאוד</td><td class="p-3 border">אוטומטי</td><td class="p-3 border">יקר</td></tr>
  </tbody>
</table>
<h2 dir="rtl">כיסוי בערים ובפריפריה</h2>
<p class="my-3" dir="rtl"><strong>ערים גדולות:</strong> 5G/4G מצוין, גם ברכבת התחתית ובקניונים.</p>
<p class="my-3" dir="rtl"><strong>אזורים מרוחקים:</strong> 4G חזק ברוב היישובים; שבילי הליכה עמוקים בפארקים עלולים להיות חלשים יותר.</p>
<p class="my-3" dir="rtl"><strong>שינקנסן:</strong> בדרך כלל קליטה טובה; במנהרות ארוכות ייתכנו ניתוקים קצרים.</p>
<h2 dir="rtl">בחירת נפח</h2>
<p class="my-3" dir="rtl">שבוע בטוקיו בלבד: לרוב מספיקים 5–8GB למפות, רשתות חברתיות ושיחות וידאו קצרות. שבועיים בטיול משולב: 10–15GB. יוצרי תוכן ועבודה מרחוק: שקלו 20GB+ או בקשה רחבה יותר.</p>
<h2 dir="rtl">התקנה</h2>
<p class="my-3" dir="rtl">מומלץ להתקין ב‑Wi‑Fi לפני הנסיעה, לבחור את קו ה‑eSIM לנתונים סלולריים, ולכבות נתונים בנדרים על הקו הביתי. לאחר הנחיתה, המתינו לרישום לרשת — לעיתים דקה–שתיים.</p>
<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${SITE}/he/destinations/jp" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">קנו eSIM ליפן — לחצו כאן</a></p><a href="${SITE}/he/destinations/jp" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">קנו eSIM ליפן</a></div>
`.trim(),
  },

  'esim-australia-guide': {
    titleHe: 'eSIM לאוסטרליה: כיסוי, בקשות והמלצות לטיול ולעבודה',
    excerptPlain:
      'מדריך eSIM לאוסטרליה: רשתות, אזורי כיסוי, בחירת בקשה לפי משך השהייה והפעלה בטלפון.',
    contentHe: `
<h2 dir="rtl">למה eSIM לאוסטרליה</h2>
<p class="my-3" dir="rtl">אוסטרליה גדולה ומרווחת — מפארקים לאזורים עירוניים. חיבור נתונים יציב חוסך זמן בניווט, בביטוחי נסיעה ובתקשורת עם המשפחה. עם <strong>eSIM לאוסטרליה מ‑Sim2Me</strong> נשארים מחוברים בלי רומינג יקר מהמפעיל בבית.</p>
<h2 dir="rtl">רשתות וכיסוי</h2>
<p class="my-3" dir="rtl">בערים הגדולות — סידני, מלבורן, בריסביין, פרת׳ — כיסוי 4G/5G חזק. בכבישים ארוכים ובאזורים מרוחקים ייתכנו אזורים עם קליטה חלשה יותר; תכננו הורדת מפות מראש.</p>
<h2 dir="rtl">איך לבחור בקשה</h2>
<ul class="list-disc pr-6 my-3 space-y-1" dir="rtl">
  <li>טיול קצר: נפח בינוני למפות ולרשתות חברתיות</li>
  <li>שהייה של שבועיים+: נפח גבוה יותר אם אתם מעלים תוכן או עובדים מרחוק</li>
  <li>הפעלה לפני הטיסה על Wi‑Fi יציב</li>
</ul>
<h2 dir="rtl">טיפים מעשיים</h2>
<p class="my-3" dir="rtl">הגדירו את קו ה‑eSIM כקו נתונים ראשי, כבו רומינג על הקו הביתי, והפעילו חיסכון בנתונים באפליקציות שצורכות רקע. כך תמקסמו את המיכסה לכל מה שחשוב באמת.</p>
<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${SITE}/he/destinations/au" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">קנו eSIM לאוסטרליה — לחצו כאן</a></p><a href="${SITE}/he/destinations/au" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">קנו eSIM לאוסטרליה</a></div>
`.trim(),
  },

  'esim-for-iphone': {
    titleHe: 'eSIM לאייפון: התקנה, תאימות וטיפים — Sim2Me',
    excerptPlain:
      'איך מפעילים eSIM באייפון: דגמים נתמכים, סריקת QR, ניהול קווים כפולים והימנעות מרומינג מיותר.',
    contentHe: `
<h2 dir="rtl">תאימות אייפון ל‑eSIM</h2>
<p class="my-3" dir="rtl">מאז iPhone XS רוב הדגמים תומכים ב‑eSIM (לצד nano‑SIM או Dual eSIM בדגמים חדשים). ודאו שהמכשיר לא נעול למפעיל שלא מאפשר eSIM — אם האייפון נקנה רשמית ללא נעילה, בדרך כלל ניתן להוסיף פרופיל eSIM בקלות.</p>
<h2 dir="rtl">התקנה בקצרה</h2>
<ol dir="rtl">
  <li>הגדרות → סלולרי → הוספת תוכנית סלולרית</li>
  <li>סריקת QR או הזנת קוד שהתקבל במייל מ‑Sim2Me</li>
  <li>מתן שם לקו (למשל "Sim2Me נתונים")</li>
  <li>בחירת קו ברירת מחדל לנתונים סלולריים — את קו ה‑eSIM</li>
</ol>
<h2 dir="rtl">Dual SIM חכם</h2>
<p class="my-3" dir="rtl">אפשר להשאיר את הקו הביתי לשיחות ו‑SMS ולהשתמש ב‑eSIM של Sim2Me לנתונים בחו״ל. כבו "נתונים בנדרים" על הקו הביתי כדי שלא תחויבו ברומינג בטעות.</p>
<h2 dir="rtl">בעיות נפוצות</h2>
<ul class="list-disc pr-6 my-3 space-y-1" dir="rtl">
  <li>אין רשת אחרי התקנה: הפעלה מחדש, בדיקת "נתונים סלולריים" מופעלים לקו הנכון</li>
  <li>QR לא נסרק: ודאו תאורה טובה או הזינו ידנית את הקוד</li>
  <li>מחקתם פרופיל בטעות: ייתכן שתצטרכו QR חדש — פנו לתמיכה</li>
</ul>
<p class="my-3" dir="rtl">רשימת מכשירים מעודכנת וטיפים נוספים זמינים בעמוד <a href="${SITE}/compatible-devices" class="text-primary-600 underline">מכשירים תואמים</a>.</p>
<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${SITE}/he/destinations" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">לרכישת eSIM — לחצו כאן</a></p><a href="${SITE}/he/destinations" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">לרכישת eSIM</a></div>
`.trim(),
  },

  'esim-vs-physical-sim-vs-roaming': {
    titleHe: 'eSIM מול SIM פיזי מול רומינג: מה עדיף בחו״ל?',
    excerptPlain:
      'השוואה בין eSIM לנסיעות, SIM מקומי ורומינג מולדתי: עלות, נוחות, זמן התקנה והמלצה למטיילים.',
    contentHe: `
<div class="quick-summary rounded-xl border border-emerald-100 bg-emerald-50 p-5 mb-8" dir="rtl">
  <h2 class="text-lg font-bold text-emerald-800 mt-0 mb-2">תקציר מהיר</h2>
  <ul class="text-sm text-emerald-900 space-y-1 mb-0">
    <li>✅ eSIM נסיעות: איזון טוב של מחיר, נוחות וגמישות</li>
    <li>✅ SIM פיזי מקומי: זול לשהייה ארוכה, דורש ביקור בחנות</li>
    <li>✅ רומינג מולדתי: הכי נוח לעיתים, לעיתים הכי יקר</li>
    <li>✅ לרוב המטיילים: eSIM נסיעות (כמו Sim2Me)</li>
  </ul>
</div>
<h2 dir="rtl">שלוש אפשרויות שכל מטייל מכיר</h2>
<p class="my-3" dir="rtl">בכל טיסה לחו״ל עולה השאלה: איך מקבלים נתונים סלולריים בלי לשלם יותר מדי? ב‑2025 יש שלוש אפשרויות ריאליות: <strong>eSIM נסיעות</strong>, <strong>SIM מקומי פיזי</strong>, או <strong>רומינג מהמפעיל בבית</strong>. למטה השוואה ישרה.</p>
<h2 dir="rtl">טבלת השוואה</h2>
<table class="w-full text-sm border-collapse mb-6" dir="rtl">
  <thead><tr class="bg-gray-100"><th class="p-3 border">קריטריון</th><th class="p-3 border">eSIM נסיעות</th><th class="p-3 border">SIM פיזי מקומי</th><th class="p-3 border">רומינג</th></tr></thead>
  <tbody>
    <tr><td class="p-3 border font-medium">זמן התקנה</td><td class="p-3 border">דקות (אונליין)</td><td class="p-3 border">חצי שעה–שעה וחצי</td><td class="p-3 border">אוטומטי</td></tr>
    <tr><td class="p-3 border font-medium">עלות משוערת (7 ימים, ~5GB)</td><td class="p-3 border">נמוכה–בינונית</td><td class="p-3 border">בינונית</td><td class="p-3 border">גבוהה מאוד</td></tr>
    <tr><td class="p-3 border font-medium">שומרים על מספר בבית?</td><td class="p-3 border">כן</td><td class="p-3 border">לא תמיד</td><td class="p-3 border">כן</td></tr>
    <tr><td class="p-3 border font-medium">מספר מדינות בטיול אחד</td><td class="p-3 border">כן (בקשות אזוריות)</td><td class="p-3 border">בדרך כלל מדינה אחת</td><td class="p-3 border">כן, אבל יקר</td></tr>
    <tr><td class="p-3 border font-medium">טלפון לא נעול?</td><td class="p-3 border">נדרש</td><td class="p-3 border">נדרש</td><td class="p-3 border">לא תמיד</td></tr>
  </tbody>
</table>
<h2 dir="rtl">מתי לבחור במה</h2>
<h3 dir="rtl">eSIM נסיעות כש:</h3>
<ul dir="rtl"><li>טיול של ימים עד כמה שבועות</li><li>רוצים לשמור את הקו הביתי ל‑SMS</li><li>לא רוצים לחפש חנות בשדה</li><li>המכשיר תומך ב‑eSIM</li></ul>
<p class="my-3" dir="rtl"><a href="${SITE}/he/destinations" class="text-primary-600 underline">לעמוד היעדים שלנו ←</a></p>
<h3 dir="rtl">SIM פיזי מקומי כש:</h3>
<ul dir="rtl"><li>שהייה ארוכה מאוד במדינה אחת</li><li>חובה מספר מקומי</li><li>אין eSIM במכשיר</li></ul>
<h3 dir="rtl">רומינג כש:</h3>
<ul dir="rtl"><li>נסיעה קצרה מאוד ושימוש מזערי בנתונים</li><li>המפעיל מציע חבילה שווה במיוחד</li></ul>
<h2 dir="rtl">עלויות נסתרות ברומינג</h2>
<p class="my-3" dir="rtl">חבילות "יום בינלאומי" נראות סבירות, אבל לשבועיים זה מתרבה מהר — לעומת eSIM נסיעות שעולה לרוב פחות בהרבה לאותו נפח. גם חבילות "כולל נתונים" לעיתים מווסתות מהר לאחר מיכסה קטנה.</p>
<h2 dir="rtl">תאימות מכשירים</h2>
<p class="my-3" dir="rtl">נדרש מכשיר לא נעול עם תמיכה ב‑eSIM. רשימה מלאה: <a href="${SITE}/compatible-devices" class="text-primary-600 underline">מכשירים תואמים</a>. בקצרה: iPhone XS ומעלה, דגמי Galaxy ו‑Pixel רבים מדור 2019 ואילך.</p>
<h2 dir="rtl">שאלות נפוצות</h2>
<h3 dir="rtl">ש: אפשר לעבור בין eSIM ל‑SIM פיזי?</h3>
<p class="my-3" dir="rtl">ת: כן — בהגדרות הסלולר בוחרים איזה קו פעיל לנתונים.</p>
<h3 dir="rtl">ש: eSIM בטוח?</h3>
<p class="my-3" dir="rtl">ת: הפרופילים מורדים בחיבור מוצפן; תקן GSMA דומה ל‑SIM פיזי.</p>
<h3 dir="rtl">ש: איך לא לשלם רומינג בטעות?</h3>
<p class="my-3" dir="rtl">ת: כבו נתונים בנדרים על הקו הביתי כשמשתמשים ב‑eSIM לנתונים.</p>
<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${SITE}/he/destinations" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">לרכישת eSIM — לחצו כאן</a></p><a href="${SITE}/he/destinations" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">לרכישת eSIM</a></div>
`.trim(),
  },

  'how-does-esim-work': {
    titleHe: 'איך עובד eSIM? הסבר פשוט וברור',
    excerptPlain:
      'מה זה eSIM, איך מורידים פרופיל מפעיל, אבטחה, והבדלים מול SIM פיזי — כולל התקנה באייפון ואנדרואיד.',
    contentHe: `
<div class="quick-summary rounded-xl border border-emerald-100 bg-emerald-50 p-5 mb-8" dir="rtl">
  <h2 class="text-lg font-bold text-emerald-800 mt-0 mb-2">תקציר מהיר</h2>
  <ul class="text-sm text-emerald-900 space-y-1 mb-0">
    <li>✅ eSIM = SIM דיגיטלי שמוטמע בחומרת הטלפון</li>
    <li>✅ מופעל בהורדת "פרופיל" (QR או קישור)</li>
    <li>✅ אפשר לאחסן מספר פרופילים ולעבור ביניהם</li>
    <li>✅ תקן GSMA — רמת אבטחה דומה ל‑SIM פיזי</li>
  </ul>
</div>
<h2 dir="rtl">מה זה eSIM בפועל?</h2>
<p class="my-3" dir="rtl"><strong>eSIM</strong> (SIM משובץ) הוא רכיב שמותקן על לוח האם — לא ניתן להוציא אותו כמו nano‑SIM. היתרון: אפשר לתכנת מחדש ולאחסן כמה פרופילים של מפעילים שונים, ולעבור ביניהם בתוכנה.</p>
<h2 dir="rtl">תהליך ההפעלה</h2>
<ol dir="rtl">
  <li>רוכשים בקשה אצל ספק כמו Sim2Me</li>
  <li>הספק יוצר פרופיל על שרת מאובטח (SM‑DP+)</li>
  <li>מקבלים QR או קישור המפנה לפרופיל</li>
  <li>הטלפון מוריד את הפרופיל בחיבור מוצפן</li>
  <li>לאחר הפעלה — נרשמים לרשת המקומית כמו ב‑SIM רגיל</li>
</ol>
<h2 dir="rtl">השוואה טכנולוגית קצרה</h2>
<table class="w-full text-sm border-collapse mb-6" dir="rtl">
  <thead><tr class="bg-gray-100"><th class="p-3 border">מאפיין</th><th class="p-3 border">SIM פיזי</th><th class="p-3 border">eSIM</th></tr></thead>
  <tbody>
    <tr><td class="p-3 border">החלפת תוכנית</td><td class="p-3 border">החלפת כרטיס</td><td class="p-3 border">בהגדרות</td></tr>
    <tr><td class="p-3 border">מספר פרופילים</td><td class="p-3 border">אחד פיזי</td><td class="p-3 border">מספר דיגיטלי</td></tr>
    <tr><td class="p-3 border">הפעלה</td><td class="p-3 border">הכנסת כרטיס</td><td class="p-3 border">QR/קישור</td></tr>
  </tbody>
</table>
<h2 dir="rtl">אבטחה</h2>
<p class="my-3" dir="rtl">הפרופילים מורדים ב‑TLS; שבב ה‑eSIM כולל אזור מאובטח נפרד. הפרופיל קשור לחומרת המכשיר — לא ניתן "להעביר" בקלות למכשיר אחר.</p>
<h2 dir="rtl">התקנה — אייפון ואנדרואיד</h2>
<p class="my-3" dir="rtl"><strong>אייפון:</strong> הגדרות → סלולרי → הוספת תוכנית → מצלמה (סריקת QR).</p>
<p class="my-3" dir="rtl"><strong>אנדרואיד:</strong> לרוב תחת הגדרות רשת / מנהל SIM — "הוסף eSIM".</p>
<p class="my-3" dir="rtl">מדריך מורחב: <a href="${SITE}/how-it-works" class="text-primary-600 underline">איך זה עובד</a>.</p>
<h2 dir="rtl">שאלות נפוצות</h2>
<h3 dir="rtl">ש: אפשר לפרוץ eSIM?</h3>
<p class="my-3" dir="rtl">ת: הפרופילים מוגנים הצפנה וקשיחות לחומרה; בסיכון פרקטי נמוך יותר מהרבה מתקפות על SIM פיזי.</p>
<h3 dir="rtl">ש: מוחקים פרופיל — מה קורה לבקשה?</h3>
<p class="my-3" dir="rtl">ת: המחיקה מהטלפון לא תמיד מבטלת את התשלום אצל הספק; לעיתים צריך QR חדש להתקנה חוזרת.</p>
<div class="cta-block rounded-xl border border-emerald-200 bg-emerald-50 p-6 my-8 text-center" dir="rtl"><p class="text-xl font-bold text-emerald-900 mb-2"><a href="${SITE}/he/destinations" class="text-emerald-900 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded">לרכישת eSIM — לחצו כאן</a></p><a href="${SITE}/he/destinations" class="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">לרכישת eSIM</a></div>
`.trim(),
  },
};

export function getSpecialHe(slug) {
  return SPECIAL_HE[slug] || null;
}
