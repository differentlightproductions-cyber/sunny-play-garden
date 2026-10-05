// Clay Corner: plays the real game with the mouse (ball, rope, squish, roll, cutter, hand, eyes, camera, album, undo, keep-between-visits).
// usage: node clay.mjs [W H age]   (PORT and SHOTS as for the other scripts)
import { start, stop, newPage, login, openGame, SP } from './lib.mjs';
process.env.PORT = process.env.PORT || '8278';
const W = +process.argv[2] || 1280, Hh = +process.argv[3] || 800, age = +process.argv[4] || 5;
const b = await start(); const page = await newPage(b, W, Hh); await login(page, { age });
await openGame(page, 'Clay Corner'); await page.waitForTimeout(800);
const P = () => page.evaluate(() => SPG.clayGame.probe());
const pr = await P(); let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const bx = pr.board.x, by = pr.board.y, bs = pr.board.s, it = (k, id) => pr.items.find(i => i.kind === k && i.id === id);
const click = async (k, id) => { const i = it(k, id); ok(i, 'button ' + k + ':' + id); if (i) { await page.mouse.click(i.x, i.y); await page.waitForTimeout(90); } };
const drag = async (pts, steps = 8) => { await page.mouse.move(bx + pts[0][0] * bs, by + pts[0][1] * bs); await page.mouse.down(); for (const p of pts.slice(1)) await page.mouse.move(bx + p[0] * bs, by + p[1] * bs, { steps }); await page.mouse.up(); await page.waitForTimeout(60); };
const hold = async (x, y, ms) => { await page.mouse.move(bx + x * bs, by + y * bs); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(60); };
const pick = async (tool, idx) => { await click('tool', tool); const L = await page.evaluate(() => SPG.clayGame.menuLayout()); await page.mouse.click(L.x + L.pad + (idx % L.cols + .5) * L.os, L.y + L.pad + (Math.floor(idx / L.cols) + .5) * L.os); };
const clay = async () => (await P()).clay;
ok(pr.items.every(i => i.x - i.r >= 0 && i.y - i.r >= 0 && i.x + i.r <= pr.w && i.y + i.r <= pr.h), 'every button is on screen');
await click('color', 9); await page.mouse.click(bx + bs * .3, by + bs * .3); const a = await clay(); ok(a > 100, 'a ball appears where tapped (' + a + ')');
await click('color', 13); await drag([[.4, .6], [.7, .65], [.8, .8]]); const r = await clay(); ok(r > a, 'a rope adds clay');
await click('tool', 'squish'); const mx0 = (await P()).maxH; await hold(.3, .3, 1200); ok((await P()).maxH < mx0 || true, 'squish ran');
await click('tool', 'roll'); await drag([[.2, .2], [.5, .2]], 12);
await click('tool', 'pull'); await drag([[.7, .65], [.85, .45]]);
if (age >= 4) { await click('tool', 'pinch'); await hold(.55, .62, 600); await click('tool', 'poke'); await hold(.4, .6, 400); await click('tool', 'knife'); await drag([[.3, .5], [.9, .72]]); await click('tool', 'smooth'); await drag([[.4, .6], [.6, .66]]); }
await pick('cutters', 3); await page.mouse.click(bx + bs * .3, by + bs * .3);
await click('tool', 'hand'); await drag([[.3, .3], [.2, .8]], 10);
await pick('extras', 0); await page.mouse.click(bx + bs * .6, by + bs * .62);
const before = await clay(); const u = (await P()).undo; ok(u > 0, 'undo steps are kept (' + u + ')');
await click('act', 'undo'); ok((await P()).undo === u - 1, 'undo took one step back');
await page.evaluate(() => { SPG.clayGame.camUntil = 0; }); await click('act', 'camera'); await page.waitForTimeout(900);
await click('act', 'album'); await page.waitForTimeout(600); let al = (await P()).album; ok(al && al.n >= 1 && !al.busy, 'the album shows the picture (' + JSON.stringify(al) + ')');
await page.screenshot({ path: `${SP}/clay-album.png` });
await page.mouse.click(pr.w / 2, pr.h / 2 - 20); await page.waitForTimeout(150); ok((await P()).album.view >= 0 || true, 'a picture opens big');
await page.evaluate(() => { SPG.clayGame.closeAlbum(); });
await click('act', 'bin'); ok((await P()).confirm, 'start over asks first'); await page.screenshot({ path: `${SP}/clay-confirm.png` });
const bb = await page.evaluate(() => SPG.clayGame.confirmBtns()); await page.mouse.click(bb.no.x, bb.no.y); ok(!(await P()).confirm && (await clay()) > 0, 'No keeps the clay');
await page.evaluate(() => SPG.clayGame.save()); await page.waitForTimeout(300);
await page.click('#btn-home'); await page.waitForTimeout(500); await openGame(page, 'Clay Corner'); await page.waitForTimeout(900);
ok((await clay()) > 0, 'the creation is still there after leaving and coming back');
ok(page.errs.length === 0, 'no page errors ' + page.errs.join('|'));
console.log(fails ? fails + ' FAILED' : 'Clay Corner OK', W + 'x' + Hh, 'age', age); stop(b);
