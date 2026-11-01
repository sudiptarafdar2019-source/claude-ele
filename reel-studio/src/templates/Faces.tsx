import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Camera, DarkBg, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {Sfx} from '../components/Sound';
import {Speaker} from '../components/Speaker';
import {ShotStage} from '../components/Visual';
import {autoShots, Shot, shotAt} from '../lib/visuals';
import {voiceFile} from '../components/Sound';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {autoFace, faceSrc} from '../lib/faces';
import {ease, pop} from '../lib/motion';
import {TemplateProps} from './types';
import {Timing} from '../types';

/** Which face shows at a frame: the beat's face, or the tone tag of the word being spoken. */
export const faceAt = (beats: TemplateProps['beats'], timing: Timing, frame: number) => {
  const b = beatAt(beats, frame);
  if (b.face) return {name: b.face, since: b.from};
  const t = frame / FPS;
  let w = timing.words[0];
  for (const x of timing.words) if (x.start <= t) w = x;
  const name = autoFace(w?.tag);
  // find when this face started
  let since = b.from;
  for (let i = timing.words.indexOf(w); i >= 0; i--) {
    if (autoFace(timing.words[i].tag) !== name) break;
    since = Math.max(b.from, Math.round(timing.words[i].start * FPS));
  }
  return {name, since};
};

/** Face + picture positions per shot layout: face x offset and height, picture centre and size. */
const LAYOUTS = [
  {fx: 0, fh: 1000, ix: 540, iy: 720, is: 380},
  {fx: -240, fh: 1150, ix: 780, iy: 760, is: 300},
  {fx: 240, fh: 1150, ix: 300, iy: 760, is: 300},
  {fx: 0, fh: 1400, ix: 830, iy: 640, is: 200},
];
const PHONE_LAYOUT = {fx: -270, fh: 1100, ix: 800, iy: 760, is: 0};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Shared body of the face templates: your photo moves around the frame with every shot
 * (centre, left, right, close-up) while a new animated picture explains each moment.
 * No on-screen text, only captions.
 */
export const FaceShots: React.FC<TemplateProps & {bg: React.ReactNode; glow?: string; dark?: boolean}> = ({reel, timing, beats, bg, glow}) => {
  const frame = useCurrentFrame();
  const b = beatAt(beats, frame);
  const f = frame - b.from;
  const dur = b.to - b.from;
  const shots = React.useMemo(() => autoShots(timing, beats, 1e6), [timing, beats]);
  const shot = shotAt(shots, frame);
  const si = shots.indexOf(shot);
  const prev = shots[si - 1];
  const isPhone = (x?: Shot) => !!x && x.phone;
  const L = (x?: Shot) => (!x ? LAYOUTS[0] : isPhone(x) ? PHONE_LAYOUT : LAYOUTS[x.layout]);
  const t = ease(frame - shot.from, 0, 14);
  const a = L(prev ?? shot), c = L(shot);
  const fx = mix(a.fx, c.fx, t), fh = mix(a.fh, c.fh, t);
  const ix = mix(a.ix, c.ix, t), iy = mix(a.iy, c.iy, t);
  const face = faceAt(beats, timing, frame);
  const prevFace = faceAt(beats, timing, Math.max(0, face.since - 1)).name;
  return (
    <AbsoluteFill>
      {bg}
      <Camera cutFrame={shot.from} index={si} strength={0.6}>
        {/* the moving picture for this moment */}
        {!isPhone(shot) && (
          <div style={{position: 'absolute', left: ix - 400, top: iy - 400, width: 800, height: 800}}>
            <ShotStage shot={shot} prev={prev && !isPhone(prev) ? prev : undefined} frame={frame} size={c.is || 300} dark />
          </div>
        )}
        {isPhone(shot) && b.prop && (
          <div style={{position: 'absolute', left: 560, top: 470, width: 480, height: 980, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(3deg) translateX(${(1 - ease(f, 0, 14)) * 300}px)`}}>
            <PropView prop={b.prop} f={f - 3} dur={dur} theme="dark" width={430 / 0.62} />
          </div>
        )}
      </Camera>
      {/* your photo, speaking, moving with the shots */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 1920}}>
        <Speaker face={face.name} prevFace={prevFace} since={face.since} voice={voiceFile(reel)} height={fh} x={fx} glow={glow} />
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, background: 'linear-gradient(180deg, rgba(5,13,36,0), rgba(5,13,36,0.85))'}} />
      </div>
      <Captions words={timing.words} y={370} style="dark" size={80} />
      <NamePill voice={voiceFile(reel)} dark />
      <ProgressBar />
    </AbsoluteFill>
  );
};

/** TEMPLATE · FACE REACTIONS (dark navy): your photo reacts and moves, pictures explain. */
export const Faces: React.FC<TemplateProps> = (p) => <FaceShots {...p} bg={<DarkBg />} />;

export const facesSfx = (beats: TemplateProps['beats'], timing: Timing, total: number): Sfx[] => {
  const out: Sfx[] = [];
  let last = '';
  for (let fr = 0; fr < total; fr += 2) {
    const fc = faceAt(beats, timing, fr);
    if (fc.name !== last) {
      if (last) out.push({f: fc.since, src: 'pop', vol: 0.4});
      last = fc.name;
    }
  }
  return out;
};
