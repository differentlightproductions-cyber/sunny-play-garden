// Fruit Splash: swipe (or just tap) the happy fruit floating up. No timer, no losing.
// The swipe/segment collision and launch-arc physics carry over from the first version;
// arcs are slower and floatier for small hands.
(() => {
  const SPG = window.SPG;
  const { art, sfx, voice, store } = SPG;
  const TAU = Math.PI * 2;

  class FruitGame {
    constructor(host) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'game-canvas';
      host.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.fx = new art.Fx();
      this.fruits = []; this.halves = []; this.splats = [];
      this.t = 0; this.starIn = 12 + Math.random() * 8; this.sliced = 0; this.recent = []; this.lastSwoosh = 0; this.lastPraise = 0;
      this.running = false; this.ptrs = new Map(); this.faded = []; // up to 5 fingers at once
      this.bag = store.bag('fruit', () => ({ total: 0 }));
      this.scenic = SPG.scenery.fader(this.sceneAt(this.bag.total));
      this.counter = SPG.ui.counter(host, (c, s) => { c.translate(s / 2, s / 2 + 2); art.fruit(c, 2, s * .36, {}); }, this.bag.total);
      this.tick = this.tick.bind(this);
      const cv = this.canvas;
      cv.addEventListener('pointerdown', e => this.down(e));
      cv.addEventListener('pointermove', e => this.move(e));
      for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(t, e => this.up(e));
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const ow = this.w || r.width, oh = this.h || r.height;
      this.w = r.width; this.h = r.height;
      const dpr = SPG.ui.dpr();
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const f of [...this.fruits, ...this.halves]) { f.x *= this.w / ow; f.y *= this.h / oh; f.vx *= this.w / ow; f.vy *= this.h / oh; }
      this.draw();
    }

    start() { this.resize(); this.spawnIn = .4; this.resume(); }
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); this.ptrs.clear(); this.faded.length = 0; }
    destroy() { this.pause(); this.canvas.remove(); this.counter.el.remove(); }

    point(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * this.w / r.width, y: (e.clientY - r.top) * this.h / r.height, time: performance.now() };
    }

    down(e) {
      if (!this.running || (this.ptrs.size >= 5 && !this.ptrs.has(e.pointerId))) return;
      e.preventDefault();
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { /* capture is optional */ }
      const p = this.point(e);
      this.ptrs.set(e.pointerId, { last: p, trail: [p] });
      this.slice(p, p, 1.2); // a tap counts as a slice
    }

    move(e) {
      const st = this.ptrs.get(e.pointerId);
      if (!this.running || !st) return;
      e.preventDefault();
      for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) {
        const next = this.point(ev);
        const speed = Math.hypot(next.x - st.last.x, next.y - st.last.y);
        if (speed > 14 && next.time - this.lastSwoosh > 240) { sfx.whoosh(); this.lastSwoosh = next.time; }
        this.slice(st.last, next, 1);
        st.last = next; st.trail.push(next);
        if (speed > 6) this.fx.burst(next.x, next.y, 1, { colors: ['#fff', '#ffd1e0', '#ffe98a'], speed: 40, g: 0, life: .4, size: 4 });
      }
      if (st.trail.length > 26) st.trail.splice(0, st.trail.length - 26);
    }

    up(e) {
      const st = this.ptrs.get(e.pointerId);
      if (!st) return;
      this.ptrs.delete(e.pointerId);
      this.faded.push(st.trail); // let the finished swipe fade out instead of vanishing
    }

    // A whole segment catches fruit even when a fast swipe skips over it between events.
    static hits(a, b, c, mul) {
      const dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      const x = a.x + t * dx - c.x, y = a.y + t * dy - c.y;
      return x * x + y * y <= (c.r * .9 * mul) ** 2;
    }

    slice(a, b, mul) {
      for (let i = this.fruits.length - 1; i >= 0; i--) {
        const f = this.fruits[i];
        if (!FruitGame.hits(a, b, f, mul)) continue;
        this.fruits.splice(i, 1);
        this.cut(f);
      }
    }

    // A rare golden star: slicing it rains stars and gives a little bonus.
    spawnStar() {
      const g = this.h * 1.05, r = Math.max(44, Math.min(84, Math.min(this.w * .11, this.h * .1)));
      const x = this.w * (.25 + Math.random() * .5);
      this.fruits.push({ x, y: this.h + r + 6, vx: (this.w / 2 - x) * .25, vy: -Math.sqrt(2 * g * this.h * .62), r, special: true, type: 0, rotation: 0, vr: .8, wow: 0, blink: 9 });
    }

    cutStar(f) {
      store.addStars(2); sfx.win(); voice.praise();
      this.fx.burst(f.x, f.y, 30, { colors: ['#ffd54a', '#fff3b0', '#ffb347'], speed: 420, g: 500, life: 1.2, size: f.r * .22, shape: 'star', up: 160 });
      for (let i = 0; i < 26; i++) this.fx.p.push({ x: Math.random() * this.w, y: -20 - Math.random() * this.h * .3, vx: (Math.random() - .5) * 60, vy: 120 + Math.random() * 180, g: 180, life: 2 + Math.random(), max: 2.5, size: 9 + Math.random() * 12, color: ['#ffd54a', '#fff3b0', '#ff9db8', '#a6e8c8'][i % 4], shape: 'star', rot: Math.random() * 6, vr: (Math.random() - .5) * 5 });
      for (let i = 0; i < 6; i++) sfx.plink(i);
    }

    cut(f) {
      if (f.special) { this.cutStar(f); return; }
      this.sliced++; this.bag.total++; this.counter.set(this.bag.total); store.save();
      { const sc = this.sceneAt(this.bag.total); if (sc !== this.scenic.id) { this.scenic.set(sc); sfx.chime(); this.fx.burst(this.w / 2, this.h * .3, 22, { colors: ['#ffd54a', '#fff', '#ff9db8', '#a6e8c8'], speed: 320, g: 300, life: 1.2, size: 8, shape: 'star', up: 200 }); } }   // every 40 fruits: somewhere new
      const kick = Math.max(this.h * .1, 70);
      for (const side of [-1, 1]) this.halves.push({ ...f, side, x: f.x + side * 4, vx: f.vx * .6 + side * kick, vy: f.vy * .4 - kick * .5, vr: side * 2.6, life: 1.1 });
      const juice = art.FRUIT_JUICE[f.type];
      this.fx.burst(f.x, f.y, 16, { colors: [juice, juice, '#fff'], speed: 340, g: 900, life: .75, size: f.r * .13 });
      this.fx.burst(f.x, f.y, 4, { colors: ['#ffd54a', '#fff'], speed: 200, g: 60, life: .8, size: f.r * .3, shape: 'star' });
      this.splats.push({ x: f.x, y: f.y, r: f.r * 1.15, color: juice, life: 3, seed: Math.random() * 9 });
      if (this.splats.length > 10) this.splats.shift();
      sfx.splash(); sfx.plink(this.sliced);

      const now = performance.now();
      this.recent = this.recent.filter(t => now - t < 900); this.recent.push(now);
      if (this.recent.length >= 3 && now - this.lastPraise > 3500) {
        this.lastPraise = now; this.recent.length = 0;
        sfx.win(); voice.praise(); store.addStars(1);
        this.fx.burst(this.w / 2, this.h * .35, 26, { colors: ['#ff7a8a', '#ffd54a', '#59b96e', '#4fb3e8', '#9a7be8'], speed: 420, g: 500, life: 1.2, size: 8, shape: 'confetti', up: 120 });
      }
      if (this.sliced % 5 === 0) { store.addStars(1); sfx.chime(); }
    }

    spawn() {
      const count = Math.random() < .2 ? 2 + (Math.random() < .4 ? 1 : 0) : 1;
      const r0 = Math.max(28, Math.min(68, Math.min(this.w * .09, this.h * .085)));
      const g = this.h * 1.05, mid = this.w * (.22 + Math.random() * .56);
      const apex = this.h * (.55 + Math.random() * .22);
      for (let i = 0; i < count; i++) {
        const r = r0 * (.9 + Math.random() * .22);
        const x = Math.max(r, Math.min(this.w - r, mid + (i - (count - 1) / 2) * r * 2.6));
        const towardCentre = (this.w / 2 - x) / this.w;
        this.fruits.push({
          x, y: this.h + r + 6,
          vx: (towardCentre * .5 + (Math.random() - .5) * .22) * this.w * .55,
          vy: -Math.sqrt(2 * g * apex),
          r, type: Math.floor(Math.random() * art.FRUIT_COUNT), rotation: Math.random() * TAU, vr: (Math.random() - .5) * 2.2,
          wow: 0, blink: Math.random() * 4
        });
      }
      this.spawnIn = 1.2 + Math.random() * .8;
    }

    sceneAt(total) { const L = ['meadow', 'beach', 'farm', 'sunset', 'autumn', 'night', 'snow', 'city']; return L[Math.floor((total || 0) / 40) % L.length]; }

    tick(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, .05); this.last = now; this.t += dt; this.scenic.update(dt);
      this.spawnIn -= dt;
      if (this.fruits.length === 0) this.spawnIn = Math.min(this.spawnIn, .35);
      if (this.spawnIn <= 0) this.spawn();
      if ((this.starIn -= dt) <= 0) { this.spawnStar(); this.starIn = 22 + Math.random() * 16; }
      const g = this.h * 1.05;
      for (const f of this.fruits) {
        f.x += f.vx * dt; f.y += f.vy * dt; f.vy += g * dt; f.rotation += f.vr * dt; f.blink -= dt;
        let near = false; for (const st of this.ptrs.values()) if (Math.hypot(f.x - st.last.x, f.y - st.last.y) < f.r * 2.4) near = true;
        f.wow = near ? .3 : Math.max(0, f.wow - dt);
      }
      this.fruits = this.fruits.filter(f => f.y < this.h + f.r * 2.5 && f.x > -f.r * 3 && f.x < this.w + f.r * 3);
      for (const h of this.halves) { h.x += h.vx * dt; h.y += h.vy * dt; h.vy += g * dt; h.rotation += h.vr * dt; h.life -= dt; }
      this.halves = this.halves.filter(h => h.life > 0 && h.y < this.h + h.r * 2);
      for (const s of this.splats) s.life -= dt;
      this.splats = this.splats.filter(s => s.life > 0);
      this.fx.update(dt);
      for (const st of this.ptrs.values()) st.trail = st.trail.filter(p => now - p.time < 170);
      this.faded = this.faded.map(tr => tr.filter(p => now - p.time < 170)).filter(tr => tr.length > 1);
      this.draw();
      this.raf = requestAnimationFrame(this.tick);
    }

    draw() {
      if (!this.w || !this.h) return;
      const c = this.ctx, { w, h } = this;
      this.scenic.draw(c, w, h, this.t);
      for (const s of this.splats) {
        c.globalAlpha = Math.min(.5, s.life * .25); c.fillStyle = s.color;
        for (let i = 0; i < 7; i++) { const a = i * TAU / 7 + s.seed, d = s.r * (.3 + (i % 3) * .28); c.beginPath(); c.arc(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, s.r * (.28 + (i % 2) * .16), 0, TAU); c.fill(); }
      }
      c.globalAlpha = 1;
      for (const f of this.fruits) {
        c.save(); c.translate(f.x, f.y); c.rotate(f.special ? Math.sin(this.t * 2) * .12 : f.rotation * .35);
        c.rotate(-(f.special ? Math.sin(this.t * 2) * .12 : f.rotation * .35)); c.fillStyle = 'rgba(90,63,94,.1)'; c.beginPath(); c.ellipse(0, f.r * .95, f.r * .75, f.r * .16, 0, 0, TAU); c.fill(); c.rotate(f.special ? Math.sin(this.t * 2) * .12 : f.rotation * .35);
        if (f.special) {
          const pulse = 1 + Math.sin(this.t * 6) * .05;
          c.shadowColor = 'rgba(255,213,74,.9)'; c.shadowBlur = f.r * .9; c.shadowOffsetY = 0;
          art.star(c, 0, 0, f.r * pulse, '#ffd54a'); c.shadowBlur = 0;
          c.save(); c.translate(0, f.r * .06); art.face(c, f.r * .62, { mood: f.wow > 0 ? 'wow' : 'happy' }); c.restore();
        } else art.fruit(c, f.type, f.r, { mood: f.wow > 0 ? 'wow' : 'happy', blink: f.blink < .12 && f.blink > 0 });
        c.restore();
      }
      for (const hf of this.halves) {
        c.save(); c.globalAlpha = Math.min(1, hf.life * 2.4); c.translate(hf.x, hf.y); c.rotate(hf.rotation);
        c.beginPath(); c.rect(hf.side < 0 ? -hf.r * 1.5 : 0, -hf.r * 1.5, hf.r * 1.5, hf.r * 3); c.clip();
        art.fruit(c, hf.type, hf.r, { cut: true });
        c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-1.5, -hf.r * 1.2, 3, hf.r * 2.4);
        c.restore();
      }
      this.fx.draw(c);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const trails = [...[...this.ptrs.values()].map(st => st.trail), ...this.faded];
      for (const tr of trails) {
        if (tr.length < 2) continue;
        for (const [col, wd] of [['rgba(255,122,154,.55)', 22], ['rgba(255,255,255,.95)', 7]]) {
          c.beginPath(); tr.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.strokeStyle = col; c.lineWidth = wd; c.stroke();
        }
      }
    }
  }

  SPG.games.push({
    id: 'fruit', name: 'Fruit Splash', order: 2,
    icon(c, w, h) {
      art.scene(c, w, h, 4, { showSun: false, clouds: true });
      const s = Math.min(w, h * 1.15);
      const at = (x, y, fn) => { c.save(); c.translate(w * x, h * y); fn(); c.restore(); };
      at(.28, .48, () => { c.rotate(-.3); art.fruit(c, 2, s * .2, { mood: 'wow' }); });
      at(.52, .3, () => { c.rotate(.4); art.fruit(c, 3, s * .16); });
      at(.74, .5, () => { c.rotate(.2); art.fruit(c, 1, s * .19, { mood: 'wow' }); });
      at(.5, .74, () => { c.rotate(-.5); c.save(); c.beginPath(); c.rect(-s * .3, -s * .3, s * .3, s * .6); c.clip(); art.fruit(c, 0, s * .17, { cut: true }); c.restore(); c.rotate(.9); c.translate(s * .06, 0); c.save(); c.beginPath(); c.rect(0, -s * .3, s * .3, s * .6); c.clip(); art.fruit(c, 0, s * .17, { cut: true }); c.restore(); });
      c.lineCap = 'round'; c.strokeStyle = 'rgba(255,122,154,.55)'; c.lineWidth = s * .05; c.beginPath(); c.moveTo(w * .12, h * .78); c.quadraticCurveTo(w * .4, h * .55, w * .7, h * .2); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = s * .017; c.stroke();
      art.star(c, w * .84, h * .22, s * .06); art.star(c, w * .16, h * .28, s * .04, '#fff');
    },
    create: host => new FruitGame(host)
  });
})();
