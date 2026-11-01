import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Camera, Grain, Grid, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {faceSrc} from '../lib/faces';
import {ease, pop} from '../lib/motion';
import {faceAt} from './Faces';
import {Speaker} from '../components/Speaker';
import {voiceFile} from '../components/Sound';
import {TemplateProps} from './types';

const TipsBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(165deg, #0047E0 0%, #0A1F5C 45%, #071330 100%)'}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 540 - (500 + i * 260) / 2, top: 700 - (500 + i * 260) / 2, width: 500 + i * 260, height: 500 + i * 260, borderRadius: 9999, border: '2px solid rgba(255,255,255,0.07)', transform: `rotate(${f * (0.3 + i * 0.1)}deg)`}}>
          <div style={{position: 'absolute', top: -9, left: '50%', width: 18, height: 18, borderRadius: 99, background: i === 1 ? C.gold : C.sky, boxShadow: `0 0 20px ${i === 1 ? C.gold : C.sky}`}} />
        </div>
      ))}
      <Grid color="rgba(255,255,255,0.04)" />
      <Grain />
    </AbsoluteFill>
  );
};

/**
 * TEMPLATE 5 · QUICK TIPS (kinetic list)
 * Bold numbered steps with icons that build into a checklist, orbit-ring background,
 * and your face reacting in the corner with the tone of each line.
 */
export const Tips: React.FC<TemplateProps> = ({reel, timing, beats}) => {
  const frame = useCurrentFrame();
  const b = beatAt(beats, frame);
  const f = frame - b.from;
  const dur = b.to - b.from;
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  const face = faceAt(beats, timing, frame);
  const steps = beats.filter((x) => x.number).length;
  return (
    <AbsoluteFill>
      <TipsBg />
      <Camera cutFrame={b.from} index={b.index}>
        <div style={{position: 'absolute', top: 250, left: 60, right: 60, textAlign: 'center', display: frame > hookEnd ? 'block' : 'none'}}>
          {b.number ? (
            <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 20}}>
              <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 230, lineHeight: 0.9, color: C.gold, letterSpacing: '-0.05em', transform: `scale(${0.5 + 0.5 * pop(f, 0, 9)})`}}>{b.number}</div>
              <div style={{fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 70, color: 'rgba(255,255,255,0.7)'}}>of {String(steps).padStart(2, '0')}</div>
            </div>
          ) : (
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: (b.title?.length ?? 0) > 20 ? 90 : 108, lineHeight: 1.02, letterSpacing: '-0.03em', color: '#fff', transform: `translateY(${(1 - pop(f, 0)) * 50}px)`, opacity: pop(f, 0)}}>{b.title}</div>
          )}
        </div>
        {frame > hookEnd && b.prop && (
          <div style={{position: 'absolute', top: 500, left: 0, right: 0, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <PropView prop={b.prop} f={f - 3} dur={dur} theme="dark" width={900} />
          </div>
        )}
        {/* step dots */}
        {b.number && (
          <div style={{position: 'absolute', top: 1250, left: 380, right: 0, display: 'flex', justifyContent: 'center', gap: 16}}>
            {Array.from({length: steps}).map((_, i) => (
              <div key={i} style={{width: i + 1 === Number(b.number) ? 60 : 18, height: 18, borderRadius: 99, background: i + 1 <= Number(b.number) ? C.gold : 'rgba(255,255,255,0.25)'}} />
            ))}
          </div>
        )}
      </Camera>
      {/* your face, speaking, bottom-left */}
      <div style={{position: 'absolute', left: -60, bottom: 0, width: 640, height: 900}}>
        <Speaker face={face.name} prevFace={faceAt(beats, timing, Math.max(0, face.since - 1)).name} since={face.since} voice={voiceFile(reel)} height={700} glow="rgba(232,176,75,0.35)" />
      </div>
      <HookTitle text={reel.hook} hi={reel.hookHighlight} dark until={hookEnd} top={380} />
      <Captions words={timing.words} y={1110} style="dark" size={74} />
      <NamePill voice={reel.voice} dark />
      <ProgressBar />
    </AbsoluteFill>
  );
};
