# Cloud backup: what it is and how to switch it on

## Where saving happens today
Everything is saved in the browser's `localStorage` on the device (not cookies, and not on any server). If a
device is reset, the browser's site data is cleared, or the app is uninstalled, that copy is gone. Two safety nets
now protect against that:

1. **Private cloud backup** (this page): a copy on your Cloudflare account, encrypted on the device.
2. **Backup file** and **Undo/Recently removed**: in Grown-ups, no internet needed.

## How the cloud backup works
- `worker/index.js` is a small Cloudflare Worker with one **Durable Object** per family (SQLite storage). It runs on
  the same address as the site (`/api/backup`), so the app's security rules do not change.
- A grown-up taps **Turn on cloud backup** in Grown-ups and gets a **family code** (20 letters and numbers).
  From the code the app derives an id and an AES-GCM key (PBKDF2, 120,000 rounds). Only the id and the encrypted data
  are sent, so the server (and you) cannot read names, progress or drawings, and a lost code cannot be recovered.
- **Sync now** downloads the cloud copy, merges it with the device (the newer copy of each player wins; every coloring
  picture keeps its newest version and its "finished" mark; owned pets are joined together), then uploads the result.
  It also happens in the background 25 seconds after changes, when the app is put away, and when the app opens.
- On a new device: first-run screen (or Grown-ups) > **I have a family code**. Nothing on that device is overwritten:
  players are merged, and **Undo the last restore or sync** puts the device back.
- Limits: 20 new backups per hour per network address, 200 saves per hour per family, about 1.8 MB per backup.
  A backup untouched for 400 days is deleted automatically.

## Turning it on (one time)
No dashboard steps or IDs are needed: `wrangler.jsonc` already declares the Durable Object and its migration.
Deploy as usual:

    npx wrangler deploy

(If your Cloudflare project builds from GitHub, the next build deploys it.) Then open the live site, go to
Grown-ups > **Turn on cloud backup**, and write the family code down. To check it is alive, visit
`/api/health` on your site: it should say `ok`.

The free Workers plan includes SQLite Durable Objects; a family's data is tiny, so the free limits are far away.

## Test it locally
    npm i -D wrangler          (once, anywhere)
    npx wrangler dev           (serves the site and the API on http://127.0.0.1:8787/)

## Privacy notes
`privacy.html` and the Play Data safety answers (see `PLAY-STORE-GUIDE.md`) describe this feature. If you would
rather not offer cloud backup at all, delete `js/sync.js`, `worker/`, the `durable_objects` and `migrations` blocks in
`wrangler.jsonc`, and the `backupSection()` call in `js/app.js`.
