import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import {C, FPS, fonts} from '../brand';
import {Camera, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {Icon} from '../components/Icon';
import {voiceFile} from '../components/Sound';
import {autoShots, shotAt, Shot} from '../lib/visuals';
import {tapFrame} from '../components/Phone';
import {Sfx} from '../components/Sound';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {ease, pop} from '../lib/motion';
import {TemplateProps} from './types';
import {ResolvedBeat} from '../types';

const PHONE_W = 430;
const PROP_TOP = 560;

const ICON_C = {x: 540, y: 700};
const ICON_S = 520;

/** circle / tick / cross the marker adds after drawing the picture */
const markPath = (kind: string) => {
  const {x, y} = ICON_C;
  switch (kind) {
    case 'circle': return `M ${x - 330} ${y + 20} A 330 300 0 1 0 ${x + 330} ${y - 10} A 330 300 0 1 0 ${x - 300} ${y - 40}`;
    case 'underline': return `M ${x - 260} ${y + 330} C ${x - 100} ${y + 350}, ${x + 80} ${y + 315}, ${x + 260} ${y + 340}`;
    case 'check': return `M ${x + 170} ${y - 230} L ${x + 230} ${y - 170} L ${x + 340} ${y - 320}`;
    case 'cross': return `M ${x - 300} ${y - 300} L ${x + 300} ${y + 300} M ${x + 300} ${y - 300} L ${x - 300} ${y + 300}`;
    default: return '';
  }
};

/**
 * TEMPLATE · HAND EXPLAINER (whiteboard)
 * A realistic hand sketches a picture for every moment (a new one every 1-2 s), then circles,
 * ticks or crosses it. On phone beats it taps the phone. No written words, only captions.
 */
export const Hands: React.FC<TemplateProps> = ({reel, timing, beats}) => {
  const frame = useCurrentFrame();
  const b = beatAt(beats, frame);
  const f = frame - b.from;
  const dur = b.to - b.from;
  const shots = React.useMemo(() => autoShots(timing, beats, 1e6), [timing, beats]);
  const shot = shotAt(shots, frame);
  const prev = shots[shots.indexOf(shot) - 1];
  const fs = frame - shot.from;
  const isPhone = shot.phone;
  const drawP = ease(fs, 3, 22, 0, 1, (t) => t);
  const kind = shot.badge === 'cross' ? 'cross' : shot.badge === 'check' ? 'check' : shot.badge === 'win' ? 'circle' : ['circle', 'underline', '', 'circle'][shot.layout];
  const d = markPath(kind);
  const len = d ? getLength(d) : 0;
  const mp = ease(fs, 24, 34, 0, 1, (t) => t);
  // marker tip: scribbles over the picture while drawing, then follows the mark
  let tip: {x: number; y: number} | null = null;
  if (fs >= 2 && fs <= 22) {
    const a = drawP * Math.PI * 3.2;
    tip = {x: ICON_C.x + Math.cos(a) * 190 * (1 - drawP * 0.4), y: ICON_C.y + Math.sin(a * 1.3) * 170};
  } else if (d && fs > 22 && fs <= 34) tip = getPointAtLength(d, len * mp);
  const last = d ? getPointAtLength(d, len) : {x: ICON_C.x + 150, y: ICON_C.y + 150};
  const hp = tip ?? last;
  const handIn = ease(fs, 0, 4);
  const handOut = ease(fs, 36, 46);
  const showMarker = !isPhone && handOut < 1;
  const prevOut = 1 - ease(fs, 0, 6);
  // tap hand (phone beats)
  const tf = tapFrame(dur);
  const tapIn = ease(f, tf - 10, tf - 1);
  const tapOut = ease(f, tf + 8, tf + 18);
  const tapPress = f >= tf && f < tf + 6 ? 0.94 : 1;
  const btn = {x: 540 - PHONE_W / 2 + PHONE_W * 0.33, y: PROP_TOP + PHONE_W * 2.05 * 0.47};
  const thumbs = b.hand === 'thumbs-up';
  const sketch = (icon: string, p: number, op: number) => (
    <div style={{position: 'absolute', left: ICON_C.x - ICON_S / 2, top: ICON_C.y - ICON_S / 2, width: ICON_S, height: ICON_S, opacity: op, strokeDasharray: 120, strokeDashoffset: 120 * (1 - p), filter: 'url(#rough)'} as React.CSSProperties}>
      <Icon name={icon} size={ICON_S} color={C.navy} stroke={1.6} />
    </div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F3F5F9 70%, #E7EBF2 100%)'}}>
        <AbsoluteFill style={{opacity: 0.35, backgroundImage: 'linear-gradient(115deg, rgba(10,22,51,0.025) 0%, rgba(255,255,255,0) 40%, rgba(10,22,51,0.03) 70%, rgba(255,255,255,0) 100%)'}} />
      </AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={3} /><feDisplacementMap in="SourceGraphic" scale={5} /></filter>
      </svg>
      <Camera cutFrame={shot.from} index={shots.indexOf(shot)} strength={0.5}>
        {!isPhone && (
          <>
            {prev && prev.beat === shot.beat && prevOut > 0 && sketch(prev.icon, 1, prevOut)}
            {sketch(shot.icon, drawP, 1)}
            {/* colour fill that blooms in behind the sketch */}
            <div style={{position: 'absolute', left: ICON_C.x - 260, top: ICON_C.y - 260, width: 520, height: 520, borderRadius: 999, background: 'radial-gradient(circle, rgba(0,82,255,0.10), rgba(0,82,255,0) 70%)', transform: `scale(${ease(fs, 16, 30)})`, zIndex: -1}} />
            {d && (
              <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
                <path d={d} fill="none" stroke={kind === 'cross' ? C.red : kind === 'check' ? C.green : shot.badge === 'win' ? C.gold : C.blue} strokeWidth={kind === 'cross' ? 22 : 14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - mp)} />
              </svg>
            )}
          </>
        )}
        {isPhone && b.prop && (
          <div style={{position: 'absolute', top: PROP_TOP - 160, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <PropView prop={b.prop} f={f - 4} dur={dur} theme="board" width={PHONE_W / 0.62} />
          </div>
        )}
      </Camera>
      {/* marker hand (tip of the marker is the image's top-left corner) */}
      {showMarker && (
        <Img src={staticFile('img/hands/marker.png')} style={{position: 'absolute', left: hp.x - 2 + (1 - handIn) * 500 + handOut * 600, top: hp.y - 2 + (1 - handIn) * 700 + handOut * 900, width: 410, transform: `rotate(${Math.sin(fs / 3) * 2}deg)`, transformOrigin: '0 0', filter: 'drop-shadow(18px 30px 26px rgba(10,22,51,0.25))'}} />
      )}
      {isPhone && b.prop?.tap && f > tf - 12 && tapOut < 1 && (
        <Img src={staticFile('img/hands/tap.png')} style={{position: 'absolute', left: btn.x - 89 + (1 - tapIn) * 380 + tapOut * 400, top: btn.y - 164 + (1 - tapIn) * 700 + tapOut * 800, width: 298, transform: `scale(${tapPress})`, transformOrigin: '89px 0', filter: 'drop-shadow(18px 30px 26px rgba(10,22,51,0.25))'}} />
      )}
      {isPhone && b.prop?.tap && f >= tf && f < tf + 14 && (
        <div style={{position: 'absolute', left: btn.x - 60, top: btn.y - 220, width: 120, height: 120, borderRadius: 999, border: `6px solid ${C.blue}`, transform: `scale(${0.4 + ease(f, tf, tf + 14) * 1.6})`, opacity: 1 - ease(f, tf, tf + 14)}} />
      )}
      {thumbs && (
        <Img src={staticFile('img/hands/thumbs-up.png')} style={{position: 'absolute', right: 40, top: 1000 + (1 - pop(f, 14, 10)) * 900, width: 400, transform: `rotate(${Math.sin(f / 5) * 4}deg)`, filter: 'drop-shadow(18px 30px 26px rgba(10,22,51,0.25))'}} />
      )}
      <Captions words={timing.words} y={1500} style="board" size={76} />
      <NamePill voice={voiceFile(reel)} />
      <ProgressBar track="rgba(10,22,51,0.08)" />
    </AbsoluteFill>
  );
};

export const handsSfx = (beats: ResolvedBeat[], shots: Shot[]): Sfx[] =>
  shots.filter((x) => !x.phone).map((x) => ({f: x.from + 3, src: 'marker', vol: 0.22}));
