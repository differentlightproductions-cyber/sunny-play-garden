// Pets: the friends a child can take home from the Pet Shop with stars (no purchases, ever), name, dress up,
// and who then keep her company in calm places like the Coloring Book.
//
// Saved per player in store.bag('pets'):
//   { v: 1, owned: { bunny: { name: 'Biscuit', hat: 'bow' } }, hats: { bow: true }, active: 'bunny' }
(() => {
  const SPG = window.SPG;
  const { art, sfx, store } = SPG;
  const TAU = Math.PI * 2;

  const SPECIES = {
    bunny: { body: '#fff', belly: '#ffe3ec', limb: '#fff', tail: 'puff', tailCol: '#fff', sound: 'bunny' },
    cat: { body: '#ffb45e', belly: '#fff2df', limb: '#ffb45e', tail: 'long', tailCol: '#ffa042', sound: 'cat' },
    bear: { body: '#c98b5b', belly: '#f3c9a0', limb: '#c98b5b', tail: 'puff', tailCol: '#b87a4b', sound: 'hedgehog' },
    fox: { body: '#ff8a4c', belly: '#fff', limb: '#5a3f5e', tail: 'bushy', tailCol: '#ff8a4c', sound: 'dog' },
    frog: { body: '#84d96a', belly: '#e4f7c5', limb: '#6cc455', tail: null, sound: 'frog' },
    panda: { body: '#fff', belly: '#fff', limb: '#3d2c44', tail: 'puff', tailCol: '#fff', sound: 'hedgehog' }
  };
  // Prices are in stars earned by playing. The first friends are cheap.
  const PETS = [
    { id: 'bunny', name: 'Bunny', price: 10 }, { id: 'cat', name: 'Kitten', price: 10 }, { id: 'bear', name: 'Bear cub', price: 15 },
    { id: 'fox', name: 'Fox pup', price: 20 }, { id: 'frog', name: 'Froggy', price: 25 }, { id: 'panda', name: 'Panda cub', price: 30 }
  ];
  const HATS = [
    { id: 'bow', name: 'Bow', price: 5 }, { id: 'flowers', name: 'Flower crown', price: 8 }, { id: 'party', name: 'Party hat', price: 8 },
    { id: 'witch', name: 'Witch hat', price: 10 }, { id: 'leaves', name: 'Fall leaves', price: 10 }, { id: 'santa', name: 'Santa hat', price: 10 },
    { id: 'antlers', name: 'Reindeer antlers', price: 10 }, { id: 'crown', name: 'Crown', price: 20 }
  ];
  const NAMES = ['Biscuit', 'Pip', 'Mochi', 'Nugget', 'Clover', 'Peaches', 'Maple', 'Button', 'Pebble', 'Sprout', 'Waffles', 'Poppy', 'Cocoa', 'Daisy', 'Muffin', 'Twinkle'];

  /* ------------------------------------------------------------ saved state */
  const bag = () => store.bag('pets', () => ({ v: 1, owned: {}, hats: {}, active: null }));
  const info = id => PETS.find(p => p.id === id);
  const api = {
    PETS, HATS, NAMES, SPECIES,
    petInfo: info, hatInfo: id => HATS.find(h => h.id === id),
    owns: id => !!bag().owned[id],
    nameOf: id => (bag().owned[id] && bag().owned[id].name) || (info(id) || {}).name || '',
    ownsHat: id => !!bag().hats[id],
    active() { const b = bag(), id = b.active; return id && b.owned[id] ? { id, name: b.owned[id].name || info(id).name, hat: b.owned[id].hat || null } : null; },
    setActive(id) { const b = bag(); if (b.owned[id]) { b.active = id; store.save(); } },
    canAfford: price => store.active && store.active.stars >= price,
    adopt(id) {
      const b = bag(), p = info(id);
      if (!p || b.owned[id] || !api.canAfford(p.price)) return false;
      store.addStars(-p.price); b.owned[id] = { name: '', hat: null }; b.active = id; store.save(); return true;
    },
    buyHat(id) {
      const b = bag(), h = api.hatInfo(id);
      if (!h || b.hats[id] || !api.canAfford(h.price)) return false;
      store.addStars(-h.price); b.hats[id] = true; store.save(); return true;
    },
    wear(hatId) { const b = bag(); if (b.active && b.owned[b.active]) { b.owned[b.active].hat = hatId && b.hats[hatId] ? hatId : null; store.save(); } },
    rename(id, name) { const b = bag(); if (b.owned[id]) { b.owned[id].name = String(name || '').trim().slice(0, 12); store.save(); } },
    randomName() { return NAMES[Math.floor(Math.random() * NAMES.length)]; },
    noise(id) { const sp = SPECIES[id]; if (sp) sfx.critter(sp.sound, 3); }
  };

  /* ------------------------------------------------------------ drawing */
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); };

  // Hats sit on a head of radius R centered at (0, 0).
  function hat(c, id, R) {
    c.save(); c.lineJoin = c.lineCap = 'round';
    if (id === 'bow') {
      c.translate(R * .55, -R * .9); c.rotate(.35);
      c.fillStyle = '#ff7aa2'; ell(c, -R * .3, 0, R * .3, R * .18, -.4); c.fill(); ell(c, R * .3, 0, R * .3, R * .18, .4); c.fill();
      c.fillStyle = '#ff5c8a'; ell(c, 0, 0, R * .11, R * .11); c.fill();
    } else if (id === 'flowers') {
      const cols = ['#ff9db8', '#fff', '#ffd54a', '#ff9db8', '#fff', '#ffd54a', '#ff9db8'];
      for (let i = 0; i < 7; i++) {
        const a = (-165 + i * 25) * Math.PI / 180, x = Math.cos(a) * R * 1.02, y = Math.sin(a) * R * 1.0;
        c.fillStyle = '#7ed957'; ell(c, x + Math.cos(a) * R * .1, y + Math.sin(a) * R * .1, R * .1, R * .06, a); c.fill();
        c.fillStyle = cols[i]; for (let k = 0; k < 5; k++) { ell(c, x + Math.cos(k * TAU / 5) * R * .09, y + Math.sin(k * TAU / 5) * R * .09, R * .07, R * .07); c.fill(); }
        c.fillStyle = '#ffd54a'; ell(c, x, y, R * .05, R * .05); c.fill();
      }
    } else if (id === 'party') {
      c.translate(-R * .1, -R * .92); c.rotate(-.18);
      c.fillStyle = '#7fd4f5'; c.beginPath(); c.moveTo(-R * .45, 0); c.lineTo(0, -R * 1.05); c.lineTo(R * .45, 0); c.closePath(); c.fill();
      c.save(); c.clip(); c.strokeStyle = '#ff9db8'; c.lineWidth = R * .13; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-R * .6 + k * R * .3, R * .1); c.lineTo(R * .1 + k * R * .3, -R * 1.1); c.stroke(); } c.restore();
      c.fillStyle = '#ffd54a'; ell(c, 0, -R * 1.08, R * .13, R * .13); c.fill();
    } else if (id === 'crown') {
      c.translate(0, -R * .9);
      c.fillStyle = '#ffd54a'; c.strokeStyle = '#e0a01e'; c.lineWidth = R * .07;
      c.beginPath(); c.moveTo(-R * .55, 0); c.lineTo(-R * .58, -R * .55); c.lineTo(-R * .28, -R * .28); c.lineTo(0, -R * .7); c.lineTo(R * .28, -R * .28); c.lineTo(R * .58, -R * .55); c.lineTo(R * .55, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ff6b81'; ell(c, 0, -R * .22, R * .08, R * .08); c.fill(); c.fillStyle = '#4f8fe8'; ell(c, -R * .33, -R * .1, R * .06, R * .06); c.fill(); ell(c, R * .33, -R * .1, R * .06, R * .06); c.fill();
    } else if (id === 'witch') {
      c.translate(0, -R * .9);
      c.fillStyle = '#5a3f7e'; ell(c, 0, 0, R * 1.02, R * .2); c.fill();
      c.fillStyle = '#6b4a99'; c.beginPath(); c.moveTo(-R * .55, 0); c.quadraticCurveTo(-R * .2, -R * .6, R * .2, -R * 1.5); c.quadraticCurveTo(R * .3, -R * 1.2, R * .28, -R * 1.05); c.quadraticCurveTo(R * .55, -R * .5, R * .55, 0); c.closePath(); c.fill();
      c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(-R * .53, -R * .06); c.lineTo(R * .53, -R * .06); c.lineTo(R * .5, -R * .3); c.lineTo(-R * .48, -R * .3); c.closePath(); c.fill();
    } else if (id === 'leaves') {
      const cols = ['#ff8a3d', '#e0492f', '#ffb52e', '#ff8a3d', '#e0492f', '#ffb52e', '#ff8a3d'];
      for (let i = 0; i < 7; i++) {
        const a = (-165 + i * 25) * Math.PI / 180;
        c.save(); c.translate(Math.cos(a) * R * 1.0, Math.sin(a) * R * .98); c.rotate(a + Math.PI / 2);
        c.fillStyle = cols[i]; c.beginPath(); c.moveTo(0, R * .12); c.quadraticCurveTo(R * .24, -R * .05, 0, -R * .3); c.quadraticCurveTo(-R * .24, -R * .05, 0, R * .12); c.fill(); c.restore();
      }
    } else if (id === 'santa') {
      c.translate(0, -R * .9); c.rotate(-.1);
      c.fillStyle = '#e8434f'; c.beginPath(); c.moveTo(-R * .7, 0); c.quadraticCurveTo(-R * .6, -R * 1.1, R * .5, -R * 1.05); c.quadraticCurveTo(R * .9, -R * .95, R * .95, -R * .5); c.lineTo(R * .7, 0); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect ? c.roundRect(-R * .82, -R * .12, R * 1.64, R * .3, R * .15) : c.rect(-R * .82, -R * .12, R * 1.64, R * .3); c.fill();
      c.fillStyle = '#fff'; ell(c, R * .95, -R * .5, R * .17, R * .17); c.fill();
    } else if (id === 'antlers') {
      c.strokeStyle = '#a8744f'; c.lineWidth = R * .13;
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(s * R * .4, -R * .9); c.quadraticCurveTo(s * R * .55, -R * 1.25, s * R * .8, -R * 1.5); c.moveTo(s * R * .58, -R * 1.15); c.lineTo(s * R * .3, -R * 1.35); c.moveTo(s * R * .72, -R * 1.38); c.lineTo(s * R * 1.0, -R * 1.3); c.stroke();
      }
    }
    c.restore();
  }

  // One pet standing on the line y = 0 (its feet), s = about its height. o: { mood, hop, hat, wave }
  function draw(c, id, s, t = 0, o = {}) {
    const sp = SPECIES[id]; if (!sp) return;
    const R = s * .27, mood = o.mood || 'happy';
    const hop = Math.min(1, o.hop || 0), lift = Math.sin(hop * Math.PI) * s * .2;
    const breathe = 1 + Math.sin(t * 2.2) * .014;
    const blink = (t % 4.3) < .13;
    c.save(); c.lineCap = 'round';
    c.fillStyle = 'rgba(90,63,94,.13)'; ell(c, 0, s * .01, s * .3 * (1 - lift / s * .8), s * .05); c.fill();   // shadow
    c.translate(0, -lift);
    // tail (behind)
    c.save(); c.translate(0, -s * .22);
    const wag = Math.sin(t * (mood === 'cheer' ? 9 : 2.4)) * (mood === 'sleep' ? .02 : .18);
    if (sp.tail === 'puff') { c.fillStyle = sp.tailCol; ell(c, s * .25, s * .05, s * .07, s * .07); c.fill(); }
    else if (sp.tail === 'long') { c.strokeStyle = sp.tailCol; c.lineWidth = s * .07; c.beginPath(); c.moveTo(s * .2, s * .1); c.quadraticCurveTo(s * .42, s * .1 + wag * s * .5, s * .38, -s * .12 + wag * s * .3); c.stroke(); }
    else if (sp.tail === 'bushy') { c.save(); c.translate(s * .22, s * .06); c.rotate(-.5 + wag); c.fillStyle = sp.tailCol; ell(c, s * .14, 0, s * .17, s * .08); c.fill(); c.fillStyle = '#fff'; ell(c, s * .27, 0, s * .06, s * .06); c.fill(); c.restore(); }
    c.restore();
    // body
    c.save(); c.translate(0, -s * .22); c.scale(1, breathe);
    c.fillStyle = sp.body; ell(c, 0, 0, s * .25, s * .23); c.fill();
    c.fillStyle = sp.belly; ell(c, 0, s * .03, s * .16, s * .16); c.fill();
    c.restore();
    // arms (they wave when she is happy)
    for (const side of [-1, 1]) {
      c.save(); c.translate(side * s * .22, -s * .3); c.rotate(side * (.35 + (mood === 'cheer' ? -1.5 - Math.sin(t * 10 + side) * .25 : Math.sin(t * 2 + side) * .04)));
      c.fillStyle = sp.limb; ell(c, 0, s * .06, s * .06, s * .12); c.fill(); c.restore();
    }
    // feet
    c.fillStyle = sp.limb; for (const side of [-1, 1]) { ell(c, side * s * .13, -s * .03, s * .09, s * .055); c.fill(); }
    // head with the face and any hat
    c.save(); c.translate(0, -s * .6 + Math.sin(t * 2.2 + .6) * s * .006); if (mood === 'sleep') c.rotate(.1);
    art.avatar(c, sp.kind || id, R, { mood: mood === 'sleep' ? 'sleep' : mood === 'cheer' ? 'cheer' : 'happy', blink });
    if (o.hat) hat(c, o.hat, R);
    c.restore();
    if (mood === 'sleep') {
      c.fillStyle = '#8a7190'; c.font = `700 ${s * .13}px Fredoka, system-ui`;
      for (let k = 0; k < 2; k++) { const u = ((t * .5 + k * .5) % 1); c.globalAlpha = 1 - u; c.fillText('z', s * .22 + u * s * .1, -s * .8 - u * s * .2); }
      c.globalAlpha = 1;
    }
    c.restore();
  }
  api.draw = draw; api.drawHat = hat;

  // A pet head with a hat, for shop cards.
  api.drawHead = (c, id, R, hatId) => { c.save(); art.avatar(c, SPECIES[id].kind || id, R); if (hatId) hat(c, hatId, R); c.restore(); };

  /* ------------------------------------------------------------ the companion that keeps her company */
  // Adds the child's active pet to `host`. Returns null if she has none yet. The pet blinks, breathes, hops when
  // something nice happens, falls asleep when nothing has happened for a while, and can be tapped.
  api.companion = (host, { size = 110 } = {}) => {
    const st = api.active(); if (!st) return null;
    const el = document.createElement('button'); el.type = 'button'; el.className = 'pet-buddy'; el.setAttribute('aria-label', st.name);
    const cv = document.createElement('canvas'); el.append(cv); host.append(el);
    let px = 0, running = true, raf = 0, hopT = 0, cheerT = 0, idle = 0, t = Math.random() * 5, last = performance.now(), drawn = 0;
    const setSize = n => {
      px = n; const dpr = Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.round(n * dpr); cv.height = Math.round(n * 1.15 * dpr); cv.style.width = n + 'px'; cv.style.height = n * 1.15 + 'px';
    };
    setSize(size);
    const frame = now => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.1, (now - last) / 1000); last = now; t += dt; idle += dt;
      if (hopT > 0) hopT = Math.max(0, hopT - dt * 2.2);
      if (cheerT > 0) cheerT = Math.max(0, cheerT - dt);
      if (now - drawn < 33 || document.hidden || !el.isConnected) return;
      drawn = now;
      const cur = api.active() || st, mood = cheerT > 0 ? 'cheer' : idle > 25 ? 'sleep' : 'happy';
      const c = cv.getContext('2d'), dpr = cv.width / px;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, px, px * 1.15);
      c.translate(px / 2, px * 1.08); draw(c, cur.id, px * .92, t, { mood, hop: hopT > 0 ? 1 - hopT : 0, hat: cur.hat });
    };
    raf = requestAnimationFrame(frame);
    const buddy = {
      el, setSize,
      hop() { idle = 0; hopT = 1; },
      cheer(sec = 2.4) { idle = 0; cheerT = sec; hopT = 1; },
      wake() { idle = 0; },
      place(x, y) { el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.right = el.style.bottom = 'auto'; },
      destroy() { running = false; cancelAnimationFrame(raf); el.remove(); }
    };
    el.addEventListener('pointerdown', e => { e.preventDefault(); buddy.hop(); api.noise(st.id); });
    return buddy;
  };

  SPG.pets = api;
})();
