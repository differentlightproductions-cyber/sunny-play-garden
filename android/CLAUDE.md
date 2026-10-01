# Android handoff

Work in this `android/` tree for Play app changes. The current app is the packaged original game, including every game and the existing artwork. Preserve that experience while improving Android behavior. The root game is the source of truth for gameplay; refresh the bundled copy with `node android/sync-game-assets.mjs` after pulling game updates. Do not commit signing files or passwords. Increase `versionCode` for each new Play upload.
