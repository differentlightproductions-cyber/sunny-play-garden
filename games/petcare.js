// Pet Care: a cozy room for her Pet Shop friend (or a visiting bunny if she has none yet). Feed it fruit, give it a
// bubbly bath, tuck it into bed. A little thought bubble shows what it would like. Nothing is ever wrong or sad.
(() => {
  const SPG = window.SPG;
  const { art, sfx, voice, store } = SPG;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const FOODS = [0, 1, 3, 4, 5];   // art.fruit types: apple, orange, strawberry, banana, peach

  class CareGame {
    constructor(host) {
      this.host = host;
      this.canvas = document.createElement('canvas'); this.canvas.className = 'game-canvas';
      host.append(this.canvas); this.ctx = this.canvas.getContext('2d');
      const b = this.bag = store.bag('care', () => ({ hunger: .6, dirt: .6, tired: .5, t: Date.now(), flags: {}, cares: 0 }));
      // time passes gently: needs creep back up, but never all the way
      const mins = clamp((Date.now() - (b.t || Date.now())) / 60000, 0, 60);
      b.hunger = Math.min(.85, Math.max(b.hunger || 0, .35) + mins * .03); b.dirt = Math.min(.85, Math.max(b.dirt || 0, .3) + mins * .02); b.tired = Math.min(.85, Math.max(b.tired || 0, .3) + mins * .02);
      b.flags = b.flags || {}; b.cares = b.cares || 0; b.t = Date.now();
      this.counter = SPG.ui.counter(host, (c, s) => { c.translate(s / 2, s * .54); art.heart(c, 0, 0, s * .32, '#ff6b81'); }, b.cares);
      this.fx = new art.Fx(); this.t = 0; this.running = false;
      this.tool = null; this.hold = null; this.sleeping = false; this.wake = 0;
      this.foods = []; this.foam = []; this.zz = [];
      this.pet = { x: 0, y: 0, dir: 1, hop: 0, cheer: 0, eat: 0, moving: false };
      this.idle = 0; this.tick = this.tick.bind(this);
      const cv = this.canvas, at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * this.w / r.width, y: (e.clientY - r.top) * this.h / r.height }; };
      cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* optional */ } SPG.audio.unlock(); const p = at(e); this.press(p.x, p.y, e.pointerId); });
      cv.addEventListener('pointermove', e => { if (this.hold && this.hold.id === e.pointerId) { e.preventDefault(); const p = at(e); this.hold.x = p.x; this.hold.y = p.y; } });
      for (const n of ['pointerup', 'pointercancel']) cv.addEventListener(n, e => { if (this.hold && this.hold.id === e.pointerId) this.letGo(); });
    }
    who() { const a = SPG.pets.active(); return a ? { id: a.id, name: a.name, hat: a.hat } : { id: 'bunny', name: 'Pip', hat: null }; }

    /* ---------------------------------------------------------------- layout */
    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.w = r.width; this.h = r.height;
      const dpr = SPG.ui.dpr();
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const wide = this.w >= this.h * 1.1; this.wide = wide;
      this.ui = clamp(Math.min(this.w, this.h * 1.4) / 780, .6, 1.4);
      this.floorY = this.h * (wide ? .6 : .5);
      this.feetY = this.h * (wide ? .82 : .72);
      this.s = Math.min(this.h * (wide ? .5 : .32), this.w * .42);
      this.homeX = this.w * (wide ? .56 : .55);
      this.bedX = this.w * (wide ? .2 : .24);
      this.bs = 38 * this.ui + 20;
      const by = this.h - this.bs * .95;
      this.tools = ['food', 'bath', 'bed'].map((id, i) => ({ id, x: this.w / 2 + (i - 1) * this.bs * 2.1, y: by }));
      if (!this.pet.x) { this.pet.x = this.homeX; this.pet.y = this.feetY; }
      this.fillFoods();
      this.draw();
    }
    fillFoods() {
      const left = this.foods.filter(f => !f.gone);
      while (left.length < 3) { const k = FOODS[Math.floor(Math.random() * FOODS.length)]; left.push({ type: k, gone: false, x: 0, y: 0, home: true }); }
      this.foods = left;
      this.foods.forEach((f, i) => {
        if (this.wide) { f.hx = this.w * .86; f.hy = this.h * (.3 + i * .17); } else { f.hx = this.w * (.25 + i * .25); f.hy = this.h * .87 - this.bs * 1.5; }
        if (f.home) { f.x = f.hx; f.y = f.hy; }
      });
    }
    start() { this.resize(); this.resume(); voice.say('care-start'); }
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); this.hold = null; this.save(); }
    destroy() { this.pause(); this.canvas.remove(); this.counter.el.remove(); }
    save() { this.bag.t = Date.now(); store.save(); }

    /* ---------------------------------------------------------------- input */
    press(x, y, id) {
      this.idle = 0;
      const near = (b, r) => Math.hypot(x - b.x, y - b.y) < r;
      for (const t of this.tools) if (near(t, this.bs * .85)) { this.chooseTool(t.id); return; }
      if (this.sleeping) { this.wakeUp(); return; }
      if (this.tool === 'food') {
        for (const f of this.foods) if (!f.gone && Math.hypot(x - f.x, y - f.y) < this.s * .2) { this.hold = { kind: 'food', f, id, x, y }; f.home = false; sfx.pop(); return; }
      } else if (this.tool === 'bath') {
        this.hold = { kind: 'sponge', id, x, y, last: { x, y } }; sfx.pop(); return;
      }
      if (Math.abs(x - this.pet.x) < this.s * .4 && y > this.pet.y - this.s * 1.05 && y < this.pet.y + 10) {   // pat the pet
        this.pet.hop = 1; this.pet.cheer = 1.4; SPG.pets.noise(this.who().id);
        this.fx.burst(this.pet.x, this.pet.y - this.s * .95, 4, { colors: ['#ff8aa3', '#ff6b81'], speed: 90, g: -50, life: .9, size: 7 * this.ui, shape: 'heart' });
      }
    }
    chooseTool(id) {
      sfx.tap();
      if (id === 'bed') { this.tool = null; this.hold = null; if (this.sleeping) this.wakeUp(); else this.goSleep(); return; }
      if (this.sleeping) this.wakeUp();
      this.tool = this.tool === id ? null : id; this.hold = null;
      if (this.tool === 'food') this.fillFoods();
    }
    letGo() {
      const h = this.hold; this.hold = null; if (!h) return;
      if (h.kind === 'food') {
        const mouth = { x: this.pet.x, y: this.pet.y - this.s * .55 };
        if (Math.hypot(h.x - mouth.x, h.y - mouth.y) < this.s * .4) this.feed(h.f);
        else { h.f.home = true; }
      }
    }
    feed(f) {
      f.gone = true; this.pet.eat = 1.2; this.pet.cheer = 1.6; this.pet.hop = 1;
      for (let k = 0; k < 3; k++) setTimeout(() => sfx.munch(), k * 260);
      this.bag.hunger = Math.max(0, this.bag.hunger - .4); this.cared('fed');
      this.fx.burst(this.pet.x, this.pet.y - this.s * .5, 8, { colors: ['#ff8aa3', '#ffd54a'], speed: 120, g: -30, life: 1, size: 7 * this.ui, shape: 'heart' });
      if (this.bag.hunger <= 0) { voice.say('care-food'); }
      setTimeout(() => { if (this.tool === 'food') this.fillFoods(); }, 400);
    }
    goSleep() { this.sleeping = true; this.wake = 0; this.pet.target = this.bedX; sfx.lullaby(); this.lull = 0; voice.say('care-sleep'); }
    wakeUp() { this.sleeping = false; this.pet.target = this.homeX; this.pet.hop = 1; this.save(); }
    cared(flag) {
      this.bag.flags[flag] = true; this.bag.cares++; this.counter.set(this.bag.cares);
      if (this.bag.flags.fed && this.bag.flags.washed && this.bag.flags.slept) {
        this.bag.flags = {}; store.addStars(1); sfx.win(); this.pet.cheer = 2.4; this.pet.hop = 1;
        this.fx.burst(this.w / 2, this.h * .3, 24, { colors: ['#ff8aa3', '#ffd54a', '#7fd4f5', '#a6e05a'], speed: 300, g: 380, life: 1.2, size: 7 * this.ui, shape: 'star', up: 180 });
        voice.praise();
      }
      this.save();
    }

    /* ---------------------------------------------------------------- loop */
    tick(now) {
      if (!this.running) return;
      const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt; this.idle += dt;
      const p = this.pet;
      // walking to where she should be
      const tx = p.target != null ? p.target : this.homeX, dx = tx - p.x; p.moving = Math.abs(dx) > 4;
      if (p.moving) { p.x += Math.sign(dx) * Math.min(Math.abs(dx), this.w * .25 * dt); p.dir = dx > 0 ? 1 : -1; }
      p.hop = Math.max(0, p.hop - dt * 2.4); p.cheer = Math.max(0, p.cheer - dt); p.eat = Math.max(0, p.eat - dt);
      // bath
      const h = this.hold;
      if (h && h.kind === 'sponge') {
        const over = Math.abs(h.x - p.x) < this.s * .42 && h.y > p.y - this.s * .95 && h.y < p.y + 6, moved = Math.hypot(h.x - h.last.x, h.y - h.last.y);
        if (over && moved > 3 && this.bag.dirt > 0) {
          this.bag.dirt = Math.max(0, this.bag.dirt - moved * .0016);
          if (Math.random() < .5) { this.foam.push({ x: h.x + (Math.random() - .5) * 30, y: h.y + (Math.random() - .5) * 30, r: (6 + Math.random() * 10) * this.ui, life: 1.6 + Math.random() }); sfx.bubble(); }
          if (this.bag.dirt <= 0) { this.foam.forEach(f => { f.life = Math.min(f.life, .5); }); sfx.chime(); voice.say('care-clean'); this.fx.burst(p.x, p.y - this.s * .5, 16, { colors: ['#fff', '#bfe9ff', '#ffd54a'], speed: 200, g: -20, life: 1, size: 6 * this.ui, shape: 'star', up: 60 }); p.cheer = 2; p.hop = 1; this.cared('washed'); }
        }
        h.last = { x: h.x, y: h.y };
      }
      for (const f of this.foam) { f.life -= dt; f.y -= dt * 8; }
      this.foam = this.foam.filter(f => f.life > 0);
      // sleep
      if (this.sleeping && !p.moving) {
        this.bag.tired = Math.max(0, this.bag.tired - dt * .1);
        this.lull = (this.lull || 0) - dt; if (this.lull <= 0) { this.lull = 6.5; sfx.lullaby(); }
        if ((this.zzT = (this.zzT || 0) - dt) <= 0) { this.zzT = 1.1; this.zz.push({ x: p.x + this.s * .25, y: p.y - this.s * .55, life: 1 }); }
        if (this.bag.tired <= 0) { this.wake += dt; if (this.wake > 2.5) { this.cared('slept'); this.wakeUp(); } }
      }
      for (const z of this.zz) { z.life -= dt * .6; z.y -= dt * 24; z.x += dt * 10; }
      this.zz = this.zz.filter(z => z.life > 0);
      if (h && h.kind === 'food') { h.f.x = h.x; h.f.y = h.y; }
      for (const f of this.foods) if (f.home && !f.gone) { f.x = lerp(f.x, f.hx, Math.min(1, dt * 10)); f.y = lerp(f.y, f.hy, Math.min(1, dt * 10)); }
      this.fx.update(dt);
      this.draw(); this.raf = requestAnimationFrame(this.tick);
    }

    /* ---------------------------------------------------------------- drawing */
    need() {
      const b = this.bag, list = [['food', b.hunger], ['bath', b.dirt], ['bed', b.tired]].filter(x => x[1] > .5).sort((a, c) => c[1] - a[1]);
      return list.length ? list[0][0] : null;
    }
    drawRoom(c) {
      const w = this.w, h = this.h, fy = this.floorY, night = this.sleeping;
      const wall = c.createLinearGradient(0, 0, 0, fy); wall.addColorStop(0, '#ffe9df'); wall.addColorStop(1, '#ffd9cc'); c.fillStyle = wall; c.fillRect(0, 0, w, fy);
      c.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < w; x += 70) c.fillRect(x, 0, 24, fy);
      c.fillStyle = '#fff3ea'; c.fillRect(0, fy - 16, w, 16);
      const fl = c.createLinearGradient(0, fy, 0, h); fl.addColorStop(0, '#e2b98d'); fl.addColorStop(1, '#c99a6a'); c.fillStyle = fl; c.fillRect(0, fy, w, h - fy);
      c.fillStyle = 'rgba(90,63,94,.1)'; for (let y = fy + 30; y < h; y += 46) c.fillRect(0, y, w, 3);
      // window
      const wx = this.wide ? w * .42 : w * .5, wy = h * .06, ww = Math.min(w * .3, 300), wh = ww * .75;
      c.fillStyle = '#fff'; art.rr(c, wx - ww / 2 - 12, wy - 12, ww + 24, wh + 24, 18); c.fill();
      const sky = c.createLinearGradient(0, wy, 0, wy + wh); if (night) { sky.addColorStop(0, '#2c3566'); sky.addColorStop(1, '#5d55a0'); } else { sky.addColorStop(0, '#a9e1f3'); sky.addColorStop(1, '#fdf6df'); }
      c.fillStyle = sky; c.fillRect(wx - ww / 2, wy, ww, wh);
      if (night) { for (let i = 0; i < 6; i++) art.star(c, wx - ww / 2 + ww * (.12 + (i * .17) % .8), wy + wh * (.15 + (i * .29) % .6), 5 + (i % 3) * 2, '#fff3b0'); c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(wx + ww * .25, wy + wh * .3, wh * .14, 0, TAU); c.fill(); c.fillStyle = '#4b4a92'; c.beginPath(); c.arc(wx + ww * .25 + wh * .06, wy + wh * .27, wh * .12, 0, TAU); c.fill(); }
      else art.cloud(c, wx - ww * .15 + Math.sin(this.t * .3) * 14, wy + wh * .4, ww / 620, .95);
      c.fillStyle = '#fff'; c.fillRect(wx - 4, wy, 8, wh); c.fillRect(wx - ww / 2, wy + wh / 2 - 4, ww, 8);
      // rug
      c.fillStyle = '#ffb3c6'; c.beginPath(); c.ellipse(this.homeX, this.feetY + 6, this.s * .95, this.s * .16, 0, 0, TAU); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 5; c.setLineDash([12, 10]); c.beginPath(); c.ellipse(this.homeX, this.feetY + 6, this.s * .84, this.s * .12, 0, 0, TAU); c.stroke(); c.setLineDash([]);
      // bed
      const bx = this.bedX, by = this.feetY, bw = this.s * .95;
      c.fillStyle = '#b9805a'; art.rr(c, bx - bw / 2, by - this.s * .32, bw, this.s * .34, 14); c.fill();
      c.fillStyle = '#fff'; art.rr(c, bx - bw / 2 + 8, by - this.s * .42, bw - 16, this.s * .24, 16); c.fill();
      c.fillStyle = '#ffd1dc'; art.rr(c, bx - bw / 2 + 12, by - this.s * .48, bw * .3, this.s * .16, 14); c.fill();
      c.fillStyle = '#b9805a'; art.rr(c, bx - bw / 2 - 8, by - this.s * .55, 16, this.s * .6, 8); c.fill();
    }
    icon(c, id, r) {
      c.save(); c.lineCap = c.lineJoin = 'round';
      if (id === 'food') { art.fruit(c, 0, r * .8, { mood: 'happy' }); }
      else if (id === 'bath') {
        c.fillStyle = '#ffd54a'; art.rr(c, -r * .7, -r * .35, r * 1.4, r * .8, r * .2); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)'; for (const [x, y, q] of [[-.3, -.05, .12], [.2, .1, .1], [0, -.2, .08]]) { c.beginPath(); c.arc(x * r, y * r, q * r, 0, TAU); c.fill(); }
        c.fillStyle = '#fff'; c.strokeStyle = '#8fd0ff'; c.lineWidth = r * .06; for (const [x, y, q] of [[.5, -.65, .22], [.05, -.85, .16], [.75, -.3, .12]]) { c.beginPath(); c.arc(x * r, y * r, q * r, 0, TAU); c.fill(); c.stroke(); }
      } else { c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(0, 0, r * .75, 0, TAU); c.fill(); c.fillStyle = '#5d55a0'; c.beginPath(); c.arc(r * .35, -r * .2, r * .62, 0, TAU); c.fill(); art.star(c, r * .3, r * .3, r * .22, '#ffd54a', 0); }
      c.restore();
    }
    draw() {
      const c = this.ctx, w = this.w, h = this.h; if (!w) return;
      this.drawRoom(c);
      const p = this.pet, who = this.who(), s = this.s, sleepAtBed = this.sleeping && !p.moving;
      // the pet
      c.save(); c.translate(p.x, p.y - (p.moving ? Math.abs(Math.sin(this.t * 9)) * s * .03 : 0));
      if (sleepAtBed) { c.translate(0, -s * .12); c.scale(.85, .85); }
      c.fillStyle = 'rgba(90,63,94,.14)'; c.beginPath(); c.ellipse(0, 3, s * .32, s * .05, 0, 0, TAU); c.fill();
      const mood = sleepAtBed ? 'sleep' : p.cheer > 0 || p.eat > 0 ? 'cheer' : 'happy';
      SPG.pets.draw(c, who.id, s, this.t, { mood, hop: p.hop > 0 ? 1 - p.hop : 0, hat: who.hat });
      // mud on a dirty pet, foam while it is being washed
      if (this.bag.dirt > 0.02) { c.fillStyle = 'rgba(120,84,56,.55)'; const n = Math.ceil(this.bag.dirt * 6); for (let i = 0; i < n; i++) { const a = i * 2.4, rr = s * (.1 + (i % 3) * .05); c.beginPath(); c.ellipse(Math.cos(a) * s * .14, -s * (.25 + (i % 4) * .09), rr * .8, rr * .55, a, 0, TAU); c.fill(); } }
      c.restore();
      if (sleepAtBed) { c.fillStyle = '#7fd4f5'; art.rr(c, this.bedX - s * .42, p.y - s * .42, s * .84, s * .22, 12); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 4; i++) c.fillRect(this.bedX - s * .36 + i * s * .2, p.y - s * .4, s * .05, s * .18); }
      for (const f of this.foam) { c.globalAlpha = Math.min(1, f.life); c.fillStyle = '#fff'; c.strokeStyle = '#a8dcff'; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill(); c.stroke(); }
      c.globalAlpha = 1;
      // night
      if (this.sleeping) { c.fillStyle = 'rgba(25,25,70,.4)'; c.fillRect(0, 0, w, h); }
      c.font = `700 ${s * .16}px Fredoka, system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
      for (const z of this.zz) { c.globalAlpha = Math.max(0, z.life); c.fillText('z', z.x, z.y); }
      c.globalAlpha = 1;
      // what would it like? a thought bubble
      const want = !this.sleeping && !this.hold && this.need();
      if (want) {
        const bx = p.x + s * .38, by = p.y - s * 1.12 + Math.sin(this.t * 3) * 4, br = s * .17;
        c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); c.beginPath(); c.arc(bx - br * .9, by + br * 1.1, br * .22, 0, TAU); c.fill(); c.beginPath(); c.arc(bx - br * .6, by + br * .8, br * .14, 0, TAU); c.fill();
        c.save(); c.translate(bx, by); this.icon(c, want, br * .75); c.restore();
      }
      // fruit tray
      if (this.tool === 'food') {
        for (const f of this.foods) { if (f.gone) continue; c.save(); c.translate(f.x, f.y); c.scale(this.hold && this.hold.f === f ? 1.2 : 1, this.hold && this.hold.f === f ? 1.2 : 1); art.fruit(c, f.type, s * .13, { mood: 'happy' }); c.restore(); }
      }
      if (this.tool === 'bath' && !this.hold) { c.save(); c.translate(this.wide ? w * .86 : w * .82, this.wide ? h * .5 : h * .87 - this.bs * 1.5); c.scale(1 + Math.sin(this.t * 4) * .05, 1 + Math.sin(this.t * 4) * .05); this.icon(c, 'bath', s * .2); c.restore(); }
      if (this.hold && this.hold.kind === 'sponge') { c.save(); c.translate(this.hold.x, this.hold.y); this.icon(c, 'bath', s * .2); c.restore(); }
      this.fx.draw(c);
      // toolbar
      for (const t of this.tools) {
        const on = this.tool === t.id || (t.id === 'bed' && this.sleeping), hint = this.need() === t.id && !this.sleeping && !this.tool;
        c.fillStyle = 'rgba(90,63,94,.18)'; c.beginPath(); c.arc(t.x, t.y + 6, this.bs * .72, 0, TAU); c.fill();
        c.fillStyle = on ? '#fff3c4' : '#fff'; c.beginPath(); c.arc(t.x, t.y, this.bs * (hint ? .72 + Math.sin(this.t * 6) * .03 : .72), 0, TAU); c.fill();
        if (on) { c.strokeStyle = '#59b96e'; c.lineWidth = 6; c.stroke(); }
        c.save(); c.translate(t.x, t.y); this.icon(c, t.id, this.bs * .55); c.restore();
      }
    }
  }

  SPG.games.push({
    id: 'care', name: 'Pet Care', order: 7,
    icon(c, w, h) {
      const wall = c.createLinearGradient(0, 0, 0, h); wall.addColorStop(0, '#ffe9df'); wall.addColorStop(.62, '#ffd9cc'); wall.addColorStop(.63, '#e2b98d'); wall.addColorStop(1, '#c99a6a'); c.fillStyle = wall; c.fillRect(0, 0, w, h);
      const s = Math.min(w * .3, h * 1.05);
      c.fillStyle = '#ffb3c6'; c.beginPath(); c.ellipse(w * .5, h * .9, s * .8, s * .12, 0, 0, TAU); c.fill();
      c.save(); c.translate(w * .5, h * .93); SPG.pets.draw(c, 'cat', s, 1, { mood: 'cheer' }); c.restore();
      c.save(); c.translate(w * .78, h * .5); art.fruit(c, 3, s * .16, {}); c.restore();
      c.fillStyle = '#fff'; c.strokeStyle = '#8fd0ff'; c.lineWidth = 2; for (const [x, y, r] of [[.24, .45, .07], [.3, .3, .05], [.2, .25, .04]]) { c.beginPath(); c.arc(w * x, h * y, s * r, 0, TAU); c.fill(); c.stroke(); }
      art.heart(c, w * .66, h * .3, s * .1, '#ff6b81');
    },
    create: host => new CareGame(host)
  });
})();
