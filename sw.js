// Offline support: the whole site is cached so it keeps working with no internet once opened.
// Network first (so a new deploy shows up right away), cache as the fallback.
const CACHE = 'spg-v1';
const SHELL = [
  './', 'styles.css', 'manifest.webmanifest',
  'js/glyphs.js', 'js/core.js', 'js/art.js', 'js/app.js',
  'games/letters.js', 'games/fruit.js', 'games/rain.js', 'games/garden.js',
  'fonts/fredoka-latin-400-normal.woff2', 'fonts/fredoka-latin-600-normal.woff2', 'fonts/fredoka-latin-700-normal.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./')))
  );
});
