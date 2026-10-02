# Agent handoff (read this first if you are a new Claude/Codex session)

Little Sprout Park: a free, static, dependency-free browser games site for a 3-year-old pre-reader, packed into an Android app with Capacitor.
`CLAUDE.md` is the real manual (architecture, every game, how to add things). This file is the current state, what is verified, and what is left.
Rules that matter: big touch targets, spoken prompts, no reading needed, nothing can be lost or fail. Grown-up screens may use words; text the child hears must not use pronouns.

## Branches and how to work
- GitHub: `differentlightproductions-cyber/sunny-play-garden`. Remote branches: `main` and `ccr-ed68e9e3-9wp989` (all current work; it contains everything in `main` plus the commits below). The old docs say `claude-android-app`; that branch does not exist any more. Push to the branch you were given, never open a PR unless the owner asks, never push to `main`.
- Commit trailers: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and the session line the harness gives you.
- No build step for the site: serve the folder (`python3 -m http.server`) and open `index.html`.

## What was done in the last round (all pushed)
1. **Sprout Kitchen overhaul** (`games/cook.js`): ingredient names said once per recipe (`g.hear`); ingredients counted (`amt` on `add` steps; 1 for toddlers, up to 2, up to 3 by age tier) with pour/crack/plop motions (`addMotion`); oven must be switched on first and rings a real two-strike bell (`sfx.ding(2)`, the spoken line no longer says "ding"); cookies, chip cookies and cupcakes are made six at a time (`slots()` handles up to six, `plate()` is the one plate every step uses); new menu (`layoutMenu`/`drawMenu`, Fredoka text via `fancyText`/`fitLabel`/`ribbon`/`gingham`, colours per food kind in `CAT_COL`); cutters are picked once and then touched on the dough or sandwich as often as there is room, with a visible press and lift (`H.cut`); sauces are free-form squirts anywhere on the food or plate (`paint` lists, `drawPaintList`, `sfx.squeeze()` is a soft wet sound), salt and pepper grains stay where they land; fixed the top bun floating above the patty (`drawStack`).
2. **Age and difficulty** (`js/level.js`, `SPG.level.tier(game)` = 1, 2 or 3): per player, an exact age 2-7 (a curated mix, each game steps up at its own age) or an age group. Chosen at setup and in Grown-ups > Age and difficulty (which also lists exactly what each game does; keep `GAMES` in js/level.js true when you change a game). Applied to Fruit, Rain, Fire, Band, Train, Puzzle, Hide, Garden, Letters (choices), Numbers, Math and Cook. Old `settings.fruitAge === 'big'` counts as Big kid.
3. **Letter Garden** has two new tiles, **Numbers** (touch each picture to count, then pick the number) and **Add** (add / take away with pictures, handwriting digits). Digit glyphs 0-9 are in js/glyphs.js; voice lines `num/0..20`, `count-*`, `math-*`.
4. **Boy or girl** is asked at setup (`profile.gender`, optional). Grown-up text uses `SPG.pron.fill('... {her} ... {their} ...')`; no choice reads as them/their.
5. **Hide and Seek**: who hides in a place is saved with the place (`pr.kinds`) and never repeats a kind from earlier places in the adventure, so followers are not "replaced" by look-alikes. Tier 1/3 change friend counts (2-4, 3-5, at least 4 per place; 21 kinds, at most 21 friends in an adventure).
6. **Extra audio help** (`settings.audioHelp`, Grown-ups > Sound, off by default): lines that only name a touched menu item, ingredient, clothing item, shop item or room are silent unless it is on (`isExtra()` in js/voice.js); with it on the built-in voice also speaks slower. Teaching and "what to do" lines are always spoken.
7. **Pronunciation**: the built-in voice read a lone "Ay" like "eye". `SAY_AS` in js/voice.js speaks `letter/a` as "A." and `sound/x` as "kss" (recording prompts and edited/recorded lines are untouched). Add other mispronounced lines to `SAY_AS`.

## Verified (headless Chromium, real mouse input)
- All 18 recipes play end to end at 1280x800 and 390x844 (a few again at 844x390).
- Every game opens and takes drags at ages 2, 4, 7 and sizes 390x844, 844x390, 1280x800, no errors.
- Hide and Seek place changes at three ages (no duplicate kinds), Numbers/Add at four sizes, Extra audio help filtering (with a fake speech engine), `node tools/check-release.mjs` (0 failed), `node tools/check-pictures.mjs`.
- Scripts are in `tools/playtest/` (see its README). Run `node tools/playtest/smoke2.mjs` and `node tools/playtest/auto.mjs` before pushing changes to games.

## NOT verified (needs the owner's phone, or real ears)
- How the phone's text-to-speech says the letter A now ("A."); other letter names and phonics ("ks", "ih", "uh") may still be off on some engines. If so, add them to `SAY_AS` or have the owner use Edit on that line in Grown-ups > Voices.
- The sounds: oven bell, the soft sauce squeeze, pour/crack/plop, cutter press. All synthesized in `js/core.js` (`ding`, `squeeze`, `squirt`, `shake`, `crack`, `cut`).
- Native Android text-to-speech, edge-to-edge/cutout layout, microphone permission through Capacitor, install and screen pinning (see earlier notes in the git log and `android-app/README.md`).
- Voice recordings for the new lines do not exist yet (the built-in voice reads them): `cook-oven-on`, `cook-cutsand`, `cook-squirt`, `cook-cut` and `cook-ding` (their wording changed), `count-*`, `math-*`, `num/0..20`. `RECORDING.md` is regenerated with `node tools/make-recording-list.mjs`.
- Number glyph shapes (`4`, `9`) are first drafts; judge them by eye.

## Android app and getting a test file
- `.github/workflows/android.yml` ("Build Android app") builds in about 3 minutes. It runs on pushes to `claude-android-app` (which no longer exists) or by hand: Actions > Build Android app > Run workflow, pick the branch, give a version name and a version code higher than the last (the last test builds used 3 and 4; Play's first upload was 1). Or trigger it from an agent with the GitHub tool `actions_run_trigger` (`workflow_id` `android.yml`, `ref` the branch, inputs `version_name`, `version_code`).
- Artifacts on the run page: `app-debug-apk` (installable on a phone: unzip, tap the .apk; uninstall the Play version first because the signature differs, back up first) and `app-release-bundle` (the .aab for Play; unsigned until the owner adds `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` and the variable `SPG_API_BASE`).
- Build 22 (commit a6dcb45, version 1.0.0-test2) passed. The app and the website do not share saved data (use the backup file or family code).
- `SPG.version` (js/core.js) says 1.0.0 while Gradle's default version name is 1.0.0-alpha2: they should be brought together before a Play release.

## Known small issues / ideas queued
- `native.js` `saveFile` returns false for both a cancelled share and a real failure.
- Worker: a request with `Origin: null` makes `new URL(origin)` throw (500 instead of 403).
- The step bar in the kitchen is crowded on a narrow phone for 7-step recipes.
- Pancakes still make three (the dish is a stack of three); sundae and burgers are single items.
- Not age-tiered (creative games): Fish Tank, Pet Care, Coloring Book, Style Studio, Pet Shop.
- Ideas: more recipes, a shopping/ingredient-pick step, recipe stars on the hub icon, a saved "my menu"; Hide and Seek houses she can walk into; digit tracing in the Trace activity; store screenshots (`tools/make-store-assets.mjs` GAMES list) do not include the kitchen yet.
- Owner still to answer: which games need "more depth", whether to PR these changes into `main`, the "kill code" for the web version, and telling testers that progress does not carry from the website to the app.

## Gotchas learned
- `perPage()` in js/app.js must match the hub grid CSS at the end of styles.css.
- Hub cards: select by name (`.card[aria-label="Fire Rescue"]`), never by `nth-child`. Opening a game from a script: dispatch a `click` with `detail: 0`.
- Test scripts must dismiss the first-run voices screen (`#vintro .btn.quiet`); `lib.mjs` `login()` does.
- Playwright cannot click `.lg-opt` buttons while they animate ("not stable"); dispatch `pointerdown` instead (`SPG.ui.press` acts on touch-down).
- `art.shade` takes six-digit hex colours only; the kitchen's own `shade` also takes `rgb()`.
- Never `pkill -f wrangler` in the sandbox shell (it kills the shell).
