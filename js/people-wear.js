// The wardrobe for the Style Studio: dresses, tops, bottoms, shoes, hats, glasses, necklaces, wings, things to hold, and nail polish.
// Catalog entries are { id, name }. `look.<category>` holds the chosen id (or null), `look.<category>Col` an index into the color list.
// Body units: the child is 100 tall standing on y = 0; shoulders about y = -49, waist -36, head centre -73.
(() => {
  const SPG = window.SPG, art = SPG.art, P = SPG.people;
  const TAU = Math.PI * 2, rr = art.rr;
  // art.shade only takes '#rrggbb'; this one also takes the rgb() strings it returns, so shades can be nested.
  const shade = (col, amt) => {
    let r, g, b; const m = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(col);
    if (m) { r = +m[1]; g = +m[2]; b = +m[3]; } else { const n = parseInt(col.slice(1), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
    const f = v => Math.round(Math.max(0, Math.min(255, amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  };
  const W = P.wear;
  const col = (list, i) => list[((i | 0) % list.length + list.length) % list.length];
  const cloth = i => col(P.CLOTH, i);
  const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const grad = (c, y0, y1, k, dk = .18) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, shade(k, .14)); g.addColorStop(.5, k); g.addColorStop(1, shade(k, -dk)); return g; };
  const twinkle = (c, pts, t, k = '#fff') => { for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i], a = .5 + .5 * Math.sin(t * 3 + i * 1.7); c.globalAlpha = .25 + .6 * a; art.star(c, x, y, .9 + a * .8, k, 0); } c.globalAlpha = 1; };

  P.CATS = {
    dress: [{ id: 'ball', name: 'Ball gown' }, { id: 'aline', name: 'Party dress' }, { id: 'tutu', name: 'Ballet tutu' }, { id: 'mermaid', name: 'Mermaid gown' }, { id: 'petal', name: 'Flower fairy dress' }, { id: 'sun', name: 'Sundress' }],
    top: [{ id: 'tee', name: 'T-shirt' }, { id: 'tank', name: 'Tank top' }, { id: 'stripes', name: 'Stripy shirt' }, { id: 'hoodie', name: 'Hoodie' }, { id: 'sweater', name: 'Cozy sweater' }, { id: 'star', name: 'Star shirt' }, { id: 'vest', name: 'Fancy vest' }],
    bottom: [{ id: 'skirt', name: 'Skirt' }, { id: 'shorts', name: 'Shorts' }, { id: 'jeans', name: 'Jeans' }, { id: 'leggings', name: 'Leggings' }, { id: 'tutuskirt', name: 'Tutu skirt' }],
    shoes: [{ id: 'sneakers', name: 'Sneakers' }, { id: 'boots', name: 'Boots' }, { id: 'sandals', name: 'Sandals' }, { id: 'glass', name: 'Glass slippers' }, { id: 'flats', name: 'Ballet shoes' }],
    hat: [{ id: 'crown', name: 'Crown' }, { id: 'tiara', name: 'Tiara' }, { id: 'bow', name: 'Big bow' }, { id: 'flowers', name: 'Flower crown' }, { id: 'cap', name: 'Cap' }, { id: 'beanie', name: 'Woolly hat' }, { id: 'party', name: 'Party hat' }, { id: 'cowboy', name: 'Cowboy hat' }, { id: 'wizard', name: 'Wizard hat' }, { id: 'bunny', name: 'Bunny ears' }, { id: 'kitty', name: 'Kitty ears' }, { id: 'princess', name: 'Princess hat' }],
    face: [{ id: 'glasses', name: 'Glasses' }, { id: 'hearts', name: 'Heart glasses' }, { id: 'stars', name: 'Star glasses' }, { id: 'mask', name: 'Fancy mask' }, { id: 'stache', name: 'Silly mustache' }],
    neck: [{ id: 'pearls', name: 'Pearl necklace' }, { id: 'heart', name: 'Heart necklace' }, { id: 'star', name: 'Star necklace' }, { id: 'scarf', name: 'Scarf' }, { id: 'bowtie', name: 'Bow tie' }],
    back: [{ id: 'cape', name: 'Cape' }, { id: 'fairy', name: 'Fairy wings' }, { id: 'butterfly', name: 'Butterfly wings' }, { id: 'angel', name: 'Angel wings' }, { id: 'pack', name: 'Backpack' }],
    hand: [{ id: 'wand', name: 'Magic wand' }, { id: 'flower', name: 'Flowers' }, { id: 'balloon', name: 'Balloon' }, { id: 'purse', name: 'Purse' }, { id: 'teddy', name: 'Teddy bear' }, { id: 'lolly', name: 'Lollipop' }]
  };
  P.COLKEY = { dress: 'dressCol', top: 'topCol', bottom: 'bottomCol', shoes: 'shoesCol', hat: 'hatCol', face: 'extraCol', neck: 'extraCol', back: 'backCol', hand: 'extraCol' };

  /* ------------------------------------------------------------ dresses */
  const sleeveCap = (c, k) => { for (const sd of [-1, 1]) { c.fillStyle = k; dot(c, sd * 11.2, -47, 4.6); } };
  const bodice = (c, k, neck) => {
    c.fillStyle = grad(c, -50, -34, k); c.beginPath(); c.moveTo(-10.5, -49); c.quadraticCurveTo(0, neck ? -47 : -51, 10.5, -49); c.lineTo(9, -34); c.lineTo(-9, -34); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = .7; c.beginPath(); c.moveTo(-9, -35.5); c.lineTo(9, -35.5); c.stroke();
  };
  const scallop = (c, y, hw, n, r) => { for (let i = 0; i < n; i++) { const x = -hw + (i + .5) * (2 * hw / n); c.beginPath(); c.arc(x, y, r, 0, Math.PI); c.fill(); } };
  const DRESS = {
    ball(c, k, t) {
      sleeveCap(c, shade(k, .12));
      const skirt = (hw, hem, kk) => { c.fillStyle = kk; c.beginPath(); c.moveTo(-9, -36); c.bezierCurveTo(-13, -26, -hw, -14, -hw - 1, hem); c.lineTo(hw + 1, hem); c.bezierCurveTo(hw, -14, 13, -26, 9, -36); c.closePath(); c.fill(); };
      skirt(32, -3, grad(c, -36, -3, shade(k, -.06), .1)); scallop(c, -3.5, 32, 8, 4.6);
      c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(-4, -34); c.bezierCurveTo(-14, -22, -20, -12, -22, -4); c.lineTo(-13, -4); c.bezierCurveTo(-11, -14, -7, -24, -1, -34); c.fill();
      bodice(c, k, true);
      c.fillStyle = shade(k, -.2); rr(c, -9.5, -37, 19, 3.4, 1.5); c.fill(); c.fillStyle = '#ffe680'; dot(c, 0, -35.3, 1.5);
      twinkle(c, [[-18, -16], [14, -22], [22, -9], [-6, -10], [5, -28], [-24, -6]], t);
    },
    aline(c, k, t) {
      sleeveCap(c, k);
      c.fillStyle = grad(c, -36, -12, k, .1); c.beginPath(); c.moveTo(-9, -36); c.lineTo(-19, -12); c.quadraticCurveTo(0, -8, 19, -12); c.lineTo(9, -36); c.closePath(); c.fill();
      bodice(c, k); c.fillStyle = shade(k, -.22); rr(c, -9.5, -37.5, 19, 3.2, 1.4); c.fill();
      c.fillStyle = shade(k, .3); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 1, -36); c.lineTo(sd * 6, -39.5); c.lineTo(sd * 6.5, -33); c.closePath(); c.fill(); } dot(c, 0, -36, 1.8);
      twinkle(c, [[-10, -22], [9, -18]], t);
    },
    tutu(c, k, t) {
      bodice(c, k);
      for (let l = 0; l < 3; l++) { const hw = 26 - l * 2.5, y = -30 + l * 2; c.fillStyle = shade(k, .2 - l * .1); c.globalAlpha = .93; c.beginPath(); c.ellipse(0, y, hw, 7 - l, 0, 0, TAU); c.fill(); }
      c.globalAlpha = 1; c.fillStyle = shade(k, .3); scallop(c, -24.5, 24, 9, 2.8); twinkle(c, [[-16, -27], [12, -26], [0, -22]], t);
      c.fillStyle = shade(k, -.2); rr(c, -9.5, -37, 19, 3, 1.4); c.fill();
    },
    mermaid(c, k, t) {
      const k2 = shade(k, -.08);
      c.fillStyle = grad(c, -36, -2, k2, .1); c.beginPath(); c.moveTo(-9, -36); c.bezierCurveTo(-12, -22, -10, -14, -12, -8); c.bezierCurveTo(-19, -4, -22, -1, -25, -1); c.lineTo(-8, -3); c.lineTo(0, -1.5); c.lineTo(8, -3); c.lineTo(25, -1); c.bezierCurveTo(22, -1, 19, -4, 12, -8); c.bezierCurveTo(10, -14, 12, -22, 9, -36); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = .8; for (let y = -30; y < -6; y += 5) for (let x = -8; x < 9; x += 5) { c.beginPath(); c.arc(x + ((y / 5) & 1 ? 2.5 : 0), y, 2.6, 0, Math.PI); c.stroke(); }
      bodice(c, k); c.fillStyle = shade(k, .3); for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * 4.6, -44, 4, Math.PI, TAU); c.fill(); }
      twinkle(c, [[-5, -20], [4, -12], [-2, -28], [17, -4]], t);
    },
    petal(c, k, t) {
      bodice(c, k, true);
      const n = 9; for (let i = 0; i < n; i++) { const a = -Math.PI * .5 + (i - (n - 1) / 2) * .34, x = Math.sin(a * 1.5) * 25, y = -21 + Math.abs(i - (n - 1) / 2) * 1.2; c.save(); c.translate(x * .9, y); c.rotate((i - (n - 1) / 2) * .16); c.fillStyle = i % 2 ? shade(k, .14) : k; c.beginPath(); c.ellipse(0, 6, 5.6, 13, 0, 0, TAU); c.fill(); c.restore(); }
      c.fillStyle = shade(k, -.08); c.beginPath(); c.moveTo(-9, -35); c.quadraticCurveTo(0, -29, 9, -35); c.lineTo(9, -30); c.quadraticCurveTo(0, -22, -9, -30); c.closePath(); c.fill();
      c.fillStyle = '#7ed9a0'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * 4, -50, 3.2, 1.4, sd * .5, 0, TAU); c.fill(); }
      twinkle(c, [[-14, -14], [12, -10], [0, -8]], t, '#fff7b0');
    },
    sun(c, k, t) {
      c.fillStyle = grad(c, -36, -16, k, .2); c.beginPath(); c.moveTo(-9.5, -36); c.lineTo(-15, -16); c.quadraticCurveTo(0, -12, 15, -16); c.lineTo(9.5, -36); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; for (const [x, y] of [[-8, -24], [0, -20], [8, -26], [-3, -30], [6, -18], [-11, -18]]) dot(c, x, y, 1.5);
      c.fillStyle = grad(c, -50, -34, k); c.beginPath(); c.moveTo(-9.5, -47); c.lineTo(9.5, -47); c.lineTo(9, -34); c.lineTo(-9, -34); c.closePath(); c.fill();
      c.strokeStyle = shade(k, .1); c.lineWidth = 2.6; c.lineCap = 'round'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 6.5, -47); c.lineTo(sd * 6.5, -52.5); c.stroke(); }
      c.fillStyle = shade(k, -.18); rr(c, -9.5, -37, 19, 2.6, 1.2); c.fill();
    }
  };

  /* ------------------------------------------------------------ tops and bottoms */
  const torso = (c, k, hemY = -32, hw = 10.6) => { c.fillStyle = grad(c, -50, hemY, k); c.beginPath(); c.moveTo(-hw - .6, -49); c.quadraticCurveTo(0, -51.5, hw + .6, -49); c.lineTo(hw + .2, hemY); c.lineTo(-hw - .2, hemY); c.closePath(); c.fill(); };
  const TOP = {
    tee(c, k) { torso(c, k, -32); c.fillStyle = shade(k, -.15); c.beginPath(); c.arc(0, -50, 4.4, 0, Math.PI); c.fill(); },
    tank(c, k) { torso(c, k, -32); c.fillStyle = shade(k, -.06); c.beginPath(); c.moveTo(-10, -49); c.lineTo(-5, -49); c.lineTo(-4, -51); c.lineTo(-11, -51); c.fill(); },
    stripes(c, k) { torso(c, k, -32); c.save(); c.beginPath(); c.rect(-11, -50, 22, 18); c.clip(); c.fillStyle = '#fff'; for (let y = -47; y < -32; y += 6) c.fillRect(-12, y, 24, 2.8); c.restore(); c.fillStyle = shade(k, -.15); c.beginPath(); c.arc(0, -50, 4.4, 0, Math.PI); c.fill(); },
    hoodie(c, k) { torso(c, k, -31.5, 11.2); c.fillStyle = shade(k, -.14); c.beginPath(); c.ellipse(0, -50, 8, 4, 0, 0, Math.PI); c.fill(); c.fillStyle = shade(k, -.08); rr(c, -6.5, -40, 13, 6.2, 2.5); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = .9; c.lineCap = 'round'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 2.4, -47); c.lineTo(sd * 2.8, -41.5); c.stroke(); } },
    sweater(c, k) { torso(c, k, -31.6, 11); c.fillStyle = shade(k, -.16); rr(c, -11.2, -34.4, 22.4, 3.2, 1.2); c.fill(); c.beginPath(); c.arc(0, -50, 4.8, 0, Math.PI); c.fill(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = .8; for (let x = -8; x < 9; x += 4) { c.beginPath(); c.moveTo(x, -47); c.lineTo(x, -36); c.stroke(); } },
    star(c, k) { torso(c, k, -32); art.star(c, 0, -41, 5.4, '#ffe066', 0); c.fillStyle = shade(k, -.15); c.beginPath(); c.arc(0, -50, 4.4, 0, Math.PI); c.fill(); },
    vest(c, k) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-10.6, -49); c.quadraticCurveTo(0, -51.5, 10.6, -49); c.lineTo(10.2, -32); c.lineTo(-10.2, -32); c.closePath(); c.fill(); c.fillStyle = grad(c, -50, -32, k); c.beginPath(); c.moveTo(-10.6, -49); c.lineTo(-3, -47); c.lineTo(0, -36); c.lineTo(0, -32); c.lineTo(-10.2, -32); c.closePath(); c.moveTo(10.6, -49); c.lineTo(3, -47); c.lineTo(0, -36); c.lineTo(0, -32); c.lineTo(10.2, -32); c.closePath(); c.fill(); c.fillStyle = '#ffe680'; for (const y of [-42, -38]) dot(c, 0, y, 1); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-3, -50); c.lineTo(0, -46); c.lineTo(3, -50); c.fill(); }
  };
  const SLEEVE = { tee: 9, star: 9, stripes: 9, tank: 0, vest: 0, hoodie: 19.5, sweater: 19.5 };
  const legs = (c, k, hem, wid = 8.8, cuff) => {
    for (const sd of [-1, 1]) { c.fillStyle = grad(c, -36, hem, k, .16); rr(c, sd * 5.5 - wid / 2, -36.5, wid, hem + 36.5, 2.6); c.fill(); if (cuff) { c.fillStyle = shade(k, -.16); rr(c, sd * 5.5 - wid / 2 - .2, hem - 2.4, wid + .4, 2.6, 1); c.fill(); } }
    c.fillStyle = shade(k, -.1); rr(c, -10.6, -37, 21.2, 4.2, 1.8); c.fill();
  };
  const BOTTOM = {
    skirt(c, k) { c.fillStyle = grad(c, -37, -18, k, .2); c.beginPath(); c.moveTo(-10.5, -37); c.lineTo(-17, -19); c.quadraticCurveTo(0, -15, 17, -19); c.lineTo(10.5, -37); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.09)'; c.lineWidth = .8; for (const x of [-9, -3, 3, 9]) { c.beginPath(); c.moveTo(x * .7, -36); c.lineTo(x * 1.5, -17.5); c.stroke(); } c.fillStyle = shade(k, -.16); rr(c, -10.8, -37.4, 21.6, 3.2, 1.4); c.fill(); },
    shorts(c, k) { legs(c, k, -21, 9.4); },
    jeans(c, k) { legs(c, k, -3, 9, true); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = .6; c.setLineDash([1.2, 1]); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 5.5 + sd * 4.1, -33); c.lineTo(sd * 5.5 + sd * 4.1, -6); c.stroke(); } c.setLineDash([]); },
    leggings(c, k) { legs(c, k, -3, 8, false); c.fillStyle = 'rgba(255,255,255,.18)'; for (const sd of [-1, 1]) rr(c, sd * 5.5 - 3, -34, 1.6, 28, .8), c.fill(); },
    tutuskirt(c, k, t) { for (let l = 0; l < 3; l++) { c.fillStyle = shade(k, .18 - l * .1); c.globalAlpha = .93; c.beginPath(); c.ellipse(0, -30 + l * 1.8, 21 - l * 2, 6.5 - l * .6, 0, 0, TAU); c.fill(); } c.globalAlpha = 1; c.fillStyle = shade(k, -.16); rr(c, -10.8, -37.4, 21.6, 3.2, 1.4); c.fill(); }
  };

  /* ------------------------------------------------------------ shoes */
  const shoePair = (c, fn) => { for (const sd of [-1, 1]) { c.save(); c.translate(sd * 5.6, 0); c.scale(sd, 1); fn(c); c.restore(); } };
  const SHOES = {
    sneakers(c, k) { shoePair(c, c => { c.fillStyle = k; c.beginPath(); c.moveTo(-3.6, -5); c.lineTo(3.2, -5); c.quadraticCurveTo(4.4, -3.8, 7.6, -2.8); c.quadraticCurveTo(9, -1.4, 8, 0); c.lineTo(-4, 0); c.closePath(); c.fill(); c.fillStyle = '#fff'; rr(c, -4.2, -1.3, 12.6, 1.6, .8); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(-1, -4.6); c.lineTo(3.4, -4.4); c.lineTo(5.4, -2.6); c.lineTo(-1, -2.6); c.fill(); }); },
    boots(c, k) { shoePair(c, c => { c.fillStyle = grad(c, -16, 0, k, .22); c.beginPath(); c.moveTo(-4, -16); c.lineTo(3.6, -16); c.lineTo(3.6, -5.5); c.quadraticCurveTo(5, -4, 8, -3); c.quadraticCurveTo(9.4, -1.2, 8.2, 0); c.lineTo(-4.2, 0); c.closePath(); c.fill(); c.fillStyle = shade(k, -.28); rr(c, -4.2, -1.4, 12.6, 1.6, .8); c.fill(); c.fillStyle = shade(k, .22); rr(c, -4, -16.6, 7.8, 2.4, 1.2); c.fill(); }); },
    sandals(c, k) { shoePair(c, c => { c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, -4, -1.2, 12.4, 1.4, .7); c.fill(); c.strokeStyle = k; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-3.6, -3.4); c.lineTo(3, -1.2); c.moveTo(3, -4.4); c.lineTo(-3.2, -1.4); c.moveTo(-3.4, -1.4); c.lineTo(-3.4, -5); c.stroke(); c.fillStyle = k; dot(c, 0, -3, 1.2); c.fillStyle = '#f8d3b0'; c.globalAlpha = 0; c.globalAlpha = 1; }); },
    glass(c, k, t) { shoePair(c, c => { const g = c.createLinearGradient(0, -6, 8, 0); g.addColorStop(0, 'rgba(210,240,255,.9)'); g.addColorStop(1, 'rgba(150,200,240,.85)'); c.fillStyle = g; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = .7; c.beginPath(); c.moveTo(-3.6, -6); c.lineTo(3, -6); c.quadraticCurveTo(4.4, -4.4, 7.6, -3); c.quadraticCurveTo(9, -1.4, 8, 0); c.lineTo(-3.6, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-1.5, -5); c.lineTo(1.5, -5); c.lineTo(-.3, -1.6); c.fill(); }); twinkle(c, [[-8, -4], [9, -2]], t, '#e8f7ff'); },
    flats(c, k) { shoePair(c, c => { c.fillStyle = k; c.beginPath(); c.moveTo(-3.6, -3.6); c.quadraticCurveTo(2, -4.6, 8, -2.8); c.quadraticCurveTo(9, -1, 8, 0); c.lineTo(-4, 0); c.closePath(); c.fill(); c.fillStyle = shade(k, .3); dot(c, 3.6, -3.2, 1.1); c.fillStyle = shade(k, -.12); rr(c, -4, -.8, 12, .9, .4); c.fill(); }); }
  };

  /* ------------------------------------------------------------ hats (drawn in the head frame: (0,0) is the middle of the head, R its radius) */
  const gems = ['#ff6fae', '#7fd4f5', '#8be0a8', '#c9a8f0'];
  const HAT = {
    crown(c, R, k) { const g = c.createLinearGradient(0, -R * 1.6, 0, -R * 1.0); g.addColorStop(0, '#fff2a0'); g.addColorStop(1, '#f0b429'); c.fillStyle = g; c.strokeStyle = '#d99a1a'; c.lineWidth = R * .05; c.beginPath(); c.moveTo(-R * .62, -R * 1.02); c.lineTo(-R * .72, -R * 1.5); c.lineTo(-R * .34, -R * 1.25); c.lineTo(0, -R * 1.62); c.lineTo(R * .34, -R * 1.25); c.lineTo(R * .72, -R * 1.5); c.lineTo(R * .62, -R * 1.02); c.closePath(); c.fill(); c.stroke(); for (const [x, y, i] of [[-R * .72, -R * 1.5, 0], [0, -R * 1.62, 1], [R * .72, -R * 1.5, 2]]) { c.fillStyle = gems[i]; dot(c, x, y, R * .09); } c.fillStyle = '#ff6fae'; dot(c, 0, -R * 1.14, R * .1); c.fillStyle = '#7fd4f5'; dot(c, -R * .32, -R * 1.12, R * .07); dot(c, R * .32, -R * 1.12, R * .07); },
    tiara(c, R) { c.strokeStyle = '#d8dce8'; c.lineWidth = R * .08; c.lineCap = 'round'; c.beginPath(); c.arc(0, -R * .1, R * 1.03, Math.PI * 1.18, Math.PI * 1.82); c.stroke(); c.fillStyle = '#eef0f8'; c.beginPath(); c.moveTo(-R * .3, -R * 1.02); c.lineTo(0, -R * 1.52); c.lineTo(R * .3, -R * 1.02); c.closePath(); c.fill(); c.strokeStyle = '#c4c9dc'; c.lineWidth = R * .04; c.stroke(); c.fillStyle = '#ff9fc8'; dot(c, 0, -R * 1.2, R * .1); c.fillStyle = '#bfe6ff'; for (const sd of [-1, 1]) dot(c, sd * R * .5, -R * .98, R * .06); },
    bow(c, R, k) { c.save(); c.translate(R * .62, -R * .95); c.rotate(.3); c.fillStyle = k; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(sd * R * .5, -R * .5, sd * R * .7, -R * .1); c.quadraticCurveTo(sd * R * .6, R * .4, 0, 0); c.fill(); } c.fillStyle = shade(k, -.2); dot(c, 0, 0, R * .13); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-R * .35, -R * .1, R * .16, R * .08, -.5, 0, TAU); c.fill(); c.restore(); },
    flowers(c, R, k) { const cols = [k, '#fff', '#ffd54a', shade(k, .2), '#fff', '#ff9fc8', '#ffd54a']; for (let i = 0; i < 7; i++) { const a = Math.PI * (1.12 + i * .128), x = Math.cos(a) * R * 1.04, y = Math.sin(a) * R * 1.02 - R * .02; c.fillStyle = cols[i % cols.length]; for (let p = 0; p < 5; p++) dot(c, x + Math.cos(p * TAU / 5) * R * .14, y + Math.sin(p * TAU / 5) * R * .14, R * .1); c.fillStyle = '#ffd54a'; if (cols[i % cols.length] === '#ffd54a') c.fillStyle = '#e58a3a'; dot(c, x, y, R * .08); c.fillStyle = '#7ed9a0'; c.beginPath(); c.ellipse(x + R * .2, y + R * .12, R * .12, R * .05, .6, 0, TAU); c.fill(); } },
    cap(c, R, k) { c.fillStyle = k; c.beginPath(); c.moveTo(-R * 1.02, -R * .26); c.bezierCurveTo(-R * 1.1, -R * 1.2, R * 1.1, -R * 1.2, R * 1.02, -R * .26); c.closePath(); c.fill(); c.fillStyle = shade(k, -.18); c.beginPath(); c.moveTo(R * .2, -R * .42); c.quadraticCurveTo(R * 1.5, -R * .5, R * 1.62, -R * .18); c.quadraticCurveTo(R * .8, -R * .3, R * .1, -R * .26); c.closePath(); c.fill(); c.fillStyle = '#fff'; dot(c, 0, -R * 1.08, R * .08); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-R * .4, -R * .85, R * .3, R * .1, -.5, 0, TAU); c.fill(); },
    beanie(c, R, k) { c.fillStyle = k; c.beginPath(); c.moveTo(-R * 1.04, -R * .3); c.bezierCurveTo(-R * 1.1, -R * 1.5, R * 1.1, -R * 1.5, R * 1.04, -R * .3); c.closePath(); c.fill(); c.fillStyle = shade(k, -.18); rr(c, -R * 1.08, -R * .55, R * 2.16, R * .3, R * .12); c.fill(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = R * .04; for (let x = -R * .8; x < R * .9; x += R * .3) { c.beginPath(); c.moveTo(x, -R * .5); c.lineTo(x, -R * 1.2 + Math.abs(x) * .3); c.stroke(); } c.fillStyle = '#fff'; dot(c, 0, -R * 1.34, R * .24); },
    party(c, R, k) { c.save(); c.rotate(-.12); c.fillStyle = k; c.beginPath(); c.moveTo(-R * .55, -R * .92); c.lineTo(0, -R * 2.05); c.lineTo(R * .55, -R * .92); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; for (const [x, y] of [[-R * .1, -R * 1.5], [R * .14, -R * 1.2], [-R * .22, -R * 1.15]]) dot(c, x, y, R * .07); c.fillStyle = '#ffd54a'; dot(c, 0, -R * 2.05, R * .13); c.strokeStyle = '#ffd54a'; c.lineWidth = R * .07; c.beginPath(); c.moveTo(-R * .55, -R * .92); c.lineTo(R * .55, -R * .92); c.stroke(); c.restore(); },
    cowboy(c, R, k) { c.fillStyle = k; c.beginPath(); c.moveTo(-R * .62, -R * .78); c.quadraticCurveTo(-R * .7, -R * 1.5, -R * .2, -R * 1.34); c.quadraticCurveTo(0, -R * 1.22, R * .2, -R * 1.34); c.quadraticCurveTo(R * .7, -R * 1.5, R * .62, -R * .78); c.closePath(); c.fill(); c.fillStyle = shade(k, -.14); c.beginPath(); c.ellipse(0, -R * .78, R * 1.5, R * .28, 0, 0, TAU); c.fill(); c.fillStyle = shade(k, -.32); rr(c, -R * .64, -R * .98, R * 1.28, R * .2, R * .05); c.fill(); c.fillStyle = '#ffd54a'; dot(c, 0, -R * .88, R * .07); },
    wizard(c, R, k) { c.fillStyle = k; c.beginPath(); c.moveTo(-R * .9, -R * .8); c.quadraticCurveTo(-R * .2, -R * 1.5, R * .55, -R * 2.3); c.quadraticCurveTo(R * .5, -R * 1.5, R * .95, -R * .8); c.closePath(); c.fill(); c.beginPath(); c.ellipse(0, -R * .78, R * 1.35, R * .26, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, -R * .74, R * 1.35, R * .2, 0, 0, Math.PI); c.fill(); art.star(c, R * .05, -R * 1.5, R * .2, '#ffe066', 0); art.star(c, R * .4, -R * 1.15, R * .12, '#fff', 0); art.star(c, -R * .4, -R * 1.05, R * .1, '#fff', 0); },
    bunny(c, R, k) { c.strokeStyle = '#f2e6ff'; c.lineWidth = R * .1; c.lineCap = 'round'; c.beginPath(); c.arc(0, -R * .05, R * 1.0, Math.PI * 1.16, Math.PI * 1.84); c.stroke(); for (const sd of [-1, 1]) { c.save(); c.translate(sd * R * .5, -R * 1.02); c.rotate(sd * .25); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -R * .62, R * .24, R * .66, 0, 0, TAU); c.fill(); c.fillStyle = k; c.beginPath(); c.ellipse(0, -R * .58, R * .12, R * .46, 0, 0, TAU); c.fill(); c.restore(); } },
    kitty(c, R, k) { c.strokeStyle = shade(k, -.2); c.lineWidth = R * .1; c.lineCap = 'round'; c.beginPath(); c.arc(0, -R * .05, R * 1.0, Math.PI * 1.16, Math.PI * 1.84); c.stroke(); for (const sd of [-1, 1]) { c.fillStyle = k; c.beginPath(); c.moveTo(sd * R * .22, -R * 1.02); c.lineTo(sd * R * .58, -R * 1.72); c.lineTo(sd * R * .96, -R * .78); c.closePath(); c.fill(); c.fillStyle = '#ffb3c8'; c.beginPath(); c.moveTo(sd * R * .42, -R * 1.0); c.lineTo(sd * R * .6, -R * 1.42); c.lineTo(sd * R * .78, -R * .88); c.closePath(); c.fill(); } },
    princess(c, R, k) { c.save(); c.rotate(.08); c.fillStyle = grad(c, -R * 2.6, -R * .9, k, .2); c.beginPath(); c.moveTo(-R * .58, -R * .95); c.lineTo(R * .12, -R * 2.6); c.lineTo(R * .62, -R * .95); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; for (const [x, y] of [[0, -R * 1.5], [R * .18, -R * 1.2], [-R * .18, -R * 1.15]]) dot(c, x, y, R * .06); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = R * .05; c.beginPath(); c.moveTo(-R * .58, -R * .95); c.lineTo(R * .62, -R * .95); c.stroke(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(R * .12, -R * 2.6); c.bezierCurveTo(R * 1.6, -R * 2.1, R * 1.4, -R * .9, R * 1.6, R * .7); c.bezierCurveTo(R * 1.1, R * .3, R * .9, -R * .7, R * .3, -R * 1.4); c.closePath(); c.fill(); c.restore(); }
  };

  /* ------------------------------------------------------------ face, neck, back, hand items */
  const FACE = {
    glasses(c, R, k) { c.strokeStyle = k; c.lineWidth = R * .07; for (const sd of [-1, 1]) { c.fillStyle = 'rgba(200,235,255,.28)'; c.beginPath(); c.arc(sd * R * .38, R * .04, R * .27, 0, TAU); c.fill(); c.stroke(); } c.beginPath(); c.moveTo(-R * .11, R * .0); c.quadraticCurveTo(0, -R * .08, R * .11, R * .0); c.stroke(); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * R * .64, R * .0); c.lineTo(sd * R * .97, -R * .06); c.stroke(); } },
    hearts(c, R, k) { for (const sd of [-1, 1]) art.heart(c, sd * R * .38, R * .02, R * .3, k); c.fillStyle = 'rgba(255,255,255,.4)'; for (const sd of [-1, 1]) dot(c, sd * R * .3, -R * .08, R * .06); c.strokeStyle = shade(k, -.2); c.lineWidth = R * .05; c.beginPath(); c.moveTo(-R * .08, R * .0); c.lineTo(R * .08, R * .0); c.stroke(); },
    stars(c, R, k) { for (const sd of [-1, 1]) art.star(c, sd * R * .38, R * .04, R * .33, k, 0); c.strokeStyle = shade(k, -.25); c.lineWidth = R * .05; c.beginPath(); c.moveTo(-R * .1, R * .0); c.lineTo(R * .1, R * .0); c.stroke(); },
    mask(c, R, k) { c.fillStyle = k; c.beginPath(); c.moveTo(-R * .82, -R * .16); c.quadraticCurveTo(0, -R * .5, R * .82, -R * .16); c.quadraticCurveTo(R * .86, R * .2, R * .5, R * .22); c.quadraticCurveTo(R * .22, R * .1, 0, R * .18); c.quadraticCurveTo(-R * .22, R * .1, -R * .5, R * .22); c.quadraticCurveTo(-R * .86, R * .2, -R * .82, -R * .16); c.closePath(); c.fill(); c.fillStyle = '#fff'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * R * .38, R * .02, R * .15, R * .19, 0, 0, TAU); c.fill(); } c.fillStyle = '#20141a'; for (const sd of [-1, 1]) dot(c, sd * R * .38, R * .04, R * .08); art.star(c, R * .62, -R * .2, R * .11, '#fff', 0); },
    stache(c, R, k) { c.fillStyle = '#3a2a30'; c.beginPath(); c.moveTo(0, R * .38); c.quadraticCurveTo(-R * .3, R * .3, -R * .5, R * .42); c.quadraticCurveTo(-R * .42, R * .58, -R * .2, R * .5); c.quadraticCurveTo(-R * .06, R * .48, 0, R * .5); c.quadraticCurveTo(R * .06, R * .48, R * .2, R * .5); c.quadraticCurveTo(R * .42, R * .58, R * .5, R * .42); c.quadraticCurveTo(R * .3, R * .3, 0, R * .38); c.fill(); }
  };
  const NECK = {
    pearls(c) { c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = .3; for (let i = 0; i < 9; i++) { const a = Math.PI * (.12 + i * .095); dot(c, Math.cos(a) * 6, -51.6 + Math.sin(a) * 4.6, 1.1); c.stroke(); } },
    heart(c, k) { c.strokeStyle = '#e8c86a'; c.lineWidth = .6; c.beginPath(); c.arc(0, -51.5, 6, .15, Math.PI - .15); c.stroke(); art.heart(c, 0, -46.2, 2.6, k); },
    star(c, k) { c.strokeStyle = '#e8c86a'; c.lineWidth = .6; c.beginPath(); c.arc(0, -51.5, 6, .15, Math.PI - .15); c.stroke(); art.star(c, 0, -46, 2.8, k, 0); },
    scarf(c, k) { c.fillStyle = k; rr(c, -7.2, -54, 14.4, 5.6, 2.8); c.fill(); c.fillStyle = shade(k, -.14); c.beginPath(); c.moveTo(2, -49); c.lineTo(8.4, -49); c.lineTo(9, -36); c.lineTo(3, -36); c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = .8; c.beginPath(); c.moveTo(3, -40); c.lineTo(9, -40); c.moveTo(3, -43); c.lineTo(8.8, -43); c.stroke(); },
    bowtie(c, k) { c.fillStyle = k; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, -49.8); c.lineTo(sd * 6.4, -53); c.lineTo(sd * 6.4, -46.6); c.closePath(); c.fill(); } c.fillStyle = shade(k, -.2); rr(c, -1.5, -51.4, 3, 3.2, 1); c.fill(); }
  };
  const BACK = {
    cape(c, k, t) { c.fillStyle = grad(c, -52, 0, k, .25); const sw = Math.sin(t * 1.4) * 1.5; c.beginPath(); c.moveTo(-10, -52); c.quadraticCurveTo(0, -55, 10, -52); c.bezierCurveTo(19 + sw, -30, 24 + sw, -12, 21 + sw, -1); c.quadraticCurveTo(0, -5, -21 - sw, -1); c.bezierCurveTo(-24 - sw, -12, -19 - sw, -30, -10, -52); c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = .8; c.beginPath(); c.moveTo(-14, -6); c.quadraticCurveTo(0, -9, 14, -6); c.stroke(); },
    fairy(c, k, t) { const fl = Math.sin(t * 6) * .06; for (const sd of [-1, 1]) { c.save(); c.translate(sd * 5, -45); c.scale(sd, 1); c.rotate(fl); for (const [rx, ry, ang, kk, a] of [[9, 22, -.9, k, .55], [7, 14, -2.3, shade(k, .15), .5]]) { c.save(); c.rotate(ang); c.globalAlpha = a; c.fillStyle = kk; c.strokeStyle = '#fff'; c.lineWidth = .6; c.beginPath(); c.ellipse(rx * .3, -ry * .8, rx, ry, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); } c.restore(); } c.globalAlpha = 1; },
    butterfly(c, k, t) { const fl = 1 - Math.abs(Math.sin(t * 2.2)) * .12; for (const sd of [-1, 1]) { c.save(); c.translate(sd * 5, -44); c.scale(sd * fl, 1); c.fillStyle = k; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(10, -26, 34, -20, 26, -2); c.bezierCurveTo(30, 10, 14, 12, 0, 0); c.fill(); c.fillStyle = shade(k, .3); c.beginPath(); c.moveTo(1, 3); c.bezierCurveTo(14, 4, 22, 20, 12, 22); c.bezierCurveTo(4, 22, 0, 12, 1, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; dot(c, 17, -12, 3.6); dot(c, 11, 14, 2.2); c.restore(); } },
    angel(c, k, t) { const fl = Math.sin(t * 2.4) * .04; for (const sd of [-1, 1]) { c.save(); c.translate(sd * 5, -46); c.scale(sd, 1); c.rotate(fl); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#fff' : '#f4f8ff'; c.strokeStyle = 'rgba(160,180,220,.5)'; c.lineWidth = .5; c.beginPath(); c.ellipse(9 + i * 3.2, -6 - i * 4.6 + 12, 5.4, 15 - i * 2.6, -.9 + i * .3, 0, TAU); c.fill(); c.stroke(); } c.restore(); } },
    pack(c, k) { c.fillStyle = shade(k, -.1); rr(c, -9, -50, 18, 20, 5); c.fill(); c.fillStyle = k; rr(c, -7, -40, 14, 8, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, -5.5, -38.6, 11, 1.4, .7); c.fill(); c.strokeStyle = shade(k, -.3); c.lineWidth = 1.4; c.beginPath(); c.arc(0, -50, 3.6, Math.PI, TAU); c.stroke(); }
  };
  const HAND = {
    wand(c, k, t) { c.save(); c.rotate(-.2); c.strokeStyle = '#f7f1ff'; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 2); c.lineTo(3, -20); c.stroke(); c.strokeStyle = k; c.lineWidth = .6; c.beginPath(); c.moveTo(.4, 0); c.lineTo(3.4, -19); c.stroke(); art.star(c, 3.4, -24, 6 + Math.sin(t * 4) * .6, '#ffe066', t * .4); c.fillStyle = 'rgba(255,255,255,.9)'; dot(c, 3.4, -24, 1.4); twinkle(c, [[-3, -30], [10, -26], [8, -34]], t, '#fff7b0'); c.restore(); },
    flower(c, k) { c.strokeStyle = '#4fa86b'; c.lineWidth = 1.1; c.lineCap = 'round'; for (const [a, l] of [[-.3, 20], [0, 24], [.3, 19]]) { c.beginPath(); c.moveTo(0, 2); c.lineTo(Math.sin(a) * l, -Math.cos(a) * l + 2); c.stroke(); } for (const [a, l, kk] of [[-.3, 20, k], [0, 24, '#fff'], [.3, 19, shade(k, .2)]]) { const x = Math.sin(a) * l, y = -Math.cos(a) * l + 2; c.fillStyle = kk; for (let p = 0; p < 5; p++) dot(c, x + Math.cos(p * TAU / 5) * 2.4, y + Math.sin(p * TAU / 5) * 2.4, 1.9); c.fillStyle = '#ffd54a'; dot(c, x, y, 1.5); } },
    balloon(c, k, t) { c.strokeStyle = 'rgba(90,63,94,.6)'; c.lineWidth = .5; const sw = Math.sin(t * 1.6) * 2; c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(sw, -14, sw * 1.4 + 6, -26); c.stroke(); c.save(); c.translate(sw * 1.4 + 6, -33); art.heart(c, 0, 0, 9.5, k); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-3.4, -2.6, 1.8, 1, -.6, 0, TAU); c.fill(); c.restore(); },
    purse(c, k) { c.strokeStyle = shade(k, -.25); c.lineWidth = 1; c.beginPath(); c.arc(0, 4, 4, Math.PI, TAU); c.stroke(); c.fillStyle = k; rr(c, -7, 5, 14, 10, 3); c.fill(); c.fillStyle = shade(k, -.16); c.beginPath(); c.moveTo(-7, 8); c.quadraticCurveTo(0, 13, 7, 8); c.lineTo(7, 5); c.lineTo(-7, 5); c.fill(); c.fillStyle = '#ffe066'; dot(c, 0, 10.4, 1.2); },
    teddy(c, k) { c.save(); c.translate(0, 8); c.fillStyle = '#c98f5a'; dot(c, 0, 4, 5.4); dot(c, 0, -4.4, 4.4); for (const sd of [-1, 1]) { dot(c, sd * 3.4, -8, 1.7); dot(c, sd * 5.4, 2, 1.8); dot(c, sd * 3.2, 9, 1.9); } c.fillStyle = '#f1cfa4'; dot(c, 0, -3.4, 2); c.fillStyle = '#3a2a30'; dot(c, -1.5, -5.2, .5); dot(c, 1.5, -5.2, .5); dot(c, 0, -3.8, .6); c.fillStyle = k; c.beginPath(); c.moveTo(0, -1.4); c.lineTo(-2.2, .4); c.lineTo(2.2, .4); c.lineTo(0, -1.4); c.fill(); c.restore(); },
    lolly(c, k, t) { c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 2); c.lineTo(1, -14); c.stroke(); c.save(); c.translate(1.4, -20); c.fillStyle = k; dot(c, 0, 0, 7); c.strokeStyle = '#fff'; c.lineWidth = 1.4; c.beginPath(); for (let a = 0; a < 14; a += .2) { const r = a * .42; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); c.restore(); }
  };


  /* ------------------------------------------------------------ more of everything */
  const add = (cat, list) => P.CATS[cat].push(...list);
  const wfoot = (c, fn) => shoePair(c, fn);
  // dresses
  add('dress', [{ id: 'royal', name: 'Royal gown' }, { id: 'skater', name: 'Twirly dress' }, { id: 'tiers', name: 'Ruffle dress' }, { id: 'pinafore', name: 'Pinafore' }, { id: 'snow', name: 'Ice queen gown' }]);
  DRESS.royal = (c, k, t) => { DRESS.ball(c, k, t); c.strokeStyle = '#f0b429'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-31, -7); c.quadraticCurveTo(0, -1.5, 31, -7); c.stroke(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(0, -34); c.lineTo(-9, -3); c.lineTo(9, -3); c.closePath(); c.fill(); c.fillStyle = '#fff'; for (let i = -4; i <= 4; i++) dot(c, i * 2.5, -49.6 + Math.abs(i) * .35, 2.4); c.fillStyle = '#3a2a30'; for (const i of [-3, -1, 1, 3]) dot(c, i * 2.5, -49.2 + Math.abs(i) * .3, .5); };
  DRESS.skater = (c, k, t) => { sleeveCap(c, k); c.fillStyle = grad(c, -36, -20, k, .16); c.beginPath(); c.moveTo(-9, -36); c.lineTo(-22, -20); c.quadraticCurveTo(0, -15, 22, -20); c.lineTo(9, -36); c.closePath(); c.fill(); bodice(c, k); c.fillStyle = shade(k, -.3); rr(c, -9.5, -37.6, 19, 3.4, 1.4); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; for (const [x, y] of [[-12, -24], [-4, -21], [5, -24], [13, -21], [0, -28]]) dot(c, x, y, 1.4); twinkle(c, [[-15, -22], [16, -24]], t); };
  DRESS.tiers = (c, k, t) => { bodice(c, k); for (let l = 2; l >= 0; l--) { const y = -34 + l * 6, hw = 11 + l * 4.5; c.fillStyle = l % 2 ? shade(k, .12) : shade(k, -.04); c.beginPath(); c.moveTo(-hw + 2, y); c.lineTo(hw - 2, y); c.lineTo(hw + 1.5, y + 8); for (let i = 0; i < 6; i++) c.quadraticCurveTo(hw - (i + .5) * (2 * hw + 3) / 6, y + 11, hw + 1.5 - (i + 1) * (2 * hw + 3) / 6, y + 8); c.closePath(); c.fill(); } sleeveCap(c, shade(k, .1)); twinkle(c, [[-10, -22], [9, -14]], t); };
  DRESS.pinafore = (c, k, t) => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-10.5, -49); c.quadraticCurveTo(0, -51.5, 10.5, -49); c.lineTo(9.6, -34); c.lineTo(-9.6, -34); c.closePath(); c.fill(); for (const sd of [-1, 1]) { c.fillStyle = '#fff'; dot(c, sd * 11.2, -47, 4.8); } c.fillStyle = grad(c, -36, -18, k, .18); c.beginPath(); c.moveTo(-9.5, -44); c.lineTo(9.5, -44); c.lineTo(9, -36); c.lineTo(17, -18); c.quadraticCurveTo(0, -14, -17, -18); c.lineTo(-9, -36); c.closePath(); c.fill(); c.fillStyle = shade(k, -.1); for (const sd of [-1, 1]) { rr(c, sd * 5.4 - 1.6, -50, 3.2, 8, 1.4); c.fill(); } c.fillStyle = '#ffe680'; dot(c, -5.4, -43, 1.2); dot(c, 5.4, -43, 1.2); c.fillStyle = 'rgba(255,255,255,.7)'; rr(c, -5, -39, 10, 5, 1.6); c.fill(); };
  DRESS.snow = (c, k, t) => { const k2 = shade(k, .25); c.fillStyle = 'rgba(255,255,255,.55)'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 8, -50); c.lineTo(sd * 22, -46); c.lineTo(sd * 17, -38); c.closePath(); c.fill(); } c.fillStyle = grad(c, -36, -2, k2, .1); c.beginPath(); c.moveTo(-9, -36); c.bezierCurveTo(-14, -24, -20, -12, -30, -2); for (let i = 0; i < 5; i++) { const x = -30 + (i + .5) * 12; c.lineTo(x, -8 + (i % 2 ? 0 : 6)); c.lineTo(-30 + (i + 1) * 12, -2); } c.bezierCurveTo(20, -12, 14, -24, 9, -36); c.closePath(); c.fill(); bodice(c, k2, true); art.star(c, 0, -42, 4, '#fff', 0); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = .7; for (let a = 0; a < 3; a++) { c.beginPath(); c.moveTo(Math.cos(a * Math.PI / 3) * 6, -42 + Math.sin(a * Math.PI / 3) * 6); c.lineTo(-Math.cos(a * Math.PI / 3) * 6, -42 - Math.sin(a * Math.PI / 3) * 6); c.stroke(); } twinkle(c, [[-14, -16], [12, -22], [22, -8], [-22, -8], [2, -12], [-4, -28]], t, '#e8f7ff'); };
  // tops
  add('top', [{ id: 'polo', name: 'Polo shirt' }, { id: 'jersey', name: 'Sports shirt' }, { id: 'flannel', name: 'Checked shirt' }, { id: 'cardigan', name: 'Cardigan' }, { id: 'puffer', name: 'Puffy jacket' }, { id: 'blazer', name: 'Blazer' }, { id: 'hearttee', name: 'Heart shirt' }]);
  Object.assign(SLEEVE, { polo: 9, jersey: 9, flannel: 19.5, cardigan: 19.5, puffer: 19.5, blazer: 19.5, hearttee: 9 });
  TOP.polo = (c, k) => { torso(c, k, -32); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-5, -50.5); c.lineTo(0, -45); c.lineTo(5, -50.5); c.lineTo(3, -51); c.lineTo(0, -48); c.lineTo(-3, -51); c.closePath(); c.fill(); c.fillStyle = shade(k, -.2); dot(c, 0, -43, .8); dot(c, 0, -40, .8); };
  TOP.jersey = (c, k) => { torso(c, k, -32); c.fillStyle = '#fff'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('7', 0, -40); c.fillRect(-10.6, -35, 21.2, 1.2); };
  TOP.flannel = (c, k) => { torso(c, k, -31.5); c.save(); c.beginPath(); c.rect(-11, -50, 22, 18); c.clip(); c.strokeStyle = shade(k, -.3); c.lineWidth = 1.1; for (let x = -10; x <= 10; x += 4) { c.beginPath(); c.moveTo(x, -50); c.lineTo(x, -32); c.stroke(); } for (let y = -48; y <= -32; y += 4) { c.beginPath(); c.moveTo(-11, y); c.lineTo(11, y); c.stroke(); } c.restore(); c.fillStyle = shade(k, -.12); c.beginPath(); c.moveTo(-5, -50.5); c.lineTo(0, -44); c.lineTo(5, -50.5); c.lineTo(2.5, -51); c.lineTo(0, -48); c.lineTo(-2.5, -51); c.closePath(); c.fill(); };
  TOP.cardigan = (c, k) => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-10.6, -49); c.quadraticCurveTo(0, -51.5, 10.6, -49); c.lineTo(10.2, -32); c.lineTo(-10.2, -32); c.closePath(); c.fill(); c.fillStyle = grad(c, -50, -32, k); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 10.8, -49); c.lineTo(sd * 3.5, -49.5); c.lineTo(sd * 3, -32); c.lineTo(sd * 10.4, -32); c.closePath(); c.fill(); } c.fillStyle = shade(k, -.25); for (const y of [-44, -39, -34]) dot(c, 3.6, y, .9); };
  TOP.puffer = (c, k) => { torso(c, k, -31, 11.4); c.strokeStyle = shade(k, -.22); c.lineWidth = .9; for (const y of [-45, -40, -35]) { c.beginPath(); c.moveTo(-11, y); c.quadraticCurveTo(0, y + 1.6, 11, y); c.stroke(); } c.fillStyle = shade(k, -.1); rr(c, -6, -52.5, 12, 4.4, 2.2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -48); c.lineTo(0, -31); c.stroke(); };
  TOP.blazer = (c, k) => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-10.6, -49); c.quadraticCurveTo(0, -51.5, 10.6, -49); c.lineTo(10.2, -32); c.lineTo(-10.2, -32); c.closePath(); c.fill(); c.fillStyle = grad(c, -50, -32, k); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 11, -49); c.lineTo(sd * 3.2, -49.4); c.lineTo(sd * 0.6, -41); c.lineTo(sd * 3, -32); c.lineTo(sd * 10.6, -32); c.closePath(); c.fill(); } c.fillStyle = shade(k, .2); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 3.2, -49.4); c.lineTo(sd * 7, -46); c.lineTo(sd * .8, -41); c.closePath(); c.fill(); } c.fillStyle = '#ff6fae'; c.beginPath(); c.moveTo(0, -48); c.lineTo(-2.4, -45.6); c.lineTo(0, -45); c.lineTo(2.4, -45.6); c.closePath(); c.fill(); };
  TOP.hearttee = (c, k) => { torso(c, k, -32); art.heart(c, 0, -41, 5.6, '#fff'); c.fillStyle = shade(k, -.15); c.beginPath(); c.arc(0, -50, 4.4, 0, Math.PI); c.fill(); };
  // bottoms
  add('bottom', [{ id: 'capris', name: 'Capri pants' }, { id: 'cargo', name: 'Pocket pants' }, { id: 'joggers', name: 'Joggers' }, { id: 'longskirt', name: 'Long skirt' }, { id: 'plaid', name: 'Checked skirt' }]);
  BOTTOM.capris = (c, k) => legs(c, k, -14, 9.2, true);
  BOTTOM.cargo = (c, k) => { legs(c, k, -3, 9.6, true); c.fillStyle = shade(k, -.16); for (const sd of [-1, 1]) { rr(c, sd * 5.5 + sd * 1 - 3, -25, 6, 6.4, 1); c.fill(); } };
  BOTTOM.joggers = (c, k) => { legs(c, k, -3, 9.2, true); c.fillStyle = '#fff'; for (const sd of [-1, 1]) c.fillRect(sd * 5.5 + sd * 3.6 - .6, -33, 1.2, 28); };
  BOTTOM.longskirt = (c, k) => { c.fillStyle = grad(c, -37, -6, k, .18); c.beginPath(); c.moveTo(-10.5, -37); c.lineTo(-20, -6); c.quadraticCurveTo(0, -2, 20, -6); c.lineTo(10.5, -37); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.09)'; c.lineWidth = .8; for (const x of [-9, -4, 0, 4, 9]) { c.beginPath(); c.moveTo(x * .6, -36); c.lineTo(x * 1.9, -5); c.stroke(); } c.fillStyle = shade(k, -.16); rr(c, -10.8, -37.4, 21.6, 3.2, 1.4); c.fill(); };
  BOTTOM.plaid = (c, k) => { BOTTOM.skirt(c, k); c.save(); c.beginPath(); c.moveTo(-10.5, -37); c.lineTo(-17, -19); c.quadraticCurveTo(0, -15, 17, -19); c.lineTo(10.5, -37); c.closePath(); c.clip(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; for (let x = -18; x <= 18; x += 4.5) { c.beginPath(); c.moveTo(x, -38); c.lineTo(x * 1.4, -14); c.stroke(); } for (let y = -35; y <= -17; y += 4.5) { c.beginPath(); c.moveTo(-20, y); c.lineTo(20, y); c.stroke(); } c.restore(); };
  // shoes
  add('shoes', [{ id: 'rainboots', name: 'Rain boots' }, { id: 'heels', name: 'Princess heels' }, { id: 'fuzzy', name: 'Fuzzy slippers' }, { id: 'skates', name: 'Roller skates' }]);
  SHOES.rainboots = (c, k) => wfoot(c, c => { c.fillStyle = grad(c, -13, 0, k, .18); c.beginPath(); c.moveTo(-4, -13); c.lineTo(3.8, -13); c.lineTo(3.8, -5); c.quadraticCurveTo(5, -3.6, 8.4, -2.8); c.quadraticCurveTo(9.6, -1, 8.4, 0); c.lineTo(-4.2, 0); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; rr(c, -2.8, -12, 1.4, 9, .7); c.fill(); c.fillStyle = shade(k, -.3); rr(c, -4.2, -1.4, 13, 1.5, .7); c.fill(); c.fillStyle = '#fff'; rr(c, -4.2, -13.6, 8.2, 2, 1); c.fill(); });
  SHOES.heels = (c, k) => wfoot(c, c => { c.fillStyle = k; c.beginPath(); c.moveTo(-3.4, -7); c.lineTo(3, -7); c.quadraticCurveTo(4.6, -5, 8, -3.4); c.lineTo(8.4, -1.6); c.lineTo(3, -1.6); c.lineTo(-2.4, -1.6); c.lineTo(-3.4, 0); c.lineTo(-4.2, 0); c.closePath(); c.fill(); c.fillStyle = shade(k, -.2); c.fillRect(-4, -3, 1.2, 3); c.fillStyle = '#fff'; c.globalAlpha = .7; dot(c, 5.4, -3.2, .7); c.globalAlpha = 1; art.star(c, 3.6, -5, 1.2, '#fff', 0); });
  SHOES.fuzzy = (c, k) => wfoot(c, c => { c.fillStyle = k; c.beginPath(); c.ellipse(2.4, -2.4, 7, 3.6, 0, 0, TAU); c.fill(); c.fillStyle = shade(k, .3); for (let i = 0; i < 6; i++) dot(c, -3 + i * 2.2, -4.8 + (i % 2) * .8, 1.5); c.fillStyle = '#3a2a30'; dot(c, 7.6, -3.2, .6); });
  SHOES.skates = (c, k) => wfoot(c, c => { c.fillStyle = k; c.beginPath(); c.moveTo(-3.6, -8); c.lineTo(3, -8); c.quadraticCurveTo(4.4, -6, 8, -4.2); c.quadraticCurveTo(9, -3, 8, -2.6); c.lineTo(-4, -2.6); c.closePath(); c.fill(); c.fillStyle = '#fff'; rr(c, -4.2, -3, 12.6, 1.6, .8); c.fill(); c.fillStyle = '#5a3f5e'; for (const x of [-1.6, 6.2]) dot(c, x, -.4, 1.4); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(-1, -7, 4, .9); });
  // hats
  add('hat', [{ id: 'sun', name: 'Sun hat' }, { id: 'beret', name: 'Beret' }, { id: 'santa', name: 'Santa hat' }, { id: 'pirate', name: 'Pirate hat' }, { id: 'chef', name: 'Chef hat' }, { id: 'halo', name: 'Halo' }, { id: 'ribbon', name: 'Ribbon headband' }]);
  HAT.sun = (c, R, k) => { c.fillStyle = '#f5deb0'; c.beginPath(); c.ellipse(0, -R * .78, R * 1.7, R * .42, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-R * .78, -R * .8); c.quadraticCurveTo(-R * .8, -R * 1.6, 0, -R * 1.55); c.quadraticCurveTo(R * .8, -R * 1.6, R * .78, -R * .8); c.closePath(); c.fill(); c.fillStyle = k; rr(c, -R * .8, -R * 1.02, R * 1.6, R * .24, R * .05); c.fill(); c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.ellipse(0, -R * .72, R * 1.7, R * .3, 0, 0, Math.PI); c.fill(); dot(c, R * .8, -R * .9, R * .12); c.fillStyle = shade(k, .25); dot(c, R * .8, -R * .9, R * .06); };
  HAT.beret = (c, R, k) => { c.save(); c.rotate(-.18); c.fillStyle = k; c.beginPath(); c.ellipse(-R * .05, -R * .98, R * 1.1, R * .5, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-R * .3, -R * 1.1, R * .4, R * .12, -.2, 0, TAU); c.fill(); c.fillStyle = shade(k, -.25); c.beginPath(); c.arc(0, -R * 1.46, R * .1, 0, TAU); c.fill(); c.restore(); };
  HAT.santa = (c, R, k) => { c.fillStyle = k; c.beginPath(); c.moveTo(-R * 1.05, -R * .7); c.bezierCurveTo(-R * 1.1, -R * 1.7, R * .3, -R * 1.9, R * 1.3, -R * 1.2); c.lineTo(R * 1.05, -R * .7); c.closePath(); c.fill(); c.fillStyle = '#fff'; rr(c, -R * 1.12, -R * .95, R * 2.24, R * .34, R * .17); c.fill(); dot(c, R * 1.34, -R * 1.16, R * .2); };
  HAT.pirate = (c, R, k) => { c.fillStyle = shade(k, -.3); c.beginPath(); c.moveTo(-R * 1.5, -R * .55); c.quadraticCurveTo(-R * .6, -R * 1.9, 0, -R * 1.5); c.quadraticCurveTo(R * .6, -R * 1.9, R * 1.5, -R * .55); c.quadraticCurveTo(0, -R * .95, -R * 1.5, -R * .55); c.closePath(); c.fill(); c.fillStyle = '#fff'; dot(c, 0, -R * 1.22, R * .16); rr(c, -R * .18, -R * 1.0, R * .36, R * .1, R * .04); c.fill(); c.fillStyle = shade(k, -.3); dot(c, -R * .06, -R * 1.22, R * .04); dot(c, R * .06, -R * 1.22, R * .04); };
  HAT.chef = (c, R) => { c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = R * .04; for (const [x, y, r] of [[-R * .5, -R * 1.5, R * .48], [R * .5, -R * 1.5, R * .48], [0, -R * 1.7, R * .55]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke(); } rr(c, -R * .82, -R * 1.5, R * 1.64, R * .55, R * .06); c.fill(); rr(c, -R * .85, -R * 1.02, R * 1.7, R * .2, R * .04); c.fill(); c.stroke(); };
  HAT.halo = (c, R) => { const g = c.createRadialGradient(0, -R * 1.5, 0, 0, -R * 1.5, R * 1.3); g.addColorStop(0, 'rgba(255,240,150,.5)'); g.addColorStop(1, 'rgba(255,240,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, -R * 1.5, R * 1.3, 0, TAU); c.fill(); c.strokeStyle = '#ffd54a'; c.lineWidth = R * .16; c.beginPath(); c.ellipse(0, -R * 1.5, R * .62, R * .18, 0, 0, TAU); c.stroke(); c.strokeStyle = '#fff6b8'; c.lineWidth = R * .05; c.beginPath(); c.ellipse(0, -R * 1.5, R * .62, R * .18, 0, Math.PI, TAU); c.stroke(); };
  HAT.ribbon = (c, R, k) => { c.strokeStyle = k; c.lineWidth = R * .16; c.lineCap = 'round'; c.beginPath(); c.arc(0, -R * .05, R * 1.0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.save(); c.translate(0, -R * 1.08); c.fillStyle = k; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(sd * R * .5, -R * .5, sd * R * .62, -R * .05); c.quadraticCurveTo(sd * R * .5, R * .3, 0, 0); c.fill(); } c.fillStyle = shade(k, -.2); dot(c, 0, 0, R * .11); c.restore(); };
  // faces, necks, backs, hands
  add('face', [{ id: 'shades', name: 'Sunglasses' }, { id: 'clown', name: 'Red nose' }, { id: 'whiskers', name: 'Kitty whiskers' }, { id: 'patch', name: 'Pirate patch' }]);
  FACE.shades = (c, R, k) => { c.fillStyle = '#20141a'; for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * R * .38, R * .04, R * .29, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(sd * R * .3, -R * .06, R * .1, R * .05, -.5, 0, TAU); c.fill(); c.fillStyle = '#20141a'; } c.strokeStyle = k; c.lineWidth = R * .07; c.beginPath(); c.moveTo(-R * .1, R * .0); c.lineTo(R * .1, R * .0); c.moveTo(-R * .67, R * .0); c.lineTo(-R * .97, -R * .06); c.moveTo(R * .67, R * .0); c.lineTo(R * .97, -R * .06); c.stroke(); };
  FACE.clown = (c, R) => { c.fillStyle = '#ef4a4a'; dot(c, 0, R * .3, R * .17); c.fillStyle = 'rgba(255,255,255,.6)'; dot(c, -R * .05, R * .25, R * .05); };
  FACE.whiskers = (c, R, k) => { c.fillStyle = k; c.beginPath(); c.moveTo(-R * .07, R * .28); c.lineTo(R * .07, R * .28); c.lineTo(0, R * .37); c.closePath(); c.fill(); c.strokeStyle = 'rgba(58,42,48,.75)'; c.lineWidth = R * .035; c.lineCap = 'round'; for (const sd of [-1, 1]) for (const dy of [-.06, .04, .14]) { c.beginPath(); c.moveTo(sd * R * .3, R * (.38 + dy * .4)); c.lineTo(sd * R * .82, R * (.34 + dy)); c.stroke(); } };
  FACE.patch = (c, R) => { c.strokeStyle = '#20141a'; c.lineWidth = R * .05; c.beginPath(); c.moveTo(-R * .98, -R * .3); c.lineTo(R * .6, R * .3); c.stroke(); c.fillStyle = '#20141a'; c.beginPath(); c.ellipse(-R * .36, R * .04, R * .26, R * .3, 0, 0, TAU); c.fill(); };
  add('neck', [{ id: 'lei', name: 'Flower necklace' }, { id: 'choker', name: 'Choker' }, { id: 'tie', name: 'Necktie' }, { id: 'medal', name: 'Gold medal' }]);
  NECK.lei = (c, k) => { const cols = [k, '#fff', '#ffd54a', shade(k, .2), '#ff9fc8']; for (let i = 0; i < 9; i++) { const a = Math.PI * (.08 + i * .098); const x = Math.cos(a) * 6.6, y = -51 + Math.sin(a) * 5.2; c.fillStyle = cols[i % cols.length]; for (let p = 0; p < 5; p++) dot(c, x + Math.cos(p * TAU / 5) * 1.1, y + Math.sin(p * TAU / 5) * 1.1, .9); c.fillStyle = '#ffe066'; dot(c, x, y, .7); } };
  NECK.choker = (c, k) => { c.strokeStyle = k; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.arc(0, -52.5, 5.4, .2, Math.PI - .2); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -46.4); c.lineTo(1.6, -48); c.lineTo(0, -49.6); c.lineTo(-1.6, -48); c.closePath(); c.fill(); };
  NECK.tie = (c, k) => { c.fillStyle = k; c.beginPath(); c.moveTo(-1.8, -50); c.lineTo(1.8, -50); c.lineTo(1.4, -47.4); c.lineTo(3.2, -36); c.lineTo(0, -33); c.lineTo(-3.2, -36); c.lineTo(-1.4, -47.4); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-3, -41, 6, 1.1); c.fillRect(-2.6, -38, 5.2, 1.1); };
  NECK.medal = (c, k) => { c.strokeStyle = '#ef4a4a'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-5.5, -51); c.lineTo(0, -41); c.lineTo(5.5, -51); c.stroke(); c.fillStyle = '#ffd54a'; dot(c, 0, -39.5, 4); c.strokeStyle = '#e0a020'; c.lineWidth = .7; c.stroke(); art.star(c, 0, -39.5, 2.4, '#fff3b0', 0); };
  add('back', [{ id: 'bat', name: 'Bat wings' }, { id: 'dragon', name: 'Dragon wings' }, { id: 'rainbow', name: 'Rainbow wings' }]);
  const spiky = (c, k, t, inner) => { const fl = Math.sin(t * 2.4) * .05; for (const sd of [-1, 1]) { c.save(); c.translate(sd * 5, -46); c.scale(sd, 1); c.rotate(fl); c.fillStyle = k; c.beginPath(); c.moveTo(0, 0); c.lineTo(10, -22); c.quadraticCurveTo(15, -6, 22, -16); c.quadraticCurveTo(24, 2, 32, -2); c.quadraticCurveTo(28, 10, 30, 16); c.quadraticCurveTo(16, 8, 10, 22); c.quadraticCurveTo(6, 12, 0, 12); c.closePath(); c.fill(); c.strokeStyle = shade(k, -.3); c.lineWidth = .8; for (const [x, y] of [[10, -22], [22, -16], [32, -2], [30, 16]]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(x, y); c.stroke(); } if (inner) { c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(10, -22); c.lineTo(22, -16); c.closePath(); c.fill(); } c.restore(); } };
  BACK.bat = (c, k, t) => spiky(c, '#5a3f7e', t, true);
  BACK.dragon = (c, k, t) => spiky(c, '#4fb56b', t, true);
  BACK.rainbow = (c, k, t) => { const fl = Math.sin(t * 2.4) * .04; for (const sd of [-1, 1]) { c.save(); c.translate(sd * 5, -46); c.scale(sd, 1); c.rotate(fl); ['#ff6b81', '#ffa64d', '#ffe066', '#7ed957', '#5cc8f2', '#8a7cf0'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.arc(4 + (5 - i) * .2, -8, 22 - i * 2.6, -Math.PI * .95, Math.PI * .05); c.stroke(); }); c.restore(); } };
  add('hand', [{ id: 'umbrella', name: 'Umbrella' }, { id: 'icecream', name: 'Ice cream' }, { id: 'mirror', name: 'Hand mirror' }, { id: 'plush', name: 'Bunny toy' }, { id: 'starballoon', name: 'Star balloon' }]);
  HAND.umbrella = (c, k) => { c.strokeStyle = '#7a5a4a'; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -22); c.stroke(); c.fillStyle = k; c.beginPath(); c.moveTo(-17, -22); c.quadraticCurveTo(0, -42, 17, -22); c.quadraticCurveTo(11, -25, 8.5, -22); c.quadraticCurveTo(4, -25, 0, -22); c.quadraticCurveTo(-4, -25, -8.5, -22); c.quadraticCurveTo(-11, -25, -17, -22); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(-6, -30, 4, 2, -.5, 0, TAU); c.fill(); };
  HAND.icecream = (c, k) => { c.fillStyle = '#e0b070'; c.beginPath(); c.moveTo(-4, -12); c.lineTo(4, -12); c.lineTo(0, 6); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = .5; c.beginPath(); c.moveTo(-2, -12); c.lineTo(1.4, 1); c.moveTo(2, -12); c.lineTo(-1.4, 1); c.stroke(); c.fillStyle = shade(k, .2); dot(c, 0, -14, 5.6); c.fillStyle = k; dot(c, 0, -21, 5); c.fillStyle = '#ef4a4a'; dot(c, 0, -26.4, 1.6); };
  HAND.mirror = (c) => { c.strokeStyle = '#e8c86a'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 5); c.lineTo(0, -8); c.stroke(); c.fillStyle = '#e8c86a'; dot(c, 0, -15, 8.2); c.fillStyle = '#dff2ff'; dot(c, 0, -15, 6.6); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(-2, -17, 1.6, 3.4, .6, 0, TAU); c.fill(); };
  HAND.plush = (c, k) => { c.save(); c.translate(0, 6); c.fillStyle = '#fff'; dot(c, 0, 4, 5.2); dot(c, 0, -3.6, 4.2); for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * 2, -11, 1.6, 4.4, sd * .12, 0, TAU); c.fill(); } dot(c, -4, 6, 1.9); dot(c, 4, 6, 1.9); c.fillStyle = k; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * 2, -11, .8, 3, sd * .12, 0, TAU); c.fill(); } c.fillStyle = '#3a2a30'; dot(c, -1.5, -4.4, .5); dot(c, 1.5, -4.4, .5); c.fillStyle = '#ff9fb0'; dot(c, 0, -3, .6); c.restore(); };
  HAND.starballoon = (c, k, t) => { c.strokeStyle = 'rgba(90,63,94,.6)'; c.lineWidth = .5; const sw = Math.sin(t * 1.6) * 2; c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(sw, -14, sw * 1.4 + 6, -26); c.stroke(); c.save(); c.translate(sw * 1.4 + 6, -34); art.star(c, 0, 0, 10, k, 0); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-3, -3, 1.8, 1, -.6, 0, TAU); c.fill(); c.restore(); };

  /* ------------------------------------------------------------ hooks called by P.draw */
  const dressOn = look => look.dress && DRESS[look.dress];
  W.back = (c, look, t) => { const f = look.back && BACK[look.back]; if (f) f(c, col(P.CLOTH, look.backCol), t); };
  W.bottoms = (c, look, t) => { if (dressOn(look)) return; const f = look.bottom && BOTTOM[look.bottom]; if (f) f(c, cloth(look.bottomCol), t); };
  W.shoes = (c, look, t) => { const f = look.shoes && SHOES[look.shoes]; if (f) f(c, cloth(look.shoesCol), t); };
  W.tops = (c, look) => { if (dressOn(look)) return; const f = look.top && TOP[look.top]; if (f) f(c, cloth(look.topCol)); };
  W.dress = (c, look, t) => { const f = dressOn(look); if (f) f(c, cloth(look.dressCol), t); };
  W.sleeve = (c, look, sd) => {
    if (dressOn(look)) return;
    const len = SLEEVE[look.top]; if (!len || !look.top) return;
    const k = cloth(look.topCol); c.fillStyle = look.top === 'stripes' ? k : shade(k, -.03); rr(c, -3.6, -2.4, 7.2, len + 1, 3.2); c.fill();
    if (look.top === 'stripes') { c.fillStyle = '#fff'; c.save(); rr(c, -3.6, -2.4, 7.2, len + 1, 3.2); c.clip(); for (let y = 1; y < len; y += 6) c.fillRect(-4, y, 8, 2.8); c.restore(); }
    if (len > 12) { c.fillStyle = shade(k, -.16); rr(c, -3.8, len - 2.4, 7.6, 3, 1.2); c.fill(); }
  };
  W.neck = (c, look, t) => { const f = look.neck && NECK[look.neck]; if (f) f(c, col(P.CLOTH, look.extraCol), t); };
  W.faceAcc = (c, look, R, t) => { const f = look.face && FACE[look.face]; if (f) f(c, R, col(P.CLOTH, look.extraCol), t); };
  W.hat = (c, look, R, t) => { const f = look.hat && HAT[look.hat]; if (f) f(c, R, cloth(look.hatCol), t); };
  W.handItem = (c, look, t) => { const f = look.hand && HAND[look.hand]; if (f) f(c, col(P.CLOTH, look.extraCol), t); };
  W.handNails = (c, look, base) => {
    for (let i = 0; i < 5; i++) { const k = look.nails && look.nails[base + i]; if (k == null || k < 0) continue; const a = Math.PI * (.22 + i * .14); c.fillStyle = col(P.NAIL, k); c.beginPath(); c.ellipse(Math.cos(a) * 3.3, 1 + Math.sin(a) * 3.3, .8, 1.1, a - Math.PI / 2, 0, TAU); c.fill(); }
  };

  /* ------------------------------------------------------------ the big hands for the nail salon */
  // Each finger (0 = pinky ... 4 = thumb, seen from the back of the hand) with its nail rectangle, in a 100-wide hand.
  const FING = [{ x: -29, len: 44, w: 17 }, { x: -10, len: 58, w: 17.5 }, { x: 9.5, len: 64, w: 18 }, { x: 28, len: 56, w: 17.5 }];
  P.nailRects = () => {
    const r = FING.map(f => ({ x: f.x, y: -f.len + 9, w: f.w * .74, h: 19, rot: 0 }));
    r.push({ x: 47, y: 4, w: 14, h: 17, rot: .95 }); return r;   // the thumb's nail (pivot at its centre)
  };
  P.NAILART = ['none', 'star', 'heart', 'flower', 'dots', 'stripe', 'gem'];
  function nailDraw(c, r, colr, glitter, artId, t) {
    c.save(); c.translate(r.x, r.y + r.h / 2); c.rotate(r.rot);
    const w = r.w, h = r.h;
    c.beginPath(); c.moveTo(-w / 2, h / 2); c.lineTo(-w / 2, -h / 2 + w / 2); c.arc(0, -h / 2 + w / 2, w / 2, Math.PI, TAU); c.lineTo(w / 2, h / 2); c.closePath();
    if (colr) {
      const g = c.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, shade(colr, .1)); g.addColorStop(.5, colr); g.addColorStop(1, shade(colr, -.14)); c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-w * .22, -h * .18, w * .1, h * .3, .1, 0, TAU); c.fill();
      if (glitter) { for (let i = 0; i < 9; i++) { const a = .3 + .7 * Math.abs(Math.sin(t * 2 + i * 2.1)); c.globalAlpha = a; c.fillStyle = '#fff'; dot(c, Math.sin(i * 12.9) * w * .38, Math.cos(i * 7.7) * h * .4, .9 + (i % 3) * .35); } c.globalAlpha = 1; }
      const dk = P.NAILART[artId | 0];
      if (dk === 'star') art.star(c, 0, -h * .04, w * .3, '#fff', 0);
      else if (dk === 'heart') art.heart(c, 0, -h * .04, w * .3, '#fff');
      else if (dk === 'flower') { c.fillStyle = '#fff'; for (let p = 0; p < 5; p++) dot(c, Math.cos(p * TAU / 5) * w * .18, -h * .04 + Math.sin(p * TAU / 5) * w * .18, w * .13); c.fillStyle = '#ffd54a'; dot(c, 0, -h * .04, w * .1); }
      else if (dk === 'dots') { c.fillStyle = '#fff'; for (const [x, y] of [[-.2, -.25], [.2, -.12], [-.1, .1], [.2, .25], [-.22, .3]]) dot(c, x * w, y * h, w * .07); }
      else if (dk === 'stripe') { c.fillStyle = '#fff'; c.fillRect(-w / 2, h * .12, w, h * .1); c.fillRect(-w / 2, h * .3, w, h * .06); }
      else if (dk === 'gem') { c.fillStyle = '#bfe6ff'; c.beginPath(); c.moveTo(0, -h * .2); c.lineTo(w * .22, -h * .04); c.lineTo(0, h * .14); c.lineTo(-w * .22, -h * .04); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -h * .2); c.lineTo(w * .1, -h * .06); c.lineTo(0, -h * .04); c.closePath(); c.fill(); }
      c.restore();
    } else { c.fillStyle = 'rgba(255,225,215,.55)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = .8; c.stroke(); }
    c.restore();
  }
  P.nailDraw = nailDraw;
  // Draws one hand (0 = left, 1 = right) centred on (0, 0) with the 100-unit hand scaled by `s`.
  P.drawHand = (c, look, hand, s, t = 0) => {
    const skin = P.SKIN[look.skin % P.SKIN.length], dark = shade(skin, -.1), U = s / 100;
    c.save(); c.scale(hand ? -U : U, U); c.translate(0, 8); c.lineJoin = c.lineCap = 'round';
    c.fillStyle = dark; rr(c, -26, 50, 52, 40, 14); c.fill();                       // wrist
    // thumb first (behind the palm)
    c.save(); c.translate(47, 12); c.rotate(.95); c.fillStyle = skin; rr(c, -9.5, -14, 19, 44, 9.5); c.fill(); c.restore();
    c.fillStyle = skin; rr(c, -38, -6, 76, 66, 26); c.fill();                        // palm
    FING.forEach(f => { c.fillStyle = skin; rr(c, f.x - f.w / 2, -f.len, f.w, f.len + 14, f.w / 2); c.fill(); c.strokeStyle = 'rgba(0,0,0,.06)'; c.lineWidth = .8; c.beginPath(); c.moveTo(f.x - f.w / 2 + 1, -f.len * .35); c.lineTo(f.x + f.w / 2 - 1, -f.len * .35); c.stroke(); });
    c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(-10, 24, 14, 22, .2, 0, TAU); c.fill();
    const rects = P.nailRects();
    rects.forEach((r, i) => { const idx = hand * 5 + i, k = look.nails && look.nails[idx]; nailDraw(c, r, k >= 0 ? col(P.NAIL, k) : null, look.nailGlitter && look.nailGlitter[idx], look.nailArt && look.nailArt[idx], t); });
    c.restore();
  };
  // Which nail (0-4) is at (x, y) in the hand's own drawing space (same origin and scale as drawHand)? -1 if none.
  P.nailAt = (x, y, hand, s) => {
    const U = s / 100; let lx = x / U, ly = y / U - 8; if (hand) lx = -lx;
    const rects = P.nailRects(); let best = -1, bd = 1e9;
    rects.forEach((r, i) => { const cy = r.y + r.h / 2, d = Math.hypot(lx - r.x, (ly - cy) * .8); if (d < Math.max(r.w, r.h) * .95 && d < bd) { bd = d; best = i; } });
    return best;
  };
  P.nailPos = (i, hand, s) => { const r = P.nailRects()[i], U = s / 100; return { x: (hand ? -r.x : r.x) * U, y: (r.y + r.h / 2 + 8) * U }; };
})();
