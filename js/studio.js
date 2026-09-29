// The grown-ups "Voices" screen: record your own voice for every line, pick which voice the games
// use, mute lines you don't want, and turn praise down. Recordings live on this tablet.
(() => {
  const SPG = window.SPG;
  const { voice, store } = SPG;

  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    el.append(...kids.flat().filter(k => k != null));
    return el;
  };

  let activeSet = 'male';
  let recording = null;      // { key, ctl, timer }
  const openGroups = new Set(['praise']);
  let message = '';

  function seg(options, current, onPick, label) {
    const box = h('div', { class: 'seg', role: 'group', 'aria-label': label });
    for (const [value, text] of options) {
      const b = h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(current === value) }, text);
      b.addEventListener('click', () => onPick(value));
      box.append(b);
    }
    return box;
  }
  const sw = (checked, label, onChange) => {
    const b = h('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(checked), 'aria-label': label });
    b.addEventListener('click', () => { checked = !checked; b.setAttribute('aria-checked', String(checked)); onChange(checked); });
    return b;
  };

  function render(body) {
    const scroller = body.closest('[data-scroll]'), top = scroller ? scroller.scrollTop : 0;
    for (const p of store.profiles) voice.custom['player/' + p.id] = `Hi ${p.name}!`;
    const keys = voice.allKeys();
    const countFor = set => keys.filter(k => voice.hasClip(set, k)).length;
    const muted = new Set(store.settings.muted || []);
    const redraw = () => render(body);

    body.replaceChildren(...[
      h('p', { class: 'lead' }, SPG.config.recorder ? 'Record your own voice for the games. Choose who is recording, open a group, tap Record, say the line, and tap Stop. Anything you skip keeps using the tablet’s built-in voice.' : 'Choose which voice the games use, switch off lines you don’t want, and set how often the games cheer.'),
      message ? h('p', { class: 'notice' }, message) : null,
      SPG.config.recorder ? h('h3', {}, 'Who is recording?') : null,
      SPG.config.recorder ? seg(voice.SETS.map(s => [s.id, `${s.name} (${countFor(s.id)}/${keys.length})`]), activeSet, id => { if (recording) return; activeSet = id; message = ''; redraw(); }, 'Who is recording') : null,
      h('h3', {}, 'Which voice do the games use?'),
      seg([['mix', 'Both, mixed'], ['male', 'Male only'], ['female', 'Female only'], ['builtin', 'Built-in only']], store.settings.voicePref || 'mix', v => { store.settings.voicePref = v; store.save(); redraw(); }, 'Voice used in games'),
      h('h3', {}, 'How often should the games cheer?'),
      seg([['lots', 'Every time'], ['some', 'Sometimes'], ['off', 'Never']], store.settings.praise || 'some', v => { store.settings.praise = v; store.save(); redraw(); }, 'Cheering frequency'),
      h('p', { class: 'fine' }, 'Recordings are saved on this tablet only. Each line can be switched off with its own switch, and you can hear what each line sounds like with Hear.'),
      ...voice.GROUPS.map(g => group(g, keys, muted, redraw))
    ].filter(Boolean));
    if (scroller) scroller.scrollTop = top;
  }

  function group(g, allKeys, muted, redraw) {
    const list = allKeys.filter(k => voice.groupOf(k) === g);
    if (!list.length) return null;
    const done = list.filter(k => voice.hasClip(activeSet, k)).length;
    const det = h('details', { class: 'vgroup', open: openGroups.has(g.id) });
    det.addEventListener('toggle', () => { det.open ? openGroups.add(g.id) : openGroups.delete(g.id); });
    det.append(h('summary', {}, `${g.title} `, h('span', { class: 'fine' }, `${done}/${list.length} recorded`)));
    det.append(h('p', { class: 'fine' }, g.note));
    const allOn = list.every(k => !muted.has(k));
    det.append(h('div', { class: 'setting' }, h('span', {}, 'Use this group in the games'), sw(allOn, `Use ${g.title}`, on => {
      const m = new Set(store.settings.muted || []);
      for (const k of list) on ? m.delete(k) : m.add(k);
      store.settings.muted = [...m]; store.save(); redraw();
    })));
    for (const k of list) det.append(row(k, muted, redraw));
    return det;
  }

  function row(key, muted, redraw) {
    const sound = key in voice.SOUNDS;
    const has = voice.hasClip(activeSet, key), mine = voice.hasDeviceClip(activeSet, key);
    const isRec = recording && recording.key === key;
    const r = h('div', { class: 'vrow' + (has ? ' done' : '') });
    const rec = !SPG.config.recorder ? null : h('button', { class: 'btn small vrec' + (isRec ? ' rec-on' : ''), type: 'button', disabled: recording && !isRec }, isRec ? '■ Stop' : (has ? '● Re-record' : '● Record'));
    if (rec) rec.addEventListener('click', () => (isRec ? finish(redraw) : start(key, redraw)));
    const hear = h('button', { class: 'btn small quiet', type: 'button', disabled: sound && !has }, 'Hear');
    hear.addEventListener('click', async () => {
      if (has) await voice.previewClip(activeSet, key); else voice.say({ say: voice.textFor(key) });
    });
    const parts = [
      h('div', { class: 'vrow-text' }, h('b', {}, voice.textFor(key)), sound ? h('div', { class: 'fine' }, 'Just make the noise') : null),
      rec, hear
    ].filter(Boolean);
    if (mine) {
      const del = h('button', { class: 'btn small danger', type: 'button' }, 'Delete');
      del.addEventListener('click', async () => { await voice.deleteClip(activeSet, key); redraw(); });
      parts.push(del);
    }
    parts.push(sw(!muted.has(key), `Use "${voice.textFor(key)}" in the games`, on => {
      const m = new Set(store.settings.muted || []); on ? m.delete(key) : m.add(key); store.settings.muted = [...m]; store.save();
    }));
    r.append(...parts);
    return r;
  }

  async function start(key, redraw) {
    message = '';
    try {
      const ctl = await voice.startRecording();
      recording = { key, ctl, timer: setTimeout(() => finish(redraw), 8000) };
    } catch (e) {
      message = 'The microphone is not available. Allow microphone access when the tablet asks (or in the site settings), then try again.';
    }
    redraw();
  }

  async function finish(redraw) {
    const r = recording; if (!r) return;
    recording = null; clearTimeout(r.timer);
    try { const blob = await r.ctl.stop(); await voice.saveClip(activeSet, r.key, blob); message = ''; }
    catch (e) { message = 'That recording could not be saved. Please try again.'; }
    redraw();
  }

  // Called when the screen is closed mid-recording.
  function abort() { if (recording) { clearTimeout(recording.timer); recording.ctl.cancel(); recording = null; } }

  SPG.studio = { render, abort };
})();
