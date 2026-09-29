// Pets and rescue gear for "raining cats and dogs": cats, dogs, parachutes, firefighter friends, safety net.
// Also registers the cat and dog as garden friends. Extends SPG.art.
(() => {
  const SPG = window.SPG;
  const art = SPG.art;
  const { face, rr, INK, TAU } = art;

  const VARIANTS = {
    cat: [
      { base: '#ffb45e', stripe: '#e58a2f', belly: '#fff1dc', inner: '#ffb3c6' },
      { base: '#b9bfd0', stripe: '#8e96ad', belly: '#eef0f7', inner: '#ffb3c6' },
      { base: '#5b5468', stripe: '#3d3748', belly: '#8a8398', inner: '#ff9db8' },
      { base: '#fbf5ee', stripe: '#d9c9b8', belly: '#ffffff', inner: '#ffb3c6', patch: '#ffb45e' }
    ],
    dog: [
      { base: '#d6a56f', ear: '#8a5a3a', belly: '#f6e4c8', muzzle: '#f6e4c8' },
      { base: '#f4c96a', ear: '#d9982f', belly: '#fff2cf', muzzle: '#fff2cf' },
      { base: '#f7f2ea', ear: '#4a4356', belly: '#ffffff', muzzle: '#ffffff', patch: '#4a4356' },
      { base: '#a9b4c6', ear: '#6b768a', belly: '#e3e8f0', muzzle: '#e3e8f0' }
    ]
  };
  const CHUTES = ['#ff7a8a', '#4fb3e8', '#ffd54a', '#7ed957', '#b58cf0'];

  function eyes(c, s, y, gap, look = 0) {
    for (const sd of [-1, 1]) {
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(sd * gap, y, s * .13, s * .16, 0, 0, TAU); c.fill();
      c.fillStyle = INK; c.beginPath(); c.ellipse(sd * gap + look * s * .03, y + s * .015, s * .085, s * .115, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(sd * gap + look * s * .03 - s * .03, y - s * .04, s * .035, 0, TAU); c.fill();
    }
  }

  function cat(c, s, t, v, pose) {
    const walk = pose === 'walk', up = pose === 'fall' || pose === 'bounce', step = walk ? Math.sin(t * 9) : 0;
    c.lineCap = 'round'; c.lineJoin = 'round';
    // tail
    c.strokeStyle = v.base; c.lineWidth = s * .2;
    c.beginPath(); c.moveTo(s * .4, s * .62); c.bezierCurveTo(s * .95, s * .6, s * 1.02, s * .0, s * .72, -s * .08 + Math.sin(t * 3) * s * .07); c.stroke();
    c.strokeStyle = v.stripe; c.lineWidth = s * .2; c.beginPath(); c.moveTo(s * .82, s * .12); c.bezierCurveTo(s * .9, s * .04, s * .8, -s * .04, s * .72, -s * .08 + Math.sin(t * 3) * s * .07); c.stroke();
    // back feet
    c.fillStyle = v.base;
    for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .3 + (walk ? sd * step * s * .06 : 0), s * .95 - (walk ? Math.max(0, sd * step) * s * .12 : 0), s * .22, s * .13, 0, 0, TAU); c.fill(); }
    // body
    const g = c.createRadialGradient(-s * .2, s * .1, s * .1, 0, s * .45, s * .8); g.addColorStop(0, v.base); g.addColorStop(1, v.stripe);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, s * .45, s * .56, s * .54, 0, 0, TAU); c.fill();
    c.fillStyle = v.belly; c.beginPath(); c.ellipse(0, s * .58, s * .32, s * .36, 0, 0, TAU); c.fill();
    if (v.patch) { c.fillStyle = v.patch; c.beginPath(); c.ellipse(-s * .3, s * .3, s * .2, s * .22, .4, 0, TAU); c.fill(); }
    // front paws (raised for a parachute, otherwise resting)
    c.fillStyle = v.base;
    for (const sd of [-1, 1]) { c.beginPath(); if (up) c.ellipse(sd * s * .66, -s * .1, s * .15, s * .2, sd * .3, 0, TAU); else c.ellipse(sd * s * .2, s * .92, s * .15, s * .11, 0, 0, TAU); c.fill(); }
    if (up) { c.strokeStyle = v.base; c.lineWidth = s * .2; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * s * .4, s * .3); c.lineTo(sd * s * .64, -s * .06); c.stroke(); } }
    // head
    const hg = c.createRadialGradient(-s * .2, -s * .5, s * .1, 0, -s * .28, s * .7); hg.addColorStop(0, v.base); hg.addColorStop(1, v.stripe);
    for (const sd of [-1, 1]) {
      c.fillStyle = v.base; c.beginPath(); c.moveTo(sd * s * .52, -s * .5); c.lineTo(sd * s * .5, -s * 1.05); c.lineTo(sd * s * .08, -s * .78); c.closePath(); c.fill();
      c.fillStyle = v.inner; c.beginPath(); c.moveTo(sd * s * .42, -s * .58); c.lineTo(sd * s * .42, -s * .9); c.lineTo(sd * s * .16, -s * .74); c.closePath(); c.fill();
    }
    c.fillStyle = hg; c.beginPath(); c.ellipse(0, -s * .3, s * .62, s * .54, 0, 0, TAU); c.fill();
    if (v.patch) { c.fillStyle = v.patch; c.beginPath(); c.ellipse(s * .3, -s * .5, s * .2, s * .16, .3, 0, TAU); c.fill(); }
    c.strokeStyle = v.stripe; c.lineWidth = s * .05; for (const dx of [-.14, 0, .14]) { c.beginPath(); c.moveTo(dx * s, -s * .82); c.lineTo(dx * s * 1.2, -s * .66); c.stroke(); }
    eyes(c, s, -s * .32, s * .24, walk ? Math.sign(step) * .4 : 0);
    c.fillStyle = 'rgba(255,110,140,.38)'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .42, -s * .14, s * .1, s * .06, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#ff8aa3'; c.beginPath(); c.moveTo(-s * .06, -s * .18); c.lineTo(s * .06, -s * .18); c.lineTo(0, -s * .1); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = s * .04;
    c.beginPath(); c.moveTo(0, -s * .1); c.lineTo(0, -s * .05); c.stroke();
    c.beginPath(); c.arc(-s * .07, -s * .05, s * .07, 0, Math.PI * .8); c.arc(s * .07, -s * .05, s * .07, Math.PI * .2, Math.PI); c.stroke();
    c.strokeStyle = 'rgba(90,63,94,.45)'; c.lineWidth = s * .025;
    for (const sd of [-1, 1]) for (const dy of [-.04, .04]) { c.beginPath(); c.moveTo(sd * s * .34, -s * .12 + dy * s); c.lineTo(sd * s * .72, -s * .16 + dy * s * 2); c.stroke(); }
  }

  function dog(c, s, t, v, pose) {
    const walk = pose === 'walk', up = pose === 'fall' || pose === 'bounce', step = walk ? Math.sin(t * 9) : 0;
    c.lineCap = 'round'; c.lineJoin = 'round';
    // wagging tail
    c.strokeStyle = v.base; c.lineWidth = s * .22; c.beginPath(); c.moveTo(s * .42, s * .62); c.quadraticCurveTo(s * .9, s * .5 + Math.sin(t * 12) * s * .1, s * .86, s * .1 + Math.sin(t * 12) * s * .12); c.stroke();
    c.fillStyle = v.base;
    for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .3 + (walk ? sd * step * s * .06 : 0), s * .95 - (walk ? Math.max(0, sd * step) * s * .12 : 0), s * .23, s * .13, 0, 0, TAU); c.fill(); }
    const g = c.createRadialGradient(-s * .2, s * .1, s * .1, 0, s * .45, s * .8); g.addColorStop(0, v.base); g.addColorStop(1, v.ear);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, s * .45, s * .58, s * .55, 0, 0, TAU); c.fill();
    c.fillStyle = v.belly; c.beginPath(); c.ellipse(0, s * .6, s * .34, s * .36, 0, 0, TAU); c.fill();
    if (v.patch) { c.fillStyle = v.patch; c.beginPath(); c.ellipse(s * .3, s * .3, s * .22, s * .2, -.3, 0, TAU); c.fill(); }
    c.fillStyle = v.base;
    for (const sd of [-1, 1]) { c.beginPath(); if (up) c.ellipse(sd * s * .68, -s * .1, s * .16, s * .2, sd * .3, 0, TAU); else c.ellipse(sd * s * .2, s * .92, s * .16, s * .11, 0, 0, TAU); c.fill(); }
    if (up) { c.strokeStyle = v.base; c.lineWidth = s * .22; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * s * .42, s * .3); c.lineTo(sd * s * .66, -s * .06); c.stroke(); } }
    // floppy ears behind the head
    c.fillStyle = v.ear;
    for (const sd of [-1, 1]) { c.save(); c.translate(sd * s * .56, -s * .38); c.rotate(sd * (.25 + Math.sin(t * 5) * .04 + (walk ? Math.abs(step) * .08 : 0))); c.beginPath(); c.ellipse(0, s * .2, s * .22, s * .42, 0, 0, TAU); c.fill(); c.restore(); }
    const hg = c.createRadialGradient(-s * .2, -s * .5, s * .1, 0, -s * .3, s * .7); hg.addColorStop(0, v.base); hg.addColorStop(1, v.ear);
    c.fillStyle = hg; c.beginPath(); c.ellipse(0, -s * .3, s * .6, s * .54, 0, 0, TAU); c.fill();
    if (v.patch) { c.fillStyle = v.patch; c.beginPath(); c.ellipse(-s * .28, -s * .42, s * .2, s * .2, .2, 0, TAU); c.fill(); }
    c.fillStyle = v.muzzle; c.beginPath(); c.ellipse(0, -s * .12, s * .32, s * .24, 0, 0, TAU); c.fill();
    eyes(c, s, -s * .4, s * .24, walk ? Math.sign(step) * .4 : 0);
    c.fillStyle = INK; c.beginPath(); c.ellipse(0, -s * .2, s * .1, s * .07, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-s * .03, -s * .22, s * .03, s * .02, 0, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = s * .04; c.beginPath(); c.moveTo(0, -s * .14); c.lineTo(0, -s * .07); c.stroke();
    c.beginPath(); c.arc(-s * .09, -s * .07, s * .09, .1, Math.PI * .85); c.arc(s * .09, -s * .07, s * .09, Math.PI * .15, Math.PI - .1); c.stroke();
    c.fillStyle = '#ff8aa3'; c.beginPath(); c.ellipse(0, s * .04, s * .08, s * .09 + Math.abs(Math.sin(t * 6)) * s * .02, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,110,140,.35)'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * s * .46, -s * .16, s * .09, s * .055, 0, 0, TAU); c.fill(); }
  }

  // Parachute canopy with strings to the paws.
  function parachute(c, s, color) {
    const r = s * 1.05, cy = -s * 1.55;
    c.strokeStyle = 'rgba(90,63,94,.5)'; c.lineWidth = s * .035; c.lineCap = 'round';
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * r * .95, cy + s * .04); c.lineTo(sd * s * .64, -s * .2); c.stroke(); }
    c.beginPath(); c.moveTo(0, cy + s * .04); c.lineTo(0, -s * .85); c.stroke();
    c.fillStyle = color; c.beginPath(); c.moveTo(-r, cy); c.arc(0, cy, r, Math.PI, 0);
    const n = 4; for (let i = 0; i < n; i++) { const x0 = r - (i * 2 * r) / n, x1 = r - ((i + 1) * 2 * r) / n; c.quadraticCurveTo((x0 + x1) / 2, cy + r * .3, x1, cy); }
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)';
    for (const [a, b] of [[-.5, -.15], [.15, .5]]) { c.beginPath(); c.moveTo(a * r, cy); c.quadraticCurveTo(a * r * 1.05, cy - r * .8, (a + b) / 2 * r, cy - r * .95); c.quadraticCurveTo(b * r * 1.05, cy - r * .8, b * r, cy); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-r * .45, cy - r * .55, r * .12, r * .06, -.6, 0, TAU); c.fill();
  }

  // pose: 'fall' (parachute out), 'bounce' (arms up), 'walk', 'sit'. (0, 0) is the middle of the body.
  art.pet = function pet(c, kind, variant, s, t = 0, pose = 'sit', chuteColor = 0) {
    const v = VARIANTS[kind][variant % VARIANTS[kind].length];
    c.save();
    if (pose === 'walk') c.translate(0, -Math.abs(Math.sin(t * 9)) * s * .06);
    if (pose === 'fall') { c.rotate(Math.sin(t * 2) * .05); parachute(c, s, CHUTES[chuteColor % CHUTES.length]); }
    (kind === 'cat' ? cat : dog)(c, s, t, v, pose);
    c.restore();
  };
  art.PET_VARIANTS = VARIANTS;

  /* ------------------------------------------------------------ rescue gear */
  // A friendly firefighter holding one corner of the net. Origin = feet. Hands reach out toward the net.
  // s is the head radius. Returns the hand position (relative to the origin).
  art.firefighter = function firefighter(c, kind, s, t, { dir = 1, wave = 0, walk = 0 } = {}) {
    const fur = { bear: '#c98b5b', fox: '#ff8a4c', panda: '#fff', bunny: '#fff', cat: '#ffb45e', frog: '#84d96a' }[kind] || '#ffe2c4';
    const step = Math.sin(t * 10) * walk;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    // legs and boots
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * step) * s * .35;
      c.fillStyle = '#2f3a5f'; rr(c, sd * s * .75 - s * .4, -s * 1.7, s * .8, s * 1.3 - lift, s * .3); c.fill();
      c.fillStyle = '#3d2c2c'; c.beginPath(); c.ellipse(sd * s * .75 + dir * s * .1, -s * .28 - lift, s * .55, s * .3, 0, 0, TAU); c.fill();
    }
    // back arm (down at the hip, or waving)
    const wv = wave ? Math.sin(t * 9) * .5 : 0;
    const back = wave ? { x: -dir * s * 2.1, y: -s * 5.4 + wv * s * .3 } : { x: -dir * s * 1.9, y: -s * 2.3 };
    c.strokeStyle = '#e8433f'; c.lineWidth = s * .85; c.beginPath(); c.moveTo(-dir * s * 1.15, -s * 3.6); c.lineTo(back.x, back.y); c.stroke();
    c.fillStyle = fur; c.beginPath(); c.arc(back.x, back.y, s * .42, 0, TAU); c.fill();
    // jacket
    const jg = c.createLinearGradient(-s * 1.3, 0, s * 1.3, 0); jg.addColorStop(0, '#f0524d'); jg.addColorStop(1, '#d93a3a');
    c.fillStyle = jg; rr(c, -s * 1.3, -s * 4, s * 2.6, s * 2.6, s * .7); c.fill();
    c.fillStyle = '#ffd54a'; rr(c, -s * 1.3, -s * 2.75, s * 2.6, s * .34, s * .1); c.fill(); rr(c, -s * 1.3, -s * 2.15, s * 2.6, s * .34, s * .1); c.fill();
    c.fillStyle = '#ffe98a'; for (const y of [-3.6, -3.25]) { c.beginPath(); c.arc(0, y * s, s * .1, 0, TAU); c.fill(); }
    c.fillStyle = '#2f3a5f'; rr(c, -s * 1.3, -s * 1.6, s * 2.6, s * .3, s * .1); c.fill();
    // net arm (raised toward the net)
    const hand = { x: dir * s * 2.25, y: -s * 4.35 };
    c.strokeStyle = '#e8433f'; c.lineWidth = s * .85; c.beginPath(); c.moveTo(dir * s * 1.15, -s * 3.6); c.lineTo(hand.x, hand.y); c.stroke();
    c.fillStyle = fur; c.beginPath(); c.arc(hand.x, hand.y, s * .45, 0, TAU); c.fill();
    // head and helmet
    c.save(); c.translate(0, -s * 4.95); art.avatar(c, kind, s); c.restore();
    c.save(); c.translate(0, -s * 4.95 - s * .55);
    c.fillStyle = '#e8433f'; c.beginPath(); c.moveTo(-s * 1.08, 0); c.bezierCurveTo(-s * 1.12, -s * 1.35, s * 1.12, -s * 1.35, s * 1.08, 0); c.closePath(); c.fill();
    c.fillStyle = '#c92f2f'; c.beginPath(); c.ellipse(0, 0, s * 1.25, s * .22, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(-s * .3, -s * .5); c.lineTo(s * .3, -s * .5); c.lineTo(s * .3, -s * .82); c.lineTo(0, -s * 1.02); c.lineTo(-s * .3, -s * .82); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-s * .55, -s * .8, s * .22, s * .1, -.6, 0, TAU); c.fill();
    c.restore(); c.restore();
    return hand;
  };

  // Safety net between two hands: a striped rescue mat that sags (and bounces) in the middle.
  art.safetyNet = function safetyNet(c, x0, x1, y, sag, thick = 26) {
    const top = u => y + 4 * sag * u * (1 - u);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const band = new Path2D(); band.moveTo(x0, y);
    for (let i = 0; i <= 24; i++) { const u = i / 24; band.lineTo(x0 + (x1 - x0) * u, top(u)); }
    for (let i = 24; i >= 0; i--) { const u = i / 24; band.lineTo(x0 + (x1 - x0) * u, top(u) + thick); }
    band.closePath();
    c.fillStyle = '#fff6e6'; c.fill(band);
    c.save(); c.clip(band);
    const n = Math.round((x1 - x0) / 34);
    for (let i = 0; i < n; i++) { if (i % 2) continue; const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n; c.fillStyle = 'rgba(232,67,63,.85)'; c.fillRect(a, y - 10, b - a, sag * 2 + thick + 40); }
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; for (let i = -6; i < n + 6; i++) { c.beginPath(); c.moveTo(x0 + (x1 - x0) * i / n, y - 10); c.lineTo(x0 + (x1 - x0) * (i + 1.5) / n, y + sag * 2 + thick + 40); c.stroke(); }
    c.restore();
    c.strokeStyle = '#e8433f'; c.lineWidth = 10; c.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24; i ? c.lineTo(x0 + (x1 - x0) * u, top(u)) : c.moveTo(x0, top(0)); } c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.setLineDash([12, 12]); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(90,63,94,.25)'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24; i ? c.lineTo(x0 + (x1 - x0) * u, top(u) + thick) : c.moveTo(x0, top(0) + thick); } c.stroke();
    c.restore();
  };

  /* ------------------------------------------------------------ garden friends */
  art.CREATURES.push({ id: 'cat', name: 'Kitty', fly: false }, { id: 'dog', name: 'Puppy', fly: false });
  const prev = art.creature;
  art.creature = function creature(c, kind, s, t = 0, moving = false) {
    if (kind !== 'cat' && kind !== 'dog') return prev(c, kind, s, t);
    c.save(); c.translate(0, -s * .12); art.pet(c, kind, kind === 'cat' ? 0 : 1, s * .6, t, moving ? 'walk' : 'sit'); c.restore();
  };
})();
