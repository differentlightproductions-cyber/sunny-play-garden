// App shell: players, hub, running a game, the parent gate and the grown-ups panel.
(() => {
  'use strict';
  const SPG = window.SPG;
  const { store, voice, safe, art } = SPG;
  const $ = id => document.getElementById(id);
  const screens = { who: $('who'), setup: $('setup'), hub: $('hub'), stage: $('stage') };
  const overlays = { brk: $('break'), gate: $('gate'), parent: $('parent'), studio: $('studio'), fs: $('fs-resume'), vintro: $('vintro') };
  let current = 'who';
  let running = null;

  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v);
    }
    el.append(...kids.flat().filter(k => k != null));
    return el;
  };
  const icon = (id, cls = '') => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); if (cls) s.setAttribute('class', cls); s.innerHTML = `<use href="#i-${id}"/>`; return s; };

  function avatarCanvas(kind, px = 128) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = Math.round(px * dpr);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr); ctx.translate(px / 2, px * .6);
    art.avatar(ctx, kind, px * .34);
    return c;
  }

  function show(name) {
    current = name; document.body.dataset.screen = name;
    for (const [id, el] of Object.entries(screens)) el.classList.toggle('hidden', id !== name);
    if (name === 'hub') requestAnimationFrame(drawCards);
  }

  const anyOverlay = () => Object.values(overlays).some(o => !o.classList.contains('hidden'));
  function syncPause() {
    if (!running) return;
    const stop = anyOverlay() || document.hidden;
    if (stop === running.paused) return;
    running.paused = stop;
    running.inst[stop ? 'pause' : 'resume']?.();
  }
  const openOverlay = el => { el.classList.remove('hidden'); syncPause(); };
  const closeOverlay = el => { el.classList.add('hidden'); syncPause(); };

  /* ------------------------------------------------------------ who's playing */
  function renderWho() {
    $('install-hint').classList.toggle('hidden', !safe.needsInstallForFullscreen());
    const list = $('who-list');
    list.replaceChildren(...store.profiles.map(p => {
      const tile = h('button', { class: 'who-tile', type: 'button', 'aria-label': 'Play as ' + p.name }, avatarCanvas(p.avatar, 220), h('span', {}, p.name), h('span', { class: 'go-badge' }, icon('play')));
      tile.addEventListener('click', () => choose(p));
      return tile;
    }), h('button', { class: 'who-tile add', type: 'button', 'aria-label': 'Add a player', onclick: () => askGate(() => openSetup(true)) }, icon('plus')));
    show('who');
  }

  function choose(p) {
    safe.enterFullscreen();
    SPG.audio.unlock();
    store.setActive(p.id);
    refreshHub();
    show('hub');
    SPG.music.sync();
    voice.custom['player/' + p.id] = `Hi ${p.name}!`; voice.custom['pname/' + p.id] = p.name;
    if (!checkLimit()) voice.say('player/' + p.id, 'welcome');
  }

  /* ------------------------------------------------------------ setup */
  const NICKS = SPG.voice.PICK_NAMES.nicks;
  let pickedAvatar = art.AVATARS[0];
  let nickGrid = null;
  function openSetup(canCancel) {
    const pick = $('avatar-pick');
    const used = new Set(store.profiles.map(p => p.avatar));
    pickedAvatar = art.AVATARS.find(a => !used.has(a)) || art.AVATARS[0];
    pick.replaceChildren(...art.AVATARS.map(kind => {
      const b = h('button', { type: 'button', 'aria-label': kind, 'aria-pressed': String(kind === pickedAvatar) }, avatarCanvas(kind, 128));
      b.addEventListener('click', () => { pickedAvatar = kind; [...pick.children].forEach(x => x.setAttribute('aria-pressed', String(x === b))); SPG.sfx.tap(); });
      return b;
    }));
    $('setup-restore').classList.toggle('hidden', store.profiles.length > 0);
    $('name-input').value = ''; $('name-field').classList.add('hidden'); $('type-name').classList.remove('hidden');
    nickGrid = SPG.ui.nameGrid(NICKS, () => { $('name-input').value = ''; });
    $('nick-pick').replaceChildren(nickGrid);
    $('setup-cancel').classList.toggle('hidden', !canCancel);
    show('setup');
  }
  // Typing needs the keyboard, which is for grown-ups: the maths question comes first.
  SPG.ui.press($('type-name'), () => askGate(() => { $('type-name').classList.add('hidden'); $('name-field').classList.remove('hidden'); nickGrid && nickGrid.clear(); setTimeout(() => $('name-input').focus(), 80); }));
  $('setup-cancel').addEventListener('click', renderWho);
  $('setup-restore').addEventListener('click', () => askGate(openParent));
  $('setup-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('name-input');
    const name = input.value.trim() || (nickGrid && nickGrid.value) || '';
    if (!name) { const t = $('nick-pick'); t.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 250 }); SPG.sfx.oops(); return; }
    input.blur();
    const first = store.profiles.length === 0, p = store.addProfile(name, pickedAvatar);
    // the very first time, grown-ups are asked to choose the family voices (5-10 people) before play starts
    if (first && SPG.config.recorder && !store.settings.voiceIntroDone) {
      store.settings.voiceIntroDone = true; store.save();
      SPG.studio.intro($('vintro-body'), (act, id) => {
        closeOverlay(overlays.vintro); choose(p);
        if (act === 'record' && id) { SPG.studio.begin(id); openStudio(); }
      });
      openOverlay(overlays.vintro);
    } else choose(p);
  });

  /* ------------------------------------------------------------ hub */
  function refreshHub() {
    const p = store.active;
    if (!p) return;
    $('hub-name').textContent = p.name;
    $('hub-stars').textContent = p.stars;
    const av = $('hub-avatar'); const c = av.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, av.width, av.height);
    c.translate(32, 38); art.avatar(c, p.avatar, 22);
  }
  SPG.ui.press($('hub-who'), () => { voice.stop(); renderWho(); });
  SPG.ui.press($('hub-lock'), () => askGate(openParent));

  const tints = { letters: ['#ffe3ec', '#f5b8cb'], fruit: ['#ffe9c7', '#f5c98a'], rain: ['#d8efff', '#a8d3f2'], fire: ['#ffe1d6', '#f5a58f'], band: ['#ffe3f0', '#f2a9c9'], train: ['#e3f0ff', '#9cc5f0'], puzzle: ['#e6f7ec', '#98d4ae'], care: ['#fff0d9', '#f2c88c'], hide: ['#e8f6d8', '#a7d78a'], garden: ['#dff5d0', '#a9d98f'], color: ['#efe4ff', '#cdbcf7'], pets: ['#ffe8ef', '#f6b9cc'], style: ['#ffe3f1', '#f7a8cf'], aquarium: ['#d8f2ff', '#7fc8ec'] };
  function renderCards() {
    const all = SPG.games.slice().sort((a, b) => a.order - b.order);
    const games = all.filter(g => !g.shop), shops = all.filter(g => g.shop);
    const paint = (canvas, g) => () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.icon(c, r.width, r.height);
    };
    // Games look like little app icons: nine on tall screens, eight on small landscape screens, twelve on wider landscape screens.
    // Swipe, or use the big arrows and dots underneath.
    const PER_PAGE = hubPer = perPage(), pages = [];
    for (let i = 0; i < games.length; i += PER_PAGE) pages.push(games.slice(i, i + PER_PAGE));
    const strip = h('div', { class: 'pages' }, ...pages.map((list, pi) => h('div', { class: 'cards page', 'aria-label': `Page ${pi + 1} of ${pages.length}` }, ...list.map((g, k) => {
      const [tint, edge] = tints[g.id] || ['#fff', '#ddd'];
      const canvas = document.createElement('canvas');
      const card = h('button', { class: 'card', type: 'button', 'aria-label': g.name, style: `--tint:${tint};--edge:${edge};--d:${-(pi * PER_PAGE + k) * 1.1}s` },
        h('span', { class: 'lamp', 'aria-hidden': 'true' }), canvas, h('span', { class: 'card-name' }, g.name));
      // A swipe must turn the page, not start a game, so a card opens on a short tap (the browser cancels the touch when it becomes a swipe).
      let down = null;
      card.addEventListener('pointerdown', e => { if (e.button > 0) return; down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
      card.addEventListener('pointerup', e => {
        if (!down) return; const d = down; down = null;
        if (!strip._dragged && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 14 && performance.now() - d.t < 900) openGame(g);
      });
      for (const n of ['pointercancel', 'pointerleave']) card.addEventListener(n, () => { down = null; });
      card.addEventListener('click', e => { if (e.detail === 0) openGame(g); });   // keyboard / assistive tech
      card._draw = paint(canvas, g);
      return card;
    }))));
    const prev = h('button', { class: 'pg-arrow', type: 'button', 'aria-label': 'Previous page' }, icon('left'));
    const next = h('button', { class: 'pg-arrow', type: 'button', 'aria-label': 'Next page' }, icon('right'));
    const dots = h('div', { class: 'pg-dots' }, ...pages.map((_, i) => h('button', { class: 'pg-dot', type: 'button', 'aria-label': `Page ${i + 1}` })));
    const go = i => { const n = Math.max(0, Math.min(pages.length - 1, i)); strip.scrollTo({ left: n * strip.clientWidth, behavior: 'smooth' }); };
    const where = () => Math.max(0, Math.min(pages.length - 1, Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth))));
    const mark = () => {
      const i = where(); if (!hubFrozen) hubPage = i;
      prev.classList.toggle('off', i === 0); next.classList.toggle('off', i === pages.length - 1);
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    };
    SPG.ui.press(prev, () => { SPG.sfx.tap(); go(where() - 1); });
    SPG.ui.press(next, () => { SPG.sfx.tap(); go(where() + 1); });
    [...dots.children].forEach((d, k) => SPG.ui.press(d, () => { SPG.sfx.tap(); go(k); }));
    strip.addEventListener('scroll', () => { clearTimeout(strip._t); strip._t = setTimeout(mark, 60); }, { passive: true });
    // Touch swipes scroll natively; with a mouse (computer versions) dragging turns the page too.
    let md = null;
    strip.addEventListener('pointerdown', e => { strip._dragged = false; if (e.pointerType === 'mouse' && e.button === 0) md = { x: e.clientX, left: strip.scrollLeft, page: where(), moved: false }; });
    strip.addEventListener('pointermove', e => {
      if (!md) return; const dx = e.clientX - md.x;
      if (!md.moved && Math.abs(dx) > 8) { md.moved = true; strip._dragged = true; strip.style.scrollSnapType = 'none'; try { strip.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } }
      if (md.moved) strip.scrollLeft = md.left - dx;
    });
    const endDrag = e => { if (!md) return; const d = md; md = null; if (!d.moved) return; const dx = e.clientX - d.x; strip.style.scrollSnapType = ''; go(Math.abs(dx) > strip.clientWidth * .12 ? d.page + (dx < 0 ? 1 : -1) : d.page); };
    strip.addEventListener('pointerup', endDrag); strip.addEventListener('pointercancel', endDrag);
    strip._restore = () => { if (!strip.clientWidth) return; strip.scrollLeft = hubPage * strip.clientWidth; mark(); };
    $('hub-games').classList.toggle('single', pages.length < 2);
    $('hub-games').replaceChildren(strip, h('div', { class: 'pg-nav' }, prev, dots, next));
    mark();
    // Shops are not games: they get their own storefront under the games.
    $('hub-shop').replaceChildren(...shops.map(g => {
      const canvas = document.createElement('canvas');
      const front = h('button', { class: 'shopfront', type: 'button', 'aria-label': g.name }, canvas, h('span', { class: 'shop-sign' }, g.name));
      SPG.ui.press(front, () => openGame(g));
      front._draw = paint(canvas, g);
      return front;
    }));
    drawCards();
  }
  let hubPage = 0, hubPer = 8, hubFrozen = false;
  // Keep nine games on portrait screens; use the extra width of larger landscape screens for twelve at the same icon scale.
  const perPage = () => (matchMedia('(orientation: portrait)').matches && !matchMedia('(max-height: 520px)').matches ? 9 : matchMedia('(orientation: landscape) and (min-width: 850px)').matches ? 12 : 8);
  function drawCards() {
    const strip = document.querySelector('#hub-games .pages'); if (strip && strip._restore) strip._restore();
    document.querySelectorAll('#hub-games .card, #hub-shop .shopfront').forEach(c => c._draw && c._draw()); }

  /* ------------------------------------------------------------ games */
  function openGame(g) {
    voice.stop(); SPG.sfx.tap();
    show('stage');
    $('stage-stars').textContent = store.active.stars;
    const host = $('game-host');
    host.replaceChildren();
    document.body.classList.toggle('in-canvas', !g.dom);
    running = { game: g, inst: null, paused: false };
    running.inst = g.create(host);
    running.inst.start?.();
    syncPause();
  }
  function closeGame() {
    if (!running) return;
    running.inst.destroy?.();
    running = null; document.body.classList.remove('in-canvas');
    voice.stop();
    $('game-host').replaceChildren();
    refreshHub();
    show('hub');
    requestAnimationFrame(drawCards);
  }
  SPG.ui.press($('btn-home'), () => { SPG.sfx.tap(); closeGame(); });

  SPG.onStars = n => {
    for (const id of ['hub-stars', 'stage-stars']) {
      const el = $(id); el.textContent = n;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
  };

  /* ------------------------------------------------------------ parent gate */
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  let gateState = null;
  // The grown-up gate. With no PIN set it is the spelled-out sum; once a grown-up has set a PIN it is the PIN.
  async function hashPin(pin) {
    const text = 'spg-pin:' + pin;
    try { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(d)].map(v => v.toString(16).padStart(2, '0')).join(''); }
    catch (_) { let x = 5381; for (const ch of text) x = ((x << 5) + x + ch.charCodeAt(0)) >>> 0; return 'h' + x; }
  }
  function openGateSheet(title, hint, forgot) {
    $('gate-title').textContent = title; $('gate-hint').textContent = hint;
    $('gate-forgot').classList.toggle('hidden', !forgot);
    openOverlay(overlays.gate);
  }
  function askGate(onPass) {
    if (store.settings.pin) { askPin(onPass); return; }
    gateState = { onPass, entry: '', max: 2, mode: 'math' };
    newQuestion();
    openGateSheet('Grown-ups only', 'Answer to continue', false);
  }
  // PIN entry. With opts.capture the typed PIN is handed over (setting a new PIN) instead of being checked.
  function askPin(onPass, opts = {}) {
    gateState = { onPass, entry: '', max: 4, mode: 'pin', capture: opts.capture, prompt: opts.prompt || 'Type your PIN' };
    $('gate-q').textContent = gateState.prompt; paintGate();
    openGateSheet(opts.title || 'Grown-ups only', opts.hint || 'Type the PIN to continue', !opts.capture);
  }
  // A harder sum for a grown-up who forgot the PIN (a small child cannot do it). Two right in a row clears the PIN.
  function forgotPin() {
    const done = gateState && gateState.onPass; if (!done) return;
    gateState = { onPass: done, entry: '', max: 3, mode: 'recover', right: 0 };
    newRecover(); openGateSheet('Forgot the PIN?', 'Two sums in a row clear the PIN', false);
  }
  function newRecover() {
    const a = 21 + Math.floor(Math.random() * 60), b = 21 + Math.floor(Math.random() * 60);
    gateState.answer = String(a + b); gateState.entry = '';
    $('gate-q').textContent = `${a} + ${b}`; $('gate-answer').textContent = '';
  }
  function paintGate() {
    const g = gateState; if (!g) return;
    $('gate-answer').textContent = g.mode === 'pin' ? '●'.repeat(g.entry.length) + '○'.repeat(g.max - g.entry.length) : g.entry;
  }
  function newQuestion() {
    const a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7);
    gateState.answer = String(a + b); gateState.entry = '';
    $('gate-q').textContent = `${WORDS[a]} plus ${WORDS[b]}`;
    $('gate-answer').textContent = '';
  }
  (() => {
    const pad = $('numpad');
    const key = (label, cls, fn) => { const b = h('button', { type: 'button', class: cls || '' }, label); SPG.ui.press(b, () => { SPG.sfx.tap(); if (gateState) fn(); }); return b; };
    for (let n = 1; n <= 9; n++) pad.append(key(String(n), '', () => type(String(n))));
    pad.append(key(icon('back'), '', () => { gateState.entry = gateState.entry.slice(0, -1); paintGate(); }));
    pad.append(key('0', '', () => type('0')));
    pad.append(key(icon('check'), 'ok', () => submit()));
    function type(d) {
      const g = gateState; if (g.entry.length >= g.max || g.busy) return;
      g.entry += d; paintGate();
      if (g.mode === 'pin' && g.entry.length === g.max) submit();
    }
    function wrong() {
      const box = $('gate-answer');
      box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      SPG.sfx.oops();
    }
    async function submit() {
      const g = gateState; if (!g || g.busy) return;
      let ok;
      if (g.mode === 'pin') {
        if (g.capture) { const cap = g.onPass; gateState = null; closeOverlay(overlays.gate); cap(g.entry); return; }
        g.busy = true; ok = (await hashPin(g.entry)) === store.settings.pin; g.busy = false; if (gateState !== g) return;
      } else ok = g.entry === g.answer;
      if (g.mode === 'recover') {
        if (!ok) { wrong(); setTimeout(() => { if (gateState === g) { g.right = 0; newRecover(); } }, 350); return; }
        if (++g.right < 2) { SPG.sfx.chime(); newRecover(); return; }
        store.settings.pin = ''; store.save(); ok = true;
      }
      if (ok) {
        const cb = g.onPass; gateState = null;
        closeOverlay(overlays.gate);
        cb && cb();
      } else {
        wrong();
        if (g.mode === 'pin') setTimeout(() => { if (gateState === g) { g.entry = ''; paintGate(); } }, 350);
        else setTimeout(newQuestion, 350);
      }
    }
  })();
  SPG.ui.press($('gate-forgot'), forgotPin);
  SPG.ui.press($('gate-back'), () => { gateState = null; closeOverlay(overlays.gate); });

  /* ------------------------------------------------------------ grown-ups panel */
  let installPrompt = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });

  function openParent() { renderParent(); openOverlay(overlays.parent); }
  function closeParent() {
    closeOverlay(overlays.parent);
    if ((current === 'setup' || current === 'who') && store.profiles.length) { renderWho(); return; } // e.g. players were just restored from a backup
    if (!store.active) { store.profiles.length ? renderWho() : openSetup(false); }
    else { refreshHub(); checkLimit(); }
  }
  $('parent-close').addEventListener('click', closeParent);

  function openStudio() { SPG.studio.render($('studio-body')); openOverlay(overlays.studio); }
  function closeStudio() { SPG.studio.abort(); voice.stop(); closeOverlay(overlays.studio); renderParent(); }
  $('studio-close').addEventListener('click', closeStudio);

  function toggle(label, key) {
    const sw = h('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(!!store.settings[key]), 'aria-label': label });
    sw.addEventListener('click', () => {
      store.settings[key] = !store.settings[key]; store.save();
      sw.setAttribute('aria-checked', String(store.settings[key]));
      SPG.music.sync();
      if (store.settings[key] && (key === 'sound' || key === 'voice')) { key === 'sound' ? SPG.sfx.chime() : voice.say('hello'); }
    });
    return h('div', { class: 'setting' }, h('span', {}, label), sw);
  }

  function confirmButton(label, cls, action) {
    const b = h('button', { class: `btn small ${cls}`, type: 'button' }, label);
    let armed = false;
    b.addEventListener('click', () => {
      if (!armed) { armed = true; b.textContent = 'Tap again to confirm'; setTimeout(() => { armed = false; b.textContent = label; }, 3500); return; }
      action();
    });
    return b;
  }


  /* ------------------------------------------------------------ backups */
  let backupMsg = '';
  const SAY = {
    offline: 'No internet connection right now. Everything is still safe on this device; try again later.',
    failed: 'The backup service could not be reached. Everything is still safe on this device; try again later.',
    badcode: 'That code did not unlock a backup. Check it and try again.',
    notfound: 'No backup was found for that code. Check it and try again.',
    shape: 'A family code has 20 letters and numbers.',
    slow: 'Too many tries. Please wait a little and try again.',
    big: 'The backup is too large to send.',
    busy: 'Another device is saving right now. Try again in a moment.',
    notbackup: 'That file is not a Little Sprout Park backup.',
    nocode: 'Cloud backup is not turned on.'
  };
  function backupSection() {
    const sync = SPG.sync, info = sync.info();
    const say = t => { backupMsg = t; renderParent(); };
    const msg = () => backupMsg ? h('p', { class: 'note' }, backupMsg) : null;
    const sec = h('section', {}, h('h3', {}, 'Keep drawings and progress safe'));
    if (store.saveFailed) sec.append(h('p', { class: 'warn' }, 'This device could not save just now (storage may be full or blocked). Turn on the cloud backup or save a backup file so nothing is lost.'));
    const busyBtn = (label, cls, fn) => {
      const b = h('button', { class: `btn small ${cls}`, type: 'button' }, label);
      b.addEventListener('click', async () => { b.disabled = true; b.textContent = 'Working…'; await fn(); });
      return b;
    };
    if (!sync.supported()) sec.append(h('p', {}, 'Cloud backup needs a newer browser. You can still save a backup file below.'));
    else if (!info.on) {
      sec.append(h('p', {}, 'Turn on the cloud backup so players, stars and drawings come back if this device is reset, lost or replaced. It is private: everything is scrambled on the device before it is sent, and there are no emails or passwords, just a family code.'));
      const row = h('div', { class: 'btn-row' },
        busyBtn('Turn on cloud backup', 'go', async () => {
          const r = await sync.create();
          if (r.ok) { backupMsg = ''; showCode(r.code, true); } else say(SAY[r.error] || SAY.failed);
        }));
      const input = h('input', { type: 'text', maxlength: '32', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX' });
      const join = busyBtn('Restore from this code', 'go', async () => {
        const r = await sync.join(input.value);
        if (r.ok) { backupMsg = `Welcome back! Everything from the backup is here now${r.added ? ` (${r.added} player${r.added > 1 ? 's' : ''} restored)` : ''}${r.voices && r.voices.got ? `, and ${r.voices.got} recorded voice${r.voices.got > 1 ? 's' : ''}` : ''}.`; renderParent(); } else say(SAY[r.error] || SAY.failed);
      });
      sec.append(row, h('label', { class: 'field small-field' }, 'Already have a family code (for example from another device)?', input), join);
    } else {
      const when = info.last ? new Date(info.last).toLocaleString() : 'not yet';
      sec.append(h('p', {}, 'Cloud backup is on. ', h('span', { class: 'fine' }, `Last saved: ${when}`)),
        h('div', { class: 'btn-row' },
          busyBtn('Sync now', 'go', async () => { const r = await sync.syncNow(); say(r.ok ? 'Saved! Everything is backed up and up to date' + (r.voices && (r.voices.sent || r.voices.got) ? ` (voices: ${r.voices.sent} sent, ${r.voices.got} received).` : '.') : (SAY[r.error] || SAY.failed)); }),
          (() => { const b = h('button', { class: 'btn small', type: 'button' }, 'Show family code'); b.addEventListener('click', () => showCode(sync.code(), false)); return b; })(),
          confirmButton('Turn off and delete cloud copy', 'danger', async () => { const r = await sync.turnOff(); say(r.ok ? 'Cloud backup is off and the cloud copy was deleted. Your data is still on this device.' : (SAY[r.error] || SAY.failed)); })),
        h('p', { class: 'fine' }, 'Changes, including recorded voices, are also saved in the background whenever the device is online (recordings are encrypted first). To use the same players on another device, choose “I already have a family code” there.'));
    }
    // backup file
    const file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0]; if (!f) return;
      const r = sync.restoreFileText(await f.text());
      say(r.ok ? `Backup file restored (${r.total} player${r.total > 1 ? 's' : ''} here now). Nothing that was already here was lost.` : SAY[r.error]);
    });
    const save = h('button', { class: 'btn small', type: 'button' }, 'Save a backup file');
    save.addEventListener('click', () => {
      const blob = new Blob([sync.fileText()], { type: 'application/json' });
      SPG.native.saveFile(blob, sync.fileName(), 'application/json').then(ok => say(SPG.native.isApp ? (ok ? 'Choose where to keep the backup file.' : 'The backup file was not saved.') : 'Backup file saved to this device’s downloads.'));
    });
    const restore = h('button', { class: 'btn small quiet', type: 'button' }, 'Restore from a backup file');
    restore.addEventListener('click', () => file.click());
    sec.append(h('div', { class: 'btn-row' }, save, restore, file));
    const undo = store.undoInfo();
    if (undo) {
      const b = h('button', { class: 'btn small quiet', type: 'button' }, 'Undo the last restore or sync');
      b.addEventListener('click', () => { store.undoRestore(); say('Undone. This device is back to how it was before.'); });
      sec.append(h('p', { class: 'fine' }, `A copy of this device from ${new Date(undo.t).toLocaleString()} (${undo.players} player${undo.players === 1 ? '' : 's'}) is kept in case a restore was a mistake.`), b);
    }
    sec.append(msg());
    return sec;
  }
  function showCode(code, first) {
    const body = $('parent-body');
    const done = h('button', { class: 'btn small go', type: 'button' }, icon('check'), first ? ' I have written it down' : ' Done');
    done.addEventListener('click', renderParent);
    body.replaceChildren(h('section', { style: 'border-top:0;padding-top:0' },
      h('h3', {}, first ? 'Cloud backup is on' : 'Your family code'),
      h('div', { class: 'code-box' }, code),
      h('p', {}, first ? 'Write this code down or take a photo of it, and keep it somewhere safe. It is the only way to get the drawings and progress back on a new device, and nobody (including us) can look it up for you.' : 'Keep this code private. Anyone with it can restore this family’s players on another device.'),
      done));
  }

  function renderParent() {
    const body = $('parent-body');
    const fsNow = safe.isFullscreen();
    const fsBtn = h('button', { class: 'btn small', type: 'button' }, fsNow ? 'Leave full screen' : 'Go full screen');
    fsBtn.addEventListener('click', async () => { fsNow ? await safe.exitFullscreen() : await safe.enterFullscreen(); setTimeout(renderParent, 250); });

    const safeSection = h('section', {},
      h('h3', {}, 'Safe mode'),
      h('p', {}, 'The games never link to other websites. Full screen hides the address bar and tabs, and the back button stays inside the app. Only this grown-ups panel can change that.'),
      safe.standalone() ? h('p', { class: 'fine' }, 'Running as an installed app, which is already full screen.') : (safe.canFullscreen ? fsBtn : h('p', { class: 'fine' }, 'This browser cannot go full screen. Install the app from the browser menu instead.')));
    if (safe.isIOS && !safe.standalone()) {
      safeSection.append(h('p', {}, h('b', {}, 'Full screen on iPhone and iPad: ')), h('ol', { class: 'steps' },
        h('li', {}, 'In Safari, tap the Share button (the square with an arrow).'),
        h('li', {}, 'Choose \u201CAdd to Home Screen\u201D, then tap Add.'),
        h('li', {}, 'Open Little Sprout Park from your home screen. It opens full screen with no browser bars.')),
        h('p', { class: 'fine' }, 'To keep a child inside the app on iPhone/iPad, also turn on Guided Access: Settings \u2192 Accessibility \u2192 Guided Access, then triple-click the side (or Home) button while the app is open.'));
    }
    if (installPrompt) {
      const b = h('button', { class: 'btn small go', type: 'button', style: 'margin-top:8px' }, 'Install on this tablet');
      b.addEventListener('click', async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; b.remove(); });
      safeSection.append(b);
    }

    const players = h('section', {}, h('h3', {}, 'Players'));
    for (const p of store.profiles) {
      players.append(h('div', { class: 'player-row' },
        avatarCanvas(p.avatar, 104), h('div', { class: 'name' }, p.name, h('div', { class: 'stat' }, `${p.stars} stars`)),
        confirmButton('Reset progress', 'quiet', () => { store.resetProfile(p.id); renderParent(); }),
        confirmButton('Remove', 'danger', () => { store.removeProfile(p.id); renderParent(); })));
    }
    if (store.trash.length) {
      players.append(h('p', { class: 'fine', style: 'margin-top:10px' }, 'Recently removed or reset (nothing is lost right away):'));
      store.trash.forEach((item, i) => {
        const b = h('button', { class: 'btn small quiet', type: 'button' }, `Bring back ${item.p.name}`);
        b.addEventListener('click', () => { store.restoreTrash(i); renderParent(); });
        players.append(h('div', { class: 'player-row' }, h('div', { class: 'name' }, item.p.name, h('div', { class: 'stat' }, `${item.why === 'reset' ? 'Progress reset' : 'Removed'} ${new Date(item.t).toLocaleDateString()}`)), b));
      });
    }
    const add = h('button', { class: 'btn small go', type: 'button', style: 'margin-top:8px' }, icon('plus'), ' Add player');
    add.addEventListener('click', () => { closeOverlay(overlays.parent); openSetup(true); });
    players.append(add);

    body.replaceChildren(
      h('section', { style: 'border-top:0;padding-top:0' }, h('h3', {}, 'Sound'), toggle('Voice prompts', 'voice'), toggle('Sound effects', 'sound'), toggle('Soft background music', 'music'), toggle('Coloring Book music', 'colorMusic')),
      voicesSection(),
      timerSection(),
      pinSection(),
      nightSection(),
      fruitSection(),
      backupSection(),
      safeSection, players,
      h('section', {}, h('h3', {}, 'Locking the tablet properly'),
        h('p', {}, 'A website cannot stop a child using the tablet’s own buttons. For a true lock, use Android screen pinning together with full screen:'),
        h('ol', { class: 'steps' },
          h('li', {}, 'Settings → Security (or Security & privacy) → App pinning, and turn it on.'),
          h('li', {}, 'Open Little Sprout Park, then open Recent apps.'),
          h('li', {}, 'Tap the app icon at the top of its card and choose Pin.'),
          h('li', {}, 'To unpin later, hold Back and Recent apps together (or swipe up and hold, depending on the tablet).'))),
      h('section', {}, h('h3', {}, 'About'),
        h('p', {}, `Little Sprout Park version ${SPG.version}. No ads, no accounts, no tracking. Everything stays on this device.`),
        h('p', { class: 'fine' }, 'Names, stars, gardens, coloring pictures and any voice recordings are stored only on this device. Nothing is sent to anyone. The full privacy policy is at /privacy.html on this site.')),
      h('section', {}, h('h3', {}, 'Voice recordings'),
        h('p', {}, 'Prompts are spoken by the tablet’s built-in voice until you add recordings. See RECORDING.md in the project for the list of lines and where the files go.')));
  }

  /* ------------------------------------------------------------ daily play time */
  const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const playLog = () => {
    const s = store.settings;
    if (!s.playLog || s.playLog.day !== dayKey()) s.playLog = { day: dayKey(), sec: 0 };
    return s.playLog;
  };
  const limitReached = () => { const m = store.settings.timer || 0; return m > 0 && playLog().sec >= m * 60; };

  // The rest screen: the pets she owns dance under the moon while a soft lullaby plays (no owned pets: three friends dance).
  let restRaf = 0, restT = 0;
  function restCast() {
    const P = SPG.pets, own = P.PETS.filter(p => P.owns(p.id));
    const act = P.active();
    let list = own.map(p => ({ id: p.id, hat: (store.bag('pets', () => ({ owned: {} })).owned[p.id] || {}).hat || null, face: (store.bag('pets', () => ({ owned: {} })).owned[p.id] || {}).face || null, neck: (store.bag('pets', () => ({ owned: {} })).owned[p.id] || {}).neck || null }));
    if (!list.length) list = ['bunny', 'cat', 'bear'].map(id => ({ id, hat: null }));
    return list.slice(0, 6);
  }
  function drawRest(t, cast) {
    const cv = $('break-art'), c = cv.getContext('2d'), w = cv.width, h = cv.height;
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { const x = ((i * 137) % 100) / 100 * w, y = ((i * 71) % 60) / 100 * h, tw = .5 + Math.sin(t * 2 + i) * .5; c.globalAlpha = .35 + tw * .65; art.star(c, x, y, (3 + (i % 3) * 2) * (w / 700), '#fff3b0'); }
    c.globalAlpha = 1;
    { const cx = w * .84, cy = h * .2, r = h * .12;   // a crescent moon
      c.save(); c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.arc(cx + r * .45, cy - r * .2, r * .85, 0, Math.PI * 2);
      c.fillStyle = '#fff3c4'; c.fill('evenodd'); c.restore(); }
    const n = cast.length, s = Math.min(h * .55, w / (n + .6) * 1.05);
    cast.forEach((p, i) => {
      const x = w * (.5 + (i - (n - 1) / 2) * (1 / (n + .5))), ph = (t * .8 + i * .17) % 1;
      c.fillStyle = 'rgba(20,20,60,.25)'; c.beginPath(); c.ellipse(x, h * .885, s * .3, s * .04, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(x, h * .88);
      c.rotate(Math.sin(t * 2.4 + i * 1.3) * .07);
      SPG.pets.draw(c, p.id, s, t + i * .7, { mood: ph < .5 ? 'cheer' : 'happy', hop: ph < .5 ? ph * 2 : 0, hat: p.hat, face: p.face, neck: p.neck });
      c.restore();
    });
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let k = 0; k < 4; k++) { const u = ((t * .35 + k * .25) % 1); c.globalAlpha = Math.sin(u * Math.PI); c.fillStyle = ['#ffb3c6', '#b8e6ff', '#fff3b0', '#d9c2f2'][k]; c.font = `700 ${h * .09}px Fredoka, system-ui`; c.fillText(k % 2 ? '\u266b' : '\u266a', w * (.2 + k * .2) + Math.sin(t + k) * 10, h * (.55 - u * .3)); }
    c.globalAlpha = 1;
  }
  function startRest() {
    const cast = restCast(), cv = $('break-art');
    cancelAnimationFrame(restRaf);
    const frame = () => { restT += 1 / 60; drawRest(restT, cast); restRaf = requestAnimationFrame(frame); };
    frame();
    SPG.music.rest(true);
  }
  function stopRest() { cancelAnimationFrame(restRaf); restRaf = 0; SPG.music.rest(false); }
  function showBreak() {
    if (!overlays.brk.classList.contains('hidden')) return;
    voice.say('break-time'); openOverlay(overlays.brk); startRest();
  }
  // Returns true if the rest screen is now showing.
  function checkLimit() {
    if (!limitReached() || (current !== 'hub' && current !== 'stage')) return false;
    showBreak(); return true;
  }
  SPG.ui.press($('break-adult'), () => askGate(() => { stopRest(); closeOverlay(overlays.brk); openParent(); }));
  setInterval(() => {
    if (document.hidden || (current !== 'hub' && current !== 'stage') || anyOverlay()) return;
    playLog().sec++; store.save();
    if (limitReached()) showBreak();
  }, 1000);

  function voicesSection() {
    const keys = voice.allKeys();
    const n = set => keys.filter(k => voice.hasClip(set, k)).length;
    const b = h('button', { class: 'btn small go', type: 'button' }, 'Record and choose voices');
    b.addEventListener('click', openStudio);
    return h('section', {}, h('h3', {}, 'Voices'),
      h('p', {}, 'Record your own voice for the games (a male and a female voice can be mixed), switch off lines you don\u2019t want, and choose how often the games cheer.'),
      h('p', { class: 'fine' }, `Recorded so far: male ${n('male')}, female ${n('female')} of ${keys.length} lines.`), b);
  }

  // Fruit Splash for older kids: naughty water balloons that shake the screen, spray water and take points away.
  function nightSection() {
    const cur = SPG.night.mode();
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Night mode' });
    for (const [id, label] of [['off', 'Day'], ['on', 'Night'], ['auto', 'Auto (schedule)']]) {
      const b = h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(cur === id) }, label);
      b.addEventListener('click', () => { SPG.night.set(id); renderParent(); });
      seg.append(b);
    }
    const sec = h('section', {}, h('h3', {}, 'Night mode'),
      h('p', {}, 'Tones everything down for bedtime: a night sky behind the games, softer colors and quieter sounds. Choose Day or Night yourself, or Auto to switch on by a schedule. There is also a moon button on the games page.'),
      seg);
    if (cur === 'auto') {
      const hourLabel = n => (n % 12 || 12) + (n < 12 ? ' am' : ' pm');
      const picker = (title, key, hours, def) => {
        const row = h('div', { class: 'seg', role: 'group', 'aria-label': title });
        const now = key === 'nightFrom' ? SPG.night.from() : SPG.night.to();
        for (const n of hours) {
          const b = h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(now === n) }, hourLabel(n));
          b.addEventListener('click', () => { store.settings[key] = n; store.save(); SPG.night.apply(); renderParent(); });
          row.append(b);
        }
        return h('div', {}, h('p', {}, h('b', {}, title)), row);
      };
      sec.append(picker('Night starts at', 'nightFrom', [17, 18, 19, 20, 21], 19), picker('Night ends at', 'nightTo', [5, 6, 7, 8, 9], 7),
        h('p', {}, `Right now: ${SPG.night.on() ? 'night' : 'day'}. Night runs from ${hourLabel(SPG.night.from())} to ${hourLabel(SPG.night.to())}.`));
    }
    return sec;
  }

  function fruitSection() {
    const cur = store.settings.fruitAge === 'big' ? 'big' : 'little';
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Fruit Splash age' });
    for (const [id, label] of [['little', 'Little kids'], ['big', 'Bigger kids']]) {
      const b = h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(cur === id) }, label);
      b.addEventListener('click', () => { store.settings.fruitAge = id; store.save(); renderParent(); });
      seg.append(b);
    }
    return h('section', {}, h('h3', {}, 'Fruit Splash age'),
      h('p', {}, 'Little kids: only happy fruit, nothing is ever lost. Bigger kids: water balloons float up too. Popping one shakes the screen, splashes water everywhere and takes 5 fruit points away (never stars).'),
      seg);
  }

  function pinSection() {
    const has = !!store.settings.pin;
    const set = h('button', { class: 'btn small go', type: 'button' }, has ? 'Change PIN' : 'Set a PIN');
    const setNew = () => askPin(first => askPin(again => {
      if (again !== first) { SPG.sfx.oops(); pinNote = 'Those two did not match. Please try again.'; renderParent(); return; }
      hashPin(first).then(hx => { store.settings.pin = hx; store.save(); pinNote = 'PIN saved. Remember it: it opens the rest screen and this panel.'; renderParent(); });
    }, { capture: true, title: 'Type it again', prompt: 'Type the same PIN again', hint: 'Just to be sure' }), { capture: true, title: has ? 'New PIN' : 'Choose a PIN', prompt: 'Choose 4 numbers', hint: 'Pick numbers only you know' });
    set.addEventListener('click', () => { if (has) askPin(setNew); else setNew(); });
    const kids = [set];
    if (has) {
      const off = h('button', { class: 'btn small quiet', type: 'button' }, 'Remove PIN');
      off.addEventListener('click', () => askPin(() => { store.settings.pin = ''; store.save(); pinNote = 'PIN removed. The grown-up question is used again.'; renderParent(); }));
      kids.push(off);
    }
    const note = pinNote; pinNote = '';
    return h('section', {}, h('h3', {}, 'Grown-up PIN'),
      h('p', {}, has ? 'A PIN is set. It is needed to close the rest screen and to open this panel.' : 'No PIN yet: a spelled-out sum is used to keep little fingers out. Set a 4-number PIN for a stronger lock on the rest screen and this panel.'),
      h('div', { class: 'row' }, ...kids), note ? h('p', { class: 'fine' }, note) : null);
  }
  let pinNote = '';

  function timerSection() {
    const cur = store.settings.timer || 0;
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Daily play time' });
    for (const m of [0, 15, 30, 45, 60]) {
      const b = h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(cur === m) }, m ? `${m} min` : 'No limit');
      b.addEventListener('click', () => { store.settings.timer = m; store.save(); renderParent(); });
      seg.append(b);
    }
    const used = Math.floor(playLog().sec / 60);
    const reset = h('button', { class: 'btn small quiet', type: 'button' }, 'Give more time today');
    reset.addEventListener('click', () => { playLog().sec = 0; store.save(); renderParent(); });
    return h('section', {}, h('h3', {}, 'Play time'),
      h('p', {}, 'When the daily limit is reached, a friendly rest screen appears. It can only be closed by a grown-up.'),
      seg, h('p', { class: 'fine' }, `Played today: ${used} min`), reset);
  }

  /* ------------------------------------------------------------ safe mode wiring */
  safe.onBack = () => {
    if (!overlays.gate.classList.contains('hidden')) { gateState = null; closeOverlay(overlays.gate); return; }
    if (!overlays.vintro.classList.contains('hidden')) return;
    if (!overlays.studio.classList.contains('hidden')) { closeStudio(); return; }
    if (!overlays.parent.classList.contains('hidden')) { closeParent(); return; }
    if (!overlays.fs.classList.contains('hidden') || !overlays.brk.classList.contains('hidden')) return;
    if (current === 'stage') { if (!running.inst.back || !running.inst.back()) closeGame(); }
    else if (current === 'setup' && store.profiles.length) renderWho();
  };
  safe.onFullscreenLost = () => openOverlay(overlays.fs);
  $('fs-play').addEventListener('click', () => { safe.enterFullscreen(); closeOverlay(overlays.fs); });

  document.addEventListener('visibilitychange', syncPause);
  let resizeTimer = 0;
  const onResize = () => { hubFrozen = true; clearTimeout(resizeTimer); resizeTimer = setTimeout(() => {
    running?.inst.resize?.();
    // Turning the phone changes how many fit on a page: rebuild while keeping the same page number.
    if (perPage() !== hubPer && $('hub-games').firstChild) renderCards();
    drawCards();
    setTimeout(() => { hubFrozen = false; }, 150);
  }, 60); };
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);
  window.visualViewport?.addEventListener('resize', onResize);

  /* ------------------------------------------------------------ boot */
  safe.init();
  SPG.night.apply(); setInterval(() => SPG.night.apply(), 60000);
  renderCards();
  if (store.profiles.length) { store.setActive(store.active?.id ?? store.profiles[0].id); renderWho(); } else openSetup(false);
  if ('serviceWorker' in navigator && !(SPG.native && SPG.native.isApp) && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  }
  SPG.app = { closeGame, show, running: () => running, askGate, askPin };
})();
