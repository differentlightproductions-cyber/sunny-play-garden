# Little Sprout Park Android app

This is the Android source for the paid, offline Google Play app. The app runs the complete game from `app/src/main/assets/site`; it does not load gameplay from the public website. The package name is `com.toastygames.littlesproutpark`.

The bundled game is a snapshot of the root game from commit `c9db3fc`. After pulling new game changes into this branch, run `node android/sync-game-assets.mjs` from the repository root to refresh the bundled copy. This copies only the game's public code and assets, never local voice recordings. Keep game changes in the root source so the web and Android versions can be synchronized.

To build a debug APK on Windows, install Android SDK 36 and JDK 17, then run `android\gradlew.bat -p android assembleDebug`. For a Play release bundle, increment `versionCode` and `versionName` in `app/build.gradle`, set `SPROUT_UPLOAD_STORE` to the private upload keystore path and `SPROUT_UPLOAD_PASSWORD` to its password, then run `android\gradlew.bat -p android bundleRelease`.

The upload keystore and its password are deliberately excluded from Git. Keep them backed up privately; Google Play updates need the same upload key unless it is reset through Play Console.
