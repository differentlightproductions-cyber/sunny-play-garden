import { start, stop, newPage, login, openGame, SP } from './lib.mjs';
const wait = ms => new Promise(r => setTimeout(r, ms));
process.env.PORT = process.env.PORT || '8141';
const b = await start();
for (const [w, h, age] of [[1280, 800, 6], [390, 844, 4], [844, 390, 2], [800, 1280, 5]]) {
  const page = await newPage(b, w, h); await login(page, { gender: 'boy', age });
  await openGame(page, 'Letter Garden');
  await page.screenshot({ path: `${SP}/lg_menu_${w}x${h}.png` });
  for (const [label, name] of [['Numbers', 'num'], ['Add', 'math']]) {
    await page.evaluate(l => { [...document.querySelectorAll('.lg-mode')].find(b => b.textContent.trim() === l).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }, label);
    await wait(900);
    await page.screenshot({ path: `${SP}/${name}_${w}x${h}.png` });
    // answer a few questions correctly using the buttons (read the answer from the page state)
    for (let i = 0; i < 3; i++) {
      const ans = await page.evaluate(() => { const hint = document.querySelectorAll('.lg-opt'); return hint.length; });
      // click each option until one is right (they fade when right)
      for (const o of await page.$$('.lg-opt')) { await o.evaluate(el => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await wait(250); if (await page.$('.lg-opt.right')) break; }
      await wait(3600);
    }
    await page.evaluate(() => document.querySelector('.lg-back').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await wait(300);
  }
  console.log(w, h, page.errs.join(' | ') || 'no errors', 'stars:', await page.evaluate(() => SPG.store.active.stars));
}
stop(b);
