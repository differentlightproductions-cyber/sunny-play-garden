// Pet Shop: spend the stars she has earned on a pet, give it a name, and dress it up. Nothing here costs real money.
// The pet then keeps her company in calm places like the Coloring Book.
(() => {
  const SPG = window.SPG;
  const { art, sfx, store, voice, pets: P } = SPG;
  const TAU = Math.PI * 2;
  const el = (tag, cls, ...kids) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...kids.filter(k => k != null)); return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const icon = id => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'ico'); s.innerHTML = `<use href="#i-${id}"/>`; return s; };
  const btn = (cls, label, ...kids) => { const b = el('button', cls, ...kids); b.type = 'button'; b.setAttribute('aria-label', label); return b; };
  // Act on a finished tap that began on this very button (so the tap that opened a sheet can never press its buttons).
  const tap = (b, fn, guard) => {
    let t = -1e9;
    b.addEventListener('pointerdown', () => { t = performance.now(); });
    b.addEventListener('click', e => { if ((e.detail === 0 || performance.now() - t < 1500) && performance.now() - (guard ? guard() : 0) > 350) { t = -1e9; fn(e); } });
  };
  const price = n => el('span', 'ps-price', icon('star'), el('b', '', String(n)));

  class PetShop {
    constructor(host) {
      this.host = host; this.root = el('div', 'ps'); host.append(this.root);
      this.fx = new art.Fx(); this.t = 0; this.hop = 0; this.cheer = 0; this.running = false; this.sheet = null; this.opened = 0;
      this.build(); this.render();
    }
    start() { this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick = this.tick.bind(this)); }
    pause() { this.running = false; cancelAnimationFrame(this.raf); }
    resume() { if (!this.running) this.start(); }
    resize() { this.paintRoom(); this.paintCards(); }
    destroy() { this.pause(); this.root.remove(); }
    back() { if (this.sheet) { this.closeSheet(); return true; } return false; }

    /* -------------------------------------------------------------- layout */
    build() {
      this.roomCv = el('canvas', 'ps-pet');
      this.nameEl = el('b', 'ps-nameText');
      this.pencil = btn('ps-pencil', 'Change name', icon('pencil')); tap(this.pencil, () => this.askName(P.active().id, false));
      this.nameRow = el('div', 'ps-name', this.nameEl, this.pencil);
      this.hatRow = el('div', 'ps-hatrow');
      this.hint = el('p', 'ps-hint');
      this.room = el('section', 'ps-room', this.roomCv, this.nameRow, this.hatRow, this.hint);
      this.shelf = el('section', 'ps-shelf'); this.shelf.setAttribute('data-scroll', '');
      this.root.append(this.room, this.shelf);
      this.roomCv.addEventListener('pointerdown', e => {
        e.preventDefault(); const a = P.active(); if (!a) { sfx.oops(); return; }
        this.hop = 1; P.noise(a.id); const r = this.roomCv.getBoundingClientRect();
        this.fx.burst(e.clientX - r.left, e.clientY - r.top - 20, 6, { colors: ['#ff7a8a', '#ff9db8'], speed: 110, g: -60, life: 1, size: 8, shape: 'heart' });
      });
    }
    render() {
      const a = P.active();
      this.nameEl.textContent = a ? a.name : '';
      this.nameRow.classList.toggle('hidden', !a);
      this.hint.textContent = a ? '' : 'Pick a friend from the shelf to take home!';
      // hats she owns
      this.hatRow.replaceChildren();
      const own = P.HATS.filter(h => P.ownsHat(h.id));
      if (a && own.length) {
        const none = btn('ps-hatbtn' + (a.hat ? '' : ' on'), 'No hat', icon('x')); tap(none, () => { P.wear(null); sfx.tap(); this.render(); });
        this.hatRow.append(none);
        for (const h of own) {
          const cv = el('canvas'), b = btn('ps-hatbtn' + (a.hat === h.id ? ' on' : ''), h.name, cv); b._hat = h.id; b._cv = cv;
          tap(b, () => { P.wear(h.id); sfx.pop(); this.hop = 1; this.render(); });
          this.hatRow.append(b);
        }
      }
      // shelf
      this.shelf.replaceChildren(el('h3', '', 'Friends'), this.grid(P.PETS, 'pet'), el('h3', '', 'Hats'), this.grid(P.HATS, 'hat'));
      requestAnimationFrame(() => { this.paintRoom(); this.paintCards(); });
    }
    grid(list, type) {
      const g = el('div', 'ps-grid'), a = P.active();
      for (const item of list) {
        const owned = type === 'pet' ? P.owns(item.id) : P.ownsHat(item.id), cant = !owned && !P.canAfford(item.price);
        const cv = el('canvas');
        const b = btn(`ps-card${owned ? ' owned' : ''}${cant ? ' cant' : ''}${type === 'pet' && a && a.id === item.id ? ' active' : ''}${type === 'hat' && a && a.hat === item.id ? ' active' : ''}`,
          owned ? item.name : `${item.name}, ${item.price} stars`, cv, el('span', 'ps-label', owned && type === 'pet' ? P.nameOf(item.id) : item.name), owned ? el('span', 'ps-own', icon('check')) : price(item.price));
        b._cv = cv; b._item = item; b._type = type;
        tap(b, () => this.tapCard(item, type, b));
        g.append(b);
      }
      return g;
    }
    paintCards() {
      const dpr = SPG.ui.dpr();
      for (const b of this.root.querySelectorAll('.ps-card')) {
        const cv = b._cv, w = cv.clientWidth; if (!w) continue;
        cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr * .9);
        const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (b._type === 'pet') { c.translate(w / 2, w * .86); P.draw(c, b._item.id, w * .78, 1.3, { hat: null }); }
        else { const base = (P.active() || { id: 'bunny' }).id; c.translate(w / 2, w * .58); P.drawHead(c, base, w * .27, b._item.id); }
      }
      for (const b of this.hatRow.querySelectorAll('button')) {
        if (!b._cv) continue; const w = b._cv.clientWidth; if (!w) continue; const dpr2 = SPG.ui.dpr();
        b._cv.width = b._cv.height = Math.round(w * dpr2); const c = b._cv.getContext('2d'); c.setTransform(dpr2, 0, 0, dpr2, 0, 0);
        c.translate(w / 2, w * .58); P.drawHead(c, (P.active() || { id: 'bunny' }).id, w * .27, b._hat);
      }
    }
    paintRoom() {
      const cv = this.roomCv, r = cv.getBoundingClientRect(); if (!r.width) return;
      const dpr = SPG.ui.dpr(); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); this.rw = r.width; this.rh = r.height;
      this.drawRoom();
    }
    drawRoom() {
      const cv = this.roomCv; if (!this.rw) return;
      const c = cv.getContext('2d'), dpr = cv.width / this.rw, w = this.rw, h = this.rh;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      // a cosy rug
      c.fillStyle = 'rgba(255, 190, 210, .55)'; c.beginPath(); c.ellipse(w / 2, h * .9, w * .42, h * .085, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255, 255, 255, .6)'; c.beginPath(); c.ellipse(w / 2, h * .9, w * .34, h * .06, 0, 0, TAU); c.fill();
      const a = P.active();
      if (a) {
        c.save(); c.translate(w / 2, h * .9); P.draw(c, a.id, Math.min(w * .78, h * .9), this.t, { hat: a.hat, mood: this.cheer > 0 ? 'cheer' : 'happy', hop: this.hop > 0 ? 1 - this.hop : 0 }); c.restore();
      } else {
        c.font = `${Math.min(w, h) * .45}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('\u{1F9FA}', w / 2, h * .62);
      }
      this.fx.draw(c);
    }
    tick(now) {
      if (!this.running) return;
      this.raf = requestAnimationFrame(this.tick);
      const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt;
      if (this.hop > 0) this.hop = Math.max(0, this.hop - dt * 2.2);
      if (this.cheer > 0) this.cheer = Math.max(0, this.cheer - dt);
      this.fx.update(dt); this.drawRoom();
    }

    /* -------------------------------------------------------------- shopping */
    say(text) { this.hint.textContent = text; clearTimeout(this.hintT); this.hintT = setTimeout(() => { if (this.hint.textContent === text) this.hint.textContent = P.active() ? '' : 'Pick a friend from the shelf to take home!'; }, 3500); }
    nope(b, text) { sfx.oops(); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); if (text) this.say(text); }
    tapCard(item, type, b) {
      const a = P.active();
      if (type === 'pet') {
        if (P.owns(item.id)) { P.setActive(item.id); sfx.pop(); this.hop = 1; this.render(); return; }
        if (!P.canAfford(item.price)) return this.nope(b, `${item.name} costs ${item.price} stars. Keep playing to collect more!`);
        this.confirm(item, 'pet');
      } else {
        if (!a) return this.nope(b, 'Take a friend home first, then pick a hat!');
        if (P.ownsHat(item.id)) { P.wear(a.hat === item.id ? null : item.id); sfx.pop(); this.hop = 1; this.render(); return; }
        if (!P.canAfford(item.price)) return this.nope(b, `${item.name} costs ${item.price} stars. Keep playing to collect more!`);
        this.confirm(item, 'hat');
      }
    }
    openSheet(...kids) {
      this.closeSheet();
      const sheet = el('div', 'sheet ps-sheet', ...kids), ov = el('div', 'ps-overlay', sheet);
      this.root.append(ov); this.sheet = ov; this.opened = performance.now(); return sheet;
    }
    closeSheet() { if (this.sheet) { this.sheet.remove(); this.sheet = null; } }
    preview(item, type) {
      const cv = el('canvas', 'ps-prev'); cv.width = cv.height = 260;
      const c = cv.getContext('2d');
      if (type === 'pet') { c.translate(130, 235); P.draw(c, item.id, 230, 1.3, {}); }
      else { c.translate(130, 165); P.drawHead(c, (P.active() || { id: 'bunny' }).id, 84, item.id); }
      return cv;
    }
    confirm(item, type) {
      const yes = btn('btn go ps-yn', 'Yes', icon('check')), no = btn('btn quiet ps-yn', 'No', icon('x'));
      const guard = () => this.opened;
      tap(no, () => { sfx.tap(); this.closeSheet(); }, guard);
      tap(yes, () => {
        this.closeSheet();
        if (type === 'pet') { if (P.adopt(item.id)) { sfx.win(); this.askName(item.id, true); } }
        else if (P.buyHat(item.id)) { P.wear(item.id); sfx.chime(); this.celebrate(); this.render(); }
      }, guard);
      this.openSheet(this.preview(item, type), el('h2', '', type === 'pet' ? `Take ${item.name} home?` : `Get the ${item.name.toLowerCase()}?`), el('div', 'ps-cost', price(item.price)), el('div', 'row', no, yes));
    }
    // Names are picked from a list (touching one says it out loud). Typing needs the keyboard, so it sits behind the grown-up gate.
    askName(id, first) {
      const cur = first ? '' : P.nameOf(id), input = el('input');
      input.type = 'text'; input.maxLength = 12; input.autocomplete = 'off'; input.setAttribute('autocapitalize', 'words'); input.spellcheck = false; input.placeholder = 'Name'; input.value = '';
      const field = el('label', 'field hidden', input);
      const grid = SPG.ui.nameGrid(P.NAMES, () => { input.value = ''; });
      if (cur && P.NAMES.includes(cur)) grid.pick(cur, false);
      const dice = btn('btn quiet ps-dice', 'Pick a name for me', icon('dice')); tap(dice, () => { grid.pick(P.randomName(), true); grid.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' }); });
      const kb = btn('btn quiet ps-dice', 'Grown-up: type a name', icon('lock'), icon('keyboard'));
      tap(kb, () => SPG.app.askGate(() => { kb.classList.add('hidden'); field.classList.remove('hidden'); grid.clear(); input.value = cur && !P.NAMES.includes(cur) ? cur : ''; setTimeout(() => input.focus(), 120); }), () => this.opened);
      const ok = btn('btn go ps-yn', 'Done', icon('check')); const guard = () => this.opened;
      tap(ok, () => {
        const name = input.value.trim() || grid.value || cur || P.randomName();
        P.rename(id, name); this.closeSheet(); this.render();
        if (first) { this.celebrate(); voice.say('welcome-home', voice.LINES['name/' + name] ? 'name/' + name : { say: name }); }
      }, guard);
      this.openSheet(this.preview({ id }, 'pet'), el('h2', '', first ? 'What is your friend called?' : 'New name'), grid, el('div', 'row', dice, kb), field, el('div', 'row', ok));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') ok.click(); });
    }
    celebrate() {
      this.cheer = 2.4; this.hop = 1;
      const w = this.rw || 300, h = this.rh || 300;
      this.fx.burst(w / 2, h * .45, 30, { colors: ['#ff7a8a', '#ffd54a', '#59b96e', '#4fb3e8', '#9a7be8'], speed: 320, g: 420, life: 1.3, size: 8, shape: 'confetti', up: 200 });
      this.fx.burst(w / 2, h * .4, 10, { colors: ['#ff9db8', '#ff7a8a'], speed: 140, g: -40, life: 1.4, size: 10, shape: 'heart' });
    }
  }

  // The shop front: striped awning, a window with pets on show, a door, and a paw sign board (text is added by the page).
  function cardIcon(c, w, h) {
    const wall = c.createLinearGradient(0, 0, 0, h); wall.addColorStop(0, '#fff3e4'); wall.addColorStop(1, '#ffe2c4');
    c.fillStyle = wall; art.rr(c, 0, 0, w, h, Math.min(26, h * .3)); c.fill();
    // brick hints
    c.strokeStyle = 'rgba(200,150,110,.22)'; c.lineWidth = 2;
    for (let y = h * .42; y < h; y += h * .16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    // awning
    const ah = h * .34, n = Math.max(8, Math.round(w / (h * .5)) * 2);
    c.save(); art.rr(c, 0, 0, w, h, Math.min(26, h * .3)); c.clip();
    for (let i = 0; i < n; i++) {
      const x0 = i * w / n, x1 = (i + 1) * w / n;
      c.fillStyle = i % 2 ? '#ffffff' : '#ff8fb0'; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x1, 0); c.lineTo(x1, ah); c.arc((x0 + x1) / 2, ah, (x1 - x0) / 2, 0, Math.PI); c.closePath(); c.fill();
    }
    c.restore();
    c.fillStyle = 'rgba(90,63,94,.12)'; c.fillRect(0, ah + (w / n) / 2, w, 5);
    // window with pets on show
    const ww = Math.min(w * .3, h * 2.1), wx = w * .05, wy = ah + h * .1, wh = h - wy - h * .06;
    c.fillStyle = '#c99a6a'; art.rr(c, wx - 5, wy - 5, ww + 10, wh + 10, 14); c.fill();
    c.fillStyle = '#cdeefc'; art.rr(c, wx, wy, ww, wh, 10); c.fill();
    c.save(); art.rr(c, wx, wy, ww, wh, 10); c.clip();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(wx + ww * .1, wy + wh); c.lineTo(wx + ww * .35, wy); c.lineTo(wx + ww * .45, wy); c.lineTo(wx + ww * .2, wy + wh); c.fill();
    c.fillStyle = '#e6b988'; c.fillRect(wx, wy + wh * .86, ww, wh * .14);
    [['cat', .3, 'party'], ['bunny', .68, 'bow']].forEach(([id, x, hatId]) => { c.save(); c.translate(wx + ww * x, wy + wh * .9); P.draw(c, id, wh * 1.22, 1.3, { hat: hatId }); c.restore(); });
    c.restore();
    // door
    const dw = Math.min(h * .78, w * .11), dx = w - w * .05 - dw, dy = ah + h * .1;
    c.fillStyle = '#a8744f'; art.rr(c, dx, dy, dw, h - dy, dw * .5); c.fill();
    c.fillStyle = '#ffe9b0'; c.beginPath(); c.arc(dx + dw / 2, dy + dw * .48, dw * .22, 0, TAU); c.fill(); art.star(c, dx + dw / 2, dy + dw * .48, dw * .16, '#ffb52e');
    c.fillStyle = '#ffd54a'; c.beginPath(); c.arc(dx + dw * .78, h - (h - dy) * .42, dw * .06, 0, TAU); c.fill();
    // a little OPEN sign and some paw prints on the mat
    c.save(); c.translate(dx - h * .5, dy + h * .1); c.rotate(-.06);
    c.fillStyle = '#fff'; art.rr(c, 0, 0, h * .62, h * .26, 8); c.fill(); c.fillStyle = '#59b96e'; c.font = `700 ${h * .16}px Fredoka, system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('OPEN', h * .31, h * .14); c.restore();
    // hanging pets in the middle: a star price tag
    c.save(); c.translate(w * .5, h * .78); c.fillStyle = 'rgba(255,255,255,.0)'; c.restore();
  }

  SPG.games.push({ id: 'pets', name: 'Pet Shop', order: 6, dom: true, shop: true, icon: cardIcon, create: host => new PetShop(host) });
})();
