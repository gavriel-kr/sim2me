# Deploying Sim2Me eSIM to Vercel

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))

## 1. Push the project to GitHub

Repo: **https://github.com/gavriel-kr/sim2me**

From the project folder in **PowerShell** (if Git is installed):

```powershell
cd c:\sim2me
.\push-to-github.ps1
```

Or run these commands manually (PowerShell or **Git Bash**):

```bash
cd c:\sim2me
git init
git add .
git commit -m "Initial commit: Sim2Me eSIM site (Airalo-style)"
git branch -M main
git remote add origin https://github.com/gavriel-kr/sim2me.git
git push -u origin main
```

If you get “Git not found”, install Git from [git-scm.com](https://git-scm.com/), then run the commands again.

## 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use “Continue with GitHub”).
2. Click **Add New…** → **Project**.
3. **Import** the `sim2me-esim` (or your repo) from the list.
4. Leave the defaults:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` or leave empty
   - **Output Directory:** (leave default)
   - **Install Command:** `npm install`
5. (Optional) Add environment variables under **Environment Variables** if your app uses them (e.g. `NEXT_PUBLIC_SITE_URL`).
6. Click **Deploy**.

Vercel will build and deploy. You’ll get a URL like `sim2me-esim.vercel.app`. Each push to `main` will trigger a new deployment.

## 3. Custom domain (optional)

1. In the Vercel project, go to **Settings** → **Domains**.
2. Add your domain (e.g. `sim2me.com`) and follow the DNS instructions.
3. Vercel will provision SSL automatically.

## 4. SEO articles in production

After the first deploy (or after adding new articles to the repo), run the article seed **once** against the production database so the 41 SEO articles appear on the live site:

1. In your project folder, set `DATABASE_URL` to your **production** Postgres URL (e.g. from Vercel Postgres or Neon).
2. Run: `npm run db:seed-articles`

This creates/updates all articles in the DB. The app and admin panel read from the same DB, so no further deploy is needed.

## 5. Notes

- **i18n:** The app uses `next-intl` with locales `en`, `he`, `ar`. No extra Vercel config is required.
- **Build:** If the build fails, check the Vercel build logs. Common fixes: run `npm run build` locally and fix any TypeScript or lint errors.
- **Env vars:** For production APIs or keys, set them in Vercel **Settings** → **Environment Variables** and redeploy.
