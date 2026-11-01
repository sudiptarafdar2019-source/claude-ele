import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Camera, HookTitle, LightBg, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {Sfx} from '../components/Sound';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {ease, pop} from '../lib/motion';
import {TemplateProps} from './types';

/**
 * TEMPLATE 1 · CARTOON EXPLAINER (light theme)
 * Top: small serif eyebrow + one big keyword. Middle: cartoon-you card + the "thing"
 * (phone, stat, checklist...). Bottom-middle: animated captions.
 */
export const Toon: React.FC<TemplateProps> = ({reel, timing, beats}) => {
  const frame = useCurrentFrame();
  const b = beatAt(beats, frame);
  const f = frame - b.from;
  const dur = b.to - b.from;
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  const showHead = frame > hookEnd;
  const hasProp = !!b.prop;
  const poseSrc = staticFile(`img/cartoon/${b.pose ?? 'smile'}.png`);
  const ps = pop(f, 0, 11);
  const bob = Math.sin(frame / 9) * 6;
  const talk = 1 + Math.abs(Math.sin(frame / 2.6)) * 0.012;
  const isPhone = b.prop?.type === 'phone';
  const charCard = (w: number, h: number, rot: number) => (
    <div style={{width: w, height: h, borderRadius: 48, overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg, #2a1d17 0%, #0A1633 100%)', boxShadow: '0 40px 80px rgba(10,22,51,0.28)', transform: `rotate(${rot}deg) translateY(${bob}px) scale(${0.9 + 0.1 * ps})`}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 35%, rgba(25,167,255,0.35), transparent 60%)'}} />
      <Img src={poseSrc} style={{position: 'absolute', bottom: -6, left: '50%', height: '88%', transform: `translateX(-50%) scale(${talk})`, transformOrigin: '50% 100%'}} />
      <div style={{position: 'absolute', left: 26, bottom: 22, fontFamily: 'monospace', fontWeight: 700, fontSize: 26, letterSpacing: '0.18em', color: '#fff'}}>SUDIP · ORBIRISE</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <LightBg />
      <Camera cutFrame={b.from} index={b.index} strength={0.8}>
        {/* headline zone */}
        {showHead && (
          <div style={{position: 'absolute', top: 250, left: 60, right: 60, textAlign: 'center'}}>
            <div style={{fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 58, color: C.ink, opacity: ease(f, 0, 6), transform: `translateY(${(1 - ease(f, 0, 8)) * 20}px)`}}>{b.eyebrow}</div>
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: (b.headline?.length ?? 0) > 14 ? 104 : 128, lineHeight: 1.0, letterSpacing: '-0.035em', color: C.blue, marginTop: 6, transform: `scale(${0.7 + 0.3 * pop(f, 2, 10)})`}}>
              “{b.headline}”
            </div>
          </div>
        )}
        {/* character + prop zone */}
        {isPhone ? (
          <div style={{position: 'absolute', top: 540, left: 0, right: 0, height: 760, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30}}>
            {charCard(430, 600, -3)}
            <div style={{transform: 'rotate(3deg)'}}>
              <PropView prop={b.prop!} f={f - 3} dur={dur} theme="light" width={370 / 0.62} />
            </div>
          </div>
        ) : (
          <>
            <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
              {hasProp ? charCard(400, 440, -2) : charCard(600, 700, 0)}
            </div>
            {hasProp && (
              <div style={{position: 'absolute', top: 1035, left: 0, right: 0, height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{transform: 'scale(0.92)'}}><PropView prop={b.prop!} f={f - 3} dur={dur} theme="light" width={900} /></div>
              </div>
            )}
          </>
        )}
      </Camera>
      <HookTitle text={reel.hook} hi={reel.hookHighlight} until={hookEnd} top={290} />
      <Captions words={timing.words} y={1450} style="light" size={74} />
      <NamePill voice={reel.voice} avatar="img/cartoon/smile.png" />
      <ProgressBar track="rgba(10,22,51,0.08)" />
    </AbsoluteFill>
  );
};

export const toonSfx = (beats: TemplateProps['beats']): Sfx[] =>
  beats.flatMap((b, i) => (i > 0 && beats[i - 1].pose !== b.pose ? [{f: b.from + 1, src: 'pop', vol: 0.3}] : []));
