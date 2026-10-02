// Sprout Kitchen art: everything the cooking game draws (ingredients, layers, kitchen tools and appliances, finished foods).
// Shared by games/cook.js through SPG.cookArt. Everything is canvas code; sizes are given by the caller.
(() => {
  const SPG = window.SPG;
  const { art } = SPG;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = u => u * u * (3 - 2 * u);
  const rr = art.rr;
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const shade = (col, k) => { let r, g, b; if (col[0] === '#') { const n = parseInt(col.slice(1), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; } else[r, g, b] = col.match(/[\d.]+/g).map(Number); const f = v => Math.round(Math.max(0, Math.min(255, k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const circ = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const ell = (c, x, y, rx, ry, col, rot = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
  const box = (c, x, y, w, h, col, r = 0) => { c.fillStyle = col; rr(c, x, y, w, h, r); c.fill(); };
  const tri = (c, pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
  const shine = (c, x, y, rx, ry, rot = -.5, a = .4) => { c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
  const blob = (c, rx, ry, seed = 1, jag = .06, n = 28) => { c.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * TAU, k = 1 + (rnd(seed + (i % n) * 3.1) - .5) * 2 * jag; const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); };


  /* ---------------------------------------------------------------- pretty text and trims (Fredoka is the app's own font) */
  const FF = 'Fredoka, "Baloo 2", ui-rounded, system-ui, sans-serif';
  // bubbly outlined text with a soft shadow: fill/stroke colours, optional left/center alignment
  function fancyText(c, str, x, y, size, o = {}) {
    c.save(); c.font = `700 ${size}px ${FF}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.lineJoin = c.lineCap = 'round';
    if (o.shadow !== false) { c.fillStyle = 'rgba(70,30,20,.28)'; c.fillText(str, x + size * .04, y + size * .08); }
    c.lineWidth = size * (o.outline == null ? .22 : o.outline); c.strokeStyle = o.stroke || '#7a3b5a'; c.strokeText(str, x, y);
    c.fillStyle = o.fill || '#fff'; c.fillText(str, x, y); c.restore();
  }
  // lays a name out on one line, or two if it is long, to fit a width; draws it centred at (x, y)
  function fitLabel(c, str, x, y, maxW, size, o = {}) {
    c.save(); c.font = `700 ${size}px ${FF}`; const one = c.measureText(str).width; c.restore();
    if (one <= maxW) { fancyText(c, str, x, y, size, o); return; }
    const ws = str.split(' '); if (ws.length < 2 || o.oneLine || one * .85 <= maxW) { fancyText(c, str, x, y, size * Math.min(1, maxW / one), o); return; }
    let best = 1, bw = 1e9; for (let m = 1; m < ws.length; m++) { c.save(); c.font = `700 ${size}px ${FF}`; const w = Math.max(c.measureText(ws.slice(0, m).join(' ')).width, c.measureText(ws.slice(m).join(' ')).width); c.restore(); if (w < bw) { bw = w; best = m; } }
    const k = Math.min(1, maxW / bw), fs = size * k * .92;
    fancyText(c, ws.slice(0, best).join(' '), x, y - fs * .52, fs, o); fancyText(c, ws.slice(best).join(' '), x, y + fs * .52, fs, o);
  }
  // a gingham cloth (checks), clipped to a rounded rectangle
  function gingham(c, x, y, w, h, r, col, step) {
    c.save(); c.beginPath(); rr(c, x, y, w, h, r); c.clip(); c.fillStyle = '#fffaf4'; c.fillRect(x, y, w, h);
    c.globalAlpha = .38; c.fillStyle = col;
    for (let i = 0; i * step < w + step; i += 2) c.fillRect(x + i * step, y, step, h);
    for (let j = 0; j * step < h + step; j += 2) c.fillRect(x, y + j * step, w, step);
    c.restore();
  }
  // a ribbon banner (with little tails) centred at (x, y)
  function ribbon(c, x, y, w, h, col, dark, tail = h * .45) {
    c.save(); c.translate(x, y);
    c.fillStyle = dark; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * w * .5, -h * .3); c.lineTo(sg * (w * .5 + tail), -h * .3); c.lineTo(sg * (w * .5 + tail * .45), h * .08); c.lineTo(sg * (w * .5 + tail), h * .46); c.lineTo(sg * w * .5, h * .46); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(70,30,20,.22)'; rr(c, -w / 2 + 2, -h / 2 + 5, w, h, h * .22); c.fill();
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, shade(col, .22)); g.addColorStop(1, col); c.fillStyle = g; rr(c, -w / 2, -h / 2, w, h, h * .22); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; rr(c, -w / 2 + h * .08, -h / 2 + h * .07, w - h * .16, h * .22, h * .1); c.fill();
    c.restore();
  }

  /* ---------------------------------------------------------------- character cookie cutters (shapes drawn as unions of simple pieces; radius 1) */
  const PIECES = {
    star: [['star', 0, 0, 1]],
    heart: [['heart', 0, 0, 1]],
    bunny: [['e', 0, .25, .66, .6], ['e', -.32, -.62, .17, .62, -.2], ['e', .32, -.62, .17, .62, .2]],
    bear: [['e', 0, .1, .78, .72], ['e', -.6, -.52, .27, .27], ['e', .6, -.52, .27, .27]],
    cat: [['e', 0, .12, .8, .68], ['t', [-.78, -.12], [-.72, -.92], [-.18, -.5]], ['t', [.78, -.12], [.72, -.92], [.18, -.5]]],
    fox: [['t', [-.9, -.1], [0, .92], [.9, -.1]], ['e', 0, -.12, .82, .56], ['t', [-.85, -.2], [-.8, -.98], [-.25, -.5]], ['t', [.85, -.2], [.8, -.98], [.25, -.5]]],
    frog: [['e', 0, .22, .92, .62], ['e', -.5, -.45, .3, .3], ['e', .5, -.45, .3, .3]],
    panda: [['e', 0, .1, .78, .72], ['e', -.6, -.52, .27, .27], ['e', .6, -.52, .27, .27]],
    dino: [['e', 0, .3, .72, .56], ['t', [-.4, -.1], [-.28, -.75], [-.06, -.1]], ['t', [-.08, -.1], [.1, -.92], [.3, -.1]], ['t', [.26, -.1], [.46, -.7], [.6, -.05]]],
    unicorn: [['e', 0, .3, .68, .6], ['t', [-.1, -.2], [.06, -1.0], [.2, -.2]], ['t', [-.55, -.2], [-.62, -.7], [-.2, -.3]]],
    flower: [['e', 0, -.55, .3, .38], ['e', .52, -.17, .3, .38, 1.25], ['e', .32, .45, .3, .38, 2.5], ['e', -.32, .45, .3, .38, -2.5], ['e', -.52, -.17, .3, .38, -1.25], ['e', 0, 0, .45, .45]]
  };
  const SHAPES = Object.keys(PIECES);
  PIECES.round = [['e', 0, 0, .82, .74]];
  const starPath = (c, r, inner = .45) => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * inner : r; i ? c.lineTo(Math.cos(a) * k, Math.sin(a) * k) : c.moveTo(Math.cos(a) * k, Math.sin(a) * k); } c.closePath(); };
  const heartPath = (c, r) => { c.moveTo(0, r * .9); c.bezierCurveTo(-r * 1.35, r * .1, -r * .9, -r * .95, 0, -r * .35); c.bezierCurveTo(r * .9, -r * .95, r * 1.35, r * .1, 0, r * .9); c.closePath(); };
  // fill (and optionally stroke) a cutter shape: kind, radius r. Pieces are painted separately so overlaps unite.
  function shapeFill(c, kind, r, grow = 0) {
    for (const p of PIECES[kind]) {
      c.beginPath();
      if (p[0] === 'star') starPath(c, r + grow, .46);
      else if (p[0] === 'heart') heartPath(c, r + grow);
      else if (p[0] === 'e') c.ellipse(p[1] * r, p[2] * r, p[3] * r + grow, p[4] * r + grow, p[5] || 0, 0, TAU);
      else { const cx = (p[1][0] + p[2][0] + p[3][0]) / 3, cy = (p[1][1] + p[2][1] + p[3][1]) / 3; p.slice(1).forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, X = (x + dx / d * grow / r) * r, Y = (y + dy / d * grow / r) * r; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); }
      c.fill();
    }
  }
  // a baked / raw cookie of a given shape (dough-colored with a darker rim and a soft shine)
  function cookieShape(c, kind, r, col, o = {}) {
    c.save();
    c.fillStyle = shade(col, -.38); c.save(); c.translate(0, r * .09); shapeFill(c, kind, r, r * .035); c.restore();
    c.fillStyle = shade(col, -.2); shapeFill(c, kind, r, r * .03);
    c.fillStyle = col; shapeFill(c, kind, r, -r * .02);
    c.fillStyle = shade(col, .18); c.save(); c.translate(-r * .05, -r * .06); shapeFill(c, kind, r * .86, -r * .03); c.restore();
    c.fillStyle = col; shapeFill(c, kind, r * .8, -r * .05);
    if (o.speckle) { c.fillStyle = shade(col, -.25); for (let i = 0; i < 7; i++) { c.beginPath(); c.arc((rnd(i + 5) - .5) * r * 1.0, (rnd(i + 9) - .35) * r * 1.0, r * .02, 0, TAU); c.fill(); } }
    c.restore();
  }
  // the metal cutter, seen from above with a little handle ring (like a real one)
  function cutterArt(c, kind, r, t = 0) {
    c.save();
    c.lineJoin = c.lineCap = 'round';
    c.fillStyle = 'rgba(70,80,100,.22)'; c.save(); c.translate(r * .08, r * .12); shapeFill(c, kind, r, r * .06); c.restore();
    c.fillStyle = '#b9c4d4'; shapeFill(c, kind, r, r * .08);
    c.fillStyle = '#e8eef8'; shapeFill(c, kind, r, r * .03);
    c.fillStyle = 'rgba(120,150,190,.35)'; shapeFill(c, kind, r, -r * .04);
    c.fillStyle = 'rgba(230,240,255,.55)'; shapeFill(c, kind, r * .92, -r * .12);
    c.strokeStyle = '#8fa0b8'; c.lineWidth = r * .09; c.beginPath(); c.arc(0, -r * .05, r * .2, 0, TAU); c.stroke();
    c.strokeStyle = '#e8eef8'; c.lineWidth = r * .04; c.beginPath(); c.arc(0, -r * .05, r * .2, .3, 1.6); c.stroke();
    c.restore();
  }

  /* ---------------------------------------------------------------- ingredients (pictures for the trays) and flat layers for stacking */
  const BUN = '#e8a85c', BREAD = '#f3d9a4', CRUST = '#d9a45c';
  const ING = {
    bell(c, s) { c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(-s * .5, s * .3); c.quadraticCurveTo(-s * .5, -s * .5, 0, -s * .5); c.quadraticCurveTo(s * .5, -s * .5, s * .5, s * .3); c.closePath(); c.fill(); c.fillStyle = '#ffe98a'; c.beginPath(); c.ellipse(-s * .18, -s * .12, s * .1, s * .22, .3, 0, TAU); c.fill(); box(c, -s * .6, s * .28, s * 1.2, s * .12, '#e0a01e', s * .05); circ(c, 0, s * .5, s * .12, '#e0a01e'); circ(c, 0, -s * .55, s * .08, '#e0a01e'); },
    flour(c, s) { c.fillStyle = '#e8d9bf'; c.beginPath(); c.moveTo(-s * .38, s * .45); c.lineTo(-s * .42, -s * .35); c.quadraticCurveTo(0, -s * .52, s * .42, -s * .35); c.lineTo(s * .38, s * .45); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-s * .4, -s * .3); c.quadraticCurveTo(0, -s * .48, s * .4, -s * .3); c.lineTo(s * .38, s * .0); c.lineTo(-s * .38, s * .0); c.closePath(); c.fill(); box(c, -s * .24, s * .02, s * .48, s * .26, '#f4c542', s * .05); c.fillStyle = '#c98b15'; art.star(c, 0, s * .15, s * .09, '#c98b15', 0); },
    sugar(c, s) { box(c, -s * .34, -s * .28, s * .68, s * .74, 'rgba(210,235,255,.55)', s * .1); box(c, -s * .34, -s * .28, s * .68, s * .3, '#fff', s * .1); for (let i = 0; i < 14; i++) circ(c, (rnd(i) - .5) * s * .5, s * (.05 + rnd(i + 3) * .34), s * .022, '#fff'); box(c, -s * .38, -s * .38, s * .76, s * .12, '#ff9ec8', s * .05); },
    egg(c, s) { c.fillStyle = '#fff6e6'; c.beginPath(); c.moveTo(0, -s * .48); c.bezierCurveTo(s * .46, -s * .4, s * .46, s * .46, 0, s * .46); c.bezierCurveTo(-s * .46, s * .46, -s * .46, -s * .4, 0, -s * .48); c.fill(); c.strokeStyle = 'rgba(200,170,120,.5)'; c.lineWidth = s * .03; c.stroke(); c.save(); c.translate(0, s * .05); art.face(c, s * .34, {}); c.restore(); shine(c, -s * .2, -s * .22, s * .06, s * .12, -.3, .6); },
    butter(c, s) { box(c, -s * .42, -s * .2, s * .84, s * .42, '#ffe27a', s * .06); box(c, -s * .42, -s * .2, s * .84, s * .14, '#fff3b0', s * .06); box(c, -s * .42, s * .02, s * .84, s * .22, '#c0c8d4', s * .05); box(c, -s * .42, s * .02, s * .84, s * .06, '#e0e6ee', s * .03); },
    milk(c, s) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-s * .26, s * .46); c.lineTo(-s * .26, -s * .12); c.lineTo(-s * .26, -s * .12); c.lineTo(0, -s * .46); c.lineTo(s * .26, -s * .12); c.lineTo(s * .26, s * .46); c.closePath(); c.fill(); c.fillStyle = '#7fd4f5'; c.fillRect(-s * .26, s * .0, s * .52, s * .28); c.fillStyle = '#e8f6ff'; c.beginPath(); c.moveTo(0, -s * .46); c.lineTo(s * .26, -s * .12); c.lineTo(0, -s * .06); c.lineTo(-s * .26, -s * .12); c.closePath(); c.fill(); circ(c, 0, s * .14, s * .09, '#fff'); },
    chips(c, s) { for (const [x, y] of [[-.22, .12], [.18, .15], [0, -.14], [-.3, -.2], [.28, -.15], [.02, .32]]) { c.fillStyle = '#5a3a2a'; c.beginPath(); c.moveTo(x * s, (y - .14) * s); c.lineTo((x + .12) * s, (y + .1) * s); c.lineTo((x - .12) * s, (y + .1) * s); c.closePath(); c.fill(); shine(c, (x - .03) * s, (y - .02) * s, s * .025, s * .04, -.4, .35); } },
    cheese(c, s) { c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(-s * .42, s * .26); c.lineTo(s * .44, s * .1); c.lineTo(-s * .3, -s * .34); c.closePath(); c.fill(); c.fillStyle = '#ffe582'; c.beginPath(); c.moveTo(-s * .42, s * .26); c.lineTo(s * .44, s * .1); c.lineTo(s * .44, s * .24); c.lineTo(-s * .42, s * .4); c.closePath(); c.fill(); for (const [x, y, r] of [[-.12, .08, .07], [.1, .14, .05], [-.24, .2, .04]]) circ(c, x * s, y * s, r * s, '#e8b22a'); },
    lettuce(c, s) { c.fillStyle = '#7ed957'; c.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU, k = 1 + (i % 2 ? -.12 : .1); const x = Math.cos(a) * s * .44 * k, y = Math.sin(a) * s * .34 * k; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fill(); c.strokeStyle = '#a8f07a'; c.lineWidth = s * .04; c.beginPath(); c.moveTo(-s * .3, 0); c.quadraticCurveTo(0, -s * .12, s * .3, 0); c.stroke(); c.beginPath(); c.moveTo(0, -s * .22); c.lineTo(0, s * .22); c.stroke(); },
    tomato(c, s) { circ(c, 0, s * .02, s * .42, '#e8433f'); circ(c, 0, s * .02, s * .34, '#ff6b5a'); for (let i = 0; i < 5; i++) { const a = i * TAU / 5; ell(c, Math.cos(a) * s * .17, s * .02 + Math.sin(a) * s * .17, s * .07, s * .04, '#ffd0a8', a); } shine(c, -s * .18, -s * .2, s * .08, s * .04, -.7, .5); },
    onion(c, s) { for (const [r, col] of [[.4, '#e8d0f0'], [.32, '#fff'], [.24, '#e8d0f0'], [.16, '#fff']]) { c.strokeStyle = col; c.lineWidth = s * .06; c.beginPath(); c.arc(0, 0, r * s, 0, TAU); c.stroke(); } },
    pickle(c, s) { circ(c, 0, 0, s * .36, '#6fae3c'); circ(c, 0, 0, s * .28, '#a4d65a'); for (let i = 0; i < 6; i++) circ(c, Math.cos(i * 1.05) * s * .13, Math.sin(i * 1.05) * s * .13, s * .025, '#fff3b0'); },
    cucumber(c, s) { circ(c, 0, 0, s * .36, '#4f9a3a'); circ(c, 0, 0, s * .3, '#bfe8a0'); for (let i = 0; i < 8; i++) circ(c, Math.cos(i * .8) * s * .13, Math.sin(i * .8) * s * .13, s * .025, '#f0fbe0'); },
    avocado(c, s) { c.fillStyle = '#4f7a2a'; c.beginPath(); c.moveTo(0, -s * .46); c.bezierCurveTo(s * .4, -s * .2, s * .48, s * .45, 0, s * .46); c.bezierCurveTo(-s * .48, s * .45, -s * .4, -s * .2, 0, -s * .46); c.fill(); c.fillStyle = '#d6eaa0'; c.beginPath(); c.moveTo(0, -s * .38); c.bezierCurveTo(s * .32, -s * .15, s * .38, s * .36, 0, s * .38); c.bezierCurveTo(-s * .38, s * .36, -s * .32, -s * .15, 0, -s * .38); c.fill(); circ(c, 0, s * .12, s * .13, '#8a5a30'); shine(c, -s * .05, s * .08, s * .03, s * .05, -.5, .5); },
    carrot(c, s) { c.fillStyle = '#ff9d3d'; c.beginPath(); c.moveTo(-s * .12, -s * .3); c.lineTo(s * .12, -s * .3); c.lineTo(0, s * .46); c.closePath(); c.fill(); c.strokeStyle = '#e07a1a'; c.lineWidth = s * .025; for (const y of [-.1, .08, .24]) { c.beginPath(); c.moveTo(-s * .06, y * s); c.lineTo(s * .06, y * s); c.stroke(); } for (const x of [-.1, 0, .1]) { c.fillStyle = '#5fbf5a'; c.beginPath(); c.ellipse(x * s, -s * .4, s * .05, s * .12, x * 2, 0, TAU); c.fill(); } },
    ham(c, s) { c.fillStyle = '#ff9db3'; c.beginPath(); c.moveTo(-s * .44, -s * .2); c.quadraticCurveTo(-s * .2, -s * .38, 0, -s * .24); c.quadraticCurveTo(s * .22, -s * .1, s * .44, -s * .26); c.lineTo(s * .4, s * .26); c.quadraticCurveTo(s * .2, s * .38, 0, s * .26); c.quadraticCurveTo(-s * .22, s * .12, -s * .42, s * .28); c.closePath(); c.fill(); c.strokeStyle = '#ffc2d0'; c.lineWidth = s * .04; c.beginPath(); c.moveTo(-s * .3, -s * .02); c.quadraticCurveTo(0, s * .1, s * .3, -s * .06); c.stroke(); },
    turkey(c, s) { c.fillStyle = '#f0d6b0'; c.beginPath(); c.moveTo(-s * .44, -s * .2); c.quadraticCurveTo(-s * .2, -s * .36, 0, -s * .22); c.quadraticCurveTo(s * .22, -s * .08, s * .44, -s * .24); c.lineTo(s * .4, s * .26); c.quadraticCurveTo(s * .2, s * .36, 0, s * .24); c.quadraticCurveTo(-s * .22, s * .1, -s * .42, s * .28); c.closePath(); c.fill(); c.strokeStyle = '#e0bd8a'; c.lineWidth = s * .035; c.beginPath(); c.moveTo(-s * .3, 0); c.quadraticCurveTo(0, s * .1, s * .3, -s * .04); c.stroke(); },
    patty(c, s) { c.fillStyle = '#7a4a2a'; c.beginPath(); c.ellipse(0, 0, s * .44, s * .34, 0, 0, TAU); c.fill(); c.fillStyle = '#96603a'; c.beginPath(); c.ellipse(0, -s * .03, s * .4, s * .3, 0, 0, TAU); c.fill(); c.strokeStyle = '#5a3320'; c.lineWidth = s * .04; for (const x of [-.18, 0, .18]) { c.beginPath(); c.moveTo((x - .08) * s, -s * .2); c.lineTo((x + .08) * s, s * .2); c.stroke(); } },
    beanpatty(c, s) { c.fillStyle = '#8a7a4a'; c.beginPath(); c.ellipse(0, 0, s * .44, s * .34, 0, 0, TAU); c.fill(); c.fillStyle = '#a89860'; c.beginPath(); c.ellipse(0, -s * .03, s * .4, s * .3, 0, 0, TAU); c.fill(); for (let i = 0; i < 9; i++) { c.fillStyle = ['#5a3a2a', '#c9a060', '#6a9a3a'][i % 3]; c.beginPath(); c.ellipse((rnd(i) - .5) * s * .6, (rnd(i + 4) - .5) * s * .4, s * .035, s * .02, i, 0, TAU); c.fill(); } },
    chicken(c, s) { c.fillStyle = '#d98a2a'; blob(c, s * .44, s * .34, 3, .08, 18); c.save(); c.fill(); c.restore(); c.fillStyle = '#f0b24a'; c.save(); c.translate(0, -s * .03); blob(c, s * .38, s * .28, 5, .1, 18); c.fill(); c.restore(); for (let i = 0; i < 9; i++) circ(c, (rnd(i + 2) - .5) * s * .6, (rnd(i + 8) - .5) * s * .36, s * .028, '#fbd682'); },
    bunB(c, s) { c.fillStyle = shade(BUN, -.1); c.beginPath(); c.moveTo(-s * .46, -s * .1); c.lineTo(s * .46, -s * .1); c.quadraticCurveTo(s * .5, s * .28, 0, s * .3); c.quadraticCurveTo(-s * .5, s * .28, -s * .46, -s * .1); c.fill(); c.fillStyle = BUN; c.fillRect(-s * .46, -s * .14, s * .92, s * .1); },
    bunT(c, s) { c.fillStyle = BUN; c.beginPath(); c.moveTo(-s * .46, s * .16); c.bezierCurveTo(-s * .5, -s * .5, s * .5, -s * .5, s * .46, s * .16); c.closePath(); c.fill(); c.fillStyle = shade(BUN, .22); c.beginPath(); c.moveTo(-s * .36, -s * .02); c.bezierCurveTo(-s * .3, -s * .34, s * .1, -s * .38, s * .2, -s * .26); c.bezierCurveTo(0, -s * .3, -s * .26, -s * .2, -s * .36, -s * .02); c.fill(); for (const [x, y] of [[-.18, -.14], [0, -.26], [.18, -.12], [.06, -.06], [-.05, -.16]]) { c.fillStyle = '#fff3d6'; c.beginPath(); c.ellipse(x * s, y * s, s * .03, s * .018, x * 4, 0, TAU); c.fill(); } },
    bread(c, s) { c.fillStyle = CRUST; rr(c, -s * .4, -s * .36, s * .8, s * .78, s * .12); c.fill(); c.fillStyle = BREAD; rr(c, -s * .33, -s * .29, s * .66, s * .64, s * .09); c.fill(); c.beginPath(); c.fillStyle = CRUST; c.arc(-s * .22, -s * .36, s * .2, Math.PI, 0); c.arc(s * .22, -s * .36, s * .2, Math.PI, 0); c.fill(); c.fillStyle = BREAD; c.beginPath(); c.arc(-s * .22, -s * .32, s * .15, Math.PI, 0); c.arc(s * .22, -s * .32, s * .15, Math.PI, 0); c.fill(); },
    hotbun(c, s) { c.fillStyle = shade(BUN, -.1); rr(c, -s * .46, -s * .15, s * .92, s * .32, s * .16); c.fill(); c.fillStyle = BUN; rr(c, -s * .46, -s * .19, s * .92, s * .28, s * .14); c.fill(); c.fillStyle = shade(BUN, -.25); c.fillRect(-s * .4, -s * .02, s * .8, s * .05); },
    sausage(c, s) { c.fillStyle = '#c0583a'; rr(c, -s * .5, -s * .1, s, s * .2, s * .1); c.fill(); shine(c, -s * .1, -s * .05, s * .3, s * .03, 0, .4); },
    pancake(c, s) { c.fillStyle = '#d9a04a'; c.beginPath(); c.ellipse(0, s * .04, s * .44, s * .26, 0, 0, TAU); c.fill(); c.fillStyle = '#f0c36a'; c.beginPath(); c.ellipse(0, 0, s * .44, s * .26, 0, 0, TAU); c.fill(); c.fillStyle = '#e8b050'; c.beginPath(); c.ellipse(0, -s * .01, s * .34, s * .19, 0, 0, TAU); c.fill(); },
    ketchup(c, s) { c.fillStyle = '#e8433f'; rr(c, -s * .2, -s * .1, s * .4, s * .52, s * .1); c.fill(); c.fillStyle = '#ff6b5a'; rr(c, -s * .2, -s * .1, s * .16, s * .5, s * .08); c.fill(); tri(c, [[-s * .14, -s * .1], [s * .14, -s * .1], [0, -s * .3]], '#fff'); box(c, -s * .05, -s * .42, s * .1, s * .14, '#fff', s * .03); box(c, -s * .15, s * .08, s * .3, s * .22, '#fff', s * .04); circ(c, 0, s * .19, s * .06, '#e8433f'); },
    mustard(c, s) { c.fillStyle = '#f2c230'; rr(c, -s * .2, -s * .1, s * .4, s * .52, s * .1); c.fill(); c.fillStyle = '#ffe27a'; rr(c, -s * .2, -s * .1, s * .16, s * .5, s * .08); c.fill(); tri(c, [[-s * .14, -s * .1], [s * .14, -s * .1], [0, -s * .3]], '#fff'); box(c, -s * .05, -s * .42, s * .1, s * .14, '#fff', s * .03); box(c, -s * .15, s * .08, s * .3, s * .22, '#fff', s * .04); circ(c, 0, s * .19, s * .06, '#f2c230'); },
    mayo(c, s) { c.fillStyle = '#fff6dc'; rr(c, -s * .2, -s * .1, s * .4, s * .52, s * .1); c.fill(); c.fillStyle = '#fff'; rr(c, -s * .2, -s * .1, s * .16, s * .5, s * .08); c.fill(); tri(c, [[-s * .14, -s * .1], [s * .14, -s * .1], [0, -s * .3]], '#fff'); box(c, -s * .05, -s * .42, s * .1, s * .14, '#e8e0c8', s * .03); box(c, -s * .15, s * .08, s * .3, s * .22, '#7fd4f5', s * .04); },
    pbutter(c, s) { box(c, -s * .34, -s * .2, s * .68, s * .62, '#c98b4a', s * .08); box(c, -s * .38, -s * .32, s * .76, s * .16, '#e8c18a', s * .05); box(c, -s * .26, -s * .02, s * .52, s * .26, '#fff3d6', s * .05); circ(c, 0, s * .11, s * .07, '#c98b4a'); },
    jelly(c, s) { box(c, -s * .34, -s * .2, s * .68, s * .62, '#b8326a', s * .08); box(c, -s * .38, -s * .32, s * .76, s * .16, '#e8e0f0', s * .05); box(c, -s * .26, -s * .02, s * .52, s * .26, '#fff', s * .05); circ(c, 0, s * .11, s * .08, '#ff6b9d'); },
    syrup(c, s) { c.fillStyle = '#b8651a'; rr(c, -s * .22, -s * .18, s * .44, s * .62, s * .1); c.fill(); c.fillStyle = '#d98b3a'; rr(c, -s * .22, -s * .18, s * .16, s * .6, s * .08); c.fill(); box(c, -s * .12, -s * .38, s * .24, s * .24, '#f4e0a0', s * .04); box(c, -s * .18, s * .06, s * .36, s * .22, '#fff', s * .04); },
    strawberry(c, s) { c.fillStyle = '#e8433f'; c.beginPath(); c.moveTo(0, s * .46); c.bezierCurveTo(-s * .55, s * .1, -s * .4, -s * .4, 0, -s * .3); c.bezierCurveTo(s * .4, -s * .4, s * .55, s * .1, 0, s * .46); c.fill(); for (const [x, y] of [[-.15, -.05], [.12, 0], [0, .18], [-.2, .15], [.2, .16], [0, -.12]]) { c.fillStyle = '#ffe27a'; c.beginPath(); c.ellipse(x * s, y * s, s * .02, s * .03, 0, 0, TAU); c.fill(); } c.fillStyle = '#4fb86a'; for (const a of [-.9, -.3, .3, .9]) { c.save(); c.translate(0, -s * .3); c.rotate(a); c.beginPath(); c.ellipse(0, -s * .06, s * .05, s * .12, 0, 0, TAU); c.fill(); c.restore(); } },
    blueberry(c, s) { circ(c, 0, 0, s * .22, '#4a5fb8'); circ(c, 0, 0, s * .16, '#6a7fd8'); c.fillStyle = '#34408a'; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; c.lineTo(Math.cos(a) * s * .07, s * -.02 + Math.sin(a) * s * .07); } c.closePath(); c.fill(); shine(c, -s * .08, -s * .1, s * .04, s * .02, -.7, .5); },
    cherry(c, s) { c.strokeStyle = '#5a8a3a'; c.lineWidth = s * .04; c.beginPath(); c.moveTo(0, s * .1); c.quadraticCurveTo(s * .1, -s * .3, s * .22, -s * .42); c.stroke(); circ(c, 0, s * .2, s * .24, '#c8203a'); circ(c, 0, s * .2, s * .18, '#e8435a'); shine(c, -s * .08, s * .1, s * .05, s * .03, -.7, .6); },
    sprinkles(c, s) { box(c, -s * .18, -s * .4, s * .36, s * .8, '#fff', s * .08); for (let i = 0; i < 12; i++) { c.save(); c.translate((rnd(i) - .5) * s * .24, -s * .3 + rnd(i + 5) * s * .7); c.rotate(rnd(i + 8) * 3); box(c, -s * .045, -s * .015, s * .09, s * .03, ['#ff6b81', '#ffd54a', '#5cc8f2', '#7ed957', '#b58cf0'][i % 5], s * .01); c.restore(); } },
    candy(c, s) { for (const [x, y, col] of [[-.2, -.12, '#ff6b81'], [.18, -.1, '#5cc8f2'], [0, .16, '#ffd54a'], [-.24, .18, '#7ed957'], [.26, .16, '#b58cf0']]) { circ(c, x * s, y * s, s * .13, col); shine(c, (x - .04) * s, (y - .04) * s, s * .03, s * .02, -.7, .6); } },
    candle(c, s) { box(c, -s * .08, -s * .12, s * .16, s * .55, '#7fd4f5', s * .03); for (let i = 0; i < 4; i++) box(c, -s * .08, -s * .06 + i * s * .12, s * .16, s * .04, '#fff', 0); ell(c, 0, -s * .24, s * .07, s * .12, '#ff9d3d'); ell(c, 0, -s * .22, s * .035, s * .07, '#ffe27a'); },
    star(c, s) { art.star(c, 0, 0, s * .34, '#ffd54a', 0); },
    cone(c, s) { tri(c, [[-s * .26, -s * .1], [s * .26, -s * .1], [0, s * .5]], '#e8b878'); c.strokeStyle = '#c98b4a'; c.lineWidth = s * .03; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-s * .2 + i * s * .13, -s * .1); c.lineTo(-s * .06 + i * s * .06, s * .3); c.stroke(); } },
    salt(c, s) { box(c, -s * .2, -s * .12, s * .4, s * .54, 'rgba(220,235,250,.8)', s * .06); box(c, -s * .22, -s * .3, s * .44, s * .2, '#b9c4d4', s * .08); for (const x of [-.08, 0, .08]) circ(c, x * s, -s * .2, s * .02, '#6a7a90'); for (let i = 0; i < 8; i++) circ(c, (rnd(i) - .5) * s * .26, s * (.06 + rnd(i + 3) * .3), s * .018, '#fff'); },
    pepper(c, s) { box(c, -s * .2, -s * .12, s * .4, s * .54, 'rgba(120,120,130,.55)', s * .06); box(c, -s * .22, -s * .3, s * .44, s * .2, '#5a5a66', s * .08); for (const x of [-.08, 0, .08]) circ(c, x * s, -s * .2, s * .02, '#2a2a30'); for (let i = 0; i < 8; i++) circ(c, (rnd(i) - .5) * s * .26, s * (.06 + rnd(i + 3) * .3), s * .018, '#2a2a30'); },
    toast(c, s) { ING.bread(c, s); c.save(); c.globalAlpha = .38; c.fillStyle = '#a8662a'; rr(c, -s * .33, -s * .29, s * .66, s * .64, s * .09); c.fill(); c.restore(); },
    butterpat(c, s) { box(c, -s * .3, -s * .16, s * .6, s * .32, '#ffe27a', s * .05); box(c, -s * .3, -s * .16, s * .6, s * .1, '#fff3b0', s * .05); },
    batter(c, s) { drawBowl(c, 0, 0, s * .4, { fill: .8, items: [], col: BATTER, final: BATTER, stirred: 1 }, 0); },
    dough(c, s) { c.fillStyle = '#e8c88a'; blob(c, s * .42, s * .34, 7, .05, 22); c.save(); c.fill(); c.restore(); shine(c, -s * .12, -s * .1, s * .12, s * .06, -.5, .35); }
  };
  // icing tubes and scoops are made from a color
  const TUBE = (col) => (c, s) => { c.fillStyle = col; c.beginPath(); c.moveTo(-s * .22, -s * .2); c.lineTo(s * .22, -s * .2); c.lineTo(s * .3, s * .44); c.lineTo(-s * .3, s * .44); c.closePath(); c.fill(); c.fillStyle = shade(col, .35); c.beginPath(); c.moveTo(-s * .22, -s * .2); c.lineTo(-s * .06, -s * .2); c.lineTo(-s * .12, s * .44); c.lineTo(-s * .3, s * .44); c.closePath(); c.fill(); tri(c, [[-s * .22, -s * .2], [s * .22, -s * .2], [0, -s * .46]], shade(col, -.2)); circ(c, 0, -s * .46, s * .05, '#fff'); };
  const SCOOP = (col) => (c, s) => { circ(c, 0, -s * .02, s * .38, col); ell(c, 0, s * .26, s * .4, s * .12, shade(col, -.15)); shine(c, -s * .14, -s * .16, s * .09, s * .05, -.6, .5); for (let i = 0; i < 4; i++) circ(c, (rnd(i) - .5) * s * .4, (rnd(i + 3) - .5) * s * .3, s * .02, shade(col, .35)); };
  const ICING = { 'ice-pink': '#ff9ec8', 'ice-blue': '#7fd4f5', 'ice-yellow': '#ffe066', 'ice-white': '#ffffff', 'ice-choc': '#7a4a2a', 'ice-green': '#8fe070', 'ice-purple': '#c9a8ff' };
  for (const [id, col] of Object.entries(ICING)) ING[id] = TUBE(col);
  const SCOOPS = { vanilla: '#fff1c4', strawb: '#ff9ec8', choc: '#8a5a3a', mint: '#9fe6c0', blueb: '#a8b8f0' };
  for (const [id, col] of Object.entries(SCOOPS)) ING['sc-' + id] = SCOOP(col);
  const NAME = { flour: 'Flour', sugar: 'Sugar', egg: 'An egg', butter: 'Butter', milk: 'Milk', chips: 'Chocolate chips', cheese: 'Cheese', lettuce: 'Lettuce', tomato: 'Tomato', onion: 'Onion', pickle: 'Pickle', cucumber: 'Cucumber', avocado: 'Avocado', carrot: 'Carrot', ham: 'Ham', turkey: 'Turkey', patty: 'A burger patty', beanpatty: 'A veggie patty', chicken: 'A chicken patty', bunB: 'The bottom bun', bunT: 'The top bun', bread: 'Bread', hotbun: 'A hot dog bun', sausage: 'A sausage', pancake: 'Pancake', toast: 'Toast', butterpat: 'A pat of butter', batter: 'Batter', hotbunBack: 'A hot dog bun', bunny: 'Bunny', bear: 'Bear', cat: 'Kitty', fox: 'Fox', frog: 'Frog', panda: 'Panda', dino: 'Dinosaur', unicorn: 'Unicorn', flower: 'Flower', heart: 'Heart', ketchup: 'Ketchup', mustard: 'Mustard', mayo: 'Mayo', pbutter: 'Peanut butter', jelly: 'Jelly', syrup: 'Syrup', strawberry: 'A strawberry', blueberry: 'Blueberries', cherry: 'A cherry', sprinkles: 'Sprinkles', candy: 'Candy', candle: 'A candle', star: 'A star', cone: 'A cone', salt: 'Salt', pepper: 'Pepper', dough: 'Dough', 'ice-pink': 'Pink icing', 'ice-blue': 'Blue icing', 'ice-yellow': 'Yellow icing', 'ice-white': 'White icing', 'ice-choc': 'Chocolate icing', 'ice-green': 'Green icing', 'ice-purple': 'Purple icing', 'sc-vanilla': 'Vanilla ice cream', 'sc-strawb': 'Strawberry ice cream', 'sc-choc': 'Chocolate ice cream', 'sc-mint': 'Mint ice cream', 'sc-blueb': 'Blueberry ice cream' };

  // Flat layers for stacking (drawn centered, width w); the second number is the layer's height as a fraction of w.
  const LAYER = {
    bunB: [.2, (c, w) => { c.fillStyle = shade(BUN, -.12); c.beginPath(); c.moveTo(-w * .5, -w * .08); c.lineTo(w * .5, -w * .08); c.quadraticCurveTo(w * .52, w * .13, 0, w * .12); c.quadraticCurveTo(-w * .52, w * .13, -w * .5, -w * .08); c.fill(); c.fillStyle = BUN; rr(c, -w * .5, -w * .1, w, w * .09, w * .04); c.fill(); }],
    bunT: [.36, (c, w) => { c.fillStyle = BUN; c.beginPath(); c.moveTo(-w * .5, w * .02); c.bezierCurveTo(-w * .54, -w * .46, w * .54, -w * .46, w * .5, w * .02); c.closePath(); c.fill(); c.fillStyle = shade(BUN, .2); c.beginPath(); c.moveTo(-w * .38, -w * .1); c.bezierCurveTo(-w * .3, -w * .34, w * .1, -w * .36, w * .24, -w * .26); c.bezierCurveTo(0, -w * .3, -w * .28, -w * .22, -w * .38, -w * .1); c.fill(); for (const [x, y] of [[-.2, -.2], [0, -.3], [.2, -.2], [.08, -.12], [-.08, -.16], [.3, -.1], [-.3, -.1]]) { c.fillStyle = '#fff3d6'; c.beginPath(); c.ellipse(x * w, y * w, w * .03, w * .018, x * 5, 0, TAU); c.fill(); } }],
    patty: [.17, (c, w) => { c.fillStyle = '#6a3d20'; rr(c, -w * .46, -w * .07, w * .92, w * .15, w * .07); c.fill(); c.fillStyle = '#8a5530'; rr(c, -w * .46, -w * .08, w * .92, w * .1, w * .05); c.fill(); c.strokeStyle = '#4a2a18'; c.lineWidth = w * .015; for (const x of [-.25, 0, .25]) { c.beginPath(); c.moveTo((x - .04) * w, -w * .06); c.lineTo((x + .04) * w, w * .04); c.stroke(); } }],
    beanpatty: [.17, (c, w) => { c.fillStyle = '#7a6a3a'; rr(c, -w * .46, -w * .07, w * .92, w * .15, w * .07); c.fill(); c.fillStyle = '#a89860'; rr(c, -w * .46, -w * .08, w * .92, w * .1, w * .05); c.fill(); for (let i = 0; i < 12; i++) { c.fillStyle = ['#5a3a2a', '#c9a060', '#6a9a3a'][i % 3]; c.beginPath(); c.ellipse((rnd(i) - .5) * w * .84, -w * .04 + (rnd(i + 4) - .5) * w * .05, w * .02, w * .012, i, 0, TAU); c.fill(); } }],
    chicken: [.2, (c, w) => { c.fillStyle = '#d98a2a'; rr(c, -w * .46, -w * .08, w * .92, w * .17, w * .08); c.fill(); c.fillStyle = '#f0b24a'; rr(c, -w * .46, -w * .09, w * .92, w * .11, w * .05); c.fill(); for (let i = 0; i < 16; i++) { c.fillStyle = '#fbd682'; c.beginPath(); c.arc((rnd(i) - .5) * w * .85, -w * .045 + (rnd(i + 6) - .5) * w * .05, w * .016, 0, TAU); c.fill(); } }],
    cheese: [.07, (c, w) => { c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(-w * .52, -w * .03); c.lineTo(w * .52, -w * .03); c.lineTo(w * .46, w * .05); c.lineTo(w * .3, w * .1); c.lineTo(w * .16, w * .04); c.lineTo(-w * .1, w * .09); c.lineTo(-w * .3, w * .03); c.lineTo(-w * .46, w * .07); c.closePath(); c.fill(); c.fillStyle = '#ffe582'; c.fillRect(-w * .52, -w * .035, w * 1.04, w * .03); }],
    lettuce: [.1, (c, w) => { c.fillStyle = '#6fcf4a'; c.beginPath(); c.moveTo(-w * .54, 0); for (let i = 0; i <= 14; i++) c.lineTo(-w * .54 + i * w * .0771, -w * .04 + Math.sin(i * 1.7) * w * .045); for (let i = 14; i >= 0; i--) c.lineTo(-w * .54 + i * w * .0771, w * .04 + Math.sin(i * 1.7 + 1) * w * .03); c.closePath(); c.fill(); c.strokeStyle = '#a8f07a'; c.lineWidth = w * .012; c.beginPath(); c.moveTo(-w * .5, 0); for (let i = 0; i <= 14; i++) c.lineTo(-w * .54 + i * w * .0771, Math.sin(i * 1.7) * w * .03); c.stroke(); }],
    tomato: [.08, (c, w) => { for (const x of [-.28, 0, .28]) { c.fillStyle = '#e8433f'; c.beginPath(); c.ellipse(x * w, 0, w * .17, w * .045, 0, 0, TAU); c.fill(); c.fillStyle = '#ff7a6a'; c.beginPath(); c.ellipse(x * w, -w * .008, w * .13, w * .025, 0, 0, TAU); c.fill(); } }],
    onion: [.06, (c, w) => { for (const x of [-.26, 0, .26]) { c.strokeStyle = '#e8d0f0'; c.lineWidth = w * .035; c.beginPath(); c.ellipse(x * w, 0, w * .15, w * .035, 0, 0, TAU); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = w * .015; c.beginPath(); c.ellipse(x * w, 0, w * .09, w * .02, 0, 0, TAU); c.stroke(); } }],
    pickle: [.06, (c, w) => { for (const x of [-.3, -.1, .1, .3]) { c.fillStyle = '#6fae3c'; c.beginPath(); c.ellipse(x * w, 0, w * .09, w * .035, 0, 0, TAU); c.fill(); c.fillStyle = '#a4d65a'; c.beginPath(); c.ellipse(x * w, -w * .004, w * .06, w * .02, 0, 0, TAU); c.fill(); } }],
    cucumber: [.06, (c, w) => { for (const x of [-.3, -.1, .1, .3]) { c.fillStyle = '#4f9a3a'; c.beginPath(); c.ellipse(x * w, 0, w * .09, w * .035, 0, 0, TAU); c.fill(); c.fillStyle = '#bfe8a0'; c.beginPath(); c.ellipse(x * w, -w * .004, w * .065, w * .022, 0, 0, TAU); c.fill(); } }],
    avocado: [.07, (c, w) => { c.fillStyle = '#4f7a2a'; rr(c, -w * .42, -w * .03, w * .84, w * .07, w * .035); c.fill(); c.fillStyle = '#c9e08a'; rr(c, -w * .4, -w * .04, w * .8, w * .05, w * .025); c.fill(); }],
    carrot: [.06, (c, w) => { for (const x of [-.3, -.1, .1, .3]) { c.fillStyle = '#ff9d3d'; c.beginPath(); c.ellipse(x * w, 0, w * .08, w * .035, 0, 0, TAU); c.fill(); } }],
    ham: [.07, (c, w) => { c.fillStyle = '#ff9db3'; c.beginPath(); c.moveTo(-w * .5, -w * .03); c.quadraticCurveTo(-w * .25, -w * .08, 0, -w * .02); c.quadraticCurveTo(w * .25, w * .04, w * .5, -w * .04); c.lineTo(w * .47, w * .05); c.quadraticCurveTo(w * .25, w * .1, 0, w * .04); c.quadraticCurveTo(-w * .25, 0, -w * .47, w * .06); c.closePath(); c.fill(); }],
    turkey: [.07, (c, w) => { c.fillStyle = '#f0d6b0'; c.beginPath(); c.moveTo(-w * .5, -w * .03); c.quadraticCurveTo(-w * .25, -w * .08, 0, -w * .02); c.quadraticCurveTo(w * .25, w * .04, w * .5, -w * .04); c.lineTo(w * .47, w * .05); c.quadraticCurveTo(w * .25, w * .1, 0, w * .04); c.quadraticCurveTo(-w * .25, 0, -w * .47, w * .06); c.closePath(); c.fill(); }],
    bread: [.13, (c, w) => { c.fillStyle = CRUST; rr(c, -w * .5, -w * .06, w, w * .13, w * .05); c.fill(); c.fillStyle = BREAD; rr(c, -w * .47, -w * .045, w * .94, w * .095, w * .04); c.fill(); }],
    toast: [.13, (c, w) => { c.fillStyle = '#a8662a'; rr(c, -w * .5, -w * .06, w, w * .13, w * .05); c.fill(); c.fillStyle = '#d9a05a'; rr(c, -w * .47, -w * .045, w * .94, w * .095, w * .04); c.fill(); }],
    pancake: [.14, (c, w) => { c.fillStyle = '#d9a04a'; rr(c, -w * .48, -w * .06, w * .96, w * .13, w * .06); c.fill(); c.fillStyle = '#f0c36a'; rr(c, -w * .48, -w * .07, w * .96, w * .09, w * .045); c.fill(); }],
    pbutter: [.05, (c, w) => { c.fillStyle = '#c98b4a'; rr(c, -w * .46, -w * .025, w * .92, w * .06, w * .03); c.fill(); }],
    jelly: [.05, (c, w) => { c.fillStyle = '#b8326a'; rr(c, -w * .46, -w * .025, w * .92, w * .06, w * .03); c.fill(); c.fillStyle = '#e0508a'; rr(c, -w * .46, -w * .025, w * .92, w * .025, w * .012); c.fill(); }],
    butterpat: [.06, (c, w) => { c.fillStyle = '#ffe27a'; rr(c, -w * .14, -w * .03, w * .28, w * .07, w * .02); c.fill(); c.fillStyle = '#fff3b0'; c.fillRect(-w * .14, -w * .03, w * .28, w * .02); }],
    hotbunBack: [.2, (c, w) => { c.fillStyle = shade(BUN, -.1); rr(c, -w * .5, -w * .08, w, w * .2, w * .1); c.fill(); }],
    sausage: [.16, (c, w) => { c.fillStyle = '#c0583a'; rr(c, -w * .54, -w * .06, w * 1.08, w * .14, w * .07); c.fill(); shine(c, -w * .1, -w * .03, w * .3, w * .02, 0, .4); }]
  };
  // scoops stack vertically in a cup; handled separately
  const SAUCE = { ketchup: '#e8433f', mustard: '#f2c230', mayo: '#fff6dc', syrup: '#b8651a', 'ice-choc': '#5a3320' };
  const SEASON = { salt: '#ffffff', pepper: '#2a2a30' };
  const ID = x => x;

  /* ---------------------------------------------------------------- the kitchen: table, board, bowl, tools, appliances, plate */
  function drawTable(c, w, h, t) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f7d4a6'); g.addColorStop(1, '#eeb883'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const ph = h / 6.5;
    for (let i = 0, y = 0; y < h + ph; i++, y += ph) {
      c.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(150,80,30,.05)'; c.fillRect(0, y, w, ph);
      c.fillStyle = 'rgba(176,96,40,.42)'; c.fillRect(0, y, w, 2.5);
      c.strokeStyle = 'rgba(176,100,50,.17)'; c.lineWidth = 1.6; c.lineCap = 'round';
      for (let k = 0; k < 7; k++) { const gy = y + ph * (.15 + rnd(i * 9 + k) * .7), gx = rnd(i * 5 + k + 2) * w; c.beginPath(); c.moveTo(gx, gy); c.bezierCurveTo(gx + w * .12, gy - 5, gx + w * .2, gy + 6, gx + w * (.28 + rnd(k + i) * .2), gy); c.stroke(); }
      for (const kx of [rnd(i + 3) * w, rnd(i + 11) * w]) { if (rnd(i * 3 + kx) > .55) { c.strokeStyle = 'rgba(160,90,40,.2)'; c.lineWidth = 2; c.beginPath(); c.ellipse(kx, y + ph * .5, 14, 7, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(kx, y + ph * .5, 6, 3, 0, 0, TAU); c.stroke(); } }
    }
    const v = c.createRadialGradient(w / 2, h * .45, Math.min(w, h) * .3, w / 2, h * .45, Math.max(w, h) * .75); v.addColorStop(0, 'rgba(255,255,255,.12)'); v.addColorStop(1, 'rgba(120,60,20,.12)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
  }
  function drawBoard(c, x, y, bw, bh) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, -bw / 2 + 5, -bh / 2 + 10, bw, bh, bh * .08); c.fill();
    c.fillStyle = '#ffffff'; rr(c, -bw / 2, -bh / 2, bw, bh, bh * .08); c.fill();
    c.strokeStyle = '#ff9ec8'; c.lineWidth = bh * .035; rr(c, -bw / 2 + bh * .03, -bh / 2 + bh * .03, bw - bh * .06, bh - bh * .06, bh * .06); c.stroke();
    c.strokeStyle = '#d96aa8'; c.lineWidth = bh * .012; rr(c, -bw / 2 + bh * .065, -bh / 2 + bh * .065, bw - bh * .13, bh - bh * .13, bh * .05); c.stroke();
    const g = c.createLinearGradient(0, -bh / 2, 0, bh / 2); g.addColorStop(0, 'rgba(210,225,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; rr(c, -bw / 2, -bh / 2, bw, bh, bh * .08); c.fill();
    c.restore();
  }
  function drawPlate(c, x, y, r) {
    c.save(); c.translate(x, y); c.fillStyle = 'rgba(80,40,20,.2)'; c.beginPath(); c.ellipse(r * .06, r * .12, r * 1.04, r * .7, 0, 0, TAU); c.fill();
    const g = c.createLinearGradient(0, -r * .7, 0, r * .7); g.addColorStop(0, '#9fd0e0'); g.addColorStop(1, '#6fa8c0'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r, r * .68, 0, 0, TAU); c.fill();
    c.fillStyle = '#f4fbff'; c.beginPath(); c.ellipse(0, -r * .02, r * .76, r * .5, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(180,210,235,.5)'; c.beginPath(); c.ellipse(0, r * .04, r * .62, r * .38, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -r * .04, r * .62, r * .38, 0, 0, TAU); c.fill();
    shine(c, -r * .55, -r * .3, r * .22, r * .06, -.5, .5); c.restore();
  }
  function drawBowl(c, x, y, r, mix, t, stir = 0, spoonAng = 0) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(80,40,20,.2)'; c.beginPath(); c.ellipse(r * .06, r * .16, r * 1.0, r * .62, 0, 0, TAU); c.fill();
    let g = c.createLinearGradient(0, -r * .6, 0, r * .6); g.addColorStop(0, '#bcd8e4'); g.addColorStop(1, '#7fa8bc'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r, r * .66, 0, 0, TAU); c.fill();
    c.fillStyle = '#e8f4fa'; c.beginPath(); c.ellipse(0, -r * .03, r * .9, r * .58, 0, 0, TAU); c.fill();
    const ig = c.createLinearGradient(0, -r * .4, 0, r * .5); ig.addColorStop(0, '#8fb2c6'); ig.addColorStop(1, '#c4dbe8'); c.fillStyle = ig; c.beginPath(); c.ellipse(0, r * .02, r * .8, r * .5, 0, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.ellipse(0, r * .02, r * .79, r * .49, 0, 0, TAU); c.clip();
    // what is in the bowl: each ingredient adds a heap of its colour; stirring blends them to one batter
    const fill = mix.fill || 0, base = mix.col || '#f6e8c8';
    if (fill > 0) {
      const lv = r * (.5 - fill * .5);
      if (mix.stirred >= 1) { c.fillStyle = mix.final; c.beginPath(); c.ellipse(0, r * .06, r * .76, r * .46, 0, 0, TAU); c.fill(); shine(c, -r * .25, -r * .12, r * .22, r * .07, -.3, .3); }
      else {
        c.fillStyle = base; c.beginPath(); c.ellipse(0, lv * .2 + r * .1, r * .74, r * .44, 0, 0, TAU); c.fill();
        mix.items.forEach((it, i) => { const col = it.col, a = i * 2.4 + t * 0 + (mix.stirred || 0) * 6, rad = r * (.18 + .22 * (1 - (mix.stirred || 0))); c.globalAlpha = 1 - (mix.stirred || 0) * .7; c.fillStyle = col; c.beginPath(); c.ellipse(Math.cos(a) * rad, Math.sin(a) * rad * .6 + r * .05, r * (.3 - (mix.stirred || 0) * .12), r * .15, a, 0, TAU); c.fill(); }); c.globalAlpha = 1;
        if (mix.stirred > 0) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = r * .03; for (let k = 0; k < 3; k++) { c.beginPath(); for (let i = 0; i <= 24; i++) { const a = spoonAng + i * .25 + k * 2, rad = r * (.1 + i * .02 + k * .08); const px = Math.cos(a) * rad, py = Math.sin(a) * rad * .62; i ? c.lineTo(px, py + r * .05) : c.moveTo(px, py + r * .05); } c.stroke(); } }
      }
    }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = r * .03; c.beginPath(); c.ellipse(0, -r * .03, r * .9, r * .58, 0, Math.PI * 1.05, Math.PI * 1.45); c.stroke();
    c.restore();
  }
  function drawSpoon(c, x, y, s, ang = -.5) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = 'rgba(80,40,20,.2)'; c.beginPath(); c.ellipse(s * .05, s * .06, s * .13, s * .18, 0, 0, TAU); c.fill(); box(c, -s * .035, -s * .05, s * .07, s * 1.0, '#c98b4a', s * .035); ell(c, 0, -s * .1, s * .15, s * .2, '#d9a060'); ell(c, 0, -s * .1, s * .11, s * .15, '#e8bf88'); shine(c, -s * .04, -s * .17, s * .03, s * .06, 0, .5); c.restore(); }
  function drawPin(c, x, y, s, rot = 0, press = 0) {
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, -s * .62, s * .08, s * 1.3, s * .3, s * .1); c.fill();
    box(c, -s * .78, -s * .08, s * .24, s * .16, '#d63a3a', s * .08); box(c, s * .54, -s * .08, s * .24, s * .16, '#d63a3a', s * .08);
    circ(c, -s * .82, 0, s * .1, '#e8504a'); circ(c, s * .82, 0, s * .1, '#e8504a');
    const g = c.createLinearGradient(0, -s * .22, 0, s * .22); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#e6edf6'); g.addColorStop(1, '#c4d0e0'); c.fillStyle = g; rr(c, -s * .56, -s * .2, s * 1.12, s * .4, s * .12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.8)'; rr(c, -s * .5, -s * .16, s, s * .07, s * .035); c.fill(); c.restore();
  }
  function drawOven(c, x, y, s, glow = 0, doorOpen = 0, t = 0, items = null, on = true) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, -s * .5 + s * .04, -s * .5 + s * .08, s, s * .95, s * .1); c.fill();
    box(c, -s * .5, -s * .5, s, s * .95, '#d8dde6', s * .1); box(c, -s * .5, -s * .5, s, s * .16, '#b8c0cc', s * .1);
    for (const [dx, col] of [[-.3, '#ff6b81'], [-.1, '#ffd54a'], [.1, '#7fd4f5'], [.3, '#7ed957']]) { circ(c, dx * s, -s * .42, s * .045, on ? col : '#a8b0bd'); if (on) { c.globalAlpha = .35; circ(c, dx * s, -s * .42, s * .075, col); c.globalAlpha = 1; } }
    box(c, -s * .4, -s * .3, s * .8, s * .64, '#9aa4b4', s * .06);
    const g = c.createLinearGradient(0, -s * .26, 0, s * .3); g.addColorStop(0, `rgb(${60 + glow * 160},${40 + glow * 70},${30})`); g.addColorStop(1, `rgb(${90 + glow * 165},${60 + glow * 80},${40})`); c.fillStyle = g; rr(c, -s * .34, -s * .24, s * .68, s * .52, s * .05); c.fill();
    if (glow > 0) { c.globalAlpha = glow * .5; c.fillStyle = '#ffb347'; rr(c, -s * .34, -s * .24, s * .68, s * .52, s * .05); c.fill(); c.globalAlpha = 1; }
    if (items) { c.save(); c.beginPath(); rr(c, -s * .34, -s * .24, s * .68, s * .52, s * .05); c.clip(); c.translate(0, s * .08); c.scale(.62, .62); items(c); c.restore(); }
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(-s * .34, -s * .24); c.lineTo(-s * .06, -s * .24); c.lineTo(-s * .34, s * .12); c.fill();
    box(c, -s * .3, s * .3, s * .6, s * .05, '#6f7888', s * .02);
    c.restore();
  }
  function drawGrill(c, x, y, r, glow) {
    c.save(); c.translate(x, y); c.fillStyle = 'rgba(80,40,20,.2)'; c.beginPath(); c.ellipse(r * .06, r * .14, r * 1.05, r * .72, 0, 0, TAU); c.fill();
    c.fillStyle = '#3a3a44'; c.beginPath(); c.ellipse(0, 0, r, r * .68, 0, 0, TAU); c.fill(); c.fillStyle = '#4a4a56'; c.beginPath(); c.ellipse(0, -r * .02, r * .92, r * .6, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = r * .03; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * r * .2, -r * .55); c.lineTo(i * r * .2, r * .55); c.stroke(); }
    if (glow > 0) { c.globalAlpha = glow * .35; c.fillStyle = '#ff9d3d'; c.beginPath(); c.ellipse(0, -r * .02, r * .92, r * .6, 0, 0, TAU); c.fill(); c.globalAlpha = 1; }
    box(c, r * .95, -r * .08, r * .5, r * .16, '#6a4a30', r * .06); c.restore();
  }
  function drawToaster(c, x, y, s, down = 0, glow = 0, slices = []) {
    c.save(); c.translate(x, y); c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, -s * .5 + s * .05, -s * .2 + s * .1, s, s * .6, s * .14); c.fill();
    slices.forEach((sl, i) => { c.save(); c.translate((i ? 1 : -1) * s * .17, -s * (.22 - (1 - down) * .16 * (sl.up == null ? 1 : sl.up)) ); c.scale(.46, .46); LAYER_ICON(c, sl.id, s * .6); c.restore(); });
    box(c, -s * .5, -s * .2, s, s * .6, '#c8d4e4', s * .14); box(c, -s * .5, -s * .2, s, s * .16, '#e8eef8', s * .14);
    box(c, -s * .36, -s * .2, s * .26, s * .06, '#3a3a44', s * .03); box(c, s * .1, -s * .2, s * .26, s * .06, '#3a3a44', s * .03);
    if (glow) { c.globalAlpha = glow * .6; c.fillStyle = '#ff6b3d'; c.fillRect(-s * .36, -s * .2, s * .26, s * .04); c.fillRect(s * .1, -s * .2, s * .26, s * .04); c.globalAlpha = 1; }
    box(c, s * .5, -s * .05 + down * s * .18, s * .06, s * .16, '#6f7888', s * .03); circ(c, -s * .3, s * .28, s * .05, '#ff6b81'); c.restore();
  }
  const LAYER_ICON = (c, id, s) => { if (ING[id]) ING[id](c, s); };

  /* ---------------------------------------------------------------- finished foods (pieces). Each is drawn centred, about R across. */
  const DOUGH = '#e8c88a', BAKED = '#d9a05a', CHOCDOUGH = '#c89a62', CHOCBAKED = '#9a6038';
  function drawDeco(c, deco, R, o = {}) {
    if (!deco) return;
    if (deco.fill && o.shape) { c.fillStyle = deco.fill; c.save(); c.translate(0, -R * .03); shapeFill(c, o.shape, R * .8, -R * .04); c.restore(); c.fillStyle = 'rgba(255,255,255,.35)'; c.save(); c.translate(-R * .05, -R * .07); shapeFill(c, o.shape, R * .6, -R * .06); c.restore(); c.fillStyle = deco.fill; c.save(); c.translate(0, -R * .03); shapeFill(c, o.shape, R * .56, -R * .04); c.restore(); }
    for (const s of deco.strokes || []) { c.strokeStyle = s.col; c.lineWidth = R * .075; c.lineCap = c.lineJoin = 'round'; c.beginPath(); s.pts.forEach(([x, y], i) => i ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R)); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = R * .02; c.beginPath(); s.pts.forEach(([x, y], i) => i ? c.lineTo(x * R - R * .015, y * R - R * .02) : c.moveTo(x * R - R * .015, y * R - R * .02)); c.stroke(); }
    for (const d of deco.dots || []) {
      c.save(); c.translate(d.x * R, d.y * R); c.rotate(d.rot || 0);
      if (d.id === 'sprinkles') { box(c, -R * .07, -R * .02, R * .14, R * .045, d.col, R * .02); }
      else if (d.id === 'candy') { circ(c, 0, 0, R * .075, d.col); shine(c, -R * .02, -R * .02, R * .025, R * .015, -.7, .6); }
      else if (d.id === 'chips') { tri(c, [[0, -R * .08], [R * .07, R * .06], [-R * .07, R * .06]], '#5a3a2a'); }
      else if (d.id === 'star') art.star(c, 0, 0, R * .12, '#ffd54a', d.rot || 0);
      else if (d.id === 'cherry') { c.scale(R * .004, R * .004); ING.cherry(c, 60); }
      else if (d.id === 'strawberry') { c.scale(R * .0035, R * .0035); ING.strawberry(c, 60); }
      else if (d.id === 'blueberry') { c.scale(R * .0045, R * .0045); ING.blueberry(c, 60); }
      else if (d.id === 'candle') { c.rotate(-(d.rot || 0)); c.scale(R * .0035, R * .0035); ING.candle(c, 70); }
      c.restore();
    }
  }
  function drawCookie(c, p, R, t = 0) {
    cookieShape(c, p.shape, R, p.choc ? mixHex(CHOCDOUGH, CHOCBAKED, p.baked || 0) : mixHex(DOUGH, BAKED, p.baked || 0), { speckle: true });
    if (p.chips) for (let i = 0; i < 6; i++) { c.save(); c.translate((rnd(i + 21) - .5) * R * 1.0, (rnd(i + 31) - .5) * R * .9); tri(c, [[0, -R * .09], [R * .08, R * .07], [-R * .08, R * .07]], '#4a2a1a'); c.restore(); }
    drawDeco(c, p.deco, R, { shape: p.shape });
  }
  const mixHex = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  function drawCupcake(c, p, R, t = 0) {
    const liner = p.liner || '#ff9ec8';
    c.fillStyle = 'rgba(80,40,20,.18)'; c.beginPath(); c.ellipse(R * .05, R * .55, R * .6, R * .15, 0, 0, TAU); c.fill();
    c.fillStyle = shade(liner, -.1); c.beginPath(); c.moveTo(-R * .5, -R * .08); c.lineTo(R * .5, -R * .08); c.lineTo(R * .38, R * .55); c.lineTo(-R * .38, R * .55); c.closePath(); c.fill();
    c.strokeStyle = shade(liner, -.35); c.lineWidth = R * .02; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * R * .15, -R * .06); c.lineTo(i * R * .11, R * .55); c.stroke(); }
    c.fillStyle = liner; c.beginPath(); c.moveTo(-R * .5, -R * .08); c.lineTo(-R * .3, -R * .08); c.lineTo(-R * .22, R * .55); c.lineTo(-R * .38, R * .55); c.closePath(); c.fill();
    if (p.empty) return;
    const cake = p.baked >= 1 ? (p.choc ? '#8a5a38' : '#e8b868') : p.baked > 0 ? mixHex(p.choc ? '#c89a62' : '#f3dca4', p.choc ? '#8a5a38' : '#e8b868', p.baked) : (p.batter ? (p.choc ? '#a87a52' : '#f6e8c0') : '#f6e8c0');
    c.fillStyle = cake; c.beginPath(); c.moveTo(-R * .52, -R * .06); c.bezierCurveTo(-R * .6, -R * .55, R * .6, -R * .55, R * .52, -R * .06); c.closePath(); c.fill();
    if (p.frost) { const f = p.frost.col; c.fillStyle = shade(f, -.1); for (const [y, w] of [[.0, .55], [-.16, .44], [-.3, .32], [-.42, .2]]) { c.beginPath(); c.ellipse(0, y * R, w * R, R * .15, 0, 0, TAU); c.fill(); } c.fillStyle = f; for (const [y, w] of [[-.02, .52], [-.17, .41], [-.31, .29], [-.43, .17]]) { c.beginPath(); c.ellipse(0, y * R, w * R, R * .12, 0, 0, TAU); c.fill(); } c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-R * .18, -R * .2, R * .1, R * .04, -.5, 0, TAU); c.fill(); c.save(); c.translate(0, -R * .08); drawDeco(c, p.deco, R * 1.0); c.restore(); }
    else if (p.batter && !p.baked) { /* just batter in the liner */ }
  }
  function drawCake(c, p, R, t = 0) {
    const rx = R * .95, ry = R * .42, hgt = R * .62;
    c.fillStyle = 'rgba(80,40,20,.18)'; c.beginPath(); c.ellipse(R * .05, hgt * .5 + ry * .5, rx * 1.04, ry * 1.05, 0, 0, TAU); c.fill();
    const col = p.baked >= 1 ? (p.choc ? '#8a5a38' : '#e8b868') : (p.baked > 0 ? mixHex('#f3dca4', '#e8b868', p.baked) : '#f6e8c0');
    const side = p.frost ? p.frost.col : col;
    for (const [dy, hh] of [[hgt * .5, hgt * .5], [0, hgt * .5]]) { c.fillStyle = shade(side, -.12); c.beginPath(); c.moveTo(-rx, dy); c.lineTo(-rx, dy + hh); c.ellipse(0, dy + hh, rx, ry, 0, Math.PI, 0, true); c.lineTo(rx, dy); c.closePath(); c.fill(); }
    if (p.frost) { c.fillStyle = shade(col, -.08); c.fillRect(-rx, hgt * .46, rx * 2, hgt * .08); c.beginPath(); c.ellipse(0, hgt * .5, rx, ry, 0, 0, Math.PI); c.fill(); }
    c.fillStyle = shade(side, -.05); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = p.frost ? p.frost.col : col; c.beginPath(); c.ellipse(0, -hgt * .02, rx * .94, ry * .9, 0, 0, TAU); c.fill();
    if (p.frost) { c.fillStyle = shade(p.frost.col, .25); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, x = Math.cos(a) * rx * .94, y = Math.sin(a) * ry * .9 - hgt * .02; if (Math.sin(a) > -.2) { c.fillStyle = p.frost.col; c.beginPath(); c.ellipse(x, y + hgt * .05, rx * .06, hgt * (.12 + rnd(i) * .1), 0, 0, TAU); c.fill(); } } c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-rx * .3, -ry * .3, rx * .22, ry * .12, -.3, 0, TAU); c.fill(); }
    c.save(); c.translate(0, -hgt * .02); c.scale(1, .9); drawDeco(c, p.deco, R * 1.0); c.restore();
  }
  // toppings dropped on the top of a flat thing (a stack, a hot dog, a sundae): at height y, in widths of W
  function drawFlatDots(c, dots, W, y) {
    for (const d of dots || []) {
      c.save(); c.translate(d.x * W, y + d.y * W); c.rotate(d.rot || 0);
      if (d.id === 'sprinkles') box(c, -W * .035, -W * .01, W * .07, W * .022, d.col || '#ff6b81', W * .01);
      else if (d.id === 'candy') { circ(c, 0, 0, W * .035, d.col || '#5cc8f2'); shine(c, -W * .01, -W * .01, W * .012, W * .007, -.7, .6); }
      else if (d.id === 'star') art.star(c, 0, 0, W * .06, '#ffd54a', 0);
      else if (d.id === 'cherry') { c.translate(0, -W * .05); ING.cherry(c, W * .2); }
      else if (d.id === 'strawberry') { c.translate(0, -W * .03); ING.strawberry(c, W * .17); }
      else if (d.id === 'blueberry') { c.translate(0, -W * .02); ING.blueberry(c, W * .16); }
      else if (d.id === 'onion') { c.translate(0, -W * .01); ING.onion(c, W * .15); }
      else if (d.id === 'candle') { c.translate(0, -W * .04); ING.candle(c, W * .2); }
      else if (d.id === 'chips') tri(c, [[0, -W * .03], [W * .025, W * .02], [-W * .025, W * .02]], '#5a3a2a');
      c.restore();
    }
  }
  // a stack of flat layers (a burger, a sandwich, pancakes...), bottom first. Width W.
  function drawStack(c, p, W, t = 0) {
    let y = 0; const layers = p.layers || [];
    const total = layers.reduce((a, l) => a + (LAYER[l.id] ? LAYER[l.id][0] * W : 0) * (l.squash || 1), 0);
    c.fillStyle = 'rgba(80,40,20,.18)'; c.beginPath(); c.ellipse(W * .04, W * .12, W * .56, W * .09, 0, 0, TAU); c.fill();
    layers.forEach((l, i) => {
      const L = LAYER[l.id]; if (!L) return; const h = L[0] * W * (l.squash || 1), lw = W * (l.wscale || 1) * (1 + (rnd(i + (l.seed || 0)) - .5) * .06);
      const lift = (l.drop || 0) * W * .8;
      c.save(); c.translate((rnd(i + 3 + (l.seed || 0)) - .5) * W * .02, -y - h * .5 - lift + (l.id === 'bunT' ? h * .5 - lw * .02 : 0)); c.globalAlpha = 1 - (l.drop || 0) * .6;   // (the top bun's dome sits right on the layer below, no gap)
      if (l.id === 'bread' || l.id === 'toast') { c.scale(1, 1); }
      if (l.cook != null && (l.id === 'patty' || l.id === 'chicken')) { c.save(); L[1](c, lw); c.globalAlpha = .45; c.fillStyle = '#5a3320'; c.restore(); }
      L[1](c, lw);
      if (l.spread) { c.fillStyle = l.spread; rr(c, -lw * .44, -h * .6, lw * .88, h * .35, h * .15); c.fill(); }
      for (const s of l.sauce || []) { c.strokeStyle = s.col; c.lineWidth = W * .05; c.lineCap = c.lineJoin = 'round'; c.beginPath(); s.pts.forEach(([x, yy], k) => k ? c.lineTo(x * W, yy * W * 1.4 + h * .1) : c.moveTo(x * W, yy * W * 1.4 + h * .1)); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = W * .012; c.beginPath(); s.pts.forEach(([x, yy], k) => k ? c.lineTo(x * W - W * .01, yy * W * 1.4 + h * .1 - W * .012) : c.moveTo(x * W - W * .01, yy * W * 1.4 + h * .1 - W * .012)); c.stroke(); const e = s.pts[s.pts.length - 1]; if (e) { c.fillStyle = s.col; c.beginPath(); c.ellipse(e[0] * W, e[1] * W * 1.4 + h * .1 + W * .05, W * .018, W * .04, 0, 0, TAU); c.fill(); } }
      for (const s of l.season || []) { c.fillStyle = s.col; for (const d of s.pts) { c.beginPath(); c.arc(d[0] * W, d[1] * W - h * .4, W * .008, 0, TAU); c.fill(); } }
      c.restore();
      y += h * (l.id === 'bunT' ? .8 : .9);
    });
    drawFlatDots(c, p.dots, W, -y);
    return y;
  }
  function drawHotdog(c, p, W, t = 0) {
    c.fillStyle = 'rgba(80,40,20,.18)'; c.beginPath(); c.ellipse(W * .04, W * .12, W * .62, W * .09, 0, 0, TAU); c.fill();
    const hasB = (p.layers || []).some(l => l.id === 'hotbunBack'), hasS = (p.layers || []).some(l => l.id === 'sausage');
    if (hasB) { c.save(); c.translate(0, -W * .1 - ((p.layers.find(l => l.id === 'hotbunBack') || {}).drop || 0) * W * .8); LAYER.hotbunBack[1](c, W * 1.1); c.restore(); }
    if (!hasS) return;
    c.save(); c.translate(0, -W * .24 - ((p.layers.find(l => l.id === 'sausage') || {}).drop || 0) * W * .8); LAYER.sausage[1](c, W * 1.1);
    for (const s of p.sauce || []) { c.strokeStyle = s.col; c.lineWidth = W * .035; c.lineCap = c.lineJoin = 'round'; c.beginPath(); s.pts.forEach(([x, yy], k) => k ? c.lineTo(x * W, yy * W * .3 - W * .05) : c.moveTo(x * W, yy * W * .3 - W * .05)); c.stroke(); }
    for (const o of p.onions || []) { c.strokeStyle = '#f0e0f6'; c.lineWidth = W * .02; c.beginPath(); c.arc(o[0] * W, -W * .04, W * .035, 0, TAU); c.stroke(); }
    c.restore();
    drawFlatDots(c, p.dots, W, -W * .31);
    if (!(p.layers.find(l => l.id === 'sausage') || {}).drop) { c.save(); c.translate(0, -W * .1); c.fillStyle = shade(BUN, 0); rr(c, -W * .55, -W * .06, W * 1.1, W * .1, W * .05); c.fill(); c.fillStyle = shade(BUN, .1); rr(c, -W * .55, -W * .06, W * 1.1, W * .05, W * .025); c.fill(); c.restore(); }
  }
  function drawSundae(c, p, W, t = 0) {
    c.fillStyle = 'rgba(80,40,20,.18)'; c.beginPath(); c.ellipse(W * .04, W * .12, W * .5, W * .09, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(210,235,255,.65)'; c.beginPath(); c.moveTo(-W * .34, -W * .55); c.lineTo(W * .34, -W * .55); c.lineTo(W * .2, -W * .08); c.lineTo(-W * .2, -W * .08); c.closePath(); c.fill(); box(c, -W * .04, -W * .1, W * .08, W * .14, 'rgba(210,235,255,.8)', 0); ell(c, 0, W * .02, W * .22, W * .06, 'rgba(210,235,255,.85)');
    const sc = p.scoops || []; sc.forEach((s, i) => { const y = -W * (.45 + i * .27), x = (i % 2 ? .04 : -.04) * W; c.save(); c.translate(x, y); c.scale(W * .0095, W * .0095); ING['sc-' + s.id](c, 60); for (const sa of s.sauce || []) { c.strokeStyle = sa.col; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); sa.pts.forEach(([xx, yy], k) => k ? c.lineTo(xx * 60, yy * 60) : c.moveTo(xx * 60, yy * 60)); c.stroke(); } c.restore(); });
    c.fillStyle = 'rgba(210,235,255,.35)'; c.beginPath(); c.moveTo(-W * .34, -W * .55); c.lineTo(-W * .2, -W * .08); c.lineTo(-W * .1, -W * .08); c.lineTo(-W * .22, -W * .55); c.closePath(); c.fill();
    drawFlatDots(c, p.dots, W, -W * (.52 + Math.max(0, sc.length - 1) * .27));
  }
  function drawPiece(c, p, R, t = 0) {
    c.save(); c.lineJoin = c.lineCap = 'round';
    if (p.type === 'multi') { for (const [x, y, sub, k] of p.parts) { c.save(); c.translate(x * R, y * R); drawPiece(c, sub, R * k); c.restore(); } }
    else if (p.shape && p.type === 'stack') drawCharSandwich(c, p, R);
    else if (p.sliced && p.type === 'stack') drawSliced(c, p, R * 2);
    else if (p.type === 'cookie') drawCookie(c, p, R, t);
    else if (p.type === 'cupcake') drawCupcake(c, p, R, t);
    else if (p.type === 'cake') drawCake(c, p, R, t);
    else if (p.type === 'hotdog') drawHotdog(c, p, R * 2, t);
    else if (p.type === 'sundae') drawSundae(c, p, R * 2, t);
    else drawStack(c, p, R * 2, t);
    if (p.paint) drawPaintList(c, p.paint, R);
    c.restore();
  }
  // a sandwich cut with a character cutter: seen from above, with a face
  function drawCharSandwich(c, p, R) {
    cookieShape(c, p.shape, R * .9, BREAD, {});
    c.fillStyle = CRUST; c.globalAlpha = .45; c.save(); c.beginPath(); c.rect(-R * 1.2, R * .5, R * 2.4, R); c.clip(); shapeFill(c, p.shape, R * .9, -R * .03); c.restore(); c.globalAlpha = 1;
    c.save(); c.translate(0, p.shape === 'bunny' || p.shape === 'cat' || p.shape === 'fox' ? R * .3 : R * .15); art.face(c, R * .5, { mood: 'happy' }); c.restore();
    c.fillStyle = '#b8326a'; for (const [x, y] of [[-.5, .62], [.5, .62]]) circ(c, x * R * .9, y * R * .5, R * .06, '#b8326a');
  }
  // a stack cut in two, the halves sliding apart
  function drawSliced(c, p, W) {
    const k = ease(Math.min(1, p.slideT == null ? 1 : p.slideT)) * W * .07, hh = pieceHeight(p, W / 2) + W * .1;
    for (const sg of [-1, 1]) { c.save(); c.beginPath(); c.rect(sg < 0 ? -W : 0, -hh - W * .5, W, hh + W); c.clip(); c.translate(sg * k, 0); drawStack(c, p, W); c.restore(); }
  }
  // height of a piece (so it can sit on the plate)
  const pieceHeight = (p, R) => p.shape && p.type === 'stack' ? R * 1.8 : p.type === 'cookie' ? R * .8 : p.type === 'cupcake' ? R * 1.0 : p.type === 'cake' ? R * 1.1 : p.type === 'sundae' ? R * 1.9 : p.type === 'hotdog' ? R * .6 : (p.layers || []).reduce((a, l) => a + (LAYER[l.id] ? LAYER[l.id][0] : 0), 0) * R * 2 + R * .2;

  function sampleBox(p) {
    if (p.type === 'multi') { let hw = 0, a = 0, b = 0; for (const [x, y, sub, k] of p.parts) { const q = sampleBox(sub); hw = Math.max(hw, Math.abs(x) + q.hw * k); a = Math.max(a, -y + q.a * k); b = Math.max(b, y + q.b * k); } return { hw, a, b }; }
    if (p.type === 'cookie') return { hw: 1.1, a: 1.05, b: 1.15 };
    if (p.type === 'cupcake') return { hw: .62, a: .95, b: .6 };
    if (p.type === 'cake') return { hw: 1.0, a: .5, b: .95 };
    if (p.type === 'sundae') return { hw: .75, a: 2.1, b: .2 };
    if (p.type === 'hotdog') return { hw: 1.15, a: .9, b: .25 };
    if (p.shape) return { hw: 1, a: 1, b: 1 };
    return { hw: 1.05, a: pieceHeight(p, 1) + .2, b: .25 };
  }
  // a finished food centred at (x, y) and sized to fit inside bw x bh
  function drawSample(c, p, x, y, bw, bh) { const q = sampleBox(p), k = Math.min(bw / (2 * q.hw), bh / (q.a + q.b)); c.save(); c.translate(x, y + (q.a - q.b) / 2 * k); drawPiece(c, p, k); c.restore(); }
  const ICOL = { flour: '#ffffff', sugar: '#fffaf0', butter: '#ffe27a', egg: '#ffd54a', milk: '#f4fbff', chips: '#5a3a2a' };
  const BATTER = '#f3e0ae';

  const SPRINKLE = ['#ff6b81', '#ffd54a', '#5cc8f2', '#7ed957', '#b58cf0'];

  // small round pictures for the step strip and the chef's thought bubble
  function stepIcon(c, k, s, id) {
    c.save();
    if (k === 'add') (ING[id || 'flour'] || ING.flour)(c, s);
    else if (k === 'stir') { drawSpoon(c, 0, -s * .2, s * .8, -.2); c.strokeStyle = '#5cc8f2'; c.lineWidth = s * .06; c.lineCap = 'round'; c.beginPath(); c.arc(0, s * .28, s * .24, .4, 4.9); c.stroke(); tri(c, [[s * .2, s * .1], [s * .32, s * .34], [s * .08, s * .34]], '#5cc8f2'); }
    else if (k === 'roll') drawPin(c, 0, 0, s * .6, 0);
    else if (k === 'cut') { c.scale(.9, .9); cutterArt(c, id || 'star', s * .38); }
    else if (k === 'fill') { ING.dough(c, s); }
    else if (k === 'bake') { drawOven(c, 0, s * .05, s * .8, .7, 0); }
    else if (k === 'grill') { c.translate(0, s * .1); if (id === 'bread') { ING.bread(c, s * .9); } else { ell(c, 0, s * .1, s * .46, s * .3, '#3a3a44'); c.save(); c.translate(0, -s * .08); (ING[id || 'patty'] || ING.patty)(c, s * .7); c.restore(); } }
    else if (k === 'stack') { c.translate(0, s * .05); for (const [i, l] of [['bunB', .28], ['patty', .1], ['cheese', -.02], ['bunT', -.2]]) { c.save(); c.translate(0, l * s); LAYER[i][1](c, s * .8); c.restore(); } }
    else if (k === 'decorate') { for (let i = 0; i < 9; i++) { c.save(); c.translate((rnd(i) - .5) * s * .8, (rnd(i + 5) - .5) * s * .7); c.rotate(rnd(i + 9) * 3); box(c, -s * .08, -s * .03, s * .16, s * .06, SPRINKLE[i % 5], s * .02); c.restore(); } }
    else if (k === 'slice') { c.save(); c.rotate(.5); box(c, -s * .5, -s * .08, s * .6, s * .16, '#d8dde6', s * .05); box(c, s * .1, -s * .1, s * .36, s * .2, '#a87a50', s * .08); c.restore(); }
    else if (k === 'serve') { ell(c, 0, s * .12, s * .46, s * .28, '#fff'); ell(c, 0, s * .1, s * .34, s * .2, '#e8f4fa'); art.star(c, 0, -s * .12, s * .2, '#ffd54a', 0); }
    c.restore();
  }

  const pan = (c, x, y, w, h) => { c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, x - w / 2 + 4, y - h / 2 + 8, w, h, h * .22); c.fill(); box(c, x - w / 2, y - h / 2, w, h, '#8b95a6', h * .22); box(c, x - w / 2 + h * .08, y - h / 2 + h * .08, w - h * .16, h - h * .16, '#c4ccd9', h * .18); box(c, x - w / 2 + h * .14, y - h / 2 + h * .14, w - h * .28, h - h * .28, '#aab4c4', h * .14); };

  function drawSheet(g, c, p, col) {
    const rx = lerp(.17, .46, p) * g.U, ry = lerp(.15, .3, p) * g.U;
    c.save(); c.translate(g.bx, g.by); c.fillStyle = 'rgba(80,40,20,.16)'; c.translate(5, 8); blob(c, rx, ry, 7, .012, 72); c.fill(); c.translate(-5, -8);
    c.fillStyle = shade(col, -.18); blob(c, rx, ry, 7, .012, 72); c.fill(); c.fillStyle = col; c.scale(.96, .94); blob(c, rx, ry, 7, .012, 72); c.fill(); c.scale(1 / .96, 1 / .94);
    shine(c, -rx * .3, -ry * .35, rx * .22, ry * .1, -.2, .35); c.restore();
  }

  function drawCupcakeAt(c, p, r) { c.save(); c.scale(r / 38, r / 38); drawCupcake(c, p, 40); c.restore(); }

  // a pointing finger-circle that bounces: "touch here"
  function drawTapHint(c, x, y, r, t) { const b = Math.abs(Math.sin(t * 4)) * r * .5; c.save(); c.translate(x, y - r * 1.1 - b); c.lineJoin = 'round'; c.fillStyle = '#ff6b9d'; c.strokeStyle = '#fff'; c.lineWidth = r * .16; c.beginPath(); c.moveTo(-r * .38, -r * .55); c.lineTo(r * .38, -r * .55); c.lineTo(r * .38, -r * .05); c.lineTo(r * .78, -r * .05); c.lineTo(0, r * .7); c.lineTo(-r * .78, -r * .05); c.lineTo(-r * .38, -r * .05); c.closePath(); c.stroke(); c.fill(); c.restore(); }
  function drawPieceC(c, p, R) { drawPiece(c, p, R); }

  function drawUnit(c, u, s) {
    const k = u.cook || 0;
    if (u.id === 'pancake') { ell(c, 0, s * .02, s * .38, s * .3, k < .5 ? '#f0d9a0' : '#d9a04a'); ell(c, 0, 0, s * .38, s * .3, k < .5 ? '#fff1c4' : lerpHex('#fff1c4', '#f0c36a', (k - .5) * 2)); if (k > .12 && k < .55) for (let i = 0; i < 6; i++) circ(c, (rnd(i + 3) - .5) * s * .5, (rnd(i + 9) - .5) * s * .3, s * .018 + k * s * .02, 'rgba(255,255,255,.7)'); return; }
    (ING[u.id] || ING.patty)(c, s * (u.id === 'sausage' ? 1.2 : 1));
    if (k < 1) { c.save(); c.globalAlpha = .45 * (1 - k); c.fillStyle = '#ffb4a0'; if (u.id === 'sausage') { rr(c, -s * .6, -s * .12, s * 1.2, s * .24, s * .12); c.fill(); } else { c.beginPath(); c.ellipse(0, 0, s * .44, s * .34, 0, 0, TAU); c.fill(); } c.restore(); }
    else if (u.id !== 'bread') { c.save(); c.globalAlpha = .18; c.strokeStyle = '#2a1a10'; c.lineWidth = s * .035; for (const x of [-.2, 0, .2]) { c.beginPath(); c.moveTo(x * s - s * .05, -s * .15); c.lineTo(x * s + s * .05, s * .15); c.stroke(); } c.restore(); }
  }
  const lerpHex = (a, b, k) => mixHex(a, b, clamp(k, 0, 1));

  // ---- sauces and seasoning are painted wherever they are squirted: on the food or on the plate. A mark is stored in the food's own units
  // (so it moves with the food and gets bitten away with it), or in plate units for the plate. { col, kind, pts: [{ x, y, w }] }
  const saucePts = (c, st, k) => {
    const pts = st.pts; if (!pts.length) return;
    const dark = shade(st.col, -.28), lite = shade(st.col, st.col === '#fff6dc' ? -.05 : .45);
    const pass = (col, f, dx, dy, a) => { c.globalAlpha = a; c.strokeStyle = col; c.fillStyle = col; for (let i = 0; i < pts.length; i++) { const q = pts[i], w = Math.max(.5, q.w * k * f); c.beginPath(); c.arc(q.x * k + dx * w, q.y * k + dy * w, w / 2, 0, TAU); c.fill(); if (i) { const o = pts[i - 1]; c.lineWidth = w; c.beginPath(); c.moveTo(o.x * k + dx * w, o.y * k + dy * w); c.lineTo(q.x * k + dx * w, q.y * k + dy * w); c.stroke(); } } c.globalAlpha = 1; };
    c.lineCap = c.lineJoin = 'round';
    pass('rgba(60,20,10,1)', 1.12, .06, .14, .16); pass(dark, 1.06, 0, .05, 1); pass(st.col, 1, 0, 0, 1); pass(lite, .3, -.18, -.2, st.kind === 'sauce' ? .65 : .5);
  };
  const grainPts = (c, st, k) => { c.fillStyle = st.col; for (const q of st.pts) { c.beginPath(); c.arc(q.x * k, q.y * k, Math.max(.8, q.w * k), 0, TAU); c.fill(); } };
  function drawPaintList(c, list, k) { if (!list) return; c.save(); for (const st of list) (st.kind === 'grain' ? grainPts : saucePts)(c, st, k); c.restore(); }

  const drawShadowDisc = (c, x, y, r) => { c.fillStyle = 'rgba(80,40,20,.14)'; c.beginPath(); c.ellipse(x + r * .06, y, r * 1.0, r * .32, 0, 0, TAU); c.fill(); };
  // piece centred at (x, y); tall pieces are drawn from their base so the middle lands on the point
  function drawPieceAt(c, p, x, y, R) { c.save(); c.translate(x, y + pieceBase(p, R)); drawPiece(c, p, R); c.restore(); }
  const pieceBase = (p, R) => !p.shape && ['stack', 'hotdog', 'sundae'].includes(p.type) ? pieceHeight(p, R) * .5 : 0;

  function drawKnife(c, x, y, s) { c.save(); c.translate(x, y); c.rotate(.18); c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, -s * .04 + 4, -s * .06 + 6, s * .09, s * .5, s * .03); c.fill(); c.fillStyle = '#e8eef8'; c.beginPath(); c.moveTo(-s * .045, -s * .02); c.lineTo(s * .045, -s * .02); c.lineTo(s * .045, s * .4); c.quadraticCurveTo(0, s * .46, -s * .045, s * .4); c.closePath(); c.fill(); c.fillStyle = '#b9c4d4'; c.fillRect(-s * .045, -s * .02, s * .02, s * .42); box(c, -s * .055, -s * .24, s * .11, s * .24, '#d63a3a', s * .04); c.restore(); }

  // draws a piece with the bites taken out of it
  function drawBittenAt(g, c, p, x, y, R) {
    if (!p.bites || !p.bites.length) { drawPieceAt(c, p, x, y, R); return; }
    const dpr = g.dpr || 1, S = Math.ceil(R * 4 * dpr), oc = g.oc; if (oc.width !== S) { oc.width = S; oc.height = S; }
    const o = oc.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, S, S); o.setTransform(dpr, 0, 0, dpr, S / 2, S / 2);
    o.save(); o.translate(0, pieceBase(p, R)); drawPiece(o, p, R); o.restore();
    o.globalCompositeOperation = 'destination-out'; o.fillStyle = '#000'; for (const b of p.bites) { o.beginPath(); o.arc(b.x, b.y, b.r, 0, TAU); o.fill(); } o.globalCompositeOperation = 'source-over';
    c.drawImage(oc, x - S / 2 / dpr, y - S / 2 / dpr, S / dpr, S / dpr);
  }

  SPG.cookArt = { clamp, lerp, ease, rr, rnd, shade, circ, ell, box, tri, shine, blob, FF, fancyText, fitLabel, gingham, ribbon, PIECES, SHAPES, starPath, heartPath, shapeFill, cookieShape, cutterArt, BUN, BREAD, CRUST, ING, TUBE, SCOOP, ICING, SCOOPS, NAME, LAYER, SAUCE, SEASON, drawTable, drawBoard, drawPlate, drawBowl, drawSpoon, drawPin, drawOven, drawGrill, drawToaster, LAYER_ICON, DOUGH, BAKED, CHOCDOUGH, CHOCBAKED, drawDeco, drawCookie, mixHex, drawCupcake, drawCake, drawFlatDots, drawStack, drawHotdog, drawSundae, drawPiece, drawCharSandwich, drawSliced, pieceHeight, sampleBox, drawSample, ICOL, BATTER, SPRINKLE, stepIcon, pan, drawSheet, drawCupcakeAt, drawTapHint, drawPieceC, drawUnit, lerpHex, saucePts, grainPts, drawPaintList, drawShadowDisc, drawPieceAt, pieceBase, drawKnife, drawBittenAt, TAU };
})();
