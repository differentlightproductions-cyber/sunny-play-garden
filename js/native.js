// The bridge to the Android app (Capacitor). On the website none of this does anything: `SPG.native.isApp` is false and
// every helper falls back to what the browser does. Inside the Android app the game files are on the phone (no website),
// and this file covers the few things a bare WebView cannot do on its own: saving a file, the back button, and where the
// optional cloud backup lives.
(() => {
  const SPG = window.SPG = window.SPG || { games: [] };
  const cap = window.Capacitor;
  const isApp = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const plugins = () => (cap && cap.Plugins) || {};
  const N = SPG.native = {
    isApp,
    // Where /api/backup lives. The website uses its own address; the app needs the full address (set when the app is built).
    apiBase: isApp ? ((window.SPG_APP && window.SPG_APP.api) || '') : '',
    // Saves a Blob as a file the grown-up can keep: on the website a normal download, in the app the phone's share sheet
    // (save to Photos or Files, send by message, ...). Resolves true if it went through.
    async saveFile(blob, name, mime) {
      if (isApp) {
        try {
          const { Filesystem, Share } = plugins();
          const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
          const w = await Filesystem.writeFile({ path: name, data, directory: 'CACHE', recursive: true });
          await Share.share({ title: name, url: w.uri, dialogTitle: 'Save or share' });
          return true;
        } catch (e) { return !!(e && /cancel|dismiss/i.test(String(e.message || e))) ? false : false; }
      }
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; a.style.display = 'none'; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return true;
    },
    // Puts a picture straight into the device's own photos, with no questions (only used when a grown-up allowed it).
    // In the app: an album called "Sprout Park" in the phone's gallery (@capacitor-community/media, no storage permission needed).
    // On the website: a normal download (it shows in Downloads); on iPhone/iPad a download needs a grown-up, so nothing happens.
    async saveToGallery(blob, name) {
      if (isApp) {
        try {
          const { Media } = plugins(); if (!Media) return false;
          const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(blob); });
          const find = async () => (((await Media.getAlbums()) || {}).albums || []).find(al => al.name === 'Sprout Park');
          let album = await find(); if (!album) { try { await Media.createAlbum({ name: 'Sprout Park' }); } catch (_) { /* it may exist already */ } album = await find(); }
          if (!album) return false;
          await Media.savePhoto({ path: data, albumIdentifier: album.identifier, fileName: name.replace(/\.\w+$/, '') });
          return true;
        } catch (_) { return false; }
      }
      if (SPG.safe && SPG.safe.isIOS) return false;
      return N.saveFile(blob, name, blob.type || 'image/jpeg');
    }
  };
  // The Android back button goes to the same place the browser's back button did: SPG.safe.onBack.
  if (isApp) {
    const App = plugins().App;
    if (App && App.addListener) App.addListener('backButton', () => { if (SPG.safe && SPG.safe.onBack) SPG.safe.onBack(); });
    // An old copy of the website's offline cache has no use inside the app.
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) navigator.serviceWorker.getRegistrations().then(l => l.forEach(r => r.unregister())).catch(() => {});
  }
})();
