// Sprout Kitchen: a step-by-step cooking game. Pick Sweets, Sandwiches or Burgers, pick one of six recipes, and cook it with big simple
// touches: drop in the ingredients, stir, roll the dough, press a character cookie cutter, bake, spread, stack, grill, add sauces and
// sprinkles, and then serve it and take bites. The screen moves on by itself when a step is finished, a little chef shows what to do
// next, and every instruction is spoken. Nothing can go wrong: a wrong ingredient just wiggles and the right one glows.
(() => {
  const SPG = window.SPG;
  const { art, sfx, voice, store } = SPG;
  const { clamp, lerp, ease, rr, rnd, shade, circ, ell, box, tri, shine, blob, FF, fancyText, fitLabel, gingham, ribbon, PIECES, SHAPES, starPath, heartPath, shapeFill, cookieShape, cutterArt, BUN, BREAD, CRUST, ING, TUBE, SCOOP, ICING, SCOOPS, NAME, LAYER, SAUCE, SEASON, drawTable, drawBoard, drawPlate, drawBowl, drawSpoon, drawPin, drawOven, drawGrill, drawToaster, LAYER_ICON, DOUGH, BAKED, CHOCDOUGH, CHOCBAKED, drawDeco, drawCookie, mixHex, drawCupcake, drawCake, drawFlatDots, drawStack, drawHotdog, drawSundae, drawPiece, drawCharSandwich, drawSliced, pieceHeight, sampleBox, drawSample, ICOL, BATTER, SPRINKLE, stepIcon, pan, drawSheet, drawCupcakeAt, drawTapHint, drawPieceC, drawUnit, lerpHex, saucePts, grainPts, drawPaintList, drawShadowDisc, drawPieceAt, pieceBase, drawKnife, drawBittenAt, TAU } = SPG.cookArt;

  /* ---------------------------------------------------------------- recipes (three kinds, six each) */
  // steps: add (drop ingredients in the bowl) stir roll cut (character cutters) fill (batter/dough onto a tray) bake grill (grill, pan or toaster)
  //        stack (guided layers) decorate (icing, sprinkles, sauces, seasoning) slice serve (and take bites)
  const CATS = [{ id: 'sweets', name: 'Sweets' }, { id: 'sandwiches', name: 'Sandwiches' }, { id: 'burgers', name: 'Burgers' }];
  // each kind of food has its own colours: tabs, cloth, cards and ribbons
  const CAT_COL = [{ main: '#ff7aa8', dark: '#c93b73', light: '#ffe3ee' }, { main: '#ffae2e', dark: '#b8710a', light: '#fff0cc' }, { main: '#ff6a52', dark: '#b6372a', light: '#ffdcd5' }];
  // how big a finished food is, in units of its radius (to fit a picture of it into a box)
  const sauceLine = (col, a = -.3, b = .3, y = 0) => ({ col, pts: [[a, y], [a * .5, y - .03], [0, y + .03], [b * .5, y - .03], [b, y]] });
  const stackOf = ids => ({ type: 'stack', layers: ids.map(id => ({ id })) });
  const RECIPES = [
    { id: 'sugar', cat: 0, name: 'Sugar cookies', ptype: 'cookie', steps: [
      { k: 'add', ids: ['flour', 'sugar', 'butter', 'egg'], amt: { flour: 3, sugar: 2, egg: 2 } }, { k: 'stir' }, { k: 'roll' }, { k: 'cut', n: 6 }, { k: 'bake' },
      { k: 'decorate', tools: ['ice-pink', 'ice-blue', 'ice-yellow', 'sprinkles', 'candy', 'star'], need: 4 }, { k: 'serve' }],
      sample: { type: 'multi', parts: [[-.6, .1, { type: 'cookie', shape: 'star', baked: 1, deco: { fill: '#ff9ec8', dots: [{ id: 'sprinkles', x: -.2, y: -.1, col: '#fff', rot: .5 }, { id: 'sprinkles', x: .2, y: .1, col: '#ffd54a', rot: -.5 }] } }, .5], [.55, -.05, { type: 'cookie', shape: 'bear', baked: 1, deco: { fill: '#7fd4f5', dots: [{ id: 'candy', x: 0, y: .25, col: '#ff6b81' }] } }, .5], [0, .55, { type: 'cookie', shape: 'heart', baked: 1, deco: { fill: '#ffe066', dots: [{ id: 'candy', x: -.1, y: -.1, col: '#5cc8f2' }] } }, .5]] } },
    { id: 'chip', cat: 0, name: 'Chocolate chip cookies', ptype: 'cookie', steps: [
      { k: 'add', ids: ['flour', 'sugar', 'butter', 'chips'], amt: { flour: 3, sugar: 2, chips: 3 } }, { k: 'stir' }, { k: 'fill', what: 'dough', lay: 'sheet', n: 6 }, { k: 'bake' }, { k: 'serve' }],
      sample: { type: 'multi', parts: [[-.5, 0, { type: 'cookie', shape: 'round', baked: 1, chips: true }, .62], [.5, -.1, { type: 'cookie', shape: 'round', baked: 1, chips: true }, .62], [0, .55, { type: 'cookie', shape: 'round', baked: 1, chips: true }, .62]] } },
    { id: 'cupcake', cat: 0, name: 'Cupcakes', ptype: 'cupcake', steps: [
      { k: 'add', ids: ['flour', 'sugar', 'egg', 'milk'], amt: { flour: 3, sugar: 2, egg: 2, milk: 2 } }, { k: 'stir' }, { k: 'fill', what: 'batter', lay: 'cups', n: 6 }, { k: 'bake' },
      { k: 'decorate', tools: ['ice-pink', 'ice-blue', 'ice-white', 'ice-purple'], mode: 'frost', need: 3 },
      { k: 'decorate', tools: ['sprinkles', 'cherry', 'candy', 'star', 'strawberry'], need: 3 }, { k: 'serve' }],
      sample: { type: 'cupcake', baked: 1, liner: '#ff9ec8', frost: { col: '#ffd0e4' }, deco: { dots: [{ id: 'cherry', x: 0, y: -.55 }, { id: 'sprinkles', x: -.2, y: -.25, col: '#5cc8f2', rot: .4 }, { id: 'sprinkles', x: .22, y: -.2, col: '#ffd54a', rot: -.6 }] } } },
    { id: 'cake', cat: 0, name: 'Birthday cake', ptype: 'cake', steps: [
      { k: 'add', ids: ['flour', 'sugar', 'egg', 'butter', 'milk'], amt: { flour: 3, sugar: 2, egg: 3, milk: 2 } }, { k: 'stir' }, { k: 'fill', what: 'batter', lay: 'pan', n: 1 }, { k: 'bake' },
      { k: 'decorate', tools: ['ice-pink', 'ice-blue', 'ice-yellow', 'ice-choc'], mode: 'frost', need: 1 },
      { k: 'decorate', tools: ['candle', 'strawberry', 'sprinkles', 'candy', 'star'], need: 4 }, { k: 'serve' }],
      sample: { type: 'cake', baked: 1, frost: { col: '#ffd0e4' }, deco: { dots: [{ id: 'candle', x: 0, y: -.1 }, { id: 'candle', x: -.4, y: 0 }, { id: 'candle', x: .4, y: 0 }, { id: 'strawberry', x: -.2, y: .12 }, { id: 'strawberry', x: .2, y: .12 }] } } },
    { id: 'pancake', cat: 0, name: 'Pancakes', ptype: 'stack', steps: [
      { k: 'add', ids: ['flour', 'egg', 'milk', 'butter'], amt: { flour: 3, egg: 2, milk: 2 } }, { k: 'stir' }, { k: 'fill', what: 'batter', lay: 'griddle', n: 3 },
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


  /* ---------------------------------------------------------------- the game */
  const H = {};   // one handler per kind of step (below)
  const bitesFor = (p, n = 1) => { const b = BITES[p.type] || 4; return n >= 5 ? 2 : n >= 3 ? Math.min(b, 3) : b; };

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
      this.tray = []; this.flies = []; this.motions = []; this.said = {}; this.heard = new Set(); this.trans = null;
      this.cutters = []; this.mix = null; this.pieces = []; this.dough = null; this.units = null;
      this.tick = this.tick.bind(this);
      this.oc = document.createElement('canvas');
      SPG.cookGame = this;
      try { if (document.fonts) for (const w of [400, 600, 700]) document.fonts.load(`${w} 24px Fredoka`); } catch (_) { /* the fallback font is fine */ }
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
      if (n === 4) return [this.P(-.22, -.18), this.P(.22, -.18), this.P(-.22, .2), this.P(.22, .2)].map(p => ({ ...p, r: U * .17 }));
      // five or six: a neat grid, three across (two across on a tall screen)
      const cols = tall ? 2 : 3, rows = Math.ceil(n / cols), dx = tall ? .24 : .31, dy = tall ? .25 : .2, out = [];
      for (let i = 0; i < n; i++) { const row = Math.floor(i / cols), inRow = row === rows - 1 ? n - cols * (rows - 1) : cols, col = i % cols; out.push({ ...this.P((col - (inRow - 1) / 2) * dx, (row - (rows - 1) / 2) * dy), r: U * (tall ? .125 : .14) }); }
      return out;
    }
    // the plate or platter every step draws the food on, so nothing jumps around between steps
    plate() {
      const U = this.U, n = this.pieces.length, p = this.pieces[0];
      if (n <= 1 && p && !p.shape && ['stack', 'hotdog', 'sundae'].includes(p.type)) { const B = H.stack.base(this); return { x: B.x, y: B.y + U * .02, r: U * .36 }; }
      const r = Math.min(this.w * .46, p && p.shape && p.type === 'stack' ? U * .5 : U * (n <= 1 ? .4 : n === 2 ? .5 : n <= 4 ? .54 : (this.SH > this.w * .9 ? .58 : .5)));
      return { x: this.bx, y: this.by + U * .03, r };
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
    // an ingredient's name is said the first time it is touched in a recipe, and not again (counting is said every time)
    hear(id) { if (this.heard.has(id)) return; this.heard.add(id); voice.say('cook/' + id); }
    busy() { return this.flies.length > 0 || this.motions.length > 0; }
    // an item flies from where it was let go to where it belongs, then something happens
    fly(draw, x0, y0, x1, y1, cb, size = 40, dur = .38) { this.flies.push({ draw, x0, y0, x1, y1, cb, size, t: 0, dur }); }
    ingFly(id, x0, y0, x1, y1, cb) { this.fly((c, s) => (ING[id] || ING.flour)(c, s), x0, y0, x1, y1, cb, this.U * .12); }
    finish(delay = .8) { if (this.st && !this.st.fin) { this.st.fin = true; this.st.finT = delay; } }
    pickCutters() { const all = SHAPES.slice(), out = []; while (out.length < 4) out.push(all.splice(Math.floor(Math.random() * all.length), 1)[0]); return out; }

    /* ------------------------------------------------------------ menu and recipe flow */
    enterMenu() {
      if (this.st && this.st.snd) { this.st.snd.off(); this.st.snd = null; }
      this.screen = 'menu'; this.R = null; this.st = null; this.tray = []; this.flies = []; this.motions = []; this.mix = null; this.pieces = []; this.arrow = null; this.piece = null; this.paint = null;
        this.layoutMenu(); this.say('cook-pick', 6);
    }
    startRecipe(R) {
      const sk = R.steps.find(q => q.k === 'stack'), nl = sk ? sk.order.length : 0; this.R1k = nl >= 7 ? .78 : nl === 6 ? .88 : 1; this.R1 = this.U * .26 * this.R1k;
      this.R = R; this.screen = 'cook'; this.stIdx = 0; this.pieces = []; this.piece = null; this.dough = null; this.units = null; this.arrow = null; this.finishedAll = false;
      this.mix = R.steps.some(s => s.k === 'add') ? { items: [], fill: 0, stirred: 0, col: '#f6e8c8', final: BATTER } : null;
      this.cutters = this.pickCutters(); this.flies = []; this.motions = []; this.heard = new Set(); this.paint = { plate: [] }; this.piece = null; this.tool = null;
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
          if (it.kind === 'tool') { this.tool = it.id; sfx.tap(); this.hear(it.id); return; }
          this.drag = { it, id: p.id, dx: it.x - p.x, dy: it.y - p.y, sx: p.x, sy: p.y, moved: 0 }; it.drag = true; sfx.tap(); this.hear(it.id);
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
      for (const h of this.menuHit) if (h.w ? Math.abs(p.x - h.x) < h.w / 2 && Math.abs(p.y - h.y) < h.h / 2 : Math.hypot(p.x - h.x, p.y - h.y) < h.r) {
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
      let key = { add: 'cook-add', stir: 'cook-stir', roll: 'cook-roll', cut: sp.target === 'piece' ? 'cook-cutsand' : 'cook-cut', fill: sp.what === 'dough' ? 'cook-drop' : 'cook-pour', bake: s.state === 'cold' ? 'cook-oven-on' : s.state === 'ding' ? 'cook-ding' : 'cook-bake', grill: 'cook-grill', stack: 'cook-stack', decorate: sp.mode === 'frost' ? 'cook-frost' : sp.tools.some(t => SAUCES.includes(t)) ? 'cook-squirt' : 'cook-decorate', slice: 'cook-slice', serve: 'cook-serve' }[k];
      voice.say(key);
    }
    wantIds() { const s = this.st; return s && H[s.k].want ? H[s.k].want(this, s) || [] : []; }
  }

  /* ---------------------------------------------------------------- step handlers */
  // Each handler: enter(g,s) sets up the step and its tray; down/move/up are free touches; drop(g,s,item,x,y,tap) is a tray item let go
  // (return true = accepted, 'wrong' = wiggle and say try again, false = send it home); want() lists the tray ids to glow; draw() paints the stage.
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  H.add = {
    enter(g, s) {
      // each ingredient is counted: one for toddlers, up to 2 or 3 for older children (see SPG.level)
      const tier = SPG.level.tier('cook'); s.amt = {}; s.got = {}; s.left = [];
      for (const id of s.spec.ids) { const base = (s.spec.amt && s.spec.amt[id]) || 1, n = tier === 1 ? 1 : tier === 2 ? Math.min(base, 2) : base; s.amt[id] = n; s.got[id] = 0; for (let i = 0; i < n; i++) s.left.push(id); }
      s.total = s.left.length; s.done = 0;
      g.setTray(s.spec.ids.map(id => ({ id, kind: 'ing', cnt: { total: s.amt[id], done: 0 } })));
    },
    want: (g, s) => [...new Set(s.left)],
    drop(g, s, it, x, y, tap) {
      if (!s.left.includes(it.id)) return 'wrong';
      const b = g.bowlPos(); if (!tap && Math.hypot(x - b.x, (y - b.y) * 1.3) > b.r * 1.4) return false;
      s.left.splice(s.left.indexOf(it.id), 1);
      const k = ++s.got[it.id]; it.cnt.done = k; if (k >= s.amt[it.id]) it.used = true;
      g.addMotion(it.id, tap ? it.x : x, tap ? it.y : y, b, () => {
        s.done++; g.mix.items.push({ col: ICOL[it.id] || '#fff' }); g.mix.fill = Math.min(.9, .12 + s.done / s.total * .78);
        sfx.pop(); g.fx.burst(b.x, b.y, 10, { colors: [ICOL[it.id] || '#fff', '#fff'], speed: 130, g: 300, life: .5, size: 5 });
        if (s.amt[it.id] > 1) voice.say('num/' + k);   // counting out loud: "one, two"
        if (s.done >= s.total) g.finish(.7);
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

  // Cutting: pick a cutter (touch it once), then touch the dough, or the sandwich, wherever you like. The cutter comes down, presses through,
  // lifts away, and the shape stays behind, as many times as there is room. Touch-and-drag shows where it will land.
  const LCOL = { pbutter: '#c98b4a', jelly: '#b8326a', cheese: '#ffd54a', ham: '#ff9db3', turkey: '#f0d6b0', lettuce: '#6fcf4a', tomato: '#e8433f', avocado: '#9ccc5a', cucumber: '#bfe8a0', butterpat: '#ffe27a', onion: '#e8d0f0', pickle: '#6fae3c', carrot: '#ff9d3d' };
  H.cut = {
    enter(g, s) {
      s.sandwich = s.spec.target === 'piece'; s.cuts = []; s.max = s.sandwich ? 4 : (s.spec.n || 6); s.minDone = s.sandwich ? 1 : 3; s.scrap = 0; s.ghost = null; s.nope = null;
      s.rc = g.U * (s.sandwich ? .1 : .09); s.cutter = g.cutters[0]; g.tool = s.cutter; s.base = s.sandwich ? g.piece : null;
      g.setTray(g.cutters.map(id => ({ id, kind: 'cutter' })));
    },
    want: (g, s) => s.cuts.length ? [] : [s.cutter],
    area(g, s) { return s.sandwich ? { sq: true, x: g.bx, y: g.by, h: g.U * .27 } : { x: g.bx, y: g.by, rx: g.U * .46, ry: g.U * .3 }; },
    // is a cut at (x, y) inside the dough (or the bread) and clear of the cuts already made? Nudges it inside if it was close.
    place(g, s, x, y) {
      const a = H.cut.area(g, s), rc = s.rc * .92;
      if (a.sq) { x = clamp(x, a.x - a.h + rc, a.x + a.h - rc); y = clamp(y, a.y - a.h + rc, a.y + a.h - rc); }
      else { const ex = a.rx - rc, ey = a.ry - rc, k = Math.hypot((x - a.x) / ex, (y - a.y) / ey); if (k > 1) { x = a.x + (x - a.x) / k; y = a.y + (y - a.y) / k; } }
      for (const c of s.cuts) if (Math.hypot(c.x - x, c.y - y) < rc * 1.85) return null;
      return { x, y };
    },
    near(g, s, x, y) { const a = H.cut.area(g, s), m = s.rc * 1.6; return a.sq ? Math.abs(x - a.x) < a.h + m && Math.abs(y - a.y) < a.h + m : Math.hypot((x - a.x) / (a.rx + m), (y - a.y) / (a.ry + m)) < 1; },
    try(g, s, x, y) {
      if (s.fin || s.cuts.length >= s.max || !s.cutter) return false;
      if (!H.cut.near(g, s, x, y)) return false;
      const at = H.cut.place(g, s, x, y);
      if (!at) { s.nope = { x, y, t: 0 }; sfx.oops(); return false; }
      s.cuts.push({ shape: s.cutter, x: at.x, y: at.y, t: 0, pressed: false });
      g.pieces = s.cuts.map(c => s.sandwich ? { type: 'stack', shape: c.shape, layers: s.base.layers.map(l => ({ ...l })) } : { type: 'cookie', shape: c.shape, baked: 0 });
      g.idle = 0; if (s.cuts.length >= s.minDone) { s.canDone = true; g.st.canDone = true; }
      if (s.cuts.length >= s.max) g.finish(1.2);
      return true;
    },
    // touching a cutter picks it (and says its name once); dragging one onto the dough cuts where it is let go
    drop(g, s, it, x, y, tap) {
      s.cutter = it.id; g.tool = it.id;
      if (tap) { sfx.snap(); return true; }
      return H.cut.try(g, s, x, y);
    },
    down(g, s, p) { if (s.fin || !s.cutter) return; s.ghost = { x: p.x, y: p.y }; },
    move(g, s, p) { if (s.ghost) s.ghost = { x: p.x, y: p.y }; },
    up(g, s, p) { const gh = s.ghost; s.ghost = null; if (gh) H.cut.try(g, s, p.x, p.y); },
    update(g, s, dt) {
      for (const c of s.cuts) {
        const t0 = c.t; c.t += dt;
        if (t0 < .17 && c.t >= .17) { sfx.cut(); g.fx.burst(c.x, c.y, 10, { colors: s.sandwich ? ['#fff3d6', '#f3d9a4'] : ['#fff', '#f6e8c8'], speed: 100, g: 220, life: .45, size: 4 }); }
        if (t0 < .34 && c.t >= .34) sfx.pat();
      }
      if (s.nope) { s.nope.t += dt; if (s.nope.t > .5) s.nope = null; }
      if (s.fin) s.scrap = Math.min(1, s.scrap + dt * 2.2);
      if (!s.fin && s.cuts.length === 0 && g.idle > 14) { g.idle = 8; }
    },
    draw(g, s, c) {
      const rc = s.rc, U = g.U; g.sceneBoard(c);
      const a = H.cut.area(g, s), fade = 1 - ease(s.scrap);
      if (s.sandwich) {
        const pl = { x: g.bx, y: g.by + U * .03, r: Math.min(g.w * .46, U * .5) }; drawPlate(c, pl.x, pl.y, pl.r);
        c.save(); c.globalAlpha = fade;
        // the sandwich seen from above and a little in front: crust, bread, and the filling showing along the edge
        const hh = a.h, edge = U * .075, lay = (s.base.layers || []).filter(l => !['bread', 'toast'].includes(l.id));
        c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, a.x - hh + 4, a.y - hh + 8, hh * 2, hh * 2 + edge, hh * .2); c.fill();
        c.fillStyle = shade(CRUST, -.1); rr(c, a.x - hh, a.y + hh - hh * .2, hh * 2, edge + hh * .2, hh * .12); c.fill();
        const n = Math.max(1, lay.length); lay.forEach((l, k) => { c.fillStyle = LCOL[l.id] || '#f0c36a'; c.fillRect(a.x - hh * .94, a.y + hh + edge * (k / n) * .9 - edge * .5, hh * 1.88, edge * .9 / n + 1); });
        c.fillStyle = CRUST; rr(c, a.x - hh, a.y - hh, hh * 2, hh * 2, hh * .2); c.fill();
        c.fillStyle = BREAD; rr(c, a.x - hh * .88, a.y - hh * .88, hh * 1.76, hh * 1.76, hh * .14); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, a.x - hh * .78, a.y - hh * .8, hh * .9, hh * .18, hh * .08); c.fill();
        for (const [k, l] of lay.entries()) for (const [dx, dy, rx, ry] of [[-.85, .2 + k * .1, .14, .08], [.9, -.3 + k * .12, .12, .07], [-.3, .92, .16, .07]]) { c.fillStyle = LCOL[l.id] || '#f0c36a'; c.beginPath(); c.ellipse(a.x + dx * hh, a.y + dy * hh, hh * rx, hh * ry, 0, 0, TAU); c.fill(); }
        c.restore();
      } else { drawSheet(g, c, 1, DOUGH); c.save(); c.globalAlpha = fade; c.restore(); }
      // the cut-out shapes: a groove where the cutter pressed, then the shape popping up and settling
      const slots = s.sandwich && s.fin ? g.slots(s.cuts.length) : null;
      s.cuts.forEach((k, i) => {
        const u = k.t; let x = k.x, y = k.y, R = rc;
        if (slots) { const e = ease(clamp(s.scrap * 1.3, 0, 1)); x = lerp(k.x, slots[i].x, e); y = lerp(k.y, slots[i].y, e); R = lerp(rc, slots[i].r * .9, e); }
        c.save(); c.translate(x, y);
        if (u >= .17) { c.fillStyle = s.sandwich ? 'rgba(120,80,40,.5)' : shade(DOUGH, -.4); shapeFill(c, k.shape, R, R * .08); }
        if (u >= .3) {
          const pop = Math.sin(clamp((u - .3) / .28, 0, 1) * Math.PI) * .09;
          c.translate(0, -pop * R * 1.6); c.scale(1 + pop, 1 + pop);
          if (s.sandwich) { c.fillStyle = 'rgba(80,40,20,.2)'; c.save(); c.translate(R * .05, R * .1); shapeFill(c, k.shape, R, 0); c.restore(); drawCharSandwich(c, { shape: k.shape }, R / .9); }
          else cookieShape(c, k.shape, R, DOUGH, { speckle: true });
        }
        c.restore();
      });
      // the cutter coming down, pressing and lifting away
      for (const k of s.cuts) {
        const u = k.t; if (u >= .6) continue; let sc, al, lift = 0, press = 0;
        if (u < .17) { const e = ease(u / .17); sc = lerp(1.65, 1, e); al = .3 + .7 * e; lift = (1 - e) * rc * .9; }
        else if (u < .34) { sc = .95; al = 1; press = 1; }
        else { const e = ease((u - .34) / .26); sc = lerp(1, 1.7, e); al = 1 - e; lift = e * rc * 1.1; }
        c.save(); c.translate(k.x, k.y);
        if (press) { c.globalAlpha = .5; c.fillStyle = s.sandwich ? '#f7e3b0' : shade(DOUGH, .15); shapeFill(c, k.shape, rc, rc * .2); }
        c.globalAlpha = .22 * al; c.fillStyle = '#5a3a20'; c.save(); c.translate(rc * .12 + lift * .35, rc * .16 + lift * .55); c.scale(sc, sc); shapeFill(c, k.shape, rc, rc * .06); c.restore();
        c.globalAlpha = al; c.translate(0, -lift); c.scale(sc, sc); cutterArt(c, k.shape, rc, g.t); c.restore();
      }
      // where the cutter will go while a finger is down
      if (s.ghost && !s.fin) {
        const at = H.cut.place(g, s, s.ghost.x, s.ghost.y), near = H.cut.near(g, s, s.ghost.x, s.ghost.y), ok = at && near;
        c.save(); c.translate(ok ? at.x : s.ghost.x, ok ? at.y : s.ghost.y); c.globalAlpha = .7; c.fillStyle = ok ? 'rgba(255,255,255,.35)' : 'rgba(255,90,100,.3)'; shapeFill(c, s.cutter, rc, rc * .06); c.globalAlpha = .9; cutterArt(c, s.cutter, rc, g.t); c.restore();
      }
      if (s.nope) { c.save(); c.translate(s.nope.x + Math.sin(s.nope.t * 50) * 6, s.nope.y); c.globalAlpha = 1 - s.nope.t * 2; c.strokeStyle = '#ff5a6a'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, rc * 1.05, 0, TAU); c.stroke(); c.restore(); }
      if (!s.fin && g.idle > 2.5 && s.cuts.length === 0) { c.save(); c.globalAlpha = .6 + Math.sin(g.t * 6) * .4; drawTapHint(c, g.bx, g.by, U * .1, g.t); c.restore(); }
      if (!s.fin) { c.save(); c.textAlign = 'center'; const left = s.max - s.cuts.length; for (let i = 0; i < s.max; i++) { const x = g.bx + (i - (s.max - 1) / 2) * U * .06, y = g.y0 + U * .03; c.fillStyle = i < s.cuts.length ? '#7ed957' : 'rgba(255,255,255,.8)'; c.strokeStyle = i < s.cuts.length ? '#3f9a5a' : '#e0c8b0'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, U * .018, 0, TAU); c.fill(); c.stroke(); } c.restore(); }
    }
  };

  // where things go when batter or dough is dropped (a tray, a muffin tin, a cake pan or a griddle)
  function fillSlots(g, lay) {
    const U = g.U;
    if (lay === 'sheet') return [[-.3, -.17], [0, -.17], [.3, -.17], [-.3, .2], [0, .2], [.3, .2]].map(([x, y]) => ({ ...g.P(x, y), r: U * .115 }));
    if (lay === 'cups') return [[-.33, -.1], [0, -.1], [.33, -.1], [-.33, .17], [0, .17], [.33, .17]].map(([x, y]) => ({ ...g.P(x, y), r: U * .12 }));
    if (lay === 'pan') return [{ ...g.P(0, 0), r: U * .4 }];
    return [[-.28, -.12], [.28, -.12], [0, .2]].map(([x, y]) => ({ ...g.P(x, y), r: U * .2 }));
  }
  function drawFillBase(g, c, lay, slots) {
    const U = g.U;
    if (lay === 'sheet') { pan(c, g.bx, g.by + U * .02, U * .92, U * .68); }
    else if (lay === 'cups') { pan(c, g.bx, g.by + U * .03, U * .98, U * .6); for (const sl of slots) { ell(c, sl.x, sl.y + sl.r * .25, sl.r * 1.0, sl.r * .62, '#7f8a9c'); } }
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

  H.bake = {
    // turn the oven on first (it lights up), then slide the tray in, wait for the bell, and take it out
    enter(g, s) { s.state = 'cold'; s.t = 0; s.bt = 0; voice.say('cook-oven-on'); },
    geom(g) { const n = g.pieces.length, S = Math.min(g.U * .78, g.SH * .62), o = { x: g.bx, y: g.y0 + g.SH * .36, s: S }, p = { x: g.bx, y: g.y1 - g.U * (n > 3 ? .2 : .16), w: Math.min(g.U * .95, g.w * .9), h: g.U * (n > 3 ? .36 : .26) }; return { o, p }; },
    down(g, s, p) {
      const { o, p: pn } = H.bake.geom(g); const hitO = Math.abs(p.x - o.x) < o.s * .6 && Math.abs(p.y - o.y) < o.s * .6, hitP = Math.abs(p.x - pn.x) < pn.w * .55 && Math.abs(p.y - pn.y) < pn.h * 1.2;
      if (s.state === 'cold' && (hitO || hitP)) { s.state = 'warm'; s.t = 0; sfx.snap(); sfx.chime(); }
      else if (s.state === 'idle' && (hitO || hitP)) { s.state = 'in'; s.t = 0; sfx.whoosh(); }
      else if (s.state === 'ding' && (hitO || hitP)) { s.state = 'out'; s.t = 0; sfx.whoosh(); }
    },
    update(g, s, dt) {
      s.t += dt; const { o } = H.bake.geom(g);
      if (s.state === 'warm' && s.t > 1.1) { s.state = 'idle'; s.t = 0; voice.say('cook-bake'); }
      else if (s.state === 'in' && s.t > .9) { s.state = 'bake'; s.t = 0; sfx.sizzle(); }
      else if (s.state === 'bake') { s.bt = Math.min(1, s.t / 3.6); for (const p of g.pieces) p.baked = s.bt; if (Math.floor(g.t * 6) % 2 === 0 && Math.random() < .3) g.fx.burst(o.x, o.y - o.s * .5, 1, { colors: ['rgba(255,255,255,.8)'], speed: 20, g: -50, life: 1, size: 8, up: 40 }); if (s.t >= 3.6) { s.state = 'ding'; s.t = 0; sfx.ding(2); g.fx.burst(o.x, o.y, 22, { colors: ['#ffd54a', '#fff'], speed: 260, g: 200, life: .8, size: 6, shape: 'star' }); setTimeout(() => { if (g.st === s && s.state === 'ding') voice.say('cook-ding'); }, 1500); } }
      else if (s.state === 'out' && s.t > .9) { s.state = 'done'; for (const p of g.pieces) p.baked = 1; g.finish(.4); }
    },
    want: () => [], hintTarget: true,
    draw(g, s, c) {
      const { o, p } = H.bake.geom(g), n = g.pieces.length, rows = n > 3 ? 2 : 1, perRow = Math.ceil(n / rows), r = Math.min(g.U * (n > 3 ? .1 : n > 1 ? .12 : .2), p.w / (perRow * 2.3));
      // the pieces sit on the tray in one or two rows
      const pcs = (cc, sc) => g.pieces.forEach((pc, i) => { const row = Math.floor(i / perRow), inRow = row === rows - 1 ? n - perRow * (rows - 1) : perRow, col = i % perRow; cc.save(); cc.translate((col - (inRow - 1) / 2) * r * 2.4 * sc, (row - (rows - 1) / 2) * r * 2.1 * sc); drawPieceC(cc, pc, r * sc); cc.restore(); });
      const glow = s.state === 'cold' ? 0 : s.state === 'warm' ? clamp(s.t / 1.1, 0, 1) * .6 : s.state === 'idle' ? .6 : s.state === 'bake' ? Math.min(1, .6 + s.t * 2) : s.state === 'ding' ? 1 : s.state === 'in' ? clamp(.6 + s.t * .4, 0, 1) : s.state === 'out' ? clamp(1 - s.t * 1.2, 0, 1) : 0;
      const inside = s.state === 'bake' || s.state === 'ding' || (s.state === 'in' && s.t >= .9);
      drawOven(c, o.x, o.y, o.s, glow, 0, g.t, null, s.state !== 'cold');
      if (inside) { c.save(); c.beginPath(); rr(c, o.x - o.s * .34, o.y - o.s * .24, o.s * .68, o.s * .52, o.s * .05); c.clip(); c.translate(o.x, o.y + o.s * .1); pan(c, 0, 0, o.s * .56, o.s * (rows === 2 ? .24 : .17)); c.translate(0, -o.s * .06); const sr = o.s * (rows === 2 ? .052 : .075), pper = Math.ceil(n / rows); g.pieces.forEach((pc, i) => { const row = Math.floor(i / pper), inRow = row === rows - 1 ? n - pper * (rows - 1) : pper, col = i % pper; c.save(); c.translate((col - (inRow - 1) / 2) * sr * 2.3, (row - (rows - 1) / 2) * sr * 2); drawPieceC(c, pc, sr); c.restore(); }); c.restore(); }
      else {
        let u = s.state === 'in' ? ease(clamp(s.t / .9, 0, 1)) : s.state === 'out' ? 1 - ease(clamp(s.t / .9, 0, 1)) : 0; if (s.state === 'done') u = 0;
        const x = lerp(p.x, o.x, u), y = lerp(p.y, o.y + o.s * .1, u), k = lerp(1, .52, u);
        c.save(); c.translate(x, y); c.scale(k, k);
        if (s.state === 'idle') { c.shadowColor = '#fff'; c.shadowBlur = 14 + Math.sin(g.t * 5) * 8; }
        pan(c, 0, 0, p.w, p.h); c.shadowBlur = 0; c.translate(0, -p.h * .05); pcs(c, 1); c.restore();
      }
      if (s.state === 'bake') { c.strokeStyle = '#ffd54a'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.arc(o.x, o.y - o.s * .5 - 24, 24, -Math.PI / 2, -Math.PI / 2 + TAU * s.bt); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y - o.s * .5 - 24, 24, 0, TAU); c.stroke(); }
      if (s.state === 'cold' || s.state === 'idle' || s.state === 'ding') { const pk = Math.sin(g.t * 6) * .5 + .5; c.save(); c.globalAlpha = .6 + pk * .4; const onOven = s.state !== 'idle'; drawTapHint(c, onOven ? o.x : p.x, onOven ? o.y + o.s * .1 : p.y - p.h * .3, g.U * .1, g.t); c.restore(); }
      if (s.state === 'ding') { c.save(); const k = 1 + Math.sin(g.t * 20) * .06; c.translate(o.x + o.s * .42, o.y - o.s * .5); c.rotate(Math.sin(g.t * 24) * .12); c.scale(k, k); ING.bell(c, g.U * .1); c.restore(); }
    }
  };

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
        sfx.pat(); g.hear(id); g.fx.burst(base.x, base.y - H.stack.height(g), 8, { colors: ['#fff', '#ffe27a'], speed: 110, g: 300, life: .4, size: 4 });
      });
      if (last) g.finish(1.1);
      return true;
    },
    base(g) { return { x: g.bx, y: g.by + g.U * .12 }; },
    height(g) { const p = g.piece, W = g.R1 * 2; return p.type === 'sundae' ? (p.scoops.length ? W * (.22 + p.scoops.length * .27) : 0) : (p.layers || []).reduce((a, l) => a + (LAYER[l.id] ? LAYER[l.id][0] * W * (l.squash || 1) * (l.id === 'bunT' ? .78 : .9) : 0), 0); },
    update(g, s, dt) { for (const l of g.piece.layers) if (l.drop > 0) l.drop = Math.max(0, l.drop - dt * 4.5); for (const l of g.piece.scoops) if (l.drop > 0) l.drop = Math.max(0, l.drop - dt * 4.5); },
    draw(g, s, c) { g.sceneBoard(c); g.drawPlateAndPiece(c, g.piece, true); }
  };

  function drawPlatePaint(g, c) { if (!g.paint || !g.paint.plate.length) return; const pl = g.plate(); c.save(); c.translate(pl.x, pl.y); drawPaintList(c, g.paint.plate, g.U); c.restore(); }
  // where food can be touched, in the food's own units (origin as drawn by drawPiece)
  const pieceBox = p => { const t = p.type; if (p.shape && t === 'stack') return { r: 1.0 }; if (t === 'cookie') return { r: 1.1 }; if (t === 'cupcake') return { hw: .62, y0: -.75, y1: .6 }; if (t === 'cake') return { hw: 1.0, y0: -.5, y1: 1.0 }; if (t === 'sundae') return { hw: .75, y0: -2.0, y1: .15 }; if (t === 'hotdog') return { hw: 1.15, y0: -.8, y1: .2 }; return { hw: 1.05, y0: -(pieceHeight(p, 1) + .15), y1: .2 }; };
  const inBox = (b, x, y) => b.r ? Math.hypot(x, y) <= b.r : Math.abs(x) <= b.hw && y >= b.y0 && y <= b.y1;

  // free decorating: icing, sprinkles, toppings, sauces and seasoning
  H.decorate = {
    enter(g, s) {
      const sp = s.spec; s.need = sp.mode === 'frost' ? g.pieces.length : (sp.need || 3); s.acts = 0; s.canDone = false; s.stroke = null; s.sauce = null;
      g.setTray(sp.tools.map(id => ({ id, kind: 'tool' }))); g.tool = sp.tools[0];
      if (sp.mode === 'frost') for (const p of g.pieces) { delete p.frost; }
    },
    want: () => [],
    // what is under a finger: a piece of food (with the point in its own units), or the plate
    target(g, p) {
      const sl = g.slots();
      for (let i = g.pieces.length - 1; i >= 0; i--) { const q = sl[i], pc = g.pieces[i]; if (!q || pc.gone) continue; const ox = q.x, oy = q.y + pieceBase(pc, q.r), lx = (p.x - ox) / q.r, ly = (p.y - oy) / q.r; if (inBox(pieceBox(pc), lx, ly)) return { piece: pc, slot: q, i, k: q.r, lx, ly }; }
      const pl = g.plate(), dx = (p.x - pl.x) / pl.r, dy = (p.y - pl.y) / (pl.r * .64);
      if (dx * dx + dy * dy <= 1) return { plate: true, k: g.U, lx: (p.x - pl.x) / g.U, ly: (p.y - pl.y) / g.U };
      return null;
    },
    hit(g, p) { const t = H.decorate.target(g, p); return t && t.piece ? t : null; },
    down(g, s, p) {
      const tool = g.tool; if (!tool || s.fin) return;
      const t = H.decorate.target(g, p); s.sp0 = { x: p.x, y: p.y }; s.dragged = false; s.cur = null; s.stroke = null; s.sauce = null;
      if (SEASONS.includes(tool)) { if (t) H.decorate.grains(g, s, t, p, tool); return; }
      if (DOTS.includes(tool)) {
        const h = t && t.piece ? t : null; if (!h) return; const pc = h.piece, lx = (p.x - h.slot.x) / h.slot.r, ly = (p.y - h.slot.y) / h.slot.r; const n = tool === 'sprinkles' ? 6 : 1;
        for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = n > 1 ? Math.random() * .22 : 0; H.decorate.dot(g, pc, tool, lx + Math.cos(a) * d, ly + Math.sin(a) * d, i); }
        sfx.plink(Math.floor(Math.random() * 5)); g.fx.burst(p.x, p.y, 6, { colors: [tool === 'sprinkles' ? SPRINKLE[0] : '#fff', '#ffd54a'], speed: 90, g: 300, life: .4, size: 4, shape: 'star' }); H.decorate.act(g, s); return;
      }
      const pc = t && t.piece, icing = pc && ['cookie', 'cupcake', 'cake'].includes(pc.type) && ICING[tool];
      if (icing) { s.cur = { piece: pc, slot: t.slot }; s.stroke = { pts: [] }; H.decorate.move(g, s, p); return; }
      if (SAUCES.includes(tool) && t) {   // a squeeze bottle: paint it anywhere on the food or the plate
        s.sauce = { col: SAUCE[tool] || '#b8651a', st: null, key: null, last: { x: p.x, y: p.y, t: performance.now() }, moved: performance.now(), n: 0 };
        s.snd = sfx.squeeze(); sfx.squirt(); H.decorate.addSauce(g, s, p, t, 1);
      }
    },
    addSauce(g, s, p, t, first) {
      const S = s.sauce; if (!t) { S.st = null; S.key = null; return; }
      const key = t.plate ? 'plate' : 'p' + t.i;
      if (!S.st || S.key !== key) { S.st = { col: S.col, kind: 'sauce', pts: [] }; S.key = key; if (t.plate) g.paint.plate.push(S.st); else (t.piece.paint = t.piece.paint || []).push(S.st); S.k = t.k; }
      const now = performance.now(), d = Math.hypot(p.x - S.last.x, p.y - S.last.y), v = d / Math.max(.016, (now - S.last.t) / 1000), U = g.U;
      const w = clamp(U * .03 * (1.5 - v / (U * 2.2)), U * .016, U * .046);
      const q = { x: t.lx, y: t.ly, w: w / t.k }, pts = S.st.pts, lp = pts[pts.length - 1];
      if (first || !lp || Math.hypot(lp.x - q.x, lp.y - q.y) * t.k > U * .01) { pts.push(q); S.n++; S.moved = now; }
      S.last = { x: p.x, y: p.y, t: now }; if (s.snd) s.snd.set(clamp(v / (U * 1.2), .15, 1));
    },
    move(g, s, p) {
      if (s.sauce) { H.decorate.addSauce(g, s, p, H.decorate.target(g, p), 0); return; }
      if (!s.cur || !s.stroke) return; const h = s.cur, pc = h.piece, tool = g.tool;
      if (Math.hypot(p.x - s.sp0.x, p.y - s.sp0.y) > 10) s.dragged = true; if (!s.dragged && s.stroke.pts.length) return;
      if (!s.stroke.pts.length && !s.stroke.target) {
        if ((pc.type === 'cupcake' || pc.type === 'cake') && !pc.frost && ICING[tool]) { pc.frost = { col: ICING[tool], t: 0 }; sfx.squirt(); g.fx.burst(h.slot.x, h.slot.y, 14, { colors: [ICING[tool], '#fff'], speed: 130, g: 300, life: .5, size: 5 }); H.decorate.act(g, s); s.cur = null; s.stroke = null; if (s.spec.mode === 'frost' && g.pieces.every(q => q.frost)) g.finish(.9); return; }
      }
      const lx = clamp((p.x - h.slot.x) / h.slot.r, -.8, .8), ly = clamp((p.y - h.slot.y) / h.slot.r, -.7, .7);
      if (!s.stroke.target) { const st = { col: ICING[tool] || '#fff', pts: [] }; s.stroke.target = st; pc.deco = pc.deco || {}; (pc.deco.strokes = pc.deco.strokes || []).push(st); if (!s.snd) s.snd = sfx.squeeze(); }
      const last = s.stroke.pts[s.stroke.pts.length - 1]; if (!last || Math.hypot(last[0] - lx, last[1] - ly) > .05) { s.stroke.pts.push([lx, ly]); s.stroke.target.pts = s.stroke.pts.slice(); if (s.snd) s.snd.set(.6); }
    },
    up(g, s, p) {
      if (s.snd) { s.snd.off(); s.snd = null; }
      if (s.sauce) { const n = s.sauce.n; s.sauce = null; if (n) H.decorate.act(g, s); return; }
      const st = s.stroke, h = s.cur; s.stroke = null; s.cur = null; if (!st || !h || s.fin) return;
      const pc = h.piece, tool = g.tool;
      if (!s.dragged || !st.target || st.pts.length < 2) {
        // a plain tap with icing: fill the whole shape (cookies) or frost it
        if (st.target) { const arr = pc.deco && pc.deco.strokes; if (arr) arr.splice(arr.indexOf(st.target), 1); }
        if (pc.type === 'cookie' && ICING[tool]) { (pc.deco = pc.deco || {}).fill = ICING[tool]; sfx.squirt(); g.fx.burst(h.slot.x, h.slot.y, 14, { colors: [ICING[tool], '#fff'], speed: 130, g: 300, life: .5, size: 5 }); H.decorate.act(g, s); }
        else if ((pc.type === 'cupcake' || pc.type === 'cake') && ICING[tool] && !pc.frost) { pc.frost = { col: ICING[tool], t: 0 }; sfx.squirt(); H.decorate.act(g, s); if (s.spec.mode === 'frost' && g.pieces.every(q => q.frost)) g.finish(.9); }
        return;
      }
      H.decorate.act(g, s);
    },
    // salt and pepper: shaken over whatever she touches; the grains fall and stay where they land
    grains(g, s, t, p, tool) {
      const col = SEASON[tool], U = g.U, list = t.plate ? g.paint.plate : (t.piece.paint = t.piece.paint || []);
      let st = list.find(x => x.kind === 'grain' && x.col === col); if (!st) { st = { col, kind: 'grain', pts: [] }; list.push(st); }
      for (let i = 0; i < 16; i++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * U * .075; st.pts.push({ x: t.lx + Math.cos(a) * d / t.k, y: t.ly + Math.sin(a) * d / t.k * .7, w: (U * .004 + Math.random() * U * .003) / t.k }); }
      sfx.shake(); g.fx.burst(p.x, p.y - U * .1, 18, { colors: [col === '#ffffff' ? '#e8f0ff' : '#555', col], speed: 25, g: 900, life: .32, size: 2.6, shape: 'circle' });
      H.decorate.act(g, s); voice.say('cook-shake');
    },
    act(g, s) { s.acts++; const first = !s.canDone; if (s.spec.mode !== 'frost') { s.canDone = s.acts >= s.need; g.st.canDone = s.canDone; if (s.canDone && first) { sfx.chime(); voice.say('cook-alldone'); } } else if (g.pieces.every(q => q.frost)) g.finish(.9); },
    dot(g, pc, id, lx, ly, i) {
      const flat = ['stack', 'hotdog', 'sundae'].includes(pc.type), col = id === 'sprinkles' ? SPRINKLE[Math.floor(Math.random() * 5)] : id === 'candy' ? SPRINKLE[Math.floor(Math.random() * 5)] : null;
      const rot = Math.random() * 3 - 1.5;
      if (flat) { (pc.dots = pc.dots || []).push({ id, x: clamp(lx * .5, -.42, .42), y: (Math.random() - .5) * .04, col, rot }); }
      else (pc.deco = pc.deco || {}).dots = ((pc.deco || {}).dots || []).concat([{ id, x: clamp(lx, -.7, .7), y: clamp(ly, -.7, .7), col, rot }]);
    },
    update(g, s, dt) {
      for (const p of g.pieces) if (p.frost && p.frost.t < 1) p.frost.t = Math.min(1, p.frost.t + dt * 3);
      const S = s.sauce; if (S && S.st && performance.now() - S.moved > 90 && S.st.pts.length) { const q = S.st.pts[S.st.pts.length - 1], cap = g.U * .075 / S.k; q.w = Math.min(cap, q.w + dt * g.U * .05 / S.k); if (s.snd) s.snd.set(.25); }   // hold still and the blob grows
    },
    draw(g, s, c) {
      g.sceneBoard(c);
      const pl = g.plate(); drawPlate(c, pl.x, pl.y, pl.r); drawPlatePaint(g, c);
      const sl = g.slots(); g.pieces.forEach((p, i) => { const q = sl[i]; if (g.pieces.length > 1 || p.shape || !['stack', 'hotdog', 'sundae'].includes(p.type)) drawShadowDisc(c, q.x, q.y + q.r * .5, q.r * .9); drawPieceAt(c, p, q.x, q.y, q.r); });
      if (g.tool && s.canDone === false && s.acts === 0 && g.idle > 2.5) { const q = sl[0]; drawTapHint(c, q.x, q.y - q.r * .3, g.U * .1, g.t); }
    }
  };

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

  H.serve = {
    enter(g, s) {
      s.total = g.pieces.reduce((a, p) => { p.bites = []; p.gone = false; return a + bitesFor(p, g.pieces.length); }, 0); s.n = 0; g.setTray([]);
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
          if (pc.bites.length >= bitesFor(pc, g.pieces.length)) { pc.gone = true; g.fx.burst(q.x, q.y, 20, { colors: ['#ffd54a', '#ff9ec8', '#fff'], speed: 240, g: 300, life: .8, size: 6, shape: 'star' }); }
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
      const pl = g.plate(); drawPlate(c, pl.x, pl.y, pl.r); drawPlatePaint(g, c);
      g.pieces.forEach((p, i) => { if (p.gone) return; const q = sl[i], bob = (g.finishedAll ? 0 : Math.sin(g.t * 3 + i) * 3) + (g.bounce || 0) * -6; drawBittenAt(g, c, p, q.x, q.y + bob, q.r); });
      if (!s.n && !g.finishedAll) { const q = sl[0]; drawTapHint(c, q.x, q.y - q.r * .4, g.U * .1, g.t); }
    }
  };

  /* ---------------------------------------------------------------- loop, menu and drawing */
    Object.assign(CookGame.prototype, {
    start() { this.resize(); this.enterMenu(); this.resize(); this.resume(); },
    resume() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); },
    pause() { this.running = false; cancelAnimationFrame(this.raf); if (this.st && this.st.snd) { this.st.snd.off(); this.st.snd = null; } if (this.drag) { this.drag.it.drag = false; this.drag.it.back = true; this.drag = null; } this.ptr = null; this.free = false; },
    destroy() { this.pause(); this.canvas.remove(); this.counter.el.remove(); if (SPG.cookGame === this) SPG.cookGame = null; },
    // ---- little motions for adding ingredients: pour the flour, crack the egg, plop the butter
    addMotion(id, x0, y0, b, cb) {
      const s = this.U * .24, kind = ['flour', 'sugar', 'milk', 'chips'].includes(id) ? 'pour' : id === 'egg' ? 'egg' : (id === 'butter' || id === 'butterpat') ? 'drop' : 'plain';
      const m = { t: 0, id, kind, x0, y0, b, s, cb, fired: false, dur: kind === 'pour' ? 1.55 : kind === 'egg' ? 1.2 : kind === 'drop' ? .9 : .5, cbAt: kind === 'pour' ? 1.1 : kind === 'egg' ? .88 : kind === 'drop' ? .6 : .4, snd: 0, hx: kind === 'pour' ? b.x + s * .5 : b.x, hy: b.y - b.r * 1.0 - s * .15 };
      this.motions.push(m);
    },
    updateMotions(dt) {
      for (const m of this.motions) {
        const t0 = m.t; m.t += dt; const t = m.t, b = m.b, cross = x => t0 < x && t >= x;
        if (m.kind === 'pour') {
          if (cross(.45)) { sfx.shake(); if (m.id === 'milk') sfx.water(); }
          if (t > .55 && t < 1.15) {
            const mouth = this.pourMouth(m); const col = { flour: ['#fffaf0', '#f2e8d8'], sugar: ['#fff', '#ffe6f3', '#e8f4ff'], milk: ['#fff', '#eaf6ff'], chips: ['#5a3a2a', '#7a4a32'] }[m.id];
            if (Math.random() < dt * 40) this.fx.burst(mouth.x, mouth.y, 1, { colors: col, speed: 25, g: 700, life: .45, size: m.id === 'chips' ? 5 : 4, shape: 'circle' });
            if (Math.random() < dt * 14) this.fx.burst(b.x + (Math.random() - .5) * b.r * .4, b.y - b.r * .08, 1, { colors: col, speed: 70, g: 400, life: .35, size: 3, up: 60 });
            if (m.id === 'chips' && Math.floor(t * 12) !== m.snd) { m.snd = Math.floor(t * 12); sfx.tap(); }
          }
        } else if (m.kind === 'egg') {
          if (cross(.38) || cross(.46)) sfx.tap();
          if (cross(.55)) { sfx.crack(); this.fx.burst(m.hx, m.hy, 6, { colors: ['#fff6e6', '#f2e2c4'], speed: 120, g: 500, life: .5, size: 4 }); }
        } else if (m.kind === 'drop') { if (cross(.58)) sfx.pat(); }
        if (!m.fired && t >= m.cbAt) { m.fired = true; if (m.kind === 'egg' || m.kind === 'drop') this.fx.burst(b.x, b.y - b.r * .05, 10, { colors: m.kind === 'egg' ? ['#ffc83a', '#fff', '#ffe27a'] : ['#ffe27a', '#fff3b0'], speed: 140, g: 380, life: .5, size: 5, up: 80 }); m.cb && m.cb(); }
      }
      this.motions = this.motions.filter(m => m.t < m.dur);
    },
    pourState(m) {
      const t = m.t, s = m.s, a = ease(clamp(t / .35, 0, 1)), out = ease(clamp((t - 1.15) / .35, 0, 1));
      let x = lerp(m.x0, m.hx, a), y = lerp(m.y0, m.hy, a); if (t > 1.15) { x = lerp(m.hx, m.hx + s * .3, out); y = lerp(m.hy, m.hy - s * .5, out); }
      return { x, y, tilt: -ease(clamp((t - .3) / .3, 0, 1)) * 1.9 * (1 - out), alpha: 1 - out };
    },
    pourMouth(m) { const st = this.pourState(m), r = m.s * .45; return { x: st.x + Math.sin(st.tilt) * r, y: st.y - Math.cos(st.tilt) * r }; },
    drawMotion(c, m) {
      const t = m.t, s = m.s, b = m.b, id = m.id; c.save();
      if (m.kind === 'pour') {
        const st = this.pourState(m), mouth = this.pourMouth(m);
        if (t > .55 && t < 1.15) {
          const col = { flour: '#fffaf0', sugar: '#ffffff', milk: '#f4faff', chips: '#6a4430' }[id], endY = b.y - b.r * .05, k = ease(clamp((t - .55) / .12, 0, 1)) * (1 - ease(clamp((t - 1.05) / .1, 0, 1)));
          c.globalAlpha = .85 * k; c.strokeStyle = col; c.lineCap = 'round';
          if (id === 'milk') { c.lineWidth = s * .1; c.beginPath(); c.moveTo(mouth.x, mouth.y); c.quadraticCurveTo(mouth.x - s * .02, (mouth.y + endY) / 2, b.x - s * .04, endY); c.stroke(); c.strokeStyle = '#dfeffb'; c.lineWidth = s * .03; c.stroke(); }
          else { c.lineWidth = s * (id === 'chips' ? .1 : .07); c.setLineDash([s * .035, s * .09]); c.lineDashOffset = -t * s * 3; c.beginPath(); c.moveTo(mouth.x, mouth.y); c.lineTo(mouth.x + (b.x - mouth.x) * .5, endY); c.stroke(); c.setLineDash([]); }
          c.globalAlpha = 1;
        }
        c.globalAlpha = st.alpha; c.translate(st.x, st.y); c.rotate(st.tilt); (ING[id] || ING.flour)(c, s);
      } else if (m.kind === 'egg') {
        const a = ease(clamp(t / .35, 0, 1)), x = lerp(m.x0, m.hx, a), y = lerp(m.y0, m.hy, a);
        if (t < .55) { c.translate(x, y); c.rotate(t > .3 ? Math.sin(t * 60) * .12 : 0); ING.egg(c, s); if (t > .46) { c.strokeStyle = 'rgba(120,90,50,.7)'; c.lineWidth = s * .03; c.beginPath(); c.moveTo(-s * .36, 0); c.lineTo(-s * .16, -s * .05); c.lineTo(0, s * .04); c.lineTo(s * .18, -s * .04); c.lineTo(s * .36, s * .01); c.stroke(); } }
        else {
          const u = clamp((t - .55) / .45, 0, 1), fade = 1 - clamp((t - .95) / .25, 0, 1);
          for (const sg of [-1, 1]) { c.save(); c.globalAlpha = fade; c.translate(x + sg * u * s * .55, y + u * u * s * .9); c.rotate(sg * (.3 + u * 1.2)); c.beginPath(); c.rect(-s, sg < 0 ? -s : 0, s * 2, s); c.clip(); ING.egg(c, s); c.restore(); }
          const g = u * u, yy = lerp(y, b.y - b.r * .1, clamp((t - .55) / .33, 0, 1) ** 2);
          if (t < .9) { c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(x, yy, s * .24, s * .3, 0, 0, TAU); c.fill(); c.fillStyle = '#ffc83a'; c.beginPath(); c.arc(x, yy, s * .14, 0, TAU); c.fill(); shine(c, x - s * .04, yy - s * .05, s * .035, s * .02, -.6, .6); }
        }
      } else if (m.kind === 'drop') {
        const a = ease(clamp(t / .35, 0, 1)), x = lerp(m.x0, m.hx, a), y0 = lerp(m.y0, m.hy, a), f = clamp((t - .4) / .22, 0, 1), y = lerp(y0, b.y - b.r * .05, f * f), sq = f >= 1 ? 1 - clamp((t - .62) / .2, 0, 1) : 1;
        c.globalAlpha = 1 - clamp((t - .66) / .22, 0, 1); c.translate(x, y); c.rotate((1 - a) * .3); c.scale(1, 1 - (f >= 1 ? .25 * (1 - sq) : 0)); (ING[id] || ING.butter)(c, s);
      } else { const a = ease(clamp(t / .4, 0, 1)), x = lerp(m.x0, b.x, a), y = lerp(m.y0, b.y - b.r * .15, a) - Math.sin(a * Math.PI) * this.U * .1; c.translate(x, y); c.globalAlpha = 1 - clamp((t - .4) / .1, 0, 1); (ING[id] || ING.flour)(c, s * 1.1); }
      c.restore();
    },
    probe() { return { screen: this.screen, step: this.st && this.st.k, idx: this.stIdx, tray: this.tray.map(i => ({ id: i.id, x: i.x, y: i.y, used: i.used, kind: i.kind })), U: this.U, bx: this.bx, by: this.by, y1: this.y1, w: this.w, h: this.h, st: this.st && { fin: this.st.fin, canDone: this.st.canDone, state: this.st.state, i: this.st.i, units: (this.st.units || []).map(u => ({ id: u.id, x: u.x, y: u.y, state: u.state })) }, pieces: this.pieces.length, check: this.checkBtn(), menu: this.menuHit.map(m => ({ x: m.x, y: m.y, tab: m.tab, id: m.R && m.R.id })), want: this.wantIds(), tool: this.tool, flies: this.flies.length, busy: this.busy(), cuts: this.st && this.st.cuts ? this.st.cuts.length : 0, trans: !!this.trans, finishedAll: this.finishedAll, arrow: !!this.arrow, slots: this.screen === 'cook' ? this.slots() : [] }; },

    sceneBoard(c, noBoard) {
      if (noBoard) return;
      const bw = Math.min(this.w * .94, this.SH * 1.7), bh = this.SH * .98; drawBoard(c, this.bx, this.by, bw, bh);
    },
    drawPlateAndPiece(c, piece) {
      const B = H.stack.base(this), U = this.U;
      drawPlate(c, B.x, B.y + U * .02, U * .36); drawPlatePaint(this, c);
      c.save(); c.translate(B.x, B.y); drawPiece(c, piece, this.R1); c.restore();
    },
    layoutMenu() {
      const w = this.w, h = this.h; if (!w) return; this.menuHit = [];
      const compact = h < 520, short = Math.min(w, h);
      let y = compact ? 18 : 12;
      const titleH = compact ? 0 : this.narrow ? 42 : clamp(h * .075, 40, 64);
      this.titleBox = titleH ? { x: w / 2, y: y + titleH / 2, w: Math.min(w - 220, 460), h: titleH } : null;
      if (titleH) y += titleH + 12;
      if (this.narrow) y = Math.max(y, 118);   // below the stars and the counter in the corner
      const tabH = compact ? 58 : clamp(short * .15, 62, 92), tabW = clamp((w - 36 - 20) / 3, 92, 210);
      this.tabBox = { h: tabH, w: tabW, y: y + tabH / 2 };
      CATS.forEach((cat, i) => this.menuHit.push({ x: w / 2 + (i - 1) * (tabW + 10), y: y + tabH / 2, w: tabW, h: tabH, tab: i }));
      y += tabH + 14;
      const bot = h - 14, rw = w - 28, rh = bot - y, wide = rw > rh * 1.15, cols = wide ? 3 : 2, rows = wide ? 2 : 3, gap = clamp(short * .025, 8, 18);
      let cw = (rw - gap * (cols - 1)) / cols, ch = (rh - gap * (rows - 1)) / rows;
      if (cw / ch > 1.3) cw = ch * 1.3; else if (cw / ch < .8) ch = cw / .8;
      this.cardW = cw; this.cardH = ch;
      const gw = cw * cols + gap * (cols - 1), gh = ch * rows + gap * (rows - 1), gx = w / 2, gy = y + rh / 2;
      this.gridBox = { x: gx, y: gy, w: gw + 26, h: gh + 26 };
      const list = RECIPES.filter(r => r.cat === this.tab); this.cards = [];
      list.forEach((R, i) => { const cx = gx + ((i % cols) - (cols - 1) / 2) * (cw + gap), cy = gy + (Math.floor(i / cols) - (rows - 1) / 2) * (ch + gap); this.cards.push({ x: cx, y: cy, R }); this.menuHit.push({ x: cx, y: cy, w: cw, h: ch, R }); });
    },
    drawMenu(c) {
      const w = this.w, h = this.h, g = this.gridBox, cat = CAT_COL[this.tab];
      // title
      if (this.titleBox) { const T = this.titleBox; ribbon(c, T.x, T.y, T.w, T.h, '#ff7aa8', '#d94a82', T.h * .35); fitLabel(c, 'Sprout Kitchen', T.x, T.y - T.h * .02, T.w * .86, T.h * .56, { stroke: '#a82f62', oneLine: true }); }
      // the three kinds of food, as chunky tabs
      this.menuHit.forEach(m => {
        if (m.tab == null) return; const sel = m.tab === this.tab, K = CAT_COL[m.tab], bob = sel ? Math.sin(this.t * 3) * 2 : 0, k = sel ? 1.05 : .94;
        c.save(); c.translate(m.x, m.y + bob - (sel ? 4 : 0)); c.scale(k, k);
        c.fillStyle = 'rgba(70,30,20,.25)'; rr(c, -m.w / 2 + 2, -m.h / 2 + 7, m.w, m.h, m.h * .3); c.fill();
        const gr = c.createLinearGradient(0, -m.h / 2, 0, m.h / 2); gr.addColorStop(0, sel ? shade(K.main, .25) : shade(K.main, .6)); gr.addColorStop(1, sel ? K.main : shade(K.main, .35)); c.fillStyle = gr; rr(c, -m.w / 2, -m.h / 2, m.w, m.h, m.h * .3); c.fill();
        c.strokeStyle = sel ? '#fff' : K.dark; c.lineWidth = sel ? 5 : 2.5; rr(c, -m.w / 2, -m.h / 2, m.w, m.h, m.h * .3); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.3)'; rr(c, -m.w / 2 + m.h * .1, -m.h / 2 + m.h * .07, m.w - m.h * .2, m.h * .2, m.h * .1); c.fill();
        c.save(); c.globalAlpha = sel ? 1 : .85; drawSample(c, [RECIPES[2], RECIPES[8], RECIPES[12]][m.tab].sample, 0, -m.h * .13, m.w * .5, m.h * .5); c.restore();
        fitLabel(c, CATS[m.tab].name, 0, m.h * .3, m.w * .9, m.h * .26, { stroke: K.dark, fill: '#fff' });
        c.restore();
      });
      // the menu board: a checked cloth in the colour of the food
      c.save(); c.fillStyle = 'rgba(70,30,20,.25)'; rr(c, g.x - g.w / 2 + 3, g.y - g.h / 2 + 9, g.w, g.h, 30); c.fill(); gingham(c, g.x - g.w / 2, g.y - g.h / 2, g.w, g.h, 30, cat.main, Math.max(10, this.cardW * .09)); c.strokeStyle = '#fff'; c.lineWidth = 7; rr(c, g.x - g.w / 2, g.y - g.h / 2, g.w, g.h, 30); c.stroke(); c.strokeStyle = cat.dark; c.lineWidth = 2; rr(c, g.x - g.w / 2 + 6, g.y - g.h / 2 + 6, g.w - 12, g.h - 12, 26); c.stroke(); c.restore();
      for (const cd of this.cards) {
        const cw = this.cardW, ch = this.cardH, R = cd.R, done = this.bag.done[R.id] || 0, press = this.pressed === R.id ? 3 : 0;
        c.save(); c.translate(cd.x, cd.y + press);
        c.fillStyle = 'rgba(70,30,20,.22)'; rr(c, -cw / 2 + 2, -ch / 2 + 8 - press, cw, ch, cw * .12); c.fill();
        const gr = c.createLinearGradient(0, -ch / 2, 0, ch / 2); gr.addColorStop(0, '#fffefb'); gr.addColorStop(1, cat.light); c.fillStyle = gr; rr(c, -cw / 2, -ch / 2, cw, ch, cw * .12); c.fill();
        c.strokeStyle = done ? '#ffc93c' : cat.main; c.lineWidth = done ? 6 : 4; rr(c, -cw / 2, -ch / 2, cw, ch, cw * .12); c.stroke();
        // a soft plate under the dish
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(0, -ch * .08, cw * .4, ch * .27, 0, 0, TAU); c.fill(); c.strokeStyle = cat.light; c.lineWidth = 3; c.stroke();
        drawSample(c, R.sample, 0, -ch * .1, cw * .74, ch * .54);
        // the name on a little ribbon
        const rh = ch * .27, tl = rh * .3, rw = cw - 2 * tl - cw * .06; ribbon(c, 0, ch * .35, rw, rh, cat.main, cat.dark, tl); fitLabel(c, R.name, 0, ch * .35 - rh * .02, rw * .92, Math.min(rh * .5, cw * .13), { stroke: cat.dark });
        if (done) { c.save(); c.translate(cw * .38, -ch * .38); c.rotate(.2); art.star(c, 0, 0, Math.min(cw, ch) * .13, '#ffd54a', 0); fancyText(c, String(Math.min(99, done)), 0, Math.min(cw, ch) * .01, Math.min(cw, ch) * .12, { fill: '#fff', stroke: '#b9770e', outline: .3, shadow: false }); c.restore(); }
        c.restore();
      }
    },
    drawStepBar(c) {
      const R = this.R, cc = CAT_COL[R.cat], n = R.steps.length, sb = this.sb, w = this.w, left = this.narrow ? sb + 30 : 96, right = this.narrow ? w - 12 : w - 190;
      const sz = Math.min(sb * .9, (right - left) / n / 1.25), gap = sz * .28, tot = n * sz + (n - 1) * gap, x0 = this.narrow ? left + (right - left - tot) / 2 : (w - tot) / 2 + (this.narrow ? 0 : 0), y = this.topY + sb / 2;
      this.stepBarW = tot + 40;
      c.save(); c.fillStyle = 'rgba(70,30,20,.18)'; rr(c, x0 - 14 + 2, y - sb * .56 + 5, tot + 28, sb * 1.12, sb * .56); c.fill(); c.fillStyle = 'rgba(255,255,255,.78)'; rr(c, x0 - 14, y - sb * .56, tot + 28, sb * 1.12, sb * .56); c.fill(); c.strokeStyle = cc.main; c.lineWidth = 3; c.stroke(); c.restore();
      R.steps.forEach((sp, i) => {
        const cur = i === this.stIdx, done = i < this.stIdx, x = x0 + i * (sz + gap) + sz / 2, k = cur ? 1.12 + Math.sin(this.t * 4) * .04 : 1;
        c.save(); c.translate(x, y); c.scale(k, k); c.fillStyle = done ? '#bff0b0' : cur ? '#fff' : 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(0, 0, sz * .5, 0, TAU); c.fill(); c.strokeStyle = cur ? cc.main : done ? '#5cc060' : '#e0c8b0'; c.lineWidth = cur ? 4 : 2.5; c.stroke();
        c.globalAlpha = done ? .55 : cur ? 1 : .6; c.save(); c.beginPath(); c.arc(0, 0, sz * .46, 0, TAU); c.clip(); stepIcon(c, sp.k, sz * .72, sp.id || (sp.ids && sp.ids[0]) || (sp.k === 'cut' ? this.cutters[0] : null)); c.restore(); c.globalAlpha = 1;
        if (done) { c.fillStyle = '#2fae4a'; c.beginPath(); c.arc(sz * .3, sz * .3, sz * .2, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(sz * .22, sz * .3); c.lineTo(sz * .29, sz * .37); c.lineTo(sz * .4, sz * .22); c.stroke(); }
        c.restore();
      });
      // back to the menu
      const mb = this.menuBtn(); c.save(); c.translate(mb.x, mb.y); c.fillStyle = 'rgba(80,40,20,.2)'; c.beginPath(); c.arc(2, 4, mb.r, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, mb.r, 0, TAU); c.fill(); c.strokeStyle = cc.main; c.lineWidth = 3; c.stroke();
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.fillStyle = '#ff9ec8'; rr(c, dx * mb.r * .5 - mb.r * .22, dy * mb.r * .5 - mb.r * .22, mb.r * .44, mb.r * .44, mb.r * .1); c.fill(); } c.restore();
    },
    drawTray(c, dt) {
      const w = this.w, h = this.h, th = this.th, pad = 8;
      c.save(); c.fillStyle = 'rgba(80,40,20,.2)'; rr(c, pad + 3, h - th + 6, w - pad * 2, th - 8, th * .2); c.fill();
      const gr = c.createLinearGradient(0, h - th, 0, h); gr.addColorStop(0, '#fff8ee'); gr.addColorStop(1, '#fbe6d4'); c.fillStyle = gr; rr(c, pad, h - th + 2, w - pad * 2, th - 8, th * .2); c.fill(); c.strokeStyle = CAT_COL[this.R ? this.R.cat : 0].main; c.lineWidth = 4; rr(c, pad, h - th + 2, w - pad * 2, th - 8, th * .2); c.stroke(); c.restore();
      const want = this.wantIds(), glowOn = this.idle > 4.5 || (this.st && this.st.k === 'stack');
      for (const it of this.tray) {
        it.glow = lerp(it.glow, want.includes(it.id) && glowOn ? 1 : 0, Math.min(1, dt * 6)); it.wig = Math.max(0, it.wig - dt * 2.2);
        if (it.back) { it.x = lerp(it.x, it.hx, Math.min(1, dt * 14)); it.y = lerp(it.y, it.hy, Math.min(1, dt * 14)); if (Math.hypot(it.x - it.hx, it.y - it.hy) < 1.5) { it.back = false; it.x = it.hx; it.y = it.hy; } }
        else if (!it.drag && !it.fly) { it.x = lerp(it.x, it.hx, Math.min(1, dt * 9)); it.y = lerp(it.y, it.hy, Math.min(1, dt * 9)); }
        c.save(); c.translate(it.x, it.y); const lift = it.drag ? 1.25 : 1, pul = 1 + it.glow * Math.sin(this.t * 7) * .07; c.scale(lift * pul, lift * pul); c.rotate(Math.sin(this.t * 40) * it.wig * .25);
        if (it.drag) { c.fillStyle = 'rgba(80,40,20,.18)'; c.beginPath(); c.ellipse(4, it.r * .9, it.r * .8, it.r * .25, 0, 0, TAU); c.fill(); }
        if (it.glow > .01 || ((it.kind === 'tool' || it.kind === 'cutter') && this.tool === it.id)) { const sel = (it.kind === 'tool' || it.kind === 'cutter') && this.tool === it.id; c.fillStyle = sel ? 'rgba(255,107,157,.28)' : `rgba(255,224,102,${.5 * it.glow + .1})`; c.beginPath(); c.arc(0, 0, it.r * 1.12, 0, TAU); c.fill(); if (sel) { c.strokeStyle = '#ff6b9d'; c.lineWidth = 4; c.stroke(); } }
        else { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(0, 0, it.r * 1.05, 0, TAU); c.fill(); c.strokeStyle = 'rgba(224,200,176,.8)'; c.lineWidth = 2; c.stroke(); }
        if (it.used) c.globalAlpha = .25;
        const s = it.r * 1.75;
        if (it.cnt && it.cnt.total > 1) { const n = it.cnt.total, dr = Math.max(3, it.r * .1); for (let i = 0; i < n; i++) { c.fillStyle = i < it.cnt.done ? '#7ed957' : '#ffb3d1'; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc((i - (n - 1) / 2) * dr * 2.8, it.r * .88, dr, 0, TAU); c.fill(); c.stroke(); } }
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
      for (const m of this.motions) this.drawMotion(c, m);
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
      this.updateMotions(dt);
      if (this.trans) { const T = this.trans; T.t += dt / .95; if (T.t >= .5 && !T.mid) { T.mid = true; this.stIdx++; this.beginStep(); } if (T.t >= 1) this.trans = null; return; }
      if (s) {
        if (H[s.k].update) H[s.k].update(this, s, dt);
        if (s.fin && s.k !== 'serve') { s.finT -= dt; if (s.finT <= 0 && !this.busy()) this.nextStep(); }
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
      this.drawFlies(c); this.drawTray(c, dt); this.drawCheck(c); this.drawArrow(c);
      if (this.finishedAll) { const K = CAT_COL[this.R.cat], bw = Math.min(w * .8, 520), bh = clamp(h * .09, 44, 66), by = this.y0 + bh * .7; ribbon(c, w / 2, by, bw, bh, K.main, K.dark); fitLabel(c, this.R.name + '!', w / 2, by - bh * .02, bw * .85, bh * .56, { stroke: K.dark }); }
      this.fx.draw(c); this.drawTrans(c);
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
