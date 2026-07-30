# Sim2Me — Deploy Protocol (מקור האמת)

מסמך זה מגדיר **איך מעלים לפרודקשן בצורה הכי בטוחה**.  
כל סוכן / מפתח **חייב** לעקוב אחריו. אין קיצורי דרך.

> **כלל עליון:** דיפלוי קורה **רק** כשגבריאל מבקש במפורש.  
> עד אז — לא מדברים על דיפלוי, לא מבקשים, לא דוחפים ל-`main`, לא מריצים Vercel CLI.

---

## 1) מיפוי פרויקט (לא להתבלבל)

| שירות | ערך |
|--------|------|
| Local path | `C:\sim2me` |
| GitHub | `gavriel-kr/sim2me` |
| Vercel team | **Gabriel's projects** (לא valentyns-com) |
| Vercel project | `sim2me` |
| Production URL | `https://www.sim2me.net` |
| Branch לייצור | `main` |
| Package manager | `npm` |

כל אלה = אותו פרויקט. לא לערבב עם וולנטיינס.

---

## 2) איך דיפלוי עובד (הדרך היחידה)

Vercel מחובר ל-GitHub.  
`git push` ל-`main` = דיפלוי אוטומטי לפרודקשן.

### ✅ נכון
```bash
# רק אחרי שכל השערים למטה ירוקים, ורק אחרי בקשה מפורשת מהמשתמש
npm run build          # חייב exit code 0
git add <files>
git commit -m "..."
git push origin main   # זה הדיפלוי
```

### ❌ אסור לחלוטין
```bash
npx vercel --prod
npx vercel --prod --yes
vercel deploy
vercel --prod
```

למה? `git push` + `vercel --prod` = **שני דיפלויים במקביל**, היסטוריה מבולגנת, סיכון לבלבול.

---

## 3) עקרון ברזל: Stop → Fix → Recheck → רק אז Deploy

```
בדיקה נכשלה?
   ↓
עצור מיד. אל תמשיך לדיפלוי.
   ↓
תקן את הבעיה.
   ↓
הרץ שוב את אותה בדיקה (ואת כל מה שלפניה אם צריך).
   ↓
רק כשהכול ירוק → אפשר לעבור לשלב הבא.
```

**אסור:**
- לדחוף עם אזהרות “נראה בסדר”
- לדלג על בדיקה שנכשלה
- לתקן חלקית ולהמשיך בלי להריץ שוב
- להגיד “נטפל אחרי הדיפלוי”

**מותר להמשיך רק כש:** כל סעיפי השער הרלוונטי מסומנים ✅ ויש exit code 0 בכל פקודה חובה.

---

## 4) רמות סיכון — מה חובה לפני עלייה

| רמה | מתי | מה חובה |
|-----|-----|----------|
| **R0 — רגיל** | שינוי UI/טקסט/תיקון קטן בלי תשלום/DB | שער A + B + smoke בסיסי |
| **R1 — בינוני** | אדמין, מאמרים, i18n, SEO, מובייל `/app` | שער A + B + C (לפי אזור) + tag גיבוי |
| **R2 — גבוה** | checkout, Paddle, webhook, eSIM, auth, OTP, הזמנות, מחירים, refund | שער A + B + C מלא + D + tag גיבוי + אישור מפורש נוסף |
| **R3 — מסוכן מאוד** | שינוי Prisma schema, סקריפט שכותב ל-DB בפרוד, bulk על הזמנות/מחירים | כמו R2 + גיבוי DB + תוכנית rollback כתובה לפני push |

אם לא בטוחים — מתייחסים כ-**R2**.

---

## 5) שער A — קוד חייב להיבנות מקומית

חובה לפני כל push ל-`main`:

- [ ] `git status` נקי מהבנה: יודעים בדיוק מה נכנס לקומיט
- [ ] אין קבצי סודות בקומיט (`.env`, `.env.local`, מפתחות)
- [ ] אין `console` / debug זמני שנשאר בקוד רגיש בלי כוונה
- [ ] `npm run lint` — אם נכשל: **עצור → תקן → הרץ שוב**
- [ ] טסטים קיימים רלוונטיים:
  - [ ] `npm run test:profit` (אם נגע במחירים/רווח)
  - [ ] `npm run test:locale-path` (אם נגע בנתיבי שפה)
  - [ ] `npx tsx src/app/admin/orders/orderFilters.test.ts` (אם נגע בפילטרי הזמנות)
  - [ ] `npx tsx src/app/admin/orders/ordersExcel.test.ts` (אם נגע באקסל הזמנות)
- [ ] `npm run build` — **חייב exit code 0**
  - אם נכשל: **עצור → תקן → build שוב**
  - אל תדחוף קוד שלא בונה מקומית

> הערה: `npm run build` כולל גם `prisma db push` וסקריפטי עדכון תוכן.  
> אם ה-build נוגע ב-DB מקומי בצורה מפתיעה — עצור ודווח לפני המשך.

---

## 6) שער B — סיכונים וסביבה (לפני push)

### B1 — האם נגענו במסלול כסף / זהות?

סמן מה רלוונטי לשינוי הנוכחי:

- [ ] Checkout / Paddle client / `create-transaction` / `prepare`
- [ ] Webhook Paddle / fulfillment / יצירת Order
- [ ] eSIMaccess (הזמנה, סטטוס, ביטול, credentials)
- [ ] מיילים (Resend) — אישור הזמנה / אימות / איפוס סיסמה
- [ ] Auth לקוח (הרשמה, login, verify, forgot/reset)
- [ ] OTP / 2FA לקוח או Admin TOTP
- [ ] Admin orders (retry / refund / archive / bulk / Excel)
- [ ] מחירים / price floor / fees / package overrides
- [ ] Blocklist / fraud
- [ ] Cron (`refresh-packages`, `check-abandoned`)
- [ ] Prisma schema / מיגרציה / סקריפט DB
- [ ] מובייל PWA (`/app`)
- [ ] מאמרים / i18n / עמודים משפטיים

אם סומן אחד מהשורה הראשונה עד מחירים/webhook — זו רמת **R2** לפחות.

### B2 — משתני סביבה קריטיים בפרוד (לא לשנות בלי בדיקה)

חובה לוודא שקיימים ב-Vercel (Gabriel's projects → sim2me) כשעובדים על האזור הרלוונטי:

| משתנה | למה |
|--------|-----|
| `DATABASE_URL` / `PRISMA_DATABASE_URL` | האתר והאדמין |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | התחברות |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Checkout בצד לקוח |
| `PADDLE_API_KEY` | יצירת עסקה + refunds |
| `PADDLE_WEBHOOK_SECRET` | אימות webhook |
| `ESIMACCESS_ACCESS_CODE` | מימוש eSIM |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | מיילים |
| `CRON_SECRET` | הגנת cron |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | הגנה מבוטים |

- [ ] לא מוחקים/מחליפים env בפרוד בלי אישור
- [ ] לא מדפיסים סודות בלוגים / ב-PR / בצ׳אט

### B3 — גיבוי (חובה מ-R1 ומעלה)

לפני push ל-`main` ברמת R1+:

```bash
git tag pre-deploy-YYYYMMDD-HHMM
# דוגמה: git tag pre-deploy-20260728-0215
```

- [ ] Tag נוצר מקומית על ה-commit האחרון היציב **לפני** השינוי (או על main הנוכחי לפני המיזוג)
- [ ] אם R3 (DB): יש גם גיבוי DB / תוכנית שחזור כתובה

Rollback בסיסי אחרי דיפלוי רע:
```bash
git push origin pre-deploy-YYYYMMDD-HHMM:main
```
(רק באישור מפורש של גבריאל)

---

## 7) שער C — Smoke לפני עלייה (מקומי / staging logic)

להריץ לפי מה שנגענו. אם בדיקה נכשלת → **עצור → תקן → בדוק שוב**.

### C0 — תמיד (מינימום)
- [ ] דף בית נטען: `/en`, `/he`, `/ar`
- [ ] אין שגיאת build/runtime גלויה במסך
- [ ] לינק יעד אחד עובד (למשל destination מוכר)

### C1 — Checkout / תשלום / eSIM (R2)
- [ ] פתיחת checkout לא נופלת
- [ ] `GET /api/checkout/health` מחזיר `ok: true` (או מתועד למה לא — ואז עצירה)
- [ ] אין שינוי ששובר webhook signature / `transaction.completed`
- [ ] אין שינוי שמבטל fulfillment או מייל אחרי תשלום בלי כוונה
- [ ] אם נגע במחיר: אין מחיר מתחת לעלות ספק (price floor / safety guard)

### C2 — חשבון לקוח
- [ ] Login / Register לא שבורים
- [ ] אימות מייל / איפוס סיסמה לא נשברו (אם נגענו)
- [ ] OTP enable/disable לא נשבר (אם נגענו)
- [ ] רשימת הזמנות בחשבון נטענת

### C3 — אדמין
- [ ] `/admin/login` עובד
- [ ] `/admin/orders` נטען; סינון בסיסי עובד
- [ ] פעולות מסוכנות (retry/refund/bulk) לא נגענו בהן בלי בדיקה ייעודית
- [ ] Packages / Articles נטענים אם נגענו בהם

### C4 — תוכן / i18n
- [ ] מאמר אחד לפחות בכל שפה רלוונטית
- [ ] RTL תקין ב-`he` / `ar` בדף שנגענו בו
- [ ] אין לינקים שבורים ברורים שהוספנו

### C5 — מובייל `/app`
- [ ] `/app` נטען אחרי build שכולל מובייל (אם השינוי נוגע ב-mobile)

### C6 — Cron / רקע
- [ ] לא הסרנו אימות `CRON_SECRET`
- [ ] לא שינינו schedule ב-`vercel.json` בלי כוונה ותיעוד

---

## 8) שער D — צ׳קליסט Pre-Push הסופי (חובה)

למלא לפני כל `git push origin main` לדיפלוי:

- [ ] גבריאל ביקש במפורש לעשות דיפלוי / push ל-`main`
- [ ] רמת הסיכון נקבעה (R0/R1/R2/R3)
- [ ] שער A כולו ירוק (כולל `npm run build` = 0)
- [ ] שער B מולא לפי הרמה
- [ ] שער C הרלוונטי עבר; כל כשל תוקן ונבדק שוב
- [ ] Tag גיבוי קיים אם R1+
- [ ] הקומיט כולל רק קבצים ששייכים לשינוי (אין זבל/secrets)
- [ ] **לא** מריצים `vercel --prod` / `vercel deploy`
- [ ] הודעת קומיט ברורה (למה השינוי)

רק אחרי שכל זה ✅ → `git push origin main`.

---

## 9) אחרי Push — Post-Deploy Smoke (חובה)

אחרי שהדיפלוי ב-Vercel מסומן Ready:

### תמיד
- [ ] `https://www.sim2me.net/en` נטען
- [ ] `https://www.sim2me.net/he` נטען
- [ ] `https://www.sim2me.net/ar` נטען
- [ ] אין שגיאת 5xx גלויה בדפים האלה

### אם נגענו בתשלום / הזמנות
- [ ] `https://www.sim2me.net/api/checkout/health` — `ok: true`
- [ ] Admin → Orders נטען
- [ ] אין הצפת שגיאות חדשות בלוגים הרלוונטיים (Vercel function logs)

### אם נגענו במובייל
- [ ] `https://www.sim2me.net/app/` נטען

### אם Post-Deploy נכשל
1. **עצור** — לא “עוד קומיט מהיר” בלי אבחון
2. דווח לגבריאל מיד מה נשבר
3. הצע rollback ל-tag הגיבוי (רק עם אישורו)
4. תקן מקומית → שער A/B/C שוב → רק אז דיפלוי חדש אם ביקש

---

## 10) Rollback

### קוד (מהיר)
```bash
# רק באישור מפורש
git push origin pre-deploy-YYYYMMDD-HHMM:main
```

### מסד נתונים (R3)
- לשחזר מגיבוי DB שבוצע לפני השינוי
- לא להריץ סקריפטי seed/bulk “כדי לתקן” בלי אישור

### כלל
Rollback > ניחושים בפרוד.

---

## 11) מה אסור לגעת בלי אישור מפורש נפרד

גם אם ביקשו דיפלוי כללי — **עצור ושאל** לפני:

- Auth / תשלומים / webhook / refund
- מחיקת נתונים / bulk על הזמנות
- שינוי schema הרסני (rename/drop)
- החלפת env בפרוד
- שינוי דומיין / פרויקט Vercel / מעבר חשבון
- דיפלוי לחשבון Vercel שאינו **Gabriel's projects**

---

## 12) תבנית קצרה לכל טיקט (להעתיק)

```markdown
## Deploy checklist — Ticket XXX

### Scope
- Include:
- Do NOT include:

### Risk level
- [ ] R0 / R1 / R2 / R3

### Backup
- Tag: `pre-deploy-...`

### Pre-push
- [ ] npm run build → 0
- [ ] Relevant tests → pass
- [ ] Smoke C… → pass
- [ ] No secrets in commit
- [ ] User explicitly asked to deploy
- [ ] Deploy via git push only (no vercel CLI)

### Post-deploy
- [ ] /en /he /ar OK
- [ ] checkout health (if needed)
- [ ] feature-specific checks:

### Rollback
- Tag: `pre-deploy-...`
```

---

## 13) סיכום לשורה אחת

**Build מקומי ירוק → בדיקות סיכון ירוקות → גיבוי אם צריך → אישור מפורש → push ל-main בלבד → smoke אחרי → אם אדום: עצור, תקן, בדוק שוב. אף פעם לא vercel CLI.**

---

## מסמכים ישנים

- `DEPLOYMENT.md` — מדריך ישן/כללי. **לא מחליף** את המסמך הזה.
- `VERCEL-GABRIELS-PROJECTS.md` — הקשר חשבון Vercel. עדיין תקף לעניין “Gabriel's projects”.
- **המקור האמת לדיפלוי = `DEPLOY-PROTOCOL.md`.**
