// Builds src/reel-index.ts from every reels/*.json that has a matching .timing.json
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'reels');
const ids = fs.readdirSync(dir).filter((f) => /^[\w-]+\.json$/.test(f) && !f.endsWith('.timing.json'))
  .map((f) => f.replace('.json', '')).filter((id) => fs.existsSync(path.join(dir, `${id}.timing.json`))).sort();
const lines = ids.flatMap((id, i) => [`import r${i} from '../reels/${id}.json';`, `import t${i} from '../reels/${id}.timing.json';`]);
lines.push(`export const REELS: {id: string; reel: any; timing: any}[] = [${ids.map((id, i) => `{id: '${id}', reel: r${i}, timing: t${i}}`).join(', ')}];`);
fs.writeFileSync(path.join(root, 'src', 'reel-index.ts'), lines.join('\n') + '\n');
console.log(`reel index: ${ids.join(', ') || '(none)'}`);
