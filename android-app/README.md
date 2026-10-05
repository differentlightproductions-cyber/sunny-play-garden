# Little Sprout Park: Android app

This folder turns the game into a real Android app. The game itself is **not rewritten**: the same files that run on the website
(`index.html`, `js/`, `games/`, `fonts/`, `audio/`, `icons/`, `styles.css`) are copied into the app, so it opens straight from the
phone with no website, no browser and no internet. It uses [Capacitor](https://capacitorjs.com), which is a thin native
shell around Android's web view.

```
android-app/
  build-web.mjs            copies the game into www/ (leaves out the website's service worker, sets the cloud backup address)
  capacitor.config.json    app id com.toastygames.littlesproutpark, name "Sprout Park"
  android/                 the Android project (Gradle). Edit native things here
  make-android-icons.mjs   re-makes the launcher icons and splash screens from ../icons
```

## What is different from the website (and nothing else)
* `js/native.js` is the only bridge. On the website it does nothing. In the app it: saves pictures and backup files through the
  phone's share sheet (a hidden download link does not work in an Android web view), connects the Android back button to the same
  "stay in the app" logic, and tells the cloud backup where to find the server.
* The website's service worker is not used (everything is already on the phone).
* Full screen, keep-screen-on and the microphone permission are set in `android/app/src/main/java/.../MainActivity.java` and `AndroidManifest.xml`.

## Building (you do not need Android Studio)
The easiest way is GitHub Actions: **Actions > Build Android app > Run workflow**. It makes two files you can download from the run:
`app-release-bundle` (the `.aab` for Google Play) and `app-debug-apk` (an `.apk` to install on a phone and try).

For the **signed** bundle Play accepts, add four repository secrets (Settings > Secrets and variables > Actions):
`ANDROID_KEYSTORE_BASE64` (your upload keystore, `base64 -w0 upload.keystore`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`. It must be the **same upload key** used for the first upload (1.0.0-alpha1), or Play will refuse the update.
Also add the repository variable `SPG_API_BASE` (for example `https://your-site.workers.dev`), the address where the cloud backup lives.

Version code: every upload to Play needs a number higher than the last. The first upload was **1**; the workflow asks for it when run by hand
(default 2).

On your own computer: `cd android-app && npm install && SPG_API_BASE=https://... npm run sync`, then open `android/` in Android Studio
(or `cd android && ./gradlew bundleRelease`).

## Before the first upload from this app (Play Console)
* Same package name (`com.toastygames.littlesproutpark`), same signing, higher version code.
* **Data safety**: the cloud backup is optional and encrypted on the device. Answer for what the app does:
  * Data shared with third parties: none. No ads, no analytics.
  * *Audio files / voice or sound recordings*: collected only if a grown-up turns on cloud backup (optional), encrypted in transit and on the server,
    not shared, can be deleted by the grown-up (Turn off and delete cloud copy).
  * *App activity / other user-generated content* (player names, progress, drawings): the same, optional and encrypted.
  * "All user data is encrypted in transit": yes. "You can request that data is deleted": yes (inside the app).
* **Permissions** shown in the console: Internet (cloud backup only), Record audio (grown-ups' voice recording only), Modify audio settings.
  Microphone and touchscreen are marked *not required*.
* Privacy policy (`privacy.html`) is updated for recorded voices in the cloud copy and for the app being offline. Check it still reads right for you.

## Moving testers from the web wrapper to this app
This is a replacement for the old wrapper, not a second app. The app's saved data is separate from the browser's, so progress does not carry across
automatically. Before updating, a grown-up can use **Grown-ups > Save a backup file** or turn on **Cloud backup** and then, in the new app,
enter the family code (this also brings the recorded voices).

## The cloud server
`worker/index.js` (Cloudflare) now also allows the app (`https://localhost`) and stores recorded voices (`/api/voice`). Deploy it as before (`npx wrangler deploy`).

## Small-screen widget and foldables
The Android build includes a parent-added, tap-based widget. It has mini versions of Pet Care, Letter Garden, Rain Bucket, Fruit Splash, Coloring Book (three tiny pages), and Fish Tank. **My paintings** shows the active child's actual saved Coloring Book pictures. When the app opens or a picture is saved, it renders small previews into app-private storage for the widget; the editable originals stay in the game. Open the updated app once after installation to bring in older paintings. The widget does not read voice recordings, connect to the cloud, show ads, or ask for new permissions. Its play taps count toward the existing daily timer and show Rest time when that limit is reached.

On regular Android home screens, a grown-up adds **Sprout Park** from the widget picker. On Samsung Z Flip5 and newer Flex Windows, a grown-up can enable it under **Settings > Cover screen > Widgets**; Samsung's cover-screen widget support varies by model and One UI version. Older tiny Z Flip cover screens may not offer third-party widgets. Full game controls use the current app window size, including narrow front displays and the unfolded near-square display. The widget uses taps only, because Android widgets do not support the game's full drag/canvas gestures. Test the widget and fold transitions on the target phone before a Play upload.
