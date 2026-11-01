// Voice polish presets (ffmpeg). Makes the cloned voice sound like a studio mic.
// Output goes to public/voice/fx/<name>-<preset>.mp3 and is used automatically by the reel.
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';

export const PRESETS = {
  // bright, clear, close mic with a very small room
  studio: 'highpass=f=75,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1.2:g=2.5,highshelf=f=10000:g=1.5,deesser=i=0.4,acompressor=threshold=0.1:ratio=3:attack=8:release=120:makeup=2,aecho=0.9:0.6:22|37:0.06|0.04,loudnorm=I=-16:TP=-1.5:LRA=7',
  // warmer, fuller "podcast" sound with a touch more room
  warm: 'highpass=f=70,lowshelf=f=140:g=2.5,equalizer=f=300:t=q:w=1:g=-1.5,equalizer=f=3000:t=q:w=1.2:g=1.8,deesser=i=0.45,acompressor=threshold=0.1:ratio=3.5:attack=10:release=150:makeup=2.2,aecho=0.9:0.7:28|46|61:0.08|0.06|0.04,loudnorm=I=-16:TP=-1.5:LRA=7',
  // just level and low-cut, no colour
  clean: 'highpass=f=70,acompressor=threshold=0.125:ratio=2.5:attack=10:release=120:makeup=1.6,loudnorm=I=-16:TP=-1.5:LRA=7',
};

export const fxPath = (voice, preset) => `voice/fx/${path.basename(voice, path.extname(voice))}-${preset}.mp3`;

/** Creates the polished voice file if it is missing or older than the source. Returns its public path. */
export const ensureVoiceFx = (root, voice, preset) => {
  if (!preset || preset === 'none' || !PRESETS[preset]) return voice;
  const src = path.join(root, 'public', voice);
  const rel = fxPath(voice, preset), dst = path.join(root, 'public', rel);
  if (!fs.existsSync(src)) return voice;
  if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) {
    fs.mkdirSync(path.dirname(dst), {recursive: true});
    execSync(`ffmpeg -loglevel error -y -i "${src}" -af "${PRESETS[preset]}" -ar 44100 -b:a 192k "${dst}"`);
    console.log(`voice polish (${preset}) -> public/${rel}`);
  }
  return rel;
};
