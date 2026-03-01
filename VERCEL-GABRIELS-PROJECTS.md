# Deploy to YOUR Vercel (Gabriel's projects) — correct setup

## 1. מה נמחק (הושלם)

- **פרויקט sim2me** נמחק מ-valentyns-com (כולל כל הדיפלואים).
- **פרויקט dist** נמחק מ-valentyns-com (כולל כל הדיפלואים).
- הקוד נשמר במלואו ב-repo – שום דבר לא אבד.

## 2. מה תוקן קודם

- הוסר הקישור ל-Vercel הלא נכון: ` .vercel` משורש הפרויקט ו-`mobile/dist/.vercel` – כבר לא מקושרים.

---

## 3. התחברות ל-Vercel הנכון (Gabriel's projects)

פרויקט **sim2me** תחת **Gabriel's projects** מחובר ל-GitHub (gavriel-kr/sim2me). דיפלוי אחד כולל:
- **האתר הראשי** (Next.js) – כל הדפים, checkout, account וכו'
- **אפליקציית המובייל (PWA)** – נגישה ב-**/app/** (למשל www.sim2me.net/app/)

### דיפלוי (push ל-main)

```bash
cd c:\sim2me
git add -A
git commit -m "chore: production deploy"
git push origin main
```

Vercel יבנה (כולל export של האפליקציה ל-web והעתקה ל-public/app) וידפלס אוטומטית. תוך דקה–שתיים תראה דיפלוי חדש ב-**Gabriel's projects → sim2me → Deployments**.

### אופציה ב': דיפלוי דרך CLI

אם אתה רוצה להשתמש ב-CLI, צריך להיות מחובר לחשבון שבו מופיע **Gabriel's projects**:

1. **התחברות לחשבון הנכון:**
   ```bash
   vercel logout
   vercel login
   ```
   השתמש באימייל (והסיסמה/SSO) של החשבון שבו אתה רואה **Gabriel's projects** ב-[vercel.com](https://vercel.com).

2. **קישור ודיפלוי:**
   ```bash
   cd c:\sim2me
   vercel link
   ```
   בחר את הצוות **Gabriel's projects** ואת הפרויקט **sim2me** (או צור חדש). אחר כך:
   ```bash
   vercel --prod
   ```

---

## סיכום

| מה | סטטוס |
|----|--------|
| מחיקת sim2me ו-dist מ-valentyns-com | הושלם |
| קישור לחשבון הלא נכון | הוסר |
| Gabriel's projects | מחובר ל-Git – push ל-main יגרום לדיפלוי |
