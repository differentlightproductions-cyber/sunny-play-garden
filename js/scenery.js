// Scenery for the games: the same friendly world in different places and times (meadow, sunset, night, autumn, snow,
// beach, farm, city). Games pick a theme by how far she has got, so the level changes the whole look.
// SPG.scenery.draw(c, w, h, t, id, { sun: true, clouds: true }) paints the sky, far-away things, hills and any weather.
// SPG.scenery.fader(id) gives a small helper that cross-fades when the theme changes.
(() => {
  const SPG = window.SPG, art = SPG.art;
  const TAU = Math.PI * 2;
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  const treeRound = (c, x, base, r, col, trunk = '#8a6448') => { c.fillStyle = trunk; c.fillRect(x - r * .09, base - r * .9, r * .18, r * .9); c.fillStyle = col; c.beginPath(); c.arc(x, base - r * 1.15, r, 0, TAU); c.fill(); };
  const pine = (c, x, base, s, col, snow) => {
    c.fillStyle = '#7a5a48'; c.fillRect(x - s * .05, base - s * .25, s * .1, s * .25);
    for (let k = 0; k < 3; k++) {
      const y = base - s * (.2 + k * .3), ww = s * (.42 - k * .1);
      c.fillStyle = col; c.beginPath(); c.moveTo(x - ww, y); c.lineTo(x, y - s * .5); c.lineTo(x + ww, y); c.closePath(); c.fill();
      if (snow) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - ww * .55, y - s * .22); c.lineTo(x, y - s * .5); c.lineTo(x + ww * .55, y - s * .22); c.quadraticCurveTo(x, y - s * .14, x - ww * .55, y - s * .22); c.fill(); }
    }
  };
  function moon(c, x, y, r) {
    const g = c.createRadialGradient(x, y, r * .4, x, y, r * 3); g.addColorStop(0, 'rgba(255,245,190,.5)'); g.addColorStop(1, 'rgba(255,245,190,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * .5, y - r * .25, r * .85, 0, TAU); c.fillStyle = '#fff3c4'; c.fill('evenodd'); c.restore();
  }
  function clouds(c, w, h, t, col, alpha) {
    [[.12, .2, 1, 9], [.5, .11, .8, 6], [.72, .32, .65, 12], [.3, .42, .55, 8]].forEach(([fx, fy, s, sp], i) => {
      const x = ((fx * w + t * sp + i * 200) % (w + 300)) - 150;
      art.cloud(c, x, h * fy, s * Math.min(1.2, w / 700 + .4), alpha, col);
    });
  }

  const THEMES = {
    meadow: { sky: ['#a9e1f3', '#e9f8ee', '#fdf6df'], hill: ['#c3e6a6', '#a9dc94', '#93d087'], sun: true, cloud: '#fff', ca: .92 },
    sunset: {
      sky: ['#f4a3b8', '#ffc9a3', '#ffe9b8'], hill: ['#cbc98b', '#a9b876', '#8ea767'], cloud: '#ffd9d0', ca: .85,
      celestial(c, w, h) { const x = w * .72, y = h * .58, r = Math.min(w, h) * .09, g = c.createRadialGradient(x, y, r * .4, x, y, r * 3.5); g.addColorStop(0, 'rgba(255,214,130,.8)'); g.addColorStop(1, 'rgba(255,214,130,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.5, 0, TAU); c.fill(); c.fillStyle = '#ffd77a'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    },
    night: {
      sky: ['#1c2559', '#3a4888', '#6b70b2'], hill: ['#2f4a6b', '#28405f', '#213652'], cloud: '#6a78b8', ca: .45,
      celestial(c, w, h, t) {
        for (let i = 0; i < 40; i++) { const x = hash(i) * w, y = hash(i + 50) * h * .55, tw = .45 + Math.sin(t * 1.6 + i) * .4; c.globalAlpha = tw; art.star(c, x, y, 2 + hash(i + 9) * 4, '#fff3b0', 0); }
        c.globalAlpha = 1; moon(c, w * .82, Math.max(70, h * .16), Math.min(w, h) * .06);
      },
      fore(c, w, h, t) {
        for (let i = 0; i < 16; i++) {
          const x = (hash(i) + Math.sin(t * .3 + i) * .04) * w, y = h * (.55 + hash(i + 20) * .4) + Math.sin(t * .7 + i * 2) * 14, a = .4 + Math.sin(t * 2 + i * 3) * .4;
          const g = c.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, `rgba(255,240,140,${Math.max(0, a)})`); g.addColorStop(1, 'rgba(255,240,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 14, 0, TAU); c.fill();
        }
      }
    },
    autumn: {
      sky: ['#ffd8a0', '#ffe8c4', '#fff4dc'], hill: ['#e6bd62', '#d9a04c', '#c0853c'], sun: true, cloud: '#fff5e6', ca: .9,
      back(c, w, h) { const base = h * .72; ['#e8722f', '#f2a23a', '#d9502e', '#f5c04a', '#e8722f', '#c9402f'].forEach((col, i) => treeRound(c, w * (.06 + i * .17), base, Math.min(w, h) * (.07 + (i % 3) * .015), col)); },
      fore(c, w, h, t) {
        for (let i = 0; i < 14; i++) {
          const u = ((t * .05 + hash(i)) % 1), x = (hash(i + 7) + Math.sin(t * .8 + i) * .05) * w, y = u * h * 1.05 - 10;
          c.save(); c.translate(x, y); c.rotate(t * (.8 + hash(i)) + i); c.fillStyle = ['#e8722f', '#f2a23a', '#c9402f'][i % 3]; c.beginPath(); c.ellipse(0, 0, 9, 5, 0, 0, TAU); c.fill(); c.restore();
        }
      }
    },
    snow: {
      sky: ['#c6e2f5', '#e3f0fa', '#f7fbff'], hill: ['#ffffff', '#eef5fb', '#dfeaf5'], sun: true, cloud: '#fff', ca: .95,
      back(c, w, h) {
        const base = h * .72;
        c.fillStyle = '#cfe0f0'; c.beginPath(); c.moveTo(0, base); c.lineTo(w * .16, base - h * .22); c.lineTo(w * .3, base); c.lineTo(w * .46, base - h * .3); c.lineTo(w * .64, base); c.lineTo(w * .8, base - h * .2); c.lineTo(w, base); c.fill();
        c.fillStyle = '#fff'; for (const [x, y] of [[.16, .22], [.46, .3], [.8, .2]]) { c.beginPath(); c.moveTo(w * x, base - h * y); c.lineTo(w * x - h * .045, base - h * (y - .08)); c.lineTo(w * x + h * .045, base - h * (y - .08)); c.fill(); }
        for (let i = 0; i < 7; i++) pine(c, w * (.05 + i * .15 + hash(i) * .04), base + 6, Math.min(w, h) * (.18 + hash(i + 3) * .06), '#4f8f6a', true);
      },
      fore(c, w, h, t) { c.fillStyle = 'rgba(255,255,255,.95)'; for (let i = 0; i < 46; i++) { const sp = .05 + hash(i) * .06, y = ((t * sp + hash(i + 40)) % 1) * h, x = (hash(i + 90) + Math.sin(t * .7 + i) * .02) * w; c.beginPath(); c.arc(x, y, 2 + hash(i + 5) * 3, 0, TAU); c.fill(); } }
    },
    beach: {
      sky: ['#84d4f5', '#c4eff3', '#fdf3d0'], hill: ['#f8e6b0', '#f2da97', '#e8ca7c'], sun: true, cloud: '#fff', ca: .95,
      back(c, w, h, t) {
        const y = h * .6, g = c.createLinearGradient(0, y, 0, h * .75); g.addColorStop(0, '#6ccbe8'); g.addColorStop(1, '#3fb4d8'); c.fillStyle = g; c.fillRect(0, y, w, h * .2);
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.lineCap = 'round';
        for (let i = 0; i < 9; i++) { const x = ((i * .14 + t * .01) % 1.1) * w, yy = y + 10 + (i % 3) * h * .045; c.beginPath(); c.moveTo(x, yy); c.quadraticCurveTo(x + 12, yy - 6, x + 26, yy); c.quadraticCurveTo(x + 40, yy + 6, x + 52, yy); c.stroke(); }
        const bx = w * .3 + Math.sin(t * .3) * 6;
        c.fillStyle = '#fff'; c.beginPath(); c.moveTo(bx, y - h * .1); c.lineTo(bx + h * .06, y - 2); c.lineTo(bx, y - 2); c.fill();
        c.fillStyle = '#ff8aa3'; c.beginPath(); c.moveTo(bx - 4, y - h * .08); c.lineTo(bx - h * .045, y - 2); c.lineTo(bx - 4, y - 2); c.fill();
        c.fillStyle = '#b9805a'; c.beginPath(); c.moveTo(bx - h * .06, y - 2); c.lineTo(bx + h * .08, y - 2); c.lineTo(bx + h * .05, y + 8); c.lineTo(bx - h * .04, y + 8); c.fill();
      },
      fore(c, w, h, t) {
        c.strokeStyle = '#5a3f5e'; c.lineWidth = 2.5; c.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const x = ((t * .02 * (1 + i * .3) + i * .33) % 1.2 - .1) * w, y = h * (.12 + i * .07) + Math.sin(t + i) * 8, f = Math.sin(t * 5 + i) * 4; c.beginPath(); c.moveTo(x - 12, y - 4 + f); c.quadraticCurveTo(x - 5, y - 8, x, y); c.quadraticCurveTo(x + 5, y - 8, x + 12, y - 4 + f); c.stroke(); }
      }
    },
    farm: {
      sky: ['#a9e1f3', '#e9f8ee', '#fdf6df'], hill: ['#d6e89a', '#c2dc80', '#aed06c'], sun: true, cloud: '#fff', ca: .92,
      back(c, w, h, t) {
        const base = h * .72, u = Math.min(w, h) * .12;
        c.fillStyle = '#e8433f'; c.fillRect(w * .1, base - u * 1.5, u * 2, u * 1.5); c.beginPath(); c.moveTo(w * .1 - u * .1, base - u * 1.5); c.lineTo(w * .1 + u, base - u * 2.2); c.lineTo(w * .1 + u * 2.1, base - u * 1.5); c.fill(); c.fillStyle = '#fff'; c.fillRect(w * .1 + u * .7, base - u * .9, u * .6, u * .9);
        c.fillStyle = '#cfd6e4'; c.fillRect(w * .1 + u * 2.3, base - u * 2.1, u * .55, u * 2.1); c.beginPath(); c.arc(w * .1 + u * 2.575, base - u * 2.1, u * .275, Math.PI, 0); c.fill();
        const mx = w * .78, my = base - u * 1.6; c.fillStyle = '#f5ede0'; c.beginPath(); c.moveTo(mx - u * .35, base); c.lineTo(mx - u * .2, my); c.lineTo(mx + u * .2, my); c.lineTo(mx + u * .35, base); c.fill();
        c.save(); c.translate(mx, my); c.rotate(t * .5); c.fillStyle = '#fff'; c.strokeStyle = '#c9b8a0'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.rotate(TAU / 4); c.beginPath(); c.rect(0, -u * .09, u * 1.05, u * .18); c.fill(); c.stroke(); } c.restore();
        c.strokeStyle = '#c99a6a'; c.lineWidth = 4; for (let x = w * .3; x < w * .7; x += u * .5) { c.beginPath(); c.moveTo(x, base + 4); c.lineTo(x, base - u * .5); c.stroke(); }
        c.beginPath(); c.moveTo(w * .3, base - u * .35); c.lineTo(w * .7, base - u * .35); c.moveTo(w * .3, base - u * .15); c.lineTo(w * .7, base - u * .15); c.stroke();
      }
    },
    city: {
      sky: ['#9ec5f0', '#d5e5f6', '#fbeedf'], hill: ['#b9d1a8', '#a4c092', '#8fb07f'], sun: true, cloud: '#fff', ca: .9,
      back(c, w, h) {
        const base = h * .74;
        for (let i = 0; i < 16; i++) {
          const bw = w * (.05 + hash(i) * .04), bh = h * (.12 + hash(i + 30) * .22), x = w * (i / 15.5) - bw / 2;
          c.fillStyle = ['#a9b9d6', '#b9c5de', '#94a6c8', '#c4cde3'][i % 4]; c.fillRect(x, base - bh, bw, bh);
          c.fillStyle = 'rgba(255,240,180,.75)';
          for (let r = 0; r < Math.floor(bh / (h * .035)) - 1; r++) for (let q = 0; q < 2; q++) if (hash(i * 9 + r * 3 + q) > .35) c.fillRect(x + bw * (.2 + q * .4), base - bh + h * .02 + r * h * .035, bw * .18, h * .017);
        }
      }
    }
  };

  const IDS = Object.keys(THEMES);
  const scenery = SPG.scenery = {
    IDS, THEMES,
    // o.sun / o.clouds can be false when a game draws its own; o.weather false skips snow, leaves and fireflies
    draw(c, w, h, t, id, o = {}) {
      const th = THEMES[id] || THEMES.meadow;
      art.scene(c, w, h, t, {
        sky: th.sky, hill: th.hill, showSun: false, clouds: false,
        behind: cc => {
          if (th.celestial && o.sun !== false) th.celestial(cc, w, h, t);
          else if (th.sun && o.sun !== false) art.sun(cc, w * .86, Math.max(70, h * .17), Math.min(w, h) * .06, t);
          if (o.clouds !== false) clouds(cc, w, h, t, th.cloud, th.ca);
          if (th.back) th.back(cc, w, h, t);
        }
      });
      if (th.fore && o.weather !== false) th.fore(c, w, h, t);
    },
    // A small helper that cross-fades when the theme changes.
    fader(id) {
      return {
        id, prev: null, k: 1,
        set(next) { if (next !== this.id) { this.prev = this.id; this.id = next; this.k = 0; } },
        update(dt) { if (this.k < 1) this.k = Math.min(1, this.k + dt / 1.3); },
        draw(c, w, h, t, o) {
          if (this.k < 1 && this.prev) { scenery.draw(c, w, h, t, this.prev, o); c.save(); c.globalAlpha = this.k * this.k * (3 - 2 * this.k); scenery.draw(c, w, h, t, this.id, o); c.restore(); }
          else scenery.draw(c, w, h, t, this.id, o);
        }
      };
    }
  };
})();
