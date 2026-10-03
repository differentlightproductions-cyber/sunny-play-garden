// Contact sheets of the Sprout Kitchen art (games/cook-art.js): every ingredient picture, the new sprinkles / candies / candles / fruit,
// measuring tools, counter piles, icing pens, paint bucket, and toppings on a cupcake and a cake.
//   PORT=8196 SHOTS=/tmp/x node tools/playtest/kitchen-art-sheet.mjs      (writes kitchen-art-*.png into $SHOTS)
import { start, stop, newPage, SP } from './lib.mjs';
const b = await start(); const page = await newPage(b, 1400, 900);
const out = await page.evaluate(() => {
  const A = SPG.cookArt, dpr = 1;
  const make = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.fillStyle = '#fff3e0'; c.fillRect(0, 0, w, h); return [cv, c]; };
  const cell = (c, x, y, w, h, label) => { c.fillStyle = '#fffaf2'; c.strokeStyle = '#e8d6b8'; c.lineWidth = 1; c.beginPath(); c.roundRect(x + 3, y + 3, w - 6, h - 6, 12); c.fill(); c.stroke(); c.fillStyle = '#6a4a3a'; c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText(label, x + w / 2, y + h - 8); };
  const grid = (items, cw, ch, cols, size, draw) => { const rows = Math.ceil(items.length / cols), [cv, c] = make(cols * cw, rows * ch); items.forEach((it, i) => { const x = (i % cols) * cw, y = Math.floor(i / cols) * ch; cell(c, x, y, cw, ch, String(it.label || it)); c.save(); c.translate(x + cw / 2, y + (ch - 14) / 2); draw(c, it, size); c.restore(); }); return cv; };
  const sheets = {};
  const nameOf = k => k;
  // 1: every ING id
  const all = Object.keys(A.ING);
  sheets.all = grid(all, 100, 112, 14, 78, (c, id, s) => A.ING[id](c, s)).toDataURL();
  // 2: the six pantry pictures big and small, then sprinkles, candies, candles, fruit
  const pantry = ['flour', 'sugar', 'egg', 'butter', 'milk', 'chips', 'sprinkles', 'candy', 'candle', 'strawberry', 'blueberry', 'cherry'];
  sheets.pantry = grid(pantry.concat(pantry.map(p => ({ label: p + ' 64', id: p }))), 210, 220, 6, 170, (c, it, s) => { const id = it.id || it; A.ING[id](c, it.id ? 64 : s); }).toDataURL();
  const kinds = [...A.SPRINKLE_KINDS.map(k => 'spr-' + k), ...A.CANDY_KINDS.map(k => 'cdy-' + k), ...A.CANDLE_KINDS.map(k => 'cnd-' + k.id), 'raspberry', 'banana', 'kiwi', 'orange', 'grape', 'strawberry', 'blueberry', 'cherry'];
  sheets.kinds = grid(kinds.concat(kinds.map(k => ({ label: k + ' 60', id: k }))), 150, 160, 9, 120, (c, it, s) => A.ING[it.id || it](c, it.id ? 60 : s)).toDataURL();
  // single pieces
  const pieces = []; for (const k of A.SPRINKLE_KINDS) pieces.push({ label: 'sprinkle ' + k, f: (c, s) => { for (let i = 0; i < 3; i++) { c.save(); c.translate((i - 1) * s * .4, 0); A.drawSprinkle(c, k, s * .3, i === 1 ? undefined : undefined, i * .7); c.restore(); } } });
  for (const k of A.CANDY_KINDS) pieces.push({ label: 'candy ' + k, f: (c, s) => A.drawCandy(c, k, s * .38) });
  for (const k of A.CANDLE_KINDS) pieces.push({ label: 'candle ' + k.id, f: (c, s) => A.drawCandle(c, k.id, s * .9, true) }, { label: 'unlit ' + k.id, f: (c, s) => A.drawCandle(c, k.id, s * .9, false) });
  sheets.pieces = grid(pieces, 150, 160, 9, 130, (c, it, s) => it.f(c, s)).toDataURL();
  // measuring
  const ms = []; for (const kind of ['cup', 'half', 'tbsp']) for (const [f, t, col] of [[0, 0, '#fff'], [.5, 0, '#fffdf4'], [1, 0, '#fffdf4'], [.75, 0, '#fff0b8'], [.8, .45, '#fffdf4'], [.4, 1.0, '#ffd54a']]) ms.push({ label: `${kind} fill ${f} tilt ${t}`, kind, f, t, col });
  sheets.measure = grid(ms, 190, 190, 6, 150, (c, it, s) => A.drawMeasure(c, it.kind, s, it.f, it.col, it.t)).toDataURL();
  // piles
  const pl = []; for (let n = 0; n <= 3; n++) pl.push({ label: 'egg n=' + n, id: 'egg', n }); pl.push({ label: 'flour', id: 'flour', n: 1 }, { label: 'sugar', id: 'sugar', n: 1 }); for (let n = 0; n <= 4; n++) pl.push({ label: 'butter n=' + n, id: 'butter', n }); pl.push({ label: 'milk', id: 'milk', n: 1 }, { label: 'chips', id: 'chips', n: 1 });
  sheets.piles = grid(pl, 210, 210, 7, 170, (c, it, s) => A.drawPile(c, it.id, it.n, s)).toDataURL();
  // icing pens and bucket
  const ic = Object.entries(A.ICING12).map(([k, col]) => ({ label: k, col })); ic.push({ label: 'bucket', col: '#ff9ec8', bucket: true }, { label: 'bucket blue', col: '#7fd4f5', bucket: true }, { label: 'pen 56', col: '#ff9ec8', small: true }, { label: 'bucket 56', col: '#7fd4f5', bucket: true, small: true });
  sheets.icing = grid(ic, 150, 160, 8, 120, (c, it, s) => { if (it.small) s = 56; (it.bucket ? A.drawPaintBucket : A.drawIcingPen)(c, s, it.col); }).toDataURL();
  // toppings on foods (old tops without a kind, then new kinds)
  const [tv, tc] = make(1400, 700);
  const foods = [{ type: 'cupcake', frost: { col: '#ff9ec8' }, baked: 1 }, { type: 'cake', frost: { col: '#fff1c4' }, baked: 1 }, { type: 'cookie', shape: 'round', baked: 1 }];
  const tops = [
    [{ id: 'sprinkles', x: -.2, y: -.2, col: '#ff6b81', rot: .3 }, { id: 'sprinkles', x: 0, y: -.25, col: '#5cc8f2', rot: 1.2 }, { id: 'candy', x: .2, y: -.2, col: '#ffd54a' }, { id: 'candle', x: 0, y: -.45 }, { id: 'cherry', x: -.3, y: -.35 }, { id: 'strawberry', x: .3, y: -.35 }, { id: 'blueberry', x: .1, y: -.1 }],
    [{ id: 'sprinkles', kind: 'stars', x: -.2, y: -.2, rot: .3 }, { id: 'sprinkles', kind: 'hearts', x: 0, y: -.25 }, { id: 'candy', kind: 'gem', x: .2, y: -.2 }, { id: 'candle', kind: 'rainbow', x: 0, y: -.5 }, { id: 'raspberry', x: -.3, y: -.35 }, { id: 'kiwi', x: .3, y: -.35 }, { id: 'banana', x: .1, y: -.1 }, { id: 'candy', kind: 'flower', x: -.1, y: -.05 }, { id: 'candy', kind: 'moon', x: .35, y: -.1 }],
    [{ id: 'sprinkles', kind: 'choc', x: -.2, y: -.2, rot: .3 }, { id: 'sprinkles', kind: 'dots', x: 0, y: -.25 }, { id: 'sprinkles', kind: 'pastel', x: -.1, y: -.1, rot: .5 }, { id: 'candle', kind: 'one', x: 0, y: -.5 }, { id: 'orange', x: -.3, y: -.35 }, { id: 'grape', x: .3, y: -.35 }, { id: 'candle', kind: 'star', x: .25, y: -.5 }]
  ];
  tops.forEach((tp, r) => foods.forEach((f, i) => { tc.save(); tc.translate(230 + i * 470, 130 + r * 220); const p = { ...f, tops: tp }; A.drawPiece(tc, p, 100); tc.restore(); }));
  sheets.tops = tv.toDataURL();
  return sheets;
});
import { writeFileSync } from 'node:fs';
for (const [k, v] of Object.entries(out)) writeFileSync(`${SP}/kitchen-art-${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
console.log('sheets:', Object.keys(out).join(', '), 'in', SP, '|', page.errs.join('\n') || 'no page errors');
stop(b);
