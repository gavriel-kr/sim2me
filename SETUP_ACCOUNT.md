# Account & email setup

Follow these steps so **sign up**, **email verification**, and **password reset** work.

---

## 1. Database (new Customer columns)

The account feature adds new columns to the `customers` table. Apply them once:

### If you already have a PostgreSQL database

1. **Create a `.env` file** in the project root (if you don’t have one).
2. **Add your database URL:**
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
   ```
   Replace `USER`, `PASSWORD`, `HOST`, `DATABASE` with your real values (e.g. from Vercel Postgres, Neon, Supabase, or any PostgreSQL host).

3. **Run one of these in the project folder** (in PowerShell or Git Bash, from `c:\sim2me`):

   ```bash
   npm run db:push
   ```
   (or `npx prisma db push`)

   Or, if you use migrations:

   ```bash
   npx prisma migrate deploy
   ```

   That updates the database with the new account fields.

### If you don’t have a database yet

- Create a PostgreSQL database (e.g. [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com)).
- Copy the connection string they give you into `.env` as `DATABASE_URL`.
- Then run:
  ```bash
  npx prisma db push
  ```

---

## 2. Email (verification & password reset)

Emails are sent via [Resend](https://resend.com). Without an API key, sign-up and password reset still work, but no email is sent (you’ll see logs in the terminal instead).

### Get an API key

1. Go to [resend.com](https://resend.com) and sign up (free tier is enough).
2. In the dashboard, create an **API Key** and copy it.

### Set the key

**On your computer (local):**

1. Open `.env` (or create it from `.env.example`).
2. Add:
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxx"
   ```
   Use your real key. Optionally set the sender address:
   ```env
   RESEND_FROM_EMAIL="noreply@yourdomain.com"
   ```
   (If you don’t set it, Resend’s default is used.)

**On Vercel (production):**

1. Open your project on [vercel.com](https://vercel.com).
2. Go to **Settings** → **Environment Variables**.
3. Click **Add**.
4. Name: `RESEND_API_KEY`  
   Value: your Resend API key.  
   Environment: **Production** (and Preview if you want).
5. Optional: add `RESEND_FROM_EMAIL` and/or `NEXT_PUBLIC_SITE_URL` (e.g. `https://www.sim2me.net`) so verification and reset links use your real domain.
6. Save and **redeploy** the project so the new variables are used.

---

## Quick checklist

- [ ] `.env` exists with `DATABASE_URL` (and optionally `RESEND_API_KEY`, `NEXTAUTH_SECRET`, etc.).
- [ ] Ran `npx prisma db push` (or `npx prisma migrate deploy`) once.
- [ ] On Vercel: added `RESEND_API_KEY` (and optional `NEXT_PUBLIC_SITE_URL`) under Environment Variables and redeployed.

After that, account sign-up, email verification, and password reset will work.
