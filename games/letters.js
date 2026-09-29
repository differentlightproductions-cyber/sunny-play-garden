// Letter Garden: trace letters with a finger, flash cards, find-the-letter, and her own name.
(() => {
  const SPG = window.SPG;
  const { art, glyphs, voice, sfx, store } = SPG;
  const TAU = Math.PI * 2;
  const COLORS = ['#ff7a8a', '#ffa64d', '#f2c230', '#59b96e', '#4fb3e8', '#9a7be8'];
  const ALPHA = glyphs.LETTERS;
  const CONFUSABLE = { b: 'dpq', d: 'bpq', p: 'bdq', q: 'bdp', m: 'nw', n: 'mu', u: 'n', w: 'm', i: 'lj', l: 'ij', j: 'il', I: 'lJ', O: 'Q', Q: 'O', E: 'F', F: 'E' };

  const el = (tag, cls, ...kids) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...kids.filter(k => k != null)); return e; };
  const icon = id => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.innerHTML = `<use href="#i-${id}"/>`; return s; };
  const btn = (cls, label, ...kids) => { const b = el('button', cls, ...kids); b.type = 'button'; b.setAttribute('aria-label', label); return b; };
  const withCase = (ch, cs) => cs === 'upper' ? ch.toUpperCase() : ch.toLowerCase();
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function paint(canvas, fn) {
    requestAnimationFrame(() => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      const c = canvas.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      fn(c, r.width, r.height);
    });
  }

  function displayName() {
    const raw = glyphs.clean(store.active?.name || '');
    if (!raw) return '';
    return raw === raw.toLowerCase() || raw === raw.toUpperCase() ? raw[0].toUpperCase() + raw.slice(1).toLowerCase() : raw;
  }

  // Draw a glyph as a pale track with dotted centre line (used for menu art and the tracer).
  function ghostGlyph(c, ch, x, y, size, upTo = 0) {
    const g = glyphs.get(ch); if (!g) return;
    const k = size / 100;
    c.save(); c.translate(x, y); c.scale(k, k); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const st of g.strokes) { c.lineWidth = 22; c.strokeStyle = 'rgba(205,188,247,.55)'; c.stroke(st.path); }
    g.strokes.forEach((st, i) => {
      c.setLineDash([.01, 9]); c.lineWidth = 4.5; c.strokeStyle = '#fff'; c.stroke(st.path); c.setLineDash([]);
      if (i < upTo) { c.lineWidth = 15; c.strokeStyle = COLORS[i % COLORS.length]; c.stroke(st.path); }
    });
    c.restore();
  }

  /* ================================================================ Tracer */
  // Tracing tolerances, in glyph units (the pale track is 24 units wide, so 12 is "on the track").
  const TOLERANCE = 12, START_RADIUS = 24, LOOKAHEAD = 12;
  class Tracer {
    constructor(host, { onStroke, onDone }) {
      this.canvas = el('canvas', 'lg-canvas'); host.append(this.canvas);
      this.c = this.canvas.getContext('2d');
      this.fx = new art.Fx();
      this.onStroke = onStroke; this.onDone = onDone;
      this.t = 0; this.running = false; this.pid = null; this.engaged = false; this.finger = null;
      const cv = this.canvas;
      cv.addEventListener('pointerdown', e => this.down(e));
      cv.addEventListener('pointermove', e => this.move(e));
      for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(t, e => this.up(e));
      this.resize();
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.w = r.width; this.h = r.height;
      const dpr = SPG.ui.dpr();
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.c.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.g) this.layout();
      this.render();
    }

    setLetter(ch, strip) {
      this.ch = ch; this.g = glyphs.get(ch); this.strip = strip || null;
      this.si = 0; this.prog = 0; this.done = false; this.idle = 0; this.demoT = 0; this.miss = 0; this.hint = 0; this.pop = 0;
      this.pid = null; this.engaged = false;
      this.layout();
    }

    layout() {
      const { w, h, g } = this;
      const m = Math.min(w, h), ui = Math.max(46, Math.min(76, m * .11)), edge = Math.max(8, Math.min(14, m * .02)), arrow = Math.max(58, Math.min(92, m * .14));
      const side = w > h && h < 520;                      // landscape phone: arrows sit at the sides
      const top = this.strip ? h * .26 : ui + edge + 16;
      const bottom = side ? ui * .9 + edge : arrow + edge + 14;
      const inset = side ? arrow + edge + 12 : w * .05;
      const availH = h - top - bottom, panelW = w - inset * 2;
      const ext = g.lower ? 145 : 100;
      this.k = Math.min(availH / (ext + 26), (panelW * .9) / (g.w + 26));
      this.ox = (w - g.w * this.k) / 2;
      this.oy = top + (availH - ext * this.k) / 2;
      this.panel = { x: inset, y: Math.max(edge, top * .82), w: panelW, h: h - Math.max(edge, top * .82) - bottom * .4 };
    }

    start() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(t => this.frame(t)); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); this.pid = null; this.engaged = false; }
    resume() { this.start(); }
    destroy() { this.pause(); this.canvas.remove(); }

    toUnits(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left - this.ox) / this.k, y: (e.clientY - r.top - this.oy) / this.k, px: e.clientX - r.left, py: e.clientY - r.top }; }

    down(e) {
      if (!this.g || this.done || this.pid !== null) return;
      e.preventDefault(); this.pid = e.pointerId; try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { /* capture is optional */ }
      const u = this.toUnits(e); this.finger = u; this.idle = 0;
      const st = this.g.strokes[this.si], p = st.pts[this.prog];
      if (dist(u, p) <= START_RADIUS) {
        this.engaged = true;
        if (glyphs.isDot(st)) this.strokeDone();
      } else {
        this.engaged = false;
        if (++this.miss >= 2) this.hint = 1.6;
        sfx.squeak();
      }
    }

    move(e) {
      if (e.pointerId !== this.pid) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of (evs.length ? evs : [e])) {
        const u = this.toUnits(ev), prev = this.finger || u; this.finger = u;
        this.fx.burst(u.px, u.py, 1, { colors: [COLORS[(this.si + 2) % 6], '#fff'], speed: 34, g: 0, life: .45, size: 4 });
        if (!this.engaged) continue;
        // Walk from the last finger position to this one in small steps so a quick swipe can never skip ahead.
        const n = Math.max(1, Math.ceil(dist(prev, u) / 4));
        const stepLen = dist(prev, u) / n; // progress can never run ahead of how far the finger actually moved
        for (let i = 1; i <= n && !this.done; i++) this.advance({ x: prev.x + (u.x - prev.x) * i / n, y: prev.y + (u.y - prev.y) * i / n }, Math.ceil(stepLen / 2.5) + 2);
      }
    }

    up(e) { if (e.pointerId !== this.pid) return; this.pid = null; this.engaged = false; this.finger = null; }

    // Progress only follows the finger along the path: the nearest point just ahead, and only when
    // the finger is actually on the line. Off the line, or on a neighbouring stroke, nothing happens.
    advance(u, ahead = LOOKAHEAD) {
      if (this.done) return;
      const st = this.g.strokes[this.si], pts = st.pts;
      const max = Math.min(pts.length - 1, this.prog + ahead);
      let best = -1, bd = Infinity;
      for (let j = this.prog; j <= max; j++) { const d = dist(u, pts[j]); if (d < bd) { bd = d; best = j; } }
      if (bd > TOLERANCE) return;
      if (best > this.prog) {
        if (Math.floor(best / 8) !== Math.floor(this.prog / 8)) sfx.note(Math.floor(best / 8) % 7, .08);
        this.prog = best; this.idle = 0;
      }
      if (this.prog >= pts.length - 2) this.strokeDone();
    }

    strokeDone() {
      const st = this.g.strokes[this.si], end = st.pts[st.pts.length - 1];
      this.fx.burst(this.ox + end.x * this.k, this.oy + end.y * this.k, 8, { colors: [COLORS[this.si % 6], '#fff', '#ffd54a'], speed: 150, g: 200, life: .6, size: 5, shape: 'star' });
      this.si++; this.prog = 0; this.demoT = 0; this.idle = 0; this.engaged = false; this.miss = 0;
      if (this.si >= this.g.strokes.length) {
        this.done = true; this.pid = null; this.pop = 1;
        const cx = this.ox + this.g.w * this.k / 2, cy = this.oy + 50 * this.k;
        this.fx.burst(cx, cy, 30, { colors: COLORS, speed: 420, g: 500, life: 1.2, size: 8, shape: 'confetti', up: 120 });
        this.fx.burst(cx, cy, 10, { colors: ['#ffd54a', '#fff'], speed: 320, g: 120, life: 1, size: 12, shape: 'star' });
        this.onDone && this.onDone(this.ch);
      } else { sfx.chime(); this.onStroke && this.onStroke(this.si); }
    }

    // Where the bee is: leading the finger, or demonstrating the stroke when idle.
    beePos() {
      const st = this.g.strokes[this.si]; if (!st) return null;
      const pts = st.pts;
      if (this.prog > 0 && this.idle < 3.5) return { p: pts[this.prog], demo: false };
      const from = this.prog, span = pts.length - 1 - from;
      const dur = Math.max(.9, span * 2.5 / 60), cycle = dur + .9;
      const s = this.demoT % cycle;
      if (glyphs.isDot(st)) return { p: pts[0], demo: false };
      const f = Math.min(1, s / dur), i = from + Math.round(f * span);
      return { p: pts[Math.min(i, pts.length - 1)], demo: true, f };
    }

    frame(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, .05); this.last = now;
      this.t += dt; if (this.pid === null) { this.idle += dt; this.demoT += dt; } else this.demoT = 0;
      if (this.hint > 0) this.hint -= dt;
      if (this.pop > 0) this.pop = Math.max(0, this.pop - dt * 1.2);
      this.fx.update(dt);
      this.render();
      this.raf = requestAnimationFrame(t => this.frame(t));
    }

    render() {
      const c = this.c, { w, h } = this;
      if (!w || !this.g) return;
      c.clearRect(0, 0, w, h);
      const P = this.panel;
      c.fillStyle = 'rgba(90,63,94,.1)'; art.rr(c, P.x, P.y + 10, P.w, P.h, 44); c.fill();
      c.fillStyle = 'rgba(255,255,255,.82)'; art.rr(c, P.x, P.y, P.w, P.h, 44); c.fill();

      // name strip
      if (this.strip) {
        const chars = [...this.strip.text], size = Math.min(h * .11, (w * .8) / (glyphs.measure(this.strip.text, 1, 16) || 1));
        let x = (w - glyphs.measure(this.strip.text, size, 16)) / 2; const y = h * .06;
        chars.forEach((ch, i) => {
          const g = glyphs.get(ch), lift = i === this.strip.index ? Math.sin(this.t * 5) * size * .05 : 0;
          glyphs.draw(c, ch, x, y + lift, size, { color: i < this.strip.index || (i === this.strip.index && this.done) ? COLORS[i % 6] : i === this.strip.index ? '#5a3f5e' : 'rgba(90,63,94,.25)', width: 12 });
          x += (g.w + 16) * size / 100;
        });
      }

      // writing lines
      const { ox, oy, k, g } = this;
      c.save(); c.lineCap = 'round';
      const line = (y, dash, col) => { c.setLineDash(dash); c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(P.x + 34, oy + y * k); c.lineTo(P.x + P.w - 34, oy + y * k); c.stroke(); };
      line(100, [], 'rgba(120,150,210,.55)');
      if (g.lower) { line(45, [10, 12], 'rgba(120,150,210,.4)'); line(0, [10, 12], 'rgba(120,150,210,.28)'); } else line(0, [10, 12], 'rgba(120,150,210,.28)');
      c.restore();

      // glyph
      const bounce = this.pop ? 1 + Math.sin(this.pop * Math.PI * 3) * .05 * this.pop : 1;
      c.save(); c.translate(ox + g.w * k / 2, oy + 50 * k); c.scale(bounce, bounce); c.translate(-(ox + g.w * k / 2), -(oy + 50 * k));
      c.translate(ox, oy); c.scale(k, k); c.lineCap = 'round'; c.lineJoin = 'round';
      g.strokes.forEach((st, i) => {
        c.lineWidth = 24; c.strokeStyle = 'rgba(205,188,247,.5)'; c.stroke(st.path);
      });
      g.strokes.forEach((st, i) => {
        if (i > this.si || this.done) { /* completed strokes drawn below */ }
        if (i < this.si || this.done) { c.lineWidth = 16; c.strokeStyle = COLORS[i % 6]; c.stroke(st.path); c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke(st.path); return; }
        c.setLineDash([.01, 9]); c.lineWidth = 4.6; c.strokeStyle = i === this.si ? '#fff' : 'rgba(255,255,255,.7)'; c.stroke(st.path); c.setLineDash([]);
        if (i === this.si && this.prog > 0 && !glyphs.isDot(st)) {
          c.lineWidth = 16; c.strokeStyle = COLORS[i % 6]; c.beginPath();
          st.pts.slice(0, this.prog + 1).forEach((p, j) => j ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
        }
      });
      // numbered start dots
      if (!this.done) {
        const order = g.strokes.map((_, i) => i).sort((a, b) => (a === this.si) - (b === this.si)); // active stroke's dot on top
        order.forEach(i => {
          const st = g.strokes[i];
          if (i < this.si || (i === this.si && this.prog > 0)) return;
          const p = st.pts[0], cur = i === this.si, pulse = cur ? 1 + Math.sin(this.t * 6) * .12 + (this.hint > 0 ? .25 : 0) : .8;
          c.fillStyle = cur ? COLORS[i % 6] : 'rgba(90,63,94,.3)'; c.beginPath(); c.arc(p.x, p.y, 8 * pulse, 0, TAU); c.fill();
          c.lineWidth = 2.5; c.strokeStyle = '#fff'; c.stroke();
          if (g.strokes.length > 1) { c.fillStyle = '#fff'; c.font = '700 11px Fredoka, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), p.x, p.y + .8); }
        });
      }
      c.restore();

      // bee
      if (!this.done) {
        const b = this.beePos();
        if (b) {
          const bx = ox + b.p.x * k, by = oy + b.p.y * k - Math.sin(this.t * 7) * 4;
          c.save(); c.translate(bx, by - Math.min(w, h) * .03); const s = Math.min(w, h) * .055;
          c.fillStyle = 'rgba(90,63,94,.12)'; c.beginPath(); c.ellipse(0, s * .9, s * .5, s * .15, 0, 0, TAU); c.fill();
          art.bee(c, s, this.t, { mood: 'happy' }); c.restore();
        }
      }
      this.fx.draw(c);
    }
  }

  /* ================================================================ Game */
  class LettersGame {
    constructor(host) {
      this.host = host;
      this.bag = store.bag('letters', () => ({ done: {}, case: 'upper', correct: 0, seen: 0 }));
      this.root = el('div', 'lg'); host.append(this.root);
      this.timers = new Set(); this.tracer = null; this.paused = false; this.introCount = 0;
    }
    start() { this.menu(); }
    later(fn, ms) { const id = setTimeout(() => { this.timers.delete(id); if (!this.paused) fn(); }, ms); this.timers.add(id); return id; }
    reset(cls) {
      this.timers.forEach(clearTimeout); this.timers.clear();
      this.tracer?.destroy(); this.tracer = null; voice.stop();
      this.root.replaceChildren(); this.root.className = 'lg ' + (cls || '');
    }
    pause() { this.paused = true; this.tracer?.pause(); }
    resume() { this.paused = false; this.tracer?.resume(); }
    resize() { this.tracer?.resize(); }
    destroy() { this.reset(); this.root.remove(); }
    backButton() { const b = btn('lg-back lg-btn', 'Back', icon('back')); SPG.ui.press(b, () => { sfx.tap(); this.menu(); }); return b; }
    caseChip(onChange, { key = 'case', modes = ['upper', 'lower'] } = {}) {
      const b = btn('lg-case', 'Change capital and lowercase');
      const paintChip = () => {
        const m = this.bag[key] || modes[0], inner = el('span', 'lg-case-inner');
        if (m === 'mix') inner.append(glyphs.canvas('A', 44, { color: '#5a3f5e', width: 14 }), glyphs.canvas('a', 44, { color: '#5a3f5e', width: 14 }));
        else inner.append(glyphs.canvas(m === 'upper' ? 'A' : 'a', 54, { color: '#5a3f5e', width: 14 }));
        b.replaceChildren(inner);
      };
      paintChip();
      SPG.ui.press(b, () => { const i = modes.indexOf(this.bag[key] || modes[0]); this.bag[key] = modes[(i + 1) % modes.length]; store.save(); sfx.tap(); paintChip(); onChange(); });
      return b;
    }

    // Pick a letter from `source`, avoiding the last few so the games keep mixing things up.
    pickLetter(source) {
      this.recent = this.recent || [];
      let choices = source.filter(l => !this.recent.includes(l));
      if (!choices.length) choices = source;
      const l = choices[Math.floor(Math.random() * choices.length)];
      this.recent.push(l); if (this.recent.length > 9) this.recent.shift();
      return l;
    }

    /* ---------------- menu ---------------- */
    menu() {
      this.reset('lg-menu');
      const name = displayName();
      const modes = [
        ['Trace', 'Trace letters', (c, w, h) => {
          const s = Math.min(w, h) * .6; ghostGlyph(c, 'A', w / 2 - 30 * s / 100, h * .2, s, 1);
          c.save(); c.translate(w * .62, h * .34); art.bee(c, Math.min(w, h) * .11, 0); c.restore();
        }, () => this.traceGrid()],
        ['Flash cards', 'Flash cards', (c, w, h) => {
          const s = Math.min(w, h);
          for (const [dx, rot, col] of [[-.12, -.12, '#ffe0a8'], [.1, .1, '#c9f0dc']]) {
            c.save(); c.translate(w / 2 + dx * w, h / 2); c.rotate(rot); c.fillStyle = col; art.rr(c, -s * .27, -s * .34, s * .54, s * .68, s * .07); c.fill();
            c.restore();
          }
          c.save(); c.translate(w / 2 + .1 * w, h / 2); c.rotate(.1);
          glyphs.draw(c, 'B', -s * .11, -s * .26, s * .3, { color: '#ff7a8a', width: 13 });
          c.font = `${s * .22}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🐻', 0, s * .18);
          c.restore();
        }, () => this.cards()],
        ['Find it', 'Find the letter', (c, w, h) => {
          const s = Math.min(w * .3, h * .5);
          ['C', 'a', 'T'].forEach((ch, i) => {
            const x = w / 2 + (i - 1) * s * 1.1 - s / 2, y = h / 2 - s * .55;
            c.fillStyle = '#fff'; art.rr(c, x, y, s, s * 1.05, s * .18); c.fill();
            if (i === 1) { c.strokeStyle = '#59b96e'; c.lineWidth = 6; art.rr(c, x, y, s, s * 1.05, s * .18); c.stroke(); }
            glyphs.draw(c, ch, x + s * .18, y + s * .1, s * .62, { color: COLORS[(i * 2 + 1) % 6], width: 14 });
          });
          art.star(c, w / 2 + s * .5, h / 2 + s * .72, s * .2);
        }, () => this.find()],
        ['My name', 'Write my name', (c, w, h) => {
          const text = name || 'Me', unit = glyphs.measure(text, 1);
          const size = Math.min(h * .34, w * .7 / unit), tw = glyphs.measure(text, size);
          c.fillStyle = '#fff'; art.rr(c, w / 2 - tw / 2 - size * .5, h / 2 - size * .45, tw + size, size * 1.4, size * .3); c.fill();
          text.split('').forEach((ch, i) => { const x = w / 2 - tw / 2 + glyphs.measure(text.slice(0, i), size) + i * 10 * size / 100 * 0; });
          let x = w / 2 - tw / 2;
          for (const ch of text) { glyphs.draw(c, ch, x, h / 2 - size * .3, size, { color: COLORS[(x | 0) % 6 === 0 ? 0 : Math.abs((x | 0)) % 6], width: 12 }); x += ((glyphs.get(ch)?.w ?? 30) + 10) * size / 100; }
          art.star(c, w / 2 + tw / 2 + size * .3, h / 2 - size * .45, size * .26);
        }, () => this.nameMode()],
        ['Sounds', 'Which picture starts with the sound', (c, w, h) => {
          const s = Math.min(w, h);
          c.fillStyle = '#5a3f5e'; c.beginPath(); c.moveTo(w * .12, h * .42); c.lineTo(w * .2, h * .42); c.lineTo(w * .32, h * .3); c.lineTo(w * .32, h * .7); c.lineTo(w * .2, h * .58); c.lineTo(w * .12, h * .58); c.closePath(); c.fill();
          c.strokeStyle = '#5a3f5e'; c.lineWidth = s * .03; c.lineCap = 'round';
          for (const r of [.07, .13]) { c.beginPath(); c.arc(w * .34, h * .5, s * r, -.9, .9); c.stroke(); }
          [['🐻', .58], ['🐱', .75], ['🐶', .92]].forEach(([e, x], i) => { c.fillStyle = '#fff'; art.rr(c, w * (x - .07), h * .3, w * .14, h * .4, s * .05); c.fill(); c.font = `${s * .14}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, w * x, h * .5); });
        }, () => this.sounds()],
        ['Match', 'Match big and little letters', (c, w, h) => {
          const s = Math.min(w * .3, h * .62);
          [['A', -.6, '#ff7a8a'], ['a', .6, '#ff7a8a']].forEach(([ch, dx, col]) => {
            const x = w / 2 + dx * s - s / 2, y = h / 2 - s * .6;
            c.fillStyle = '#fff'; art.rr(c, x, y, s, s * 1.2, s * .16); c.fill();
            glyphs.draw(c, ch, x + s * .2, y + s * (ch === 'A' ? .16 : .0), s * (ch === 'A' ? .68 : .5), { color: col, width: 14 });
          });
          art.heart(c, w / 2, h / 2 + s * .05, s * .17, '#ff7a8a');
        }, () => this.match()]
      ];
      const grid = el('div', 'lg-modes');
      modes.forEach(([label, aria, draw, go], i) => {
        const canvas = el('canvas', 'lg-mode-art');
        const b = btn(`lg-mode m${i}`, aria, canvas, el('span', 'lg-mode-label', label));
        SPG.ui.press(b, () => { sfx.pop(); go(); });
        grid.append(b); paint(canvas, draw);
      });
      this.root.append(grid);
    }

    /* ---------------- trace: pick a letter ---------------- */
    traceGrid() {
      this.reset('lg-grid');
      const list = ALPHA.map(ch => withCase(ch, this.bag.case));
      const wrap = el('div', 'lg-tiles');
      const px = Math.round(Math.max(56, Math.min(104, Math.min(innerWidth / 9.5, innerHeight / 5.6))));
      const build = () => {
        wrap.replaceChildren(...ALPHA.map(ch => withCase(ch, this.bag.case)).map((ch, i) => {
          const done = this.bag.done[ch];
          const b = btn('lg-tile' + (done ? ' done' : ''), 'Letter ' + ch, glyphs.canvas(ch, px, { color: COLORS[i % 6], width: 13 }));
          if (done) { const f = el('canvas', 'lg-flower'); b.append(f); paint(f, (c, w, h) => { c.translate(w / 2, h / 2); for (let p = 0; p < 5; p++) { c.rotate(TAU / 5); c.fillStyle = '#ff9db8'; c.beginPath(); c.arc(0, -w * .24, w * .2, 0, TAU); c.fill(); } c.fillStyle = '#ffd54a'; c.beginPath(); c.arc(0, 0, w * .17, 0, TAU); c.fill(); }); }
          SPG.ui.press(b, () => { sfx.pop(); this.trace(list, i); });
          return b;
        }));
      };
      build();
      this.root.append(this.backButton(), this.caseChip(() => { list.splice(0, 26, ...ALPHA.map(ch => withCase(ch, this.bag.case))); build(); }), wrap);
    }

    /* ---------------- trace: one letter (or the name) ---------------- */
    trace(list, index, { name = false } = {}) {
      this.reset('lg-trace');
      let i = index;
      const prev = btn('lg-btn lg-arrow left', 'Previous letter', icon('left'));
      const next = btn('lg-btn lg-arrow right', 'Next letter', icon('right'));
      const say = btn('lg-btn lg-say', 'Hear the letter', icon('speaker'));
      const reveal = el('div', 'lg-reveal hidden');
      this.tracer = new Tracer(this.root, {
        onStroke: () => { if (name) return; },
        onDone: ch => {
          this.bag.done[ch] = true; store.save(); store.addStars(1); sfx.win();
          const lc = ch.toLowerCase();
          if (name) {
            voice.say('great-job');
            if (i < list.length - 1) this.later(() => go(i + 1), 1700);
            else { next.classList.add('wiggle'); this.later(() => this.spellName(list), 1300); }
          } else {
            voice.say('great-job', 'letter/' + lc, 'is-for', 'word/' + lc);
            const [word, emoji] = SPG.voice.WORDS[lc];
            reveal.replaceChildren(el('span', 'lg-reveal-emoji', emoji)); reveal.classList.remove('hidden');
            next.classList.add('wiggle');
          }
        }
      });
      const go = n => {
        i = (n + list.length) % list.length;
        reveal.classList.add('hidden'); next.classList.remove('wiggle');
        const ch = list[i];
        this.tracer.setLetter(ch, name ? { text: list.join(''), index: i } : null);
        const lc = ch.toLowerCase();
        if (name) voice.say(i === 0 ? 'write-name' : null, 'letter/' + lc);
        else voice.say('letter/' + lc, 'sound/' + lc, this.introCount++ < 2 ? 'follow-bee' : null);
      };
      SPG.ui.press(prev, () => { sfx.tap(); go(i - 1); });
      SPG.ui.press(next, () => { sfx.tap(); go(i + 1); });
      SPG.ui.press(say, () => { const lc = list[i].toLowerCase(); voice.say('letter/' + lc, 'sound/' + lc); });
      const nav = [this.backButton(), say];
      if (!name) nav.push(prev);
      nav.push(next);
      this.root.append(reveal, ...nav);
      this.tracer.resize(); go(i); this.tracer.start();
      if (name) prev.remove();
    }

    spellName(list) {
      const n = list.join('');
      voice.say('spell-name', ...list.map(ch => 'letter/' + ch.toLowerCase()), { say: n });
    }

    nameMode() {
      const n = displayName();
      if (!n) { this.menu(); return; }
      this.trace([...n], 0, { name: true });
    }

    /* ---------------- flash cards ---------------- */
    cards() {
      this.reset('lg-cards');
      let i = 0, sx = null;
      const stage = el('div', 'lg-card-stage');
      const prev = btn('lg-btn lg-arrow left', 'Previous card', icon('left'));
      const next = btn('lg-btn lg-arrow right', 'Next card', icon('right'));
      const render = dir => {
        const ch = ALPHA[i], cs = this.bag.case, [word, emoji] = voice.WORDS[ch];
        const card = el('div', 'lg-card ' + (dir ? (dir > 0 ? 'in-right' : 'in-left') : 'in-pop'));
        card.style.setProperty('--hue', String((i * 14 + 330) % 360));
        const letter = btn('lg-card-letter', 'Letter ' + ch);
        letter.append(glyphs.canvas(withCase(ch, cs), Math.round(Math.min(innerHeight * .46, innerWidth * .3)), { color: COLORS[i % 6], width: 14 }));
        const pic = btn('lg-card-pic', word, el('span', 'lg-emoji', emoji));
        const wc = el('canvas', 'lg-word'); const size = Math.round(Math.min(innerHeight * .09, 56));
        const cw = Math.ceil(glyphs.measure(word, size) + size * .8), chh = Math.ceil(size * 1.5);
        const dpr = Math.min(devicePixelRatio || 1, 2);
        wc.width = cw * dpr; wc.height = chh * dpr; wc.style.width = cw + 'px'; wc.style.height = chh + 'px';
        const wctx = wc.getContext('2d'); wctx.scale(dpr, dpr);
        glyphs.drawText(wctx, word, size * .4, size * .1, size, { color: '#5a3f5e', width: 12 });
        card.append(el('div', 'lg-card-row', letter, pic), wc);
        stage.replaceChildren(card);
        const lc = ch;
        const sayAll = () => voice.say('letter/' + lc, 'sound/' + lc, 'is-for', 'word/' + lc);
        SPG.ui.press(letter, () => { sfx.pop(); voice.say('letter/' + lc, 'sound/' + lc); });
        SPG.ui.press(pic, () => { sfx.boing(); pic.classList.remove('jig'); void pic.offsetWidth; pic.classList.add('jig'); voice.say('word/' + lc); });
        this.later(sayAll, 350);
        if (++this.bag.seen % 5 === 0) { store.addStars(1); sfx.chime(); }
      };
      const go = d => { i = (i + d + 26) % 26; sfx.tap(); render(d); };
      SPG.ui.press(prev, () => go(-1)); SPG.ui.press(next, () => go(1));
      stage.addEventListener('pointerdown', e => { sx = e.clientX; });
      stage.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 70) go(e.clientX < sx ? 1 : -1); sx = null; });
      this.root.append(this.backButton(), this.caseChip(() => render(0)), stage, prev, next);
      render(0);
    }

    /* ---------------- find the letter ---------------- */
    pool() {
      const name = [...new Set(glyphs.clean(displayName()).toLowerCase())];
      return { name, all: [...ALPHA] };
    }

    find() {
      this.reset('lg-find');
      const area = el('div', 'lg-options');
      const say = btn('lg-btn lg-say big', 'Hear the letter', icon('speaker'));
      let target = null, qcase = 'upper', wrong = 0, locked = false;
      const ask = () => {
        const { name, all } = this.pool();
        const mode = this.bag.findCase || 'mix';
        qcase = mode === 'mix' ? (Math.random() < .5 ? 'upper' : 'lower') : mode;
        target = this.pickLetter(name.length && Math.random() < .3 ? name : all);
        wrong = 0; locked = false;
        const count = this.bag.correct >= 12 ? 4 : (this.bag.correct >= 5 && Math.random() < .4 ? 4 : 3);
        const bad = CONFUSABLE[target] || '';
        const others = all.filter(x => x !== target && !bad.includes(x)).sort(() => Math.random() - .5);
        const choices = [target, ...others.slice(0, count - 1)].sort(() => Math.random() - .5);
        area.replaceChildren(...choices.map((ch, idx) => {
          const px = Math.round(Math.min(innerHeight * .34, innerWidth * .28));
          const b = btn('lg-opt', 'Letter ' + withCase(ch, qcase), glyphs.canvas(withCase(ch, qcase), px, { color: COLORS[(idx * 2 + 1) % 6], width: 14 }));
          b.dataset.letter = ch; b.style.setProperty('--d', idx * .12 + 's');
          SPG.ui.press(b, () => choose(ch, b));
          return b;
        }));
        say.classList.add('wiggle');
        voice.say('find', 'letter/' + target);
      };
      const choose = (ch, b) => {
        if (locked) return;
        if (ch === target) {
          locked = true; sfx.win(); store.addStars(1);
          this.bag.correct++; store.save();
          [...area.children].forEach(o => o.classList.toggle('fade', o !== b));
          b.classList.add('right');
          const r = b.getBoundingClientRect(); this.burst(r.left + r.width / 2, r.top + r.height / 2);
          voice.say('great-job', 'letter/' + target, 'sound/' + target);
          this.later(ask, 2600);
        } else {
          wrong++; sfx.oops(); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
          voice.say('try-again', 'letter/' + target);
          if (wrong >= 2) [...area.children].forEach(o => { if (o.dataset.letter === target) o.classList.add('hint'); });
        }
      };
      SPG.ui.press(say, () => voice.say('find', 'letter/' + target));
      this.root.append(this.backButton(), this.caseChip(ask, { key: 'findCase', modes: ['mix', 'upper', 'lower'] }), say, area);
      ask();
    }

    /* ---------------- sounds: which picture starts with the sound? ---------------- */
    sounds() {
      this.reset('lg-find');
      const area = el('div', 'lg-options');
      const say = btn('lg-btn lg-say big', 'Hear the sound', icon('speaker'));
      const NO = 'xi'; // "box" ends in x, "ice cream" starts with a long vowel: skip them here
      const same = (a, b) => a === b || ('ckq'.includes(a) && 'ckq'.includes(b));
      const shuffle = a => a.sort(() => Math.random() - .5);
      let target = null, wrong = 0, locked = false;
      const ask = () => {
        const { name, all } = this.pool();
        const okAll = all.filter(l => !NO.includes(l)), okName = name.filter(l => !NO.includes(l));
        target = this.pickLetter(okName.length && Math.random() < .3 ? okName : okAll);
        wrong = 0; locked = false;
        const picks = [];
        for (const l of shuffle(ALPHA.filter(x => !NO.includes(x) && !same(x, target)))) { if (picks.length >= 2) break; if (!picks.some(p => same(p, l))) picks.push(l); }
        const choices = shuffle([target, ...picks]);
        area.replaceChildren(...choices.map((ch, idx) => {
          const [word, emoji] = voice.WORDS[ch];
          const b = btn('lg-opt', word, el('span', 'lg-emoji-opt', emoji));
          b.dataset.letter = ch; b.style.setProperty('--d', idx * .12 + 's');
          SPG.ui.press(b, () => choose(ch, b));
          return b;
        }));
        say.classList.add('wiggle');
        voice.say('starts-with', 'sound/' + target);
      };
      const choose = (ch, b) => {
        if (locked) return;
        if (ch === target) {
          locked = true; sfx.win(); store.addStars(1); this.bag.correct++; store.save();
          [...area.children].forEach(o => o.classList.toggle('fade', o !== b)); b.classList.add('right');
          const r = b.getBoundingClientRect(); this.burst(r.left + r.width / 2, r.top + r.height / 2);
          voice.say('great-job', 'sound/' + target, 'word/' + target);
          this.later(ask, 3000);
        } else {
          wrong++; sfx.oops(); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
          voice.say('try-again', 'sound/' + target);
          if (wrong >= 2) [...area.children].forEach(o => { if (o.dataset.letter === target) o.classList.add('hint'); });
        }
      };
      SPG.ui.press(say, () => voice.say('starts-with', 'sound/' + target));
      this.root.append(this.backButton(), say, area);
      ask();
    }

    /* ---------------- match: big letter with its little letter ---------------- */
    match() {
      this.reset('lg-match');
      const level = Math.min(3, this.bag.matchLevel || 0), pairs = 3 + level;
      const { name, all } = this.pool();
      const letters = [];
      if (name.length && Math.random() < .5) letters.push(name[Math.floor(Math.random() * name.length)]);
      while (letters.length < pairs) { const l = this.pickLetter(all); if (!letters.includes(l)) letters.push(l); }
      const cards = letters.flatMap(l => [{ l, up: true }, { l, up: false }]).sort(() => Math.random() - .5);
      const cols = innerWidth > innerHeight ? Math.ceil(cards.length / 2) : Math.min(4, Math.ceil(cards.length / 3));
      const grid = el('div', 'lg-match-grid'); grid.style.setProperty('--cols', cols);
      const px = Math.round(Math.max(90, Math.min(190, innerHeight * .26, innerWidth / (cols + .8) * .8)));
      let first = null, busy = false, found = 0;
      cards.forEach(cd => {
        const glyph = glyphs.canvas(cd.up ? cd.l.toUpperCase() : cd.l, px, { color: COLORS[ALPHA.indexOf(cd.l) % 6], width: 14 });
        const b = btn('mcard', 'Card', el('div', 'mface', el('div', 'mback', el('span', 'mstar', '★')), el('div', 'mfront', glyph)));
        cd.el = b; b.dataset.letter = cd.l;
        SPG.ui.press(b, () => {
          if (busy || b.classList.contains('up')) return;
          b.classList.add('up'); sfx.tap(); voice.say('letter/' + cd.l);
          if (!first) { first = cd; return; }
          const a = first; first = null; busy = true;
          if (a.l === cd.l) {
            this.later(() => {
              sfx.chime(); a.el.classList.add('done'); b.classList.add('done'); busy = false;
              if (++found === pairs) {
                sfx.win(); store.addStars(2); this.bag.matchLevel = Math.min(3, level + 1); store.save();
                const r = grid.getBoundingClientRect(); this.burst(r.left + r.width / 2, r.top + r.height / 2);
                voice.say('great-job', 'you-did-it'); this.later(() => this.match(), 3600);
              }
            }, 450);
          } else {
            this.later(() => { a.el.classList.remove('up'); b.classList.remove('up'); sfx.oops(); busy = false; }, 1300);
          }
        });
        grid.append(b);
      });
      this.root.append(this.backButton(), grid);
    }

    // Confetti as tiny DOM canvas over the whole game.
    burst(x, y) {
      const cv = el('canvas', 'lg-burst'); cv.width = innerWidth; cv.height = innerHeight; this.root.append(cv);
      const c = cv.getContext('2d'), fx = new art.Fx();
      fx.burst(x, y, 34, { colors: COLORS, speed: 460, g: 620, life: 1.3, size: 9, shape: 'confetti', up: 160 });
      fx.burst(x, y, 10, { colors: ['#ffd54a', '#fff'], speed: 300, g: 100, life: 1, size: 14, shape: 'star' });
      let last = performance.now();
      const tick = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; fx.update(dt); c.clearRect(0, 0, cv.width, cv.height); fx.draw(c); if (fx.p.length && cv.isConnected) requestAnimationFrame(tick); else cv.remove(); };
      requestAnimationFrame(tick);
    }
  }

  SPG.games.push({
    id: 'letters', name: 'Letter Garden', order: 1,
    icon(c, w, h) {
      const s = Math.min(w, h * 1.1);
      [['A', -.36, '#ff7a8a', -.12], ['b', 0, '#4fb3e8', .05], ['C', .36, '#59b96e', -.06]].forEach(([ch, dx, col, rot]) => {
        c.save(); c.translate(w / 2 + dx * s, h * .52); c.rotate(rot);
        c.fillStyle = '#fff'; art.rr(c, -s * .16, -s * .28, s * .32, s * .52, s * .06); c.fill();
        const gs = s * .26, gw = glyphs.get(ch).w * gs / 100;
        glyphs.draw(c, ch, -gw / 2, -s * .18, gs, { color: col, width: 14 });
        c.restore();
      });
      c.save(); c.translate(w * .5, h * .12); art.bee(c, s * .075, 0); c.restore();
      for (const [x, y] of [[.12, .8], [.86, .78], [.3, .88], [.7, .9]]) { c.save(); c.translate(w * x, h * y); for (let p = 0; p < 5; p++) { c.rotate(TAU / 5); c.fillStyle = ['#ff9db8', '#fff', '#ffd54a'][p % 3]; c.beginPath(); c.arc(0, -s * .03, s * .026, 0, TAU); c.fill(); } c.restore(); }
    },
    create: host => new LettersGame(host)
  });
})();
