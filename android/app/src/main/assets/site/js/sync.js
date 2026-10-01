// Backups for grown-ups: an optional encrypted cloud copy (Cloudflare, see worker/index.js) and backup files.
//
// How the cloud copy works, in plain words:
// - A grown-up turns it on and gets a "family code" (20 letters and numbers). There is no email or password.
// - The code never leaves the device. From it the app makes (1) a lookup id and (2) an encryption key.
//   Only the lookup id and encrypted data are sent, so the server cannot read names, progress or drawings.
// - "Sync now" downloads the cloud copy, merges it with this device (newer wins per player, nothing a child
//   finished is lost), then uploads the result. It also happens quietly in the background after changes.
// - On a new device, enter the same code to get everything back.
(() => {
  const SPG = window.SPG, store = SPG.store;
  const KEY = 'spg.sync';
  const API = '/api/backup';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // no I, L, O or U: easy to read out and write down

  /* ------------------------------------------------------------ this device's settings for the cloud copy */
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const keep = patch => { const s = Object.assign(load(), patch); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) { /* ignore */ } return s; };

  /* ------------------------------------------------------------ code and keys */
  const normalize = text => String(text || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
  const pretty = code => code.match(/.{1,5}/g).join('-');
  const validCode = code => code.length === 20 && [...code].every(ch => ALPHABET.includes(ch));
  const makeCode = () => { const b = crypto.getRandomValues(new Uint8Array(20)); return [...b].map(v => ALPHABET[v & 31]).join(''); };
  const hex = bytes => [...bytes].map(v => v.toString(16).padStart(2, '0')).join('');
  const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = str => Uint8Array.from(atob(str), ch => ch.charCodeAt(0));

  async function deriveKeys(code) {
    const base = await crypto.subtle.importKey('raw', enc.encode('spg1:' + code), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('little-sprout-park/backup/v1'), iterations: 120000 }, base, 512));
    return { id: hex(bits.slice(0, 32)), key: await crypto.subtle.importKey('raw', bits.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']) };
  }
  async function squash(bytes) {
    if (typeof CompressionStream === 'undefined') return { flag: 0, bytes };
    try { return { flag: 1, bytes: new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()) }; } catch (_) { return { flag: 0, bytes }; }
  }
  async function unsquash(bytes) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()); }
  async function seal(key, text) {
    const { flag, bytes } = await squash(enc.encode(text)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
    const out = new Uint8Array(1 + 12 + ct.length); out[0] = flag; out.set(iv, 1); out.set(ct, 13);
    return b64(out);
  }
  async function open(key, blob) {
    const raw = unb64(blob), plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(1, 13) }, key, raw.slice(13)));
    return dec.decode(raw[0] === 1 ? await unsquash(plain) : plain);
  }

  /* ------------------------------------------------------------ talking to the server */
  async function api(method, id, body) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
    try {
      return await fetch(API, { method, headers: Object.assign({ 'X-Family': id }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: ctl.signal });
    } finally { clearTimeout(timer); }
  }
  const fail = (code, extra) => Object.assign({ ok: false, error: code }, extra);
  const problem = e => (e && e.name === 'AbortError') || !navigator.onLine || e instanceof TypeError ? fail('offline') : fail('failed');

  let busy = null, pushTimer = 0, lastRev = -1;
  const status = { syncing: false, error: null };
  const listeners = new Set();
  const tell = () => listeners.forEach(fn => fn(sync.info()));

  // Download, merge, upload. Repeats if another device saved in between.
  function run() {
    if (busy) return busy;
    busy = (async () => {
      const st = load(); if (!st.code) return fail('nocode');
      status.syncing = true; tell();
      try {
        const { id, key } = await deriveKeys(st.code);
        for (let attempt = 0; attempt < 4; attempt++) {
          const got = await api('GET', id);
          let rev = 0, added = 0;
          if (got.status === 200) {
            const j = await got.json(); rev = j.rev;
            let remote; try { remote = JSON.parse(await open(key, j.blob)); } catch (_) { return fail('badcode'); }
            added = store.mergeProfiles(remote.profiles).added;
          } else if (got.status !== 404) return fail('failed');
          const sealed = await seal(key, JSON.stringify({ v: 1, t: Date.now(), profiles: store.exportProfiles() }));
          const put = await api('PUT', id, { rev, blob: sealed });
          if (put.status === 200) { const j = await put.json(); lastRev = store.rev; keep({ rev: j.rev, last: Date.now() }); status.error = null; return { ok: true, added }; }
          if (put.status === 409) continue;
          if (put.status === 429) return fail('slow');
          if (put.status === 413) return fail('big');
          return fail('failed');
        }
        return fail('busy');
      } catch (e) { return problem(e); }
      finally { status.syncing = false; }
    })().then(r => { busy = null; status.error = r.ok ? null : r.error; tell(); return r; });
    return busy;
  }

  const sync = SPG.sync = {
    supported: () => !!(window.crypto && crypto.subtle && typeof fetch === 'function'),
    on: () => !!load().code,
    code: () => { const c = load().code; return c ? pretty(c) : ''; },
    info: () => ({ on: !!load().code, last: load().last || 0, syncing: status.syncing, error: status.error }),
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    normalize, pretty, validCode,

    // Turn the cloud copy on for this family and upload what is here now.
    async create() {
      const code = makeCode();
      keep({ code, rev: 0, last: 0 });
      const r = await run();
      if (!r.ok) keep({ code: '', rev: 0 });
      return r.ok ? { ok: true, code: pretty(code) } : r;
    },
    // Connect to an existing family with its code and bring its data here.
    async join(text) {
      const code = normalize(text);
      if (!validCode(code)) return fail('shape');
      try {
        const { id, key } = await deriveKeys(code);
        const got = await api('GET', id);
        if (got.status === 404) return fail('notfound');
        if (got.status !== 200) return fail('failed');
        try { await open(key, (await got.json()).blob); } catch (_) { return fail('badcode'); }
      } catch (e) { return problem(e); }
      keep({ code, rev: 0, last: 0 });
      const r = await run();
      if (!r.ok) keep({ code: '' });
      return r;
    },
    syncNow() { return run(); },
    // Stop syncing and delete the cloud copy.
    async turnOff() {
      const st = load();
      if (st.code) { try { const { id } = await deriveKeys(st.code); const r = await api('DELETE', id); if (!r.ok && r.status !== 204) return fail('failed'); } catch (e) { return problem(e); } }
      keep({ code: '', rev: 0, last: 0 }); status.error = null; tell();
      return { ok: true };
    },
    // Stop syncing on this device only (the cloud copy stays for the other devices).
    forget() { keep({ code: '', rev: 0, last: 0 }); tell(); },

    /* -------------------------------------------------------- backup files */
    fileText() { return JSON.stringify({ app: 'little-sprout-park', v: 1, saved: Date.now(), profiles: store.exportProfiles() }); },
    fileName() { const d = new Date(); return `little-sprout-park-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`; },
    restoreFileText(text) {
      let j; try { j = JSON.parse(text); } catch (_) { return fail('notbackup'); }
      if (!j || j.app !== 'little-sprout-park' || !Array.isArray(j.profiles)) return fail('notbackup');
      return Object.assign({ ok: true }, store.mergeProfiles(j.profiles));
    }
  };

  // Quiet background saving: a little after the last change, and again when the app is put away.
  if (sync.supported()) {
    const later = ms => { clearTimeout(pushTimer); pushTimer = setTimeout(() => { if (load().code && navigator.onLine && lastRev !== store.rev) run(); }, ms); };
    store.onChange = () => { if (load().code) later(25000); };
    document.addEventListener('visibilitychange', () => { if (document.hidden && load().code && lastRev !== store.rev && navigator.onLine) { store.flush(); run(); } });
    addEventListener('online', () => { if (load().code) later(2000); });
    setTimeout(() => { if (load().code && navigator.onLine) run(); }, 4000); // catch up when the app opens
  }
})();
