// Hide and Seek Garden: garden friends hide behind bushes, boulders and haystacks. Touch a hiding place to look.
// An empty place shakes and glows blue (cold), yellow (warmer) or orange (hot) with a rising little chirp, so she can
// hunt without any reading. Finding everybody makes a rainbow.
(() => {
  const SPG = window.SPG;
  const { art, sfx, voice, store } = SPG;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const RAINBOW = ['#ff6b81', '#ffa64d', '#ffe066', '#7ed957', '#5cc8f2', '#8a7cf0', '#c98bf0'];
  const KINDS = ['bunny', 'hedgehog', 'frog', 'duckling', 'mouse', 'turtle', 'cat', 'dog', 'mypet'];

  // Hiding places. (0, 0) = the middle of the bottom edge; S = about the width.
  const SPOTS = [
    { name: 'bush', draw(c, S) { blobs(c, S, ['#5cb85c', '#7ed957', '#4aa64f']); berries(c, S, '#ff6b81'); } },
    { name: 'blossom', draw(c, S) { blobs(c, S, ['#6fc46f', '#8ad67a', '#58b358']); berries(c, S, '#ffb3d1', 7); } },
    { name: 'boulder', draw(c, S) {
      const g = c.createLinearGradient(0, -S * .8, 0, 0); g.addColorStop(0, '#c9ccd8'); g.addColorStop(1, '#9ea3b5');
      c.fillStyle = g; c.beginPath(); c.moveTo(-S * .52, 0); c.bezierCurveTo(-S * .58, -S * .55, -S * .3, -S * .85, S * .05, -S * .82); c.bezierCurveTo(S * .45, -S * .8, S * .6, -S * .4, S * .52, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-S * .2, -S * .55, S * .16, S * .07, -.6, 0, TAU); c.fill();
      c.fillStyle = '#7fbf6a'; c.beginPath(); c.ellipse(S * .28, -S * .06, S * .2, S * .06, 0, 0, TAU); c.fill(); } },
    { name: 'hay', draw(c, S) {
      c.fillStyle = '#f2c94c'; art.rr(c, -S * .5, -S * .75, S, S * .75, S * .12); c.fill();
      c.strokeStyle = '#d9a52e'; c.lineWidth = S * .025; c.lineCap = 'round'; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-S * .42 + i * S * .1, -S * .68); c.lineTo(-S * .38 + i * S * .1, -S * .08); c.stroke(); }
      c.fillStyle = '#c98b5b'; c.fillRect(-S * .5, -S * .48, S, S * .06); c.fillRect(-S * .5, -S * .2, S, S * .06); } },
    { name: 'crate', draw(c, S) {
      c.fillStyle = '#d9a06c'; art.rr(c, -S * .48, -S * .78, S * .96, S * .78, S * .06); c.fill();
      c.strokeStyle = '#a9743f'; c.lineWidth = S * .05; c.strokeRect(-S * .42, -S * .72, S * .84, S * .66); c.beginPath(); c.moveTo(-S * .42, -S * .72); c.lineTo(S * .42, -S * .06); c.moveTo(S * .42, -S * .72); c.lineTo(-S * .42, -S * .06); c.stroke(); } },
    { name: 'autumn', draw(c, S) { blobs(c, S, ['#f0a23c', '#f5c04a', '#e0862c']); berries(c, S, '#c9402f', 6); } }
  ];
  function blobs(c, S, cols) {
    const spec = [[-.3, -.32, .34, 0], [.28, -.3, .36, 1], [0, -.5, .4, 2], [-.05, -.24, .4, 0], [-.4, -.14, .22, 1], [.4, -.14, .22, 2]];
    for (const [x, y, r, k] of spec) { c.fillStyle = cols[k]; c.beginPath(); c.arc(x * S, y * S, r * S, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(-S * .18, -S * .62, S * .16, S * .07, -.5, 0, TAU); c.fill();
  }
  function berries(c, S, col, n = 5) { c.fillStyle = col; for (let i = 0; i < n; i++) { c.beginPath(); c.arc((((i * 37) % 70) / 70 - .5) * S * .8, -S * (.2 + ((i * 53) % 50) / 100), S * .04, 0, TAU); c.fill(); } }

  class HideGame {
    constructor(host) {
      this.host = host;
      this.canvas = document.createElement('canvas'); this.canvas.className = 'game-canvas';
      host.append(this.canvas); this.ctx = this.canvas.getContext('2d');
      this.bag = store.bag('hide', () => ({ found: 0, rounds: 0 }));
      this.bag.found = this.bag.found || 0; this.bag.rounds = this.bag.rounds || 0;
      this.counter = SPG.ui.counter(host, (c, s) => { c.strokeStyle = '#5a3f5e'; c.lineWidth = s * .09; c.lineCap = 'round'; c.beginPath(); c.arc(s * .42, s * .42, s * .22, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(s * .58, s * .58); c.lineTo(s * .78, s * .78); c.stroke(); c.fillStyle = 'rgba(127,212,245,.5)'; c.beginPath(); c.arc(s * .42, s * .42, s * .2, 0, TAU); c.fill(); }, this.bag.found);
      this.fx = new art.Fx(); this.t = 0; this.running = false; this.idle = 0; this.state = 'play'; this.stateT = 0; this.wonK = 0;
      this.tick = this.tick.bind(this);
      const cv = this.canvas;
      cv.addEventListener('pointerdown', e => { e.preventDefault(); SPG.audio.unlock(); const r = cv.getBoundingClientRect(); this.press((e.clientX - r.left) * this.w / r.width, (e.clientY - r.top) * this.h / r.height); });
      this.newRound(true);
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.w = r.width; this.h = r.height;
      const dpr = SPG.ui.dpr();
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const wide = this.w >= this.h * 1.1, cols = wide ? 3 : 2, rows = wide ? 2 : 3;
      this.ui = clamp(Math.min(this.w, this.h * 1.4) / 780, .6, 1.4);
      const cw = this.w / cols, ch = (this.h * (wide ? .78 : .8)) / rows;
      this.S = Math.min(cw * .74, ch * .78);
      this.spots.forEach((sp, i) => { const c = i % cols, r0 = Math.floor(i / cols); sp.x = cw * (c + .5); sp.y = this.h * (wide ? .2 : .16) + ch * (r0 + .9); });
      this.draw();
    }

    newRound(first) {
      const round = this.bag.rounds++, n = round < 3 ? 1 : round < 7 ? 2 : 3;
      const order = SPOTS.map((_, i) => i).sort(() => Math.random() - .5);
      this.spots = order.map((k, i) => ({ k, x: 0, y: 0, shake: 0, checked: false, halo: 0, haloK: 0, friend: null }));
      const kinds = KINDS.filter(k => k !== 'mypet' || SPG.pets.active()).sort(() => Math.random() - .5).slice(0, n);
      const spots = this.spots.map((_, i) => i).sort(() => Math.random() - .5).slice(0, n);
      kinds.forEach((kind, i) => { this.spots[spots[i]].friend = { kind, found: false, jump: 0, t: 0 }; });
      this.state = 'play'; this.stateT = 0; this.wonK = 0; this.idle = 0; this.fx.p.length = 0;
      store.save();
      if (this.w) this.resize();
      if (!first) sfx.chime();
    }
    start() { this.resize(); this.resume(); voice.say('hide-start'); }
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); }
    destroy() { this.pause(); this.canvas.remove(); this.counter.el.remove(); }

    press(x, y) {
      if (this.state !== 'play') return;
      this.idle = 0;
      let best = -1, bd = 1e9;
      this.spots.forEach((sp, i) => { const d = Math.hypot(x - sp.x, y - (sp.y - this.S * .4)); if (d < this.S * .6 && d < bd) { best = i; bd = d; } });
      if (best < 0) return;
      const sp = this.spots[best];
      if (sp.friend && !sp.friend.found) { this.reveal(sp); return; }
      if (sp.friend && sp.friend.found) { sp.friend.jump = 1; return; }
      // nobody here: shake, glow how warm it is
      sp.shake = 1; sp.checked = true; sfx.rustle();
      const left = this.spots.filter(q => q.friend && !q.friend.found);
      let near = 1e9; for (const q of left) near = Math.min(near, Math.hypot(q.x - sp.x, q.y - sp.y));
      const k = clamp(1 - near / (Math.hypot(this.w, this.h) * .45), 0, 1);
      sp.haloK = k; sp.halo = 1;
      setTimeout(() => sfx.warm(k), 180);
    }
    reveal(sp) {
      const f = sp.friend; f.found = true; f.jump = 1; f.t = 0;
      this.bag.found++; this.counter.set(this.bag.found); store.save();
      sfx.pop(); setTimeout(() => sfx.win(), 120);
      if (f.kind === 'mypet') SPG.pets.noise(SPG.pets.active().id); else sfx.critter(f.kind === 'duckling' ? 'duckling' : f.kind, 3);
      this.fx.burst(sp.x, sp.y - this.S * .5, 16, { colors: RAINBOW, speed: 260, g: 360, life: 1, size: 6 * this.ui, shape: 'confetti', up: 200 });
      voice.say('hide-found');
      if (this.spots.every(q => !q.friend || q.friend.found)) { this.state = 'won'; this.stateT = 0; store.addStars(1); setTimeout(() => { sfx.cheer(); voice.say('hide-done'); }, 1400); }
    }

    tick(now) {
      if (!this.running) return;
      const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt; this.idle += dt; this.stateT += dt;
      for (const sp of this.spots) { sp.shake = Math.max(0, sp.shake - dt * 2.4); sp.halo = Math.max(0, sp.halo - dt * .7); if (sp.friend && sp.friend.found) { sp.friend.t += dt; sp.friend.jump = Math.max(0, sp.friend.jump - dt * 1.6); } }
      if (this.state === 'won') { this.wonK = Math.min(1, this.wonK + dt * .6); if (this.stateT > 6) this.newRound(false); }
      this.fx.update(dt);
      this.draw(); this.raf = requestAnimationFrame(this.tick);
    }

    friend(c, f, S, hop) {
      const SZ = { bunny: .34, hedgehog: .24, frog: .22, duckling: .22, mouse: .22, turtle: .24, cat: .22, dog: .23 };
      c.save();
      if (f.kind === 'mypet') { const a = SPG.pets.active(); SPG.pets.draw(c, a.id, S * .5, this.t, { mood: hop ? 'cheer' : 'happy', hop, hat: a.hat }); }
      else art.creature(c, f.kind, S * 1.7 * (SZ[f.kind] || .22), this.t, false);
      c.restore();
    }
    draw() {
      const c = this.ctx, w = this.w, h = this.h; if (!w) return;
      art.scene(c, w, h, this.t);
      if (this.wonK > 0) {
        const k = this.wonK; c.save(); c.globalAlpha = .85 * k; c.lineWidth = Math.min(w, h) * .03; c.lineCap = 'round';
        RAINBOW.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(w / 2, h * .62, Math.min(w * .48, h * .5) * (1 - i * .05), Math.PI * 1.05, Math.PI * (1.05 + .9 * k)); c.stroke(); }); c.restore();
      }
      const S = this.S, order = this.spots.map((_, i) => i).sort((a, b) => this.spots[a].y - this.spots[b].y);
      for (const i of order) {
        const sp = this.spots[i], f = sp.friend;
        c.save(); c.translate(sp.x, sp.y);
        c.fillStyle = 'rgba(60,90,60,.2)'; c.beginPath(); c.ellipse(0, 2, S * .55, S * .07, 0, 0, TAU); c.fill();
        if (f && !f.found) {   // hiding: behind the place; after a while of not finding it, ears peek out
          const hint = this.idle > 12 ? (Math.sin(this.t * 3) * .5 + .5) : 0;
          c.save(); c.translate(0, -S * .02 - hint * S * .3); if (hint) c.rotate(Math.sin(this.t * 9) * .06); this.friend(c, f, S, 0); c.restore();
        }
        const ang = Math.sin(sp.shake * 26) * sp.shake * .06;
        c.save(); c.rotate(ang); c.globalAlpha = sp.checked ? .82 : 1; SPOTS[sp.k].draw(c, S); c.restore();
        if (f && f.found) {   // found: hops next to the place
          const hop = Math.abs(Math.sin(f.t * 5)) * (this.state === 'won' ? .12 : .04) + Math.sin(f.jump * Math.PI) * .3;
          c.save(); c.translate(S * .62, S * .06 - hop * S); this.friend(c, f, S, f.jump); c.restore();
        }
        if (sp.halo > 0) {
          const col = sp.haloK > .66 ? '#ff7a45' : sp.haloK > .33 ? '#ffc93c' : '#6fb4f0';
          c.strokeStyle = col; c.globalAlpha = Math.min(1, sp.halo * 1.4); c.lineWidth = S * .07;
          c.beginPath(); c.ellipse(0, -S * .38, S * (.6 + (1 - sp.halo) * .2), S * (.5 + (1 - sp.halo) * .15), 0, 0, TAU); c.stroke();
          c.fillStyle = col; c.globalAlpha = sp.halo * .18; c.fill(); c.globalAlpha = 1;
        }
        c.restore();
      }
      this.fx.draw(c);
    }
  }

  SPG.games.push({
    id: 'hide', name: 'Hide and Seek', order: 10,
    icon(c, w, h) {
      art.scene(c, w, h, 5, { showSun: true });
      const S = Math.min(w * .3, h * 1.2);
      c.save(); c.translate(w * .28, h * .95); SPOTS[0].draw(c, S); c.restore();
      c.save(); c.translate(w * .72, h * .95); c.save(); c.translate(0, -S * .04); art.creature(c, 'bunny', S * 1.1, 1, false); c.restore(); SPOTS[3].draw(c, S * .9); c.restore();
      c.save(); c.translate(w * .5, h * .95); SPOTS[2].draw(c, S * .8); c.restore();
      c.fillStyle = '#fff'; c.strokeStyle = '#ffc93c'; c.lineWidth = 3; c.beginPath(); c.ellipse(w * .28, h * .5, S * .2, S * .16, 0, 0, TAU); c.stroke();
    },
    create: host => new HideGame(host)
  });
})();
