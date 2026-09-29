// Grow-a-Garden: plant a seed, tap it to water, watch it bloom, and meet the friends who visit.
// The garden and the friends she has met are saved per player.
(() => {
  const SPG = window.SPG;
  const { art, glyphs, sfx, voice, store } = SPG;
  const TAU = Math.PI * 2;
  const SLOTS = 8;
  const el = (tag, cls, ...kids) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...kids.filter(k => k != null)); return e; };
  const icon = id => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.innerHTML = `<use href="#i-${id}"/>`; return s; };
  const CREATURES = Object.fromEntries(art.CREATURES.map(c => [c.id, c]));

  function thumb(canvas, fn) {
    requestAnimationFrame(() => {
      const r = canvas.getBoundingClientRect(); if (!r.width) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); fn(c, r.width, r.height);
    });
  }

  class GardenGame {
    constructor(host) {
      this.host = host;
      this.bag = store.bag('garden', () => ({ plots: Array(SLOTS).fill(null), seen: {}, blooms: 0 }));
      this.plots = this.bag.plots.map(p => p ? { type: p.type, stage: p.stage, pop: 0, water: 0, wiggle: 0 } : null);
      this.tool = 'sunflower';
      this.creatures = []; this.fx = new art.Fx(); this.banner = null;
      this.t = 0; this.running = false;
      this.canvas = el('canvas', 'game-canvas'); host.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.tick = this.tick.bind(this);
      this.canvas.addEventListener('pointerdown', e => { e.preventDefault(); this.tap(e); });
      this.buildBar();
    }

    /* ---- toolbar ---- */
    buildBar() {
      this.bar = el('div', 'gd-bar');
      this.tools = {};
      const add = (id, label, drawFn, cls = '') => {
        const cv = el('canvas', 'gd-thumb'); const b = el('button', 'gd-tool ' + cls, cv); b.type = 'button'; b.setAttribute('aria-label', label);
        b.addEventListener('click', () => { sfx.tap(); if (id === 'book') this.openBook(); else this.select(id); });
        this.tools[id] = b; this.bar.append(b); thumb(cv, drawFn);
      };
      art.PLANTS.forEach(p => add(p.id, p.name + ' seeds', (c, w, h) => {
        c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) * .46, 0, TAU); c.fill();
        c.save(); c.translate(w / 2, h * .84); art.plant(c, p.id, 3, h * .8, 0); c.restore();
      }));
      add('shovel', 'Dig up', (c, w, h) => { c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) * .46, 0, TAU); c.fill(); c.save(); c.translate(w * .26, h * .26); c.scale(w * .48 / 48, h * .48 / 48); c.fillStyle = '#8a6a55'; c.strokeStyle = '#8a6a55'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(30, 6); c.lineTo(42, 18); c.moveTo(34, 10); c.lineTo(20, 24); c.stroke(); c.beginPath(); c.moveTo(20, 22); c.lineTo(8, 34); c.quadraticCurveTo(6, 40, 12, 40); c.lineTo(15, 40); c.quadraticCurveTo(18, 40, 20, 37); c.lineTo(29, 26); c.fill(); c.restore(); }, 'shovel');
      add('book', 'My garden friends', (c, w, h) => { c.fillStyle = '#ffe28a'; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) * .46, 0, TAU); c.fill(); c.save(); c.translate(w / 2, h / 2 + 4); art.creature(c, 'butterfly', w * .32, 1); c.restore(); }, 'book');
      this.host.append(this.bar);
      this.select(this.tool);
    }
    select(id) { this.tool = id; for (const [k, b] of Object.entries(this.tools)) b.classList.toggle('on', k === id); }

    /* ---- layout ---- */
    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.w = r.width; this.h = r.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const barH = this.bar.getBoundingClientRect().height + 24;
      const top = Math.max(112, this.h * .19);
      const cols = this.w > this.h ? 4 : 2, rows = SLOTS / cols;
      this.bed = { x: this.w * .05, y: top, w: this.w * .9, h: this.h - barH - top };
      this.cw = this.bed.w / cols; this.ch = this.bed.h / rows; this.cols = cols;
      this.ps = Math.min(this.ch * .82, this.cw * .8);
      this.draw();
    }
    slot(i) { const col = i % this.cols, row = Math.floor(i / this.cols); return { x: this.bed.x + (col + .5) * this.cw, y: this.bed.y + (row + .5) * this.ch + this.ch * .22 }; }

    start() {
      this.resize();
      // friends for blooms she already grew
      this.plots.forEach((p, i) => { if (p && p.stage === 3 && this.creatures.length < 4) this.spawnCreature(this.pickCreature(p.type), this.slot(i).x, this.slot(i).y); });
      this.resume();
      if (!this.plots.some(Boolean)) voice.say('plant-seed');
    }
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); }
    destroy() { this.pause(); this.canvas.remove(); this.bar.remove(); this.book?.remove(); }

    save() { this.bag.plots = this.plots.map(p => p ? { type: p.type, stage: p.stage } : null); store.save(); }

    /* ---- creatures ---- */
    pickCreature(type) { const list = art.PLANTS.find(p => p.id === type).creatures; return list[Math.floor(Math.random() * list.length)]; }
    spawnCreature(kind, x, y) {
      const info = CREATURES[kind];
      if (this.creatures.length >= 6) this.creatures.shift();
      const cr = { kind, fly: info.fly, x, y, vx: 0, vy: 0, tx: x, ty: y, wait: 0, t: Math.random() * 9, jump: 0, dir: 1, s: this.ps * (kind === 'bunny' ? .34 : kind === 'snail' ? .22 : kind === 'ladybug' ? .16 : .2) };
      this.creatures.push(cr); this.retarget(cr);
      return cr;
    }
    retarget(cr) {
      const b = this.bed;
      if (cr.fly) { cr.tx = b.x + Math.random() * b.w; cr.ty = b.y - this.ps * .15 + Math.random() * b.h * .8; cr.wait = 1 + Math.random() * 2; }
      else { cr.tx = b.x + b.w * (.08 + Math.random() * .84); cr.ty = b.y + b.h - this.ch * .06 - Math.random() * this.ch * .1; cr.wait = 1.5 + Math.random() * 2.5; }
    }

    /* ---- input ---- */
    tap(e) {
      if (this.banner) { this.banner = null; return; }
      const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (let i = this.creatures.length - 1; i >= 0; i--) {
        const cr = this.creatures[i];
        if (Math.hypot(x - cr.x, y - (cr.y - cr.s * .3)) < cr.s * 1.4 + 18) {
          cr.jump = 1; sfx.boing(); this.fx.burst(cr.x, cr.y - cr.s, 6, { colors: ['#ff7a8a', '#ff9db8'], speed: 120, g: -60, life: .9, size: 7, shape: 'heart' });
          voice.say('creature/' + cr.kind); return;
        }
      }
      let best = -1, bd = 1e9;
      this.plots.forEach((_, i) => { const s = this.slot(i); const dx = Math.abs(x - s.x) / (this.cw * .5), dy = (y - (s.y - this.ps * .35)) / (this.ch * .62); const d = Math.max(dx, Math.abs(dy)); if (d < 1 && d < bd) { bd = d; best = i; } });
      if (best < 0) return;
      const p = this.plots[best], s = this.slot(best);
      if (this.tool === 'shovel') {
        if (!p) return;
        this.plots[best] = null; this.save(); sfx.pop();
        this.fx.burst(s.x, s.y - 10, 14, { colors: ['#8a6448', '#a17656', '#6f4e38'], speed: 200, g: 800, life: .6, size: 6, up: 160 });
        return;
      }
      if (!p) {
        if (!art.PLANTS.some(pl => pl.id === this.tool)) return;
        this.plots[best] = { type: this.tool, stage: 0, pop: 0, water: 0, wiggle: 0 }; this.save(); sfx.pop();
        this.fx.burst(s.x, s.y - 8, 10, { colors: ['#8a6448', '#a17656'], speed: 130, g: 700, life: .5, size: 5, up: 130 });
        this.plots[best].pop = .01;
        if (this.plots.filter(Boolean).length === 1) this.later = setTimeout(() => voice.say('water-me'), 700);
        return;
      }
      if (p.stage < 3) { if (!p.water) { p.water = .0001; sfx.water(); } }
      else { p.wiggle = 1; sfx.boing(); this.fx.burst(s.x, s.y - this.ps * .7, 6, { colors: ['#ff7a8a', '#ff9db8'], speed: 120, g: -60, life: .9, size: 7, shape: 'heart' }); }
    }

    grow(i) {
      const p = this.plots[i], s = this.slot(i);
      p.stage++; p.pop = .01; sfx.grow(); this.save();
      this.fx.burst(s.x, s.y - this.ps * .4, 12, { colors: ['#ffd54a', '#fff', '#a6e8c8'], speed: 200, g: 100, life: .8, size: 9, shape: 'star', up: 60 });
      if (p.stage === 3) this.bloom(p, s);
    }

    bloom(p, s) {
      this.bag.blooms++; store.addStars(1); sfx.win();
      this.fx.burst(s.x, s.y - this.ps * .7, 26, { colors: ['#ff7a8a', '#ffd54a', '#59b96e', '#4fb3e8', '#9a7be8'], speed: 380, g: 500, life: 1.1, size: 8, shape: 'confetti', up: 200 });
      const kind = this.pickCreature(p.type);
      this.spawnCreature(kind, s.x, s.y - this.ps * .6);
      if (!this.bag.seen[kind]) {
        this.bag.seen[kind] = true; this.banner = { kind, t: 0 }; store.save();
        voice.say('new-friend', 'creature/' + kind);
      } else voice.praise();
    }

    /* ---- creature book ---- */
    openBook() {
      this.pause();
      const wrap = el('div', 'gd-book'); this.book = wrap;
      const sheet = el('div', 'gd-book-sheet');
      const grid = el('div', 'gd-book-grid');
      art.CREATURES.forEach(cr => {
        const seen = this.bag.seen[cr.id];
        const cv = el('canvas', 'gd-book-art'); const tile = el('button', 'gd-book-tile' + (seen ? ' seen' : ''), cv); tile.type = 'button'; tile.setAttribute('aria-label', seen ? cr.name : 'Not met yet');
        thumb(cv, (c, w, h) => {
          c.translate(w / 2, h * .55);
          if (seen) art.creature(c, cr.id, Math.min(w, h) * .3, 1);
          else { const off = document.createElement('canvas'); off.width = w; off.height = h; const o = off.getContext('2d'); o.translate(w / 2, h * .55); art.creature(o, cr.id, Math.min(w, h) * .3, 1); o.globalCompositeOperation = 'source-atop'; o.fillStyle = '#c9bfd3'; o.fillRect(-w, -h, w * 2, h * 2); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(off, 0, 0); }
        });
        if (!seen) { const q = el('span', 'gd-q', '?'); tile.append(q); }
        tile.addEventListener('click', () => { if (seen) { sfx.boing(); voice.say('creature/' + cr.id); tile.classList.remove('jig'); void tile.offsetWidth; tile.classList.add('jig'); } else sfx.tap(); });
        grid.append(tile);
      });
      const done = el('button', 'btn go', icon('check'), ' Done'); done.type = 'button';
      done.addEventListener('click', () => { wrap.remove(); this.book = null; this.resume(); });
      sheet.append(grid, done); wrap.append(sheet); this.host.append(wrap);
    }

    /* ---- loop ---- */
    tick(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, .05); this.last = now; this.t += dt;
      this.plots.forEach((p, i) => {
        if (!p) return;
        if (p.pop > 0) p.pop = Math.min(1.2, p.pop + dt * 2.2), p.pop >= 1.2 && (p.pop = 0);
        if (p.wiggle > 0) p.wiggle = Math.max(0, p.wiggle - dt * 1.6);
        if (p.water > 0) { p.water += dt / 1.3; if (p.water >= 1) { p.water = 0; this.grow(i); } }
      });
      for (const cr of this.creatures) {
        cr.t += dt; cr.wait -= dt;
        const dx = cr.tx - cr.x, dy = cr.ty - cr.y, d = Math.hypot(dx, dy);
        const speed = cr.fly ? this.w * .09 : cr.kind === 'snail' ? this.w * .012 : cr.kind === 'ladybug' ? this.w * .03 : this.w * .06;
        if (d > 8) { cr.x += dx / d * speed * dt; cr.y += dy / d * speed * dt; if (Math.abs(dx) > 4) cr.dir = dx > 0 ? 1 : -1; } else if (cr.wait <= 0) this.retarget(cr);
        if (cr.jump > 0) cr.jump = Math.max(0, cr.jump - dt * 2);
      }
      this.fx.update(dt);
      if (this.banner) this.banner.t += dt;
      this.draw();
      this.raf = requestAnimationFrame(this.tick);
    }

    draw() {
      const c = this.ctx, { w, h } = this;
      if (!w || !h) return;
      art.scene(c, w, h, this.t);
      const b = this.bed;
      // raised bed
      c.save(); c.shadowColor = 'rgba(90,63,94,.2)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
      c.fillStyle = '#c99a6a'; art.rr(c, b.x - 12, b.y + 14, b.w + 24, b.h + 8, 38); c.fill(); c.restore();
      const g = c.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, '#8d6a50'); g.addColorStop(1, '#775842');
      c.fillStyle = g; art.rr(c, b.x, b.y + 22, b.w, b.h - 6, 30); c.fill();
      c.fillStyle = 'rgba(255,255,255,.07)'; art.rr(c, b.x + 12, b.y + 30, b.w - 24, 10, 5); c.fill();
      this.plots.forEach((p, i) => {
        const s = this.slot(i);
        c.fillStyle = 'rgba(60,35,25,.35)'; c.beginPath(); c.ellipse(s.x, s.y + 4, this.cw * .3, this.ch * .09, 0, 0, TAU); c.fill();
        c.fillStyle = '#a17656'; c.beginPath(); c.ellipse(s.x, s.y - 2, this.cw * .28, this.ch * .085, 0, 0, TAU); c.fill();
        c.fillStyle = '#b48965'; c.beginPath(); c.ellipse(s.x - 6, s.y - 5, this.cw * .2, this.ch * .045, 0, 0, TAU); c.fill();
      });
      // plants (back row first)
      this.plots.forEach((p, i) => {
        if (!p) return;
        const s = this.slot(i);
        c.save(); c.translate(s.x, s.y - 4);
        if (p.wiggle > 0) c.rotate(Math.sin(p.wiggle * 20) * .05 * p.wiggle);
        art.plant(c, p.type, p.stage, this.ps, this.t + i, p.pop);
        c.restore();
        if (p.stage < 3 && !p.water) { // "water me" droplet
          const bob = Math.sin(this.t * 4 + i) * 6, top = -this.ps * [0, .34, .62][p.stage] - this.ps * .16;
          c.save(); c.translate(s.x + this.ps * .22, s.y + top + bob); art.drop(c, this.ps * .075, { mood: 'happy' }); c.restore();
        }
        if (p.water > 0) this.drawCan(c, s, p.water);
      });
      // creatures
      for (const cr of this.creatures) {
        c.save(); c.translate(cr.x, cr.y);
        let bob = cr.fly ? Math.sin(cr.t * (cr.kind === 'bee' ? 9 : 5)) * cr.s * .18 : 0;
        if (cr.kind === 'bunny') bob = -Math.abs(Math.sin(cr.t * 4)) * cr.s * .5 * (Math.hypot(cr.tx - cr.x, cr.ty - cr.y) > 8 ? 1 : 0);
        c.translate(0, bob - Math.sin(cr.jump * Math.PI) * cr.s * 1.2);
        if (cr.fly || cr.kind === 'bunny' || cr.kind === 'snail') c.scale(cr.kind === 'bunny' ? -cr.dir : cr.dir, 1);
        c.fillStyle = 'rgba(0,0,0,.0)';
        art.creature(c, cr.kind, cr.s * 1.6, cr.t);
        c.restore();
      }
      this.fx.draw(c);
      if (this.banner) this.drawBanner(c);
    }

    drawCan(c, s, t) {
      const slide = t < .2 ? t / .2 : t > .85 ? (1 - t) / .15 : 1;
      const k = this.ps / 260, tilt = -.15 - (t > .2 && t < .85 ? .45 : 0) * Math.min(1, slide);
      c.save(); c.translate(s.x + this.ps * .5 + (1 - slide) * 90, s.y - this.ps * .72 - (1 - slide) * 30); c.rotate(tilt - 0); c.scale(k * 1.6, k * 1.6);
      c.fillStyle = '#6ec6f2'; art.rr(c, -34, -22, 68, 52, 14); c.fill();
      c.fillStyle = '#8ad4f7'; art.rr(c, -30, -18, 60, 14, 7); c.fill();
      c.strokeStyle = '#6ec6f2'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.arc(28, 4, 22, -1.2, 1.2); c.stroke();
      c.beginPath(); c.moveTo(-32, 10); c.lineTo(-58, -14); c.stroke();
      c.fillStyle = '#4fb3e8'; c.beginPath(); c.ellipse(-62, -18, 11, 6, -.9, 0, TAU); c.fill();
      c.restore();
      if (t > .2 && t < .85) {
        c.fillStyle = '#7fd0f7';
        for (let i = 0; i < 7; i++) { const u = ((this.t * 2.4 + i / 7) % 1); c.globalAlpha = 1 - u * .5; c.beginPath(); c.arc(s.x + this.ps * .5 - this.ps * .42 - u * this.ps * .1 + (i % 3 - 1) * 8, s.y - this.ps * .6 + u * this.ps * .55, this.ps * .02, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
      }
    }

    drawBanner(c) {
      const { w, h } = this, t = this.banner.t, k = Math.min(1, t * 3);
      c.fillStyle = `rgba(90,63,94,${.45 * k})`; c.fillRect(0, 0, w, h);
      const cw = Math.min(w * .8, 560), chh = Math.min(h * .7, 460), pop = 1 + Math.sin(Math.min(1, t * 2.5) * Math.PI) * .12;
      c.save(); c.translate(w / 2, h / 2); c.scale(k * pop, k * pop);
      c.fillStyle = '#fff8e8'; art.rr(c, -cw / 2, -chh / 2, cw, chh, 44); c.fill();
      for (let i = 0; i < 10; i++) art.star(c, Math.cos(i * TAU / 10 + t) * cw * .42, Math.sin(i * TAU / 10 + t) * chh * .4, 12 + (i % 3) * 4, ['#ffd54a', '#ff9db8', '#a6e8c8'][i % 3], t + i);
      c.save(); c.translate(0, -chh * .12 + Math.sin(t * 4) * 8); art.creature(c, this.banner.kind, Math.min(cw, chh) * .36, t); c.restore();
      const name = CREATURES[this.banner.kind].name.toLowerCase(), size = Math.min(chh * .16, (cw * .6) / (glyphs.measure(name, 1) || 1));
      glyphs.drawText(c, name, -glyphs.measure(name, size) / 2, chh * .26, size, { color: '#5a3f5e', width: 12 });
      c.restore();
    }
  }

  SPG.games.push({
    id: 'garden', name: 'Grow a Garden', order: 4,
    icon(c, w, h) {
      art.scene(c, w, h, 2, { showSun: true, clouds: true });
      const s = Math.min(w, h * 1.15);
      c.fillStyle = '#8d6a50'; art.rr(c, w * .08, h * .62, w * .84, h * .3, s * .06); c.fill();
      [[.24, 'tulip'], [.5, 'sunflower'], [.76, 'daisy']].forEach(([x, t]) => { c.fillStyle = '#a17656'; c.beginPath(); c.ellipse(w * x, h * .78, s * .13, s * .035, 0, 0, TAU); c.fill(); c.save(); c.translate(w * x, h * .77); art.plant(c, t, 3, s * (t === 'sunflower' ? .5 : .4), 0); c.restore(); });
      c.save(); c.translate(w * .84, h * .3); art.creature(c, 'butterfly', s * .08, 2); c.restore();
      c.save(); c.translate(w * .2, h * .3); art.bee(c, s * .06, 0); c.restore();
    },
    create: host => new GardenGame(host)
  });
})();
