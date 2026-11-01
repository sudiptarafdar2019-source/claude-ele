import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Camera, DarkBg, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {Sfx} from '../components/Sound';
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

/**
 * TEMPLATE 2 · FACE REACTIONS (dark theme)
 * Your real face cutout at the bottom changes expression with the tone of each line.
 * Big faded number behind, the "thing" floating above your head, captions in between.
 */
export const Faces: React.FC<TemplateProps> = ({reel, timing, beats}) => {
  const frame = useCurrentFrame();
  const b = beatAt(beats, frame);
  const f = frame - b.from;
  const dur = b.to - b.from;
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  const face = faceAt(beats, timing, frame);
  const ff = frame - face.since;
  const s = pop(ff, 0, 10, 0.55);
  const breathe = 1 + Math.sin(frame / 14) * 0.008;
  const big = b.number ?? (b.headline ? b.headline[0] : '');
  return (
    <AbsoluteFill>
      <DarkBg />
      <Camera cutFrame={b.from} index={b.index}>
        {big && (
          <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: fonts.heading, fontWeight: 800, fontSize: 900, lineHeight: 1, color: 'transparent', WebkitTextStroke: '4px rgba(255,255,255,0.10)', transform: `scale(${0.9 + 0.1 * pop(f, 0)})`}}>{big}</div>
        )}
        <div style={{position: 'absolute', top: 260, left: 0, right: 0, height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {frame > hookEnd && b.prop && <PropView prop={b.prop} f={f - 2} dur={dur} theme="dark" width={860} />}
          {frame > hookEnd && !b.prop && b.headline && (
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 110, color: '#fff', textAlign: 'center', letterSpacing: '-0.03em', transform: `scale(${pop(f, 0)})`}}>{b.headline}</div>
          )}
        </div>
        {frame > hookEnd && b.number && (
          <div style={{position: 'absolute', top: 205, left: 70, padding: '10px 30px', borderRadius: 999, background: C.gold, color: C.navy, fontFamily: fonts.heading, fontWeight: 800, fontSize: 40, transform: `scale(${pop(f, 0, 9)})`}}>No. {b.number}</div>
        )}
      </Camera>
      {/* face cutout */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: -40, height: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end'}}>
        <div style={{position: 'absolute', bottom: 60, width: 760, height: 760, borderRadius: 999, background: 'radial-gradient(circle, rgba(0,82,255,0.55) 0%, rgba(0,82,255,0) 68%)'}} />
        <Img src={staticFile(faceSrc(face.name))} style={{height: 940, transform: `translateY(${(1 - s) * 90}px) scale(${(0.86 + 0.14 * s) * breathe}) rotate(${(1 - s) * -4}deg)`, transformOrigin: '50% 100%', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 2px #fff) drop-shadow(0 30px 40px rgba(0,0,0,0.5))'}} />
        <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, background: 'linear-gradient(180deg, rgba(5,13,36,0), rgba(5,13,36,0.9))'}} />
      </div>
      <HookTitle text={reel.hook} hi={reel.hookHighlight} dark until={hookEnd} top={330} />
      <Captions words={timing.words} y={860} style="dark" size={80} />
      <NamePill voice={reel.voice} dark />
      <ProgressBar />
    </AbsoluteFill>
  );
};

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
