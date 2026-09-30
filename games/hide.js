// Hide and Seek: a real map to explore. Her pet (or a bunny) walks around a big place (a meadow, a beach, a snowy
// woods, a farm, a night forest) with bushes, rocks, hay, trees and logs. Garden friends are hiding behind some of
// them. Drag to walk, or tap somewhere (or a hiding place) and she walks there. Walking into a place, or tapping it,
// looks behind it: empty ones shake and glow blue (cold), yellow (warmer) or orange (hot) with a rising chirp. A
// little map in the corner shows where she has looked. If she is stuck for a while, a sparkling arrow points the way.
(() => {
  const SPG = window.SPG;
  const { art, sfx, voice, store } = SPG;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const RAINBOW = ['#ff6b81', '#ffa64d', '#ffe066', '#7ed957', '#5cc8f2', '#8a7cf0', '#c98bf0'];
  const KINDS = ['bunny', 'hedgehog', 'frog', 'duckling', 'mouse', 'turtle', 'cat', 'dog', 'mypet'];
  const SZ = { bunny: .34, hedgehog: .24, frog: .22, duckling: .22, mouse: .22, turtle: .24, cat: .22, dog: .23 };
  const rnd = i => { const x = Math.sin(i * 127.1 + 74.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------------------------------------------------------------- hiding places (base on (0, 0), about S wide) */
  const blob = (c, S, cols, dots, dotCol) => {
    for (const [x, y, r, k] of [[-.3, -.32, .34, 0], [.28, -.3, .36, 1], [0, -.5, .4, 2], [-.05, -.24, .4, 0], [-.4, -.14, .22, 1], [.4, -.14, .22, 2]]) { c.fillStyle = cols[k]; c.beginPath(); c.arc(x * S, y * S, r * S, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(-S * .18, -S * .62, S * .16, S * .07, -.5, 0, TAU); c.fill();
    if (dots) { c.fillStyle = dotCol; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc((((i * 37) % 70) / 70 - .5) * S * .8, -S * (.2 + ((i * 53) % 50) / 100), S * .04, 0, TAU); c.fill(); } }
  };
  const SPOT = {
    bush: (c, S, p) => blob(c, S, p.cols || ['#5cb85c', '#7ed957', '#4aa64f'], true, p.dots || '#ff6b81'),
    rock: (c, S, p) => {
      const g = c.createLinearGradient(0, -S * .8, 0, 0); g.addColorStop(0, p.hi || '#c9ccd8'); g.addColorStop(1, p.lo || '#9ea3b5');
      c.fillStyle = g; c.beginPath(); c.moveTo(-S * .52, 0); c.bezierCurveTo(-S * .58, -S * .55, -S * .3, -S * .85, S * .05, -S * .82); c.bezierCurveTo(S * .45, -S * .8, S * .6, -S * .4, S * .52, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-S * .2, -S * .55, S * .16, S * .07, -.6, 0, TAU); c.fill();
      c.fillStyle = p.cap || '#7fbf6a'; c.beginPath(); c.ellipse(S * .28, -S * .06, S * .2, S * .06, 0, 0, TAU); c.fill();
    },
    hay: (c, S) => {
      c.fillStyle = '#f2c94c'; art.rr(c, -S * .5, -S * .75, S, S * .75, S * .12); c.fill();
      c.strokeStyle = '#d9a52e'; c.lineWidth = S * .025; c.lineCap = 'round'; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-S * .42 + i * S * .1, -S * .68); c.lineTo(-S * .38 + i * S * .1, -S * .08); c.stroke(); }
      c.fillStyle = '#c98b5b'; c.fillRect(-S * .5, -S * .48, S, S * .06); c.fillRect(-S * .5, -S * .2, S, S * .06);
    },
    crate: (c, S) => {
      c.fillStyle = '#d9a06c'; art.rr(c, -S * .48, -S * .78, S * .96, S * .78, S * .06); c.fill();
      c.strokeStyle = '#a9743f'; c.lineWidth = S * .05; c.strokeRect(-S * .42, -S * .72, S * .84, S * .66); c.beginPath(); c.moveTo(-S * .42, -S * .72); c.lineTo(S * .42, -S * .06); c.moveTo(S * .42, -S * .72); c.lineTo(-S * .42, -S * .06); c.stroke();
    },
    tree: (c, S, p) => {
      c.fillStyle = p.trunk || '#8a6448'; art.rr(c, -S * .12, -S * .8, S * .24, S * .8, S * .05); c.fill();
      for (const [x, y, r, k] of [[-.32, -1.0, .38, 0], [.3, -1.0, .4, 1], [0, -1.28, .46, 2], [-.05, -.95, .44, 0]]) { c.fillStyle = (p.cols || ['#4aa64f', '#5cb85c', '#6fc46f'])[k]; c.beginPath(); c.arc(x * S, y * S, r * S, 0, TAU); c.fill(); }
      if (p.apples) { c.fillStyle = '#ff5f6d'; for (const [x, y] of [[-.35, -1.05], [.25, -.95], [.05, -1.3], [.4, -1.15]]) { c.beginPath(); c.arc(x * S, y * S, S * .06, 0, TAU); c.fill(); } }
      if (p.snow) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -S * 1.62, S * .34, S * .1, 0, 0, TAU); c.fill(); }
    },
    pine: (c, S, p) => {
      c.fillStyle = '#7a5a48'; c.fillRect(-S * .07, -S * .3, S * .14, S * .3);
      for (let k = 0; k < 3; k++) { const y = -S * (.22 + k * .42), w = S * (.55 - k * .13); c.fillStyle = p.col || '#3f8f66'; c.beginPath(); c.moveTo(-w, y); c.lineTo(0, y - S * .62); c.lineTo(w, y); c.closePath(); c.fill(); if (p.snow) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-w * .6, y - S * .26); c.lineTo(0, y - S * .62); c.lineTo(w * .6, y - S * .26); c.quadraticCurveTo(0, y - S * .16, -w * .6, y - S * .26); c.fill(); } }
    },
    log: (c, S, p) => {
      c.fillStyle = p.bark || '#9a6a44'; art.rr(c, -S * .5, -S * .42, S, S * .42, S * .18); c.fill();
      c.fillStyle = p.core || '#e6c08c'; c.beginPath(); c.ellipse(S * .5, -S * .21, S * .09, S * .21, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(90,60,40,.4)'; c.lineWidth = S * .02; c.beginPath(); c.ellipse(S * .5, -S * .21, S * .045, S * .11, 0, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(70,45,30,.35)'; c.lineWidth = S * .025; for (const x of [-.3, -.05, .2]) { c.beginPath(); c.moveTo(x * S, -S * .38); c.lineTo(x * S + S * .04, -S * .05); c.stroke(); }
      if (p.snow) { c.fillStyle = '#fff'; art.rr(c, -S * .46, -S * .48, S * .92, S * .14, S * .07); c.fill(); }
    },
    mound: (c, S, p) => { c.fillStyle = p.col || '#fff'; c.beginPath(); c.moveTo(-S * .6, 0); c.bezierCurveTo(-S * .5, -S * .7, S * .5, -S * .7, S * .6, 0); c.closePath(); c.fill(); c.fillStyle = p.shade || 'rgba(120,160,210,.25)'; c.beginPath(); c.moveTo(S * .1, -S * .55); c.bezierCurveTo(S * .45, -S * .5, S * .55, -S * .2, S * .6, 0); c.lineTo(S * .15, 0); c.closePath(); c.fill(); },
    mushroom: (c, S) => {
      c.fillStyle = '#f7ecd8'; art.rr(c, -S * .16, -S * .5, S * .32, S * .5, S * .1); c.fill();
      c.fillStyle = '#e8433f'; c.beginPath(); c.ellipse(0, -S * .55, S * .55, S * .38, 0, Math.PI, TAU); c.closePath(); c.fill(); c.beginPath(); c.ellipse(0, -S * .55, S * .55, S * .1, 0, 0, Math.PI); c.fill();
      c.fillStyle = '#fff'; for (const [x, y, r] of [[-.28, -.72, .09], [.06, -.85, .11], [.3, -.66, .08]]) { c.beginPath(); c.arc(x * S, y * S, r * S, 0, TAU); c.fill(); }
    },
    pumpkin: (c, S) => {
      c.fillStyle = '#f08a2b'; for (const x of [-.28, 0, .28]) { c.beginPath(); c.ellipse(x * S, -S * .34, S * (x ? .3 : .34), S * .34, 0, 0, TAU); c.fill(); }
      c.strokeStyle = '#c96a12'; c.lineWidth = S * .02; for (const x of [-.14, .14]) { c.beginPath(); c.moveTo(x * S, -S * .66); c.quadraticCurveTo(x * S * 1.4, -S * .35, x * S, -S * .02); c.stroke(); }
      c.fillStyle = '#5a8a3a'; art.rr(c, -S * .04, -S * .78, S * .08, S * .16, S * .03); c.fill();
    }
  };
  // Each place has its own look: the ground, and which hiding places and pretty things fill it.
  const WORLDS = [
    { id: 'garden', ground: ['#9fd88a', '#86cc74'], patch: '#7fc46b', path: '#e9d5a8', pond: true, flowers: ['#ff8aa3', '#ffd54a', '#fff', '#b58cf0'], scene: 'meadow', border: ['tree', { cols: ['#4aa64f', '#5cb85c', '#6fc46f'] }],
      spots: [['bush', {}], ['bush', { cols: ['#6fc46f', '#8ad67a', '#58b358'], dots: '#ffb3d1' }], ['rock', {}], ['hay', {}], ['tree', { cols: ['#4aa64f', '#5cb85c', '#6fc46f'] }], ['log', {}]] },
    { id: 'beach', ground: ['#f7e5b0', '#f0d894'], patch: '#e8cc84', path: '#fff3cc', sea: true, flowers: ['#ff8aa3', '#fff', '#7fd4f5'], scene: 'beach', border: ['tree', { cols: ['#3fae7a', '#55c48a', '#7ed9a0'], trunk: '#b9905a' }],
      spots: [['mound', { col: '#f2d78e', shade: 'rgba(200,150,60,.25)' }], ['bush', { cols: ['#3fae7a', '#55c48a', '#2f9a6a'], dots: '#ffd54a' }], ['rock', { hi: '#e6d8bd', lo: '#c9b48c', cap: '#7fbf9a' }], ['crate', {}], ['tree', { cols: ['#3fae7a', '#55c48a', '#7ed9a0'], trunk: '#b9905a' }], ['log', { bark: '#c9a66d', core: '#f3dcae' }]] },
    { id: 'snow', ground: ['#f4f9ff', '#e2edf8'], patch: '#d5e4f3', path: '#cfe0f0', flowers: ['#fff', '#cfe6ff'], scene: 'snow', border: ['pine', { snow: true }],
      spots: [['mound', { col: '#fff', shade: 'rgba(120,160,210,.3)' }], ['pine', { snow: true }], ['rock', { hi: '#dfe6f2', lo: '#b6c2d8', cap: '#fff' }], ['bush', { cols: ['#5f9a7a', '#7fb596', '#4f8a6a'], dots: '#fff' }], ['log', { snow: true }], ['tree', { cols: ['#5f9a7a', '#7fb596', '#4f8a6a'], snow: true }]] },
    { id: 'farm', ground: ['#cfe28c', '#b9d474'], patch: '#a9c862', path: '#ecd9a6', rows: true, flowers: ['#ffd54a', '#fff'], scene: 'farm', border: ['tree', { cols: ['#5aa94f', '#6fc25f', '#7ed46e'], apples: true }],
      spots: [['hay', {}], ['crate', {}], ['pumpkin', {}], ['bush', {}], ['tree', { cols: ['#5aa94f', '#6fc25f', '#7ed46e'], apples: true }], ['log', {}]] },
    { id: 'night', ground: ['#3d6659', '#335648'], patch: '#2c4c40', path: '#587a72', night: true, flowers: ['#b8e6ff', '#fff3b0'], scene: 'night', border: ['tree', { cols: ['#2f6a55', '#3c7d66', '#2a5a48'], trunk: '#5a4636' }],
      spots: [['mushroom', {}], ['log', { bark: '#7a5638', core: '#c9a070' }], ['rock', { hi: '#8c96ad', lo: '#68738c', cap: '#4f8a6a' }], ['bush', { cols: ['#2f6a55', '#3c7d66', '#2a5a48'], dots: '#b8e6ff' }], ['tree', { cols: ['#2f6a55', '#3c7d66', '#2a5a48'], trunk: '#5a4636' }], ['mushroom', {}]] }
  ];

  class HideGame {
    constructor(host) {
      this.host = host;
      this.canvas = document.createElement('canvas'); this.canvas.className = 'game-canvas';
      host.append(this.canvas); this.ctx = this.canvas.getContext('2d');
      this.bag = store.bag('hide', () => ({ found: 0, rounds: 0 }));
      this.bag.found = this.bag.found || 0; this.bag.rounds = this.bag.rounds || 0;
      this.counter = SPG.ui.counter(host, (c, s) => { c.strokeStyle = '#5a3f5e'; c.lineWidth = s * .09; c.lineCap = 'round'; c.beginPath(); c.arc(s * .42, s * .42, s * .22, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(s * .58, s * .58); c.lineTo(s * .78, s * .78); c.stroke(); c.fillStyle = 'rgba(127,212,245,.5)'; c.beginPath(); c.arc(s * .42, s * .42, s * .2, 0, TAU); c.fill(); }, this.bag.found);
      this.fx = new art.Fx(); this.t = 0; this.running = false; this.since = 0; this.state = 'play'; this.stateT = 0; this.wonK = 0;
      this.me = { x: 0, y: 0, dir: 1, walk: 0, moving: false };
      this.goal = null; this.want = null; this.steer = null; this.keys = {}; this.cam = { x: 0, y: 0 }; this.bumpT = 0;
      this.tick = this.tick.bind(this);
      const cv = this.canvas, at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * this.w / r.width, y: (e.clientY - r.top) * this.h / r.height }; };
      cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* optional */ } SPG.audio.unlock(); const p = at(e); this.steer = { id: e.pointerId, sx: p.x, sy: p.y, x: p.x, y: p.y, moved: false, t: this.t }; });
      cv.addEventListener('pointermove', e => { const s = this.steer; if (!s || s.id !== e.pointerId) return; e.preventDefault(); const p = at(e); s.x = p.x; s.y = p.y; if (Math.hypot(p.x - s.sx, p.y - s.sy) > 14) s.moved = true; });
      for (const n of ['pointerup', 'pointercancel']) cv.addEventListener(n, e => { const s = this.steer; if (!s || s.id !== e.pointerId) return; this.steer = null; if (!s.moved) this.tapAt(s.x, s.y); });
      this.onKey = e => { this.keys[e.key] = e.type === 'keydown'; };
      addEventListener('keydown', this.onKey); addEventListener('keyup', this.onKey);
      this.newRound(true);
    }

    /* ---------------------------------------------------------------- the world */
    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.w = r.width; this.h = r.height;
      const dpr = SPG.ui.dpr();
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ui = clamp(Math.min(this.w, this.h * 1.4) / 780, .6, 1.4);
      this.S = clamp(Math.min(this.w, this.h) * .28, 80, 240);
      this.WW = Math.max(this.w * 2.6, this.S * 14); this.WH = Math.max(this.h * 2.2, this.S * 9);
      this.place();
      this.draw();
    }
    // (Re)place everything from the saved layout (fractions of the world), so a rotated screen keeps the same map.
    place() {
      if (!this.layout) return;
      const L = this.layout, WW = this.WW, WH = this.WH, S = this.S;
      this.spots = L.spots.map(o => Object.assign(o, { x: o.fx * WW, y: o.fy * WH, r: S * .3 }));
      this.trees = L.trees.map(o => ({ x: o.fx * WW, y: o.fy * WH, r: S * .16, seed: o.seed }));
      this.decor = L.decor.map(o => Object.assign(o, { x: o.fx * WW, y: o.fy * WH }));
      this.pathPts = L.path.map(p => ({ x: p.fx * WW, y: p.fy * WH }));
      this.pondAt = L.pond ? { x: L.pond.fx * WW, y: L.pond.fy * WH, rx: S * 1.7, ry: S * 1.0 } : null;
      // keep the pond clear of hiding places (empty ones are dropped, hiding ones move aside)
      if (this.pondAt && !L.pondFixed) {
        L.pondFixed = true; const p = this.pondAt;
        L.spots = L.spots.filter(o => { const d = Math.hypot((o.x - p.x) / (p.rx * 1.3), (o.y - p.y) / (p.ry * 1.3)); if (d >= 1) return true; if (!o.friend) return false; o.fx = (o.x + (o.x < p.x ? -1 : 1) * p.rx * 1.4) / WW; o.x = o.fx * WW; return true; });
        this.spots = L.spots;
      }
      if (!this.me.placed) { this.me.x = WW / 2; this.me.y = WH / 2; this.me.placed = true; }
      this.me.x = clamp(this.me.x, S * .4, WW - S * .4); this.me.y = clamp(this.me.y, S * .9, WH - S * .3);
    }
    newRound(first) {
      const round = this.bag.rounds++, W = WORLDS[round % WORLDS.length], n = Math.min(6, 3 + Math.floor(round / 2));
      this.world = W; this.state = 'play'; this.stateT = 0; this.wonK = 0; this.since = 0; this.fx.p.length = 0; this.goal = null; this.want = null;
      const S = this.S || 150, WWf = 1, mind = 1.55;   // fractions of the world; spacing is checked in screen-size units
      const ww = this.WW || 3000, wh = this.WH || 2000, pts = [];
      const ok = (fx, fy, md) => pts.every(p => Math.hypot((fx - p.fx) * ww, (fy - p.fy) * wh) > S * md) && Math.hypot((fx - .5) * ww, (fy - .5) * wh) > S * 1.8;
      const spots = [], nSpots = clamp(Math.round(ww * wh / (S * S * 9)), 12, 22);
      for (let tries = 0; spots.length < nSpots && tries < 900; tries++) {
        const fx = .07 + Math.random() * .86, fy = .12 + Math.random() * .8;
        if (!ok(fx, fy, mind)) continue;
        const [kind, pal] = W.spots[spots.length % W.spots.length];
        spots.push({ fx, fy, kind, pal, friend: null, checked: false, shake: 0, halo: 0, haloK: 0 }); pts.push({ fx, fy });
      }
      const kinds = KINDS.filter(k => k !== 'mypet' || SPG.pets.active()).sort(() => Math.random() - .5).slice(0, n);
      spots.map((_, i) => i).sort(() => Math.random() - .5).slice(0, n).forEach((si, i) => { spots[si].friend = { kind: kinds[i], found: false, jump: 0, t: 0 }; });
      const trees = [], step = S * .8;
      for (let x = 0; x <= ww; x += step) { trees.push({ fx: x / ww, fy: .012, seed: x }); trees.push({ fx: x / ww, fy: 1 - .008, seed: x + 7 }); }
      for (let y = step; y < wh - step * .5; y += step) { trees.push({ fx: .008, fy: y / wh, seed: y }); trees.push({ fx: 1 - .008, fy: y / wh, seed: y + 3 }); }
      const decor = [];
      for (let i = 0; i < 140; i++) { const fx = .03 + Math.random() * .94, fy = .05 + Math.random() * .9; decor.push({ fx, fy, kind: i % 5 === 0 ? 'grass' : 'flower', col: W.flowers[i % W.flowers.length], s: .6 + Math.random() * .7 }); }
      const path = []; for (let i = 0; i < 5; i++) path.push({ fx: .08 + i * .21 + (Math.random() - .5) * .05, fy: .3 + Math.random() * .4 });
      const pond = W.pond || W.sea ? null : null;
      this.layout = { spots, trees, decor, path, pond: W.pond ? { fx: .18 + Math.random() * .64, fy: .3 + Math.random() * .4 } : null,
        patches: Array.from({ length: 90 }, () => ({ fx: Math.random(), fy: Math.random(), s: .5 + Math.random() * 1.2 })) };
      if (this.pondBlock) this.pondBlock = null;
      this.me.placed = false;
      if (this.w) this.place();
      if (!first) sfx.chime();
      store.save();
    }
    start() { this.resize(); this.resume(); voice.say('hide-start'); }
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); this.steer = null; }
    destroy() { this.pause(); removeEventListener('keydown', this.onKey); removeEventListener('keyup', this.onKey); this.canvas.remove(); this.counter.el.remove(); }

    /* ---------------------------------------------------------------- walking and looking */
    toWorld(x, y) { return { x: x + this.cam.x, y: y + this.cam.y }; }
    mm() { const mw = Math.min(this.w * .3, 190), mh = mw * this.WH / this.WW; return { x: 14, y: 96 * this.ui + 20, w: mw, h: mh }; }
    tapAt(sx, sy) {
      if (this.state !== 'play') return;
      const m = this.mm();
      if (sx > m.x && sx < m.x + m.w && sy > m.y && sy < m.y + m.h) {   // a tap on the little map walks there
        this.goal = { x: (sx - m.x) / m.w * this.WW, y: (sy - m.y) / m.h * this.WH }; this.want = null; sfx.tap(); return;
      }
      const p = this.toWorld(sx, sy);
      let best = null, bd = 1e9;
      for (const sp of this.spots) { const d = Math.hypot(p.x - sp.x, p.y - (sp.y - this.S * .38)); if (d < this.S * .62 && d < bd) { best = sp; bd = d; } }
      if (best) { this.want = best; this.goal = { x: best.x, y: best.y + best.r + this.S * .34 }; sfx.tap(); }
      else { this.want = null; this.goal = { x: p.x, y: p.y }; }
      this.since = 0;
    }
    look(sp) {
      if (sp.friend && !sp.friend.found) { this.reveal(sp); return; }
      if (sp.friend && sp.friend.found) { sp.friend.jump = 1; return; }
      sp.shake = 1; sp.checked = true; sfx.rustle(); this.since = 0;
      // how warm is it? (how near is the closest friend still hiding)
      let near = 1e9; for (const q of this.spots) if (q.friend && !q.friend.found) near = Math.min(near, Math.hypot(q.x - sp.x, q.y - sp.y));
      const k = clamp(1 - near / (Math.hypot(this.WW, this.WH) * .28), 0, 1);
      sp.haloK = k; sp.halo = 1;
      setTimeout(() => sfx.warm(k), 180);
    }
    reveal(sp) {
      const f = sp.friend; f.found = true; f.jump = 1; f.t = 0; sp.checked = true; this.since = 0;
      this.bag.found++; this.counter.set(this.bag.found); store.save();
      sfx.pop(); setTimeout(() => sfx.win(), 120);
      if (f.kind === 'mypet') SPG.pets.noise(SPG.pets.active().id); else sfx.critter(f.kind, 3);
      this.fx.burst(sp.x - this.cam.x, sp.y - this.S * .5 - this.cam.y, 16, { colors: RAINBOW, speed: 260, g: 360, life: 1, size: 6 * this.ui, shape: 'confetti', up: 200 });
      voice.say('hide-found');
      if (this.spots.every(q => !q.friend || q.friend.found)) { this.state = 'won'; this.stateT = 0; store.addStars(1); setTimeout(() => { sfx.cheer(); voice.say('hide-done'); }, 1400); }
    }

    tick(now) {
      if (!this.running) return;
      const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt; this.stateT += dt; this.since += dt; this.bumpT = Math.max(0, this.bumpT - dt);
      const me = this.me, S = this.S, PR = S * .16;
      // steering: hold and drag to walk that way; a tap sets a place to walk to
      let vx = 0, vy = 0;
      if (this.state !== 'won' || true) {
        const st = this.steer;
        if (st && st.moved) { const w = this.toWorld(st.x, st.y); this.goal = { x: w.x, y: w.y }; this.want = null; }
        if (this.keys.ArrowLeft || this.keys.a) { vx -= 1; this.goal = null; } if (this.keys.ArrowRight || this.keys.d) { vx += 1; this.goal = null; }
        if (this.keys.ArrowUp || this.keys.w) { vy -= 1; this.goal = null; } if (this.keys.ArrowDown || this.keys.s) { vy += 1; this.goal = null; }
        if (this.goal) { const dx = this.goal.x - me.x, dy = this.goal.y - me.y, d = Math.hypot(dx, dy); if (d < 8) { this.goal = null; if (this.want) { const sp = this.want; this.want = null; this.look(sp); } } else { vx = dx / d; vy = dy / d; } }
      }
      const speed = S * 1.9, moving = vx || vy;
      me.moving = !!moving;
      if (moving) { const l = Math.hypot(vx, vy); me.x += vx / l * speed * dt; me.y += vy / l * speed * dt; if (Math.abs(vx) > .2) me.dir = vx > 0 ? 1 : -1; me.walk += dt * 9; }
      // bumping into things: solid, and looks behind them
      const push = (o, r, sp) => { const dx = me.x - o.x, dy = (me.y - o.y) * 1.6, d = Math.hypot(dx, dy), min = r + PR; if (d < min && d > .01) { me.x = o.x + dx / d * min; me.y = o.y + (dy / d * min) / 1.6; if (sp && this.bumpT <= 0 && this.state === 'play') { this.bumpT = 1.2; this.look(sp); } } };
      for (const sp of this.spots) push(sp, sp.r, sp);
      for (const tr of this.trees) push(tr, tr.r);
      if (this.pondAt) { const p = this.pondAt, dx = (me.x - p.x) / (p.rx * .9), dy = (me.y - p.y) / (p.ry * .9), d = Math.hypot(dx, dy); if (d < 1) { me.x = p.x + dx / d * p.rx * .9; me.y = p.y + dy / d * p.ry * .9; } }
      me.x = clamp(me.x, S * .4, this.WW - S * .4); me.y = clamp(me.y, S * .9, this.WH - S * .3);
      // camera follows
      const tx = clamp(me.x - this.w / 2, 0, this.WW - this.w), ty = clamp(me.y - this.h * .58, 0, this.WH - this.h);
      this.cam.x = lerp(this.cam.x, tx, Math.min(1, dt * 5)); this.cam.y = lerp(this.cam.y, ty, Math.min(1, dt * 5));
      if (this.first !== false) { this.cam.x = tx; this.cam.y = ty; this.first = false; }
      for (const sp of this.spots) { sp.shake = Math.max(0, sp.shake - dt * 2.4); sp.halo = Math.max(0, sp.halo - dt * .7); if (sp.friend && sp.friend.found) { sp.friend.t += dt; sp.friend.jump = Math.max(0, sp.friend.jump - dt * 1.6); } }
      if (this.state === 'won') { this.wonK = Math.min(1, this.wonK + dt * .6); if (this.stateT > 6) { this.first = true; this.newRound(false); } }
      this.fx.update(dt);
      this.draw(); this.raf = requestAnimationFrame(this.tick);
    }

    /* ---------------------------------------------------------------- drawing */
    friendArt(c, f, S, hop) {
      c.save();
      if (f.kind === 'mypet') { const a = SPG.pets.active(); SPG.pets.draw(c, a.id, S * .5, this.t, { mood: hop ? 'cheer' : 'happy', hop, hat: a.hat }); }
      else art.creature(c, f.kind, S * 1.7 * (SZ[f.kind] || .22), this.t, false);
      c.restore();
    }
    drawGround(c) {
      const W = this.world, w = this.w, h = this.h, cx = this.cam.x, cy = this.cam.y, S = this.S;
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, W.ground[0]); g.addColorStop(1, W.ground[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
      if (W.sea) {   // the sea along the bottom of the beach map
        const sy = this.WH - S * 1.3 - cy; if (sy < h) { const sg = c.createLinearGradient(0, sy, 0, sy + S * 1.4); sg.addColorStop(0, '#6ccbe8'); sg.addColorStop(1, '#3fb4d8'); c.fillStyle = sg; c.fillRect(0, sy, w, h - sy + 4); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(0, sy); for (let x = 0; x <= w + 20; x += 20) c.lineTo(x, sy + Math.sin((x + cx) / 40 + this.t * 1.5) * 6); c.lineTo(w, sy - 16); c.lineTo(0, sy - 16); c.closePath(); c.globalAlpha = .55; c.fill(); c.globalAlpha = 1; }
      }
      if (W.rows) { c.fillStyle = 'rgba(120,150,60,.22)'; for (let y = -((cy) % (S * .5)); y < h; y += S * .5) c.fillRect(0, y, w, S * .18); }
      for (const p of this.layout.patches) { const x = p.fx * this.WW - cx, y = p.fy * this.WH - cy; if (x < -S || x > w + S || y < -S || y > h + S) continue; c.fillStyle = W.patch; c.globalAlpha = .55; c.beginPath(); c.ellipse(x, y, S * .5 * p.s, S * .18 * p.s, 0, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      // a winding path
      c.save(); c.translate(-cx, -cy); c.lineCap = c.lineJoin = 'round'; c.strokeStyle = W.path; c.lineWidth = S * .45; c.globalAlpha = .8; c.beginPath();
      this.pathPts.forEach((p, i) => i ? c.quadraticCurveTo((this.pathPts[i - 1].x + p.x) / 2, this.pathPts[i - 1].y + (i % 2 ? -1 : 1) * S * .5, p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); c.globalAlpha = 1;
      if (this.pondAt) { const p = this.pondAt, pg = c.createRadialGradient(p.x, p.y, p.rx * .2, p.x, p.y, p.rx); pg.addColorStop(0, '#8fdcf5'); pg.addColorStop(1, '#5bbfe6'); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(p.x, p.y, p.rx * 1.06, p.ry * 1.08, 0, 0, TAU); c.fill(); c.fillStyle = pg; c.beginPath(); c.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(p.x + Math.sin(this.t + i) * 8, p.y + (i - 1) * p.ry * .35, p.rx * (.35 - i * .05), p.ry * .1, 0, 0, Math.PI); c.stroke(); } c.fillStyle = '#5cb85c'; for (const [x, y] of [[-.4, .1], [.3, -.2], [.1, .35]]) { c.beginPath(); c.ellipse(p.x + x * p.rx, p.y + y * p.ry, S * .16, S * .08, 0, 0, TAU); c.fill(); } c.fillStyle = '#ffb3d1'; c.beginPath(); c.arc(p.x + .3 * p.rx, p.y - .2 * p.ry, S * .05, 0, TAU); c.fill(); }
      c.restore();
    }
    draw() {
      const c = this.ctx, w = this.w, h = this.h; if (!w || !this.layout) return;
      const S = this.S, cx = this.cam.x, cy = this.cam.y, me = this.me, W = this.world;
      this.drawGround(c);
      // things standing on the ground, back to front
      const list = [];
      for (const d of this.decor) if (d.x > cx - 30 && d.x < cx + w + 30 && d.y > cy - 30 && d.y < cy + h + 30) list.push({ y: d.y, kind: 'decor', o: d });
      for (const t of this.trees) if (t.x > cx - S && t.x < cx + w + S && t.y > cy - S * .3 && t.y < cy + h + S * 2.4) list.push({ y: t.y, kind: 'tree', o: t });
      for (const sp of this.spots) if (sp.x > cx - S && sp.x < cx + w + S && sp.y > cy - S * .2 && sp.y < cy + h + S * 2.4) list.push({ y: sp.y, kind: 'spot', o: sp });
      list.push({ y: me.y, kind: 'me', o: me });
      list.sort((a, b) => a.y - b.y);
      for (const it of list) {
        const o = it.o;
        if (it.kind === 'decor') {
          c.save(); c.translate(o.x - cx, o.y - cy);
          if (o.kind === 'flower') { c.strokeStyle = W.night ? '#3f7a62' : '#59b96e'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -S * .12 * o.s); c.stroke(); c.fillStyle = o.col; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(Math.cos(k * TAU / 5) * S * .035 * o.s, -S * .12 * o.s + Math.sin(k * TAU / 5) * S * .035 * o.s, S * .028 * o.s, 0, TAU); c.fill(); } c.fillStyle = '#ffe066'; c.beginPath(); c.arc(0, -S * .12 * o.s, S * .022 * o.s, 0, TAU); c.fill(); }
          else { c.strokeStyle = W.night ? '#4f8a72' : '#6fc26a'; c.lineWidth = 2.5; c.lineCap = 'round'; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * S * .03, 0); c.quadraticCurveTo(k * S * .05, -S * .08 * o.s, k * S * .08, -S * .13 * o.s); c.stroke(); } }
          c.restore();
        } else if (it.kind === 'tree') {
          c.save(); c.translate(o.x - cx, o.y - cy); c.fillStyle = 'rgba(40,60,40,.18)'; c.beginPath(); c.ellipse(0, 3, S * .34, S * .07, 0, 0, TAU); c.fill();
          const [kind, pal] = W.border; SPOT[kind](c, S * .82, pal); c.restore();
        } else if (it.kind === 'spot') {
          const f = o.friend;
          c.save(); c.translate(o.x - cx, o.y - cy);
          c.fillStyle = 'rgba(40,60,40,.2)'; c.beginPath(); c.ellipse(0, 3, S * .55, S * .08, 0, 0, TAU); c.fill();
          c.save(); c.rotate(Math.sin(o.shake * 26) * o.shake * .06); c.globalAlpha = o.checked && !(f && f.found) ? .84 : 1; SPOT[o.kind](c, S, o.pal); c.restore();
          if (f && f.found) { const hop = Math.abs(Math.sin(f.t * 5)) * (this.state === 'won' ? .12 : .04) + Math.sin(f.jump * Math.PI) * .3; c.save(); c.translate(S * .68, S * .1 - hop * S); this.friendArt(c, f, S, f.jump); c.restore(); }
          if (o.halo > 0) { const col = o.haloK > .66 ? '#ff7a45' : o.haloK > .33 ? '#ffc93c' : '#6fb4f0'; c.strokeStyle = col; c.globalAlpha = Math.min(1, o.halo * 1.4); c.lineWidth = S * .07; c.beginPath(); c.ellipse(0, -S * .38, S * (.62 + (1 - o.halo) * .2), S * (.52 + (1 - o.halo) * .15), 0, 0, TAU); c.stroke(); c.fillStyle = col; c.globalAlpha = o.halo * .18; c.fill(); c.globalAlpha = 1; }
          if (this.since > 30 && f && !f.found && this.state === 'play') { c.globalAlpha = .6 + Math.sin(this.t * 5) * .4; for (let k = 0; k < 3; k++) art.star(c, (k - 1) * S * .3, -S * (1.0 + Math.sin(this.t * 2 + k) * .08), S * .1, '#ffe066', this.t + k); c.globalAlpha = 1; }   // stuck for a while: sparkles over the right place when it is close by
          c.restore();
        } else {   // her
          const a = SPG.pets.active(); c.save(); c.translate(me.x - cx, me.y - cy - (me.moving ? Math.abs(Math.sin(me.walk)) * S * .05 : 0));
          c.fillStyle = 'rgba(40,60,40,.22)'; c.beginPath(); c.ellipse(0, 3 + (me.moving ? Math.abs(Math.sin(me.walk)) * S * .05 : 0), S * .2, S * .04, 0, 0, TAU); c.fill();
          c.rotate(me.moving ? Math.sin(me.walk) * .06 : 0); c.scale(me.dir < 0 ? -1 : 1, 1);
          SPG.pets.draw(c, a ? a.id : 'bunny', S * .62, this.t, { mood: this.state === 'won' ? 'cheer' : 'happy', hat: a ? a.hat : null, hop: 0 });
          c.restore();
        }
      }
      // weather and glow of the place
      if (W.night) { c.fillStyle = 'rgba(15,20,60,.28)'; c.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { const fx = ((rnd(i) * this.WW - cx * 1.1) % w + w) % w, fy = ((rnd(i + 30) * this.WH - cy * 1.1 + Math.sin(this.t * .7 + i) * 14) % h + h) % h, a = .4 + Math.sin(this.t * 2 + i * 3) * .4; const g = c.createRadialGradient(fx, fy, 0, fx, fy, 14); g.addColorStop(0, `rgba(255,240,140,${Math.max(0, a)})`); g.addColorStop(1, 'rgba(255,240,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(fx, fy, 14, 0, TAU); c.fill(); } }
      if (W.id === 'snow') { c.fillStyle = 'rgba(255,255,255,.95)'; for (let i = 0; i < 40; i++) { const y = ((this.t * (.05 + rnd(i) * .05) + rnd(i + 40)) % 1) * h, x = (rnd(i + 90) + Math.sin(this.t * .7 + i) * .02) * w; c.beginPath(); c.arc(x, y, 2 + rnd(i + 5) * 3, 0, TAU); c.fill(); } }
      if (this.wonK > 0) { const k = this.wonK; c.save(); c.globalAlpha = .85 * k; c.lineWidth = Math.min(w, h) * .03; c.lineCap = 'round'; RAINBOW.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(w / 2, h * .66, Math.min(w * .46, h * .5) * (1 - i * .05), Math.PI * 1.05, Math.PI * (1.05 + .9 * k)); c.stroke(); }); c.restore(); }
      this.fx.draw(c);
      this.drawHint(c); this.drawMap(c);
    }
    // stuck for a while? a soft arrow at the edge of the screen points to the nearest friend still hiding
    drawHint(c) {
      if (this.since < 30 || this.state !== 'play') return;
      let best = null, bd = 1e9; for (const sp of this.spots) if (sp.friend && !sp.friend.found) { const d = Math.hypot(sp.x - this.me.x, sp.y - this.me.y); if (d < bd) { bd = d; best = sp; } }
      if (!best || bd < this.S * 2.2) return;
      const dx = best.x - this.me.x, dy = best.y - this.me.y, a = Math.atan2(dy, dx), r = Math.min(this.w, this.h) * .36;
      const x = this.w / 2 + Math.cos(a) * r * (this.w / this.h > 1 ? 1.5 : 1), y = this.h * .5 + Math.sin(a) * r;
      c.save(); c.translate(clamp(x, 50, this.w - 50), clamp(y, 120, this.h - 50)); c.rotate(a); const p = 1 + Math.sin(this.t * 5) * .12; c.scale(p, p);
      c.fillStyle = 'rgba(255,224,102,.95)'; c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(-26, -20); c.lineTo(10, -20); c.lineTo(10, -34); c.lineTo(38, 0); c.lineTo(10, 34); c.lineTo(10, 20); c.lineTo(-26, 20); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
    drawMap(c) {
      const m = this.mm(), sx = m.w / this.WW, sy = m.h / this.WH, W = this.world;
      c.save(); c.fillStyle = 'rgba(255,255,255,.7)'; art.rr(c, m.x - 6, m.y - 6, m.w + 12, m.h + 12, 14); c.fill();
      c.beginPath(); art.rr(c, m.x, m.y, m.w, m.h, 10); c.clip();
      const g = c.createLinearGradient(0, m.y, 0, m.y + m.h); g.addColorStop(0, W.ground[0]); g.addColorStop(1, W.ground[1]); c.fillStyle = g; c.fillRect(m.x, m.y, m.w, m.h);
      if (W.sea) { c.fillStyle = '#6ccbe8'; c.fillRect(m.x, m.y + m.h - this.S * 1.3 * sy, m.w, this.S * 1.3 * sy); }
      if (this.pondAt) { c.fillStyle = '#6ccbe8'; c.beginPath(); c.ellipse(m.x + this.pondAt.x * sx, m.y + this.pondAt.y * sy, this.pondAt.rx * sx, this.pondAt.ry * sy, 0, 0, TAU); c.fill(); }
      for (const sp of this.spots) {
        const x = m.x + sp.x * sx, y = m.y + sp.y * sy;
        if (sp.friend && sp.friend.found) { art.heart(c, x, y, 5 * this.ui + 2, '#ff6b81'); }
        else if (sp.checked) { c.fillStyle = 'rgba(90,63,94,.4)'; c.beginPath(); c.arc(x, y, 3 * this.ui + 1, 0, TAU); c.fill(); }
        else { c.fillStyle = 'rgba(40,120,60,.9)'; c.beginPath(); c.arc(x, y, 3.5 * this.ui + 1, 0, TAU); c.fill(); }
      }
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.strokeRect(m.x + this.cam.x * sx, m.y + this.cam.y * sy, this.w * sx, this.h * sy);
      c.fillStyle = '#ffd54a'; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(m.x + this.me.x * sx, m.y + this.me.y * sy, 5 * this.ui + 1, 0, TAU); c.fill(); c.stroke();
      c.restore();
    }
  }

  SPG.games.push({
    id: 'hide', name: 'Hide and Seek', order: 10,
    icon(c, w, h) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fd88a'); g.addColorStop(1, '#86cc74'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      const S = Math.min(w * .3, h * 1.15);
      c.strokeStyle = '#e9d5a8'; c.lineWidth = S * .16; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * .05, h * .8); c.quadraticCurveTo(w * .35, h * .3, w * .95, h * .7); c.stroke();
      c.save(); c.translate(w * .2, h * .9); SPOT.bush(c, S * .8, {}); c.restore();
      c.save(); c.translate(w * .78, h * .92); SPOT.tree(c, S * .7, {}); c.restore();
      c.save(); c.translate(w * .5, h * .95); SPOT.rock(c, S * .7, {}); c.restore();
      c.save(); c.translate(w * .34, h * .92); SPG.pets.draw(c, 'bunny', S * .62, 1, { mood: 'happy' }); c.restore();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(w * .36, h * .55); c.quadraticCurveTo(w * .5, h * .3, w * .68, h * .5); c.stroke(); c.setLineDash([]);
      art.star(c, w * .7, h * .42, S * .09, '#ffe066', .3);
    },
    create: host => new HideGame(host)
  });
})();
