// Screenshots of the kitchen: menu tabs, the intro card, and every step of a recipe played with simple taps.
// node tools/playtest/kitchen-look.mjs W H recipe   (screenshots go to $SHOTS)
import { start, stop, newPage, login, openGame, SP } from './lib.mjs';
const W = +process.argv[2] || 1280, H = +process.argv[3] || 800, rid = process.argv[4] || 'burger';
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await start(); const page = await newPage(b, W, H); await login(page); await openGame(page, 'Sprout Kitchen'); await wait(500);
const P = () => page.evaluate(() => SPG.cookGame.probe());
const shot = n => page.screenshot({ path: `${SP}/${rid}_${W}x${H}_${n}.png` });
for (const tab of [0, 1, 2]) { const m = (await P()).menu.find(x => x.tab === tab); await page.mouse.click(m.x, m.y); await wait(250); await page.screenshot({ path: `${SP}/menu${tab}_${W}x${H}.png` }); }
const cat = { sandwich: 1, pbj: 1, toastie: 1, burger: 2, hotdog: 2, pizza: 2 }[rid] ?? 0;
let m = (await P()).menu.find(x => x.tab === cat); await page.mouse.click(m.x, m.y); await wait(200);
m = (await P()).menu.find(x => x.id === rid); await page.mouse.click(m.x, m.y); await wait(1200); await shot('0intro');
await page.mouse.click(W / 2, H / 2); await wait(2200);
let n = 0, last = '';
for (let guard = 0; guard < 160; guard++) {
  const p = await P(); if (p.screen === 'menu') break;
  if (p.trans || p.busy) { await wait(200); continue; }
  const k = p.step + ':' + p.idx; if (k !== last) { last = k; await wait(300); await shot(`${++n}_${p.step}`); }
  if (p.finishedAll) { await wait(800); await shot('done'); break; }
  const st = p.st || {};
  if (p.step === 'pick') { await page.mouse.click(p.cards[0].x, p.cards[0].y); await wait(1500); continue; }
  if (p.step === 'grill' && p.spec.free) { if (st.placed < 2) { const it = p.tray[st.placed % p.tray.length]; await page.mouse.click(it.x, it.y); await wait(600); continue; } if (p.check) { await page.mouse.click(p.check.x, p.check.y); await wait(300); } for (const u of st.units) if (u.state === 'flip') { await page.mouse.click(u.x, u.y); await wait(300); } await wait(400); continue; }
  if (p.step === 'grill') { const it = p.tray.find(t => !t.used); if (it) { await page.mouse.click(it.x, it.y); await wait(600); } for (const u of st.units) if (u.state === 'flip') { await page.mouse.click(u.x, u.y); await wait(300); } await wait(400); continue; }
  if (p.step === 'build') { const items = p.tray.filter(t => !t.used); const endId = st.end; const pick = items.filter(t => t.id !== endId); if ((st.n || 0) < 2 && pick.length) { await page.mouse.click(pick[(st.n || 0) % pick.length].x, pick[(st.n || 0) % pick.length].y); await wait(700); continue; } if (endId) { const e = items.find(t => t.id === endId); await page.mouse.click(e.x, e.y); await wait(1500); continue; } if (p.check) { await shot(`${n}_built`); await page.mouse.click(p.check.x, p.check.y); await wait(1500); } continue; }
  if (p.step === 'stack') { const it = p.tray.find(t => t.id === p.want[0]); if (it) { await page.mouse.click(it.x, it.y); await wait(700); } continue; }
  if (p.step === 'decorate') { const sl = p.slots[0]; for (const tl of p.tray) { await page.mouse.click(tl.x, tl.y); await wait(120); for (const [dx, dy] of [[-.5, -.3], [.3, -.5], [0, -.2]]) { const yy = sl.y + dy * sl.r; await page.mouse.move(sl.x + dx * sl.r, yy); await page.mouse.down(); await page.mouse.move(sl.x + (dx + .4) * sl.r, yy + 4, { steps: 5 }); await page.mouse.up(); await wait(100); } } await shot(`${n}_decorated`); const q = await P(); if (q.check) { await page.mouse.click(q.check.x, q.check.y); await wait(1500); } else await wait(500); continue; }
  if (p.step === 'slice') { await page.mouse.move(p.bx, p.by - p.U * .3); await page.mouse.down(); await page.mouse.move(p.bx, p.by + p.U * .4, { steps: 12 }); await page.mouse.up(); await wait(800); continue; }
  if (p.step === 'bake') { await page.mouse.click(p.bx, p.by - p.U * .1); await wait(1600); continue; }
  if (p.step === 'serve') { const sl = p.slots[0]; await page.mouse.click(sl.x, sl.y); await wait(300); continue; }
  if (p.step === 'roll') { await page.mouse.move(p.bx - p.U * .3, p.by); await page.mouse.down(); for (let i = 0; i < 10; i++) await page.mouse.move(p.bx + (i % 2 ? .3 : -.3) * p.U, p.by + (i % 3 - 1) * 20, { steps: 8 }); await page.mouse.up(); await wait(400); continue; }
  await wait(300);
}
console.log(rid, W + 'x' + H, page.errs.join('\n') || 'no page errors');
stop(b);
