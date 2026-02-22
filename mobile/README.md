# Sim2Me Mobile App

React Native app built with Expo for iOS and Android.

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** app on your phone to preview.

### How to see the app (easiest)

1. On your computer: `cd mobile` then `npx expo start`.
2. On your phone: Install **Expo Go** from the App Store (iOS) or Google Play (Android).
3. Scan the QR code shown in the terminal (iOS: Camera app; Android: Expo Go app).
4. The app opens in Expo Go. Try:
   - **My eSIMs** tab — you’ll see a demo eSIM; tap it for details, QR placeholder, and **Copy** activation code.
   - **Profile** tab — **Sign In / Create Account** opens the website to connect your account; support and legal links work.

## Build for App Stores

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS (requires Apple Developer Account)
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Project Structure

```
src/
  api/         API client (connects to sim2me.net)
  components/  Reusable UI components
  hooks/       Custom React hooks
  navigation/  React Navigation setup
  screens/     App screens
  theme/       Colors, spacing, typography
  types/       TypeScript types
```

## Requirements for App Store Submission

- **Apple Developer Account** — $99/year at developer.apple.com
- **Google Play Console** — $25 one-time at play.google.com/console
