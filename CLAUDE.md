# Handoff

Sunny Play Garden is a free, static, dependency-free browser games site for a young child (the first player is 3½, a pre-reader who is working on letters). Serve the folder on any static host or open `index.html` through a local server. No build step.

## Layout
- `index.html`, `styles.css`: shell, screens, overlays, all shared styles (game-specific styles are appended in sections).
- `js/core.js`: player storage (`SPG.store`, localStorage), synthesized sound effects (`SPG.sfx`, WebAudio, no files), voice prompts (`SPG.voice`), and safe mode (`SPG.safe`).
- `js/art.js`: all illustration helpers (faces, scenery, fruit, plants, creatures, avatars, bucket, particles). Shared by every game so the look stays consistent.
- `js/glyphs.js`: handwriting-style letters as ordered SVG strokes. Draws cards and drives the tracing game, so the letter she sees is the letter she writes.
- `js/app.js`: players, hub, parent gate, grown-ups panel, game start/stop, pause on overlays/hidden tab.
- `games/*.js`: one file per game. A game does `SPG.games.push({ id, name, order, icon(c,w,h), create(host) })`; `create` returns `{ start, pause, resume, resize, destroy }`. Add tints for a new game id in `tints` in `js/app.js`.
- `sw.js`, `manifest.webmanifest`, `icons/`: installable, works offline. `_headers`: Cloudflare security headers (CSP, no framing).

## Games
Letter Garden (trace / flash cards / find the letter / write her name), Fruit Splash (swipe or tap, no losing), Rain Bucket (catch drops, rainbow, flowers kept in a meadow), Grow a Garden (plant, tap to water, bloom, meet garden friends kept in a book). Progress and stars are saved per player in localStorage under `spg.v1`.

## Safe mode (what it is and is not)
A website cannot lock a device. Safe mode = fullscreen (or installed PWA), no external links anywhere, CSP that blocks any outside load, back button stays in the app, fullscreen-lost overlay, and every way out is behind the parent gate (spelled-out addition). The real lock is Android screen pinning, explained in the grown-ups panel.

## Voice
Every spoken prompt is a key in `LINES` (`js/core.js`). If `audio/voice/<key with / as ->.mp3` exists it plays, otherwise the browser's speech is used. `RECORDING.md` lists every line; regenerate it with `node tools/make-recording-list.mjs` after editing `LINES`.

## Testing notes
Verified with headless Chromium at tablet landscape and portrait: tracing with simulated drags, all four games, gate, back-button trapping, fullscreen-lost overlay, offline reload via the service worker. Not yet tested on the real Android tablet: touch feel, speech voice quality, install prompt, screen pinning. Do that first.

## Deploying
Cloudflare Workers serves the repo root as static assets via `wrangler.jsonc`; `.assetsignore` keeps handoff/tools/config out of the public site. Build command: `npx wrangler deploy`. Bump `CACHE` in `sw.js` if you ever need to force-clear old offline caches.

## Guidelines
Keep play relaxed and unlimited, no losing, no reading required, big touch targets. Don't repeat game mechanics across games. Add new games through the `SPG.games` list.
