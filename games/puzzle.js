// Puzzle Pond: jigsaw puzzles made from her own coloring pictures. Drag a piece near where it belongs and it
// clicks into place (the right spot glows while she holds a piece). Nothing is ever lost: a piece dropped
// in the wrong place just stays where it is. The puzzles grow from 4 pieces to 12 as she finishes them.
(() => {
  const SPG = window.SPG;
  const { art, sfx, voice, store } = SPG;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = u => u * u * (3 - 2 * u);
  const GRIDS = [[2, 2], [3, 2], [3, 3], [4, 3]];   // columns x rows

  // One edge of a jigsaw piece from (ax,ay) to (bx,by): flat when d = 0, otherwise a round knob that sticks out (d = 1) or in (d = -1).
  function edge(c, ax, ay, bx, by, d) {
    if (!d) { c.lineTo(bx, by); return; }
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = uy * d, ny = -ux * d;
    const P = (t, h) => [ax + ux * L * t + nx * L * h, ay + uy * L * t + ny * L * h];
    c.lineTo(...P(.38, 0));
    c.bezierCurveTo(...P(.38, .05), ...P(.3, .08), ...P(.32, .16));
    c.bezierCurveTo(...P(.34, .25), ...P(.66, .25), ...P(.68, .16));
    c.bezierCurveTo(...P(.7, .08), ...P(.62, .05), ...P(.62, 0));
    c.lineTo(bx, by);
  }

  class PuzzleGame {
    constructor(host) {
      this.host = host;
      this.canvas = document.createElement('canvas'); this.canvas.className = 'game-canvas';
      host.append(this.canvas); this.ctx = this.canvas.getContext('2d');
      this.bag = store.bag('puzzle', () => ({ solved: 0 }));
      this.bag.solved = this.bag.solved || 0;
      this.counter = SPG.ui.counter(host, (c, s) => {
        c.translate(s / 2, s / 2); c.fillStyle = '#59b96e'; art.rr(c, -s * .3, -s * .28, s * .6, s * .56, s * .08); c.fill();
        c.beginPath(); c.arc(s * .3, 0, s * .1, 0, TAU); c.arc(0, -s * .28, s * .1, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(-s * .3, 0, s * .1, 0, TAU); c.fill();
      }, this.bag.solved);
      this.fx = new art.Fx(); this.t = 0; this.running = false; this.pieces = []; this.drag = null; this.last = null;
      this.state = 'play'; this.stateT = 0; this.idle = 0;
      this.tick = this.tick.bind(this);
      const cv = this.canvas, at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * this.w / r.width, y: (e.clientY - r.top) * this.h / r.height }; };
      cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* optional */ } SPG.audio.unlock(); const p = at(e); this.grab(p.x, p.y, e.pointerId); });
      cv.addEventListener('pointermove', e => { if (this.drag && this.drag.id === e.pointerId) { e.preventDefault(); const p = at(e); this.drag.x = p.x; this.drag.y = p.y; } });
      for (const n of ['pointerup', 'pointercancel']) cv.addEventListener(n, e => { if (this.drag && this.drag.id === e.pointerId) this.release(); });
    }

    /* ---------------------------------------------------------------- setting up a puzzle */
    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const first = !this.w;
      this.w = r.width; this.h = r.height;
      const dpr = SPG.ui.dpr();
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ui = clamp(Math.min(this.w, this.h * 1.4) / 780, .6, 1.4);
      if (first || !this.def) this.newPuzzle(); else this.build(true);
      this.draw();
    }
    pickPicture() {
      const all = SPG.pictures, mine = all.filter(p => SPG.coloring.hasPaint(p.id));
      const pool = (mine.length && Math.random() < .8 ? mine : all).filter(p => p !== this.def);
      return pool[Math.floor(Math.random() * pool.length)] || all[0];
    }
    newPuzzle() {
      this.def = this.pickPicture();
      const gi = this.bag.solved < 2 ? 0 : this.bag.solved < 5 ? 1 : this.bag.solved < 9 ? 2 : 3;
      [this.cols, this.rows] = GRIDS[gi];
      this.state = 'play'; this.stateT = 0; this.idle = 0;
      // tabs: +1 sticks out, -1 goes in; matching neighbours agree
      const C = this.cols, R = this.rows, rnd = () => (Math.random() < .5 ? 1 : -1);
      this.hTab = Array.from({ length: R }, () => Array.from({ length: C - 1 }, rnd));
      this.vTab = Array.from({ length: R - 1 }, () => Array.from({ length: C }, rnd));
      this.build(false);
    }
    // Lay out the board and tray for the current screen and (re)draw the picture and the pieces.
    build(keep) {
      const w = this.w, h = this.h, wide = w >= h * 1.1, C = this.cols, R = this.rows;
      const maxW = wide ? Math.min(w * .6, h * .6 * 1.25) : w * .86, maxH = wide ? h * .64 : h * .42;
      let bw = maxW, bh = bw * .8; if (bh > maxH) { bh = maxH; bw = bh * 1.25; }
      this.bw = bw; this.bh = bh; this.bx = (w - bw) / 2; this.by = wide ? h * .05 : h * .09;
      this.pw = bw / C; this.ph = bh / R; this.m = Math.min(this.pw, this.ph) * .26;
      const d = Math.min(2, SPG.ui.dpr() * 1.2); this.pd = d;
      this.img = document.createElement('canvas'); this.img.width = Math.round(bw * d); this.img.height = Math.round(bh * d);
      const ic = this.img.getContext('2d'); ic.fillStyle = '#fffdf6'; ic.fillRect(0, 0, this.img.width, this.img.height);
      SPG.coloring.draw(ic, this.def, this.img.width);
      // tray
      const tx = w * .04, tw = w * .92, ty = wide ? h * .72 : this.by + bh + h * .04, th = wide ? h * .26 : h - (this.by + bh) - h * .07;
      let ts = 0, best = 1; const n = C * R;
      for (let rows = 1; rows <= 3; rows++) { const cols = Math.ceil(n / rows), s = Math.min(1, tw / (cols * this.pw * 1.1), th / (rows * this.ph * 1.1)); if (s > ts) { ts = s; best = rows; } }
      this.ts = ts;
      const cols = Math.ceil(n / best);
      const old = keep ? this.pieces : null;
      if (!old) {
        const order = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - .5);
        this.pieces = order.map((idx, k) => {
          const c0 = idx % C, r0 = Math.floor(idx / C);
          return { idx, c: c0, r: r0, sc: ts, locked: false, flash: 0, x: 0, y: 0, cv: null, k };
        });
      }
      this.pieces.forEach(p => {
        p.cv = this.pieceCanvas(p);
        p.tx = this.bx + (p.c + .5) * this.pw; p.ty = this.by + (p.r + .5) * this.ph;
        const k = old ? p.k : p.k, row = Math.floor(k / cols), col = k % cols, inRow = Math.min(cols, n - row * cols);
        const homeX = tx + tw / 2 + (col - (inRow - 1) / 2) * this.pw * ts * 1.1, homeY = ty + th / 2 + (row - (best - 1) / 2) * this.ph * ts * 1.1;
        if (p.locked) { p.x = p.tx; p.y = p.ty; }
        else if (!old) { p.x = homeX; p.y = homeY; }
        else { p.x = clamp(p.x, this.pw * .5, w - this.pw * .5); p.y = clamp(p.y, this.ph * .5, h - this.ph * .5); }
      });
    }
    // Draw the outline of piece p with its body's top-left corner at (ox, oy).
    tracePath(c, p, ox, oy) {
      const pw = this.pw, ph = this.ph, C = this.cols, R = this.rows, r = p.r, c0 = p.c, x0 = ox, y0 = oy, x1 = ox + pw, y1 = oy + ph;
      const top = r === 0 ? 0 : -this.vTab[r - 1][c0], bottom = r === R - 1 ? 0 : this.vTab[r][c0];
      const left = c0 === 0 ? 0 : -this.hTab[r][c0 - 1], right = c0 === C - 1 ? 0 : this.hTab[r][c0];
      c.beginPath(); c.moveTo(x0, y0); edge(c, x0, y0, x1, y0, top); edge(c, x1, y0, x1, y1, right); edge(c, x1, y1, x0, y1, bottom); edge(c, x0, y1, x0, y0, left); c.closePath();
    }
    pieceCanvas(p) {
      const d = this.pd, m = this.m, pw = this.pw, ph = this.ph;
      const cv = document.createElement('canvas'); cv.width = Math.ceil((pw + 2 * m) * d); cv.height = Math.ceil((ph + 2 * m) * d);
      const c = cv.getContext('2d'); c.scale(d, d);
      c.save(); this.tracePath(c, p, m, m); c.clip();
      c.drawImage(this.img, p.c * pw * d - m * d, p.r * ph * d - m * d, cv.width, cv.height, 0, 0, cv.width / d, cv.height / d);
      c.restore();
      this.tracePath(c, p, m, m); c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.9)'; c.stroke();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(90,63,94,.35)'; c.stroke();
      return cv;
    }

    /* ---------------------------------------------------------------- dragging */
    grab(x, y, id) {
      if (this.state !== 'play' || this.drag) return;
      for (let i = this.pieces.length - 1; i >= 0; i--) {
        const p = this.pieces[i]; if (p.locked) continue;
        const hw = this.pw * p.sc * .62, hh = this.ph * p.sc * .62;
        if (Math.abs(x - p.x) < hw && Math.abs(y - p.y) < hh) {
          this.pieces.splice(i, 1); this.pieces.push(p);
          this.drag = { p, id, x, y, dx: p.x - x, dy: p.y - y }; p.lift = 1; sfx.pop(); this.idle = 0; return;
        }
      }
    }
    release() {
      const d = this.drag; this.drag = null; if (!d) return;
      const p = d.p; p.lift = 0;
      if (Math.hypot(p.x - p.tx, p.y - p.ty) < Math.min(this.pw, this.ph) * .5) this.lock(p);
      else { p.x = clamp(p.x, this.pw * .5, this.w - this.pw * .5); p.y = clamp(p.y, this.ph * .5, this.h - this.ph * .5); }
    }
    lock(p) {
      p.locked = true; p.sc = 1; p.x = p.tx; p.y = p.ty; p.flash = 1;
      this.pieces.splice(this.pieces.indexOf(p), 1); this.pieces.unshift(p);   // locked pieces sit underneath loose ones
      sfx.snap(); this.idle = 0;
      this.fx.burst(p.tx, p.ty, 8, { colors: ['#ffd54a', '#fff', '#7fd4f5'], speed: 150, g: 200, life: .6, size: 5 * this.ui, shape: 'star', up: 60 });
      if (this.pieces.every(q => q.locked)) this.finish();
    }
    finish() {
      this.state = 'done'; this.stateT = 0;
      this.bag.solved++; this.counter.set(this.bag.solved); store.addStars(1); store.save();
      sfx.win(); voice.say('puzzle-done');
      this.fx.burst(this.w / 2, this.by + this.bh / 2, 30, { colors: ['#ff6b81', '#ffd54a', '#7ed957', '#5cc8f2', '#b58cf0'], speed: 340, g: 400, life: 1.3, size: 7 * this.ui, shape: 'confetti', up: 220 });
    }

    /* ---------------------------------------------------------------- loop */
    start() { this.resize(); this.resume(); voice.say('puzzle-start'); }
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); if (this.drag) { this.drag.p.lift = 0; this.drag = null; } }
    destroy() { this.pause(); this.canvas.remove(); this.counter.el.remove(); }
    tick(now) {
      if (!this.running) return;
      const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt; this.stateT += dt; this.idle += dt;
      if (this.drag) { const d = this.drag; d.p.x = d.x + d.dx; d.p.y = d.y + d.dy; d.p.sc = lerp(d.p.sc, 1, Math.min(1, dt * 14)); }
      for (const p of this.pieces) p.flash = Math.max(0, p.flash - dt * 2);
      if (this.state === 'done' && this.stateT > 4.2) this.newPuzzle();
      this.fx.update(dt);
      this.draw(); this.raf = requestAnimationFrame(this.tick);
    }

    /* ---------------------------------------------------------------- drawing */
    draw() {
      const c = this.ctx, w = this.w, h = this.h; if (!w) return;
      art.scene(c, w, h, this.t, { clouds: true });
      const bx = this.bx, by = this.by, bw = this.bw, bh = this.bh;
      // the board: a soft frame with the picture very faint behind, and the shape of every place
      c.fillStyle = 'rgba(90,63,94,.14)'; art.rr(c, bx - 14, by - 8, bw + 28, bh + 34, 28); c.fill();
      const fr = this.state === 'done' ? '#ffd54a' : '#fff'; c.fillStyle = fr; art.rr(c, bx - 14, by - 14, bw + 28, bh + 28, 28); c.fill();
      c.fillStyle = '#fffdf6'; c.fillRect(bx, by, bw, bh);
      c.globalAlpha = this.state === 'done' ? 1 : .2; c.drawImage(this.img, bx, by, bw, bh); c.globalAlpha = 1;
      if (this.state === 'play') {
        for (const p of this.pieces) {
          if (p.locked) continue;
          const glow = this.drag && this.drag.p === p;
          this.tracePath(c, p, p.tx - this.pw / 2, p.ty - this.ph / 2);
          if (glow) { c.fillStyle = 'rgba(255,224,102,.4)'; c.fill(); }
          c.setLineDash([9, 7]); c.strokeStyle = glow ? `rgba(255,170,30,${.75 + Math.sin(this.t * 8) * .25})` : 'rgba(90,63,94,.28)'; c.lineWidth = glow ? 5 : 2.5; c.stroke(); c.setLineDash([]);
        }
      }
      // pieces (locked ones first, loose ones on top)
      for (const p of this.pieces) {
        const lift = p.lift ? 1 : 0;
        c.save(); c.translate(p.x, p.y); c.scale(p.sc * (1 + lift * .04), p.sc * (1 + lift * .04));
        if (!p.locked) { c.shadowColor = 'rgba(60,40,70,.35)'; c.shadowBlur = lift ? 22 : 8; c.shadowOffsetY = lift ? 10 : 4; }
        if (this.state !== 'done' || !p.locked) c.drawImage(p.cv, -this.pw / 2 - this.m, -this.ph / 2 - this.m, this.pw + 2 * this.m, this.ph + 2 * this.m);
        if (p.flash > 0) { c.shadowColor = 'transparent'; c.globalAlpha = p.flash * .6; c.fillStyle = '#fff'; c.fillRect(-this.pw / 2, -this.ph / 2, this.pw, this.ph); c.globalAlpha = 1; }
        c.restore();
      }
      // tidy tray shelf under loose pieces is not drawn: they sit right on the meadow
      this.fx.draw(c);
    }
  }

  SPG.games.push({
    id: 'puzzle', name: 'Puzzle Pond', order: 6,
    icon(c, w, h) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#d8f0ff'); g.addColorStop(1, '#e6f7ec'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      const s = Math.min(w * .5, h * 1.6), pw = s * .5, ph = pw * .8;
      const bunny = SPG.pictures.find(p => p.id === 'bunny') || SPG.pictures[0];
      const im = document.createElement('canvas'); im.width = Math.round(pw * 2 * 2); im.height = Math.round(ph * 2 * 2);
      SPG.coloring.draw(im.getContext('2d'), bunny, im.width);
      const ox = w / 2 - pw, oy = h * .5 - ph;
      const cell = [[0, 0, 0, 0], [1, 0, 8, -4], [0, 1, -6, 8]];
      for (const [cx, cy, dx, dy] of cell) {
        c.save(); c.translate(ox + cx * pw + dx, oy + cy * ph + dy); c.beginPath(); art.rr(c, 0, 0, pw - 3, ph - 3, 8); c.clip();
        c.drawImage(im, cx * im.width / 2, cy * im.height / 2, im.width / 2, im.height / 2, 0, 0, pw, ph);
        c.restore(); c.strokeStyle = '#fff'; c.lineWidth = 3; art.rr(c, ox + cx * pw + dx, oy + cy * ph + dy, pw - 3, ph - 3, 8); c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,.55)'; c.setLineDash([8, 6]); c.strokeStyle = 'rgba(90,63,94,.35)'; c.lineWidth = 2;
      art.rr(c, ox + pw + 12, oy + ph + 8, pw - 3, ph - 3, 8); c.fill(); c.stroke(); c.setLineDash([]);
    },
    create: host => new PuzzleGame(host)
  });
})();
