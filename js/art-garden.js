// Garden extras: more plants, more garden friends, and the shovel. Extends SPG.art.
(() => {
  const SPG = window.SPG;
  const art = SPG.art;
  const { face, leaf, rr, INK, TAU } = art;

  /* ------------------------------------------------------------ more plants */
  art.PLANTS.push(
    { id: 'pumpkin', name: 'Pumpkin', creatures: ['hedgehog', 'mouse'], unlock: 3 },
    { id: 'carrot', name: 'Carrot', creatures: ['mouse', 'bunny'], unlock: 6 },
    { id: 'lavender', name: 'Lavender', creatures: ['dragonfly', 'bee', 'butterfly'], unlock: 10 },
    { id: 'rose', name: 'Rose', creatures: ['bird', 'ladybug', 'dragonfly'], unlock: 15 }
  );
  art.PLANTS.forEach(p => { p.unlock = p.unlock || 0; });

  const baseCreature = art.creature, basePlant = art.plant;
  const GREEN = '#59b96e', DARK = '#3f9a5a';

  function extraPlant(c, type, stage, s, t) {
    const sway = Math.sin(t * 1.6 + type.length) * s * .015;
    c.lineCap = 'round'; c.lineJoin = 'round';
    const leafPair = (y, len, col = GREEN, spread = .55) => { leaf(c, 0, y, len, -spread, col); leaf(c, 0, y, len, Math.PI + spread, col); };
    if (type === 'pumpkin') {
      if (stage === 1) { c.strokeStyle = GREEN; c.lineWidth = s * .04; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-sway, -s * .1, 0, -s * .18); c.stroke(); leafPair(-s * .16, s * .18); return; }
      if (stage === 2) {
        c.strokeStyle = GREEN; c.lineWidth = s * .045; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-s * .12, -s * .12, -s * .3, -s * .1); c.stroke();
        leaf(c, -s * .1, -s * .08, s * .26, -2.5, DARK); leaf(c, s * .02, -s * .06, s * .26, -.5, GREEN);
        c.fillStyle = '#8bd06a'; c.beginPath(); c.ellipse(s * .04, -s * .1, s * .1, s * .09, 0, 0, TAU); c.fill();
        c.fillStyle = '#6bb84f'; c.beginPath(); c.ellipse(s * .01, -s * .1, s * .04, s * .085, 0, 0, TAU); c.fill();
        return;
      }
      // grown: big ribbed pumpkin
      leaf(c, -s * .12, -s * .14, s * .34, -2.7, DARK); leaf(c, s * .12, -s * .14, s * .34, -.45, GREEN);
      c.strokeStyle = GREEN; c.lineWidth = s * .03; c.beginPath(); c.moveTo(s * .22, -s * .04); c.bezierCurveTo(s * .42, -s * .04, s * .46, -s * .2, s * .36, -s * .2); c.bezierCurveTo(s * .3, -s * .2, s * .32, -s * .12, s * .38, -s * .12); c.stroke();
      const R = s * .27, cy = -R * .95;
      const body = (rx, ry, x, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, cy, rx, ry, 0, 0, TAU); c.fill(); };
      body(R * .62, R * .95, -R * .62, '#f08a1c'); body(R * .62, R * .95, R * .62, '#f08a1c');
      body(R * .68, R * 1.0, -R * .3, '#ff9d2e'); body(R * .68, R * 1.0, R * .3, '#ff9d2e'); body(R * .62, R * 1.02, 0, '#ffae4a');
      c.strokeStyle = 'rgba(200,100,10,.35)'; c.lineWidth = s * .012; for (const x of [-R * .45, R * .45]) { c.beginPath(); c.ellipse(x, cy, R * .3, R * .95, 0, 0, TAU); c.stroke(); }
      c.strokeStyle = '#6b8f3a'; c.lineWidth = s * .05; c.beginPath(); c.moveTo(0, cy - R * .92); c.quadraticCurveTo(s * .02, cy - R * 1.2, s * .08, cy - R * 1.22); c.stroke();
      c.save(); c.translate(0, cy + R * .1); face(c, R * .95, { mood: 'happy' }); c.restore();
      return;
    }
    if (type === 'carrot') {
      const fronds = stage === 1 ? 2 : stage === 2 ? 4 : 7;
      for (let i = 0; i < fronds; i++) {
        const a = -Math.PI / 2 + (i - (fronds - 1) / 2) * (stage === 3 ? .3 : .38) + sway / s * 2;
        const len = s * (stage === 1 ? .2 : stage === 2 ? .38 : .5) * (1 - Math.abs(i - (fronds - 1) / 2) * .05);
        c.strokeStyle = i % 2 ? GREEN : DARK; c.lineWidth = s * .035;
        c.beginPath(); c.moveTo(0, -s * .05); c.quadraticCurveTo(Math.cos(a) * len * .5, -s * .05 + Math.sin(a) * len * .5, Math.cos(a) * len, -s * .05 + Math.sin(a) * len); c.stroke();
        if (stage >= 2) for (const k of [.55, .8]) { const px = Math.cos(a) * len * k, py = -s * .05 + Math.sin(a) * len * k; leaf(c, px, py, len * .3, a - .7, i % 2 ? GREEN : DARK); leaf(c, px, py, len * .3, a + .7, i % 2 ? GREEN : DARK); }
      }
      if (stage === 3) {
        const g = c.createLinearGradient(0, -s * .12, 0, 0); g.addColorStop(0, '#ffa64d'); g.addColorStop(1, '#f07c1a');
        c.fillStyle = g; c.beginPath(); c.ellipse(0, -s * .01, s * .14, s * .1, 0, Math.PI, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-s * .06, -s * .07, s * .035, s * .02, -.5, 0, TAU); c.fill();
        c.save(); c.translate(0, -s * .035); face(c, s * .1, { mood: 'happy' }); c.restore();
      }
      return;
    }
    if (type === 'lavender') {
      const stems = stage === 1 ? 2 : stage === 2 ? 3 : 5;
      for (let i = 0; i < stems; i++) {
        const k = (i - (stems - 1) / 2), lean = k * s * .07 + sway * (1 + Math.abs(k) * .3);
        const h = s * (stage === 1 ? .2 : stage === 2 ? .4 : .62) * (1 - Math.abs(k) * .08);
        c.strokeStyle = '#7fb98a'; c.lineWidth = s * .03; c.beginPath(); c.moveTo(k * s * .03, 0); c.quadraticCurveTo(lean * .4, -h * .5, lean, -h); c.stroke();
        if (stage === 1) { leaf(c, lean, -h * .9, s * .1, -1.2 + k * .3, '#8fc99a'); continue; }
        if (stage === 2) { c.fillStyle = '#b9a4e6'; c.beginPath(); c.ellipse(lean, -h - s * .03, s * .035, s * .06, 0, 0, TAU); c.fill(); continue; }
        const n = 7;
        for (let j = 0; j < n; j++) { const f = j / (n - 1), y = -h - s * .02 + f * s * .17, w = s * (.05 - f * .022); c.fillStyle = ['#a688e0', '#b79ae8', '#9a7cd8'][j % 3]; c.beginPath(); c.ellipse(lean + (j % 2 ? w * .5 : -w * .5), y, w, s * .035, 0, 0, TAU); c.fill(); }
        if (i === (stems - 1) / 2) { c.save(); c.translate(lean, -h + s * .01); face(c, s * .085, { mood: 'happy', cheeks: false }); c.restore(); }
      }
      if (stage >= 2) { leaf(c, 0, -s * .05, s * .22, -.9, '#8fc99a'); leaf(c, 0, -s * .05, s * .22, Math.PI + .9, '#8fc99a'); }
      return;
    }
    if (type === 'rose') {
      const h = s * (stage === 1 ? .22 : stage === 2 ? .46 : .62);
      const top = { x: sway * stage / 3, y: -h };
      c.strokeStyle = '#3f8f5a'; c.lineWidth = s * .045; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-sway, -h * .5, top.x, top.y); c.stroke();
      if (stage >= 2) { c.fillStyle = '#3f8f5a'; for (const [f, d] of [[.3, -1], [.5, 1]]) { const y = -h * f; c.beginPath(); c.moveTo(d * s * .02, y); c.lineTo(d * s * .07, y - s * .03); c.lineTo(d * s * .02, y - s * .05); c.fill(); } }
      leafPair(-h * (stage === 1 ? .8 : .35), s * (stage === 1 ? .15 : .24), '#3f8f5a', .5);
      if (stage === 2) { c.fillStyle = '#e8577f'; c.beginPath(); c.moveTo(top.x, top.y - s * .13); c.quadraticCurveTo(top.x + s * .08, top.y - s * .05, top.x + s * .04, top.y); c.lineTo(top.x - s * .04, top.y); c.quadraticCurveTo(top.x - s * .08, top.y - s * .05, top.x, top.y - s * .13); c.fill(); c.fillStyle = '#3f8f5a'; c.beginPath(); c.moveTo(top.x - s * .06, top.y); c.lineTo(top.x, top.y + s * .03); c.lineTo(top.x + s * .06, top.y); c.fill(); }
      if (stage === 3) {
        const R = s * .19; c.save(); c.translate(top.x, top.y - R * .3);
        c.fillStyle = '#3f8f5a'; c.beginPath(); c.ellipse(0, R * .85, R * .5, R * .22, 0, 0, TAU); c.fill();
        for (const [r, col] of [[1, '#d63a63'], [.82, '#e8577f'], [.6, '#f2779a']]) { for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * TAU / 6 + r); c.fillStyle = col; c.beginPath(); c.ellipse(R * .5 * r, 0, R * .55 * r, R * .42 * r, 0, 0, TAU); c.fill(); c.restore(); } }
        c.fillStyle = '#f9a3bb'; c.beginPath(); c.arc(0, 0, R * .5, 0, TAU); c.fill();
        face(c, R * .6, { mood: 'happy' }); c.restore();
      }
    }
  }

  art.plant = function plant(c, type, stage, s, t = 0, pop = 0) {
    if (!['pumpkin', 'carrot', 'lavender', 'rose'].includes(type) || stage === 0) return basePlant(c, type, stage, s, t, pop);
    c.save();
    const sc = 1 + Math.sin(Math.min(pop, 1) * Math.PI) * .12 * (1 - Math.min(pop, 1) * .3);
    if (pop > 0 && pop < 1) c.scale(1 + (sc - 1) * .6, sc);
    extraPlant(c, type, stage, s, t);
    c.restore();
  };

  /* ------------------------------------------------------------ more garden friends */
  art.CREATURES.push(
    { id: 'hedgehog', name: 'Hedgehog', fly: false }, { id: 'frog', name: 'Frog', fly: false }, { id: 'duckling', name: 'Duckling', fly: false },
    { id: 'mouse', name: 'Mouse', fly: false }, { id: 'turtle', name: 'Turtle', fly: false }, { id: 'dragonfly', name: 'Dragonfly', fly: true }
  );

  function eyeDots(c, x, y, gap, r) {
    for (const sd of [-1, 1]) { c.fillStyle = INK; c.beginPath(); c.ellipse(x + sd * gap, y, r * .9, r * 1.15, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + sd * gap - r * .3, y - r * .4, r * .38, 0, TAU); c.fill(); }
  }

  const drawNew = {
    hedgehog(c, s) {
      // spiky back
      c.fillStyle = '#7d5c4a'; c.beginPath();
      const n = 16; for (let i = 0; i <= n; i++) { const a = Math.PI * 1.02 + (i / n) * Math.PI * .96, r1 = i % 2 ? s * .96 : s * .7; c.lineTo(-s * .05 + Math.cos(a) * r1, s * .28 + Math.sin(a) * r1 * .82); }
      c.closePath(); c.fill();
      c.fillStyle = '#9a755f'; c.beginPath(); c.ellipse(-s * .05, s * .18, s * .72, s * .56, 0, Math.PI, TAU); c.fill();
      c.strokeStyle = '#b8917a'; c.lineWidth = s * .03; c.lineCap = 'round'; for (let i = 0; i < 7; i++) { const a = Math.PI * 1.15 + i * .28; c.beginPath(); c.moveTo(-s * .05 + Math.cos(a) * s * .5, s * .22 + Math.sin(a) * s * .4); c.lineTo(-s * .05 + Math.cos(a) * s * .86, s * .22 + Math.sin(a) * s * .7); c.stroke(); }
      // feet, belly, face
      c.fillStyle = '#c99d7f'; for (const x of [-.2, .35]) { c.beginPath(); c.ellipse(x * s, s * .64, s * .13, s * .09, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#f2d8bd'; c.beginPath(); c.ellipse(s * .05, s * .34, s * .6, s * .34, 0, 0, TAU); c.fill();
      c.fillStyle = '#f7e3cd'; c.beginPath(); c.ellipse(s * .42, s * .16, s * .38, s * .34, 0, 0, TAU); c.fill();
      c.fillStyle = '#e9c9ab'; c.beginPath(); c.ellipse(s * .74, s * .2, s * .2, s * .15, .15, 0, TAU); c.fill();
      c.fillStyle = INK; c.beginPath(); c.arc(s * .9, s * .17, s * .06, 0, TAU); c.fill();
      eyeDots(c, s * .5, s * .06, s * .14, s * .06);
      c.fillStyle = 'rgba(255,110,140,.4)'; c.beginPath(); c.ellipse(s * .36, s * .22, s * .07, s * .045, 0, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = s * .03; c.beginPath(); c.arc(s * .68, s * .26, s * .07, .2, 1.4); c.stroke();
    },
    frog(c, s) {
      c.fillStyle = '#5fbf4a'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .62, s * .5, s * .22, s * .14, sd * .3, 0, TAU); c.fill(); }
      const g = c.createRadialGradient(-s * .2, -s * .1, s * .1, 0, s * .2, s * .9); g.addColorStop(0, '#9be36f'); g.addColorStop(1, '#5fbf4a');
      c.fillStyle = g; c.beginPath(); c.ellipse(0, s * .16, s * .72, s * .56, 0, 0, TAU); c.fill();
      c.fillStyle = '#e4f8bd'; c.beginPath(); c.ellipse(0, s * .34, s * .46, s * .3, 0, 0, TAU); c.fill();
      for (const sd of [-1, 1]) { c.fillStyle = '#7fd35a'; c.beginPath(); c.arc(sd * s * .36, -s * .3, s * .26, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(sd * s * .36, -s * .3, s * .18, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(sd * s * .36, -s * .28, s * .1, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(sd * s * .33, -s * .32, s * .035, 0, TAU); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = s * .045; c.lineCap = 'round'; c.beginPath(); c.arc(0, s * .08, s * .36, .25, Math.PI - .25); c.stroke();
      c.fillStyle = 'rgba(255,110,140,.4)'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .5, s * .2, s * .1, s * .06, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#5fbf4a'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .3, s * .66, s * .15, s * .08, 0, 0, TAU); c.fill(); }
    },
    duckling(c, s) {
      c.fillStyle = '#ff9d3a'; for (const x of [-.12, .18]) { c.beginPath(); c.moveTo(x * s - s * .12, s * .74); c.lineTo(x * s + s * .14, s * .74); c.lineTo(x * s + s * .04, s * .6); c.closePath(); c.fill(); }
      const g = c.createRadialGradient(-s * .2, s * .0, s * .1, 0, s * .2, s * .8); g.addColorStop(0, '#fff09a'); g.addColorStop(1, '#ffd23f');
      c.fillStyle = g; c.beginPath(); c.ellipse(-s * .05, s * .22, s * .66, s * .52, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffc61f'; c.beginPath(); c.ellipse(-s * .2, s * .28, s * .32, s * .2, -.4, 0, TAU); c.fill();
      c.fillStyle = g; c.beginPath(); c.arc(s * .3, -s * .34, s * .44, 0, TAU); c.fill();
      c.strokeStyle = '#ffc61f'; c.lineWidth = s * .05; c.lineCap = 'round'; c.beginPath(); c.moveTo(s * .25, -s * .77); c.quadraticCurveTo(s * .2, -s * .95, s * .36, -s * .92); c.moveTo(s * .34, -s * .77); c.quadraticCurveTo(s * .4, -s * .93, s * .52, -s * .86); c.stroke();
      c.fillStyle = '#ff9d3a'; c.beginPath(); c.ellipse(s * .74, -s * .26, s * .22, s * .1, .1, 0, TAU); c.fill();
      c.fillStyle = '#e88420'; c.beginPath(); c.ellipse(s * .74, -s * .22, s * .2, s * .04, .1, 0, TAU); c.fill();
      eyeDots(c, s * .32, -s * .4, s * .0 + s * .0, s * .07);
      c.fillStyle = 'rgba(255,110,140,.4)'; c.beginPath(); c.ellipse(s * .22, -s * .22, s * .09, s * .055, 0, 0, TAU); c.fill();
    },
    mouse(c, s) {
      c.strokeStyle = '#e8a9b8'; c.lineWidth = s * .06; c.lineCap = 'round'; c.beginPath(); c.moveTo(-s * .55, s * .5); c.bezierCurveTo(-s * .95, s * .5, -s * .9, s * .1, -s * 1.05, s * .08); c.stroke();
      c.fillStyle = '#cdb9ab'; c.beginPath(); c.ellipse(0, s * .32, s * .58, s * .46, 0, 0, TAU); c.fill();
      c.fillStyle = '#e9dccf'; c.beginPath(); c.ellipse(0, s * .42, s * .36, s * .3, 0, 0, TAU); c.fill();
      for (const sd of [-1, 1]) { c.fillStyle = '#cdb9ab'; c.beginPath(); c.arc(sd * s * .4, -s * .42, s * .3, 0, TAU); c.fill(); c.fillStyle = '#ffc4d6'; c.beginPath(); c.arc(sd * s * .4, -s * .42, s * .18, 0, TAU); c.fill(); }
      c.fillStyle = '#d6c4b6'; c.beginPath(); c.arc(0, -s * .08, s * .5, 0, TAU); c.fill();
      c.fillStyle = '#e9dccf'; c.beginPath(); c.ellipse(0, s * .05, s * .3, s * .22, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(90,63,94,.35)'; c.lineWidth = s * .02; for (const sd of [-1, 1]) for (const dy of [-.02, .05]) { c.beginPath(); c.moveTo(sd * s * .18, s * (.1 + dy)); c.lineTo(sd * s * .52, s * (.06 + dy * 2)); c.stroke(); }
      eyeDots(c, 0, -s * .14, s * .2, s * .07);
      c.fillStyle = '#ff8aa3'; c.beginPath(); c.ellipse(0, s * .04, s * .06, s * .045, 0, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = s * .03; c.beginPath(); c.arc(0, s * .06, s * .1, .3, Math.PI - .3); c.stroke();
      c.fillStyle = 'rgba(255,110,140,.35)'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .34, s * .02, s * .08, s * .05, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#cdb9ab'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .22, s * .72, s * .13, s * .08, 0, 0, TAU); c.fill(); }
    },
    turtle(c, s) {
      c.fillStyle = '#8bd06a'; for (const x of [-.4, .3]) { c.beginPath(); c.ellipse(x * s, s * .5, s * .17, s * .14, 0, 0, TAU); c.fill(); }
      c.beginPath(); c.moveTo(-s * .7, s * .3); c.lineTo(-s * .95, s * .38); c.lineTo(-s * .68, s * .42); c.fill();
      c.fillStyle = '#8bd06a'; c.beginPath(); c.ellipse(s * .78, s * .08, s * .3, s * .26, 0, 0, TAU); c.fill();
      c.fillStyle = '#f3e6b9'; c.beginPath(); c.ellipse(0, s * .46, s * .72, s * .14, 0, 0, TAU); c.fill();
      const g = c.createRadialGradient(-s * .2, -s * .2, s * .1, 0, s * .1, s * .9); g.addColorStop(0, '#79c46b'); g.addColorStop(1, '#4a9f57');
      c.fillStyle = g; c.beginPath(); c.moveTo(-s * .78, s * .46); c.bezierCurveTo(-s * .8, -s * .55, s * .8, -s * .55, s * .78, s * .46); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(30,90,50,.35)'; c.lineWidth = s * .04; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-s * .25, -s * .28); c.lineTo(s * .25, -s * .28); c.lineTo(s * .42, s * .1); c.lineTo(s * .25, s * .46); c.moveTo(-s * .25, -s * .28); c.lineTo(-s * .42, s * .1); c.lineTo(-s * .25, s * .46); c.moveTo(-s * .42, s * .1); c.lineTo(s * .42, s * .1); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(-s * .38, -s * .18, s * .16, s * .07, -.6, 0, TAU); c.fill();
      c.save(); c.translate(s * .8, s * .06); face(c, s * .4, { mood: 'happy' }); c.restore();
    },
    dragonfly(c, s, t) {
      const flap = .55 + Math.abs(Math.sin(t * 22)) * .45;
      c.fillStyle = 'rgba(190,235,255,.78)'; c.strokeStyle = 'rgba(120,190,230,.8)'; c.lineWidth = s * .02;
      // two pairs of wings, up and back (drawn behind the body), flapping
      for (const [x, lean] of [[-.02, -.5], [-.3, -.62]]) for (const flip of [1, -1]) {
        c.save(); c.translate(x * s, -s * .04); c.scale(1, flip * flap); c.rotate(lean);
        c.beginPath(); c.ellipse(0, -s * .42, s * .11, s * .46, 0, 0, TAU); c.fill(); c.stroke(); c.restore();
      }
      for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#31b8c9' : '#5ad6e3'; c.beginPath(); c.ellipse(-s * .1 - i * s * .17, 0, s * .1, s * .07, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#5ad6e3'; c.beginPath(); c.ellipse(s * .12, 0, s * .27, s * .15, 0, 0, TAU); c.fill();
      c.fillStyle = '#4ac6d6'; c.beginPath(); c.arc(s * .46, -s * .02, s * .21, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(s * .5, -s * .06, s * .12, 0, TAU); c.fill();
      c.fillStyle = INK; c.beginPath(); c.arc(s * .53, -s * .05, s * .065, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(s * .55, -s * .075, s * .022, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = s * .03; c.beginPath(); c.arc(s * .52, s * .04, s * .09, .3, 1.5); c.stroke();
      c.fillStyle = 'rgba(255,110,140,.4)'; c.beginPath(); c.ellipse(s * .42, s * .06, s * .06, s * .035, 0, 0, TAU); c.fill();
    }
  };

  art.creature = function creature(c, kind, s, t = 0) {
    const fn = drawNew[kind];
    if (!fn) return baseCreature(c, kind, s, t);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; fn(c, s, t); c.restore();
  };

  /* ------------------------------------------------------------ tools */
  // Shovel: (x, y) is the tip of the blade; angle 0 = pointing straight down.
  art.shovel = function shovel(c, x, y, size, angle = 0) {
    c.save(); c.translate(x, y); c.rotate(angle); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#b07a48'; c.lineWidth = size * .09; c.beginPath(); c.moveTo(0, -size * .5); c.lineTo(0, -size * 1.55); c.stroke();
    c.strokeStyle = '#c99566'; c.lineWidth = size * .09; c.beginPath(); c.moveTo(-size * .17, -size * 1.58); c.lineTo(size * .17, -size * 1.58); c.stroke();
    const g = c.createLinearGradient(-size * .3, 0, size * .3, 0); g.addColorStop(0, '#c9d3dc'); g.addColorStop(.5, '#eef2f6'); g.addColorStop(1, '#a9b6c2');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(size * .42, -size * .1, size * .34, -size * .5, size * .2, -size * .58); c.lineTo(-size * .2, -size * .58); c.bezierCurveTo(-size * .34, -size * .5, -size * .42, -size * .1, 0, 0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,110,130,.45)'; c.lineWidth = size * .035; c.stroke();
    c.fillStyle = '#8d6a50'; rr(c, -size * .09, -size * .66, size * .18, size * .2, size * .04); c.fill();
    c.restore();
  };

  // A soft cartoon hand for patting the soil. (x, y) = middle of the palm.
  art.hand = function hand(c, x, y, size, press = 0) {
    c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round';
    const skin = '#ffe2c4', edge = '#eab991';
    c.fillStyle = '#ff9db8'; rr(c, -size * .46, size * .38, size * .92, size * .3, size * .1); c.fill();
    c.fillStyle = skin; c.strokeStyle = edge; c.lineWidth = size * .05;
    for (const [dx, dy, len, rot] of [[-.34, -.24, .3, -.16], [-.11, -.34, .34, -.04], [.12, -.34, .34, .04], [.34, -.24, .3, .16]]) { c.beginPath(); c.ellipse(dx * size, dy * size, size * .1, len * size, rot, 0, TAU); c.fill(); c.stroke(); }
    c.beginPath(); c.ellipse(-size * .5, size * .08, size * .1, size * .24, -.9, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(0, size * .06, size * .45, size * .42, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-size * .16, -size * .06, size * .1, size * .06, -.5, 0, TAU); c.fill();
    c.restore();
  };

  art.watering = function watering(c, x, y, size, tilt = 0) {
    c.save(); c.translate(x, y); c.rotate(tilt); c.lineCap = 'round';
    c.fillStyle = '#6ec6f2'; rr(c, -size * .5, -size * .34, size, size * .78, size * .16); c.fill();
    c.fillStyle = '#8ad4f7'; rr(c, -size * .44, -size * .28, size * .88, size * .2, size * .1); c.fill();
    c.strokeStyle = '#6ec6f2'; c.lineWidth = size * .13; c.beginPath(); c.arc(size * .42, size * .04, size * .3, -1.3, 1.3); c.stroke();
    c.beginPath(); c.moveTo(-size * .48, size * .25); c.lineTo(-size * .95, -size * .2); c.stroke();
    c.fillStyle = '#4fb3e8'; c.beginPath(); c.ellipse(-size * .99, -size * .26, size * .16, size * .09, -.9, 0, TAU); c.fill();
    c.restore();
  };
})();
