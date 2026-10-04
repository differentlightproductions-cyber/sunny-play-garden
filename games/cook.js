// Sprout Kitchen: a step-by-step cooking game. Pick Sweets, Sandwiches or Burgers, pick one of six recipes, and cook it with big simple
// touches: drop in the ingredients, stir, roll the dough, press a character cookie cutter, bake, spread, stack, grill, add sauces and
// sprinkles, and then serve it and take bites. The screen moves on by itself when a step is finished, a little chef shows what to do
// next, and every instruction is spoken. Nothing can go wrong: a wrong ingredient just wiggles and the right one glows.
(() => {
  const SPG = window.SPG;
  const { art, sfx, voice, store } = SPG;
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
  function shapeFill(c, kind, r, grow = 0, pathOnly = false) {
    if (pathOnly) c.beginPath();
    for (const p of PIECES[kind]) {
      if (!pathOnly) c.beginPath();
      if (p[0] === 'star') starPath(c, r + grow, .46);
      else if (p[0] === 'heart') heartPath(c, r + grow);
      else if (p[0] === 'e') { if (pathOnly) c.moveTo(p[1] * r + (p[3] * r + grow) * Math.cos(p[5] || 0), p[2] * r + (p[3] * r + grow) * Math.sin(p[5] || 0)); c.ellipse(p[1] * r, p[2] * r, p[3] * r + grow, p[4] * r + grow, p[5] || 0, 0, TAU); }
      else { const cx = (p[1][0] + p[2][0] + p[3][0]) / 3, cy = (p[1][1] + p[2][1] + p[3][1]) / 3; p.slice(1).forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, X = (x + dx / d * grow / r) * r, Y = (y + dy / d * grow / r) * r; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); }
      if (!pathOnly) c.fill();
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
  function drawOven(c, x, y, s, glow = 0, doorOpen = 0, t = 0, items = null) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, -s * .5 + s * .04, -s * .5 + s * .08, s, s * .95, s * .1); c.fill();
    box(c, -s * .5, -s * .5, s, s * .95, '#d8dde6', s * .1); box(c, -s * .5, -s * .5, s, s * .16, '#b8c0cc', s * .1);
    for (const [dx, col] of [[-.3, '#ff6b81'], [-.1, '#ffd54a'], [.1, '#7fd4f5'], [.3, '#7ed957']]) circ(c, dx * s, -s * .42, s * .045, col);
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
  /* ---------------------------------------------------------------- icing: glossy, shiny and sparkly */
  const clock = () => performance.now() / 1000;
  // a four-point twinkle
  function twinkle(c, x, y, r, col = '#fff') {
    c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, k = i % 2 ? r * .26 : r; i ? c.lineTo(Math.cos(a) * k, Math.sin(a) * k) : c.moveTo(Math.cos(a) * k, Math.sin(a) * k); }
    c.closePath(); c.fill(); c.globalAlpha *= .35; c.beginPath(); c.arc(0, 0, r * .55, 0, TAU); c.fill(); c.restore();
  }
  // tiny glitter specks (call inside a clip) and a few twinkling stars, laid out by a seed
  function glitterField(c, seed, w, h, n, R, col) {
    const t = clock();
    for (let i = 0; i < n; i++) { const x = (rnd(seed + i * 3.1) - .5) * w, y = (rnd(seed + i * 5.7 + 2) - .5) * h; c.globalAlpha = .55 + .45 * Math.sin(t * 3 + i * 1.9); c.fillStyle = i % 3 ? '#fff' : shade(col, .65); c.beginPath(); c.arc(x, y, R * (.011 + rnd(i + seed) * .012), 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const x = (rnd(seed + i * 11.3 + 40) - .5) * w * .9, y = (rnd(seed + i * 7.9 + 60) - .5) * h * .9, k = .5 + .5 * Math.sin(t * 3.2 + i * 2.3); c.globalAlpha = .35 + .65 * k; twinkle(c, x, y, R * (.045 + .05 * k), '#fff'); }
    c.globalAlpha = 1;
  }
  // a glossy rounded dollop of icing (used for borders)
  function dollop(c, x, y, r, col) {
    const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r * 1.1); g.addColorStop(0, shade(col, .55)); g.addColorStop(.45, shade(col, .08)); g.addColorStop(1, shade(col, -.2));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); shine(c, x - r * .3, y - r * .38, r * .3, r * .16, -.5, .85);
  }
  // piped swirl frosting that sits on the top of a cupcake: a scalloped skirt on the muffin, four twisting tiers, a curled tip
  function drawFrostSwirl(c, R, col, grow = 1) {
    const g = ease(clamp(grow, 0, 1)), t = clock();
    c.save(); c.translate(0, -R * .1); c.scale(1, .3 + .7 * g); c.globalAlpha = Math.min(1, grow * 3 + .2);
    const lite = shade(col, .45), dark = shade(col, -.2), deep = shade(col, -.34);
    // the skirt of frosting resting on the muffin top
    for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? dark : deep; c.beginPath(); c.arc(-R * .42 + i * R * .14, R * .01, R * .105, 0, TAU); c.fill(); }
    for (let i = 0; i < 7; i++) dollop(c, -R * .42 + i * R * .14, -R * .015, R * .1, col);
    const tiers = [[-.17, .46, .12], [-.33, .4, .115], [-.48, .31, .105], [-.62, .21, .095]];
    tiers.forEach(([y, hw, h], i) => {
      c.save(); c.translate(0, y * R); c.rotate((i % 2 ? .07 : -.07)); const w = hw * R, hh = h * R * 1.25;
      const gr = c.createLinearGradient(0, -hh, 0, hh); gr.addColorStop(0, lite); gr.addColorStop(.35, col); gr.addColorStop(1, dark);
      c.fillStyle = gr; rr(c, -w, -hh, w * 2, hh * 2, hh); c.fill();
      c.strokeStyle = deep; c.globalAlpha = .45; c.lineWidth = R * .014; c.beginPath(); c.moveTo(-w * .9, hh * .55); c.quadraticCurveTo(0, hh * 1.05, w * .9, hh * .5); c.stroke(); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = R * .02; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * .8, -hh * .1); c.quadraticCurveTo(-w * .2, -hh * .75, w * .55, -hh * .55); c.stroke();
      shine(c, -w * .5, -hh * .45, w * .22, hh * .22, -.2, .8);
      c.restore();
    });
    // a soft round curl on top
    const tg = c.createRadialGradient(-R * .03, -R * .84, R * .02, 0, -R * .78, R * .2); tg.addColorStop(0, lite); tg.addColorStop(.5, col); tg.addColorStop(1, dark);
    c.fillStyle = tg; c.beginPath(); c.moveTo(-R * .14, -R * .66); c.bezierCurveTo(-R * .16, -R * .8, -R * .05, -R * .92, R * .08, -R * .9); c.bezierCurveTo(R * .17, -R * .84, R * .1, -R * .74, R * .14, -R * .66); c.closePath(); c.fill();
    shine(c, -R * .05, -R * .8, R * .035, R * .07, .3, .9);
    // sparkle over the whole swirl
    c.save(); c.translate(0, -R * .45); glitterField(c, 17, R * .8, R * .95, 22, R * 1.5, col); c.restore();
    c.restore();
  }
  // frosting on top of a round cake: a glossy top, a ring of dollops, drips down the side, and sparkle
  function drawFrostTop(c, rx, ry, hgt, col) {
    const lite = shade(col, .42), dark = shade(col, -.2);
    // drips down the front of the side
    for (let i = 0; i < 11; i++) { const a = .12 * Math.PI + i / 10 * .76 * Math.PI, x = Math.cos(a) * rx * .93, len = hgt * (.28 + rnd(i * 2 + 1) * .5), y0 = Math.sin(a) * ry * .93, w = rx * .055; c.fillStyle = dark; c.beginPath(); c.moveTo(x - w, y0); c.lineTo(x - w, y0 + len); c.arc(x, y0 + len, w, Math.PI, 0, true); c.lineTo(x + w, y0); c.closePath(); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(x - w * .8, y0); c.lineTo(x - w * .8, y0 + len); c.arc(x - w * .1, y0 + len, w * .75, Math.PI, 0, true); c.lineTo(x + w * .6, y0); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, x - w * .55, y0 + len * .1, w * .28, len * .6, w * .14); c.fill(); }
    // glossy top
    const g = c.createRadialGradient(-rx * .3, -ry * .3, ry * .1, 0, 0, rx);
    g.addColorStop(0, lite); g.addColorStop(.55, col); g.addColorStop(1, dark);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, rx * .96, ry * .92, 0, 0, TAU); c.fill();
    // ring of dollops (back ones first so the front ones overlap)
    const n = 16; const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.sin(a / n * TAU) - Math.sin(b / n * TAU));
    for (const i of order) { const a = i / n * TAU; dollop(c, Math.cos(a) * rx * .85, Math.sin(a) * ry * .8, rx * .075, col); }
    // sparkle on the top (kept inside the ellipse)
    c.save(); c.beginPath(); c.ellipse(0, 0, rx * .76, ry * .7, 0, 0, TAU); c.clip(); glitterField(c, 29, rx * 1.5, ry * 1.4, 26, rx, col); c.restore();
    shine(c, -rx * .38, -ry * .38, rx * .2, ry * .1, -.3, .7);
  }
  // clip to a cookie shape and fill it with glossy, sparkly icing
  function drawCookieIcing(c, kind, R, col, glitter = true) {
    c.save(); c.fillStyle = shade(col, -.28); shapeFill(c, kind, R * .8, R * .018);
    shapeFill(c, kind, R * .8, 0, true); c.clip();
    const g = c.createLinearGradient(-R * .6, -R * .8, R * .6, R * .8); g.addColorStop(0, shade(col, .4)); g.addColorStop(.5, col); g.addColorStop(1, shade(col, -.18)); c.fillStyle = g; c.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
    c.fillStyle = 'rgba(255,255,255,.32)'; c.save(); c.translate(-R * .06, -R * .1); shapeFill(c, kind, R * .6, 0); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = R * .03; c.lineCap = 'round'; c.beginPath(); c.moveTo(-R * .5, -R * .25); c.quadraticCurveTo(-R * .4, -R * .55, -R * .1, -R * .6); c.stroke();
    if (glitter) glitterField(c, 7 + kind.length, R * 1.3, R * 1.3, 24, R, col);
    c.restore();
  }
  // piped icing lines: a dark edge, the bright body, a shine, and sparkle along the line
  function drawPiped(c, s, R) {
    c.lineCap = c.lineJoin = 'round';
    for (const [w, col] of [[.105, shade(s.col, -.3)], [.08, s.col]]) { c.strokeStyle = col; c.lineWidth = R * w; c.beginPath(); s.pts.forEach(([x, y], i) => i ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R)); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = R * .022; c.beginPath(); s.pts.forEach(([x, y], i) => i ? c.lineTo(x * R - R * .015, y * R - R * .02) : c.moveTo(x * R - R * .015, y * R - R * .02)); c.stroke();
    const t = clock(); s.pts.forEach(([x, y], i) => { if (i % 4 === 1) { c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 3 + i)); twinkle(c, x * R, y * R, R * .05, '#fff'); } }); c.globalAlpha = 1;
  }
  function drawDeco(c, deco, R, o = {}) {
    if (!deco) return;
    if (deco.fill && o.shape) drawCookieIcing(c, o.shape, R, deco.fill);
    for (const st of deco.strokes || []) drawPiped(c, st, R);
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
    if (p.frost) { drawFrostSwirl(c, R, p.frost.col, p.frost.t == null ? 1 : p.frost.t); c.save(); c.translate(0, -R * .3); drawDeco(c, p.deco, R * 1.0); c.restore(); }
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
    if (p.frost) { c.save(); c.translate(0, -hgt * .02); drawFrostTop(c, rx, ry, hgt, p.frost.col); c.restore(); } else { c.fillStyle = col; c.beginPath(); c.ellipse(0, -hgt * .02, rx * .94, ry * .9, 0, 0, TAU); c.fill(); }
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
      c.save(); c.translate((rnd(i + 3 + (l.seed || 0)) - .5) * W * .02, -y - h * .5 - lift); c.globalAlpha = 1 - (l.drop || 0) * .6;
      if (l.id === 'bread' || l.id === 'toast') { c.scale(1, 1); }
      if (l.cook != null && (l.id === 'patty' || l.id === 'chicken')) { c.save(); L[1](c, lw); c.globalAlpha = .45; c.fillStyle = '#5a3320'; c.restore(); }
      L[1](c, lw);
      if (l.spread) { c.fillStyle = l.spread; rr(c, -lw * .44, -h * .6, lw * .88, h * .35, h * .15); c.fill(); }
      for (const s of l.sauce || []) { c.strokeStyle = s.col; c.lineWidth = W * .05; c.lineCap = c.lineJoin = 'round'; c.beginPath(); s.pts.forEach(([x, yy], k) => k ? c.lineTo(x * W, yy * W * 1.4 + h * .1) : c.moveTo(x * W, yy * W * 1.4 + h * .1)); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = W * .012; c.beginPath(); s.pts.forEach(([x, yy], k) => k ? c.lineTo(x * W - W * .01, yy * W * 1.4 + h * .1 - W * .012) : c.moveTo(x * W - W * .01, yy * W * 1.4 + h * .1 - W * .012)); c.stroke(); const e = s.pts[s.pts.length - 1]; if (e) { c.fillStyle = s.col; c.beginPath(); c.ellipse(e[0] * W, e[1] * W * 1.4 + h * .1 + W * .05, W * .018, W * .04, 0, 0, TAU); c.fill(); } }
      for (const s of l.season || []) { c.fillStyle = s.col; for (const d of s.pts) { c.beginPath(); c.arc(d[0] * W, d[1] * W - h * .4, W * .008, 0, TAU); c.fill(); } }
      c.restore();
      y += h * (l.id === 'bunT' ? .78 : .9);
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

  /* ---------------------------------------------------------------- recipes (three kinds, six each) */
  // steps: add (drop ingredients in the bowl) stir roll cut (character cutters) fill (batter/dough onto a tray) bake grill (grill, pan or toaster)
  //        stack (guided layers) decorate (icing, sprinkles, sauces, seasoning) slice serve (and take bites)
  const CATS = [{ id: 'sweets', name: 'Sweets' }, { id: 'sandwiches', name: 'Sandwiches' }, { id: 'burgers', name: 'Burgers' }];
  const ICOL = { flour: '#ffffff', sugar: '#fffaf0', butter: '#ffe27a', egg: '#ffd54a', milk: '#f4fbff', chips: '#5a3a2a' };
  const BATTER = '#f3e0ae';
  const sauceLine = (col, a = -.3, b = .3, y = 0) => ({ col, pts: [[a, y], [a * .5, y - .03], [0, y + .03], [b * .5, y - .03], [b, y]] });
  const stackOf = ids => ({ type: 'stack', layers: ids.map(id => ({ id })) });
  const RECIPES = [
    { id: 'sugar', cat: 0, name: 'Sugar cookies', ptype: 'cookie', steps: [
      { k: 'add', ids: ['flour', 'sugar', 'butter', 'egg'] }, { k: 'stir' }, { k: 'roll' }, { k: 'cut', n: 3 }, { k: 'bake' },
      { k: 'decorate', tools: ['ice-pink', 'ice-blue', 'ice-yellow', 'sprinkles', 'candy', 'star'], need: 4 }, { k: 'serve' }],
      sample: { type: 'multi', parts: [[-.6, .1, { type: 'cookie', shape: 'star', baked: 1, deco: { fill: '#ff9ec8', dots: [{ id: 'sprinkles', x: -.2, y: -.1, col: '#fff', rot: .5 }, { id: 'sprinkles', x: .2, y: .1, col: '#ffd54a', rot: -.5 }] } }, .5], [.55, -.05, { type: 'cookie', shape: 'bear', baked: 1, deco: { fill: '#7fd4f5', dots: [{ id: 'candy', x: 0, y: .25, col: '#ff6b81' }] } }, .5], [0, .55, { type: 'cookie', shape: 'heart', baked: 1, deco: { fill: '#ffe066', dots: [{ id: 'candy', x: -.1, y: -.1, col: '#5cc8f2' }] } }, .5]] } },
    { id: 'chip', cat: 0, name: 'Chocolate chip cookies', ptype: 'cookie', steps: [
      { k: 'add', ids: ['flour', 'sugar', 'butter', 'chips'] }, { k: 'stir' }, { k: 'fill', what: 'dough', lay: 'sheet', n: 4 }, { k: 'bake' }, { k: 'serve' }],
      sample: { type: 'multi', parts: [[-.5, 0, { type: 'cookie', shape: 'round', baked: 1, chips: true }, .62], [.5, -.1, { type: 'cookie', shape: 'round', baked: 1, chips: true }, .62], [0, .55, { type: 'cookie', shape: 'round', baked: 1, chips: true }, .62]] } },
    { id: 'cupcake', cat: 0, name: 'Cupcakes', ptype: 'cupcake', steps: [
      { k: 'add', ids: ['flour', 'sugar', 'egg', 'milk'] }, { k: 'stir' }, { k: 'fill', what: 'batter', lay: 'cups', n: 3 }, { k: 'bake' },
      { k: 'decorate', tools: ['ice-pink', 'ice-blue', 'ice-white', 'ice-purple'], mode: 'frost', need: 3 },
      { k: 'decorate', tools: ['sprinkles', 'cherry', 'candy', 'star', 'strawberry'], need: 3 }, { k: 'serve' }],
      sample: { type: 'cupcake', baked: 1, liner: '#ff9ec8', frost: { col: '#ffd0e4' }, deco: { dots: [{ id: 'cherry', x: 0, y: -.55 }, { id: 'sprinkles', x: -.2, y: -.25, col: '#5cc8f2', rot: .4 }, { id: 'sprinkles', x: .22, y: -.2, col: '#ffd54a', rot: -.6 }] } } },
    { id: 'cake', cat: 0, name: 'Birthday cake', ptype: 'cake', steps: [
      { k: 'add', ids: ['flour', 'sugar', 'egg', 'butter', 'milk'] }, { k: 'stir' }, { k: 'fill', what: 'batter', lay: 'pan', n: 1 }, { k: 'bake' },
      { k: 'decorate', tools: ['ice-pink', 'ice-blue', 'ice-yellow', 'ice-choc'], mode: 'frost', need: 1 },
      { k: 'decorate', tools: ['candle', 'strawberry', 'sprinkles', 'candy', 'star'], need: 4 }, { k: 'serve' }],
      sample: { type: 'cake', baked: 1, frost: { col: '#ffd0e4' }, deco: { dots: [{ id: 'candle', x: 0, y: -.1 }, { id: 'candle', x: -.4, y: 0 }, { id: 'candle', x: .4, y: 0 }, { id: 'strawberry', x: -.2, y: .12 }, { id: 'strawberry', x: .2, y: .12 }] } } },
    { id: 'pancake', cat: 0, name: 'Pancakes', ptype: 'stack', steps: [
      { k: 'add', ids: ['flour', 'egg', 'milk', 'butter'] }, { k: 'stir' }, { k: 'fill', what: 'batter', lay: 'griddle', n: 3 },
      { k: 'grill', id: 'pancake', device: 'pan', existing: true }, { k: 'stack', order: ['pancake', 'pancake', 'pancake', 'butterpat'] },
      { k: 'decorate', tools: ['syrup', 'strawberry', 'blueberry', 'sprinkles'], need: 3 }, { k: 'serve' }],
      sample: { type: 'stack', layers: [{ id: 'pancake' }, { id: 'pancake' }, { id: 'pancake', sauce: [sauceLine('#b8651a', -.3, .3, -.02)] }, { id: 'butterpat' }] } },
    { id: 'sundae', cat: 0, name: 'Ice cream sundae', ptype: 'sundae', steps: [
      { k: 'stack', order: ['sc-vanilla', 'sc-strawb', 'sc-choc'] },
      { k: 'decorate', tools: ['ice-choc', 'syrup', 'sprinkles', 'cherry', 'candy'], need: 3 }, { k: 'serve' }],
      sample: { type: 'sundae', scoops: [{ id: 'vanilla' }, { id: 'strawb' }, { id: 'choc' }], dots: [{ id: 'cherry', x: 0, y: 0 }] } },

    { id: 'pbj', cat: 1, name: 'Peanut butter and jelly', ptype: 'stack', steps: [
      { k: 'stack', order: ['bread', 'pbutter', 'jelly', 'bread'] }, { k: 'cut', target: 'piece' }, { k: 'serve' }],
      sample: { type: 'stack', shape: 'bear', layers: [{ id: 'bread' }] } },
    { id: 'toastie', cat: 1, name: 'Cheese toastie', ptype: 'stack', steps: [
      { k: 'grill', id: 'bread', device: 'toaster', n: 2 }, { k: 'stack', order: ['toast', 'cheese', 'cheese', 'toast'] }, { k: 'slice' }, { k: 'serve' }],
      sample: { type: 'stack', sliced: 1, layers: [{ id: 'toast' }, { id: 'cheese' }, { id: 'cheese' }, { id: 'toast' }] } },
    { id: 'hamcheese', cat: 1, name: 'Ham and cheese', ptype: 'stack', steps: [
      { k: 'stack', order: ['bread', 'ham', 'cheese', 'lettuce', 'bread'] },
      { k: 'decorate', tools: ['mustard', 'mayo'], need: 2 }, { k: 'slice' }, { k: 'serve' }],
      sample: { type: 'stack', sliced: 1, layers: [{ id: 'bread' }, { id: 'ham' }, { id: 'cheese' }, { id: 'lettuce' }, { id: 'bread' }] } },
    { id: 'veggie', cat: 1, name: 'Veggie sandwich', ptype: 'stack', steps: [
      { k: 'stack', order: ['bread', 'avocado', 'cucumber', 'tomato', 'lettuce', 'bread'] },
      { k: 'decorate', tools: ['salt', 'pepper'], need: 2 }, { k: 'slice' }, { k: 'serve' }],
      sample: { type: 'stack', sliced: 1, layers: [{ id: 'bread' }, { id: 'avocado' }, { id: 'cucumber' }, { id: 'tomato' }, { id: 'lettuce' }, { id: 'bread' }] } },
    { id: 'turkey', cat: 1, name: 'Turkey and lettuce', ptype: 'stack', steps: [
      { k: 'stack', order: ['bread', 'turkey', 'lettuce', 'tomato', 'bread'] },
      { k: 'decorate', tools: ['mayo', 'mustard'], need: 2 }, { k: 'slice' }, { k: 'serve' }],
      sample: { type: 'stack', sliced: 1, layers: [{ id: 'bread' }, { id: 'turkey' }, { id: 'lettuce' }, { id: 'tomato' }, { id: 'bread' }] } },
    { id: 'hotdog', cat: 1, name: 'Hot dog pals', ptype: 'hotdog', steps: [
      { k: 'grill', id: 'sausage', device: 'grill', n: 1 }, { k: 'stack', order: ['hotbun', 'sausage'] },
      { k: 'decorate', tools: ['ketchup', 'mustard', 'mayo', 'onion'], need: 3 }, { k: 'serve' }],
      sample: { type: 'hotdog', layers: [{ id: 'hotbunBack' }, { id: 'sausage' }], sauce: [sauceLine('#e8433f', -.35, .35, 0), sauceLine('#f2c230', -.3, .3, .04)] } },

    { id: 'hamburger', cat: 2, name: 'Hamburger', ptype: 'stack', steps: [
      { k: 'grill', id: 'patty', device: 'grill', n: 1 }, { k: 'stack', order: ['bunB', 'patty', 'bunT'] },
      { k: 'decorate', tools: ['ketchup', 'mustard'], need: 2 }, { k: 'serve' }],
      sample: { type: 'stack', layers: [{ id: 'bunB' }, { id: 'patty' }, { id: 'bunT' }] } },
    { id: 'cheeseburger', cat: 2, name: 'Cheeseburger', ptype: 'stack', steps: [
      { k: 'grill', id: 'patty', device: 'grill', n: 1 }, { k: 'stack', order: ['bunB', 'patty', 'cheese', 'bunT'] },
      { k: 'decorate', tools: ['ketchup', 'mustard', 'mayo'], need: 2 }, { k: 'serve' }],
      sample: { type: 'stack', layers: [{ id: 'bunB' }, { id: 'patty' }, { id: 'cheese' }, { id: 'bunT' }] } },
    { id: 'double', cat: 2, name: 'Double cheeseburger', ptype: 'stack', steps: [
      { k: 'grill', id: 'patty', device: 'grill', n: 2 }, { k: 'stack', order: ['bunB', 'patty', 'cheese', 'patty', 'cheese', 'bunT'] },
      { k: 'decorate', tools: ['ketchup', 'mustard', 'mayo'], need: 3 }, { k: 'serve' }],
      sample: { type: 'stack', layers: [{ id: 'bunB' }, { id: 'patty' }, { id: 'cheese' }, { id: 'patty' }, { id: 'cheese' }, { id: 'bunT' }] } },
    { id: 'veggieb', cat: 2, name: 'Veggie burger', ptype: 'stack', steps: [
      { k: 'grill', id: 'beanpatty', device: 'grill', n: 1 }, { k: 'stack', order: ['bunB', 'lettuce', 'beanpatty', 'tomato', 'avocado', 'bunT'] },
      { k: 'decorate', tools: ['salt', 'pepper'], need: 2 }, { k: 'serve' }],
      sample: { type: 'stack', layers: [{ id: 'bunB' }, { id: 'lettuce' }, { id: 'beanpatty' }, { id: 'tomato' }, { id: 'avocado' }, { id: 'bunT' }] } },
    { id: 'chickenb', cat: 2, name: 'Chicken burger', ptype: 'stack', steps: [
      { k: 'grill', id: 'chicken', device: 'grill', n: 1 }, { k: 'stack', order: ['bunB', 'lettuce', 'chicken', 'pickle', 'bunT'] },
      { k: 'decorate', tools: ['mayo', 'mustard'], need: 2 }, { k: 'serve' }],
      sample: { type: 'stack', layers: [{ id: 'bunB' }, { id: 'lettuce' }, { id: 'chicken' }, { id: 'pickle' }, { id: 'bunT' }] } },
    { id: 'super', cat: 2, name: 'Super burger', ptype: 'stack', steps: [
      { k: 'grill', id: 'patty', device: 'grill', n: 1 }, { k: 'stack', order: ['bunB', 'lettuce', 'tomato', 'patty', 'cheese', 'onion', 'pickle', 'bunT'] },
      { k: 'decorate', tools: ['ketchup', 'mustard', 'mayo', 'salt', 'pepper'], need: 4 }, { k: 'serve' }],
      sample: { type: 'stack', layers: [{ id: 'bunB' }, { id: 'lettuce' }, { id: 'tomato' }, { id: 'patty' }, { id: 'cheese' }, { id: 'onion' }, { id: 'pickle' }, { id: 'bunT' }] } }
  ];
  const BITES = { cookie: 3, cupcake: 4, cake: 5, stack: 4, hotdog: 3, sundae: 4 };
  // The ingredient that a layer id stands for in the tray, and the layer it draws as
  const layerOf = id => id === 'hotbun' ? 'hotbunBack' : id;
  const DOTS = ['sprinkles', 'candy', 'star', 'cherry', 'strawberry', 'blueberry', 'candle', 'chips', 'onion'];
  const SAUCES = ['ketchup', 'mustard', 'mayo', 'syrup', 'ice-choc'];
  const SEASONS = ['salt', 'pepper'];
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

  /* ---------------------------------------------------------------- the game */
  const H = {};   // one handler per kind of step (below)
  const bitesFor = p => BITES[p.type] || 4;

  class CookGame {
    constructor(host) {
      this.host = host;
      this.canvas = document.createElement('canvas'); this.canvas.className = 'game-canvas';
      host.append(this.canvas); this.ctx = this.canvas.getContext('2d');
      this.bag = store.bag('cook', () => ({ done: {}, total: 0 }));
      this.bag.done = this.bag.done || {}; this.bag.total = this.bag.total || 0;
      this.counter = SPG.ui.counter(host, (c, s) => { c.translate(s / 2, s * .5); c.scale(s / 90, s / 90); drawCupcake(c, { baked: 1, liner: '#ff9ec8', frost: { col: '#ffd0e4' }, deco: { dots: [{ id: 'cherry', x: 0, y: -.55 }] } }, 40); }, this.bag.total);
      this.fx = new art.Fx(); this.t = 0; this.running = false; this.idle = 0;
      this.screen = 'menu'; this.tab = Math.min(2, Math.max(0, this.bag.tab || 0)); this.menuHit = [];
      this.tray = []; this.flies = []; this.said = {}; this.trans = null;
      this.cutters = []; this.mix = null; this.pieces = []; this.dough = null; this.units = null;
      this.tick = this.tick.bind(this);
      this.oc = document.createElement('canvas');
      SPG.cookGame = this;
      const cv = this.canvas, at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * this.w / r.width, y: (e.clientY - r.top) * this.h / r.height, id: e.pointerId }; };
      cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* optional */ } SPG.audio.unlock(); if (this.ptr) return; this.ptr = e.pointerId; this.down(at(e)); });
      cv.addEventListener('pointermove', e => { if (this.ptr === e.pointerId) { e.preventDefault(); this.move(at(e)); } });
      for (const n of ['pointerup', 'pointercancel']) cv.addEventListener(n, e => { if (this.ptr === e.pointerId) { this.ptr = null; this.up(at(e)); } });
    }

    /* ------------------------------------------------------------ layout */
    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.w = r.width; this.h = r.height;
      const dpr = SPG.ui.dpr(); this.dpr = dpr;
      this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = this.w, h = this.h;
      this.narrow = w < 620;
      this.sb = clamp(Math.min(w, h) * .085, 40, 64);
      this.topY = this.narrow ? 104 : 14;
      this.th = clamp(h * .17, 74, 138);
      this.y0 = this.topY + this.sb + 10; this.y1 = h - this.th - 6; this.SH = this.y1 - this.y0;
      this.bx = w / 2; this.by = (this.y0 + this.y1) / 2;
      this.U = Math.min(w * .92, this.SH * 1.32);
      this.R1 = this.U * .26 * (this.R1k || 1);
      this.layoutTray(); if (this.screen === 'menu') this.layoutMenu();
    }
    P(ux, uy) { return { x: this.bx + ux * this.U, y: this.by + uy * this.U }; }
    bowlPos() { return { x: this.bx, y: this.by + this.U * .02, r: this.U * .3 }; }
    // where each piece sits on the stage (one big, or up to four smaller)
    slots(n = this.pieces.length) {
      const U = this.U, tall = this.SH > this.w * .9;
      if (n <= 1) { const p = this.pieces[0]; if (p && !p.shape && ['stack', 'hotdog', 'sundae'].includes(p.type)) { const B = H.stack.base(this); return [{ x: B.x, y: B.y - pieceHeight(p, this.R1) / 2, r: this.R1 }]; } return [{ ...this.P(0, 0), r: this.R1 }]; }
      if (n === 2) return [this.P(-.27, 0), this.P(.27, 0)].map(p => ({ ...p, r: U * .24 }));
      if (n === 3) return (tall ? [this.P(-.2, -.2), this.P(.2, -.2), this.P(0, .2)] : [this.P(-.32, 0), this.P(0, 0), this.P(.32, 0)]).map(p => ({ ...p, r: U * (tall ? .2 : .17) }));
      return [this.P(-.22, -.18), this.P(.22, -.18), this.P(-.22, .2), this.P(.22, .2)].map(p => ({ ...p, r: U * .17 }));
    }

    /* ------------------------------------------------------------ tray (the shelf of things to pick from) */
    setTray(list) {
      this.tray = list.map(o => ({ kind: 'ing', ...o, wig: 0, glow: 0, used: false, x: this.w / 2, y: this.h, hx: 0, hy: 0, r: 30 }));
      this.layoutTray(); for (const it of this.tray) { it.x = it.hx; it.y = it.hy + this.th; }   // slide up
    }
    layoutTray() {
      const n = this.tray.length; if (!n) return;
      const w = this.w, h = this.h, th = this.th, pad = 8, chefW = Math.max(64, th * .95);
      const left = pad + chefW, right = w - pad - 4, rows = n > 5 && this.narrow ? 2 : 1, per = Math.ceil(n / rows);
      const r = clamp(Math.min(th * (rows === 2 ? .22 : .36), (right - left) / per * .46), 16, 54);
      this.tray.forEach((it, i) => {
        const row = Math.floor(i / per), col = i % per, inRow = row === rows - 1 ? n - per * (rows - 1) : per, gap = Math.min((right - left) / inRow, r * 2.7);
        it.r = r; it.hx = (left + right) / 2 + (col - (inRow - 1) / 2) * gap; it.hy = h - th / 2 - 2 + (rows === 2 ? (row - .5) * r * 2.15 : 0);
        if (!it.drag && !it.fly) { it.x = it.hx; it.y = it.hy; }
      });
    }
    wiggle(it) { it.wig = 1; }

    /* ------------------------------------------------------------ small helpers */
    say(key, gap = 3.5) { if (this.t - (this.said[key] || -99) < gap) return; this.said[key] = this.t; voice.say(key); }
    // an item flies from where it was let go to where it belongs, then something happens
    fly(draw, x0, y0, x1, y1, cb, size = 40, dur = .38) { this.flies.push({ draw, x0, y0, x1, y1, cb, size, t: 0, dur }); }
    ingFly(id, x0, y0, x1, y1, cb) { this.fly((c, s) => (ING[id] || ING.flour)(c, s), x0, y0, x1, y1, cb, this.U * .12); }
    finish(delay = .8) { if (this.st && !this.st.fin) { this.st.fin = true; this.st.finT = delay; } }
    pickCutters() { const all = SHAPES.slice(), out = []; while (out.length < 4) out.push(all.splice(Math.floor(Math.random() * all.length), 1)[0]); return out; }

    /* ------------------------------------------------------------ menu and recipe flow */
    enterMenu() {
      this.screen = 'menu'; this.R = null; this.st = null; this.tray = []; this.flies = []; this.mix = null; this.pieces = []; this.arrow = null;
        this.layoutMenu(); this.say('cook-pick', 6);
    }
    startRecipe(R) {
      const sk = R.steps.find(q => q.k === 'stack'), nl = sk ? sk.order.length : 0; this.R1k = nl >= 7 ? .78 : nl === 6 ? .88 : 1; this.R1 = this.U * .26 * this.R1k;
      this.R = R; this.screen = 'cook'; this.stIdx = 0; this.pieces = []; this.piece = null; this.dough = null; this.units = null; this.arrow = null; this.finishedAll = false;
      this.mix = R.steps.some(s => s.k === 'add') ? { items: [], fill: 0, stirred: 0, col: '#f6e8c8', final: BATTER } : null;
      this.cutters = this.pickCutters(); this.flies = [];
      this.beginStep(); this.say('cook-start', 2);
    }
    beginStep() {
      const spec = this.R.steps[this.stIdx]; this.st = { k: spec.k, spec, fin: false, finT: 0, acts: 0 }; this.idle = 0; this.tool = null;
      this.setTray([]); H[spec.k].enter(this, this.st);
    }
    nextStep() { if (!this.trans) { this.trans = { t: 0, mid: false }; sfx.chime(); } }
    recipeDone() {
      if (this.finishedAll) return; this.finishedAll = true;
      const id = this.R.id; this.bag.done[id] = (this.bag.done[id] || 0) + 1; this.bag.total++; this.counter.set(this.bag.total);
      store.addStars(1); store.save(); sfx.win(); voice.say('cook-done');
      for (let i = 0; i < 3; i++) this.fx.burst(this.w * (.25 + i * .25), this.h * .4, 26, { colors: ['#ff6b81', '#ffd54a', '#5cc8f2', '#7ed957', '#b58cf0'], shape: 'confetti', speed: 420, g: 420, life: 1.6, size: 9, up: 160 });
      this.arrow = { t: 0 };
    }

    /* ------------------------------------------------------------ input */
    down(p) {
      this.idle = 0; this.downAt = { x: p.x, y: p.y, t: this.t };
      if (this.screen === 'menu') return this.menuDown(p);
      if (this.trans) return;
      if (this.arrow && Math.hypot(p.x - this.arrowPos().x, p.y - this.arrowPos().y) < this.arrowPos().r * 1.3) { sfx.tap(); this.enterMenu(); return; }
      if (Math.hypot(p.x - this.menuBtn().x, p.y - this.menuBtn().y) < this.menuBtn().r * 1.2) { sfx.tap(); this.enterMenu(); return; }
      const cb = this.checkBtn();
      if (cb && Math.hypot(p.x - cb.x, p.y - cb.y) < cb.r * 1.25) { sfx.tap(); this.finish(.1); return; }
      const ch = this.chefPos();
      if (Math.hypot(p.x - ch.x, p.y - ch.y) < ch.r * 1.2) { sfx.squeak(); this.said = {}; this.hintSay(); this.chefBounce = 1; return; }
      for (const it of this.tray) {
        if (it.used || it.fly) continue;
        if (Math.hypot(p.x - it.x, p.y - it.y) < it.r * 1.3) {
          if (it.kind === 'tool') { this.tool = it.id; sfx.tap(); voice.say('cook/' + it.id); return; }
          this.drag = { it, id: p.id, dx: it.x - p.x, dy: it.y - p.y, sx: p.x, sy: p.y, moved: 0 }; it.drag = true; sfx.tap(); voice.say('cook/' + it.id);
          return;
        }
      }
      const s = this.st; if (s && H[s.k].down && !s.fin) { this.free = true; H[s.k].down(this, s, p); }
    }
    move(p) {
      this.idle = 0;
      if (this.drag) { const d = this.drag; d.it.x = p.x + d.dx; d.it.y = p.y + d.dy - d.it.r * .5; d.moved = Math.max(d.moved, Math.hypot(p.x - d.sx, p.y - d.sy)); return; }
      const s = this.st; if (this.free && s && H[s.k].move) H[s.k].move(this, s, p);
    }
    up(p) {
      if (this.screen === 'menu') return;
      if (this.drag) {
        const d = this.drag, it = d.it; this.drag = null; it.drag = false;
        const tap = d.moved < 14, s = this.st; let res = false;
        if (s && !s.fin && H[s.k].drop) res = H[s.k].drop(this, s, it, it.x, it.y, tap);
        if (res === true) { if (it.once) it.used = true; }
        else { if (res === 'wrong') { this.wiggle(it); sfx.boing(); this.say('cook-wrong', 5); this.idle = 99; } it.back = true; }
        return;
      }
      const s = this.st; if (this.free && s && H[s.k].up) H[s.k].up(this, s, p); this.free = false;
    }
    menuDown(p) {
      for (const h of this.menuHit) if (Math.hypot(p.x - h.x, p.y - h.y) < h.r) {
        if (h.tab != null) { this.tab = h.tab; this.bag.tab = h.tab; sfx.tap(); voice.say('cookc/' + h.tab); this.layoutMenu(); }
        else { sfx.pop(); voice.say('cookr/' + h.R.id); this.startRecipe(h.R); }
        return;
      }
    }
    chefPos() { const r = Math.max(26, this.th * .36); return { x: 8 + Math.max(64, this.th * .95) / 2, y: this.h - this.th / 2 - 2, r }; }
    menuBtn() { const r = this.sb * .5; return { x: this.narrow ? r + 12 : Math.max(this.w * .5 - (this.stepBarW || 300) / 2 - r - 14, r + 96), y: this.topY + this.sb / 2, r }; }
    arrowPos() { const r = Math.max(34, this.th * .42); return { x: this.w - r - 14, y: this.h - this.th - r * .4 - 4, r }; }
    checkBtn() { const s = this.st; if (this.screen !== 'cook' || !s || s.fin || !s.canDone) return null; const r = Math.max(32, this.th * .4); return { x: this.w - r - 14, y: this.y1 - r * .2, r }; }
    hintSay() {
      const s = this.st; if (!s) return; const k = s.k, sp = s.spec;
      voice.say({ add: 'cook-add', stir: 'cook-stir', roll: 'cook-roll', cut: 'cook-cut', fill: sp.what === 'dough' ? 'cook-drop' : 'cook-pour', bake: 'cook-bake', grill: 'cook-grill', stack: 'cook-stack', decorate: sp.mode === 'frost' ? 'cook-frost' : 'cook-decorate', slice: 'cook-slice', serve: 'cook-serve' }[k]);
    }
    wantIds() { const s = this.st; return s && H[s.k].want ? H[s.k].want(this, s) || [] : []; }
  }

  /* ---------------------------------------------------------------- step handlers */
  // Each handler: enter(g,s) sets up the step and its tray; down/move/up are free touches; drop(g,s,item,x,y,tap) is a tray item let go
  // (return true = accepted, 'wrong' = wiggle and say try again, false = send it home); want() lists the tray ids to glow; draw() paints the stage.
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const pan = (c, x, y, w, h) => { c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, x - w / 2 + 4, y - h / 2 + 8, w, h, h * .22); c.fill(); box(c, x - w / 2, y - h / 2, w, h, '#8b95a6', h * .22); box(c, x - w / 2 + h * .08, y - h / 2 + h * .08, w - h * .16, h - h * .16, '#c4ccd9', h * .18); box(c, x - w / 2 + h * .14, y - h / 2 + h * .14, w - h * .28, h - h * .28, '#aab4c4', h * .14); };

  H.add = {
    enter(g, s) { s.left = s.spec.ids.slice(); g.setTray(s.spec.ids.map(id => ({ id, kind: 'ing', once: true }))); },
    want: (g, s) => s.left,
    drop(g, s, it, x, y, tap) {
      if (!s.left.includes(it.id)) return 'wrong';
      const b = g.bowlPos(); if (!tap && Math.hypot(x - b.x, (y - b.y) * 1.3) > b.r * 1.4) return false;
      s.left.splice(s.left.indexOf(it.id), 1);
      g.ingFly(it.id, tap ? it.x : x, tap ? it.y : y, b.x, b.y - b.r * .15, () => {
        g.mix.items.push({ col: ICOL[it.id] || '#fff' }); g.mix.fill = Math.min(.9, .12 + g.mix.items.length / s.spec.ids.length * .78);
        sfx.pop(); g.fx.burst(b.x, b.y, 10, { colors: [ICOL[it.id] || '#fff', '#fff'], speed: 130, g: 300, life: .5, size: 5 }); voice.say('cook/' + it.id);
        if (!s.left.length) g.finish(.7);
      });
      return true;
    },
    draw(g, s, c) { g.sceneBoard(c); const b = g.bowlPos(); drawBowl(c, b.x, b.y, b.r, g.mix, g.t); }
  };

  H.stir = {
    enter(g, s) { s.turn = 0; s.last = null; s.sp = null; s.sq = 0; },
    down(g, s, p) { s.on = true; s.last = null; s.sp = { x: p.x, y: p.y }; H.stir.move(g, s, p); },
    move(g, s, p) {
      if (!s.on) return; const b = g.bowlPos();
      s.sp = { x: clamp(p.x, b.x - b.r * .8, b.x + b.r * .8), y: clamp(p.y, b.y - b.r * .45, b.y + b.r * .5) };
      const dx = p.x - b.x, dy = (p.y - b.y) * 1.5, d = Math.hypot(dx, dy); if (d < b.r * .12 || d > b.r * 1.7) { s.last = null; return; }
      const a = Math.atan2(dy, dx); s.sa = a;
      if (s.last != null) { let da = a - s.last; if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU; H.stir.add(g, s, Math.abs(da) / TAU); }
      s.last = a;
    },
    add(g, s, turns) { s.turn += turns; g.mix.stirred = clamp(s.turn / 3, 0, 1); const q = Math.floor(s.turn * 4); if (q !== s.sq) { s.sq = q; sfx.squish(); } if (s.turn >= 3 && !s.fin) { g.mix.stirred = 1; g.finish(.5); } },
    up(g, s) { s.on = false; s.last = null; },
    update(g, s, dt) { if (!s.fin && g.idle > 9) { s.sa = (s.sa || 0) + dt * 5; s.sp = null; H.stir.add(g, s, dt * .3); } },
    draw(g, s, c) {
      g.sceneBoard(c); const b = g.bowlPos(); const a = s.sa || 0;
      drawBowl(c, b.x, b.y, b.r, g.mix, g.t, 0, a);
      if (s.turn < .25) { c.save(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 4; c.setLineDash([10, 12]); c.beginPath(); c.ellipse(b.x, b.y, b.r * .58, b.r * .38, 0, 0, TAU); c.stroke(); c.setLineDash([]); const ga = g.t * 2.4; circ(c, b.x + Math.cos(ga) * b.r * .58, b.y + Math.sin(ga) * b.r * .38, 9, '#ff6b81'); c.restore(); }
      c.strokeStyle = '#7ed957'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.ellipse(b.x, b.y, b.r * 1.15, b.r * .78, 0, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(s.turn / 3, 0, 1)); c.stroke();
      const sp = s.sp || { x: b.x + b.r * .45, y: b.y - b.r * .1 }; drawSpoon(c, sp.x, sp.y - g.U * .05, g.U * .5, Math.PI + .35);
    }
  };

  H.roll = {
    enter(g, s) { s.p = 0; s.rot = 0; s.q = 0; g.dough = { p: 0 }; s.pin = { x: g.bx, y: g.by - g.U * .22 }; },
    down(g, s, p) { s.on = true; s.lp = { x: p.x, y: p.y }; s.pin = { x: p.x, y: p.y }; },
    move(g, s, p) {
      if (!s.on) return; const d = Math.hypot(p.x - s.lp.x, p.y - s.lp.y); s.pin = { x: p.x, y: p.y }; s.lp = { x: p.x, y: p.y };
      if (Math.hypot(p.x - g.bx, (p.y - g.by) * 1.3) < g.U * .6) H.roll.add(g, s, d / (g.U * 3.4));
    },
    add(g, s, k) { s.p = clamp(s.p + k, 0, 1); s.rot += k * 40; g.dough.p = s.p; const q = Math.floor(s.p * 14); if (q !== s.q) { s.q = q; sfx.roll(); } if (s.p >= 1 && !s.fin) g.finish(.5); },
    up(g, s) { s.on = false; },
    update(g, s, dt) { if (!s.fin && g.idle > 9) { s.pin = { x: g.bx + Math.sin(g.t * 3) * g.U * .15, y: g.by + Math.sin(g.t * 6) * g.U * .12 }; H.roll.add(g, s, dt * .12); } },
    draw(g, s, c) {
      g.sceneBoard(c); drawSheet(g, c, s.p, g.R.id === 'sugar' ? DOUGH : DOUGH);
      const pin = s.pin; drawPin(c, pin.x, pin.y, g.U * .27, 0);
      if (s.p < .08) { c.save(); c.strokeStyle = 'rgba(255,107,129,.9)'; c.fillStyle = 'rgba(255,107,129,.9)'; c.lineWidth = 6; c.lineCap = 'round'; const y = Math.sin(g.t * 3) * g.U * .08; c.beginPath(); c.moveTo(g.bx + g.U * .36, g.by - g.U * .16 + y); c.lineTo(g.bx + g.U * .36, g.by + g.U * .16 + y); c.stroke(); tri(c, [[g.bx + g.U * .36, g.by + g.U * .22 + y], [g.bx + g.U * .31, g.by + g.U * .14 + y], [g.bx + g.U * .41, g.by + g.U * .14 + y]], '#ff6b81'); tri(c, [[g.bx + g.U * .36, g.by - g.U * .22 + y], [g.bx + g.U * .31, g.by - g.U * .14 + y], [g.bx + g.U * .41, g.by - g.U * .14 + y]], '#ff6b81'); c.restore(); }
    }
  };
  function drawSheet(g, c, p, col) {
    const rx = lerp(.17, .46, p) * g.U, ry = lerp(.15, .3, p) * g.U;
    c.save(); c.translate(g.bx, g.by); c.fillStyle = 'rgba(80,40,20,.16)'; c.translate(5, 8); blob(c, rx, ry, 7, .012, 72); c.fill(); c.translate(-5, -8);
    c.fillStyle = shade(col, -.18); blob(c, rx, ry, 7, .012, 72); c.fill(); c.fillStyle = col; c.scale(.96, .94); blob(c, rx, ry, 7, .012, 72); c.fill(); c.scale(1 / .96, 1 / .94);
    shine(c, -rx * .3, -ry * .35, rx * .22, ry * .1, -.2, .35); c.restore();
  }

  H.cut = {
    enter(g, s) {
      s.stamps = []; s.n = s.spec.n || 3; s.slots = [[-.27, -.05], [0, .1], [.27, -.05]].map(([x, y]) => g.P(x, y)); s.slotUsed = [];
      g.setTray(g.cutters.map(id => ({ id, kind: 'cutter' })));
      if (s.spec.target === 'piece') s.n = 1;
    },
    want: (g, s) => g.cutters,
    zone(g, s) { return s.spec.target === 'piece' ? { x: g.bx, y: g.by + g.U * .05, rx: g.U * .4, ry: g.U * .35 } : { x: g.bx, y: g.by, rx: g.U * .55, ry: g.U * .38 }; },
    drop(g, s, it, x, y, tap) {
      const z = H.cut.zone(g, s); if (!tap && Math.hypot((x - z.x) / z.rx, (y - z.y) / z.ry) > 1) return false;
      if (s.spec.target === 'piece') {
        if (s.pending) return true; s.pending = true;
        g.fly((c, sz) => cutterArt(c, it.id, sz), tap ? it.x : x, tap ? it.y : y, z.x, z.y, () => { g.piece.shape = it.id; sfx.snap(); sfx.pop(); g.fx.burst(z.x, z.y, 18, { colors: ['#fff3d6', '#ffd54a'], speed: 200, g: 300, life: .7, size: 6, shape: 'star' }); g.finish(1.1); }, g.U * .16);
        return true;
      }
      let k = -1, best = 1e9; s.slots.forEach((sl, i) => { if (s.slotUsed[i]) return; const d = tap ? i : Math.hypot(sl.x - x, sl.y - y); if (d < best) { best = d; k = i; } });
      if (k < 0) return false; s.slotUsed[k] = true; const sl = s.slots[k];
      g.fly((c, sz) => cutterArt(c, it.id, sz), tap ? it.x : x, tap ? it.y : y, sl.x, sl.y, () => {
        s.stamps.push({ shape: it.id, x: sl.x, y: sl.y, t: 0 }); sfx.snap(); g.fx.burst(sl.x, sl.y, 12, { colors: ['#fff', '#f6e8c8'], speed: 160, g: 240, life: .5, size: 5 });
        if (s.stamps.length >= s.n) { g.pieces = s.stamps.map(st => ({ type: 'cookie', shape: st.shape, baked: 0 })); g.finish(.9); }
      }, g.U * .13);
      return true;
    },
    update(g, s, dt) { for (const st of s.stamps || []) st.t += dt; },
    draw(g, s, c) {
      if (s.spec.target === 'piece') { g.sceneBoard(c); g.drawPlateAndPiece(c, g.piece); return; }
      g.sceneBoard(c); drawSheet(g, c, 1, DOUGH);
      for (const st of s.stamps) { const k = Math.min(1, st.t * 5), lift = Math.sin(k * Math.PI) * 6; c.save(); c.translate(st.x, st.y); c.fillStyle = shade(DOUGH, -.32); shapeFill(c, st.shape, g.U * .13, g.U * .012); c.translate(-lift * .3, -lift); cookieShape(c, st.shape, g.U * .13, DOUGH, { speckle: true }); c.restore(); }
    }
  };

  // where things go when batter or dough is dropped (a tray, a muffin tin, a cake pan or a griddle)
  function fillSlots(g, lay) {
    const U = g.U;
    if (lay === 'sheet') return [[-.26, -.12], [.26, -.12], [-.26, .2], [.26, .2]].map(([x, y]) => ({ ...g.P(x, y), r: U * .12 }));
    if (lay === 'cups') return [[-.33, 0], [0, 0], [.33, 0]].map(([x, y]) => ({ ...g.P(x, y), r: U * .13 }));
    if (lay === 'pan') return [{ ...g.P(0, 0), r: U * .4 }];
    return [[-.28, -.12], [.28, -.12], [0, .2]].map(([x, y]) => ({ ...g.P(x, y), r: U * .2 }));
  }
  function drawFillBase(g, c, lay, slots) {
    const U = g.U;
    if (lay === 'sheet') { pan(c, g.bx, g.by + U * .04, U * .9, U * .64); }
    else if (lay === 'cups') { pan(c, g.bx, g.by, U * .98, U * .38); for (const sl of slots) { ell(c, sl.x, sl.y + sl.r * .25, sl.r * 1.0, sl.r * .62, '#7f8a9c'); } }
    else if (lay === 'pan') { circ(c, g.bx + 4, g.by + 8, U * .44, 'rgba(80,40,20,.2)'); circ(c, g.bx, g.by, U * .44, '#8b95a6'); circ(c, g.bx, g.by, U * .4, '#c4ccd9'); circ(c, g.bx, g.by, U * .37, '#aab4c4'); }
    else { ell(c, g.bx + 4, g.by + U * .04 + 8, U * .52, U * .4, 'rgba(80,40,20,.2)'); ell(c, g.bx, g.by + U * .04, U * .52, U * .4, '#2f2f38'); ell(c, g.bx, g.by + U * .02, U * .47, U * .35, '#45454f'); box(c, g.bx + U * .46, g.by - U * .02, U * .24, U * .07, '#6a4a30', U * .03); }
  }
  H.fill = {
    enter(g, s) {
      const sp = s.spec; s.slots = fillSlots(g, sp.lay); s.filled = s.slots.map(() => false); s.liners = ['#ff9ec8', '#7fd4f5', '#ffe066'];
      g.pieces = []; g.units = null; if (sp.lay === 'griddle') g.units = [];
      g.setTray([{ id: sp.what, kind: sp.what }]);
    },
    want: (g, s) => [s.spec.what],
    drop(g, s, it, x, y, tap) {
      let k = -1, best = 1e9; s.slots.forEach((sl, i) => { if (s.filled[i]) return; const d = tap ? i : Math.hypot(sl.x - x, sl.y - y) - sl.r; if (d < best) { best = d; k = i; } });
      if (k < 0 || (!tap && best > s.slots[k].r * 1.6)) return false;
      s.filled[k] = true; const sl = s.slots[k], sp = s.spec;
      g.fly((c, sz) => sp.what === 'dough' ? ING.dough(c, sz * 1.4) : drawBowl(c, 0, 0, sz * .9, { fill: .8, items: [], col: g.mix.final, final: g.mix.final, stirred: 1 }, 0), tap ? it.x : x, tap ? it.y : y, sl.x, sl.y - sl.r * .2, () => {
        sfx.pat(); g.fx.burst(sl.x, sl.y, 10, { colors: [g.mix.final, '#fff'], speed: 120, g: 300, life: .5, size: 5 });
        const piece = sp.lay === 'sheet' ? { type: 'cookie', shape: 'round', baked: 0, chips: g.R.id === 'chip', x: sl.x, y: sl.y } : sp.lay === 'cups' ? { type: 'cupcake', batter: true, baked: 0, liner: s.liners[k % 3], x: sl.x, y: sl.y } : sp.lay === 'pan' ? { type: 'cake', baked: 0, x: sl.x, y: sl.y, batter: true } : null;
        if (piece) g.pieces[k] = piece; else g.units[k] = { id: g.R.steps.find(q => q.k === 'grill').id, x: sl.x, y: sl.y, r: sl.r, state: 'raw', t: 0, cook: 0 };
        s.done = (s.done || 0) + 1; if (s.done >= s.slots.length) { g.pieces = g.pieces.filter(Boolean); g.units = g.units && g.units.filter(Boolean); g.finish(.9); }
      }, g.U * .1);
      return true;
    },
    draw(g, s, c) {
      g.sceneBoard(c); drawFillBase(g, c, s.spec.lay, s.slots);
      s.slots.forEach((sl, i) => {
        if (s.spec.lay === 'cups' && !s.filled[i]) { c.save(); c.translate(sl.x, sl.y); drawCupcakeAt(c, { empty: true, liner: s.liners[i % 3] }, sl.r); c.restore(); }
        if (!s.filled[i]) { if (s.spec.lay === 'cups') return; c.save(); c.globalAlpha = .5 + Math.sin(g.t * 4 + i) * .2; c.strokeStyle = '#fff'; c.lineWidth = 3; c.setLineDash([8, 8]); c.beginPath(); c.ellipse(sl.x, sl.y, sl.r * (s.spec.lay === 'pan' ? .9 : 1), sl.r * (s.spec.lay === 'pan' ? .9 : .8), 0, 0, TAU); c.stroke(); c.restore(); return; }
      });
      const pcs = g.pieces; s.slots.forEach((sl, i) => {
        if (!s.filled[i]) return;
        c.save(); c.translate(sl.x, sl.y);
        if (s.spec.lay === 'cups') { drawCupcakeAt(c, { type: 'cupcake', batter: true, liner: s.liners[i % 3] }, sl.r * 1.0); }
        else if (s.spec.lay === 'pan') { ell(c, 0, 0, sl.r * .88, sl.r * .88, shade(g.mix.final, -.1)); ell(c, 0, -sl.r * .03, sl.r * .8, sl.r * .8, g.mix.final); shine(c, -sl.r * .3, -sl.r * .3, sl.r * .22, sl.r * .1, -.5, .45); }
        else if (s.spec.lay === 'griddle') { ell(c, 0, 0, sl.r * .9, sl.r * .72, '#f6e6b8'); ell(c, 0, -sl.r * .04, sl.r * .84, sl.r * .66, '#fff1c4'); }
        else drawCookie(c, { type: 'cookie', shape: 'round', baked: 0, chips: g.R.id === 'chip' }, sl.r * 1.0);
        c.restore();
      });
    }
  };
  // a cupcake with batter in it, sized by r (its liner width is about 2r)
  function drawCupcakeAt(c, p, r) { c.save(); c.scale(r / 38, r / 38); drawCupcake(c, p, 40); c.restore(); }

  H.bake = {
    enter(g, s) { s.state = 'idle'; s.t = 0; s.bt = 0; },
    geom(g) { const S = Math.min(g.U * .78, g.SH * .62), o = { x: g.bx, y: g.y0 + g.SH * .36, s: S }, p = { x: g.bx, y: g.y1 - g.U * .16, w: Math.min(g.U * .95, g.w * .9), h: g.U * .26 }; return { o, p }; },
    down(g, s, p) {
      const { o, p: pn } = H.bake.geom(g); const hitO = Math.abs(p.x - o.x) < o.s * .6 && Math.abs(p.y - o.y) < o.s * .6, hitP = Math.abs(p.x - pn.x) < pn.w * .55 && Math.abs(p.y - pn.y) < pn.h * 1.2;
      if (s.state === 'idle' && (hitO || hitP)) { s.state = 'in'; s.t = 0; sfx.whoosh(); }
      else if (s.state === 'ding' && (hitO || hitP)) { s.state = 'out'; s.t = 0; sfx.whoosh(); }
    },
    update(g, s, dt) {
      s.t += dt; const { o } = H.bake.geom(g);
      if (s.state === 'in' && s.t > .9) { s.state = 'bake'; s.t = 0; sfx.sizzle(); }
      else if (s.state === 'bake') { s.bt = Math.min(1, s.t / 3.6); for (const p of g.pieces) p.baked = s.bt; if (Math.floor(g.t * 6) % 2 === 0 && Math.random() < .3) g.fx.burst(o.x, o.y - o.s * .5, 1, { colors: ['rgba(255,255,255,.8)'], speed: 20, g: -50, life: 1, size: 8, up: 40 }); if (s.t >= 3.6) { s.state = 'ding'; s.t = 0; sfx.ding(); g.fx.burst(o.x, o.y, 22, { colors: ['#ffd54a', '#fff'], speed: 260, g: 200, life: .8, size: 6, shape: 'star' }); voice.say('cook-ding'); } }
      else if (s.state === 'out' && s.t > .9) { s.state = 'done'; for (const p of g.pieces) p.baked = 1; g.finish(.4); }
    },
    want: () => [], hintTarget: true,
    draw(g, s, c) {
      const { o, p } = H.bake.geom(g), n = g.pieces.length, r = Math.min(g.U * (n > 3 ? .1 : n > 1 ? .12 : .2), p.w / (n * 2.3));
      const pcs = (cc, sc) => g.pieces.forEach((pc, i) => { cc.save(); cc.translate((i - (n - 1) / 2) * r * 2.4 * sc, 0); drawPieceC(cc, pc, r * sc); cc.restore(); });
      const glow = s.state === 'bake' ? Math.min(1, s.t * 2) : s.state === 'ding' ? 1 : s.state === 'in' ? clamp(s.t * 1.5, 0, .6) : s.state === 'out' ? clamp(1 - s.t * 1.2, 0, 1) : 0;
      const inside = s.state === 'bake' || s.state === 'ding' || (s.state === 'in' && s.t >= .9);
      const items = cc => { if (inside) { cc.translate(0, -o.s * .02); pan(cc, 0, 0, o.s * .9, o.s * .28); cc.translate(0, -o.s * .08); cc.scale(1 / .62 * 1, 1 / .62 * 1); cc.scale(.62, .62); pcs(cc, o.s * .62 / r * .36 / (1)); } };
      drawOven(c, o.x, o.y, o.s, glow, 0, g.t, s.state === 'out' && s.t > .5 ? null : null);
      // the pan: outside, or sliding in/out; when inside the oven window it is drawn there
      if (inside) { c.save(); c.beginPath(); rr(c, o.x - o.s * .34, o.y - o.s * .24, o.s * .68, o.s * .52, o.s * .05); c.clip(); c.translate(o.x, o.y + o.s * .1); pan(c, 0, 0, o.s * .56, o.s * .17); c.translate(0, -o.s * .06); const sr = o.s * .075; g.pieces.forEach((pc, i) => { c.save(); c.translate((i - (n - 1) / 2) * sr * 2.3, 0); drawPieceC(c, pc, sr); c.restore(); }); c.restore(); }
      else {
        let u = s.state === 'in' ? ease(clamp(s.t / .9, 0, 1)) : s.state === 'out' ? 1 - ease(clamp(s.t / .9, 0, 1)) : 0; if (s.state === 'done') u = 0;
        const x = lerp(p.x, o.x, u), y = lerp(p.y, o.y + o.s * .1, u), k = lerp(1, .52, u);
        c.save(); c.translate(x, y); c.scale(k, k); if (s.state === 'idle' || s.state === 'out' && u > .8) { }
        if (s.state === 'idle') { c.shadowColor = '#fff'; c.shadowBlur = 14 + Math.sin(g.t * 5) * 8; }
        pan(c, 0, 0, p.w, p.h); c.shadowBlur = 0; c.translate(0, -p.h * .12); pcs(c, 1); c.restore();
      }
      if (s.state === 'bake') { c.strokeStyle = '#ffd54a'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.arc(o.x, o.y - o.s * .5 - 24, 24, -Math.PI / 2, -Math.PI / 2 + TAU * s.bt); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y - o.s * .5 - 24, 24, 0, TAU); c.stroke(); }
      if (s.state === 'idle' || s.state === 'ding') { const pk = Math.sin(g.t * 6) * .5 + .5; c.save(); c.globalAlpha = .6 + pk * .4; drawTapHint(c, s.state === 'idle' ? p.x : o.x, s.state === 'idle' ? p.y - p.h * .3 : o.y + o.s * .1, g.U * .1, g.t); c.restore(); }
    }
  };
  // a pointing finger-circle that bounces: "touch here"
  function drawTapHint(c, x, y, r, t) { const b = Math.abs(Math.sin(t * 4)) * r * .5; c.save(); c.translate(x, y - r * 1.1 - b); c.lineJoin = 'round'; c.fillStyle = '#ff6b9d'; c.strokeStyle = '#fff'; c.lineWidth = r * .16; c.beginPath(); c.moveTo(-r * .38, -r * .55); c.lineTo(r * .38, -r * .55); c.lineTo(r * .38, -r * .05); c.lineTo(r * .78, -r * .05); c.lineTo(0, r * .7); c.lineTo(-r * .78, -r * .05); c.lineTo(-r * .38, -r * .05); c.closePath(); c.stroke(); c.fill(); c.restore(); }
  function drawPieceC(c, p, R) { drawPiece(c, p, R); }

  H.grill = {
    enter(g, s) {
      const sp = s.spec, U = g.U; s.dev = sp.device; s.placed = 0; s.n = sp.existing ? (g.units || []).length : (sp.n || 1);
      if (sp.existing) { s.units = g.units; for (const u of s.units) { u.state = 'cook1'; u.t = 0; } }
      else { s.units = []; s.slots = sp.device === 'toaster' ? [-1, 1].map(d => ({ x: g.bx + d * U * .13, y: g.by - U * .02, r: U * .1 })) : (s.n === 1 ? [{ x: g.bx, y: g.by, r: U * .17 }] : [{ x: g.bx - U * .2, y: g.by, r: U * .17 }, { x: g.bx + U * .2, y: g.by, r: U * .17 }]); g.setTray([{ id: sp.id, kind: 'ing' }]); }
    },
    want: (g, s) => s.placed < s.n && !s.spec.existing ? [s.spec.id] : [],
    drop(g, s, it, x, y, tap) {
      if (s.placed >= s.n) return false; const d = { x: g.bx, y: g.by, r: g.U * .4 };
      if (!tap && Math.hypot(x - d.x, (y - d.y) * 1.3) > d.r * 1.35) return false;
      const k = s.placed++; const sl = s.slots[k]; if (s.placed >= s.n) it.used = true;
      g.ingFly(s.spec.id, tap ? it.x : x, tap ? it.y : y, sl.x, sl.y, () => { s.units.push({ id: s.spec.id, x: sl.x, y: sl.y, r: sl.r, state: 'cook1', t: 0, cook: 0 }); sfx.sizzle(); });
      return true;
    },
    down(g, s, p) {
      for (const u of s.units) if (u.state === 'flip' && Math.hypot(p.x - u.x, p.y - u.y) < u.r * 1.8) { u.state = 'flipping'; u.t = 0; sfx.whoosh(); return; }
      if (s.dev === 'toaster') for (const u of s.units) if (u.state === 'pop' && Math.hypot(p.x - u.x, (p.y - u.y + g.U * .1)) < u.r * 2.4) { u.state = 'taken'; u.t = 0; sfx.pop(); g.fx.burst(u.x, u.y - g.U * .1, 10, { colors: ['#d9a05a', '#fff3d6'], speed: 150, g: 300, life: .5, size: 5 }); }
    },
    update(g, s, dt) {
      const tm = s.dev === 'toaster' ? 3 : 2.8;
      for (const u of s.units) {
        u.t += dt;
        if (u.state === 'cook1') { u.cook = Math.min(.5, u.t / tm * .5); if (Math.random() < dt * 5) g.fx.burst(u.x, u.y - u.r * .5, 1, { colors: ['rgba(255,255,255,.75)'], speed: 18, g: -45, life: 1, size: 8, up: 30 }); if (u.t >= tm) { u.t = 0; if (s.dev === 'toaster') { u.state = 'pop'; u.cook = 1; sfx.ding(); } else { u.state = 'flip'; sfx.plink(2); voice.say('cook-flip'); } } }
        else if (u.state === 'flipping') { if (u.t > .45) { u.state = 'cook2'; u.t = 0; sfx.sizzle(); } }
        else if (u.state === 'cook2') { u.cook = .5 + Math.min(.5, u.t / 2.4 * .5); if (Math.random() < dt * 5) g.fx.burst(u.x, u.y - u.r * .5, 1, { colors: ['rgba(255,255,255,.75)'], speed: 18, g: -45, life: 1, size: 8, up: 30 }); if (u.t >= 2.4) { u.state = 'done'; u.cook = 1; sfx.ding(); g.fx.burst(u.x, u.y, 16, { colors: ['#ffd54a', '#fff'], speed: 200, g: 200, life: .6, size: 5, shape: 'star' }); } }
        else if (u.state === 'taken' && u.t > .3) u.state = 'gone';
      }
      if (!s.fin && s.units.length === s.n && s.units.every(u => u.state === 'done' || u.state === 'gone')) g.finish(.9);
      if (!s.fin && g.idle > 12) for (const u of s.units) if (u.state === 'flip') { u.state = 'flipping'; u.t = 0; }
      if (!s.fin && g.idle > 12 && s.dev === 'toaster') for (const u of s.units) if (u.state === 'pop') { u.state = 'taken'; u.t = 0; }
    },
    draw(g, s, c) {
      const U = g.U;
      if (s.dev === 'toaster') {
        const S = U * .55, ss = S * .62, cooking = s.units.some(u => u.state === 'cook1');
        for (const u of s.units) {
          if (u.state === 'gone') continue;
          const out = u.state === 'pop' ? 1 : u.state === 'taken' ? 1 + u.t / .3 * .8 : 0, y = g.by - S * .2 + ss * .22 - out * ss * .5;
          c.save(); c.translate(u.x, y); c.globalAlpha = u.state === 'taken' ? Math.max(0, 1 - u.t / .3) : 1; ING.bread(c, ss); c.fillStyle = `rgba(150,80,20,${(u.cook || 0) * .45})`; rr(c, -ss * .33, -ss * .29, ss * .66, ss * .64, ss * .09); c.fill(); c.restore();
        }
        drawToaster(c, g.bx, g.by, S, 0, cooking ? 1 : 0, []);
        for (const u of s.units) if (u.state === 'pop') drawTapHint(c, u.x, g.by - S * .2 - ss * .55, U * .08, g.t);
        if (s.placed < s.n) s.slots.forEach((sl, i) => { if (i < s.placed) return; c.save(); c.globalAlpha = .6 + Math.sin(g.t * 4) * .3; drawTapHint(c, sl.x, g.by - S * .3, U * .08, g.t); c.restore(); });
        return;
      }
      if (s.dev === 'pan') { drawFillBase(g, c, 'griddle', []); } else drawGrill(c, g.bx, g.by, U * .4, s.units.some(u => u.state !== 'raw' && u.state !== 'done') ? 1 : .2);
      if (s.dev === 'grill' && s.placed < s.n) s.slots.forEach((sl, i) => { if (i < s.placed) return; c.save(); c.globalAlpha = .55 + Math.sin(g.t * 4) * .2; c.strokeStyle = '#fff'; c.lineWidth = 3; c.setLineDash([8, 8]); c.beginPath(); c.ellipse(sl.x, sl.y, sl.r * 1.2, sl.r * .9, 0, 0, TAU); c.stroke(); c.restore(); });
      for (const u of s.units) {
        c.save(); c.translate(u.x, u.y); const flip = u.state === 'flipping' ? u.t / .45 : 0, sx = flip ? Math.abs(Math.cos(flip * Math.PI)) : 1, lift = flip ? Math.sin(flip * Math.PI) * u.r * 1.2 : 0; c.translate(0, -lift); c.scale(1, sx * .95 + .05);
        drawUnit(c, u, u.r * 2.6);
        c.restore();
        if (u.state === 'cook1' || u.state === 'cook2') { const k = u.state === 'cook1' ? u.t / 2.8 : u.t / 2.4; c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 5; c.beginPath(); c.arc(u.x, u.y - u.r * 1.6, 13, 0, TAU); c.stroke(); c.strokeStyle = '#ffd54a'; c.lineWidth = 5; c.beginPath(); c.arc(u.x, u.y - u.r * 1.6, 13, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(k, 0, 1)); c.stroke(); }
        if (u.state === 'flip') { drawTapHint(c, u.x, u.y - u.r * 1.6, g.U * .09, g.t); c.save(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.arc(u.x, u.y, u.r * 1.5, 0, TAU); c.globalAlpha = .6 + Math.sin(g.t * 8) * .3; c.stroke(); c.restore(); }
      }
    }
  };
  function drawUnit(c, u, s) {
    const k = u.cook || 0;
    if (u.id === 'pancake') { ell(c, 0, s * .02, s * .38, s * .3, k < .5 ? '#f0d9a0' : '#d9a04a'); ell(c, 0, 0, s * .38, s * .3, k < .5 ? '#fff1c4' : lerpHex('#fff1c4', '#f0c36a', (k - .5) * 2)); if (k > .12 && k < .55) for (let i = 0; i < 6; i++) circ(c, (rnd(i + 3) - .5) * s * .5, (rnd(i + 9) - .5) * s * .3, s * .018 + k * s * .02, 'rgba(255,255,255,.7)'); return; }
    (ING[u.id] || ING.patty)(c, s * (u.id === 'sausage' ? 1.2 : 1));
    if (k < 1) { c.save(); c.globalAlpha = .45 * (1 - k); c.fillStyle = '#ffb4a0'; if (u.id === 'sausage') { rr(c, -s * .6, -s * .12, s * 1.2, s * .24, s * .12); c.fill(); } else { c.beginPath(); c.ellipse(0, 0, s * .44, s * .34, 0, 0, TAU); c.fill(); } c.restore(); }
    else if (u.id !== 'bread') { c.save(); c.globalAlpha = .18; c.strokeStyle = '#2a1a10'; c.lineWidth = s * .035; for (const x of [-.2, 0, .2]) { c.beginPath(); c.moveTo(x * s - s * .05, -s * .15); c.lineTo(x * s + s * .05, s * .15); c.stroke(); } c.restore(); }
  }
  const lerpHex = (a, b, k) => mixHex(a, b, clamp(k, 0, 1));

  H.stack = {
    enter(g, s) {
      const sp = s.spec, ptype = g.R.ptype; s.i = 0;
      g.piece = { type: ptype === 'stack' || ptype === 'hotdog' || ptype === 'sundae' ? ptype : 'stack', layers: [], scoops: [], sauce: [], dots: [] }; g.pieces = [g.piece];
      const uniq = [...new Set(sp.order)]; const tray = uniq.map(id => ({ id, kind: 'ing' }));
      for (let i = tray.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tray[i], tray[j]] = [tray[j], tray[i]]; }
      g.setTray(tray);
    },
    want: (g, s) => [s.spec.order[s.i]],
    drop(g, s, it, x, y, tap) {
      if (s.i >= s.spec.order.length) return false;
      if (it.id !== s.spec.order[s.i]) return 'wrong';
      if (!tap && (y > g.y1 + 4 || Math.abs(x - g.bx) > g.U * .7)) return false;
      s.i++; const last = s.i >= s.spec.order.length, id = it.id, p = g.piece;
      const base = H.stack.base(g); const topY = base.y - H.stack.height(g) - g.R1 * .3;
      g.ingFly(id, tap ? it.x : x, tap ? it.y : y, base.x, topY, () => {
        if (id.startsWith('sc-')) p.scoops.push({ id: id.slice(3), drop: 1 }); else p.layers.push({ id: layerOf(id), drop: 1, seed: p.layers.length * 7 });
        sfx.pat(); voice.say('cook/' + id); g.fx.burst(base.x, base.y - H.stack.height(g), 8, { colors: ['#fff', '#ffe27a'], speed: 110, g: 300, life: .4, size: 4 });
      });
      if (last) g.finish(1.1);
      return true;
    },
    base(g) { return { x: g.bx, y: g.by + g.U * .2 }; },
    height(g) { const p = g.piece, W = g.R1 * 2; return p.type === 'sundae' ? (p.scoops.length ? W * (.22 + p.scoops.length * .27) : 0) : (p.layers || []).reduce((a, l) => a + (LAYER[l.id] ? LAYER[l.id][0] * W * (l.squash || 1) * (l.id === 'bunT' ? .78 : .9) : 0), 0); },
    update(g, s, dt) { for (const l of g.piece.layers) if (l.drop > 0) l.drop = Math.max(0, l.drop - dt * 4.5); for (const l of g.piece.scoops) if (l.drop > 0) l.drop = Math.max(0, l.drop - dt * 4.5); },
    draw(g, s, c) { g.sceneBoard(c); g.drawPlateAndPiece(c, g.piece, true); }
  };

  // free decorating: icing, sprinkles, toppings, sauces and seasoning
  H.decorate = {
    enter(g, s) {
      const sp = s.spec; s.need = sp.mode === 'frost' ? g.pieces.length : (sp.need || 3); s.acts = 0; s.canDone = false; s.stroke = null;
      g.setTray(sp.tools.map(id => ({ id, kind: 'tool' }))); g.tool = sp.tools[0];
      if (sp.mode === 'frost') for (const p of g.pieces) { delete p.frost; }
    },
    want: () => [],
    hit(g, p) {
      const sl = g.slots(), flat = g.pieces.length === 1 && ['stack', 'hotdog', 'sundae'].includes(g.pieces[0].type);
      for (let i = 0; i < g.pieces.length; i++) { const q = sl[i]; if (flat ? (Math.abs(p.x - q.x) < q.r * 1.5 && Math.abs(p.y - q.y) < q.r * 1.5) : Math.hypot(p.x - q.x, p.y - q.y) < q.r * 1.25) return { piece: g.pieces[i], slot: q, i }; }
      return null;
    },
    down(g, s, p) {
      const h = H.decorate.hit(g, p); if (!h || !g.tool) return; s.cur = h; s.dragged = false; s.sp0 = { x: p.x, y: p.y }; const tool = g.tool, pc = h.piece, flat = ['stack', 'hotdog', 'sundae'].includes(pc.type);
      if (SEASONS.includes(tool)) { const col = SEASON[tool]; const top = flat ? H.decorate.topLayer(pc) : null; const dots = []; for (let i = 0; i < 9; i++) dots.push([(Math.random() - .5) * .7, (Math.random() - .5) * .05]); if (flat && top) { top.season = (top.season || []).concat([{ col, pts: dots }]); } else (pc.deco = pc.deco || {}).dots = ((pc.deco || {}).dots || []).concat(dots.map(d => ({ id: 'sprinkles', x: d[0] * 1.2, y: (Math.random() - .5) * .8, col, rot: Math.random() * 3 }))); sfx.rustle(); g.fx.burst(p.x, p.y - 20, 14, { colors: [col === '#ffffff' ? '#e8f0ff' : '#444', col], speed: 80, g: 500, life: .7, size: 3 }); H.decorate.act(g, s); voice.say('cook-shake'); s.cur = null; return; }
      if (DOTS.includes(tool)) { const lx = (p.x - h.slot.x) / h.slot.r, ly = (p.y - h.slot.y) / h.slot.r; const n = tool === 'sprinkles' ? 6 : 1; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = n > 1 ? Math.random() * .22 : 0; H.decorate.dot(g, pc, tool, lx + Math.cos(a) * d, ly + Math.sin(a) * d, i); } sfx.plink(Math.floor(Math.random() * 5)); g.fx.burst(p.x, p.y, 6, { colors: [tool === 'sprinkles' ? SPRINKLE[0] : '#fff', '#ffd54a'], speed: 90, g: 300, life: .4, size: 4, shape: 'star' }); H.decorate.act(g, s); s.cur = null; return; }
      // icing, sauces: tap or drag
      s.stroke = { pts: [] }; H.decorate.move(g, s, p);
    },
    move(g, s, p) {
      if (!s.cur || !s.stroke) return; const h = s.cur, pc = h.piece, tool = g.tool, flat = ['stack', 'hotdog', 'sundae'].includes(pc.type);
      if (Math.hypot(p.x - s.sp0.x, p.y - s.sp0.y) > 10) s.dragged = true; if (!s.dragged && s.stroke.pts.length) return;
      const col = SAUCES.includes(tool) && flat ? (SAUCE[tool] || '#b8651a') : (ICING[tool] || SAUCE[tool] || '#fff');
      if (flat) {
        const x = clamp((p.x - h.slot.x) / (h.slot.r * 2), -.42, .42), sl = H.decorate.sauceLayer(pc), y = Math.sin(x * 16) * .02;
        if (!s.stroke.target) { const st = { col, pts: [] }; s.stroke.target = st; if (pc.type === 'hotdog') (pc.sauce = pc.sauce || []).push(st); else if (pc.type === 'sundae') { const sc = pc.scoops[pc.scoops.length - 1]; if (sc) (sc.sauce = sc.sauce || []).push({ col, pts: [] }); s.stroke.target = sc ? sc.sauce[sc.sauce.length - 1] : st; } else if (sl) (sl.sauce = sl.sauce || []).push(st); }
        const last = s.stroke.pts[s.stroke.pts.length - 1]; if (!last || Math.abs(last[0] - x) > .03) { s.stroke.pts.push([x, y]); s.stroke.target.pts = s.stroke.pts.map(q => [pc.type === 'sundae' ? q[0] * .5 : q[0], pc.type === 'sundae' ? q[1] + .02 : pc.type === 'hotdog' ? q[1] * 1 : q[1]]); if (s.stroke.pts.length % 2) sfx.squirt(); }
      } else {
        if (!s.stroke.pts.length && !s.stroke.target) {
          if ((pc.type === 'cupcake' || pc.type === 'cake') && !pc.frost && ICING[tool]) { pc.frost = { col: ICING[tool], t: 0 }; sfx.squirt(); g.fx.burst(h.slot.x, h.slot.y, 14, { colors: [ICING[tool], '#fff'], speed: 130, g: 300, life: .5, size: 5 }); H.decorate.act(g, s); s.cur = null; s.stroke = null; if (s.spec.mode === 'frost' && g.pieces.every(q => q.frost)) g.finish(.9); return; }
        }
        const lx = clamp((p.x - h.slot.x) / h.slot.r, -.8, .8), ly = clamp((p.y - h.slot.y) / h.slot.r, -.7, .7);
        if (!s.stroke.target) { const st = { col: ICING[tool] || '#fff', pts: [] }; s.stroke.target = st; pc.deco = pc.deco || {}; (pc.deco.strokes = pc.deco.strokes || []).push(st); }
        const last = s.stroke.pts[s.stroke.pts.length - 1]; if (!last || Math.hypot(last[0] - lx, last[1] - ly) > .05) { s.stroke.pts.push([lx, ly]); s.stroke.target.pts = s.stroke.pts.slice(); if (s.stroke.pts.length % 3 === 0) sfx.squirt(); }
      }
    },
    up(g, s, p) {
      const st = s.stroke, h = s.cur; s.stroke = null; s.cur = null; if (!st || !h || s.fin) return;
      const pc = h.piece, tool = g.tool;
      if (!s.dragged || !st.target || st.pts.length < 2) {
        // a plain tap with icing: fill the whole shape (cookies) or frost it
        if (st.target) { const arr = pc.deco && pc.deco.strokes; if (arr) arr.splice(arr.indexOf(st.target), 1); const sa = pc.sauce; if (sa && sa.includes(st.target)) sa.splice(sa.indexOf(st.target), 1); }
        if (pc.type === 'cookie' && ICING[tool]) { (pc.deco = pc.deco || {}).fill = ICING[tool]; sfx.squirt(); g.fx.burst(h.slot.x, h.slot.y, 14, { colors: [ICING[tool], '#fff'], speed: 130, g: 300, life: .5, size: 5 }); H.decorate.act(g, s); }
        else if ((pc.type === 'cupcake' || pc.type === 'cake') && ICING[tool] && !pc.frost) { pc.frost = { col: ICING[tool], t: 0 }; sfx.squirt(); H.decorate.act(g, s); if (s.spec.mode === 'frost' && g.pieces.every(q => q.frost)) g.finish(.9); }
        else if (SAUCES.includes(tool) && ['stack', 'hotdog', 'sundae'].includes(pc.type)) { const sl2 = H.decorate.sauceLayer(pc), x = clamp((s.sp0.x - h.slot.x) / (h.slot.r * 2), -.3, .3); if (pc.type === 'hotdog') (pc.sauce = pc.sauce || []).push(sauceLine(SAUCE[tool] || '#b8651a', -.35, .35, 0)); else if (pc.type === 'sundae') { const sc = pc.scoops[pc.scoops.length - 1]; if (sc) (sc.sauce = sc.sauce || []).push(sauceLine(SAUCE[tool] || '#b8651a', -.3, .3, .02)); } else if (sl2) (sl2.sauce = sl2.sauce || []).push(sauceLine(SAUCE[tool] || '#b8651a', x - .25, x + .25, 0)); sfx.squirt(); H.decorate.act(g, s); }
        return;
      }
      H.decorate.act(g, s);
      if (pc.type === 'cookie' || ((pc.type === 'cupcake' || pc.type === 'cake') && s.spec.mode !== 'frost')) { }
    },
    act(g, s) { s.acts++; const first = !s.canDone; if (s.spec.mode !== 'frost') { s.canDone = s.acts >= s.need; g.st.canDone = s.canDone; if (s.canDone && first) { sfx.chime(); voice.say('cook-alldone'); } } else if (g.pieces.every(q => q.frost)) g.finish(.9); },
    dot(g, pc, id, lx, ly, i) {
      const flat = ['stack', 'hotdog', 'sundae'].includes(pc.type), col = id === 'sprinkles' ? SPRINKLE[Math.floor(Math.random() * 5)] : id === 'candy' ? SPRINKLE[Math.floor(Math.random() * 5)] : null;
      const rot = Math.random() * 3 - 1.5;
      if (flat) { (pc.dots = pc.dots || []).push({ id, x: clamp(lx * .5, -.42, .42), y: (Math.random() - .5) * .04, col, rot }); }
      else (pc.deco = pc.deco || {}).dots = ((pc.deco || {}).dots || []).concat([{ id, x: clamp(lx, -.7, .7), y: clamp(ly, -.7, .7), col, rot }]);
    },
    topLayer: pc => (pc.layers && pc.layers.length) ? pc.layers[pc.layers.length - 1] : null,
    sauceLayer: pc => { const L = pc.layers || []; let i = L.length - 1; while (i > 0 && ['bunT', 'butterpat', 'bread', 'toast'].includes(L[i].id)) i--; return L[i] || null; },
    update(g, s, dt) { for (const p of g.pieces) if (p.frost && p.frost.t < 1) p.frost.t = Math.min(1, p.frost.t + dt * 3); },
    draw(g, s, c) {
      g.sceneBoard(c);
      if (g.pieces.length === 1 && ['stack', 'hotdog', 'sundae'].includes(g.pieces[0].type)) { g.drawPlateAndPiece(c, g.pieces[0]); }
      else { const sl = g.slots(); g.pieces.forEach((p, i) => { const q = sl[i]; drawShadowDisc(c, q.x, q.y + q.r * .5, q.r); drawPieceAt(c, p, q.x, q.y, q.r); }); }
      if (g.tool && s.canDone === false && s.acts === 0 && g.idle > 2.5) { const sl = g.slots(); const q = sl[0]; drawTapHint(c, q.x, q.y - q.r * .3, g.U * .1, g.t); }
    }
  };
  const drawShadowDisc = (c, x, y, r) => { c.fillStyle = 'rgba(80,40,20,.14)'; c.beginPath(); c.ellipse(x + r * .06, y, r * 1.0, r * .32, 0, 0, TAU); c.fill(); };
  // piece centred at (x, y); tall pieces are drawn from their base so the middle lands on the point
  function drawPieceAt(c, p, x, y, R) { c.save(); c.translate(x, y + pieceBase(p, R)); drawPiece(c, p, R); c.restore(); }
  const pieceBase = (p, R) => !p.shape && ['stack', 'hotdog', 'sundae'].includes(p.type) ? pieceHeight(p, R) * .5 : 0;

  H.slice = {
    enter(g, s) { s.p = 0; s.kn = null; g.piece = g.piece || g.pieces[0]; s.t0 = 0; },
    geom(g) { const R = g.R1, h = pieceHeight(g.piece, R); return { x: g.bx, top: g.by + g.U * .2 - h - R * .2, bot: g.by + g.U * .2 + R * .1, h }; },
    down(g, s, p) { s.on = true; H.slice.move(g, s, p); },
    move(g, s, p) { if (!s.on || s.fin) return; const q = H.slice.geom(g); s.kn = { x: p.x, y: p.y }; if (Math.abs(p.x - q.x) < g.R1 * 1.2) { const k = clamp((p.y - q.top) / (q.bot - q.top), 0, 1); if (k > s.p) { s.p = k; if (Math.floor(k * 8) !== s.sq) { s.sq = Math.floor(k * 8); sfx.rustle(); } } if (s.p >= .92) H.slice.cut(g, s); } },
    up(g, s) { s.on = false; },
    cut(g, s) { if (s.fin) return; s.p = 1; g.piece.sliced = 1; g.piece.slideT = 0; sfx.snap(); sfx.pop(); g.finish(1.2); g.fx.burst(g.bx, g.by, 14, { colors: ['#ffd54a', '#fff'], speed: 160, g: 300, life: .6, size: 5, shape: 'star' }); },
    update(g, s, dt) { if (g.piece.sliced) g.piece.slideT = Math.min(1, (g.piece.slideT || 0) + dt * 3); if (!s.fin && g.idle > 10) { s.p = Math.min(1, s.p + dt * .35); s.kn = { x: g.bx, y: lerp(H.slice.geom(g).top, H.slice.geom(g).bot, s.p) }; if (s.p >= .92) H.slice.cut(g, s); } },
    draw(g, s, c) {
      g.sceneBoard(c); g.drawPlateAndPiece(c, g.piece, true); const q = H.slice.geom(g);
      if (!g.piece.sliced) { c.save(); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 5; c.setLineDash([10, 10]); c.lineDashOffset = -g.t * 30; c.beginPath(); c.moveTo(q.x, q.top - 6); c.lineTo(q.x, q.bot + 6); c.stroke(); c.restore(); if (s.p < .05) { const k = (Math.sin(g.t * 2.2) * .5 + .5); drawKnife(c, q.x, lerp(q.top, q.bot, k), g.U * .3); } }
      if (s.kn && !g.piece.sliced) drawKnife(c, s.kn.x, s.kn.y, g.U * .3);
    }
  };
  function drawKnife(c, x, y, s) { c.save(); c.translate(x, y); c.rotate(.18); c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, -s * .04 + 4, -s * .06 + 6, s * .09, s * .5, s * .03); c.fill(); c.fillStyle = '#e8eef8'; c.beginPath(); c.moveTo(-s * .045, -s * .02); c.lineTo(s * .045, -s * .02); c.lineTo(s * .045, s * .4); c.quadraticCurveTo(0, s * .46, -s * .045, s * .4); c.closePath(); c.fill(); c.fillStyle = '#b9c4d4'; c.fillRect(-s * .045, -s * .02, s * .02, s * .42); box(c, -s * .055, -s * .24, s * .11, s * .24, '#d63a3a', s * .04); c.restore(); }

  H.serve = {
    enter(g, s) {
      s.total = g.pieces.reduce((a, p) => { p.bites = []; p.gone = false; return a + bitesFor(p); }, 0); s.n = 0; g.setTray([]);
      voice.say('cook-serve'); g.fx.burst(g.bx, g.by, 30, { colors: ['#ffd54a', '#fff', '#ff9ec8'], speed: 300, g: 200, life: 1, size: 7, shape: 'star' }); sfx.chime();
    },
    down(g, s, p) {
      if (s.fin || g.finishedAll) return; const sl = g.slots();
      for (let i = 0; i < g.pieces.length; i++) {
        const pc = g.pieces[i], q = sl[i]; if (pc.gone) continue; const flat = ['stack', 'hotdog', 'sundae'].includes(pc.type), R = q.r, hh = pieceHeight(pc, R), cy = q.y;
        if (Math.abs(p.x - q.x) < R * 1.25 && Math.abs(p.y - cy) < Math.max(R * 1.1, hh * .6)) {
          const k = pc.bites.length, a = Math.atan2((p.y - cy) * (flat ? .5 : 1), p.x - q.x) + (Math.random() - .5) * .6;
          pc.bites.push({ x: Math.cos(a) * R * (flat ? .95 : .82), y: Math.sin(a) * R * (flat ? .35 : .82), r: R * (.34 + k * .07) });
          sfx.crunch(); g.fx.burst(p.x, p.y, 12, { colors: ['#d9a05a', '#fff3d6', '#e8c88a'], speed: 140, g: 500, life: .5, size: 4 }); g.bounce = 1; s.n++;
          if (pc.bites.length >= bitesFor(pc)) { pc.gone = true; g.fx.burst(q.x, q.y, 20, { colors: ['#ffd54a', '#ff9ec8', '#fff'], speed: 240, g: 300, life: .8, size: 6, shape: 'star' }); }
          if (s.n % 2 === 1) voice.say('cook-yum');
          if (s.n >= s.total) { g.recipeDone(); s.fin = true; s.finT = 99; }
          return;
        }
      }
    },
    update(g, s, dt) { g.bounce = Math.max(0, (g.bounce || 0) - dt * 4); },
    draw(g, s, c) {
      g.sceneBoard(c, true);
      const sl = g.slots(); const one = g.pieces.length === 1;
      const flat1 = one && !g.pieces[0].shape && ['stack', 'hotdog', 'sundae'].includes(g.pieces[0].type), B = H.stack.base(g);
      if (flat1) drawPlate(c, B.x, B.y + g.U * .02, g.U * .38); else drawPlate(c, g.bx, g.by + (one ? g.U * .1 : g.U * .1), g.U * (one ? .42 : .52));
      g.pieces.forEach((p, i) => { if (p.gone) return; const q = sl[i], bob = (g.finishedAll ? 0 : Math.sin(g.t * 3 + i) * 3) + (g.bounce || 0) * -6; drawBittenAt(g, c, p, q.x, q.y + (one ? g.U * .04 : 0) + bob, q.r); });
      if (!s.n && !g.finishedAll) { const q = sl[0]; drawTapHint(c, q.x, q.y - q.r * .4, g.U * .1, g.t); }
    }
  };
  // draws a piece with the bites taken out of it
  function drawBittenAt(g, c, p, x, y, R) {
    if (!p.bites || !p.bites.length) { drawPieceAt(c, p, x, y, R); return; }
    const dpr = g.dpr || 1, S = Math.ceil(R * 4 * dpr), oc = g.oc; if (oc.width !== S) { oc.width = S; oc.height = S; }
    const o = oc.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, S, S); o.setTransform(dpr, 0, 0, dpr, S / 2, S / 2);
    o.save(); o.translate(0, pieceBase(p, R)); drawPiece(o, p, R); o.restore();
    o.globalCompositeOperation = 'destination-out'; o.fillStyle = '#000'; for (const b of p.bites) { o.beginPath(); o.arc(b.x, b.y, b.r, 0, TAU); o.fill(); } o.globalCompositeOperation = 'source-over';
    c.drawImage(oc, x - S / 2 / dpr, y - S / 2 / dpr, S / dpr, S / dpr);
  }

  /* ---------------------------------------------------------------- loop, menu and drawing */
  const FONT = 'ui-rounded, "Baloo 2", "Nunito", system-ui, sans-serif';
  Object.assign(CookGame.prototype, {
    start() { this.resize(); this.enterMenu(); this.resize(); this.resume(); },
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); },
    pause() { this.running = false; cancelAnimationFrame(this.raf); if (this.drag) { this.drag.it.drag = false; this.drag.it.back = true; this.drag = null; } this.ptr = null; this.free = false; },
    destroy() { this.pause(); this.canvas.remove(); this.counter.el.remove(); if (SPG.cookGame === this) SPG.cookGame = null; },
    probe() { return { screen: this.screen, step: this.st && this.st.k, idx: this.stIdx, tray: this.tray.map(i => ({ id: i.id, x: i.x, y: i.y, used: i.used, kind: i.kind })), U: this.U, bx: this.bx, by: this.by, y1: this.y1, w: this.w, h: this.h, st: this.st && { fin: this.st.fin, canDone: this.st.canDone, state: this.st.state, i: this.st.i, units: (this.st.units || []).map(u => ({ id: u.id, x: u.x, y: u.y, state: u.state })) }, pieces: this.pieces.length, check: this.checkBtn(), menu: this.menuHit.map(m => ({ x: m.x, y: m.y, tab: m.tab, id: m.R && m.R.id })), want: this.wantIds(), tool: this.tool, flies: this.flies.length, trans: !!this.trans, finishedAll: this.finishedAll, arrow: !!this.arrow, slots: this.screen === 'cook' ? this.slots() : [] }; },

    sceneBoard(c, noBoard) {
      if (noBoard) return;
      const bw = Math.min(this.w * .94, this.SH * 1.7), bh = this.SH * .98; drawBoard(c, this.bx, this.by, bw, bh);
    },
    drawPlateAndPiece(c, piece, grow) {
      const B = H.stack.base(this), U = this.U;
      drawPlate(c, B.x, B.y + U * .02, U * .36);
      if (piece.shape && piece.type === 'stack') { c.save(); c.translate(B.x, B.y - this.R1 * .7); drawPiece(c, piece, this.R1); c.restore(); return; }
      c.save(); c.translate(B.x, B.y); drawPiece(c, piece, this.R1); c.restore();
    },
    layoutMenu() {
      const w = this.w, h = this.h; if (!w) return; this.menuHit = [];
      const ts = clamp(Math.min(w, h) * .14, 60, 104), ty = this.topY + ts / 2 + (this.narrow ? 0 : 6); this.ts = ts;
      CATS.forEach((cat, i) => this.menuHit.push({ x: w / 2 + (i - 1) * ts * 1.3, y: ty, r: ts * .55, tab: i }));
      const top = ty + ts * .72 + 10, bot = h - 12, rw = w - 24, rh = bot - top, wide = rw > rh * 1.15, cols = wide ? 3 : 2, rows = wide ? 2 : 3;
      const cs = Math.min(rw / cols, rh / rows) - 10; this.cs = cs; this.gridBox = { x: w / 2, y: top + rh / 2, w: cs * cols + 10 * cols + 16, h: cs * rows + 10 * rows + 16 };
      const list = RECIPES.filter(r => r.cat === this.tab); this.cards = [];
      list.forEach((R, i) => { const cx = w / 2 + ((i % cols) - (cols - 1) / 2) * (cs + 10), cy = top + rh / 2 + (Math.floor(i / cols) - (rows - 1) / 2) * (cs + 10); this.cards.push({ x: cx, y: cy, R }); this.menuHit.push({ x: cx, y: cy, r: cs * .52, R }); });
    },
    drawMenu(c) {
      const w = this.w, h = this.h, g = this.gridBox; drawBoard(c, g.x, g.y, g.w, g.h);
      this.menuHit.forEach(m => {
        if (m.tab == null) return; const sel = m.tab === this.tab, r = m.r * (sel ? 1.04 : .9), bob = sel ? Math.sin(this.t * 3) * 2 : 0;
        c.save(); c.translate(m.x, m.y + bob - (sel ? 4 : 0)); c.fillStyle = 'rgba(80,40,20,.25)'; rr(c, -r + 3, -r + 8, r * 2, r * 2, r * .3); c.fill();
        box(c, -r, -r, r * 2, r * 2, sel ? '#fff' : '#f3e0c8', r * .3); c.strokeStyle = sel ? '#ff6b9d' : '#d8b890'; c.lineWidth = sel ? 5 : 3; rr(c, -r, -r, r * 2, r * 2, r * .3); c.stroke();
        const sample = [RECIPES[0].sample, RECIPES[8].sample, RECIPES[13].sample][m.tab]; c.globalAlpha = sel ? 1 : .8; c.translate(0, r * .12); drawPiece(c, sample, r * (m.tab === 0 ? .5 : .42)); c.restore();
      });
      for (const cd of this.cards) {
        const cs = this.cs, R = cd.R, done = this.bag.done[R.id] || 0;
        c.save(); c.translate(cd.x, cd.y); c.fillStyle = 'rgba(80,40,20,.18)'; rr(c, -cs / 2 + 3, -cs / 2 + 7, cs, cs, cs * .1); c.fill();
        const gr = c.createLinearGradient(0, -cs / 2, 0, cs / 2); gr.addColorStop(0, '#fffdf8'); gr.addColorStop(1, '#fdeee4'); c.fillStyle = gr; rr(c, -cs / 2, -cs / 2, cs, cs, cs * .1); c.fill(); c.strokeStyle = done ? '#ffc93c' : '#ffb3d1'; c.lineWidth = done ? 5 : 3; rr(c, -cs / 2, -cs / 2, cs, cs, cs * .1); c.stroke();
        c.save(); c.translate(0, -cs * .06); drawPiece(c, R.sample, cs * (R.sample.type === 'multi' ? .3 : R.sample.type === 'sundae' ? .17 : R.sample.layers && R.sample.layers.length > 6 ? .24 : .27)); c.restore();
        c.fillStyle = '#5a3f5e'; c.textAlign = 'center'; c.textBaseline = 'middle'; const fs = Math.max(12, cs * .1); c.font = `800 ${fs}px ${FONT}`; if (c.measureText(R.name).width > cs * .9) { const ws = R.name.split(' '), mid = Math.ceil(ws.length / 2); c.font = `800 ${fs * .86}px ${FONT}`; c.fillText(ws.slice(0, mid).join(' '), 0, cs * .35); c.fillText(ws.slice(mid).join(' '), 0, cs * .35 + fs); } else c.fillText(R.name, 0, cs * .4);
        if (done) { art.star(c, cs * .36, -cs * .36, cs * .1, '#ffd54a', 0); c.fillStyle = '#7a4a10'; c.font = `800 ${cs * .085}px ${FONT}`; c.fillText(String(Math.min(99, done)), cs * .36, -cs * .35); }
        c.restore();
      }
    },
    drawStepBar(c) {
      const R = this.R, n = R.steps.length, sb = this.sb, w = this.w, left = this.narrow ? sb + 30 : 96, right = this.narrow ? w - 12 : w - 190;
      const sz = Math.min(sb * .9, (right - left) / n / 1.25), gap = sz * .28, tot = n * sz + (n - 1) * gap, x0 = this.narrow ? left + (right - left - tot) / 2 : (w - tot) / 2 + (this.narrow ? 0 : 0), y = this.topY + sb / 2;
      this.stepBarW = tot + 40;
      c.save(); c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, x0 - 14, y - sb * .56, tot + 28, sb * 1.12, sb * .56); c.fill(); c.restore();
      R.steps.forEach((sp, i) => {
        const cur = i === this.stIdx, done = i < this.stIdx, x = x0 + i * (sz + gap) + sz / 2, k = cur ? 1.12 + Math.sin(this.t * 4) * .04 : 1;
        c.save(); c.translate(x, y); c.scale(k, k); c.fillStyle = done ? '#bff0b0' : cur ? '#fff' : 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(0, 0, sz * .5, 0, TAU); c.fill(); c.strokeStyle = cur ? '#ff6b9d' : done ? '#5cc060' : '#e0c8b0'; c.lineWidth = cur ? 4 : 2.5; c.stroke();
        c.globalAlpha = done ? .55 : cur ? 1 : .6; c.save(); c.beginPath(); c.arc(0, 0, sz * .46, 0, TAU); c.clip(); stepIcon(c, sp.k, sz * .72, sp.id || (sp.ids && sp.ids[0]) || (sp.k === 'cut' ? this.cutters[0] : null)); c.restore(); c.globalAlpha = 1;
        if (done) { c.fillStyle = '#2fae4a'; c.beginPath(); c.arc(sz * .3, sz * .3, sz * .2, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(sz * .22, sz * .3); c.lineTo(sz * .29, sz * .37); c.lineTo(sz * .4, sz * .22); c.stroke(); }
        c.restore();
      });
      // back to the menu
      const mb = this.menuBtn(); c.save(); c.translate(mb.x, mb.y); c.fillStyle = 'rgba(80,40,20,.2)'; c.beginPath(); c.arc(2, 4, mb.r, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, mb.r, 0, TAU); c.fill(); c.strokeStyle = '#ff6b9d'; c.lineWidth = 3; c.stroke();
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.fillStyle = '#ff9ec8'; rr(c, dx * mb.r * .5 - mb.r * .22, dy * mb.r * .5 - mb.r * .22, mb.r * .44, mb.r * .44, mb.r * .1); c.fill(); } c.restore();
    },
    drawTray(c, dt) {
      const w = this.w, h = this.h, th = this.th, pad = 8;
      c.save(); c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, pad + 3, h - th + 6, w - pad * 2, th - 8, th * .2); c.fill();
      const gr = c.createLinearGradient(0, h - th, 0, h); gr.addColorStop(0, '#fff8ee'); gr.addColorStop(1, '#fbe6d4'); c.fillStyle = gr; rr(c, pad, h - th + 2, w - pad * 2, th - 8, th * .2); c.fill(); c.strokeStyle = '#ffb3d1'; c.lineWidth = 4; rr(c, pad, h - th + 2, w - pad * 2, th - 8, th * .2); c.stroke(); c.restore();
      const want = this.wantIds(), glowOn = this.idle > 4.5 || (this.st && this.st.k === 'stack');
      for (const it of this.tray) {
        it.glow = lerp(it.glow, want.includes(it.id) && glowOn ? 1 : 0, Math.min(1, dt * 6)); it.wig = Math.max(0, it.wig - dt * 2.2);
        if (it.back) { it.x = lerp(it.x, it.hx, Math.min(1, dt * 14)); it.y = lerp(it.y, it.hy, Math.min(1, dt * 14)); if (Math.hypot(it.x - it.hx, it.y - it.hy) < 1.5) { it.back = false; it.x = it.hx; it.y = it.hy; } }
        else if (!it.drag && !it.fly) { it.x = lerp(it.x, it.hx, Math.min(1, dt * 9)); it.y = lerp(it.y, it.hy, Math.min(1, dt * 9)); }
        c.save(); c.translate(it.x, it.y); const lift = it.drag ? 1.25 : 1, pul = 1 + it.glow * Math.sin(this.t * 7) * .07; c.scale(lift * pul, lift * pul); c.rotate(Math.sin(this.t * 40) * it.wig * .25);
        if (it.drag) { c.fillStyle = 'rgba(80,40,20,.18)'; c.beginPath(); c.ellipse(4, it.r * .9, it.r * .8, it.r * .25, 0, 0, TAU); c.fill(); }
        if (it.glow > .01 || (it.kind === 'tool' && this.tool === it.id)) { const sel = it.kind === 'tool' && this.tool === it.id; c.fillStyle = sel ? 'rgba(255,107,157,.28)' : `rgba(255,224,102,${.5 * it.glow + .1})`; c.beginPath(); c.arc(0, 0, it.r * 1.12, 0, TAU); c.fill(); if (sel) { c.strokeStyle = '#ff6b9d'; c.lineWidth = 4; c.stroke(); } }
        else { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(0, 0, it.r * 1.05, 0, TAU); c.fill(); c.strokeStyle = 'rgba(224,200,176,.8)'; c.lineWidth = 2; c.stroke(); }
        if (it.used) c.globalAlpha = .25;
        const s = it.r * 1.75;
        if (it.kind === 'cutter') cutterArt(c, it.id, it.r * .72, this.t);
        else if (it.kind === 'dough') ING.dough(c, s * 1.2);
        else if (it.kind === 'batter') drawBowl(c, 0, it.r * .05, it.r * .8, { fill: .8, items: [], col: this.mix ? this.mix.final : BATTER, final: this.mix ? this.mix.final : BATTER, stirred: 1 }, 0);
        else (ING[it.id] || ING.flour)(c, s);
        c.restore();
      }
      // chef
      const ch = this.chefPos(), s = this.st, r = ch.r, hop = this.chefBounce > 0 ? Math.sin(this.chefBounce * 3) * 8 : this.idle > 4.5 ? Math.abs(Math.sin(this.t * 5)) * 6 : 0; this.chefBounce = Math.max(0, (this.chefBounce || 0) - dt * 2);
      c.save(); c.translate(ch.x, ch.y + r * .15 - hop); art.avatar(c, 'bear', r * .95, { mood: 'happy' });
      c.fillStyle = '#fff'; c.strokeStyle = '#d8d0e0'; c.lineWidth = 2; rr(c, -r * .55, -r * 1.25, r * 1.1, r * .55, r * .1); c.fill(); c.stroke(); for (const dx of [-.45, 0, .45]) { c.beginPath(); c.arc(dx * r, -r * 1.42, r * .38, 0, TAU); c.fill(); c.stroke(); } c.fillStyle = '#fff'; c.fillRect(-r * .5, -r * 1.3, r * 1.0, r * .5);
      c.restore();
      if (s && !this.finishedAll) {
        const k = s.k, sp = s.spec; let id = null;
        if (k === 'add') id = (s.left && s.left[0]) || sp.ids[0]; else if (k === 'grill') id = sp.id; else if (k === 'stack') id = sp.order[Math.min(s.i, sp.order.length - 1)]; else if (k === 'cut') id = this.cutters[0]; else if (k === 'decorate') id = this.tool || sp.tools[0];
        const bx = ch.x + r * 1.5, by = ch.y - r * 1.9 - hop * .5, br = r * 1.05;
        c.save(); c.translate(bx, by); c.fillStyle = 'rgba(80,40,20,.18)'; c.beginPath(); c.arc(3, 5, br, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.strokeStyle = '#ff9ec8'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, br, 0, TAU); c.fill(); c.stroke(); tri(c, [[-br * .75, br * .5], [-br * 1.15, br * 1.1], [-br * .3, br * .85]], '#fff'); c.beginPath(); c.arc(0, 0, br * .9, 0, TAU); c.clip();
        const pul = 1 + (this.idle > 4.5 ? Math.sin(this.t * 6) * .06 : 0); c.scale(pul, pul); stepIcon(c, k === 'fill' ? 'add' : k, br * 1.5, k === 'fill' ? (sp.what === 'dough' ? 'dough' : 'batter') : id); c.restore();
      }
    },
    drawFlies(c) {
      for (const f of this.flies) { const u = ease(clamp(f.t / f.dur, 0, 1)); const x = lerp(f.x0, f.x1, u), y = lerp(f.y0, f.y1, u) - Math.sin(u * Math.PI) * this.U * .1; c.save(); c.translate(x, y); const k = lerp(1.2, .85, u); c.scale(k, k); c.fillStyle = 'rgba(80,40,20,.15)'; c.beginPath(); c.ellipse(3, f.size * .5, f.size * .5, f.size * .15, 0, 0, TAU); c.fill(); f.draw(c, f.size * 2); c.restore(); }
    },
    drawCheck(c) {
      const cb = this.checkBtn(); if (!cb) return; const k = 1 + Math.sin(this.t * 6) * .06;
      c.save(); c.translate(cb.x, cb.y); c.scale(k, k); c.fillStyle = 'rgba(80,40,20,.25)'; c.beginPath(); c.arc(3, 6, cb.r, 0, TAU); c.fill(); c.fillStyle = '#4fcf6a'; c.beginPath(); c.arc(0, 0, cb.r, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = cb.r * .14; c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = cb.r * .2; c.lineCap = c.lineJoin = 'round'; c.beginPath(); c.moveTo(-cb.r * .42, 0); c.lineTo(-cb.r * .1, cb.r * .32); c.lineTo(cb.r * .44, -cb.r * .3); c.stroke(); c.restore();
    },
    drawArrow(c) {
      if (!this.arrow) return; const a = this.arrowPos(), k = 1 + Math.sin(this.t * 6) * .06;
      c.save(); c.translate(a.x, a.y); c.scale(k, k); c.fillStyle = 'rgba(80,40,20,.25)'; c.beginPath(); c.arc(3, 6, a.r, 0, TAU); c.fill(); c.fillStyle = '#4fcf6a'; c.beginPath(); c.arc(0, 0, a.r, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = a.r * .12; c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-a.r * .28, -a.r * .42); c.lineTo(a.r * .44, 0); c.lineTo(-a.r * .28, a.r * .42); c.closePath(); c.fill(); c.restore();
    },
    drawTrans(c) {
      const T = this.trans; if (!T) return; const w = this.w, h = this.h, x0 = w - T.t * 2.2 * w, pw = w * 1.2;
      c.save(); const gr = c.createLinearGradient(x0, 0, x0 + pw, 0); gr.addColorStop(0, '#ffd1e3'); gr.addColorStop(.5, '#fff1f6'); gr.addColorStop(1, '#ffd1e3'); c.fillStyle = gr; c.fillRect(x0, 0, pw, h);
      c.strokeStyle = '#ff9ec8'; c.lineWidth = 8; c.strokeRect(x0 + 6, 6, pw - 12, h - 12);
      const cx = x0 + pw / 2, cy = h / 2, r = Math.min(w, h) * .14; c.fillStyle = '#4fcf6a'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = r * .22; c.lineCap = c.lineJoin = 'round'; c.beginPath(); c.moveTo(cx - r * .42, cy); c.lineTo(cx - r * .1, cy + r * .32); c.lineTo(cx + r * .44, cy - r * .3); c.stroke();
      for (let i = 0; i < 8; i++) art.star(c, cx + Math.cos(i / 8 * TAU + T.t * 4) * r * 1.5, cy + Math.sin(i / 8 * TAU + T.t * 4) * r * 1.5, r * .16, '#ffd54a', T.t * 3 + i);
      c.restore();
    },
    tick(now) {
      if (!this.running) return; const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt; this.idle += dt;
      this.update(dt); this.draw(dt); this.raf = requestAnimationFrame(this.tick);
    },
    update(dt) {
      this.fx.update(dt);
      if (this.screen !== 'cook') return;
      const s = this.st;
      for (const f of this.flies) { f.t += dt; if (!f.done && f.t >= f.dur) { f.done = true; f.cb && f.cb(); } } this.flies = this.flies.filter(f => !f.done);
      if (this.trans) { const T = this.trans; T.t += dt / .95; if (T.t >= .5 && !T.mid) { T.mid = true; this.stIdx++; this.beginStep(); } if (T.t >= 1) this.trans = null; return; }
      if (s) {
        if (H[s.k].update) H[s.k].update(this, s, dt);
        if (s.fin && s.k !== 'serve') { s.finT -= dt; if (s.finT <= 0 && !this.flies.length) this.nextStep(); }
        if (!s.fin && this.idle > 16 && !this.drag) { this.idle = 6; this.hintSay(); this.chefBounce = 1; }
      }
      if (this.arrow) { this.arrow.t += dt; if (this.arrow.t > 25) this.enterMenu(); }
    },
    draw(dt = .016) {
      const c = this.ctx, w = this.w, h = this.h; if (!w) return;
      drawTable(c, w, h, this.t);
      if (this.screen === 'menu') { this.drawMenu(c); this.fx.draw(c); return; }
      this.drawStepBar(c);
      const s = this.st; if (s) H[s.k].draw(this, s, c);
      this.drawFlies(c); this.drawTray(c, dt); this.drawCheck(c); this.drawArrow(c); this.fx.draw(c); this.drawTrans(c);
    }
  });

  /* ---------------------------------------------------------------- hub card */
  SPG.games.push({
    id: 'cook', name: 'Sprout Kitchen', order: 12,
    icon(c, w, h) {
      drawTable(c, w, h, 0);
      const bw = w * .86, bh = h * .78; drawBoard(c, w / 2, h * .52, bw, bh);
      const R = Math.min(w, h) * .17;
      c.save(); c.translate(w * .3, h * .42); c.rotate(-.1); drawCookie(c, { shape: 'bear', baked: 1, deco: { fill: '#ff9ec8', dots: [{ id: 'candy', x: -.25, y: -.1, col: '#5cc8f2' }, { id: 'candy', x: .25, y: -.1, col: '#5cc8f2' }, { id: 'sprinkles', x: 0, y: .3, col: '#ffd54a', rot: .4 }] } }, R * 1.25); c.restore();
      c.save(); c.translate(w * .68, h * .36); drawCookie(c, { shape: 'star', baked: 1, deco: { fill: '#ffe066' } }, R * 1.05); c.restore();
      c.save(); c.translate(w * .62, h * .72); drawPiece(c, RECIPES[12].sample, R * .62); c.restore();
      c.save(); c.translate(w * .22, h * .76); drawPin(c, 0, 0, R * 1.0, -.15); c.restore();
    },
    create: host => new CookGame(host)
  });
})();
