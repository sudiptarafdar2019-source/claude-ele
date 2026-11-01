import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Camera, DarkBg, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {Sfx} from '../components/Sound';
import {Speaker} from '../components/Speaker';
import {ExplainScene, sceneSlots} from '../components/Explain';
import {autoShots, shotAt} from '../lib/visuals';
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

/** Where your photo sits for each shot: x offset and height. It sits under the scene and keeps moving. */
const LAYOUTS = [
  {fx: -240, fh: 760},
  {fx: 240, fh: 760},
  {fx: 0, fh: 790},
  {fx: 220, fh: 860},
];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const STAGE_TOP = 330;

/**
 * Shared body of the face templates: an animated explainer scene shows what you are
 * talking about (a webpage, a customer walking in, a form filling, a fire...), while your
 * photo reacts underneath and moves every shot. No on-screen text, only captions.
 */
export const FaceShots: React.FC<TemplateProps & {bg: React.ReactNode; glow?: string; dark?: boolean}> = ({reel, timing, beats, bg, glow}) => {
  const frame = useCurrentFrame();
  const shots = React.useMemo(() => autoShots(timing, beats, 1e6), [timing, beats]);
  const slots = React.useMemo(() => sceneSlots(beats, timing.words, FPS), [beats, timing]);
  const shot = shotAt(shots, frame);
  const si = shots.indexOf(shot);
  const prev = shots[si - 1];
  let slot = slots[0];
  for (const x of slots) if (x.from <= frame) slot = x;
  const sf = frame - slot.from;
  const t = ease(frame - shot.from, 0, 16);
  const a = LAYOUTS[(prev ?? shot).layout], c = LAYOUTS[shot.layout];
  const fx = mix(a.fx, c.fx, t), fh = mix(a.fh, c.fh, t);
  const face = faceAt(beats, timing, frame);
  const prevFace = faceAt(beats, timing, Math.max(0, face.since - 1)).name;
  // the scene drifts a little opposite to the photo, so the whole frame moves together
  const drift = -fx * 0.08;
  return (
    <AbsoluteFill>
      {bg}
      <Camera cutFrame={slot.from} index={slots.indexOf(slot)} strength={0.6}>
        <div key={slot.key} style={{position: 'absolute', left: 40 + drift, top: STAGE_TOP}}>
          <ExplainScene name={slot.name} f={sf} dur={slot.to - slot.from} face={face.name} />
        </div>
      </Camera>
      {/* your photo, speaking, moving with the shots */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 1920}}>
        <Speaker face={face.name} prevFace={prevFace} since={face.since} voice={voiceFile(reel)} height={fh} x={fx} glow={glow} />
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(180deg, rgba(5,13,36,0), rgba(5,13,36,0.8))'}} />
      </div>
      <Captions words={timing.words} y={200} style="dark" size={76} />
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
