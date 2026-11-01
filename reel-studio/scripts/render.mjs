// Usage: node scripts/render.mjs day04 [day05 ...]   (no ids = render every reel)
// Options: --cover-only, --video-only, --frames=0-90 (quick test)
import path from 'node:path';
import fs from 'node:fs';
import {execSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
execSync('node scripts/sync-index.mjs', {cwd: root, stdio: 'inherit'});
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
let ids = args.filter((a) => !a.startsWith('--'));
if (!ids.length) ids = fs.readdirSync(path.join(root, 'reels')).filter((f) => f.endsWith('.timing.json')).map((f) => f.replace('.timing.json', ''));
const out = path.join(root, 'out');
fs.mkdirSync(out, {recursive: true});
console.log('Bundling...');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
for (const id of ids) {
  if (!('video-only' in flags)) {
    const still = await selectComposition({serveUrl, id: `${id}-cover`});
    await renderStill({composition: still, serveUrl, output: path.join(out, `${id}-cover.png`)});
    console.log(`cover -> out/${id}-cover.png`);
  }
  if ('cover-only' in flags) continue;
  const comp = await selectComposition({serveUrl, id});
  const frameRange = flags.frames ? flags.frames.split('-').map(Number) : null;
  let last = -1;
  await renderMedia({
    composition: comp, serveUrl, codec: 'h264', crf: 18, audioBitrate: '256k', concurrency: Number(flags.concurrency ?? 4),
    frameRange, outputLocation: path.join(out, `${id}.mp4`),
    onProgress: ({progress}) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; process.stdout.write(`${id}: ${p * 10}%  `); } },
  });
  // loudness to social-media level (-14 LUFS), video stream copied untouched
  const raw = path.join(out, `${id}.mp4`), tmp = path.join(out, `${id}.tmp.mp4`);
  execSync(`ffmpeg -loglevel error -y -i "${raw}" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 256k -movflags +faststart "${tmp}"`);
  fs.renameSync(tmp, raw);
  console.log(`\nvideo -> out/${id}.mp4`);
}
