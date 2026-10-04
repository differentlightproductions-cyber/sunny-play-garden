# Agent handoff (read this first if you are a new Claude/Codex session)

Branch: `claude-android-app` (Codex also pushes here; `git fetch && git merge origin/claude-android-app` before pushing). Codex's own `android-app` branch is separate: do not touch it. No PR unless the owner asks. Commit trailers: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
Project rules and architecture: `CLAUDE.md` (read it; it is the real handoff). The game is for a 3-year-old pre-reader: big touch targets, spoken prompts, nothing can be lost or fail.

## State at the end of this session
Done and tested in headless Chromium (1280x800, 390x844, 844x390 where noted in the git log):
- Native Android text-to-speech in the Capacitor app (`js/voice.js` `nativeTTS`), manifest `TTS_SERVICE` query. NOT verifiable in a browser: needs a real-device test (Voices screen -> pick a built-in voice -> Hear; lines with no recording must speak).
- Hub: tablets (>=600px both ways) show 6 per page (3x2 landscape / 2x3 portrait), slightly larger icons. `perPage()` (js/app.js) must match the CSS at the end of styles.css.
- Fish Tank: tapping the castle cycles three castles; crab body has no face (stalk eyes only).
- Music: menu music is a shuffled playlist with 3-5 minute songs and fades (`js/core.js`). Only the rotation logic was tested, not by ear.
- Hide and Seek: rebuilt as a permanent five-place world (see CLAUDE.md).
- NEW Sprout Kitchen (`games/cook.js`): 3 tabs x 6 recipes, step-by-step with a chef guide. All 18 recipes were played end to end with real pointer input (see "Testing"). Check the final report for which sizes were screenshot-reviewed.

## Not done / needs the owner
- The Android bundle cannot be built in the Claude sandbox (no Android SDK download). GitHub Actions (`.github/workflows/android.yml`) builds the AAB; it needs the signing secrets (keystore, passwords, alias) and `SPG_API_BASE` (the Cloudflare worker address for cloud backup). versionCode must be >= 2 (1 was the TWA alpha).
- Owner still to answer: which games need "more depth"; whether to PR the game fixes into `main`; the "kill code" for the web version; tell testers that progress does not carry from the website to the app (use the backup file or family code).
- Voice recordings for the new lines (`cook-*`, `cookr/*`, `cookc/*`, `cook/*`) do not exist yet; the built-in voice reads them. Re-record via Grown-ups > Voices (group "Sprout Kitchen names"). `RECORDING.md` is regenerated with `node tools/make-recording-list.mjs`.
- Sounds (sizzle, ding, hose) and the cooking game's feel have only been checked by eye/logic, not by ear.
- Store listing screenshots (`tools/make-store-assets.mjs` GAMES list) do not include the cooking game yet.

## Testing recipe (Playwright, headless Chromium at /opt/pw-browsers)
Serve the repo (`python3 -m http.server 8123`), open `index.html`, pick a name button, `#setup-go`, dismiss `#vintro` (`#vintro .btn.quiet`), open a game by dispatching a `click` event on `.card[aria-label="Sprout Kitchen"]`. `SPG.cookGame.probe()` returns screen/step/tray/slots geometry so scripts can drive real mouse events (tap tray items, drag circles to stir, tap the pan and oven to bake, tap flip/pop hints, drag knife down, tap food to bite). Never `pkill -f wrangler` from the sandbox shell (it kills the shell).

## Ideas queued (not started)
- Cooking: more recipes per tab, a shopping/ingredient-pick step, recipe stars shown on the hub icon, a saved "my menu" of favourite foods.
- Hide and Seek: more places per season, friends' houses she can walk into.

## Update (later session)
- Pet Shop name screen: Done/Cancel were pushed off-screen on tablets and short phones; now pinned (CSS at the end of styles.css, `askName` in games/petshop.js). Player setup got the same pinned buttons. Long names shrink/ellipsize in `SPG.ui.nameGrid`.
- Sprout Kitchen icing redrawn (glossy, sparkly, sitting on the muffin). Needs a fresh Android build to reach the app.
