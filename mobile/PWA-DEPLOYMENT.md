# PWA & Deployment (Phase 6)

## PWA / Add to Home Screen

- **Manifest**: `public/manifest.json` has `name`, `short_name`, `display: standalone`, `theme_color`, `background_color` (matches app splash green), `start_url`, and icon entries.
- **app.json**: Uses `./assets/icon.png` and `./assets/splash-icon.png` for icon and splash. Web: `web.display`, `web.startUrl`, `web.backgroundColor` are set.
- **Splash & icons when installed as PWA**: The manifest `background_color` is `#0d9f6e` (brand green) so the first paint when opening the installed PWA looks professional. Icons: Expo web export typically emits favicon and assets. For reliable “Add to Home Screen” icons, copy your logo into `public/` so they are served at root:
  - Copy `assets/icon.png` → `public/icon.png` (used for 192×192 and 512×512 in manifest).
  - Or add `public/logo192.png` and `public/logo512.png` (192×192 and 512×512) and reference them in `public/manifest.json` for best quality.
- **Linking the manifest**: After `npx expo export -p web`, ensure built `index.html` in `dist/` includes:
  ```html
  <link rel="manifest" href="/manifest.json" />
  ```
  If not, run `npx expo customize public/index.html` and add that line in `<head>`, then re-export.

## Service workers (optional)

For offline/caching, use [Workbox](https://developer.chrome.com/docs/workbox/) after export. Expo does not ship a service worker by default.

## Deep link (success after payment)

- **Scheme**: `sim2me` (in `app.json`). Web success page includes an “Open in Sim2Me App” button with `sim2me://success`.

---

## How to test PWA installation

### Option A: Local web build (same network)

1. **Export for web**
   ```bash
   cd mobile
   npx expo export -p web
   ```
2. **Serve the build** (e.g. port 8080)
   ```bash
   npx serve dist -l 8080
   ```
3. **Open on your phone** (iPhone or Android) using your computer’s LAN IP, e.g. `http://192.168.1.x:8080`. Use the same Wi‑Fi on both devices.
4. **Add to Home Screen**
   - **iPhone (Safari)**: Share → “Add to Home Screen”. Name it “Sim2Me” and add. Open from the home screen to see standalone (no browser UI) and the green splash.
   - **Android (Chrome)**: Menu (⋮) → “Install app” or “Add to Home screen”. Open from the home screen to see standalone and splash.

### Option B: Deployed URL (HTTPS required for install on many devices)

1. Deploy the `dist/` folder to a host with HTTPS (e.g. Vercel, Netlify, or your own server).
2. Open the deployed URL on your iPhone or Android.
3. **iPhone**: Safari → Share → Add to Home Screen.
4. **Android**: Chrome → Menu → Install app / Add to Home screen.

### Checklist

- [ ] Manifest is linked in the built `index.html` (`<link rel="manifest" href="/manifest.json" />`).
- [ ] `dist/manifest.json` (or your served `/manifest.json`) is reachable and has correct `name`, `short_name`, `display`, `theme_color`, `background_color`, and `icons`.
- [ ] Icons resolve: `/icon.png` or `/logo192.png` and `/logo512.png` return 200. If not, copy `assets/icon.png` into `public/` as `icon.png` and re-export.
- [ ] After “Add to Home Screen”, opening the app shows a full-screen app (no browser UI) and the green splash background while loading.
