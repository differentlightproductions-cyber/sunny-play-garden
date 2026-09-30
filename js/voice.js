// Voice prompts. Every spoken line is a key in LINES. A line can be played from:
//   1. a recording made on this tablet in the grown-ups "Voices" screen (kept in IndexedDB), or
//   2. an audio file in audio/voice/<male|female>/<key>.mp3 listed in audio/voice/manifest.json, or
//   3. the browser's built-in speech (fallback, so nothing is ever silent).
// Two voice sets (male, female) can be mixed. Lines can be muted one by one, and praise can be
// made less frequent. "Sound-only" keys (critter noises) play only when recorded.
(() => {
  const SPG = window.SPG;
  const A = SPG.audio, store = SPG.store;

  const PHONICS = { a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fuh', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'luh', m: 'muh', n: 'nuh', o: 'aw', p: 'puh', q: 'kwuh', r: 'ruh', s: 'sss', t: 'tuh', u: 'uh', v: 'vuh', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz' };
  const NAMES = { a: 'Ay', b: 'Bee', c: 'Cee', d: 'Dee', e: 'Ee', f: 'Eff', g: 'Gee', h: 'Aitch', i: 'Eye', j: 'Jay', k: 'Kay', l: 'El', m: 'Em', n: 'En', o: 'Oh', p: 'Pee', q: 'Cue', r: 'Ar', s: 'Ess', t: 'Tee', u: 'You', v: 'Vee', w: 'Double you', x: 'Ex', y: 'Why', z: 'Zee' };
  // One picture word per letter (emoji renders on every Android tablet).
  const WORDS = { a: ['apple', '🍎'], b: ['bear', '🐻'], c: ['cat', '🐱'], d: ['dog', '🐶'], e: ['elephant', '🐘'], f: ['fish', '🐟'], g: ['giraffe', '🦒'], h: ['horse', '🐴'], i: ['ice cream', '🍦'], j: ['juice', '🧃'], k: ['koala', '🐨'], l: ['lion', '🦁'], m: ['moon', '🌙'], n: ['nose', '👃'], o: ['octopus', '🐙'], p: ['pig', '🐷'], q: ['queen', '👸'], r: ['rainbow', '🌈'], s: ['sun', '☀️'], t: ['turtle', '🐢'], u: ['umbrella', '☂️'], v: ['violin', '🎻'], w: ['whale', '🐳'], x: ['box', '📦'], y: ['yarn', '🧶'], z: ['zebra', '🦓'] };

  const PRAISE = new Set(['great-job', 'wow', 'you-did-it', 'amazing', 'yay']);
  const CRITTERS = ['bee', 'butterfly', 'ladybug', 'bunny', 'bird', 'snail', 'hedgehog', 'frog', 'duckling', 'mouse', 'turtle', 'dragonfly', 'cat', 'dog'];
  const CRITTER_NOISE = { bee: 'Bzzzz!', butterfly: 'a soft flutter noise', ladybug: 'a tiny squeak', bunny: 'a happy sniffle', bird: 'Tweet tweet!', snail: 'a slow, sleepy "sloooow"', hedgehog: 'a little snuffle', frog: 'Ribbit!', duckling: 'Quack quack!', mouse: 'Squeak squeak!', turtle: 'a slow "hellooo"', dragonfly: 'a quick buzzy zip', cat: 'Meow!', dog: 'Woof woof!' };
  const CRITTER_LINE = { bee: 'Bzzz! A bee!', butterfly: 'A butterfly!', ladybug: 'A ladybug!', bunny: 'A bunny!', bird: 'A little bird!', snail: 'A snail!', hedgehog: 'A hedgehog!', frog: 'A frog!', duckling: 'A duckling!', mouse: 'A little mouse!', turtle: 'A turtle!', dragonfly: 'A dragonfly!', cat: 'A kitty!', dog: 'A puppy!' };

  // Spoken lines (also the built-in speech fallback text).
  const LINES = {
    'welcome': "Hi! Let's play!",
    'great-job': 'Great job!', 'wow': 'Wow!', 'you-did-it': 'You did it!', 'amazing': 'Amazing!', 'yay': 'Yay!',
    'try-again': 'Try again!',
    'find': 'Can you find the letter', 'follow-bee': 'Follow the bee!', 'is-for': 'is for',
    'starts-with': 'Which one starts with', 'write-name': "Let's write your name!", 'spell-name': 'Your name is spelled',
    'catch-drops': 'Catch the raindrops!', 'rainbow': 'A rainbow!',
    'fire-start': 'Some little fires! Spray them with water!', 'fire-pet': 'Tap the pet to help them down!', 'fire-done': 'Everyone is safe! Hooray!',
    'storm-coming': 'Here comes a big rainy storm!', 'storm-over': 'The storm is over. Look, the sun!',
    'raining-pets': "It's raining cats and dogs!", 'pets-safe': 'You saved them all!',
    'dig-first': 'First, dig a hole with the shovel!', 'dig-one': 'Dig! One!', 'dig-two': 'Two!', 'dig-three': 'Three! A perfect hole!', 'pat-it': 'Now pat the dirt down!', 'bye-bye': 'Bye bye, friend! Have fun!', 'pour-water': 'Hold the can over the plant to water it!', 'seed-in': 'Now drop in a seed!', 'water-me': 'Tap the plant to water it!',
    'new-friend': 'A new friend!', 'new-seeds': 'New seeds to plant!', 'bigger-garden': 'Your garden got bigger!',
    'confirm-bye': 'Do you want to say bye-bye? Tap the soft pink button to say bye-bye, or the green one to stay.',
    'break-time': 'Time for a little rest!'
  };
  for (const [l, t] of Object.entries(NAMES)) LINES['letter/' + l] = t;
  for (const [l, t] of Object.entries(PHONICS)) LINES['sound/' + l] = t;
  for (const [l, [w]] of Object.entries(WORDS)) LINES['word/' + l] = w;
  for (const k of CRITTERS) LINES['creature/' + k] = CRITTER_LINE[k];
  // Sound-only keys: no speech fallback. They play only if someone has recorded them.
  const SOUNDS = {};
  for (const k of CRITTERS) SOUNDS['critter/' + k] = CRITTER_NOISE[k];
  const custom = {}; // dynamic lines, e.g. player names: key -> fallback text

  const SETS = [{ id: 'male', name: 'Male voice' }, { id: 'female', name: 'Female voice' }];

  const GROUPS = [
    { id: 'praise', title: 'Cheering', note: 'Said after she does something well. Turn down how often in the "Praise" setting.', test: k => PRAISE.has(k) },
    { id: 'prompts', title: 'Prompts and instructions', note: 'Short lines that tell her what to do.', test: k => k in LINES && !PRAISE.has(k) && !/^(letter|sound|word|creature)\//.test(k) },
    { id: 'letters', title: 'Letter names (A to Z)', note: 'Say the name of the letter: "Bee", "Cee".', test: k => k.startsWith('letter/') },
    { id: 'sounds', title: 'Letter sounds (A to Z)', note: 'Say the sound the letter makes: "buh", "kuh", "sss". Not the name.', test: k => k.startsWith('sound/') },
    { id: 'words', title: 'Picture words', note: 'The word for each letter picture: apple, bear, cat...', test: k => k.startsWith('word/') },
    { id: 'friends', title: 'Garden friend announcements', note: 'Said when a new garden friend appears.', test: k => k.startsWith('creature/') },
    { id: 'critters', title: 'Critter noises (make the sound!)', note: 'Played when she taps a garden friend. Just make the noise, like a bee buzz or a frog ribbit.', test: k => k.startsWith('critter/') },
    { id: 'players', title: 'Player names', note: 'Say each player\'s greeting, like "Hi Charlotte!".', test: k => k.startsWith('player/') }
  ];

  const base = key => key.replace(/\//g, '-');
  const fileFor = (set, key) => `audio/voice/${set}/${base(key)}.mp3`;
  const allKeys = () => [...Object.keys(LINES), ...Object.keys(SOUNDS), ...Object.keys(custom)];
  const textFor = key => LINES[key] ?? SOUNDS[key] ?? custom[key] ?? key;

  /* ------------------------------------------------------------ stored clips */
  const deviceKeys = { male: new Set(), female: new Set() };
  let manifest = null;
  let db = null;
  const buffers = new Map(); // "set/key" -> AudioBuffer | null

  const idb = (mode, fn) => new Promise(resolve => {
    if (!db) return resolve(null);
    try {
      const tx = db.transaction('clips', mode), st = tx.objectStore('clips'), rq = fn(st);
      tx.oncomplete = () => resolve(rq ? rq.result : true); tx.onerror = tx.onabort = () => resolve(null);
    } catch (_) { resolve(null); }
  });
  const openDB = () => new Promise(resolve => {
    try {
      const rq = indexedDB.open('spg-voice', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('clips');
      rq.onsuccess = () => resolve(rq.result); rq.onerror = rq.onblocked = () => resolve(null);
    } catch (_) { resolve(null); }
  });

  const ready = (async () => {
    db = typeof indexedDB !== 'undefined' ? await openDB() : null;
    const keys = (await idb('readonly', st => st.getAllKeys())) || [];
    for (const id of keys) { const [set, ...rest] = String(id).split('/'); if (deviceKeys[set]) deviceKeys[set].add(rest.join('/')); }
    try { const res = await fetch('audio/voice/manifest.json'); if (res.ok) manifest = await res.json(); } catch (_) { /* no file recordings */ }
  })();

  const fileAvail = (set, key) => !!(manifest && manifest[set] && manifest[set].includes(base(key)));
  const hasClip = (set, key) => deviceKeys[set].has(key) || fileAvail(set, key);
  const hasDeviceClip = (set, key) => deviceKeys[set].has(key);

  // Trim silence, and level the clip so quiet phone recordings are as loud as clear ones.
  function analyse(buf) {
    const d = buf.getChannelData(0), n = d.length, sr = buf.sampleRate;
    let peak = 0; for (let i = 0; i < n; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; }
    const thr = Math.max(.012, peak * .05);
    let a = 0; while (a < n && Math.abs(d[a]) < thr) a++;
    let b = n - 1; while (b > a && Math.abs(d[b]) < thr) b--;
    const start = Math.max(0, a / sr - .06), end = Math.min(buf.duration, b / sr + .18);
    buf._trim = [start, Math.max(.05, end - start)];
    buf._gain = peak > 0 ? Math.min(4, .85 / peak) : 1;
    return buf;
  }
  const decode = async ab => analyse(await A.ctx.decodeAudioData(ab));

  async function loadBuffer(set, key) {
    const id = set + '/' + key;
    if (buffers.has(id)) return buffers.get(id);
    let buf = null;
    try {
      if (deviceKeys[set].has(key)) { const blob = await idb('readonly', st => st.get(id)); if (blob) buf = await decode(await blob.arrayBuffer()); }
      if (!buf && fileAvail(set, key)) { const res = await fetch(fileFor(set, key)); if (res.ok) buf = await decode(await res.arrayBuffer()); }
    } catch (_) { /* unreadable clip: fall back to speech */ }
    buffers.set(id, buf);
    return buf;
  }

  /* ------------------------------------------------------------ playback */
  let token = 0, current = null, voiceObj;
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
      if (!('speechSynthesis' in window) || !text) return resolve();
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

  function playBuffer(buf) {
    return new Promise(resolve => {
      const src = A.ctx.createBufferSource(); src.buffer = buf;
      const g = A.ctx.createGain(); g.gain.value = buf._gain || 1;
      src.connect(g); g.connect(A.master); src.onended = resolve;
      current = { stop: () => { try { src.stop(); } catch (_) { /* already ended */ } resolve(); } };
      const [off, dur] = buf._trim || [0, undefined];
      src.start(0, off, dur);
    });
  }

  const settings = () => store.settings;
  function chooseSet(key) {
    const pref = settings().voicePref || 'mix';
    if (pref === 'builtin') return null;
    const order = pref === 'mix' ? ['male', 'female'] : [pref];
    const have = order.filter(s => hasClip(s, key));
    return have.length ? have[Math.floor(Math.random() * have.length)] : null;
  }
  function skip(key) {
    const s = settings();
    if ((s.muted || []).includes(key)) return true;
    if (PRAISE.has(key)) return Math.random() > ({ lots: 1, some: .5, off: 0 }[s.praise ?? 'some']);
    return false;
  }

  async function playOne(item) {
    if (!settings().voice || !item || SPG.voice.hushed) return;
    if (typeof item !== 'string') return item.say ? speak(item.say) : undefined;
    if (skip(item)) return;
    await ready;
    const set = A.ctx ? chooseSet(item) : null;
    if (set) { const buf = await loadBuffer(set, item); if (buf) return playBuffer(buf); }
    if (item in SOUNDS) return; // sound-only: silent unless recorded
    const text = LINES[item] ?? custom[item];
    if (text) return speak(text);
  }

  /* ------------------------------------------------------------ recording (grown-ups) */
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const done = new Promise(res => { rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' })); }; });
    rec.start();
    return { stop: () => { if (rec.state !== 'inactive') rec.stop(); return done; }, cancel: () => { chunks.length = 0; if (rec.state !== 'inactive') rec.stop(); } };
  }

  async function saveClip(set, key, blob) {
    A.unlock();
    const buf = await decode(await blob.arrayBuffer()); // throws if the browser cannot read it
    if (!db) throw new Error('This browser cannot store recordings.');
    const ok = await idb('readwrite', st => st.put(blob, set + '/' + key));
    if (!ok) throw new Error('Could not save the recording.');
    deviceKeys[set].add(key); buffers.set(set + '/' + key, buf);
    return buf;
  }
  async function deleteClip(set, key) {
    await idb('readwrite', st => st.delete(set + '/' + key));
    deviceKeys[set].delete(key); buffers.delete(set + '/' + key);
  }
  async function previewClip(set, key) {
    A.unlock(); await ready;
    const buf = await loadBuffer(set, key);
    if (!buf) return false;
    current?.stop(); await playBuffer(buf); return true;
  }

  SPG.voice = {
    hushed: false, // true inside the Coloring Book: no spoken voices at all
    LINES, SOUNDS, PHONICS, NAMES, WORDS, PRAISE, GROUPS, SETS, custom, ready,
    fileFor, allKeys, textFor, hasClip, hasDeviceClip,
    groupOf: key => GROUPS.find(g => g.test(key)),
    // Say a line, or a list of lines one after another. Items are keys, {say: 'free text'}, or null.
    async say(...items) {
      const list = items.flat();
      const my = ++token;
      current?.stop();
      for (const it of list) {
        if (my !== token) return;
        await playOne(it);
      }
    },
    // Play a critter noise if one is recorded, otherwise the spoken announcement.
    async sound(soundKey, fallbackKey) {
      await ready;
      if (A.ctx && !skip(soundKey) && chooseSet(soundKey)) return SPG.voice.say(soundKey);
      return fallbackKey ? SPG.voice.say(fallbackKey) : undefined;
    },
    // Quietly play a recorded critter noise if there is one. Never interrupts speech. Resolves to its length in seconds (0 = none).
    async ambient(key, gain = .2) {
      if (!settings().voice || SPG.voice.hushed || skip(key) || !A.ctx) return 0;
      await ready;
      const set = chooseSet(key); if (!set) return 0;
      const buf = await loadBuffer(set, key); if (!buf) return 0;
      const src = A.ctx.createBufferSource(); src.buffer = buf;
      const g = A.ctx.createGain(); g.gain.value = (buf._gain || 1) * gain;
      src.connect(g); g.connect(A.master);
      const [off, dur] = buf._trim || [0, undefined]; src.start(0, off, dur);
      return dur || buf.duration;
    },
    stop() { token++; current?.stop(); },
    praise() { const k = [...PRAISE]; return SPG.voice.say(k[Math.floor(Math.random() * k.length)]); },
    startRecording, saveClip, deleteClip, previewClip
  };
})();
