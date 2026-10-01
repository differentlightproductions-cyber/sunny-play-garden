import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const androidDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(androidDir, '..');
const bundledSite = join(androidDir, 'app', 'src', 'main', 'assets', 'site');
const gameAssets = [
  'index.html',
  'privacy.html',
  'styles.css',
  'manifest.webmanifest',
  'games',
  'js',
  'fonts',
  'icons',
  join('audio', 'voice', 'manifest.json'),
];

for (const relativePath of gameAssets) {
  const source = join(repoRoot, relativePath);
  if (!existsSync(source)) throw new Error(`Missing game asset: ${source}`);
}

for (const relativePath of gameAssets) {
  const source = join(repoRoot, relativePath);
  const destination = join(bundledSite, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, { recursive: true });
}

console.log('Bundled Android game assets refreshed from the repository root.');
