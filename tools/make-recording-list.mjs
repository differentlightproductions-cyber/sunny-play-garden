// Regenerates RECORDING.md from the voice lines in js/core.js.
// Run from the repository root:  node tools/make-recording-list.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const noop = () => {};
const sandbox = {
  window: {}, document: { addEventListener: noop, documentElement: {} }, localStorage: { getItem: () => null, setItem: noop },
  addEventListener: noop, matchMedia: () => ({ matches: false }), navigator: {}, history: {}, setTimeout, clearTimeout
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync('js/core.js', 'utf8'), sandbox);
const { LINES, fileFor } = sandbox.SPG.voice;

const groups = [
  ['Praise and prompts', k => !k.includes('/') && !['find', 'is-for', 'spell-name'].includes(k)],
  ['Sentence pieces (spoken between other clips)', k => ['find', 'is-for', 'spell-name'].includes(k)],
  ['Letter names', k => k.startsWith('letter/')],
  ['Letter sounds (the phonics sound, not the name)', k => k.startsWith('sound/')],
  ['Picture words', k => k.startsWith('word/')],
  ['Garden friends', k => k.startsWith('creature/')]
];
let md = `# Recording the voice lines

Until a recording exists for a line, the tablet's built-in voice speaks it instead, so nothing is ever silent.
To replace a line with a real voice, record it and save it in \`audio/voice/\` using the file name below.

**Tips**
- Record in a quiet room, phone voice memo is fine. Speak warmly and a little slowly, like reading to her.
- Keep each clip short with no long silence at the start or end.
- Save or convert to **MP3** and use the exact file name in the table.
- You can record just a few. Anything missing keeps using the built-in voice.
- Letter *names* say "Bee"; letter *sounds* say the sound "buh" (not "bee").
- Her name is always spoken by the built-in voice, since it is different for every player.

`;
const entries = Object.entries(LINES);
for (const [title, test] of groups) {
  const rows = entries.filter(([k]) => test(k));
  if (!rows.length) continue;
  md += `## ${title}\n\n| File | Say |\n|---|---|\n` + rows.map(([k, t]) => `| \`${fileFor(k).replace('audio/voice/', '')}\` | ${t} |`).join('\n') + '\n\n';
}
writeFileSync('RECORDING.md', md);
console.log(`Wrote RECORDING.md with ${entries.length} lines.`);
