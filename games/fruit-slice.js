class FruitSliceGame {
  constructor(canvas, scoreElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreElement = scoreElement;
    this.fruits = [];
    this.halves = [];
    this.drops = [];
    this.popups = [];
    this.trail = [];
    this.score = 0;
    this.running = false;
    this.pointerId = null;
    this.lastPoint = null;
    this.tick = this.tick.bind(this);
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this.resize);
    canvas.addEventListener('pointerdown', e => this.pointerDown(e));
    canvas.addEventListener('pointermove', e => this.pointerMove(e));
    canvas.addEventListener('pointerup', e => this.pointerUp(e));
    canvas.addEventListener('pointercancel', e => this.pointerUp(e));
    canvas.addEventListener('lostpointercapture', e => this.pointerUp(e));
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const oldW = this.w || rect.width, oldH = this.h || rect.height;
    this.w = rect.width; this.h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const f of this.fruits) { f.x *= this.w / oldW; f.y *= this.h / oldH; f.vx *= this.w / oldW; f.vy *= this.h / oldH; }
    this.draw();
  }

  start() {
    this.stop();
    this.fruits.length = this.halves.length = this.drops.length = this.popups.length = this.trail.length = 0;
    this.score = 0;
    this.scoreElement.textContent = '⭐ 0';
    this.spawnIn = .35;
    this.resize();
    this.resume();
  }

  resume() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.pointerId = null;
    this.lastPoint = null;
    this.trail.length = 0;
  }

  stop() { this.pause(); }

  point(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * this.w / r.width, y: (e.clientY - r.top) * this.h / r.height, time: performance.now() };
  }

  pointerDown(e) {
    if (!this.running || this.pointerId !== null) return;
    e.preventDefault();
    this.pointerId = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);
    this.lastPoint = this.point(e);
    this.trail.push(this.lastPoint);
  }

  pointerMove(e) {
    if (!this.running || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const sample of events) {
      const next = this.point(sample);
      this.sliceSegment(this.lastPoint, next);
      this.lastPoint = next;
      this.trail.push(next);
    }
    if (this.trail.length > 24) this.trail.splice(0, this.trail.length - 24);
  }

  pointerUp(e) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.lastPoint = null;
  }

  // A segment catches fruit even when a fast swipe skips over it between events.
  static segmentHitsCircle(a, b, c) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    const x = a.x + t * dx - c.x, y = a.y + t * dy - c.y;
    return x * x + y * y <= (c.r * .86) ** 2;
  }

  sliceSegment(a, b) {
    if (!a) return;
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      if (!FruitSliceGame.segmentHitsCircle(a, b, fruit)) continue;
      this.fruits.splice(i, 1);
      this.score += 10;
      this.scoreElement.textContent = `⭐ ${this.score}`;
      const kick = Math.max(this.h * .11, 70);
      for (const side of [-1, 1]) this.halves.push({ ...fruit, side, x: fruit.x + side * 3, vx: fruit.vx + side * kick, vy: fruit.vy - kick * .4, vr: side * 3, life: .72 });
      const color = ['#f34e68', '#ff9e34', '#eb5c68', '#7cc751', '#ffdc52', '#ef6688'][fruit.type];
      for (let n = 0; n < 9 && this.drops.length < 110; n++) {
        const angle = Math.random() * Math.PI * 2, speed = 45 + Math.random() * 170;
        this.drops.push({ x: fruit.x, y: fruit.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 2 + Math.random() * 4, color, life: .4 + Math.random() * .3 });
      }
      this.popups.push({ x: fruit.x, y: fruit.y - fruit.r, life: .72 });
    }
  }

  spawn() {
    const count = Math.random() < .22 ? 2 + Math.floor(Math.random() * 3) : 1;
    const rBase = Math.max(22, Math.min(52, Math.min(this.w * .072, this.h * .065)));
    const middle = this.w * (.25 + Math.random() * .5);
    for (let i = 0; i < count; i++) {
      const r = rBase * (.82 + Math.random() * .27);
      this.fruits.push({
        x: Math.max(r, Math.min(this.w - r, middle + (i - (count - 1) / 2) * r * 2.3)),
        y: this.h + r + Math.random() * 15,
        vx: (Math.random() - .5) * this.w * .32,
        vy: -this.h * (1.28 + Math.random() * .24),
        r, type: Math.floor(Math.random() * 6), rotation: Math.random() * 6.28,
        vr: (Math.random() - .5) * 3
      });
    }
    this.spawnIn = .85 + Math.random() * .65;
  }

  tick(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, .05);
    this.lastTime = now;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) this.spawn();
    const gravity = this.h * 1.55;
    for (const f of this.fruits) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += gravity * dt; f.rotation += f.vr * dt; }
    this.fruits = this.fruits.filter(f => f.y < this.h + f.r * 2 && f.x > -f.r * 2 && f.x < this.w + f.r * 2);
    for (const h of this.halves) { h.x += h.vx * dt; h.y += h.vy * dt; h.vy += gravity * dt; h.rotation += h.vr * dt; h.life -= dt; }
    this.halves = this.halves.filter(h => h.life > 0);
    for (const d of this.drops) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += gravity * .35 * dt; d.life -= dt; }
    this.drops = this.drops.filter(d => d.life > 0);
    for (const p of this.popups) { p.y -= 45 * dt; p.life -= dt; }
    this.popups = this.popups.filter(p => p.life > 0);
    this.trail = this.trail.filter(p => now - p.time < 150);
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  }

  draw() {
    if (!this.w || !this.h) return;
    const c = this.ctx, w = this.w, h = this.h;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#b9edfa'); sky.addColorStop(.72, '#f4fbdf'); sky.addColorStop(1, '#e0f3c6');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff8c';
    for (const [x, y, size] of [[.15,.2,1],[.76,.3,.7],[.47,.48,.55]]) {
      c.beginPath(); c.ellipse(w*x, h*y, 56*size, 19*size, 0, 0, Math.PI*2); c.fill();
    }
    c.fillStyle = '#b8dfaa'; c.beginPath(); c.ellipse(w*.18, h+45, w*.48, 105, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = '#a0d99e'; c.beginPath(); c.ellipse(w*.88, h+55, w*.6, 115, 0, 0, Math.PI*2); c.fill();
    for (const f of this.fruits) { c.save(); c.translate(f.x, f.y); c.rotate(f.rotation); this.drawFruit(c, f); c.restore(); }
    for (const half of this.halves) {
      c.save(); c.globalAlpha = Math.min(1, half.life * 2.3); c.translate(half.x, half.y); c.rotate(half.rotation);
      c.beginPath(); c.rect(half.side < 0 ? -half.r*1.3 : 0, -half.r*1.3, half.r*1.3, half.r*2.6); c.clip();
      this.drawFruit(c, half);
      c.strokeStyle = '#fff8e5'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -half.r*.85); c.lineTo(0, half.r*.85); c.stroke(); c.restore();
    }
    for (const d of this.drops) { c.globalAlpha = Math.min(1, d.life * 2); c.fillStyle = d.color; c.beginPath(); c.arc(d.x, d.y, d.r, 0, Math.PI*2); c.fill(); }
    c.globalAlpha = 1;
    for (const p of this.popups) { c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = '#fff'; c.strokeStyle = '#d75a6e'; c.lineWidth = 5; c.font = '900 26px system-ui'; c.textAlign = 'center'; c.strokeText('+10', p.x, p.y); c.fillText('+10', p.x, p.y); }
    c.globalAlpha = 1;
    if (this.trail.length > 1) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (let pass = 0; pass < 2; pass++) {
        c.beginPath(); c.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) c.lineTo(this.trail[i].x, this.trail[i].y);
        c.strokeStyle = pass ? '#fffdf1' : '#ff7299aa'; c.lineWidth = pass ? 5 : 15; c.stroke();
      }
    }
  }

  drawFruit(c, f) {
    const r = f.r;
    c.lineWidth = Math.max(2, r*.09);
    c.strokeStyle = '#34483844';
    c.fillStyle = ['#f25168','#ff9e34','#42ad60','#957248','#ffdc52','#ed5277'][f.type];
    c.beginPath();
    if (f.type === 4) c.ellipse(0, 0, r*1.12, r*.77, -.25, 0, Math.PI*2);
    else if (f.type === 5) { c.moveTo(-r*.85, -r*.52); c.quadraticCurveTo(0, -r*1.1, r*.85, -r*.52); c.quadraticCurveTo(r*.62, r*.75, 0, r); c.quadraticCurveTo(-r*.65, r*.65, -r*.85, -r*.52); }
    else c.arc(0, 0, r, 0, Math.PI*2);
    c.fill(); c.stroke();
    if (f.type === 2) {
      c.fillStyle = '#26794b'; c.beginPath(); c.arc(0,0,r*.84,0,Math.PI*2); c.fill();
      c.fillStyle = '#f46b83'; c.beginPath(); c.arc(0,0,r*.72,0,Math.PI*2); c.fill();
      c.fillStyle = '#543d45'; for(let i=0;i<7;i++){ const a=i*Math.PI*2/7; c.beginPath(); c.ellipse(Math.cos(a)*r*.43,Math.sin(a)*r*.43,r*.035,r*.08,a,0,Math.PI*2); c.fill(); }
    } else if (f.type === 3) {
      c.fillStyle = '#88cd5b'; c.beginPath(); c.arc(0,0,r*.76,0,Math.PI*2); c.fill();
      c.fillStyle = '#f8f4df'; c.beginPath(); c.arc(0,0,r*.27,0,Math.PI*2); c.fill();
      c.fillStyle = '#373b35'; for(let i=0;i<10;i++){ const a=i*Math.PI*2/10; c.beginPath(); c.ellipse(Math.cos(a)*r*.5,Math.sin(a)*r*.5,r*.035,r*.07,a,0,Math.PI*2); c.fill(); }
    } else if (f.type === 5) {
      c.fillStyle = '#fff2ba'; for(let i=0;i<10;i++){ const x=(i%4-1.5)*r*.38,y=(Math.floor(i/4)-1)*r*.36; c.beginPath(); c.ellipse(x,y,r*.035,r*.08,-.2,0,Math.PI*2); c.fill(); }
    } else {
      c.fillStyle = '#ffffff76'; c.beginPath(); c.ellipse(-r*.3,-r*.32,r*.23,r*.13,-.7,0,Math.PI*2); c.fill();
      if (f.type === 1 || f.type === 4) { c.strokeStyle = '#fff4b4'; c.lineWidth = 2; c.beginPath(); c.arc(0,0,r*.7,.2,1.1); c.stroke(); }
    }
    if (f.type !== 4 && f.type !== 3) {
      c.strokeStyle = '#667947'; c.lineWidth = 3; c.beginPath(); c.moveTo(0,-r*.87); c.lineTo(r*.06,-r*1.13); c.stroke();
      c.fillStyle = '#56a75a'; c.beginPath(); c.ellipse(r*.24,-r*.98,r*.26,r*.11,-.4,0,Math.PI*2); c.fill();
    }
  }
}

window.FruitSliceGame = FruitSliceGame;
