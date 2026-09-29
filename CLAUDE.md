# Handoff

Sunny Play Garden is a free, static, dependency-free browser games site for a young child (the first player is 3½, a pre-reader who is working on letters). Serve the folder on any static host or open `index.html` through a local server. No build step.

## Layout
- `index.html`, `styles.css`: shell, screens, overlays, all shared styles (game-specific styles are appended in sections).
- `js/core.js`: player storage (`SPG.store`, localStorage), synthesized sound effects (`SPG.sfx`, WebAudio, no files), soft music, UI helpers (`SPG.ui.press` = act on touch-down, `SPG.ui.counter`, `SPG.ui.dpr`), and safe mode (`SPG.safe`).
- `js/voice.js`: every spoken line (`LINES`), critter noises (`SOUNDS`), two voice sets (male/female) from tablet recordings (IndexedDB) or files in `audio/voice/<set>/` listed in `audio/voice/manifest.json`, built-in speech as fallback, per-line mute, praise frequency.
- `js/studio.js`: the grown-ups "Voices" screen (record, hear, delete, mute, choose voice, cheering frequency).
- `js/art.js`, `js/art-garden.js`, `js/art-pets.js`: all illustration (faces, scenery, fruit, plants, friends, avatars, bucket, shovel/can/hand, cats/dogs/parachutes, firefighters, safety net). Shared so the look stays consistent. Scene sky/hills are cached in offscreen canvases.
- `js/glyphs.js`: handwriting-style letters as ordered SVG strokes. Draws cards and drives the tracing game.
- `js/app.js`: players, hub, parent gate, grown-ups panel (voices, play-time limit, safe mode, players), game start/stop, pause on overlays/hidden tab.
- `games/*.js`: one file per game. `SPG.games.push({ id, name, order, icon(c,w,h), create(host) })`; `create` returns `{ start, pause, resume, resize, destroy }`. Add tints for a new game id in `tints` in `js/app.js`.
- `sw.js`, `manifest.webmanifest`, `icons/`: installable, works offline (network first). `_headers`: Cloudflare security headers (CSP, no framing, microphone only for this site).

## Games
- **Letter Garden** (six activities): trace, flash cards, find the letter (whole alphabet, capital/lowercase mixed, avoids recent repeats), write her name, sounds (pick the picture that starts with the sound), match (pair big and little letters).
- **Fruit Splash**: swipe or tap, up to five fingers at once, no losing, rare golden star, lifetime fruit counter.
- **Rain Bucket**: catch drops, rainbow every 8 drops, a meadow of kept flowers, drops counter. Every third rainbow triggers **Raining Cats and Dogs**: two firefighter friends hold a safety net she drags, pets float down on parachutes, bounce, and walk off calmly (misses land softly too); saved pets are counted and cats/dogs then visit the garden.
- **Grow a Garden**: guided planting steps shown by a step strip: dig three times with the shovel (hole grows), drop in a seed, pat the dirt once, then water with a can she grabs and pours (assisted; or switch to tap mode by tapping the can button again). Blooms unlock seeds (pumpkin 3, carrot 6, lavender 10, rose 15) and a bigger garden (8 blooms). 14 friends to meet (some need rainbows or rescued pets), a friends book, and a "say goodbye" tool to send friends off screen.
Progress and stars are saved per player in localStorage under `spg.v1`.

## Tuning notes
Tracing tolerances are constants at the top of the Tracer section in `games/letters.js` (`TOLERANCE`, `START_RADIUS`, `LOOKAHEAD`); progress follows the nearest path point and cannot outrun the finger. Watering effort is `NEED_DROPS` and the drop rate (`cn.emit`) in `games/garden.js`. Kid-facing buttons use `SPG.ui.press` (touch-down); anything needing a completed tap (fullscreen, first sound) stays on `click`.

## Safe mode (what it is and is not)
A website cannot lock a device. Safe mode = fullscreen (or installed PWA), no external links anywhere, CSP that blocks any outside load, back button stays in the app, fullscreen-lost overlay, and every way out is behind the parent gate (spelled-out addition). The real lock is Android screen pinning, explained in the grown-ups panel.

## Grown-ups panel features
Voice/sound/soft-music toggles (music is generative WebAudio, off by default), a daily play-time limit (15/30/45/60 min or none) that shows a full-screen rest screen only a grown-up can dismiss (usage is tracked per day in `settings.playLog`), player management, and screen-pinning instructions.

## Voice
Every spoken prompt is a key in `LINES` (`js/voice.js`); critter noises are sound-only keys in `SOUNDS`. Recordings made in the studio live on that tablet; file recordings go in `audio/voice/male|female/<key with / as ->.mp3` and then run `node tools/build-voice-manifest.mjs`. `RECORDING.md` lists every line; regenerate it with `node tools/make-recording-list.mjs` after editing `LINES` or `SOUNDS`.

## Testing notes
Verified with headless Chromium (tablet landscape and portrait, fake microphone): tracing every letter with simulated fingers (careful/fast/wobbly must complete; 14.5+ units off the line must not), all games, guided planting, the cats-and-dogs event played through, five-finger slicing, touch-down presses without double firing, voice recording/playback/mute, gate, back-button trapping, fullscreen-lost overlay, offline reload. Not yet tested on the real Android tablet beyond the owner's play tests: real microphone, speech voice quality, install prompt, screen pinning.

## Deploying
Cloudflare Workers serves the repo root as static assets via `wrangler.jsonc`; `.assetsignore` keeps handoff/tools/config out of the public site. Build command: `npx wrangler deploy`. Bump `CACHE` in `sw.js` if you ever need to force-clear old offline caches.

## Guidelines
Keep play relaxed and unlimited, no losing, no reading required, big touch targets. Don't repeat game mechanics across games. Add new games through the `SPG.games` list.
