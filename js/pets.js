// Pets: the friends a child can take home from the Pet Shop with stars (no purchases, ever), name, dress up,
// and who then keep her company in calm places like the Coloring Book.
//
// Saved per player in store.bag('pets'):
//   { v: 1, owned: { bunny: { name: 'Biscuit', hat: 'bow' } }, hats: { bow: true }, active: 'bunny' }
(() => {
  const SPG = window.SPG;
  const { art, sfx, store } = SPG;
  const TAU = Math.PI * 2;

  const SPECIES = {
    bunny: { body: '#fff', belly: '#ffe3ec', limb: '#fff', tail: 'puff', tailCol: '#fff', sound: 'bunny' },
    cat: { body: '#ffb45e', belly: '#fff2df', limb: '#ffb45e', tail: 'long', tailCol: '#ffa042', sound: 'cat' },
    bear: { body: '#c98b5b', belly: '#f3c9a0', limb: '#c98b5b', tail: 'puff', tailCol: '#b87a4b', sound: 'hedgehog' },
    fox: { body: '#ff8a4c', belly: '#fff', limb: '#5a3f5e', tail: 'bushy', tailCol: '#ff8a4c', sound: 'dog' },
    frog: { body: '#84d96a', belly: '#e4f7c5', limb: '#6cc455', tail: null, sound: 'frog' },
    panda: { body: '#fff', belly: '#fff', limb: '#3d2c44', tail: 'puff', tailCol: '#fff', sound: 'hedgehog' },
    dog: { body: '#d9a26c', belly: '#fff2df', limb: '#a8744f', tail: 'long', tailCol: '#c98b5b', sound: 'dog' },
    hamster: { body: '#f4c98f', belly: '#fff', limb: '#f4c98f', tail: null, sound: 'mouse' },
    duck: { body: '#ffe066', belly: '#fff3b0', limb: '#ffe066', feet: '#ff9d3d', tail: 'puff', tailCol: '#ffe066', sound: 'duckling', smooth: true },
    pig: { body: '#ffb3c6', belly: '#ffd5e0', limb: '#ff9db5', tail: 'curl', tailCol: '#ff9db5', sound: 'hedgehog' },
    lamb: { body: '#fdfdfd', belly: '#fff', limb: '#5a4a4a', tail: 'puff', tailCol: '#fff', sound: 'bunny' },
    penguin: { body: '#3d2c44', belly: '#fff', limb: '#3d2c44', feet: '#ff9d3d', tail: null, sound: 'bird', smooth: true },
    mouse: { body: '#c9c5d3', belly: '#fff', limb: '#c9c5d3', tail: 'long', tailCol: '#ffb3c6', sound: 'mouse' },
    unicorn: { body: '#fff', belly: '#fff0fa', limb: '#fff', tail: 'bushy', tailCol: '#ff9fd0', sound: 'cat' },
    elephant: { body: '#b8c4d6', belly: '#dbe3ef', limb: '#a4b2c8', tail: 'long', tailCol: '#a4b2c8', sound: 'hedgehog' },
    owl: { body: '#b98a5a', belly: '#f3d9b0', limb: '#8a6440', feet: '#ff9d3d', tail: null, sound: 'bird', smooth: true }
  };
  // Prices are in stars earned by playing. The first friends are cheap.
  const PETS = [
    { id: 'bunny', name: 'Bunny', price: 10 }, { id: 'cat', name: 'Kitten', price: 10 }, { id: 'bear', name: 'Bear cub', price: 15 },
    { id: 'fox', name: 'Fox pup', price: 20 }, { id: 'frog', name: 'Froggy', price: 25 }, { id: 'panda', name: 'Panda cub', price: 30 },
    { id: 'dog', name: 'Puppy', price: 12 }, { id: 'hamster', name: 'Hamster', price: 10 }, { id: 'duck', name: 'Duckling', price: 12 }, { id: 'pig', name: 'Piglet', price: 15 },
    { id: 'lamb', name: 'Lamb', price: 18 }, { id: 'mouse', name: 'Mouse', price: 10 }, { id: 'penguin', name: 'Penguin', price: 25 }, { id: 'owl', name: 'Owl', price: 28 },
    { id: 'elephant', name: 'Elephant', price: 35 }, { id: 'unicorn', name: 'Unicorn', price: 40 }
  ];
  const HATS = [
    { id: 'bow', name: 'Bow', price: 5 }, { id: 'flowers', name: 'Flower crown', price: 8 }, { id: 'party', name: 'Party hat', price: 8 },
    { id: 'witch', name: 'Witch hat', price: 10 }, { id: 'leaves', name: 'Fall leaves', price: 10 }, { id: 'santa', name: 'Santa hat', price: 10 },
    { id: 'antlers', name: 'Reindeer antlers', price: 10 }, { id: 'crown', name: 'Crown', price: 20 },
    { id: 'tiara', name: 'Tiara', price: 15 }, { id: 'beanie', name: 'Woolly hat', price: 8 }, { id: 'cap', name: 'Cap', price: 8 }, { id: 'wizard', name: 'Wizard hat', price: 12 },
    { id: 'pirate', name: 'Pirate hat', price: 12 }, { id: 'chef', name: 'Chef hat', price: 10 }, { id: 'sun', name: 'Sun hat', price: 10 }, { id: 'beret', name: 'Beret', price: 8 }, { id: 'halo', name: 'Halo', price: 15 },
    { id: 'glasses', name: 'Glasses', price: 8, slot: 'face' }, { id: 'shades', name: 'Sunglasses', price: 10, slot: 'face' }, { id: 'hearts', name: 'Heart glasses', price: 12, slot: 'face' },
    { id: 'stars', name: 'Star glasses', price: 12, slot: 'face' }, { id: 'clown', name: 'Red nose', price: 6, slot: 'face' },
    { id: 'bowtie', name: 'Bow tie', price: 6, slot: 'neck' }, { id: 'scarf', name: 'Scarf', price: 8, slot: 'neck' }, { id: 'bell', name: 'Bell collar', price: 6, slot: 'neck' },
    { id: 'pearls', name: 'Pearls', price: 12, slot: 'neck' }, { id: 'medal', name: 'Gold medal', price: 10, slot: 'neck' }, { id: 'lei', name: 'Flower necklace', price: 10, slot: 'neck' }
  ];
  for (const h of HATS) if (!h.slot) h.slot = 'head';
  const SLOTS = ['head', 'face', 'neck'];
  const NAMES = SPG.voice.PICK_NAMES.pets;

  /* ------------------------------------------------------------ saved state */
  const bag = () => store.bag('pets', () => ({ v: 1, owned: {}, hats: {}, active: null }));
  const info = id => PETS.find(p => p.id === id);
  const api = {
    PETS, HATS, NAMES, SPECIES,
    petInfo: info, hatInfo: id => HATS.find(h => h.id === id),
    owns: id => !!bag().owned[id],
    nameOf: id => (bag().owned[id] && bag().owned[id].name) || (info(id) || {}).name || '',
    ownsHat: id => !!bag().hats[id],
    SLOTS,
    active() { const b = bag(), id = b.active; if (!id || !b.owned[id]) return null; const o = b.owned[id]; return { id, name: o.name || info(id).name, hat: o.hat || null, face: o.face || null, neck: o.neck || null }; },
    // What a pet is wearing, in the form the draw functions take.
    outfit: (a, keys) => a ? { hat: a.hat || null, face: a.face || null, neck: a.neck || null } : { hat: null, face: null, neck: null },
    setActive(id) { const b = bag(); if (b.owned[id]) { b.active = id; store.save(); } },
    canAfford: price => store.active && store.active.stars >= price,
    adopt(id) {
      const b = bag(), p = info(id);
      if (!p || b.owned[id] || !api.canAfford(p.price)) return false;
      store.addStars(-p.price); b.owned[id] = { name: '', hat: null }; b.active = id; store.save(); return true;
    },
    buyHat(id) {
      const b = bag(), h = api.hatInfo(id);
      if (!h || b.hats[id] || !api.canAfford(h.price)) return false;
      store.addStars(-h.price); b.hats[id] = true; store.save(); return true;
    },
    // Wear an accessory she owns (it goes in its own slot: head, face or neck). wear(null) takes the hat off; unwear(slot) clears one slot.
    wear(itemId) { const b = bag(); if (!b.active || !b.owned[b.active]) return; if (!itemId) { b.owned[b.active].hat = null; store.save(); return; } const h = api.hatInfo(itemId); if (!h || !b.hats[itemId]) return; b.owned[b.active][h.slot === 'head' ? 'hat' : h.slot] = itemId; store.save(); },
    unwear(slot) { const b = bag(); if (b.active && b.owned[b.active]) { b.owned[b.active][slot === 'head' ? 'hat' : slot] = null; store.save(); } },
    rename(id, name) { const b = bag(); if (b.owned[id]) { b.owned[id].name = String(name || '').trim().slice(0, 12); store.save(); } },
    randomName() { return NAMES[Math.floor(Math.random() * NAMES.length)]; },
    noise(id) { const sp = SPECIES[id]; if (sp) sfx.critter(sp.sound, 3); }
  };

  /* ------------------------------------------------------------ drawing */
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); };

  // Hats sit on a head of radius R centered at (0, 0).
  function hat(c, id, R) {
    c.save(); c.lineJoin = c.lineCap = 'round';
    if (id === 'bow') {
      c.translate(R * .55, -R * .9); c.rotate(.35);
      c.fillStyle = '#ff7aa2'; ell(c, -R * .3, 0, R * .3, R * .18, -.4); c.fill(); ell(c, R * .3, 0, R * .3, R * .18, .4); c.fill();
      c.fillStyle = '#ff5c8a'; ell(c, 0, 0, R * .11, R * .11); c.fill();
    } else if (id === 'flowers') {
      const cols = ['#ff9db8', '#fff', '#ffd54a', '#ff9db8', '#fff', '#ffd54a', '#ff9db8'];
      for (let i = 0; i < 7; i++) {
        const a = (-165 + i * 25) * Math.PI / 180, x = Math.cos(a) * R * 1.02, y = Math.sin(a) * R * 1.0;
        c.fillStyle = '#7ed957'; ell(c, x + Math.cos(a) * R * .1, y + Math.sin(a) * R * .1, R * .1, R * .06, a); c.fill();
        c.fillStyle = cols[i]; for (let k = 0; k < 5; k++) { ell(c, x + Math.cos(k * TAU / 5) * R * .09, y + Math.sin(k * TAU / 5) * R * .09, R * .07, R * .07); c.fill(); }
        c.fillStyle = '#ffd54a'; ell(c, x, y, R * .05, R * .05); c.fill();
      }
    } else if (id === 'party') {
      c.translate(-R * .1, -R * .92); c.rotate(-.18);
      c.fillStyle = '#7fd4f5'; c.beginPath(); c.moveTo(-R * .45, 0); c.lineTo(0, -R * 1.05); c.lineTo(R * .45, 0); c.closePath(); c.fill();
      c.save(); c.clip(); c.strokeStyle = '#ff9db8'; c.lineWidth = R * .13; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-R * .6 + k * R * .3, R * .1); c.lineTo(R * .1 + k * R * .3, -R * 1.1); c.stroke(); } c.restore();
      c.fillStyle = '#ffd54a'; ell(c, 0, -R * 1.08, R * .13, R * .13); c.fill();
    } else if (id === 'crown') {
      c.translate(0, -R * .9);
      c.fillStyle = '#ffd54a'; c.strokeStyle = '#e0a01e'; c.lineWidth = R * .07;
      c.beginPath(); c.moveTo(-R * .55, 0); c.lineTo(-R * .58, -R * .55); c.lineTo(-R * .28, -R * .28); c.lineTo(0, -R * .7); c.lineTo(R * .28, -R * .28); c.lineTo(R * .58, -R * .55); c.lineTo(R * .55, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ff6b81'; ell(c, 0, -R * .22, R * .08, R * .08); c.fill(); c.fillStyle = '#4f8fe8'; ell(c, -R * .33, -R * .1, R * .06, R * .06); c.fill(); ell(c, R * .33, -R * .1, R * .06, R * .06); c.fill();
    } else if (id === 'witch') {
      c.translate(0, -R * .9);
      c.fillStyle = '#5a3f7e'; ell(c, 0, 0, R * 1.02, R * .2); c.fill();
      c.fillStyle = '#6b4a99'; c.beginPath(); c.moveTo(-R * .55, 0); c.quadraticCurveTo(-R * .2, -R * .6, R * .2, -R * 1.5); c.quadraticCurveTo(R * .3, -R * 1.2, R * .28, -R * 1.05); c.quadraticCurveTo(R * .55, -R * .5, R * .55, 0); c.closePath(); c.fill();
      c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(-R * .53, -R * .06); c.lineTo(R * .53, -R * .06); c.lineTo(R * .5, -R * .3); c.lineTo(-R * .48, -R * .3); c.closePath(); c.fill();
    } else if (id === 'leaves') {
      const cols = ['#ff8a3d', '#e0492f', '#ffb52e', '#ff8a3d', '#e0492f', '#ffb52e', '#ff8a3d'];
      for (let i = 0; i < 7; i++) {
        const a = (-165 + i * 25) * Math.PI / 180;
        c.save(); c.translate(Math.cos(a) * R * 1.0, Math.sin(a) * R * .98); c.rotate(a + Math.PI / 2);
        c.fillStyle = cols[i]; c.beginPath(); c.moveTo(0, R * .12); c.quadraticCurveTo(R * .24, -R * .05, 0, -R * .3); c.quadraticCurveTo(-R * .24, -R * .05, 0, R * .12); c.fill(); c.restore();
      }
    } else if (id === 'santa') {
      c.translate(0, -R * .9); c.rotate(-.1);
      c.fillStyle = '#e8434f'; c.beginPath(); c.moveTo(-R * .7, 0); c.quadraticCurveTo(-R * .6, -R * 1.1, R * .5, -R * 1.05); c.quadraticCurveTo(R * .9, -R * .95, R * .95, -R * .5); c.lineTo(R * .7, 0); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect ? c.roundRect(-R * .82, -R * .12, R * 1.64, R * .3, R * .15) : c.rect(-R * .82, -R * .12, R * 1.64, R * .3); c.fill();
      c.fillStyle = '#fff'; ell(c, R * .95, -R * .5, R * .17, R * .17); c.fill();
    } else if (id === 'tiara') {
      c.translate(0, -R * .9); c.strokeStyle = '#d8dce8'; c.lineWidth = R * .07; c.beginPath(); c.arc(0, R * .8, R * .95, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
      c.fillStyle = '#eef0f8'; c.beginPath(); c.moveTo(-R * .22, -R * .05); c.lineTo(0, -R * .5); c.lineTo(R * .22, -R * .05); c.closePath(); c.fill(); c.fillStyle = '#ff9fc8'; ell(c, 0, -R * .18, R * .07, R * .07); c.fill();
    } else if (id === 'beanie') {
      c.translate(0, -R * .78); c.fillStyle = '#4f8fe8'; c.beginPath(); c.moveTo(-R * .85, 0); c.bezierCurveTo(-R * .9, -R * 1.05, R * .9, -R * 1.05, R * .85, 0); c.closePath(); c.fill();
      c.fillStyle = '#3a6fc0'; c.beginPath(); c.roundRect ? c.roundRect(-R * .9, -R * .2, R * 1.8, R * .26, R * .1) : c.rect(-R * .9, -R * .2, R * 1.8, R * .26); c.fill(); c.fillStyle = '#fff'; ell(c, 0, -R * .98, R * .19, R * .19); c.fill();
    } else if (id === 'cap') {
      c.translate(0, -R * .72); c.fillStyle = '#ff6b6b'; c.beginPath(); c.moveTo(-R * .82, 0); c.bezierCurveTo(-R * .9, -R * .95, R * .9, -R * .95, R * .82, 0); c.closePath(); c.fill();
      c.fillStyle = '#d94a4a'; c.beginPath(); c.moveTo(R * .1, -R * .1); c.quadraticCurveTo(R * 1.2, -R * .18, R * 1.28, R * .1); c.quadraticCurveTo(R * .6, 0, R * .05, R * .04); c.closePath(); c.fill(); c.fillStyle = '#fff'; ell(c, 0, -R * .84, R * .07, R * .07); c.fill();
    } else if (id === 'wizard') {
      c.translate(0, -R * .82); c.fillStyle = '#6b4a99'; ell(c, 0, 0, R * 1.05, R * .2); c.fill(); c.beginPath(); c.moveTo(-R * .6, 0); c.quadraticCurveTo(-R * .1, -R * .7, R * .3, -R * 1.6); c.quadraticCurveTo(R * .4, -R * .7, R * .6, 0); c.closePath(); c.fill();
      art.star(c, R * .05, -R * .6, R * .16, '#ffe066', 0); art.star(c, R * .22, -R * .3, R * .09, '#fff', 0);
    } else if (id === 'pirate') {
      c.translate(0, -R * .78); c.fillStyle = '#3a3050'; c.beginPath(); c.moveTo(-R * 1.15, R * .05); c.quadraticCurveTo(-R * .4, -R * 1.2, 0, -R * .95); c.quadraticCurveTo(R * .4, -R * 1.2, R * 1.15, R * .05); c.quadraticCurveTo(0, -R * .3, -R * 1.15, R * .05); c.fill();
      c.fillStyle = '#fff'; ell(c, 0, -R * .5, R * .12, R * .12); c.fill(); c.fillRect(-R * .16, -R * .3, R * .32, R * .06);
    } else if (id === 'chef') {
      c.translate(0, -R * .85); c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = R * .03; for (const [x, y, r] of [[-R * .38, -R * .45, R * .36], [R * .38, -R * .45, R * .36], [0, -R * .6, R * .4]]) { ell(c, x, y, r, r); c.fill(); c.stroke(); }
      c.beginPath(); c.roundRect ? c.roundRect(-R * .62, -R * .45, R * 1.24, R * .5, R * .05) : c.rect(-R * .62, -R * .45, R * 1.24, R * .5); c.fill();
    } else if (id === 'sun') {
      c.translate(0, -R * .72); c.fillStyle = '#f5deb0'; ell(c, 0, 0, R * 1.35, R * .3); c.fill(); c.beginPath(); c.moveTo(-R * .6, 0); c.quadraticCurveTo(-R * .6, -R * .9, 0, -R * .85); c.quadraticCurveTo(R * .6, -R * .9, R * .6, 0); c.closePath(); c.fill(); c.fillStyle = '#ff7aa2'; c.fillRect(-R * .62, -R * .3, R * 1.24, R * .16);
    } else if (id === 'beret') {
      c.translate(0, -R * .8); c.rotate(-.15); c.fillStyle = '#d94a4a'; ell(c, 0, 0, R * .9, R * .4); c.fill(); ell(c, 0, -R * .4, R * .06, R * .06); c.fill();
    } else if (id === 'halo') {
      c.translate(0, -R * 1.15); c.strokeStyle = '#ffd54a'; c.lineWidth = R * .13; ell(c, 0, 0, R * .5, R * .15); c.stroke(); c.strokeStyle = 'rgba(255,240,150,.5)'; c.lineWidth = R * .3; ell(c, 0, 0, R * .5, R * .15); c.stroke();
    } else if (id === 'antlers') {
      c.strokeStyle = '#a8744f'; c.lineWidth = R * .13;
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(s * R * .4, -R * .9); c.quadraticCurveTo(s * R * .55, -R * 1.25, s * R * .8, -R * 1.5); c.moveTo(s * R * .58, -R * 1.15); c.lineTo(s * R * .3, -R * 1.35); c.moveTo(s * R * .72, -R * 1.38); c.lineTo(s * R * 1.0, -R * 1.3); c.stroke();
      }
    }
    c.restore();
  }

  // Glasses and noses sit on the face (head circle of radius R, eyes at about +-.31R, -.05R).
  function faceAcc(c, id, R) {
    c.save(); c.lineJoin = c.lineCap = 'round';
    const ex = R * .31, ey = -R * .05;
    if (id === 'glasses') { c.strokeStyle = '#3a2f40'; c.lineWidth = R * .06; for (const s of [-1, 1]) { c.fillStyle = 'rgba(210,235,255,.3)'; ell(c, s * ex, ey, R * .26, R * .26); c.fill(); c.stroke(); } c.beginPath(); c.moveTo(-R * .05, ey); c.lineTo(R * .05, ey); c.stroke(); }
    else if (id === 'shades') { c.fillStyle = '#20141a'; for (const s of [-1, 1]) { ell(c, s * ex, ey, R * .27, R * .25); c.fill(); } c.strokeStyle = '#20141a'; c.lineWidth = R * .06; c.beginPath(); c.moveTo(-R * .05, ey); c.lineTo(R * .05, ey); c.stroke(); c.fillStyle = 'rgba(255,255,255,.4)'; for (const s of [-1, 1]) { ell(c, s * ex - R * .08, ey - R * .09, R * .08, R * .04, -.5); c.fill(); } }
    else if (id === 'hearts') { for (const s of [-1, 1]) art.heart(c, s * ex, ey, R * .3, '#ff6fae'); c.fillStyle = 'rgba(255,255,255,.4)'; for (const s of [-1, 1]) { ell(c, s * ex - R * .09, ey - R * .1, R * .05, R * .03, -.5); c.fill(); } }
    else if (id === 'stars') { for (const s of [-1, 1]) art.star(c, s * ex, ey, R * .32, '#ffd54a', 0); }
    else if (id === 'clown') { c.fillStyle = '#ef4a4a'; ell(c, 0, R * .16, R * .14, R * .14); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; ell(c, -R * .04, R * .12, R * .04, R * .04); c.fill(); }
    c.restore();
  }
  // Collars and ties sit just under the chin.
  function neckAcc(c, id, R) {
    c.save(); c.translate(0, R * .93); c.lineJoin = c.lineCap = 'round';
    if (id === 'bowtie') { c.fillStyle = '#ff5c8a'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(s * R * .36, -R * .17); c.lineTo(s * R * .36, R * .17); c.closePath(); c.fill(); } c.fillStyle = '#d93a6a'; ell(c, 0, 0, R * .09, R * .1); c.fill(); }
    else if (id === 'scarf') { c.fillStyle = '#4f8fe8'; c.beginPath(); c.roundRect ? c.roundRect(-R * .75, -R * .14, R * 1.5, R * .3, R * .15) : c.rect(-R * .75, -R * .14, R * 1.5, R * .3); c.fill(); c.fillStyle = '#3a6fc0'; c.fillRect(R * .1, R * .1, R * .26, R * .55); c.fillStyle = '#fff'; c.fillRect(R * .1, R * .3, R * .26, R * .07); }
    else if (id === 'bell') { c.strokeStyle = '#ff5c8a'; c.lineWidth = R * .13; c.beginPath(); c.arc(0, -R * .5, R * .78, .35, Math.PI - .35); c.stroke(); c.fillStyle = '#ffd54a'; ell(c, 0, R * .3, R * .14, R * .14); c.fill(); c.fillStyle = '#e0a01e'; ell(c, 0, R * .34, R * .03, R * .03); c.fill(); }
    else if (id === 'pearls') { c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = R * .02; for (let i = 0; i < 9; i++) { const a = Math.PI * (.14 + i * .09); ell(c, Math.cos(a) * R * .74, -R * .5 + Math.sin(a) * R * .8, R * .09, R * .09); c.fill(); c.stroke(); } }
    else if (id === 'medal') { c.strokeStyle = '#ef4a4a'; c.lineWidth = R * .1; c.beginPath(); c.moveTo(-R * .4, -R * .1); c.lineTo(0, R * .35); c.lineTo(R * .4, -R * .1); c.stroke(); c.fillStyle = '#ffd54a'; ell(c, 0, R * .45, R * .16, R * .16); c.fill(); art.star(c, 0, R * .45, R * .1, '#fff3b0', 0); }
    else if (id === 'lei') { const cols = ['#ff9db8', '#fff', '#ffd54a', '#ff7aa2', '#fff']; for (let i = 0; i < 9; i++) { const a = Math.PI * (.12 + i * .095); const x = Math.cos(a) * R * .76, y = -R * .5 + Math.sin(a) * R * .82; c.fillStyle = cols[i % 5]; for (let k = 0; k < 5; k++) { ell(c, x + Math.cos(k * TAU / 5) * R * .06, y + Math.sin(k * TAU / 5) * R * .06, R * .05, R * .05); c.fill(); } c.fillStyle = '#ffd54a'; ell(c, x, y, R * .03, R * .03); c.fill(); } }
    c.restore();
  }

  // Fur: a fuzzy outline, little hair strokes and tufts, so pets look soft up close as well as from far away.
  // (Frogs have smooth skin with soft spots instead.) detail scales how many strands are drawn.
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = i => { const x = Math.sin(i * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); };
  function furBody(c, id, sp, s, detail) {
    if (sp.smooth || id === 'frog') {
      if (id !== 'frog') return;
      c.fillStyle = 'rgba(70,140,60,.28)';
      for (let i = 0; i < 9; i++) { const a = rnd(i) * TAU, r = Math.sqrt(rnd(i + 20)); ell(c, Math.cos(a) * s * .17 * r, Math.sin(a) * s * .15 * r - s * .02, s * (.012 + rnd(i + 40) * .018), s * (.01 + rnd(i + 60) * .014)); c.fill(); }
      return;
    }
    const rx = s * .25, ry = s * .23, n = Math.round(cl(s / 3.2 * detail, 24, 96));
    c.lineCap = 'round';
    c.strokeStyle = sp.body; c.lineWidth = Math.max(1.2, s * .012);
    for (let i = 0; i < n; i++) {   // little tufts poking out around the edge
      const a = i / n * TAU + rnd(i) * .08, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry, len = s * (.009 + rnd(i + 5) * .012);
      c.beginPath(); c.moveTo(ex - Math.cos(a) * len * .4, ey - Math.sin(a) * len * .4); c.lineTo(ex + Math.cos(a) * len + (rnd(i + 9) - .5) * len * .7, ey + Math.sin(a) * len + (rnd(i + 11) - .5) * len * .7); c.stroke();
    }
    c.globalAlpha = .32; c.strokeStyle = art.shade(sp.body, -.3); c.lineWidth = Math.max(.8, s * .006);
    const m = Math.round(cl(s / 6 * detail, 10, 60));
    for (let i = 0; i < m; i++) {   // hairs across the coat, leaving the belly clear
      const x = (rnd(i + 100) - .5) * rx * 1.7, y = (rnd(i + 150) - .5) * ry * 1.6;
      if ((x * x) / (s * .16 * s * .16) + ((y - s * .03) * (y - s * .03)) / (s * .16 * s * .16) < 1) continue;
      const len = s * (.035 + rnd(i + 200) * .03), sway = (x > 0 ? 1 : -1) * s * .012;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway, y + len * .5, x + sway * .5, y + len); c.stroke();
    }
    if (id === 'cat') { c.lineWidth = Math.max(1.5, s * .014); c.globalAlpha = .28; for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(sd * rx * .98, -ry * .35 + k * ry * .3); c.quadraticCurveTo(sd * rx * .62, -ry * .3 + k * ry * .3, sd * rx * .5, -ry * .05 + k * ry * .3); c.stroke(); } }
    c.globalAlpha = .5; c.strokeStyle = sp.belly; c.lineWidth = Math.max(1, s * .008);
    for (let i = 0; i < Math.round(m / 2); i++) { const a = rnd(i + 300) * Math.PI, x = Math.cos(a) * s * .15, y = s * .03 + Math.sin(a) * s * .14, len = s * .022; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd(i + 320) - .5) * len, y + len); c.stroke(); }   // soft belly fluff
    c.globalAlpha = 1;
  }
  function furHead(c, id, sp, R, detail) {
    if (id === 'frog' || sp.smooth) return;
    c.fillStyle = sp.body;
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {   // fluffy cheek tufts
      c.beginPath(); c.moveTo(sd * R * .86, R * (.1 + .15 * k)); c.lineTo(sd * R * (1.1 + .04 * (k === 1)), R * (.24 + .15 * k)); c.lineTo(sd * R * .84, R * (.32 + .15 * k)); c.closePath(); c.fill();
    }
    c.strokeStyle = art.shade(sp.body, -.3); c.lineCap = 'round'; c.globalAlpha = .4; c.lineWidth = Math.max(1, R * .05);
    const n = detail > 1.4 ? 7 : 5;
    for (let k = 0; k < n; k++) { const x = (k - (n - 1) / 2) * R * .13; c.beginPath(); c.moveTo(x, -R * .6); c.quadraticCurveTo(x + (x > 0 ? 1 : -1) * R * .05, -R * .72, x * 1.5, -R * .82); c.stroke(); }
    if (id === 'cat') { c.globalAlpha = .45; c.lineWidth = Math.max(1.2, R * .06); for (const x of [-.18, 0, .18]) { c.beginPath(); c.moveTo(x * R, -R * .5); c.lineTo(x * R * 1.2, -R * .78); c.stroke(); } }
    c.globalAlpha = 1;
  }

  // One pet standing on the line y = 0 (its feet), s = about its height. o: { mood, hop, hat, wave, detail }
  function draw(c, id, s, t = 0, o = {}) {
    const sp = SPECIES[id]; if (!sp) return;
    const R = s * .27, mood = o.mood || 'happy', detail = o.detail || 1;
    const hop = Math.min(1, o.hop || 0), lift = Math.sin(hop * Math.PI) * s * .2;
    const breathe = 1 + Math.sin(t * 2.2) * .014;
    const blink = (t % 4.3) < .13;
    c.save(); c.lineCap = 'round';
    c.fillStyle = 'rgba(90,63,94,.13)'; ell(c, 0, s * .01, s * .3 * (1 - lift / s * .8), s * .05); c.fill();   // shadow
    c.translate(0, -lift);
    // tail (behind)
    c.save(); c.translate(0, -s * .22);
    const wag = Math.sin(t * (mood === 'cheer' ? 9 : 2.4)) * (mood === 'sleep' ? .02 : .18);
    if (sp.tail === 'puff') { c.fillStyle = sp.tailCol; ell(c, s * .25, s * .05, s * .07, s * .07); c.fill(); }
    else if (sp.tail === 'long') { c.strokeStyle = sp.tailCol; c.lineWidth = s * .07; c.beginPath(); c.moveTo(s * .2, s * .1); c.quadraticCurveTo(s * .42, s * .1 + wag * s * .5, s * .38, -s * .12 + wag * s * .3); c.stroke(); }
    else if (sp.tail === 'curl') { c.strokeStyle = sp.tailCol; c.lineWidth = s * .035; c.beginPath(); c.arc(s * .27, s * .04, s * .05, Math.PI * .8, Math.PI * 2.6); c.stroke(); }
    else if (sp.tail === 'bushy') { c.save(); c.translate(s * .22, s * .06); c.rotate(-.5 + wag); c.fillStyle = sp.tailCol; ell(c, s * .14, 0, s * .17, s * .08); c.fill(); c.fillStyle = '#fff'; ell(c, s * .27, 0, s * .06, s * .06); c.fill(); c.restore(); }
    c.restore();
    // body
    c.save(); c.translate(0, -s * .22); c.scale(1, breathe);
    c.fillStyle = sp.body; ell(c, 0, 0, s * .25, s * .23); c.fill();
    c.fillStyle = sp.belly; ell(c, 0, s * .03, s * .16, s * .16); c.fill();
    furBody(c, id, sp, s, detail);
    c.restore();
    // arms (they wave when she is happy)
    for (const side of [-1, 1]) {
      c.save(); c.translate(side * s * .22, -s * .3); c.rotate(side * (.35 + (mood === 'cheer' ? -1.5 - Math.sin(t * 10 + side) * .25 : Math.sin(t * 2 + side) * .04)));
      c.fillStyle = sp.limb; ell(c, 0, s * .06, s * .06, s * .12); c.fill(); c.restore();
    }
    // feet
    c.fillStyle = sp.feet || sp.limb; for (const side of [-1, 1]) { ell(c, side * s * .13, -s * .03, s * .09, s * .055); c.fill(); }
    // head with the face and any hat
    c.save(); c.translate(0, -s * .6 + Math.sin(t * 2.2 + .6) * s * .006); if (mood === 'sleep') c.rotate(.1);
    art.avatar(c, sp.kind || id, R, { mood: mood === 'sleep' ? 'sleep' : mood === 'cheer' ? 'cheer' : 'happy', blink });
    furHead(c, id, sp, R, detail);
    if (o.face) faceAcc(c, o.face, R);
    if (o.neck) neckAcc(c, o.neck, R);
    if (o.hat) hat(c, o.hat, R);
    c.restore();
    if (mood === 'sleep') {
      c.fillStyle = '#8a7190'; c.font = `700 ${s * .13}px Fredoka, system-ui`;
      for (let k = 0; k < 2; k++) { const u = ((t * .5 + k * .5) % 1); c.globalAlpha = 1 - u; c.fillText('z', s * .22 + u * s * .1, -s * .8 - u * s * .2); }
      c.globalAlpha = 1;
    }
    c.restore();
  }
  api.draw = draw; api.drawHat = hat;
  const item = id => HATS.find(h => h.id === id);

  // A pet head with a hat, for shop cards.
  api.drawHead = (c, id, R, hatId) => { c.save(); art.avatar(c, SPECIES[id].kind || id, R); const it = hatId && item(hatId), slot = it ? it.slot : 'head'; if (hatId) { if (slot === 'face') faceAcc(c, hatId, R); else if (slot === 'neck') neckAcc(c, hatId, R); else hat(c, hatId, R); } c.restore(); };

  /* ------------------------------------------------------------ the companion that keeps her company */
  // Adds the child's active pet to `host`. Returns null if she has none yet. The pet blinks, breathes, hops when
  // something nice happens, falls asleep when nothing has happened for a while, and can be tapped.
  api.companion = (host, { size = 110 } = {}) => {
    const st = api.active(); if (!st) return null;
    const el = document.createElement('button'); el.type = 'button'; el.className = 'pet-buddy'; el.setAttribute('aria-label', st.name);
    const cv = document.createElement('canvas'); el.append(cv); host.append(el);
    let px = 0, running = true, raf = 0, hopT = 0, cheerT = 0, idle = 0, t = Math.random() * 5, last = performance.now(), drawn = 0;
    const setSize = n => {
      px = n; const dpr = Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.round(n * dpr); cv.height = Math.round(n * 1.15 * dpr); cv.style.width = n + 'px'; cv.style.height = n * 1.15 + 'px';
    };
    setSize(size);
    const frame = now => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.1, (now - last) / 1000); last = now; t += dt; idle += dt;
      if (hopT > 0) hopT = Math.max(0, hopT - dt * 2.2);
      if (cheerT > 0) cheerT = Math.max(0, cheerT - dt);
      if (now - drawn < 33 || document.hidden || !el.isConnected) return;
      drawn = now;
      const cur = api.active() || st, mood = cheerT > 0 ? 'cheer' : idle > 25 ? 'sleep' : 'happy';
      const c = cv.getContext('2d'), dpr = cv.width / px;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, px, px * 1.15);
      c.translate(px / 2, px * 1.08); draw(c, cur.id, px * .92, t, { mood, hop: hopT > 0 ? 1 - hopT : 0, hat: cur.hat, face: cur.face, neck: cur.neck });
    };
    raf = requestAnimationFrame(frame);
    const buddy = {
      el, setSize,
      hop() { idle = 0; hopT = 1; },
      cheer(sec = 2.4) { idle = 0; cheerT = sec; hopT = 1; },
      wake() { idle = 0; },
      place(x, y) { el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.right = el.style.bottom = 'auto'; },
      destroy() { running = false; cancelAnimationFrame(raf); el.remove(); }
    };
    el.addEventListener('pointerdown', e => { e.preventDefault(); buddy.hop(); api.noise(st.id); });
    return buddy;
  };

  SPG.pets = api;
})();
