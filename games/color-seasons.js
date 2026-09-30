// Coloring Book: seasonal pictures (Halloween, Thanksgiving and fall, Christmas). Same format and rules as
// games/color-pictures.js, which must load first. Each picture has a `group` matching SPG.pictureGroups.
(() => {
  const SPG = window.SPG;
  const K = SPG.pictureKit;
  const { r1, P, ell, circ, rect, poly, rpoly, spline, curve, line, polar, leaf, strip, dome, drop, star, compound, ring, crescent, face, eye, nose, sky, ground, cloud, INK } = K;
  const stars = (list, id = 'stars') => ({ id, d: compound(...list.map(([x, y, r]) => star(x, y, r, r * .46))) });
  // A full moon: the moon itself plus three craters that can each be colored on their own.
  const moonFull = (x, y, r, id = 'moon') => [
    { id, d: circ(x, y, r) },
    { id: id + '-c1', d: circ(x - r * .3, y - r * .22, r * .28) },
    { id: id + '-c2', d: circ(x + r * .3, y + r * .3, r * .28) },
    { id: id + '-c3', d: circ(x + r * .36, y - r * .42, r * .26) }
  ];
  const moonCres = (x, y, r, id = 'moon') => ({ id, d: crescent(x, y, r) });
  const hill = (y, id = 'ground', flip = false) => ({ id, d: flip ? `M0 ${y - 30}C260 ${y + 40} 620 ${y - 70} 1000 ${y + 10}V800H0Z` : `M0 ${y}C240 ${y - 80} 600 ${y + 50} 1000 ${y - 40}V800H0Z` });
  // A five-part pumpkin (like the garden one) centered at (cx, cy), scaled by s.
  const pumpkin = (cx, cy, s, pre = '') => [
    { id: pre + 'seg-l2', d: ell(cx - 160 * s, cy + 10 * s, 112 * s, 165 * s) }, { id: pre + 'seg-r2', d: ell(cx + 160 * s, cy + 10 * s, 112 * s, 165 * s) },
    { id: pre + 'seg-l', d: ell(cx - 85 * s, cy + 5 * s, 112 * s, 178 * s) }, { id: pre + 'seg-r', d: ell(cx + 85 * s, cy + 5 * s, 112 * s, 178 * s) },
    { id: pre + 'seg-m', d: ell(cx, cy, 100 * s, 185 * s) }
  ];
  const carved = (cx, cy, s) => [
    { d: rpoly([[cx - 80 * s, cy - 20 * s], [cx - 25 * s, cy - 20 * s], [cx - 52 * s, cy - 80 * s]], 8 * s), f: INK }, { d: rpoly([[cx + 25 * s, cy - 20 * s], [cx + 80 * s, cy - 20 * s], [cx + 52 * s, cy - 80 * s]], 8 * s), f: INK },
    { d: rpoly([[cx - 14 * s, cy + 6 * s], [cx + 14 * s, cy + 6 * s], [cx, cy + 32 * s]], 5 * s), f: INK },
    { d: poly([[cx - 82 * s, cy + 48 * s], [cx - 48 * s, cy + 40 * s], [cx - 26 * s, cy + 66 * s], [cx, cy + 40 * s], [cx + 26 * s, cy + 66 * s], [cx + 48 * s, cy + 40 * s], [cx + 82 * s, cy + 48 * s], [cx + 56 * s, cy + 98 * s], [cx, cy + 112 * s], [cx - 56 * s, cy + 98 * s]]), f: INK }
  ];
  // A little bat: two wings and a body, each colorable.
  const bat = (x, y, s, pre = '') => [
    { id: pre + 'wing-l', d: rpoly([[x - 24 * s, y - 4 * s], [x - 70 * s, y - 50 * s], [x - 160 * s, y - 38 * s], [x - 128 * s, y + 4 * s], [x - 168 * s, y + 38 * s], [x - 96 * s, y + 32 * s], [x - 58 * s, y + 58 * s], [x - 30 * s, y + 28 * s]], 10 * s) },
    { id: pre + 'wing-r', d: rpoly([[x + 24 * s, y - 4 * s], [x + 70 * s, y - 50 * s], [x + 160 * s, y - 38 * s], [x + 128 * s, y + 4 * s], [x + 168 * s, y + 38 * s], [x + 96 * s, y + 32 * s], [x + 58 * s, y + 58 * s], [x + 30 * s, y + 28 * s]], 10 * s) },
    { id: pre + 'body', d: ell(x, y + 6 * s, 30 * s + 14, 42 * s + 16) }
  ];
  // A wrapped candy as one shape.
  const wrapped = (cx, cy, w = 95, h = 38, rot = 0) => {
    const a = rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), T = (x, y) => P(cx + x * c - y * sn, cy + x * sn + y * c);
    return `M${T(-w, -h)}L${T(-w * .58, -h * .42)}Q${T(0, -h * 1.15)} ${T(w * .58, -h * .42)}L${T(w, -h)}L${T(w * .86, 0)}L${T(w, h)}L${T(w * .58, h * .42)}Q${T(0, h * 1.15)} ${T(-w * .58, h * .42)}L${T(-w, h)}L${T(-w * .86, 0)}Z`;
  };
  const MAPLE = [[0, -1], [.16, -.62], [.46, -.72], [.4, -.3], [.86, -.28], [.6, .04], [.92, .34], [.46, .34], [.5, .56], [.12, .42], [.08, .95], [-.08, .95], [-.12, .42], [-.5, .56], [-.46, .34], [-.92, .34], [-.6, .04], [-.86, -.28], [-.4, -.3], [-.46, -.72], [-.16, -.62]];
  const maple = (cx, cy, R, rot = 0) => {
    const a = rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
    return rpoly(MAPLE.map(([x, y]) => [cx + (x * c - y * sn) * R, cy + (x * sn + y * c) * R]), R * .07);
  };
  // Thick line through points, as one closed outline (for branches, candy canes, runners).
  const thick = (pts, w) => {
    const L = [], R = [];
    pts.forEach((q, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      L.push([q[0] - dy / l * w, q[1] + dx / l * w]); R.push([q[0] + dy / l * w, q[1] - dx / l * w]);
    });
    return poly([...L, ...R.reverse()]);
  };
  const arcPts = (cx, cy, r, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const fir = (cx, top, bottom, half, id) => ({ id, d: rpoly([[cx - half, bottom], [cx, top], [cx + half, bottom]], 30) });
  const bowPath = (x, y, s = 1) => spline([[0, 0], [-45, -55], [-100, -45], [-105, 12], [-55, 32], [0, 10], [55, 32], [105, 12], [100, -45], [45, -55]].map(([a, b]) => [x + a * s, y + b * s]));
  const cross = (cx, cy, w, h, t) => poly([[cx - t, cy - h], [cx + t, cy - h], [cx + t, cy - t], [cx + w, cy - t], [cx + w, cy + t], [cx + t, cy + t], [cx + t, cy + h], [cx - t, cy + h], [cx - t, cy + t], [cx - w, cy + t], [cx - w, cy - t], [cx - t, cy - t]]);
  const eyeWhite = (x, y, r, look = 0) => [{ d: circ(x, y, r), f: '#fff' }, { d: circ(x + look, y + r * .1, r * .5), f: INK }, { d: circ(x + look - r * .18, y - r * .15, r * .18), f: '#fff' }];

  const P1 = [
    {
      id: 'jack', name: 'Jack-o-lantern', group: 'halloween', sections: [
        sky(), stars([[120, 110, 44], [300, 70, 40], [470, 130, 42], [650, 60, 38], [180, 260, 38]]), ...moonFull(840, 150, 92), hill(640),
        { id: 'stem', d: rect(468, 285, 64, 120, 16) },
        ...pumpkin(500, 545, 1.05),
        { id: 'vine', d: leaf(545, 335, 730, 250, 60) }
      ].map(sec => sec.id === 'seg-m' ? { ...sec, det: carved(500, 545, 1.05) } : sec)
    },
    {
      id: 'ghost', name: 'Friendly ghost', group: 'halloween', sections: [
        sky(), stars([[110, 100, 44], [330, 60, 38], [640, 90, 42], [900, 300, 40]]), moonCres(790, 170, 105), hill(640),
        { id: 'stones', d: compound(`M150 640V520A55 55 0 0 1 260 520V640Z`, `M740 660V560A50 50 0 0 1 840 560V660Z`), det: [{ d: line(205, 540, 205, 590), w: 8 }, { d: line(180, 565, 230, 565), w: 8 }] },
        { id: 'mini', d: ell(150, 720, 80, 62), det: [{ d: ell(125, 705, 8, 12), f: INK }, { d: ell(175, 705, 8, 12), f: INK }] },
        {
          id: 'ghost', d: `M320 660V380A180 180 0 0 1 680 380V660Q650 610 610 660Q570 710 530 660Q500 620 470 660Q430 710 390 660Q355 620 320 660Z`,
          det: [...eye(430, 390, 26), ...eye(570, 390, 26), { d: ell(500, 470, 34, 44), f: INK }, { d: ell(500, 480, 20, 22), f: '#ff8aa3' }]
        },
        { id: 'bowtie', d: compound(rpoly([[500, 590], [410, 545], [410, 635]], 16), rpoly([[500, 590], [590, 545], [590, 635]], 16)) },
        ...bat(300, 200, .6, 'bat-')
      ]
    },
    {
      id: 'blackcat', name: 'Black cat', group: 'halloween', sections: [
        sky(), stars([[110, 90, 44], [300, 160, 38], [660, 70, 42], [520, 230, 36]]), ...moonFull(810, 160, 96), hill(600),
        { id: 'rails', d: compound(rect(0, 556, 1000, 54, 14), rect(0, 656, 1000, 54, 14)) },
        { id: 'pickets', d: compound(...[60, 250, 640, 830].map(x => `M${x} 760V520Q${x + 45} 460 ${x + 90} 520V760Z`)) },
        { id: 'tail', d: spline([[600, 540], [690, 500], [760, 420], [740, 330], [790, 310], [820, 400], [780, 510], [690, 580]]) },
        { id: 'body', d: ell(500, 500, 130, 145) },
        { id: 'ears', d: compound(rpoly([[385, 290], [380, 150], [480, 230]], 20), rpoly([[615, 290], [620, 150], [520, 230]], 20)) },
        { id: 'head', d: ell(500, 330, 130, 118), det: [...eyeWhite(455, 320, 27), ...eyeWhite(545, 320, 27), nose(500, 360, 14), { d: `M${P(475, 385)}Q${P(500, 402)} ${P(500, 378)}Q${P(500, 402)} ${P(525, 385)}`, w: 7 }, { d: line(390, 350, 335, 340), w: 6 }, { d: line(390, 372, 338, 385), w: 6 }, { d: line(610, 350, 665, 340), w: 6 }, { d: line(610, 372, 662, 385), w: 6 }] },
        { id: 'mini', d: ell(180, 720, 82, 66) },
        ...bat(880, 250, .5, 'bat-')
      ]
    },
    {
      id: 'bat', name: 'Little bat', group: 'halloween', sections: [
        sky(), stars([[110, 100, 44], [340, 190, 40], [700, 90, 44], [900, 290, 40], [90, 420, 40]]), moonCres(820, 140, 100),
        { id: 'cloud-l', d: cloud(180, 560, 1.4).d }, { id: 'cloud-r', d: cloud(830, 600, 1.3).d },
        hill(690),
        { id: 'wings', d: compound(rpoly([[440, 420], [330, 320], [140, 320], [80, 420], [170, 430], [150, 520], [260, 490], [330, 570], [410, 490]], 28), rpoly([[560, 420], [670, 320], [860, 320], [920, 420], [830, 430], [850, 520], [740, 490], [670, 570], [590, 490]], 28)) },
        { id: 'ears', d: compound(rpoly([[440, 330], [430, 220], [500, 290]], 14), rpoly([[560, 330], [570, 220], [500, 290]], 14)) },
        { id: 'body', d: ell(500, 450, 100, 130), det: [{ d: ell(500, 520, 52, 60), f: null, w: 7 }] },
        { id: 'face', d: ell(500, 350, 96, 82), det: [...eyeWhite(465, 345, 24), ...eyeWhite(535, 345, 24), { d: `M${P(480, 385)}L${P(485, 405)}L${P(497, 388)}`, w: 6 }, { d: `M${P(520, 385)}L${P(515, 405)}L${P(503, 388)}`, w: 6 }, { d: `M${P(478, 384)}Q${P(500, 396)} ${P(522, 384)}`, w: 7 }] },
        ...bat(200, 170, .5, 'small-')
      ]
    },
    {
      id: 'cauldron', name: 'Cauldron', group: 'halloween', sections: [
        sky(), stars([[110, 100, 44], [330, 70, 40], [650, 110, 42], [880, 250, 38]]), ...moonFull(150, 260, 86), hill(650),
        { id: 'logs', d: compound(ell(365, 730, 105, 28, 12), ell(635, 730, 105, 28, -12)) },
        { id: 'flames', d: compound(rpoly([[330, 730], [370, 600], [420, 730]], 22), rpoly([[450, 730], [500, 570], [550, 730]], 22), rpoly([[580, 730], [630, 610], [670, 730]], 22)) },
        { id: 'legs', d: compound(rect(310, 660, 60, 60, 14), rect(630, 660, 60, 60, 14), rect(470, 675, 60, 50, 14)) },
        { id: 'cauldron', d: `M270 470Q250 700 500 700Q750 700 730 470Z`, det: [{ d: `M${P(350, 600)}Q${P(360, 650)} ${P(420, 665)}`, w: 8 }] },
        { id: 'rim', d: ell(500, 470, 246, 56) },
        { id: 'potion', d: ell(500, 470, 214, 38) },
        { id: 'bubbles', d: compound(circ(420, 340, 46), circ(560, 290, 58), circ(650, 400, 40)) },
        { id: 'star', d: star(830, 480, 60, 28) }
      ]
    },
    {
      id: 'hauntedhouse', name: 'Haunted house', group: 'halloween', sections: [
        sky(), stars([[110, 100, 44], [320, 70, 40], [540, 120, 38], [930, 470, 36]]), ...moonFull(800, 150, 90), hill(650),
        { id: 'tree', d: `M60 700L80 480L40 380L90 400L100 330L140 360L160 300L190 380L170 470L190 700Z` },
        { id: 'tower', d: rect(560, 290, 120, 410) },
        { id: 'tower-roof', d: rpoly([[545, 300], [620, 160], [695, 300]], 10) },
        { id: 'tower-win', d: `M595 420V375A25 25 0 0 1 645 375V420Z`, det: [{ d: line(620, 352, 620, 420), w: 6 }] },
        { id: 'house', d: rect(240, 430, 340, 270) },
        { id: 'roof', d: rpoly([[212, 440], [410, 270], [608, 440]], 10) },
        { id: 'door', d: `M360 700V610A50 50 0 0 1 460 610V700Z`, det: [{ d: circ(446, 655, 7), f: INK }] },
        { id: 'windows', d: rect(272, 480, 70, 80, 12), det: [{ d: line(307, 480, 307, 560), w: 6 }, { d: line(272, 520, 342, 520), w: 6 }] },
        { id: 'window-r', d: rect(478, 480, 70, 80, 12), det: [{ d: line(513, 480, 513, 560), w: 6 }, { d: line(478, 520, 548, 520), w: 6 }] },
        { id: 'path', d: `M360 700L460 700L620 800L220 800Z` },
        ...bat(810, 310, .55, 'bat-')
      ]
    },
    {
      id: 'owl', name: 'Night owl', group: 'halloween', sections: [
        sky(), stars([[400, 70, 44], [600, 150, 38], [560, 270, 36], [900, 90, 40]]), moonCres(190, 180, 110),
        { id: 'trunk', d: `M700 800Q740 500 720 250Q760 200 820 250Q850 500 880 800Z` },
        { id: 'branch', d: `M0 640Q300 610 760 650L770 720Q300 700 0 720Z` },
        { id: 'tail', d: rpoly([[440, 690], [500, 780], [560, 690]], 12) },
        { id: 'body', d: ell(500, 520, 165, 190) },
        { id: 'belly', d: ell(500, 570, 100, 130), det: [{ d: curve([[450, 520], [500, 545], [550, 520]]), w: 7 }, { d: curve([[440, 580], [500, 605], [560, 580]]), w: 7 }, { d: curve([[450, 640], [500, 660], [550, 640]]), w: 7 }] },
        { id: 'wings', d: compound(ell(345, 540, 55, 130, 10), ell(655, 540, 55, 130, -10)) },
        { id: 'head', d: ell(500, 360, 150, 118) },
        { id: 'tufts', d: compound(rpoly([[365, 300], [345, 200], [440, 260]], 14), rpoly([[635, 300], [655, 200], [560, 260]], 14)) },
        { id: 'eyes', d: compound(circ(440, 360, 60), circ(560, 360, 60)), det: [...eyeWhite(440, 360, 34, 4), ...eyeWhite(560, 360, 34, -4)] },
        { id: 'beak', d: rpoly([[470, 405], [530, 405], [500, 470]], 14) }
      ]
    },
    {
      id: 'candy', name: 'Treats', group: 'halloween', sections: [
        sky(), stars([[110, 100, 44], [330, 70, 40], [560, 130, 40], [900, 90, 42]]), moonCres(760, 170, 100), hill(600),
        { id: 'candy-corn', d: compound(rpoly([[130, 730], [230, 730], [180, 600]], 20), rpoly([[290, 790], [400, 790], [345, 660]], 20)) },
        { id: 'lolly-stick', d: rect(870, 520, 46, 240, 16) },
        { id: 'lolly', d: circ(893, 440, 82), det: [{ d: curve([[893, 440], [922, 440], [922, 410], [882, 400], [848, 440], [882, 488], [950, 466]]), w: 9 }] },
        { id: 'bucket', d: `M330 400L730 400L690 720Q530 760 370 720Z`, det: [{ d: `M${P(350, 405)}Q${P(530, 130)} ${P(710, 405)}`, w: 10 }, { d: rpoly([[430, 520], [490, 520], [460, 470]], 6), f: INK }, { d: rpoly([[570, 520], [630, 520], [600, 470]], 6), f: INK }, { d: poly([[430, 580], [460, 570], [485, 595], [530, 570], [555, 595], [580, 570], [630, 580], [600, 640], [530, 650], [460, 640]]), f: INK }] },
        { id: 'wrap-a', d: wrapped(190, 480, 90, 36, -12) },
        { id: 'wrap-b', d: wrapped(700, 790, 92, 36, 8) },
        { id: 'wrap-c', d: wrapped(140, 340, 80, 32, 14) }
      ]
    },
    {
      id: 'monster', name: 'Friendly monster', group: 'halloween', sections: [
        sky(), stars([[110, 100, 44], [330, 60, 40], [640, 80, 42], [910, 200, 38]]), moonCres(150, 250, 90), hill(660),
        { id: 'horns', d: compound(rpoly([[380, 230], [340, 90], [450, 180]], 16), rpoly([[620, 230], [660, 90], [550, 180]], 16)) },
        { id: 'arms', d: compound(ell(275, 520, 60, 120, 25), ell(725, 520, 60, 120, -25)) },
        { id: 'body', d: spline([[500, 190], [640, 220], [720, 360], [730, 560], [660, 700], [500, 730], [340, 700], [270, 560], [280, 360], [360, 220]]) },
        { id: 'belly', d: ell(500, 610, 130, 100) },
        { id: 'eyes', d: compound(circ(430, 340, 70), circ(570, 340, 70)), det: [...eyeWhite(430, 340, 40, 5), ...eyeWhite(570, 340, 40, -5)] },
        { id: 'mouth', d: `M410 470Q500 570 590 470Q500 510 410 470Z`, det: [{ d: rpoly([[430, 480], [455, 480], [442, 505]], 3), f: '#fff' }, { d: rpoly([[545, 480], [570, 480], [557, 505]], 3), f: '#fff' }] },
        { id: 'feet', d: compound(ell(410, 735, 70, 34), ell(590, 735, 70, 34)) },
        { id: 'spots', d: compound(circ(330, 620, 42), circ(690, 420, 40)) }
      ]
    },
    {
      id: 'witchbunny', name: 'Bunny witch', group: 'halloween', sections: [
        sky(), stars([[110, 100, 44], [330, 70, 40], [640, 60, 38], [910, 210, 40]]), moonCres(820, 150, 96), hill(650),
        { id: 'cape', d: rpoly([[360, 470], [640, 470], [760, 740], [240, 740]], 30) },
        { id: 'ears', d: compound(ell(345, 250, 44, 110, -30), ell(655, 250, 44, 110, 30)) },
        { id: 'body', d: ell(500, 650, 140, 120) },
        { id: 'head', d: ell(500, 440, 168, 150), det: [...face(500, 450, 150), nose(500, 480, 18)] },
        { id: 'brim', d: ell(500, 340, 210, 42, -4) },
        { id: 'hat', d: rpoly([[385, 335], [455, 100], [520, 60], [600, 335]], 30) },
        { id: 'band', d: rect(392, 284, 202, 54, 10) },
        { id: 'bucket', d: `M690 640L810 640L790 770L710 770Z` },
        { id: 'star', d: star(150, 300, 50, 24) }
      ]
    }
  ];
  for (const p of P1) SPG.pictures.push(K.explode(p));

  const P2 = [
    {
      id: 'turkey', name: 'Turkey', group: 'thanksgiving', sections: [
        sky(), hill(670),
        ...[-72, 72, -38, 38, 0].map((ang, i) => ({ id: 'o' + (i + 1), d: ell(500 + Math.sin(ang * Math.PI / 180) * 225, 560 - Math.cos(ang * Math.PI / 180) * 225, 74, 215, ang), det: [{ d: line(500 + Math.sin(ang * Math.PI / 180) * 90, 560 - Math.cos(ang * Math.PI / 180) * 90, 500 + Math.sin(ang * Math.PI / 180) * 330, 560 - Math.cos(ang * Math.PI / 180) * 330), w: 6 }] })),
        ...[-36, 36, 0].map((ang, i) => ({ id: 'i' + (i + 1), d: ell(500 + Math.sin(ang * Math.PI / 180) * 140, 570 - Math.cos(ang * Math.PI / 180) * 140, 56, 135, ang) })),
        { id: 'feet', d: compound(ell(420, 760, 62, 28), ell(580, 760, 62, 28)) },
        { id: 'body', d: ell(500, 620, 165, 150) },
        { id: 'wing', d: ell(410, 630, 62, 95, -12) },
        { id: 'head', d: ell(500, 455, 72, 82), det: [...eye(472, 440, 10), ...eye(528, 440, 10)] },
        { id: 'beak', d: rpoly([[468, 464], [532, 464], [500, 522]], 10) },
        { id: 'wattle', d: drop(500, 545, 26) },
        { id: 'leaves', d: compound(maple(130, 150, 70, 10), maple(870, 210, 66, 30), maple(880, 110, 56, 0)) }
      ]
    },
    {
      id: 'pie', name: 'Pumpkin pie', group: 'thanksgiving', sections: [
        { id: 'wall', d: rect(0, 0, 1000, 540) },
        { id: 'frame', d: rect(600, 70, 320, 290, 18) },
        { id: 'panes', d: compound(rect(624, 96, 128, 238, 8), rect(768, 96, 128, 238, 8)), },
        { id: 'table', d: rect(0, 500, 1000, 300) },
        { id: 'mug-handle', d: ring(215, 470, 46, 26) },
        { id: 'mug', d: rect(90, 390, 128, 140, 24), det: [{ d: curve([[110, 350], [130, 320], [110, 290]]), w: 8 }, { d: curve([[160, 350], [180, 320], [160, 290]]), w: 8 }] },
        { id: 'plate', d: ell(400, 660, 300, 105) },
        { id: 'crust', d: ell(400, 640, 255, 88) },
        { id: 'filling', d: ell(400, 632, 205, 64) },
        { id: 'cream', d: compound(circ(322, 628, 32), circ(400, 610, 34), circ(478, 628, 32)) },
        { id: 'plate-2', d: ell(830, 690, 150, 56) },
        { id: 'slice', d: rpoly([[750, 690], [900, 650], [860, 720]], 12) },
        { id: 'mini', d: ell(830, 470, 60, 50) }
      ]
    },
    {
      id: 'cornucopia', name: 'Cornucopia', group: 'thanksgiving', sections: [
        sky(), hill(680),
        { id: 'horn', d: spline([[110, 650], [240, 560], [400, 470], [560, 390], [700, 320], [800, 380], [820, 500], [740, 600], [560, 690], [370, 730], [200, 710]]), det: [{ d: curve([[180, 640], [300, 560], [450, 500], [600, 430]]), w: 7 }, { d: curve([[230, 690], [380, 640], [520, 590], [650, 520]]), w: 7 }] },
        { id: 'mouth', d: ell(755, 420, 62, 118, 25) },
        { id: 'pumpkin', d: ell(880, 590, 86, 70) },
        { id: 'corn', d: ell(660, 250, 46, 110, 25) },
        { id: 'husk', d: compound(leaf(690, 320, 790, 400, 26), leaf(660, 330, 740, 440, 26)) },
        { id: 'apple', d: circ(820, 300, 66), det: [{ d: curve([[820, 236], [824, 210], [842, 196]]), w: 9 }] },
        { id: 'pear', d: spline([[520, 300], [562, 335], [600, 400], [570, 450], [500, 450], [465, 400], [490, 335]]) },
        { id: 'grapes', d: compound(circ(620, 500, 36), circ(700, 505, 36), circ(660, 568, 36), circ(580, 570, 36)) },
        { id: 'leaves', d: compound(maple(140, 250, 82, 5), maple(320, 150, 70, 25), maple(900, 150, 64, 0)) }
      ]
    },
    {
      id: 'falltree', name: 'Autumn tree', group: 'thanksgiving', sections: [
        sky(), { id: 'sun', d: circ(170, 540, 110) }, hill(560, 'hill-far'), hill(690, 'hill', true),
        { id: 'trunk', d: `M430 800Q455 600 440 470Q390 430 320 400L350 365Q415 405 465 440Q465 380 435 300L478 290Q510 365 520 430Q590 385 665 340L688 372Q605 425 545 470Q555 600 585 800Z` },
        { id: 'crown-back', d: ell(505, 300, 330, 190) },
        { id: 'crown-l', d: ell(330, 310, 170, 140) },
        { id: 'crown-r', d: ell(690, 310, 170, 140) },
        { id: 'crown-top', d: ell(505, 190, 200, 130) },
        { id: 'falling', d: compound(maple(200, 500, 56, 5), maple(760, 520, 52, 20), maple(880, 400, 50, 0), maple(150, 400, 46, 30)) },
        { id: 'pile', d: ell(820, 745, 170, 58) }
      ]
    },
    {
      id: 'squirrel', name: 'Squirrel', group: 'thanksgiving', sections: [
        sky(), { id: 'trunk', d: rect(30, 0, 200, 800, 24), det: [{ d: curve([[90, 100], [110, 200], [90, 300]]), w: 8 }, { d: curve([[160, 380], [140, 480], [170, 580]]), w: 8 }] },
        hill(650),
        { id: 'pile', d: ell(820, 745, 190, 62) },
        { id: 'mushroom-stem', d: rect(150, 670, 60, 80, 16) },
        { id: 'mushroom-cap', d: `M95 685A85 75 0 0 1 265 685Z`, det: [{ d: circ(150, 655, 10), f: '#fff' }, { d: circ(215, 645, 8), f: '#fff' }] },
        { id: 'tail', d: spline([[600, 690], [720, 660], [800, 560], [790, 430], [720, 350], [650, 380], [690, 450], [680, 540], [590, 600]]) },
        { id: 'body', d: ell(500, 610, 125, 150) },
        { id: 'belly', d: ell(500, 640, 74, 112) },
        { id: 'ears', d: compound(rpoly([[420, 340], [410, 240], [480, 300]], 10), rpoly([[590, 340], [600, 240], [530, 300]], 10)) },
        { id: 'head', d: ell(505, 415, 108, 96), det: [...eye(465, 400, 13), ...eye(545, 400, 13), nose(505, 430, 16), { d: `M${P(482, 455)}Q${P(505, 472)} ${P(528, 455)}`, w: 8 }] },
        { id: 'acorn', d: ell(505, 560, 58, 70) },
        { id: 'acorn-cap', d: `M440 545A65 55 0 0 1 570 545Z` },
        { id: 'leaves', d: compound(maple(360, 150, 62, 5), maple(760, 130, 60, 25), maple(620, 240, 52, 0)) }
      ]
    },
    {
      id: 'scarecrow', name: 'Scarecrow', group: 'thanksgiving', sections: [
        sky(), { id: 'sun', d: circ(850, 130, 80) }, hill(540, 'field'),
        { id: 'corn', d: compound(leaf(90, 780, 60, 330, 46), leaf(190, 780, 240, 380, 46), leaf(820, 780, 780, 350, 46), leaf(915, 780, 950, 420, 46)) },
        { id: 'post', d: rect(468, 350, 64, 450, 10) },
        { id: 'arms', d: rect(200, 430, 600, 64, 30) },
        { id: 'shirt', d: rpoly([[380, 420], [620, 420], [655, 660], [345, 660]], 34), det: [{ d: rect(520, 520, 80, 80, 6), w: 7 }, { d: line(536, 560, 584, 560), w: 5 }] },
        { id: 'straw', d: compound(rpoly([[130, 400], [210, 440], [130, 480], [80, 440]], 12), rpoly([[870, 400], [790, 440], [870, 480], [920, 440]], 12), rpoly([[380, 700], [460, 740], [400, 800], [340, 760]], 12), rpoly([[620, 700], [540, 740], [600, 800], [660, 760]], 12)) },
        { id: 'head', d: circ(500, 320, 100), det: [{ d: circ(465, 305, 10), f: INK }, { d: circ(535, 305, 10), f: INK }, { d: `M${P(450, 360)}Q${P(500, 395)} ${P(550, 360)}`, w: 8 }, { d: line(470, 366, 470, 382), w: 6 }, { d: line(500, 372, 500, 390), w: 6 }, { d: line(530, 366, 530, 382), w: 6 }] },
        { id: 'brim', d: ell(500, 248, 160, 32) },
        { id: 'hat', d: rpoly([[418, 242], [438, 100], [562, 100], [582, 242]], 20) },
        { id: 'band', d: rect(422, 194, 156, 50, 8) },
        { id: 'pumpkins', d: compound(ell(300, 750, 90, 66), ell(720, 755, 100, 70)) },
        { id: 'crow', d: spline([[700, 200], [760, 170], [830, 190], [890, 220], [830, 240], [770, 270], [720, 250]]), det: [...eye(815, 205, 8)] }
      ]
    },
    {
      id: 'bearfall', name: 'Bear and apples', group: 'thanksgiving', sections: [
        sky(), { id: 'sun', d: circ(850, 120, 74) }, hill(650),
        { id: 'trunk', d: rect(60, 300, 100, 500, 16) },
        { id: 'crown', d: ell(110, 250, 150, 130) },
        { id: 'ears', d: compound(circ(345, 235, 58), circ(655, 235, 58)) },
        { id: 'body', d: ell(500, 640, 170, 150) },
        { id: 'belly', d: ell(500, 660, 105, 100) },
        { id: 'head', d: ell(500, 400, 185, 165), det: face(500, 385, 168) },
        { id: 'muzzle', d: ell(500, 468, 80, 60), det: [nose(500, 446, 25), { d: `M${P(474, 490)}Q${P(500, 510)} ${P(526, 490)}`, w: 8 }] },
        { id: 'scarf', d: spline([[350, 545], [500, 590], [650, 545], [680, 600], [500, 640], [320, 600]]) },
        { id: 'basket', d: rpoly([[300, 640], [700, 640], [660, 780], [340, 780]], 24), det: [{ d: `M${P(330, 640)}Q${P(500, 470)} ${P(670, 640)}`, w: 10 }, { d: line(330, 690, 670, 690), w: 6 }, { d: line(340, 735, 660, 735), w: 6 }] },
        { id: 'apples', d: compound(circ(400, 640, 48), circ(500, 625, 50), circ(600, 640, 48)) },
        { id: 'leaves', d: compound(maple(300, 120, 60, 5), maple(650, 90, 56, 25)) }
      ]
    },
    {
      id: 'leafpile', name: 'Leaf pile', group: 'thanksgiving', sections: [
        sky(), { id: 'trees', d: compound(rect(90, 150, 90, 500, 14), rect(820, 100, 100, 550, 14)) },
        hill(600),
        { id: 'pile', d: ell(500, 700, 440, 130) },
        { id: 'spikes', d: poly([[290, 700], ...Array.from({ length: 21 }, (_, i) => { const a = Math.PI + i * Math.PI / 20 * 1.02, r = i % 2 ? 190 : 250; return [490 + Math.cos(a) * r * 1.1, 640 + Math.sin(a) * r * .95]; }), [720, 700]]) },
        { id: 'face', d: ell(500, 640, 125, 105), det: [...eye(465, 620, 14), ...eye(535, 620, 14), nose(500, 660, 20), { d: `M${P(476, 695)}Q${P(500, 712)} ${P(524, 695)}`, w: 8 }] },
        { id: 'leaf-a', d: maple(250, 640, 90, 10) }, { id: 'leaf-b', d: maple(760, 630, 92, 25) }, { id: 'leaf-c', d: maple(500, 520, 70, 0) },
        { id: 'acorns', d: compound(ell(150, 760, 50, 34), ell(880, 760, 50, 34)) },
        { id: 'falling', d: compound(maple(330, 200, 60, 5), maple(660, 260, 56, 20), maple(520, 100, 50, 0)) }
      ]
    },
    {
      id: 'wagon', name: 'Harvest wagon', group: 'thanksgiving', sections: [
        sky(), { id: 'sun', d: circ(160, 130, 78) }, hill(560),
        { id: 'road', d: `M0 690Q300 640 500 690T1000 670V800H0Z` },
        { id: 'hay', d: rect(770, 470, 190, 150, 14), det: [{ d: line(800, 490, 800, 600), w: 6 }, { d: line(865, 480, 865, 610), w: 6 }, { d: line(925, 490, 925, 600), w: 6 }] },
        { id: 'corn', d: compound(ell(330, 400, 36, 90, 20), ell(430, 380, 36, 90, -15), ell(570, 385, 36, 90, 10)) },
        { id: 'pump-a', d: ell(330, 470, 82, 66) }, { id: 'pump-b', d: ell(500, 450, 96, 78) }, { id: 'pump-c', d: ell(675, 470, 82, 66) },
        { id: 'bed', d: rect(230, 500, 540, 130, 20), det: [{ d: line(230, 565, 770, 565), w: 7 }, { d: line(370, 500, 370, 630), w: 7 }, { d: line(500, 500, 500, 630), w: 7 }, { d: line(630, 500, 630, 630), w: 7 }] },
        { id: 'tongue', d: rect(760, 634, 200, 50, 18) },
        { id: 'wheels', d: compound(circ(340, 680, 98), circ(680, 680, 98)), det: [] },
        { id: 'hubs', d: compound(circ(340, 680, 30), circ(680, 680, 30)) },
        { id: 'leaves', d: compound(maple(240, 250, 58, 5), maple(560, 210, 54, 25), maple(860, 300, 50, 0)) }
      ]
    },
    {
      id: 'deer', name: 'Little deer', group: 'thanksgiving', sections: [
        sky(), { id: 'sun', d: circ(860, 130, 76) }, hill(640),
        { id: 'trunks', d: compound(rect(90, 250, 90, 450, 14), rect(840, 220, 100, 480, 14)) },
        { id: 'crowns', d: compound(ell(135, 200, 150, 120), ell(890, 170, 140, 110)) },
        { id: 'tail', d: rpoly([[300, 540], [250, 470], [340, 490]], 12) },
        { id: 'legs', d: compound(rect(330, 640, 56, 150, 22), rect(410, 650, 56, 140, 22), rect(560, 650, 56, 140, 22), rect(640, 640, 56, 150, 22)) },
        { id: 'body', d: ell(500, 570, 200, 120) },
        { id: 'spots', d: compound(circ(430, 540, 28), circ(520, 520, 28), circ(590, 560, 28), circ(470, 600, 26), circ(390, 590, 26)) },
        { id: 'neck', d: spline([[600, 520], [690, 470], [720, 350], [800, 360], [770, 500], [690, 610]]) },
        { id: 'ears', d: compound(leaf(700, 330, 640, 250, 34), leaf(790, 320, 850, 250, 34)) },
        { id: 'head', d: ell(770, 370, 100, 78), det: [...eye(800, 350, 12), nose(850, 385, 16)] },
        { id: 'leaves', d: compound(maple(300, 150, 60, 5), maple(620, 110, 56, 25), maple(500, 300, 50, 0)) }
      ]
    }
  ];
  for (const p of P2) SPG.pictures.push(K.explode(p));

  const plainCloud = (x, y, s, id) => ({ id, d: cloud(x, y, s).d });
  const gingerman = (cx, cy, s) => spline([[0, -150], [38, -140], [52, -105], [40, -70], [95, -75], [130, -60], [128, -25], [85, -10], [60, -5], [70, 60], [100, 120], [80, 150], [35, 140], [0, 95], [-35, 140], [-80, 150], [-100, 120], [-70, 60], [-60, -5], [-85, -10], [-128, -25], [-130, -60], [-95, -75], [-40, -70], [-52, -105], [-38, -140]].map(([a, b]) => [cx + a * s, cy + b * s]));
  const cane = (x, y, h, r = 48) => thick([[x, y + h], [x, y + r], ...arcPts(x + r, y + r, r, 180, 360, 12), [x + 2 * r, y + r + 46]], 24);

  const P3 = [
    {
      id: 'tree', name: 'Christmas tree', group: 'christmas', sections: [
        sky(), stars([[110, 90, 44], [330, 60, 40], [690, 80, 42], [900, 210, 40], [130, 300, 38]]), hill(660),
        { id: 'trunk', d: rect(455, 640, 90, 130, 10) },
        { id: 'tier-3', d: rpoly([[170, 700], [500, 340], [830, 700]], 36) },
        { id: 'tier-2', d: rpoly([[240, 540], [500, 220], [760, 540]], 36) },
        { id: 'tier-1', d: rpoly([[320, 400], [500, 110], [680, 400]], 32) },
        { id: 'star', d: star(500, 90, 70, 31) },
        { id: 'orn-a', d: compound(circ(430, 320, 36), circ(565, 450, 38), circ(370, 610, 38)) },
        { id: 'orn-b', d: compound(circ(585, 300, 34), circ(440, 480, 36), circ(650, 620, 38)) },
        { id: 'gift-a', d: rect(70, 690, 170, 110, 10), det: [{ d: line(155, 690, 155, 800), w: 14 }, { d: line(70, 745, 240, 745), w: 14 }] },
        { id: 'gift-b', d: rect(760, 700, 180, 100, 10), det: [{ d: line(850, 700, 850, 800), w: 14 }, { d: line(760, 750, 940, 750), w: 14 }] }
      ]
    },
    {
      id: 'snowman', name: 'Snowman', group: 'christmas', sections: [
        sky(), stars([[110, 90, 44], [360, 60, 40], [650, 110, 42], [900, 90, 40], [880, 270, 38]]), hill(660),
        fir(140, 220, 660, 125, 'tree'),
        { id: 'ball-l', d: ell(520, 665, 175, 150) },
        { id: 'ball-m', d: ell(520, 480, 132, 118), det: [{ d: circ(520, 440, 12), f: INK }, { d: circ(520, 485, 12), f: INK }, { d: circ(520, 530, 12), f: INK }] },
        { id: 'arms', d: compound(thick([[400, 470], [310, 420], [235, 345]], 26), thick([[640, 470], [730, 420], [805, 335]], 26)) },
        { id: 'ball-h', d: circ(520, 335, 95), det: [{ d: circ(488, 310, 11), f: INK }, { d: circ(552, 310, 11), f: INK }, ...[[478, 372], [498, 385], [520, 390], [542, 385], [562, 372]].map(([x, y]) => ({ d: circ(x, y, 6), f: INK }))] },
        { id: 'brim', d: ell(520, 250, 128, 28) },
        { id: 'hat', d: rpoly([[440, 250], [452, 110], [588, 110], [600, 250]], 14) },
        { id: 'band', d: rect(447, 196, 146, 50, 6) },
        { id: 'scarf', d: spline([[420, 405], [520, 435], [620, 405], [640, 450], [585, 480], [610, 575], [545, 575], [520, 490], [400, 450]]) },
        { id: 'nose', d: rpoly([[525, 322], [668, 350], [525, 384]], 10) }
      ]
    },
    {
      id: 'santa', name: 'Santa', group: 'christmas', sections: [
        sky(), stars([[100, 90, 44], [330, 60, 40], [690, 70, 42], [910, 200, 40]]), { id: 'roof', d: `M0 660L1000 580V800H0Z` },
        { id: 'sack', d: spline([[90, 590], [170, 520], [260, 560], [270, 680], [200, 760], [100, 730]]), det: [{ d: curve([[150, 545], [190, 575], [230, 545]]), w: 8 }] },
        { id: 'coat', d: ell(500, 660, 235, 210) },
        { id: 'face', d: circ(500, 400, 130), det: [...eye(455, 385, 15), ...eye(545, 385, 15), { d: curve([[420, 350], [455, 335], [485, 348]]), w: 8 }, { d: curve([[515, 348], [545, 335], [580, 350]]), w: 8 }] },
        { id: 'beard', d: spline([[375, 440], [500, 520], [625, 440], [670, 540], [590, 660], [500, 700], [410, 660], [330, 540]]) },
        { id: 'mustache', d: compound(ell(442, 470, 58, 34, -14), ell(558, 470, 58, 34, 14)) },
        { id: 'nose', d: circ(500, 425, 33) },
        { id: 'hat', d: rpoly([[365, 330], [355, 160], [520, 60], [700, 250], [640, 330]], 34) },
        { id: 'trim', d: ell(500, 318, 178, 40) },
        { id: 'pom', d: circ(705, 245, 52) },
        { id: 'chimney', d: rect(300, 640, 400, 160, 8), det: [{ d: line(300, 700, 700, 700), w: 6 }, { d: line(400, 640, 400, 700), w: 6 }, { d: line(500, 700, 500, 800), w: 6 }, { d: line(600, 640, 600, 700), w: 6 }] }
      ]
    },
    {
      id: 'reindeer', name: 'Reindeer', group: 'christmas', sections: [
        sky(), stars([[110, 100, 44], [350, 60, 40], [650, 70, 42], [900, 130, 40]]), { id: 'trees', d: compound(rpoly([[40, 700], [110, 240], [180, 700]], 30), rpoly([[820, 700], [890, 220], [960, 700]], 30)) }, hill(680),
        { id: 'body', d: ell(500, 720, 210, 120) },
        { id: 'scarf', d: spline([[350, 570], [500, 610], [650, 570], [690, 630], [500, 675], [310, 630]]) },
        { id: 'antlers', d: compound(spline([[440, 260], [395, 215], [330, 195], [305, 120], [345, 108], [360, 160], [405, 140], [395, 75], [440, 68], [452, 150], [485, 235]]), spline([[560, 260], [605, 215], [670, 195], [695, 120], [655, 108], [640, 160], [595, 140], [605, 75], [560, 68], [548, 150], [515, 235]])) },
        { id: 'ears', d: compound(leaf(385, 330, 290, 285, 46), leaf(615, 330, 710, 285, 46)) },
        { id: 'head', d: ell(500, 410, 152, 142), det: [...eye(445, 385, 14), ...eye(555, 385, 14)] },
        { id: 'muzzle', d: ell(500, 480, 92, 68) },
        { id: 'nose', d: circ(500, 462, 42), det: [{ d: `M${P(478, 515)}Q${P(500, 535)} ${P(522, 515)}`, w: 8 }] }
      ]
    },
    {
      id: 'gingerhouse', name: 'Gingerbread house', group: 'christmas', sections: [
        sky(), stars([[110, 90, 44], [340, 60, 40], [640, 90, 42], [880, 210, 40]]), hill(650),
        { id: 'cane', d: compound(cane(90, 430, 300), cane(880, 430, 300)) },
        { id: 'house', d: rect(270, 430, 400, 300, 8) },
        { id: 'roof', d: rpoly([[220, 440], [470, 230], [720, 440]], 20), det: [{ d: curve([[290, 405], [340, 385], [390, 405], [440, 385], [490, 405], [540, 385], [590, 405], [640, 385]]), w: 8 }] },
        { id: 'door', d: `M400 730V600A70 70 0 0 1 540 600V730Z` },
        { id: 'windows', d: compound(rect(300, 490, 70, 80, 8), rect(570, 490, 70, 80, 8)), det: [{ d: line(335, 490, 335, 570), w: 6 }, { d: line(300, 530, 370, 530), w: 6 }, { d: line(605, 490, 605, 570), w: 6 }, { d: line(570, 530, 640, 530), w: 6 }] },
        { id: 'gumdrops', d: compound(circ(400, 340, 30), circ(470, 300, 30), circ(540, 340, 30), circ(470, 375, 26)) },
        { id: 'ginger', d: gingerman(800, 640, .75), det: [{ d: circ(800, 545, 5), f: INK }, ...eye(775, 548, 6), ...eye(825, 548, 6), { d: curve([[780, 575], [800, 590], [820, 575]]), w: 6 }, { d: circ(800, 620, 9), f: INK }, { d: circ(800, 655, 9), f: INK }] },
        { id: 'lolly-stick', d: rect(169, 640, 46, 160, 16) },
        { id: 'lolly', d: circ(192, 590, 62), det: [{ d: curve([[192, 590], [215, 590], [215, 568], [185, 560], [160, 592], [186, 622], [236, 606]]), w: 8 }] }
      ]
    },
    {
      id: 'gifts', name: 'Presents', group: 'christmas', sections: [
        { id: 'wall', d: rect(0, 0, 1000, 560) }, { id: 'floor', d: rect(0, 540, 1000, 260) }, { id: 'rug', d: ell(500, 650, 470, 130) },
        { id: 'window', d: rect(700, 60, 240, 260, 16), det: [{ d: line(820, 60, 820, 320), w: 8 }, { d: line(700, 190, 940, 190), w: 8 }] },
        { id: 'box-a', d: rect(120, 430, 260, 240, 12) }, { id: 'ribbon-a', d: cross(250, 550, 130, 120, 22) }, { id: 'bow-a', d: bowPath(250, 425, .64) },
        { id: 'box-b', d: rect(420, 500, 220, 190, 12) }, { id: 'ribbon-b', d: cross(530, 595, 110, 95, 20) }, { id: 'bow-b', d: bowPath(530, 500, .62) },
        { id: 'box-c', d: rect(690, 400, 200, 290, 12) }, { id: 'ribbon-c', d: cross(790, 545, 100, 145, 20) }, { id: 'bow-c', d: bowPath(790, 398, .62) },
        { id: 'baubles', d: compound(circ(80, 740, 42), circ(930, 730, 44)) }
      ]
    },
    {
      id: 'fireplace', name: 'Fireplace', group: 'christmas', sections: [
        { id: 'wall', d: rect(0, 0, 1000, 720) }, { id: 'floor', d: rect(0, 700, 1000, 100) },
        { id: 'surround', d: rect(210, 240, 580, 470) },
        { id: 'hearth', d: `M300 710V440Q300 385 355 385H645Q700 385 700 440V710Z` },
        { id: 'logs', d: compound(ell(380, 685, 104, 24, 8), ell(620, 685, 104, 24, -8)) },
        { id: 'flames', d: compound(rpoly([[335, 680], [390, 530], [445, 680]], 24), rpoly([[455, 680], [500, 490], [545, 680]], 24), rpoly([[555, 680], [610, 550], [665, 680]], 24)) },
        { id: 'candles', d: compound(rect(190, 90, 52, 80, 8), rect(758, 90, 52, 80, 8)), det: [{ d: drop(216, 66, 14), f: INK }, { d: drop(784, 66, 14), f: INK }] },
        { id: 'mantel', d: rect(150, 168, 700, 72, 14) },
        ...[[260, 'a'], [440, 'b'], [620, 'c']].map(([x, k]) => ({ id: 'stock-' + k, d: spline([[x, 262], [x + 96, 262], [x + 96, 400], [x + 150, 440], [x + 135, 490], [x + 30, 490], [x - 5, 420], [x, 300]]) })),
        { id: 'cuffs', d: compound(rect(254, 240, 108, 50, 12), rect(434, 240, 108, 50, 12), rect(614, 240, 108, 50, 12)) }
      ]
    },
    {
      id: 'penguin', name: 'Penguin', group: 'christmas', sections: [
        sky(), stars([[110, 90, 44], [330, 60, 40], [690, 70, 42], [900, 300, 40], [110, 330, 38]]),
        { id: 'aurora', d: spline([[0, 200], [200, 130], [420, 180], [640, 100], [1000, 190], [1000, 320], [640, 240], [420, 310], [200, 250], [0, 330]]) },
        hill(590, 'ice'), hill(670),
        { id: 'feet', d: compound(ell(410, 765, 72, 30), ell(590, 765, 72, 30)) },
        { id: 'flippers', d: compound(ell(320, 540, 52, 130, 15), ell(680, 540, 52, 130, -15)) },
        { id: 'body', d: ell(500, 500, 175, 250) },
        { id: 'belly', d: ell(500, 560, 112, 180) },
        { id: 'face', d: ell(500, 350, 105, 90), det: [...eye(465, 335, 13), ...eye(535, 335, 13)] },
        { id: 'beak', d: rpoly([[460, 372], [540, 372], [500, 440]], 14) },
        { id: 'scarf', d: spline([[350, 440], [500, 480], [650, 440], [665, 500], [590, 520], [610, 620], [545, 620], [525, 530], [340, 500]]) },
        { id: 'beanie', d: `M395 275A105 90 0 0 1 605 275Z` },
        { id: 'pom', d: circ(500, 160, 36) }
      ]
    },
    {
      id: 'wreath', name: 'Wreath', group: 'christmas', sections: [
        { id: 'door', d: rect(120, 0, 760, 800) },
        { id: 'panels', d: compound(rect(180, 50, 300, 300, 16), rect(520, 50, 300, 300, 16), rect(180, 420, 300, 340, 16), rect(520, 420, 300, 340, 16)) },
        { id: 'ring', d: ring(500, 380, 240, 118) },
        { id: 'holly', d: compound(leaf(300, 240, 380, 175, 40), leaf(620, 175, 700, 240, 40), leaf(690, 500, 760, 570, 40), leaf(310, 520, 240, 460, 40)) },
        { id: 'berries', d: compound(circ(345, 300, 30), circ(410, 250, 30), circ(655, 300, 30), circ(600, 520, 30), circ(350, 470, 30)) },
        { id: 'tails', d: rpoly([[490, 640], [420, 790], [475, 765], [500, 800], [525, 765], [580, 790], [510, 640]], 10) },
        { id: 'loops', d: compound(spline([[485, 645], [420, 590], [345, 605], [350, 690], [430, 705]]), spline([[515, 645], [580, 590], [655, 605], [650, 690], [570, 705]])) },
        { id: 'knot', d: circ(500, 650, 44) },
        { id: 'bells', d: compound(`M255 740Q255 665 310 650Q365 665 365 740Z`, `M635 740Q635 665 690 650Q745 665 745 740Z`) }
      ]
    },
    {
      id: 'sleigh', name: 'Sleigh ride', group: 'christmas', sections: [
        sky(), stars([[110, 90, 44], [340, 60, 40], [620, 130, 40], [900, 260, 40], [130, 300, 38]]), ...moonFull(820, 130, 88),
        plainCloud(250, 200, 1.3, 'cloud-a'), plainCloud(760, 330, 1.1, 'cloud-b'),
        hill(700),
        { id: 'houses', d: compound(rect(60, 620, 140, 100, 8), rect(800, 640, 150, 90, 8)) },
        { id: 'roofs', d: compound(rpoly([[45, 630], [130, 550], [215, 630]], 12), rpoly([[785, 650], [875, 570], [965, 650]], 12)) },
        { id: 'runner', d: thick([[270, 700], [430, 712], [640, 704], [760, 680], [800, 630], [780, 585]], 24) },
        { id: 'sleigh', d: spline([[300, 520], [470, 500], [730, 490], [785, 410], [835, 400], [825, 475], [765, 610], [680, 665], [340, 665], [290, 610]]) },
        { id: 'sack', d: spline([[330, 480], [400, 400], [490, 420], [525, 500], [445, 545], [350, 545]]) },
        { id: 'gifts', d: compound(rect(560, 425, 90, 82, 8), rect(660, 445, 70, 62, 8)) }
      ]
    }
  ];
  for (const p of P3) SPG.pictures.push(K.explode(p));
})();
