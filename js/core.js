// Core services: player storage, synthesized sound effects, voice prompts, and safe mode.
(() => {
  const SPG = window.SPG = window.SPG || { games: [] };
  const KEY = 'spg.v1';

  /* ---------------------------------------------------------------- store */
  SPG.store = (() => {
    const fresh = () => ({ v: 1, profiles: [], activeId: null, settings: { voice: true, sound: true, music: false, timer: 0, playLog: { day: '', sec: 0 } } });
    let data = fresh();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { data = Object.assign(fresh(), JSON.parse(raw)); data.settings = Object.assign(fresh().settings, data.settings); }
    } catch (_) { /* private mode or blocked storage: play on without saving */ }
    let timer = 0;
    const flush = () => {
      clearTimeout(timer); timer = 0;
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { /* ignore */ }
    };
    const save = () => { if (!timer) timer = setTimeout(flush, 350); };
    addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

    const store = {
      save, flush,
      get settings() { return data.settings; },
      get profiles() { return data.profiles; },
      get active() { return data.profiles.find(p => p.id === data.activeId) || null; },
      setActive(id) { data.activeId = id; save(); },
      addProfile(name, avatar) {
        const p = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name.trim().slice(0, 16), avatar, stars: 0, data: {} };
        data.profiles.push(p); data.activeId = p.id; save();
        return p;
      },
      removeProfile(id) {
        data.profiles = data.profiles.filter(p => p.id !== id);
        if (data.activeId === id) data.activeId = data.profiles[0]?.id ?? null;
        save();
      },
      addStars(n = 1) {
        const p = store.active; if (!p) return;
        p.stars += n; save();
        SPG.onStars && SPG.onStars(p.stars);
      },
      // A named bucket of saved data for the active player, e.g. bag('garden', () => ({...})).
      bag(name, init) {
        const p = store.active;
        if (!p) return init();
        p.data = p.data || {};
        if (!p.data[name]) p.data[name] = init();
        return p.data[name];
      }
    };
    return store;
  })();

  /* ---------------------------------------------------------------- audio */
  const A = SPG.audio = {
    ctx: null, master: null,
    unlock() {
      if (!A.ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        A.ctx = new C();
        A.master = A.ctx.createGain();
        A.master.gain.value = .85;
        A.master.connect(A.ctx.destination);
      }
      if (A.ctx.state === 'suspended') A.ctx.resume();
    }
  };

  function tone(freq, dur, { type = 'sine', vol = .22, slide = 0, at = 0 } = {}) {
    const c = A.ctx;
    if (!c || !SPG.store.settings.sound) return;
    const t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(A.master);
    o.start(t); o.stop(t + dur + .05);
  }

  let noiseBuf = null;
  function noise(dur, { freq = 1500, q = .8, vol = .18, at = 0, sweep = 0 } = {}) {
    const c = A.ctx;
    if (!c || !SPG.store.settings.sound) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(80, freq * sweep), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(A.master);
    s.start(t); s.stop(t + dur + .05);
  }

  const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5]; // C major pentatonic-ish
  SPG.sfx = {
    tap() { tone(700, .07, { type: 'triangle', vol: .16 }); },
    pop() { tone(380, .13, { slide: 2.4, type: 'sine', vol: .22 }); },
    whoosh() { noise(.16, { freq: 700, sweep: 4, q: .6, vol: .1 }); },
    splash() { noise(.22, { freq: 1400, sweep: .35, q: .7, vol: .2 }); tone(520, .14, { slide: 1.8, vol: .12 }); },
    note(i = 0, vol = .18) { tone(NOTES[i % NOTES.length], .3, { type: 'sine', vol }); tone(NOTES[i % NOTES.length] * 2, .2, { type: 'sine', vol: vol * .3 }); },
    plink(i = 0) { tone(880 + (i % 5) * 110, .22, { type: 'sine', vol: .18 }); tone(1760 + (i % 5) * 220, .12, { vol: .06 }); },
    chime() { [0, 2, 4, 5].forEach((n, k) => tone(NOTES[n], .35, { at: k * .09, vol: .18 })); },
    win() { [0, 2, 3, 5, 7].forEach((n, k) => tone(NOTES[n], .4, { at: k * .1, vol: .17 })); tone(NOTES[0] / 2, .6, { at: 0, type: 'triangle', vol: .1 }); },
    grow() { [0, 1, 2, 3].forEach((n, k) => tone(NOTES[n] * .75, .2, { at: k * .07, vol: .13, type: 'triangle' })); },
    boing() { tone(220, .32, { slide: 2.6, type: 'triangle', vol: .22 }); },
    oops() { tone(300, .22, { slide: .7, type: 'triangle', vol: .13 }); },
    water() { for (let i = 0; i < 5; i++) noise(.16, { freq: 2600 + i * 200, q: 2, vol: .06, at: i * .07 }); },
    squeak() { tone(1100, .09, { slide: 1.5, vol: .08 }); }
  };

  // Soft, slow, generative background music (off by default; a grown-up turns it on).
  const CHORDS = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
  let musicTimer = 0, beat = 0;
  const musicStep = () => {
    if (!A.ctx || document.hidden) return;
    const ch = CHORDS[Math.floor(beat / 4) % CHORDS.length];
    const n = ch[beat % 3] * (beat % 8 === 5 ? 2 : 1);
    tone(n, 2.2, { type: 'sine', vol: .035 });
    if (beat % 4 === 0) tone(ch[0] / 2, 3.4, { type: 'triangle', vol: .03 });
    beat++;
  };
  SPG.music = {
    sync() {
      const want = SPG.store.settings.music && SPG.store.settings.sound && !document.hidden;
      if (want && !musicTimer) { musicStep(); musicTimer = setInterval(musicStep, 950); }
      else if (!want && musicTimer) { clearInterval(musicTimer); musicTimer = 0; }
    }
  };

  /* ---------------------------------------------------------------- voice */
  const PHONICS = { a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fuh', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'luh', m: 'muh', n: 'nuh', o: 'aw', p: 'puh', q: 'kwuh', r: 'ruh', s: 'sss', t: 'tuh', u: 'uh', v: 'vuh', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz' };
  const NAMES = { a: 'Ay', b: 'Bee', c: 'Cee', d: 'Dee', e: 'Ee', f: 'Eff', g: 'Gee', h: 'Aitch', i: 'Eye', j: 'Jay', k: 'Kay', l: 'El', m: 'Em', n: 'En', o: 'Oh', p: 'Pee', q: 'Cue', r: 'Ar', s: 'Ess', t: 'Tee', u: 'You', v: 'Vee', w: 'Double you', x: 'Ex', y: 'Why', z: 'Zee' };
  // One picture word per letter (emoji renders on every Android tablet).
  const WORDS = { a: ['apple', '🍎'], b: ['bear', '🐻'], c: ['cat', '🐱'], d: ['dog', '🐶'], e: ['elephant', '🐘'], f: ['fish', '🐟'], g: ['giraffe', '🦒'], h: ['horse', '🐴'], i: ['ice cream', '🍦'], j: ['juice', '🧃'], k: ['koala', '🐨'], l: ['lion', '🦁'], m: ['moon', '🌙'], n: ['nose', '👃'], o: ['octopus', '🐙'], p: ['pig', '🐷'], q: ['queen', '👸'], r: ['rainbow', '🌈'], s: ['sun', '☀️'], t: ['turtle', '🐢'], u: ['umbrella', '☂️'], v: ['violin', '🎻'], w: ['whale', '🐳'], x: ['box', '📦'], y: ['yarn', '🧶'], z: ['zebra', '🦓'] };

  const LINES = {
    'welcome': "Hi! Let's play!",
    'great-job': 'Great job!', 'wow': 'Wow!', 'you-did-it': 'You did it!', 'amazing': 'Amazing!', 'yay': 'Yay!',
    'try-again': 'Try again!',
    'find': 'Can you find the letter', 'follow-bee': 'Follow the bee!', 'is-for': 'is for',
    'starts-with': 'Which one starts with', 'break-time': 'Time for a little rest!',
    'catch-drops': 'Catch the raindrops!', 'rainbow': 'A rainbow!',
    'plant-seed': 'Tap the soil to plant a seed!', 'water-me': 'Tap the plant to water it!', 'new-friend': 'A new friend!',
    'write-name': "Let's write your name!", 'spell-name': 'Your name is spelled',
    'creature/bee': 'Bzzz! A bee!', 'creature/butterfly': 'A butterfly!', 'creature/ladybug': 'A ladybug!', 'creature/bunny': 'A bunny!', 'creature/bird': 'A little bird!', 'creature/snail': 'A snail!'
  };
  for (const [l, t] of Object.entries(NAMES)) LINES['letter/' + l] = t;
  for (const [l, t] of Object.entries(PHONICS)) LINES['sound/' + l] = t;
  for (const [l, [w]] of Object.entries(WORDS)) LINES['word/' + l] = w;

  const fileFor = key => 'audio/voice/' + key.replace(/\//g, '-') + '.mp3';
  const buffers = new Map(); // key -> AudioBuffer | null (null = no recording, use speech)
  let token = 0, current = null, voiceObj;

  async function loadBuffer(key) {
    if (buffers.has(key)) return buffers.get(key);
    let buf = null;
    try {
      const res = await fetch(fileFor(key));
      if (res.ok && A.ctx) buf = await A.ctx.decodeAudioData(await res.arrayBuffer());
    } catch (_) { /* no recording: fall back to speech */ }
    buffers.set(key, buf);
    return buf;
  }

  function pickVoice() {
    if (voiceObj !== undefined) return voiceObj;
    const list = speechSynthesis.getVoices();
    if (!list.length) return null;
    voiceObj = list.find(v => /en[-_]US/i.test(v.lang) && /female|google us|samantha|aria|jenny/i.test(v.name))
      || list.find(v => /en[-_]US/i.test(v.lang)) || list.find(v => /^en/i.test(v.lang)) || null;
    return voiceObj;
  }
  if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', () => { voiceObj = undefined; });

  function speak(text) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = .82; u.pitch = 1.2; u.lang = 'en-US';
      const v = pickVoice(); if (v) u.voice = v;
      let done = false;
      const fin = () => { if (!done) { done = true; resolve(); } };
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 1200 + text.length * 130);
      current = { stop: () => { speechSynthesis.cancel(); fin(); } };
      speechSynthesis.speak(u);
    });
  }

  async function playOne(item) {
    if (!SPG.store.settings.voice) return;
    const key = typeof item === 'string' ? item : null;
    if (key) {
      const buf = A.ctx ? await loadBuffer(key) : null;
      if (buf) {
        await new Promise(resolve => {
          const src = A.ctx.createBufferSource(); src.buffer = buf;
          src.connect(A.master); src.onended = resolve;
          current = { stop: () => { try { src.stop(); } catch (_) { /* already ended */ } resolve(); } };
          src.start();
        });
        return;
      }
      if (LINES[key]) return speak(LINES[key]);
      return;
    }
    if (item && item.say) return speak(item.say);
  }

  // Say a line, or a list of lines one after another. Items are line keys or {say: 'free text'}.
  SPG.voice = {
    LINES, PHONICS, NAMES, WORDS, fileFor,
    async say(...items) {
      const list = items.flat();
      const my = ++token;
      current?.stop();
      for (const it of list) {
        if (my !== token) return;
        await playOne(it);
      }
    },
    stop() { token++; current?.stop(); },
    praise() { const k = ['great-job', 'wow', 'you-did-it', 'amazing', 'yay']; return SPG.voice.say(k[Math.floor(Math.random() * k.length)]); }
  };

  /* ---------------------------------------------------------------- safe mode */
  const standalone = () => matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const safe = SPG.safe = {
    on: true,           // keep the child inside the app
    wantFullscreen: false,
    standalone,
    canFullscreen: !!document.documentElement.requestFullscreen,
    async enterFullscreen() {
      safe.wantFullscreen = true;
      if (!safe.canFullscreen || document.fullscreenElement || standalone()) return;
      try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (_) { /* browser refused; play continues */ }
    },
    async exitFullscreen() {
      safe.wantFullscreen = false;
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (_) { /* ignore */ }
    },
    onBack: null,       // set by the app: called when the child presses back
    onFullscreenLost: null,
    async keepAwake() {
      try {
        if (!navigator.wakeLock || document.hidden) return;
        safe._lock = await navigator.wakeLock.request('screen');
        safe._lock.addEventListener('release', () => { safe._lock = null; });
      } catch (_) { /* not supported or denied */ }
    },
    init() {
      // The back button/gesture stays inside the app instead of leaving it.
      history.replaceState({ spg: 0 }, '');
      history.pushState({ spg: 1 }, '');
      addEventListener('popstate', () => {
        history.pushState({ spg: 1 }, '');
        if (safe.onBack) safe.onBack();
      });

      // No long-press menus, text selection, drag ghosts or pinch zoom.
      const block = e => e.preventDefault();
      ['contextmenu', 'selectstart', 'dragstart', 'gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, block));
      document.addEventListener('touchstart', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
      document.addEventListener('touchmove', e => {
        if (e.touches.length > 1 || !e.target.closest?.('[data-scroll]')) e.preventDefault();
      }, { passive: false });
      document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

      // Any first touch unlocks sound (browsers require a gesture).
      const unlock = () => { A.unlock(); safe.keepAwake(); };
      addEventListener('pointerdown', unlock, { capture: true });

      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && safe.wantFullscreen && safe.on && safe.onFullscreenLost) safe.onFullscreenLost();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) SPG.voice.stop(); else safe.keepAwake();
        SPG.music.sync();
      });
    }
  };
})();
