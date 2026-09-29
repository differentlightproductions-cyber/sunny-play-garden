# Handoff

Sunny Play Garden is a static, dependency-free site. Open `index.html` directly or publish this folder on any static host. The hub and navigation are in `app.js`; Fruit Splash gameplay is in `games/fruit-slice.js`.

The first game has unlimited play, pointer-based swipe slicing, score, pause/restart/home, and fullscreen where the browser supports it. Desktop mouse, emulated phone touch, and emulated tablet touch in portrait and landscape passed. Physical iPad/Safari testing is still needed.

If continuing work, test on her actual tablet first. Keep infinite play relaxed and preserve the large touch controls. Add future games through the small `games` list in `app.js`.

Cloudflare Workers serves the site as static assets using `wrangler.jsonc`; `.assetsignore` keeps the handoff and deployment files out of the public site. The intended Cloudflare build command is `npx wrangler deploy` from the repository root.
