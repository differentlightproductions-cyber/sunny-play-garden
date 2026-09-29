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
      this.bag = store.bag('rain', () => ({ flowers: 0 }));
      this.fx = new art.Fx();
      this.drops = []; this.ripples = []; this.streaks = [];
      this.t = 0; this.fill = 0; this.caught = 0; this.rainbow = 0; this.spawnIn = .6; this.moodT = 0; this.newFlower = 0;
      this.bucket = { x: 0, tx: 0 }; this.running = false; this.keys = {};
      this.tick = this.tick.bind(this);
      const cv = this.canvas;
      const at = e => { const r = cv.getBoundingClientRect(); this.bucket.tx = (e.clientX - r.left) * this.w / r.width; };
      cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture?.(e.pointerId); this.dragging = true; at(e); });
      cv.addEventListener('pointermove', e => { if (this.dragging) { e.preventDefault(); at(e); } });
      for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, () => { this.dragging = false; });
      this.onKey = e => { this.keys[e.key] = e.type === 'keydown'; };
      addEventListener('keydown', this.onKey); addEventListener('keyup', this.onKey);
      for (let i = 0; i < 40; i++) this.streaks.push({ x: Math.random(), y: Math.random(), s: .5 + Math.random() });
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const ow = this.w || r.width;
      this.w = r.width; this.h = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.bw = Math.max(130, Math.min(250, this.w * .21)); this.bh = this.bw * .8;
      this.rimY = this.h - this.bh - this.h * .07;
      this.groundY = this.h * .95;
      this.dropR = Math.max(15, Math.min(28, Math.min(this.w, this.h) * .032));
      this.cs = Math.min(1.5, this.w / 700 + .5);
      if (!this.bucket.x) this.bucket.x = this.bucket.tx = this.w / 2; else { this.bucket.x *= this.w / ow; this.bucket.tx *= this.w / ow; }
      this.draw();
    }

    start() { this.resize(); this.resume(); voice.say('catch-drops'); }
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); this.dragging = false; }
    destroy() { this.pause(); removeEventListener('keydown', this.onKey); removeEventListener('keyup', this.onKey); this.canvas.remove(); }

    cloudX(i) { return this.w * (.2 + i * .3) + Math.sin(this.t * .35 + i * 2) * this.w * .06; }
    cloudY() { return Math.max(110, this.h * .17); }

    spawn() {
      const i = Math.floor(Math.random() * 3), gold = Math.random() < .12;
      this.drops.push({ x: this.cloudX(i) + (Math.random() - .5) * 90 * this.cs, y: this.cloudY() + 30 * this.cs, vy: this.h * .1, r: this.dropR * (gold ? 1.15 : .9 + Math.random() * .2), gold, blink: Math.random() * 3 });
      this.spawnIn = Math.max(.55, 1.0 - this.caught * .004) + Math.random() * .45;
    }

    catchDrop(d) {
      this.caught++; this.moodT = .35;
      this.fill = Math.min(1, this.fill + (d.gold ? 2 : 1) / BUCKET_CAPACITY);
      this.fx.burst(d.x, this.rimY, 8, { colors: ['#9be0ff', '#fff', d.gold ? '#ffd54a' : '#5cc8f2'], speed: 190, g: 700, life: .5, size: 5, up: 200 });
      sfx.plink(this.caught);
      if (this.fill >= 1) this.celebrate();
    }

    celebrate() {
      this.rainbow = 1; this.fill = 0; this.bag.flowers++; this.newFlower = 1; store.save(); store.addStars(1);
      sfx.win(); voice.say('rainbow', 'wow');
      const b = this.bucket;
      this.fx.burst(b.x, this.rimY, 28, { colors: RAINBOW, speed: 420, g: 400, life: 1.2, size: 8, shape: 'confetti', up: 260 });
    }

    tick(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, .05); this.last = now; this.t += dt;
      const b = this.bucket;
      if (this.keys.ArrowLeft) b.tx -= this.w * .9 * dt; if (this.keys.ArrowRight) b.tx += this.w * .9 * dt;
      b.tx = Math.max(this.bw * .4, Math.min(this.w - this.bw * .4, b.tx));
      b.x += (b.tx - b.x) * Math.min(1, dt * 14);
      this.spawnIn -= dt; if (this.spawnIn <= 0) this.spawn();
      const g = this.h * .22, vmax = this.h * .46;
      for (const d of this.drops) { d.vy = Math.min(vmax, d.vy + g * dt); d.y += d.vy * dt; d.blink -= dt; }
      this.drops = this.drops.filter(d => {
        if (d.y + d.r * .4 >= this.rimY && d.y <= this.rimY + this.bh * .35 && Math.abs(d.x - b.x) < this.bw * .5 - d.r * .3) { this.catchDrop(d); return false; }
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
        c.save(); c.translate(x + 8 * s, y + 4 * s); art.face(c, 26 * s, { mood: this.rainbow > 0 ? 'cheer' : 'happy', blink: Math.sin(this.t * .9 + i * 2) > .97 }); c.restore();
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
      art.bucket(c, this.bucket.x, this.rimY, this.bw, this.bh, this.fill, this.t, this.moodT > 0 || this.rainbow > .5 ? 'cheer' : 'happy');
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
