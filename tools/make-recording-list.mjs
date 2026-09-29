// Regenerates RECORDING.md from the voice lines in js/voice.js.
// Run from the repository root:  node tools/make-recording-list.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const noop = () => {};
const sandbox = {
  document: { addEventListener: noop, documentElement: {} }, localStorage: { getItem: () => null, setItem: noop },
  addEventListener: noop, matchMedia: () => ({ matches: false }), navigator: {}, history: {}, setTimeout, clearTimeout
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['js/core.js', 'js/voice.js']) vm.runInContext(readFileSync(f, 'utf8'), sandbox);
const v = sandbox.SPG.voice;
const keys = [...Object.keys(v.LINES), ...Object.keys(v.SOUNDS)];

let md = `# Recording your own voice

The games speak every line with the tablet's built-in voice until you record your own. You can record a
**male** and a **female** voice; the games mix them (or use just one, your choice).

## Easiest way: record on the tablet
1. Open **Grown-ups** (lock icon), answer the sum, then **Voices > Record and choose voices**.
2. Pick **Male voice** or **Female voice** (whoever is recording).
3. Open a group, tap **Record**, say the line, tap **Stop**. Tap **Hear** to check it.
4. Every line has its own switch: turn off any line you don't want the games to say.
5. Set how often the games cheer ("Every time", "Sometimes", "Never").

Recordings are saved on that tablet. Anything you skip keeps using the built-in voice.
Quiet recordings are levelled and silence is trimmed automatically.

## Or: drop in files
Save MP3s as \`audio/voice/male/<file>.mp3\` and/or \`audio/voice/female/<file>.mp3\` using the names below, then run
\`node tools/build-voice-manifest.mjs\` and deploy. (File recordings work on every device; tablet recordings only on that tablet.)

## Suggested order (most useful first)
1. **Cheering** and **Prompts**: about ${keys.filter(k => v.groupOf(k) && ['praise', 'prompts'].includes(v.groupOf(k).id)).length} short lines.
2. **Letter sounds** and **Letter names**: the heart of the letter games.
3. **Critter noises**: make the noise yourself (bee buzz, frog ribbit).
4. **Picture words**, **Garden friend announcements**, **Player names**.

`;
for (const g of v.GROUPS) {
  const rows = keys.filter(k => v.groupOf(k) === g);
  if (!rows.length) continue;
  md += `## ${g.title}\n\n${g.note}\n\n| File | Say |\n|---|---|\n` + rows.map(k => `| \`${k.replace(/\//g, '-')}.mp3\` | ${v.textFor(k)} |`).join('\n') + '\n\n';
}
writeFileSync('RECORDING.md', md);
console.log(`Wrote RECORDING.md with ${keys.length} lines.`);
