// Usage: node scripts/prepare.mjs day09   -> word timings + voice polish + reel index
import path from 'node:path';
import {execSync} from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
for (const id of process.argv.slice(2)) execSync(`python3 scripts/transcribe.py reels/${id}.json`, {cwd: root, stdio: 'inherit'});
execSync('node scripts/sync-index.mjs', {cwd: root, stdio: 'inherit'});
