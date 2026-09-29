// Renders the PNG app icons from icons/icon.svg and icons/icon-maskable.svg.
// Needs Playwright:  npm i -D playwright && npx playwright install chromium
// Run from the repo root:  node tools/make-icons.mjs   (CHROME_PATH can point at an existing Chrome)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const jobs = [['icon.svg', 'icon-192.png', 192], ['icon.svg', 'icon-512.png', 512], ['icon-maskable.svg', 'icon-maskable-512.png', 512]];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
for (const [svg, out, size] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const data = readFileSync(`icons/${svg}`).toString('base64');
  await page.setContent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${data}" width="${size}" height="${size}" style="display:block">`);
  await page.screenshot({ path: `icons/${out}`, omitBackground: true });
  await page.close();
}
await browser.close();
console.log('Icons written.');
