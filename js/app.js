// App shell: players, hub, running a game, the parent gate and the grown-ups panel.
(() => {
  'use strict';
  const SPG = window.SPG;
  const { store, voice, safe, art } = SPG;
  const $ = id => document.getElementById(id);
  const screens = { who: $('who'), setup: $('setup'), hub: $('hub'), stage: $('stage') };
  const overlays = { gate: $('gate'), parent: $('parent'), fs: $('fs-resume') };
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
    current = name;
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
    voice.say({ say: `Hi ${p.name}!` }, 'welcome');
  }

  /* ------------------------------------------------------------ setup */
  let pickedAvatar = art.AVATARS[0];
  function openSetup(canCancel) {
    const pick = $('avatar-pick');
    const used = new Set(store.profiles.map(p => p.avatar));
    pickedAvatar = art.AVATARS.find(a => !used.has(a)) || art.AVATARS[0];
    pick.replaceChildren(...art.AVATARS.map(kind => {
      const b = h('button', { type: 'button', 'aria-label': kind, 'aria-pressed': String(kind === pickedAvatar) }, avatarCanvas(kind, 128));
      b.addEventListener('click', () => { pickedAvatar = kind; [...pick.children].forEach(x => x.setAttribute('aria-pressed', String(x === b))); SPG.sfx.tap(); });
      return b;
    }));
    $('name-input').value = '';
    $('setup-cancel').classList.toggle('hidden', !canCancel);
    show('setup');
    setTimeout(() => $('name-input').focus(), 60);
  }
  $('setup-cancel').addEventListener('click', renderWho);
  $('setup-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('name-input');
    const name = input.value.trim();
    if (!name) { input.focus(); input.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 250 }); return; }
    input.blur();
    choose(store.addProfile(name, pickedAvatar));
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
  $('hub-who').addEventListener('click', () => { voice.stop(); renderWho(); });
  $('hub-lock').addEventListener('click', () => askGate(openParent));

  const tints = { letters: ['#ffe3ec', '#f5b8cb'], fruit: ['#ffe9c7', '#f5c98a'], rain: ['#d8efff', '#a8d3f2'], garden: ['#dff5d0', '#a9d98f'] };
  function renderCards() {
    const games = SPG.games.slice().sort((a, b) => a.order - b.order);
    $('hub-games').replaceChildren(...games.map((g, i) => {
      const [tint, edge] = tints[g.id] || ['#fff', '#ddd'];
      const canvas = document.createElement('canvas');
      const card = h('button', { class: 'card', type: 'button', 'aria-label': g.name, style: `--tint:${tint};--edge:${edge};--d:${-i * 1.1}s` },
        canvas, h('span', { class: 'card-name' }, h('span', {}, g.name), h('span', { class: 'go' }, icon('play'))));
      card.addEventListener('click', () => openGame(g));
      card._draw = () => {
        const r = canvas.getBoundingClientRect();
        if (!r.width) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
        const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.icon(c, r.width, r.height);
      };
      return card;
    }));
    drawCards();
  }
  function drawCards() { $('hub-games').querySelectorAll('.card').forEach(c => c._draw && c._draw()); }

  /* ------------------------------------------------------------ games */
  function openGame(g) {
    voice.stop(); SPG.sfx.tap();
    show('stage');
    $('stage-stars').textContent = store.active.stars;
    const host = $('game-host');
    host.replaceChildren();
    running = { game: g, inst: null, paused: false };
    running.inst = g.create(host);
    running.inst.start?.();
    syncPause();
  }
  function closeGame() {
    if (!running) return;
    running.inst.destroy?.();
    running = null;
    voice.stop();
    $('game-host').replaceChildren();
    refreshHub();
    show('hub');
    requestAnimationFrame(drawCards);
  }
  $('btn-home').addEventListener('click', () => { SPG.sfx.tap(); closeGame(); });

  SPG.onStars = n => {
    for (const id of ['hub-stars', 'stage-stars']) {
      const el = $(id); el.textContent = n;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
  };

  /* ------------------------------------------------------------ parent gate */
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  let gateState = null;
  function askGate(onPass) {
    gateState = { onPass, entry: '' };
    newQuestion();
    openOverlay(overlays.gate);
  }
  function newQuestion() {
    const a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7);
    gateState.answer = String(a + b); gateState.entry = '';
    $('gate-q').textContent = `${WORDS[a]} plus ${WORDS[b]}`;
    $('gate-answer').textContent = '';
  }
  (() => {
    const pad = $('numpad');
    const key = (label, cls, fn) => { const b = h('button', { type: 'button', class: cls || '' }, label); b.addEventListener('click', () => { SPG.sfx.tap(); fn(); }); return b; };
    for (let n = 1; n <= 9; n++) pad.append(key(String(n), '', () => type(String(n))));
    pad.append(key(icon('back'), '', () => { gateState.entry = gateState.entry.slice(0, -1); paintAnswer(); }));
    pad.append(key('0', '', () => type('0')));
    pad.append(key(icon('check'), 'ok', submit));
    function type(d) { if (gateState.entry.length < 2) { gateState.entry += d; paintAnswer(); } }
    function paintAnswer() { $('gate-answer').textContent = gateState.entry; }
    function submit() {
      if (gateState.entry === gateState.answer) {
        const cb = gateState.onPass; gateState = null;
        closeOverlay(overlays.gate);
        cb && cb();
      } else {
        const box = $('gate-answer');
        box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
        SPG.sfx.oops(); setTimeout(newQuestion, 350);
      }
    }
  })();
  $('gate-cancel').addEventListener('click', () => { gateState = null; closeOverlay(overlays.gate); });

  /* ------------------------------------------------------------ grown-ups panel */
  let installPrompt = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });

  function openParent() { renderParent(); openOverlay(overlays.parent); }
  function closeParent() {
    closeOverlay(overlays.parent);
    if (!store.active) { store.profiles.length ? renderWho() : openSetup(false); }
    else refreshHub();
  }
  $('parent-close').addEventListener('click', closeParent);

  function toggle(label, key) {
    const sw = h('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(!!store.settings[key]), 'aria-label': label });
    sw.addEventListener('click', () => {
      store.settings[key] = !store.settings[key]; store.save();
      sw.setAttribute('aria-checked', String(store.settings[key]));
      if (store.settings[key]) { key === 'sound' ? SPG.sfx.chime() : voice.say({ say: 'Hello!' }); }
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

  function renderParent() {
    const body = $('parent-body');
    const fsNow = !!document.fullscreenElement;
    const fsBtn = h('button', { class: 'btn small', type: 'button' }, fsNow ? 'Leave full screen' : 'Go full screen');
    fsBtn.addEventListener('click', async () => { fsNow ? await safe.exitFullscreen() : await safe.enterFullscreen(); setTimeout(renderParent, 250); });

    const safeSection = h('section', {},
      h('h3', {}, 'Safe mode'),
      h('p', {}, 'The games never link to other websites. Full screen hides the address bar and tabs, and the back button stays inside the app. Only this grown-ups panel can change that.'),
      safe.standalone() ? h('p', { class: 'fine' }, 'Running as an installed app, which is already full screen.') : (safe.canFullscreen ? fsBtn : h('p', { class: 'fine' }, 'This browser cannot go full screen. Install the app from the browser menu instead.')));
    if (installPrompt) {
      const b = h('button', { class: 'btn small go', type: 'button', style: 'margin-top:8px' }, 'Install on this tablet');
      b.addEventListener('click', async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; b.remove(); });
      safeSection.append(b);
    }

    const players = h('section', {}, h('h3', {}, 'Players'));
    for (const p of store.profiles) {
      players.append(h('div', { class: 'player-row' },
        avatarCanvas(p.avatar, 104), h('div', { class: 'name' }, p.name, h('div', { class: 'stat' }, `${p.stars} stars`)),
        confirmButton('Reset progress', 'quiet', () => { p.stars = 0; p.data = {}; store.save(); renderParent(); }),
        confirmButton('Remove', 'danger', () => { store.removeProfile(p.id); renderParent(); })));
    }
    const add = h('button', { class: 'btn small go', type: 'button', style: 'margin-top:8px' }, icon('plus'), ' Add player');
    add.addEventListener('click', () => { closeOverlay(overlays.parent); openSetup(true); });
    players.append(add);

    body.replaceChildren(
      h('section', { style: 'border-top:0;padding-top:0' }, h('h3', {}, 'Sound'), toggle('Voice prompts', 'voice'), toggle('Sound effects', 'sound')),
      safeSection, players,
      h('section', {}, h('h3', {}, 'Locking the tablet properly'),
        h('p', {}, 'A website cannot stop a child using the tablet’s own buttons. For a true lock, use Android screen pinning together with full screen:'),
        h('ol', { class: 'steps' },
          h('li', {}, 'Settings → Security (or Security & privacy) → App pinning, and turn it on.'),
          h('li', {}, 'Open Sunny Play Garden, then open Recent apps.'),
          h('li', {}, 'Tap the app icon at the top of its card and choose Pin.'),
          h('li', {}, 'To unpin later, hold Back and Recent apps together (or swipe up and hold, depending on the tablet).'))),
      h('section', {}, h('h3', {}, 'Voice recordings'),
        h('p', {}, 'Prompts are spoken by the tablet’s built-in voice until you add recordings. See RECORDING.md in the project for the list of lines and where the files go.')));
  }

  /* ------------------------------------------------------------ safe mode wiring */
  safe.onBack = () => {
    if (!overlays.gate.classList.contains('hidden')) { gateState = null; closeOverlay(overlays.gate); return; }
    if (!overlays.parent.classList.contains('hidden')) { closeParent(); return; }
    if (!overlays.fs.classList.contains('hidden')) return;
    if (current === 'stage') closeGame();
    else if (current === 'setup' && store.profiles.length) renderWho();
  };
  safe.onFullscreenLost = () => openOverlay(overlays.fs);
  $('fs-play').addEventListener('click', () => { safe.enterFullscreen(); closeOverlay(overlays.fs); });

  document.addEventListener('visibilitychange', syncPause);
  let resizeTimer = 0;
  const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { running?.inst.resize?.(); drawCards(); }, 60); };
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);
  window.visualViewport?.addEventListener('resize', onResize);

  /* ------------------------------------------------------------ boot */
  safe.init();
  renderCards();
  if (store.profiles.length) { store.setActive(store.active?.id ?? store.profiles[0].id); renderWho(); } else openSetup(false);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  }
  SPG.app = { closeGame, show, running: () => running };
})();
