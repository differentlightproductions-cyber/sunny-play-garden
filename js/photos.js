// Photos a child takes in the games (the camera button in Sprout Kitchen). They are kept on this device for each player in
// IndexedDB ('spg-photos'), newest first, at most MAX each (the oldest go first). They are not part of the cloud backup.
// If a grown-up allows it (Grown-ups > Kitchen photos, settings.photoSave), each new photo is also saved to the device's own photos
// (SPG.native.saveToGallery: the phone's gallery in the Android app, a download on the website).
(() => {
  const SPG = window.SPG, MAX = 60;
  let dbp = null;
  const open = () => dbp || (dbp = new Promise(res => {
    try {
      const rq = indexedDB.open('spg-photos', 1);
      rq.onupgradeneeded = () => { const st = rq.result.createObjectStore('photos', { keyPath: 'id', autoIncrement: true }); st.createIndex('pid', 'pid'); };
      rq.onsuccess = () => res(rq.result); rq.onerror = rq.onblocked = () => res(null);
    } catch (_) { res(null); }
  }));
  const tx = async (mode, fn) => {
    const db = await open(); if (!db) return null;
    return new Promise(res => { try { const t = db.transaction('photos', mode), rq = fn(t.objectStore('photos')); t.oncomplete = () => res(rq ? rq.result : true); t.onerror = t.onabort = () => res(null); } catch (_) { res(null); } });
  };
  const P = SPG.photos = {
    // [{ id, pid, t, blob, recipe, name }] for one player, newest first
    async list(pid) { return ((await tx('readonly', st => st.index('pid').getAll(pid))) || []).sort((a, b) => b.t - a.t); },
    async add(pid, blob, meta = {}) {
      const id = await tx('readwrite', st => st.add(Object.assign({ pid, t: Date.now(), blob }, meta)));
      for (const old of (await P.list(pid)).slice(MAX)) await P.remove(old.id);
      if (SPG.store.settings.photoSave && SPG.native && SPG.native.saveToGallery) SPG.native.saveToGallery(blob, 'sprout-park-' + new Date().toISOString().slice(0, 19).replace(/\D/g, '') + '.jpg').catch(() => {});
      return id;
    },
    remove(id) { return tx('readwrite', st => st.delete(id)); },
    async count() { return (await tx('readonly', st => st.count())) || 0; },
    clear() { return tx('readwrite', st => st.clear()); }
  };
})();
