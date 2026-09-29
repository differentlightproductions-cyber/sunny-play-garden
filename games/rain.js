// Rain Bucket: friendly clouds drop raindrops; slide the bucket to catch them.
// A full bucket makes a rainbow and plants a flower in her meadow, which is kept between visits.
(() => {
  const SPG = window.SPG;
  const { art, sfx, voice, store } = SPG;
  const TAU = Math.PI * 2;
  const RAINBOW = ['#ff6b81', '#ffa64d', '#ffe066', '#7ed957', '#5cc8f2', '#8a7cf0', '#c98bf0'];
  const BUCKET_CAPACITY = 8;

  class RainGame {
    constructor(host) {
      this.canvas = document.createElement('canvas'); this.canvas.className = 'game-canvas';
      host.append(this.canvas); this.ctx = this.canvas.getContext('2d');
      this.host = host;
      this.bag = store.bag('rain', () => ({ flowers: 0, drops: 0, pets: 0, petEvents: 0 }));
      this.bag.pets = this.bag.pets || 0; this.bag.petEvents = this.bag.petEvents || 0;
      this.pets = null; this.petsPending = false; this.bucketHide = 0; this.petCounter = null;
      this.counter = SPG.ui.counter(host, (c, s) => { c.translate(s / 2, s * .52); art.drop(c, s * .26); }, this.bag.drops || 0);
      this.fx = new art.Fx();
      this.drops = []; this.ripples = []; this.streaks = [];
      this.t = 0; this.fill = 0; this.caught = 0; this.rainbow = 0; this.spawnIn = .6; this.moodT = 0; this.newFlower = 0;
      this.bucket = { x: 0, tx: 0 }; this.running = false; this.keys = {};
      this.tick = this.tick.bind(this);
      const cv = this.canvas;
      const at = e => { const r = cv.getBoundingClientRect(); this.bucket.tx = (e.clientX - r.left) * this.w / r.width; };
      cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* capture is optional */ } this.dragging = true; at(e); });
      cv.addEventListener('pointermove', e => { if (this.dragging) { e.preventDefault(); at(e); } });
      for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, () => { this.dragging = false; });
      this.onKey = e => { this.keys[e.key] = e.type === 'keydown'; };
      addEventListener('keydown', this.onKey); addEventListener('keyup', this.onKey);
      if (this.bag.pets) this.showPetCounter();
      for (let i = 0; i < 40; i++) this.streaks.push({ x: Math.random(), y: Math.random(), s: .5 + Math.random() });
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const ow = this.w || r.width;
      this.w = r.width; this.h = r.height;
      const dpr = SPG.ui.dpr();
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.bw = Math.max(76, Math.min(250, Math.min(this.w * .21, this.h * .2))); this.bh = this.bw * .8;
      this.rimY = this.h - this.bh - this.h * .07;
      this.groundY = this.h * .95;
      this.dropR = Math.max(11, Math.min(28, Math.min(this.w, this.h) * .036));
      this.cs = Math.max(.55, Math.min(1.5, Math.min(this.w, this.h * 1.4) / 750 + .1));
      if (!this.bucket.x) this.bucket.x = this.bucket.tx = this.w / 2; else { this.bucket.x *= this.w / ow; this.bucket.tx *= this.w / ow; }
      this.draw();
    }

    start() { this.resize(); this.resume(); voice.say('catch-drops'); }
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); this.dragging = false; }
    destroy() { this.pause(); removeEventListener('keydown', this.onKey); removeEventListener('keyup', this.onKey); this.canvas.remove(); this.counter.el.remove(); this.petCounter?.el.remove(); }

    cloudX(i) { return this.w * (.2 + i * .3) + Math.sin(this.t * .35 + i * 2) * this.w * .06; }
    cloudY() { return Math.max(Math.min(this.h * .3, 78 * this.cs + 30), this.h * .17); }

    spawn() {
      const i = Math.floor(Math.random() * 3), gold = Math.random() < .12;
      this.drops.push({ x: this.cloudX(i) + (Math.random() - .5) * 90 * this.cs, y: this.cloudY() + 30 * this.cs, vy: this.h * .1, r: this.dropR * (gold ? 1.15 : .9 + Math.random() * .2), gold, blink: Math.random() * 3 });
      this.spawnIn = Math.max(.55, 1.0 - this.caught * .004) + Math.random() * .45;
    }

    catchDrop(d) {
      this.caught++; this.moodT = .35; this.bag.drops = (this.bag.drops || 0) + 1; this.counter.set(this.bag.drops); store.save();
      this.fill = Math.min(1, this.fill + (d.gold ? 2 : 1) / BUCKET_CAPACITY);
      this.fx.burst(d.x, this.rimY, 8, { colors: ['#9be0ff', '#fff', d.gold ? '#ffd54a' : '#5cc8f2'], speed: 190, g: 700, life: .5, size: 5, up: 200 });
      sfx.plink(this.caught);
      if (this.fill >= 1) this.celebrate();
    }

    celebrate() {
      this.rainbow = 1; this.fill = 0; this.bag.flowers++; if (this.bag.flowers % 3 === 0) this.petsPending = true; this.newFlower = 1; store.save(); store.addStars(1);
      sfx.win(); voice.say('rainbow', 'wow');
      const b = this.bucket;
      this.fx.burst(b.x, this.rimY, 28, { colors: RAINBOW, speed: 420, g: 400, life: 1.2, size: 8, shape: 'confetti', up: 260 });
    }

    /* ---- raining cats and dogs ---- */
    showPetCounter() {
      this.petCounter = SPG.ui.counter(this.host, (c, s) => {
        c.fillStyle = '#ff8aa3'; c.beginPath(); c.ellipse(s / 2, s * .64, s * .22, s * .18, 0, 0, Math.PI * 2); c.fill();
        for (const [x, y] of [[.24, .4], [.4, .26], [.6, .26], [.76, .4]]) { c.beginPath(); c.ellipse(s * x, s * y, s * .09, s * .11, 0, 0, Math.PI * 2); c.fill(); }
      }, this.bag.pets);
      this.petCounter.el.classList.add('second');
    }

    startPets() {
      if (this.pets) return;
      this.pets = { phase: 'in', t: 0, list: [], spawned: 0, total: 12, caught: 0, nextIn: 1.4, ffIn: 0, doneT: 0, net: { x: this.bucket.x, vx: 0, sag: this.h * .045, sagV: 0 } };
      if (!this.petCounter) this.showPetCounter();
      voice.say('raining-pets');
    }

    netGeom() {
      const P = this.pets, sc = Math.max(12, Math.min(this.h * .045, this.w * .05, 38)), half = Math.max(70, Math.min(230, this.w * .17));
      const inOff = (1 - P.ffIn) * (this.w * .6), y0 = this.groundY - 4.35 * sc;
      return { sc, half, y0, x0: P.net.x - half - inOff, x1: P.net.x + half + inOff, base: this.h * .045 };
    }

    spawnPet() {
      const P = this.pets, kind = Math.random() < .5 ? 'cat' : 'dog', i = Math.floor(Math.random() * 3);
      P.list.push({ kind, v: Math.floor(Math.random() * 4), color: Math.floor(Math.random() * 5), x: this.cloudX(i) + (Math.random() - .5) * 80 * this.cs, y: this.cloudY() + 30 * this.cs, vy: this.h * .05, vx: 0, s: Math.max(22, Math.min(this.h * .052, this.w * .085)), state: 'fall', t: Math.random() * 3, sway: Math.random() * 6, dir: 0 });
      P.spawned++; P.nextIn = 1.5 + Math.random() * .9;
    }

    landPet(q, caught) {
      q.state = 'walk'; q.vx = 0; q.vy = 0;
      if (!q.dir) q.dir = q.x < this.w / 2 ? -1 : 1;
      this.fx.burst(q.x, this.groundY - 6, 6, { colors: ['#fff', '#e8f4d8'], speed: 70, g: 40, life: .5, size: 7, up: 40 });
      if (!caught) sfx.tap();
    }

    updatePets(dt) {
      const P = this.pets, g = this.geomCache = this.netGeom(), pad = g.sc * 4.2;
      P.t += dt;
      const target = Math.max(g.half + pad, Math.min(this.w - g.half - pad, this.bucket.tx)), old = P.net.x;
      P.net.x += (target - P.net.x) * Math.min(1, dt * 9); P.net.vx = (P.net.x - old) / Math.max(dt, .001);
      P.net.sagV += (-(P.net.sag - g.base) * 90 - P.net.sagV * 9) * dt; P.net.sag += P.net.sagV * dt;
      const g2 = this.netGeom();
      if (P.phase === 'in') { P.ffIn = Math.min(1, P.ffIn + dt / 1.4); if (P.ffIn >= 1) P.phase = 'play'; }
      else if (P.phase === 'play') {
        P.nextIn -= dt;
        if (P.spawned < P.total && P.nextIn <= 0) this.spawnPet();
        if (P.spawned >= P.total && !P.list.some(q => q.state === 'fall' || q.state === 'bounce')) {
          P.phase = 'done'; P.doneT = 0; store.addStars(2); this.bag.petEvents++; store.save(); sfx.win(); voice.say('pets-safe');
          this.fx.burst(this.w / 2, this.h * .4, 30, { colors: RAINBOW, speed: 420, g: 400, life: 1.3, size: 8, shape: 'confetti', up: 240 });
        }
      } else if (P.phase === 'done') { P.doneT += dt; if (P.doneT > 3) P.phase = 'out'; }
      else if (P.phase === 'out') { P.ffIn = Math.max(0, P.ffIn - dt / 1.4); if (P.ffIn <= 0) { this.pets = null; this.bucketHide = 0; return; } }
      this.bucketHide = P.phase === 'in' || P.phase === 'out' ? P.ffIn : 1;
      const geo = g2, grav = this.h * .9;
      for (const q of P.list) {
        q.t += dt;
        if (q.state === 'fall') {
          q.vy = Math.min(this.h * .15, q.vy + this.h * .08 * dt); q.y += q.vy * dt; q.x += Math.sin(q.t * 1.8 + q.sway) * this.h * .1 * dt;
          const feet = q.y + q.s * 1.05, u = (q.x - geo.x0) / (geo.x1 - geo.x0);
          if (P.phase === 'play' && u > .05 && u < .95 && feet >= geo.y0 + 4 * P.net.sag * u * (1 - u)) {
            q.state = 'bounce'; q.dir = q.x < P.net.x ? -1 : 1; q.vx = q.dir * this.h * .3; q.vy = -this.h * .36;
            P.net.sagV += this.h * .55; sfx.boing();
            this.fx.burst(q.x, feet, 9, { colors: ['#ffd54a', '#fff', '#ff9db8'], shape: 'star', speed: 190, g: 200, life: .8, size: 8, up: 110 });
            P.caught++; this.bag.pets++; this.petCounter && this.petCounter.set(this.bag.pets); store.save();
            if (P.caught % 3 === 0) store.addStars(1);
            if (Math.random() < .4) voice.sound('critter/' + q.kind);
          } else if (feet >= this.groundY) { q.y = this.groundY - q.s * 1.05; this.landPet(q, false); }
        } else if (q.state === 'bounce') {
          q.vy += grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - .3 * dt;
          if (q.y + q.s * 1.05 >= this.groundY && q.vy > 0) { q.y = this.groundY - q.s * 1.05; this.landPet(q, true); }
        } else { // walk off calmly
          q.x += q.dir * this.h * .1 * dt; q.y = this.groundY - q.s * 1.05;
        }
      }
      P.list = P.list.filter(q => q.x > -q.s * 4 && q.x < this.w + q.s * 4);
    }

    drawPets(c) {
      const P = this.pets, g = this.netGeom(), sc = g.sc, gy = this.groundY;
      // crew and net
      c.save(); c.translate(g.x0 - 2.25 * sc, gy); art.firefighter(c, 'bear', sc, this.t, { dir: 1, walk: Math.min(1, Math.abs(P.net.vx) / (this.w * .3)), wave: P.phase === 'done' }); c.restore();
      c.save(); c.translate(g.x1 + 2.25 * sc, gy); art.firefighter(c, 'fox', sc, this.t + 1.3, { dir: -1, walk: Math.min(1, Math.abs(P.net.vx) / (this.w * .3)), wave: P.phase === 'done' }); c.restore();
      art.safetyNet(c, g.x0, g.x1, g.y0, P.net.sag, 26);
      for (const q of P.list) {
        c.save(); c.translate(q.x, q.y);
        if (q.state === 'walk' && q.dir < 0) c.scale(-1, 1);
        art.pet(c, q.kind, q.v, q.s, q.t, q.state === 'fall' ? 'fall' : q.state === 'bounce' ? 'bounce' : 'walk', q.color);
        c.restore();
      }
    }

    tick(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, .05); this.last = now; this.t += dt;
      const b = this.bucket;
      if (this.keys.ArrowLeft) b.tx -= this.w * .9 * dt; if (this.keys.ArrowRight) b.tx += this.w * .9 * dt;
      b.tx = Math.max(this.bw * .4, Math.min(this.w - this.bw * .4, b.tx));
      b.x += (b.tx - b.x) * Math.min(1, dt * 14);
      this.spawnIn -= dt; if (this.spawnIn <= 0 && !this.pets) this.spawn();
      if (this.petsPending && !this.pets && this.rainbow <= .02) { this.petsPending = false; this.startPets(); }
      if (this.pets) this.updatePets(dt);
      const g = this.h * .22, vmax = this.h * .46;
      for (const d of this.drops) { d.vy = Math.min(vmax, d.vy + g * dt); d.y += d.vy * dt; d.blink -= dt; }
      this.drops = this.drops.filter(d => {
        if (this.bucketHide < .3 && d.y + d.r * .4 >= this.rimY && d.y <= this.rimY + this.bh * .35 && Math.abs(d.x - b.x) < this.bw * .5 - d.r * .3) { this.catchDrop(d); return false; }
        if (d.y >= this.groundY) { this.ripples.push({ x: d.x, y: this.groundY, life: 1 }); this.fx.burst(d.x, this.groundY, 3, { colors: ['#9be0ff'], speed: 90, g: 500, life: .35, size: 3, up: 120 }); return false; }
        return true;
      });
      for (const r of this.ripples) r.life -= dt * 1.4;
      this.ripples = this.ripples.filter(r => r.life > 0);
      if (this.moodT > 0) this.moodT -= dt;
      if (this.rainbow > 0) this.rainbow = Math.max(0, this.rainbow - dt / 4.5);
      if (this.newFlower > 0) this.newFlower = Math.max(0, this.newFlower - dt * .8);
      this.fx.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(this.tick);
    }

    draw() {
      const c = this.ctx, { w, h } = this;
      if (!w || !h) return;
      art.scene(c, w, h, this.t, { sky: ['#b7cfe8', '#d9eaf1', '#eef4e4'], showSun: false, clouds: false, hill: ['#b2daa0', '#9ccf8d', '#86c47f'] });
      // rainbow
      if (this.rainbow > 0) {
        const grow = Math.min(1, (1 - this.rainbow) * 4 + .05), fade = Math.min(1, this.rainbow * 2.2);
        c.save(); c.globalAlpha = fade * .85; c.lineCap = 'round';
        RAINBOW.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = w * .022; c.beginPath(); c.arc(w / 2, h * .84, w * (.42 - i * .021), Math.PI, Math.PI + Math.PI * grow); c.stroke(); });
        c.restore();
      }
      // soft rain streaks
      c.strokeStyle = 'rgba(120,170,215,.28)'; c.lineWidth = 2; c.lineCap = 'round';
      for (const s of this.streaks) { const y = ((s.y * h + this.t * h * .5 * s.s) % h), x = s.x * w; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 16 * s.s); c.stroke(); }
      // clouds
      for (let i = 0; i < 3; i++) {
        const x = this.cloudX(i), y = this.cloudY() + Math.sin(this.t * .8 + i) * 6, s = this.cs * (i === 1 ? 1.1 : .95);
        art.cloud(c, x, y, s, 1, '#e3ecf7');
        c.save(); c.translate(x + 8 * s, y + 4 * s); art.face(c, 26 * s, { mood: this.rainbow > 0 || this.pets ? 'cheer' : 'happy', blink: Math.sin(this.t * .9 + i * 2) > .97 }); c.restore();
      }
      // drops
      for (const d of this.drops) { c.save(); c.translate(d.x, d.y); art.drop(c, d.r, { gold: d.gold, mood: d.y > this.rimY - this.h * .25 ? 'wow' : 'happy', blink: d.blink < .1 && d.blink > 0 }); c.restore(); }
      // meadow
      const n = Math.min(this.bag.flowers, 14);
      for (let i = 0; i < n; i++) {
        const x = this.w * (.06 + ((i * .618034) % 1) * .88), sz = this.h * (.13 + (i % 3) * .015);
        const pop = i === n - 1 && this.newFlower > 0 ? 1 - this.newFlower : 1;
        c.save(); c.translate(x, this.groundY + this.h * .02); c.scale(Math.min(1, pop * 1.4 + .01), Math.min(1, pop * 1.4 + .01));
        art.plant(c, art.PLANTS[i % 3].id, 3, sz, this.t + i);
        c.restore();
      }
      // puddle ripples
      c.lineWidth = 3;
      for (const r of this.ripples) { c.globalAlpha = r.life * .7; c.strokeStyle = '#6fbde8'; c.beginPath(); c.ellipse(r.x, r.y, (1 - r.life) * 46 + 6, (1 - r.life) * 12 + 2, 0, 0, TAU); c.stroke(); }
      c.globalAlpha = 1;
      // bucket
      if (this.bucketHide < .98) art.bucket(c, this.bucket.x, this.rimY + this.bucketHide * this.h * .4, this.bw, this.bh, this.fill, this.t, this.moodT > 0 || this.rainbow > .5 ? 'cheer' : 'happy');
      if (this.pets) this.drawPets(c);
      this.fx.draw(c);
    }
  }

  SPG.games.push({
    id: 'rain', name: 'Rain Bucket', order: 3,
    icon(c, w, h) {
      art.scene(c, w, h, 6, { sky: ['#b7cfe8', '#d9eaf1', '#eef4e4'], showSun: false, clouds: false, hill: ['#b2daa0', '#9ccf8d', '#86c47f'] });
      const s = Math.min(w, h * 1.15);
      ['#ff6b81', '#ffa64d', '#ffe066', '#7ed957', '#5cc8f2', '#8a7cf0'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = s * .03; c.beginPath(); c.arc(w * .5, h * .95, s * (.6 - i * .034), Math.PI * 1.08, Math.PI * 1.92); c.stroke(); });
      art.cloud(c, w * .3, h * .2, s / 620, 1, '#e3ecf7'); c.save(); c.translate(w * .3 + 6, h * .2 + 3); art.face(c, s * .05); c.restore();
      art.cloud(c, w * .72, h * .16, s / 760, 1, '#e3ecf7');
      for (const [x, y, r] of [[.28, .46, .034], [.34, .64, .03], [.66, .42, .03], [.74, .58, .036]]) { c.save(); c.translate(w * x, h * y); art.drop(c, s * r); c.restore(); }
      c.save(); c.translate(w * .5, h * .66); c.rotate(0); art.bucket(c, 0, 0, s * .3, s * .24, .55, 1, 'cheer'); c.restore();
    },
    create: host => new RainGame(host)
  });
})();
