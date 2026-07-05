# Gym Companion — Android APK build

A Vite + React app wrapped with Capacitor. Your workout data is stored on-device
(WebView localStorage) and survives app restarts.

## Requirements (one-time, on your PC)
- Node.js 18+  (https://nodejs.org)
- Android Studio with the Android SDK  (https://developer.android.com/studio)

## Build steps

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Create the Android project (first time only)
npx cap add android

# 4. Sync web build into the Android project
npx cap sync android

# 5. Open in Android Studio
npx cap open android
```

In Android Studio:
- Wait for Gradle sync to finish (first time takes a few minutes).
- **Build > Build App Bundle(s) / APK(s) > Build APK(s)**
- The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Install on your phone
Copy `app-debug.apk` to the phone (USB, WhatsApp-to-self, Drive, etc.), open it,
and allow "Install unknown apps" when prompted. Or, with USB debugging enabled:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Notes
- A **debug** APK is fine for personal use. For Play Store distribution you'd
  need a signed release build (Build > Generate Signed App Bundle / APK).
- App id: `com.arman.gymcompanion` — change it in `capacitor.config.json`
  before the first `npx cap add android` if you want a different one.
- Data lives on-device only. Uninstalling the app erases the log, so use the
  app's Reset option rather than reinstalling if you just want a clean slate.
- To change the app icon/splash later: `npm i -D @capacitor/assets`, drop a
  1024x1024 `icon.png` in `assets/`, then `npx capacitor-assets generate`.
