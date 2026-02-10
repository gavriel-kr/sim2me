# Sim2Me Mobile App

React Native app built with Expo for iOS and Android.

## Quick Start

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** app on your phone to preview.

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
