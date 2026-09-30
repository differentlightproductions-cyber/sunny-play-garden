// Coloring Book pictures. Each picture is plain data:
//
//   { id: 'bunny', name: 'Bunny', sections: [ { id, d, det? }, ... ] }
//
// - Every picture lives in a 1000 x 800 box.
// - `sections` go back to front. Each one is a closed SVG path (`d`) the child can color on its own.
//   Later sections sit in front of earlier ones, and paint never crosses into a section in front.
// - `det` (optional) are fixed details drawn with the outline: { d, w } is a line (w = width) and
//   { d, f } is a filled shape (eyes, spots). They are not colorable.
// - Section ids are saved with each child's picture, so never rename or delete one that has shipped.
//   New pictures can simply be appended to PICTURES at the bottom of this file.
// - Keep a section's own shape from crossing itself (several separate shapes side by side are fine).
//   Run `node tools/check-pictures.mjs` after editing: it checks ids, sizes and self-overlaps.
//
// The little helpers below build the path strings, so a picture reads like a drawing recipe.
(() => {
  const SPG = window.SPG = window.SPG || { games: [] };
  const INK = '#5a3f5e';
  const r1 = n => Math.round(n * 10) / 10;
  const P = (x, y) => `${r1(x)} ${r1(y)}`;

  /* ------------------------------------------------------------ shape helpers */
  const ell = (cx, cy, rx, ry, rot = 0) => {
    const a = rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return `M${P(cx + rx * c, cy + rx * s)}A${rx} ${ry} ${rot} 1 1 ${P(cx - rx * c, cy - rx * s)}A${rx} ${ry} ${rot} 1 1 ${P(cx + rx * c, cy + rx * s)}Z`;
  };
  const circ = (cx, cy, r) => ell(cx, cy, r, r);
  const rect = (x, y, w, h, r = 0) => r
    ? `M${P(x + r, y)}H${r1(x + w - r)}A${r} ${r} 0 0 1 ${P(x + w, y + r)}V${r1(y + h - r)}A${r} ${r} 0 0 1 ${P(x + w - r, y + h)}H${r1(x + r)}A${r} ${r} 0 0 1 ${P(x, y + h - r)}V${r1(y + r)}A${r} ${r} 0 0 1 ${P(x + r, y)}Z`
    : `M${P(x, y)}H${r1(x + w)}V${r1(y + h)}H${r1(x)}Z`;
  const poly = pts => 'M' + pts.map(p => P(p[0], p[1])).join('L') + 'Z';
  // Polygon with softly rounded corners.
  const rpoly = (pts, r = 24) => {
    const n = pts.length; let d = '';
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const u = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l, l]; };
      const v1 = u(p0, p1), v2 = u(p2, p1), k1 = Math.min(r, v1[2] / 2), k2 = Math.min(r, v2[2] / 2);
      d += `${i ? 'L' : 'M'}${P(p1[0] + v1[0] * k1, p1[1] + v1[1] * k1)}Q${P(p1[0], p1[1])} ${P(p1[0] + v2[0] * k2, p1[1] + v2[1] * k2)}`;
    }
    return d + 'Z';
  };
  // Smooth curve through points (closed shape by default).
  const spline = (pts, closed = true) => {
    const n = pts.length, at = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = 'M' + P(pts[0][0], pts[0][1]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2);
      d += `C${P(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6)} ${P(c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6)} ${P(c[0], c[1])}`;
    }
    return closed ? d + 'Z' : d;
  };
  const curve = pts => spline(pts, false);
  const line = (x1, y1, x2, y2) => `M${P(x1, y1)}L${P(x2, y2)}`;
  const polar = (cx, cy, fn, n = 120) => poly(Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2, r = fn(t); return [cx + Math.cos(t) * r, cy + Math.sin(t) * r]; }));
  // Round flower head with n petals.
  const flower = (cx, cy, R, amp, n) => polar(cx, cy, t => R * (1 - amp + amp * Math.abs(Math.cos(n * t / 2))), 160);
  // A pointed leaf from one point to another, `w` wide.
  const leaf = (x1, y1, x2, y2, w) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w;
    return `M${P(x1, y1)}Q${P(mx + nx, my + ny)} ${P(x2, y2)}Q${P(mx - nx, my - ny)} ${P(x1, y1)}Z`;
  };
  // The slice of an ellipse between two x positions (for stripes and split shells).
  const strip = (cx, cy, rx, ry, x1, x2) => {
    const h = x => ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
    return `M${P(x1, cy - h(x1))}A${rx} ${ry} 0 0 1 ${P(x2, cy - h(x2))}L${P(x2, cy + h(x2))}A${rx} ${ry} 0 0 1 ${P(x1, cy + h(x1))}Z`;
  };
  const dome = (cx, cy, rx, ry, x1, x2) => {
    const h = x => ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
    return `M${P(x1, cy - h(x1))}A${rx} ${ry} 0 0 1 ${P(x2, cy - h(x2))}L${P(x2, cy)}L${P(x1, cy)}Z`;
  };
  const drop = (cx, cy, s) => `M${P(cx, cy - 1.5 * s)}C${P(cx + .35 * s, cy - .7 * s)} ${P(cx + s, cy - .1 * s)} ${P(cx + s, cy + .45 * s)}A${s} ${s} 0 0 1 ${P(cx - s, cy + .45 * s)}C${P(cx - s, cy - .1 * s)} ${P(cx - .35 * s, cy - .7 * s)} ${P(cx, cy - 1.5 * s)}Z`;
  const star = (cx, cy, R, r, n = 5, rot = -90) => poly(Array.from({ length: n * 2 }, (_, i) => { const a = (rot + i * 180 / n) * Math.PI / 180, k = i % 2 ? r : R; return [cx + Math.cos(a) * k, cy + Math.sin(a) * k]; }));
  const compound = (...ds) => ds.join('');

  /* ------------------------------------------------------------ details */
  const eye = (x, y, r) => [{ d: ell(x, y, r * .85, r * 1.15), f: INK }, { d: circ(x - r * .28, y - r * .42, r * .38), f: '#fff' }];
  // A friendly face for a head of radius r centered at (x, y).
  const face = (x, y, r, { gap = .34, eyeY = -.06, smile = true } = {}) => [
    ...eye(x - r * gap, y + r * eyeY, r * .12), ...eye(x + r * gap, y + r * eyeY, r * .12),
    ...(smile ? [{ d: `M${P(x - r * .17, y + r * .2)}Q${P(x, y + r * .39)} ${P(x + r * .17, y + r * .2)}`, w: Math.max(6, r * .05) }] : [])
  ];
  const nose = (x, y, r) => ({ d: ell(x, y, r, r * .72), f: INK });

  /* ------------------------------------------------------------ shared scenery */
  const sky = () => ({ id: 'sky', d: rect(0, 0, 1000, 800) });
  const ground = (y = 610, id = 'ground') => ({ id, d: `M0 ${y}C230 ${y - 80} 560 ${y + 40} 1000 ${y - 50}V800H0Z` });
  const sun = (x = 860, y = 125, r = 68) => ({
    id: 'sun', d: circ(x, y, r),
    det: [...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return { d: line(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, x + Math.cos(a) * r * 1.62, y + Math.sin(a) * r * 1.62), w: 11 }; }), ...face(x, y + 4, r * .8)]
  });
  const cloud = (x, y, s = 1, id = 'cloud') => {
    const k = n => r1(n * s);
    return {
      id, d: `M${P(x - 90 * s, y + 32 * s)}A${k(32)} ${k(32)} 0 0 1 ${P(x - 84 * s, y - 30 * s)}A${k(46)} ${k(46)} 0 0 1 ${P(x - 6 * s, y - 52 * s)}A${k(44)} ${k(44)} 0 0 1 ${P(x + 72 * s, y - 22 * s)}A${k(32)} ${k(32)} 0 0 1 ${P(x + 84 * s, y + 32 * s)}Z`,
      det: face(x - 4 * s, y - 2 * s, 56 * s)
    };
  };

  /* ------------------------------------------------------------ the pictures */
  const PICTURES = [
    {
      id: 'bunny', name: 'Bunny', sections: [
        sky(), sun(), cloud(190, 150), ground(),
        { id: 'ears', d: compound(ell(415, 190, 52, 135, -10), ell(585, 190, 52, 135, 10)) },
        { id: 'ear-in', d: compound(ell(417, 200, 26, 98, -10), ell(583, 200, 26, 98, 10)) },
        { id: 'body', d: ell(500, 650, 150, 125) },
        { id: 'belly', d: ell(500, 665, 92, 88) },
        { id: 'head', d: ell(500, 410, 178, 160), det: [...face(500, 410, 165), nose(500, 440, 20)] },
        { id: 'carrot-top', d: spline([[650, 590], [610, 520], [598, 468], [630, 486], [660, 520], [672, 452], [700, 476], [702, 530], [720, 490], [742, 506], [714, 570]]) },
        { id: 'carrot', d: spline([[612, 590], [714, 586], [704, 660], [668, 762], [636, 700]]), det: [{ d: line(640, 630, 668, 638), w: 8 }, { d: line(650, 676, 676, 682), w: 8 }] }
      ]
    },
    {
      id: 'bear', name: 'Bear', sections: [
        sky(), sun(140, 125), cloud(820, 170), ground(),
        { id: 'ears', d: compound(circ(340, 245, 62), circ(660, 245, 62)) },
        { id: 'body', d: ell(500, 650, 175, 140) },
        { id: 'belly', d: ell(500, 665, 108, 100) },
        { id: 'head', d: ell(500, 400, 188, 168), det: face(500, 385, 170) },
        { id: 'muzzle', d: ell(500, 470, 82, 62), det: [nose(500, 448, 26), { d: `M500 474V492`, w: 8 }, { d: `M${P(470, 494)}Q${P(500, 516)} ${P(530, 494)}`, w: 8 }] },
        { id: 'pot', d: rect(690, 620, 170, 150, 44), det: [{ d: spline([[775, 690], [745, 665], [775, 655], [805, 665]]), w: 8 }] },
        { id: 'honey', d: ell(775, 626, 88, 30) }
      ]
    },
    {
      id: 'cat', name: 'Cat', sections: [
        sky(), sun(), cloud(200, 145), ground(),
        { id: 'yarn', d: circ(230, 690, 88), det: [{ d: curve([[165, 665], [215, 640], [280, 655]]), w: 8 }, { d: curve([[150, 705], [230, 680], [300, 705]]), w: 8 }, { d: curve([[180, 750], [240, 725], [290, 745]]), w: 8 }, { d: curve([[318, 700], [400, 720], [420, 770]]), w: 8 }] },
        { id: 'tail', d: spline([[640, 730], [730, 705], [790, 630], [780, 545], [826, 528], [846, 590], [815, 700], [720, 775], [630, 770]]) },
        { id: 'body', d: ell(500, 640, 152, 145) },
        { id: 'belly', d: ell(500, 665, 92, 95) },
        { id: 'ears', d: compound(rpoly([[350, 305], [352, 150], [470, 250]], 26), rpoly([[650, 305], [648, 150], [530, 250]], 26)) },
        { id: 'ear-in', d: compound(rpoly([[372, 268], [376, 188], [440, 250]], 12), rpoly([[628, 268], [624, 188], [560, 250]], 12)) },
        {
          id: 'head', d: ell(500, 400, 172, 150),
          det: [...face(500, 395, 158), nose(500, 425, 17), { d: line(340, 415, 270, 400), w: 7 }, { d: line(340, 440, 272, 448), w: 7 }, { d: line(660, 415, 730, 400), w: 7 }, { d: line(660, 440, 728, 448), w: 7 }, { d: line(500, 250, 500, 300), w: 8 }, { d: line(455, 258, 462, 300), w: 8 }, { d: line(545, 258, 538, 300), w: 8 }]
        }
      ]
    },
    {
      id: 'fox', name: 'Fox', sections: [
        sky(), cloud(820, 140), ground(),
        { id: 'bush', d: ell(150, 650, 135, 95) },
        { id: 'tail', d: ell(720, 600, 175, 100, -40) },
        { id: 'tail-tip', d: ell(720 + Math.cos(-40 * Math.PI / 180) * 130, 600 + Math.sin(-40 * Math.PI / 180) * 130, 45, 62, -40) },
        { id: 'body', d: ell(500, 650, 140, 135) },
        { id: 'chest', d: ell(500, 665, 82, 92) },
        { id: 'ears', d: compound(rpoly([[340, 330], [318, 130], [455, 260]], 26), rpoly([[660, 330], [682, 130], [545, 260]], 26)) },
        { id: 'head', d: spline([[500, 240], [605, 255], [690, 325], [725, 425], [640, 505], [500, 555], [360, 505], [275, 425], [310, 325], [395, 255]]), det: face(500, 385, 180) },
        { id: 'muzzle', d: spline([[500, 440], [590, 448], [655, 478], [612, 532], [500, 562], [388, 532], [345, 478], [410, 448]]), det: [nose(500, 470, 26), { d: `M${P(474, 506)}Q${P(500, 528)} ${P(526, 506)}`, w: 8 }] }
      ]
    },
    {
      id: 'frog', name: 'Frog', sections: [
        sky(), sun(140, 125), cloud(830, 150), ground(560, 'bank'),
        { id: 'pond', d: ell(500, 690, 470, 100) },
        { id: 'pad', d: ell(500, 665, 250, 62), det: [{ d: curve([[300, 665], [380, 690], [500, 700], [620, 690], [700, 665]]), w: 6 }] },
        { id: 'legs', d: compound(ell(345, 620, 95, 58, -12), ell(655, 620, 95, 58, 12)) },
        { id: 'body', d: ell(500, 545, 182, 140) },
        { id: 'belly', d: ell(500, 580, 112, 88) },
        { id: 'head', d: ell(500, 455, 195, 118), det: [{ d: `M${P(420, 505)}Q${P(500, 550)} ${P(580, 505)}`, w: 9 }, { d: circ(462, 478, 6), f: INK }, { d: circ(538, 478, 6), f: INK }] },
        {
          id: 'eyes', d: compound(circ(390, 350, 68), circ(610, 350, 68)),
          det: [{ d: circ(392, 352, 34), f: '#fff' }, { d: circ(608, 352, 34), f: '#fff' }, { d: ell(398, 356, 15, 20), f: INK }, { d: ell(602, 356, 15, 20), f: INK }, { d: circ(392, 348, 6), f: '#fff' }, { d: circ(596, 348, 6), f: '#fff' }]
        }
      ]
    },
    {
      id: 'panda', name: 'Panda', sections: [
        sky(), sun(700, 115), cloud(370, 120, .8), ground(),
        { id: 'bamboo', d: compound(rect(105, 120, 56, 650, 14), rect(840, 160, 56, 610, 14)), det: [105, 250, 390, 530, 660].map(y => ({ d: line(105, y, 161, y), w: 8 })).concat([200, 340, 480, 620, 740].map(y => ({ d: line(840, y, 896, y), w: 8 }))) },
        { id: 'leaves', d: compound(leaf(133, 150, 230, 60, 24), leaf(133, 200, 30, 110, 24), leaf(868, 190, 770, 100, 24), leaf(868, 240, 960, 150, 24)) },
        { id: 'ears', d: compound(circ(335, 245, 60), circ(665, 245, 60)) },
        { id: 'body', d: ell(500, 650, 172, 142) },
        { id: 'limbs', d: compound(ell(345, 610, 62, 105, 25), ell(655, 610, 62, 105, -25), ell(390, 760, 70, 42), ell(610, 760, 70, 42)) },
        { id: 'head', d: ell(500, 410, 192, 168) },
        {
          id: 'patches', d: compound(ell(415, 400, 55, 72, 22), ell(585, 400, 55, 72, -22)),
          det: [{ d: ell(422, 398, 13, 18), f: '#fff' }, { d: ell(578, 398, 13, 18), f: '#fff' }, { d: circ(418, 392, 5), f: INK }, { d: circ(574, 392, 5), f: INK }, nose(500, 462, 22), { d: `M500 480V498`, w: 8 }, { d: `M${P(474, 500)}Q${P(500, 522)} ${P(526, 500)}`, w: 8 }]
        }
      ]
    },
    {
      id: 'sunflower', name: 'Sunflower', sections: [
        sky(), sun(150, 120), cloud(830, 150), ground(),
        { id: 'leaf-l', d: leaf(492, 640, 330, 540, 58) },
        { id: 'leaf-r', d: leaf(508, 690, 672, 590, 58) },
        { id: 'stem', d: rect(472, 380, 56, 400, 22) },
        { id: 'petals', d: flower(500, 290, 225, .26, 16) },
        { id: 'center', d: circ(500, 290, 112), det: face(500, 292, 105) }
      ]
    },
    {
      id: 'tulips', name: 'Tulips', sections: [
        sky(), sun(), cloud(200, 130), ground(),
        { id: 'stems', d: compound(rect(224, 340, 52, 420, 20), rect(474, 290, 52, 470, 20), rect(724, 380, 52, 380, 20)) },
        { id: 'leaves', d: compound(leaf(236, 700, 110, 540, 42), leaf(766, 690, 890, 540, 42), leaf(488, 720, 380, 610, 40)) },
        ...[[250, 210, 'l'], [500, 150, 'm'], [750, 240, 'r']].flatMap(([cx, y, k]) => [
          { id: `cup-${k}`, d: `M${P(cx - 82, y)}L${P(cx - 48, y + 48)}L${P(cx, y - 12)}L${P(cx + 48, y + 48)}L${P(cx + 82, y)}C${P(cx + 96, y + 92)} ${P(cx + 44, y + 144)} ${P(cx, y + 150)}C${P(cx - 44, y + 144)} ${P(cx - 96, y + 92)} ${P(cx - 82, y)}Z` },
          { id: `petal-${k}`, d: `M${P(cx, y - 12)}C${P(cx - 62, y + 40)} ${P(cx - 56, y + 122)} ${P(cx, y + 150)}C${P(cx + 56, y + 122)} ${P(cx + 62, y + 40)} ${P(cx, y - 12)}Z` }
        ])
      ]
    },
    {
      id: 'daisy', name: 'Daisy', sections: [
        sky(), sun(), cloud(170, 130), ground(),
        { id: 'stem-small', d: rect(164, 620, 52, 170, 20) },
        { id: 'small-petals', d: flower(190, 560, 100, .26, 10) },
        { id: 'small-center', d: circ(190, 560, 40) },
        { id: 'leaf-l', d: leaf(492, 660, 350, 570, 52) },
        { id: 'leaf-r', d: leaf(508, 620, 650, 540, 52) },
        { id: 'stem', d: rect(474, 380, 52, 400, 20) },
        { id: 'petals', d: flower(500, 285, 205, .22, 18) },
        { id: 'center', d: circ(500, 285, 82), det: face(500, 288, 76) }
      ]
    },
    {
      id: 'pumpkin', name: 'Pumpkin', sections: [
        sky(), sun(), cloud(180, 150), ground(),
        { id: 'mini', d: ell(200, 700, 88, 70), det: [{ d: ell(180, 690, 8, 12), f: INK }, { d: ell(222, 690, 8, 12), f: INK }] },
        { id: 'stem', d: rect(472, 300, 56, 120, 14) },
        { id: 'seg-l2', d: ell(340, 580, 112, 165) },
        { id: 'seg-r2', d: ell(660, 580, 112, 165) },
        { id: 'seg-l', d: ell(415, 575, 112, 178) },
        { id: 'seg-r', d: ell(585, 575, 112, 178) },
        { id: 'seg-m', d: ell(500, 570, 100, 185), det: face(500, 555, 130, { gap: .3 }) },
        { id: 'leaf', d: leaf(535, 350, 720, 280, 62) }
      ]
    },
    {
      id: 'strawberry', name: 'Strawberry', sections: [
        sky(), sun(), cloud(200, 130), ground(650, 'table'),
        { id: 'blossom', d: flower(860, 470, 90, .3, 5) },
        { id: 'blossom-c', d: circ(860, 470, 36) },
        { id: 'small-berry', d: `M${P(190, 560)}C${P(250, 546)} ${P(290, 580)} ${P(282, 632)}C${P(276, 690)} ${P(226, 730)} ${P(190, 745)}C${P(154, 730)} ${P(104, 690)} ${P(98, 632)}C${P(90, 580)} ${P(130, 546)} ${P(190, 560)}Z`, det: [{ d: ell(160, 620, 6, 9), f: INK }, { d: ell(215, 615, 6, 9), f: INK }, { d: ell(190, 668, 6, 9), f: INK }] },
        { id: 'stem', d: rect(472, 195, 56, 100, 16) },
        { id: 'berry', d: `M${P(500, 300)}C${P(650, 265)} ${P(770, 340)} ${P(745, 480)}C${P(725, 600)} ${P(595, 700)} ${P(500, 745)}C${P(405, 700)} ${P(275, 600)} ${P(255, 480)}C${P(230, 340)} ${P(350, 265)} ${P(500, 300)}Z`, det: [...face(500, 480, 130), ...[[400, 380], [590, 380], [340, 500], [660, 500], [420, 600], [580, 600], [500, 660]].map(([x, y]) => ({ d: ell(x, y, 7, 11), f: INK }))] },
        { id: 'calyx', d: poly(Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, r = i % 2 ? 62 : 150; return [500 + Math.cos(a) * r, 315 + Math.sin(a) * r * .5]; })) }
      ]
    },
    {
      id: 'watermelon', name: 'Watermelon', sections: [
        sky(), sun(), cloud(480, 120, .85), ground(),
        { id: 'melon', d: ell(255, 585, 215, 170) },
        { id: 'stripes', d: compound(strip(255, 585, 215, 170, 80, 155), strip(255, 585, 215, 170, 218, 292), strip(255, 585, 215, 170, 355, 430)) },
        { id: 'rind', d: `M${P(480, 430)}A${250} ${250} 0 0 0 ${P(980, 430)}Z` },
        { id: 'pith', d: `M${P(508, 430)}A${222} ${222} 0 0 0 ${P(952, 430)}Z` },
        { id: 'flesh', d: `M${P(538, 430)}A${192} ${192} 0 0 0 ${P(922, 430)}Z`, det: [[620, 500], [730, 545], [840, 500], [680, 600], [790, 610]].map(([x, y]) => ({ d: ell(x, y, 12, 20, 15), f: INK })) }
      ]
    },
    {
      id: 'bee', name: 'Bee', sections: [
        sky(), sun(140, 125), cloud(830, 130), ground(),
        { id: 'petals', d: flower(800, 630, 110, .3, 6) },
        { id: 'flower-c', d: circ(800, 630, 42) },
        { id: 'wings', d: compound(ell(468, 250, 55, 118, -22), ell(612, 250, 55, 118, 22)) },
        { id: 'tail', d: strip(520, 420, 190, 140, 630, 710) },
        { id: 'stripe-b', d: strip(520, 420, 190, 140, 550, 630) },
        { id: 'mid', d: strip(520, 420, 190, 140, 470, 550) },
        { id: 'stripe-a', d: strip(520, 420, 190, 140, 390, 470) },
        { id: 'back', d: strip(520, 420, 190, 140, 330, 390), det: [{ d: line(710, 420, 770, 420), w: 12 }] },
        { id: 'head', d: circ(340, 430, 108), det: [...face(340, 435, 108), { d: curve([[300, 330], [280, 250], [240, 215]]), w: 9 }, { d: circ(236, 210, 14), f: INK }, { d: curve([[380, 330], [410, 250], [450, 215]]), w: 9 }, { d: circ(454, 210, 14), f: INK }] }
      ]
    },
    {
      id: 'butterfly', name: 'Butterfly', sections: [
        sky(), sun(140, 125), cloud(830, 150), ground(),
        { id: 'flower', d: flower(180, 660, 92, .3, 8) },
        { id: 'flower-c', d: circ(180, 660, 36) },
        { id: 'lower', d: compound(spline([[470, 440], [340, 445], [245, 520], [270, 640], [390, 655], [462, 545]]), spline([[530, 440], [660, 445], [755, 520], [730, 640], [610, 655], [538, 545]])) },
        { id: 'upper', d: compound(spline([[470, 380], [390, 190], [230, 165], [150, 255], [235, 385], [430, 435]]), spline([[530, 380], [610, 190], [770, 165], [850, 255], [765, 385], [570, 435]])) },
        { id: 'spots-up', d: compound(circ(300, 290, 48), circ(700, 290, 48)) },
        { id: 'spots-low', d: compound(circ(350, 550, 38), circ(650, 550, 38)) },
        { id: 'body', d: ell(500, 450, 34, 165) },
        { id: 'head', d: circ(500, 265, 50), det: [...eye(482, 262, 8), ...eye(518, 262, 8), { d: curve([[485, 225], [460, 170], [420, 150]]), w: 8 }, { d: curve([[515, 225], [540, 170], [580, 150]]), w: 8 }, { d: circ(417, 148, 11), f: INK }, { d: circ(583, 148, 11), f: INK }] }
      ]
    },
    {
      id: 'ladybug', name: 'Ladybug', sections: [
        sky(), sun(), cloud(200, 130), ground(600),
        { id: 'leaf', d: leaf(40, 690, 960, 690, 120), det: [{ d: line(60, 690, 940, 690), w: 8 }] },
        { id: 'drops', d: compound(drop(150, 330, 34), drop(860, 400, 30)) },
        { id: 'head', d: circ(500, 205, 98), det: [...eye(465, 190, 12), ...eye(535, 190, 12), { d: curve([[470, 125], [430, 70], [385, 50]]), w: 8 }, { d: circ(382, 48, 12), f: INK }, { d: curve([[530, 125], [570, 70], [615, 50]]), w: 8 }, { d: circ(618, 48, 12), f: INK }] },
        { id: 'shell-l', d: strip(500, 445, 235, 190, 265, 497), det: [{ d: line(300, 590, 250, 640), w: 9 }, { d: line(340, 620, 310, 675), w: 9 }] },
        { id: 'shell-r', d: strip(500, 445, 235, 190, 503, 735), det: [{ d: line(700, 590, 750, 640), w: 9 }, { d: line(660, 620, 690, 675), w: 9 }] },
        { id: 'spots-l', d: compound(circ(385, 400, 44), circ(410, 525, 40)) },
        { id: 'spots-r', d: compound(circ(615, 400, 44), circ(590, 525, 40)) }
      ]
    },
    {
      id: 'hedgehog', name: 'Hedgehog', sections: [
        sky(), sun(), cloud(200, 130), ground(),
        { id: 'stem', d: rect(105, 655, 56, 95, 16) },
        { id: 'cap', d: `M${P(40, 665)}A${100} ${88} 0 0 1 ${P(226, 665)}Z`, det: [{ d: circ(100, 625, 12), f: '#fff' }, { d: circ(160, 610, 10), f: '#fff' }] },
        { id: 'spikes', d: poly([[240, 640], ...Array.from({ length: 21 }, (_, i) => { const a = Math.PI + i * Math.PI / 20 * 1.03, r = i % 2 ? 195 : 255; return [480 + Math.cos(a) * r * 1.02, 610 + Math.sin(a) * r * .92]; }), [730, 640]]) },
        { id: 'body', d: ell(560, 620, 200, 110) },
        { id: 'face', d: ell(700, 575, 130, 105), det: [...eye(680, 550, 14), nose(805, 578, 20), { d: `M${P(720, 620)}Q${P(750, 640)} ${P(778, 618)}`, w: 8 }] },
        { id: 'feet', d: compound(ell(470, 735, 65, 36), ell(650, 735, 65, 36)) },
        { id: 'apple', d: circ(420, 395, 72), det: [{ d: curve([[420, 325], [425, 300], [440, 285]]), w: 9 }, { d: leaf(440, 300, 490, 285, 14), f: INK }] }
      ]
    },
    {
      id: 'duckling', name: 'Duckling', sections: [
        sky(), sun(140, 125), cloud(830, 140), ground(580, 'bank'),
        { id: 'pond', d: ell(500, 695, 480, 100), det: [{ d: curve([[120, 720], [170, 745], [230, 720]]), w: 7 }, { d: curve([[760, 735], [815, 758], [875, 735]]), w: 7 }] },
        { id: 'pad', d: ell(160, 640, 115, 42) },
        { id: 'tail', d: rpoly([[330, 540], [235, 480], [318, 620]], 22) },
        { id: 'body', d: ell(490, 570, 195, 135) },
        { id: 'wing', d: spline([[420, 545], [490, 520], [560, 560], [520, 630], [440, 630]]) },
        { id: 'head', d: circ(660, 395, 118), det: [...eye(690, 375, 15), { d: curve([[650, 285], [645, 250], [672, 235]]), w: 9 }] },
        { id: 'beak', d: spline([[745, 415], [850, 425], [842, 470], [745, 470]]) }
      ]
    },
    {
      id: 'turtle', name: 'Turtle', sections: [
        sky(), sun(), cloud(200, 140),
        { id: 'sea', d: `M0 470C120 440 220 500 340 470S560 440 680 470S900 500 1000 460V800H0Z` },
        { id: 'sand', d: ell(500, 705, 430, 95) },
        { id: 'starfish', d: star(880, 690, 78, 36), det: [] },
        { id: 'legs', d: compound(ell(650, 610, 62, 46, 10), ell(340, 610, 62, 46, -10)) },
        { id: 'head', d: ell(790, 480, 95, 82), det: [...eye(815, 462, 13), { d: `M${P(800, 510)}Q${P(830, 528)} ${P(860, 505)}`, w: 8 }] },
        { id: 'shell', d: `M${P(265, 545)}A${235} ${215} 0 0 1 ${P(735, 545)}Z` },
        { id: 'rim', d: ell(500, 548, 250, 44) },
        { id: 'plate-c', d: rpoly(Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3 + Math.PI / 6; return [500 + Math.cos(a) * 82, 440 + Math.sin(a) * 74]; }), 20) },
        { id: 'plate-l', d: rpoly(Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3 + Math.PI / 6; return [368 + Math.cos(a) * 58, 490 + Math.sin(a) * 52]; }), 16) },
        { id: 'plate-r', d: rpoly(Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3 + Math.PI / 6; return [632 + Math.cos(a) * 58, 490 + Math.sin(a) * 52]; }), 16) }
      ]
    },
    {
      id: 'rainbucket', name: 'Rain Bucket', sections: [
        sky(), sun(870, 110, 62), ground(640),
        ...[[450, 'band-a'], [380, 'band-b'], [310, 'band-c'], [240, 'band-d']].map(([R, id]) => ({ id, d: `M${P(500 - R, 640)}A${R} ${R} 0 0 1 ${P(500 + R, 640)}L${P(500 + R - 70, 640)}A${R - 70} ${R - 70} 0 0 0 ${P(500 - R + 70, 640)}Z` })),
        { id: 'cloud', d: cloud(200, 130, 1.05).d, det: cloud(200, 130, 1.05).det },
        { id: 'drops', d: compound(drop(90, 300, 28), drop(150, 380, 28), drop(70, 450, 28)) },
        { id: 'bucket', d: `M${P(388, 585)}L${P(612, 585)}L${P(582, 740)}Q${P(500, 768)} ${P(418, 740)}Z` },
        { id: 'water', d: `M${P(397, 632)}Q${P(435, 616)} ${P(468, 632)}T${P(535, 632)}T${P(603, 632)}L${P(582, 740)}Q${P(500, 768)} ${P(418, 740)}Z`, det: face(500, 690, 96, { gap: .3, eyeY: -.02 }) },
        { id: 'rim', d: rect(362, 556, 276, 50, 25), det: [{ d: `M${P(392, 558)}A${108} ${108} 0 0 1 ${P(608, 562)}`, w: 9 }] }
      ]
    },
    {
      id: 'rescue', name: 'Pet Rescue', sections: [
        sky(), sun(130, 125), ground(640),
        { id: 'canopy-l', d: dome(500, 285, 200, 140, 300, 433) },
        { id: 'canopy-m', d: dome(500, 285, 200, 140, 433, 567) },
        { id: 'canopy-r', d: dome(500, 285, 200, 140, 567, 700), det: [{ d: line(320, 285, 470, 425), w: 7 }, { d: line(500, 285, 500, 425), w: 7 }, { d: line(680, 285, 530, 425), w: 7 }] },
        { id: 'cat-ears', d: compound(rpoly([[430, 450], [428, 368], [497, 425]], 12), rpoly([[570, 450], [572, 368], [503, 425]], 12)) },
        { id: 'cat-body', d: ell(500, 545, 60, 62) },
        { id: 'cat-head', d: ell(500, 468, 72, 60), det: [...face(500, 465, 66, { gap: .36 }), nose(500, 478, 7)] },
        { id: 'net', d: ell(500, 715, 320, 48), det: [{ d: line(260, 715, 740, 715), w: 6 }, { d: line(400, 672, 380, 758), w: 6 }, { d: line(500, 668, 500, 762), w: 6 }, { d: line(600, 672, 620, 758), w: 6 }] },
        { id: 'coats', d: compound(rect(50, 545, 150, 215, 60), rect(800, 545, 150, 215, 60)), det: [{ d: line(125, 580, 125, 760), w: 7 }, { d: line(875, 580, 875, 760), w: 7 }] },
        { id: 'faces', d: compound(circ(125, 490, 62), circ(875, 490, 62)), det: [...face(125, 495, 62, { smile: true }), ...face(875, 495, 62, { smile: true })] },
        { id: 'helmets', d: compound(`M${P(52, 480)}A${73} ${70} 0 0 1 ${P(198, 480)}Z`, `M${P(802, 480)}A${73} ${70} 0 0 1 ${P(948, 480)}Z`) }
      ]
    }
  ];

  SPG.pictures = PICTURES;
  SPG.pictureKit = { ell, circ, rect, poly, rpoly, spline, curve, line, polar, flower, leaf, strip, dome, drop, star, compound, face, eye, nose, sky, ground, sun, cloud, INK };
})();
