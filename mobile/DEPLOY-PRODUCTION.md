# Deploy Sim2Me App to Production (Option B)

The **dist** folder is production-ready. Follow the steps below to go live.

---

## Steps completed (deployment record)

- **Fresh export** – Ran `npx expo export -p web` from `mobile/`. The dist folder is up to date.

**Important:** Deploy only to **your** Vercel account (Gabriel's projects). See the repo root doc **`VERCEL-GABRIELS-PROJECTS.md`** for correct login, link, and deploy steps. Do not use a different Vercel team/account.

---

## 1. What’s in `dist/`

After `npx expo export -p web`, the **mobile/dist** folder contains:

- **index.html** – Entry page with manifest link and theme-color
- **manifest.json** – PWA manifest (name, icons, display: standalone, theme_color, background_color)
- **favicon.ico** – Favicon
- **icon.png** – App icon for PWA (Add to Home Screen)
- **_expo/static/js/web/** – Bundled JS
- **assets/** – Fonts and other assets

All API calls use the production base URL from **nav** (`extra.apiBaseUrl` or `EXPO_PUBLIC_API_URL`), defaulting to **https://www.sim2me.net**.

---

## 2. Upload `dist` to Your Hosting

### Option 1: Vercel

1. Install Vercel CLI (if needed): `npm i -g vercel`
2. From the **mobile** folder:
   ```bash
   cd mobile
   vercel dist --prod
   ```
   Or link the project first:
   ```bash
   vercel link
   vercel --prod
   ```
   When asked for the root directory, choose **dist** (or deploy from `mobile` and set “Output Directory” to `dist` in Project Settings).
3. In the dashboard: **Project → Settings → General**:
   - **Root Directory**: leave default or set to `dist` if you deployed from repo root.
4. Deploy:
   ```bash
   vercel --prod
   ```
   Or connect the repo and set **Root Directory** to `mobile` and **Output Directory** to `dist`, then trigger a build with build command: `npx expo export -p web`.

**One-time manual deploy (no CLI):**

1. Zip the contents of **mobile/dist** (not the folder itself).
2. Go to [vercel.com](https://vercel.com) → Add New → Project → Import.
3. Or use “Deploy” by dragging the **dist** folder (or use Vercel’s “Import” and point to the repo; then set build to `cd mobile && npx expo export -p web` and publish directory to `mobile/dist`).

### Option 2: Netlify

1. **Drag-and-drop**
   - Go to [app.netlify.com](https://app.netlify.com) → “Add new site” → “Deploy manually”.
   - Drag the **mobile/dist** folder (or a zip of its contents) into the drop zone.
   - Netlify will serve it at a URL like `https://random-name.netlify.app`.

2. **Or connect Git**
   - “Add new site” → “Import an existing project” → choose repo.
   - Build settings:
     - **Base directory**: `mobile`
     - **Build command**: `npx expo export -p web`
     - **Publish directory**: `mobile/dist`
   - Deploy.

3. **Redirects for SPA** (so deep links work): add **mobile/dist/_redirects** or in Netlify UI “Redirects”:
   ```
   /*    /index.html   200
   ```

### Option 3: Your Own Server (nginx / Apache / any static host)

1. Copy the **contents** of **mobile/dist** to your server’s web root (e.g. `/var/www/sim2me-app` or your docroot).
2. **nginx** – ensure SPA fallback and correct MIME types:
   ```nginx
   server {
       listen 443 ssl;
       server_name your-app.example.com;
       root /var/www/sim2me-app;
       index index.html;
       location / {
           try_files $uri $uri/ /index.html =404;
       }
       location = /manifest.json {
           add_header Content-Type application/manifest+json;
       }
   }
   ```
3. **Apache**: enable `mod_rewrite`, and in the app directory use an `.htaccess` with:
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```
4. Use **HTTPS** (required for PWA “Add to Home Screen” on most devices).

---

## 3. After Deploy: Verify

1. Open your **HTTPS** URL in a phone browser (Safari on iPhone, Chrome on Android).
2. **Add to Home Screen** / **Install app** – the app should open in standalone mode with the green splash.
3. **Deep link**: Open `sim2me://success` (e.g. from the web success page button) – the native app should open if installed; in PWA it may open the same tab or prompt to open the PWA.

---

## 4. Rebuilding After Changes

From the **mobile** folder:

```bash
npx expo export -p web
```

Then re-upload **dist** (or let Vercel/Netlify run the same command and publish `mobile/dist`).

---

## 5. Android Standalone APK (Direct Download)

To build an APK for direct download from your site:

1. **Install EAS CLI**: `npm i -g eas-cli`
2. **Log in**: `eas login` (Expo account).
3. **Configure project** (if not done): `eas build:configure`.
4. **Build APK** (preview for internal/testing):
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```
   Or for production:
   ```bash
   eas build --platform android --profile production
   ```
5. When the build finishes, EAS provides a download link. You can host that APK on your site or use the permanent link from Expo.
6. **Production profile** in **eas.json** uses `buildType: "apk"` so the output is an APK (not AAB). For Play Store you can switch to `buildType: "app-bundle"` later.

**Environment**: `EXPO_PUBLIC_API_URL` is set in **eas.json** to `https://www.sim2me.net` for preview and production so the app uses your live API.

---

## Summary

- **dist** is ready to deploy.
- Use **Vercel**, **Netlify**, or your own static host with HTTPS and SPA fallback.
- For Android, use **eas.json** and `eas build --platform android --profile production` (or `preview`) to generate an APK for direct download.
