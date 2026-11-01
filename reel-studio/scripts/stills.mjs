// Quick preview: node scripts/stills.mjs day04 30,200,400  -> out/previews/day04-f30.png ...
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pairs = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const dir = path.join(root, 'out', 'previews'); fs.mkdirSync(dir, {recursive: true});
for (let i = 0; i < pairs.length; i += 2) {
  const id = pairs[i];
  const comp = await selectComposition({serveUrl, id});
  for (const fr of pairs[i + 1].split(',').map(Number)) {
    await renderStill({composition: comp, serveUrl, frame: fr, output: path.join(dir, `${id}-f${fr}.png`), scale: 0.5});
  }
}
console.log('done');
