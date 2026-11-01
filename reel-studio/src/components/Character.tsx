import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, rnd} from '../lib/motion';

/**
 * Animated vector cartoon characters (no images needed).
 * Every part is drawn in code, so they can blink, talk in sync with the voice,
 * change mood and move their arms between gestures.
 */

export type CharDef = {
  name: string; role: string;
  skin: string; skinShade: string; hair: string; hairStyle: 'swoop' | 'bun' | 'cap';
  top: string; topShade: string; shirt: string; pants: string; shoes: string;
  beard?: boolean; glasses?: boolean; apron?: string; cap?: string; necklace?: boolean; collar?: 'blazer' | 'sweater' | 'hoodie';
};

export const CHARACTERS: Record<string, CharDef> = {
  sudip: {name: 'Sudip', role: 'Your guide (Orbirise founder)', skin: '#C98B60', skinShade: '#A9714B', hair: '#1B120E', hairStyle: 'swoop', top: '#17295C', topShade: '#0F1D45', shirt: '#FFFFFF', pants: '#101B3B', shoes: '#15171C', beard: true, necklace: true, collar: 'blazer'},
  maya: {name: 'Maya', role: 'Small business owner', skin: '#E6AD84', skinShade: '#C98F67', hair: '#3A2116', hairStyle: 'bun', top: '#E8B04B', topShade: '#C99332', shirt: '#FFF6E5', pants: '#26375A', shoes: '#6B3E2A', glasses: true, apron: '#0052FF', collar: 'sweater'},
  leo: {name: 'Leo', role: 'The customer', skin: '#8E5B3C', skinShade: '#744631', hair: '#121212', hairStyle: 'cap', top: '#19A7FF', topShade: '#1187D1', shirt: '#E8F6FF', pants: '#3A3F4B', shoes: '#F4F4F4', cap: '#0A1633', collar: 'hoodie'},
};

export type Mood = 'neutral' | 'happy' | 'excited' | 'surprised' | 'worried' | 'thinking' | 'sad';
type Hand = 'open' | 'point' | 'thumb' | 'phone';
type Pose = {sL: number; eL: number; sR: number; eR: number; hL?: Hand; hR?: Hand};

/** Arm angles in degrees: s = shoulder (0 = hanging, + = out/up), e = elbow (+ = forearm folds in/up). */
export const GESTURES: Record<string, Pose> = {
  idle: {sL: 10, eL: 8, sR: 10, eR: 8},
  wave: {sL: 10, eL: 8, sR: 140, eR: 25, hR: 'open'},
  point: {sL: 10, eL: 8, sR: 92, eR: 4, hR: 'point'},
  'point-up': {sL: 10, eL: 8, sR: 165, eR: 0, hR: 'point'},
  explain: {sL: 22, eL: -78, sR: 22, eR: -78, hL: 'open', hR: 'open'},
  'thumbs-up': {sL: 10, eL: 8, sR: 22, eR: 118, hR: 'thumb'},
  shrug: {sL: 26, eL: -112, sR: 26, eR: -112, hL: 'open', hR: 'open'},
  think: {sL: 10, eL: 8, sR: -8, eR: 168},
  phone: {sL: 10, eL: 8, sR: 12, eR: 118, hR: 'phone'},
  cheer: {sL: 158, eL: 12, sR: 158, eR: 12, hL: 'open', hR: 'open'},
  crossed: {sL: 18, eL: 138, sR: 18, eR: 138},
  present: {sL: 10, eL: 8, sR: 62, eR: 38, hR: 'open'},
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const Character: React.FC<{
  who: string; gesture?: string; prevGesture?: string; gestureT?: number; mood?: Mood;
  talking?: boolean; level?: number; look?: number; seed?: number;
}> = ({who, gesture = 'idle', prevGesture, gestureT = 1, mood = 'neutral', talking = false, level = 0, look = 0, seed = 1}) => {
  const frame = useCurrentFrame();
  const c = CHARACTERS[who] ?? CHARACTERS.sudip;
  const g = GESTURES[gesture] ?? GESTURES.idle;
  const p = GESTURES[prevGesture ?? gesture] ?? g;
  const t = gestureT;
  let sL = lerp(p.sL, g.sL, t), eL = lerp(p.eL, g.eL, t), sR = lerp(p.sR, g.sR, t), eR = lerp(p.eR, g.eR, t);
  if (gesture === 'wave') eR += Math.sin(frame / 4) * 18 * t;
  if (talking && (gesture === 'explain' || gesture === 'shrug' || gesture === 'present')) {
    const k = level * 10;
    eL += Math.sin(frame / 5) * k; eR += Math.sin(frame / 5 + 1.5) * k;
  }
  const hL = t > 0.5 ? g.hL : p.hL, hR = t > 0.5 ? g.hR : p.hR;

  // life: breathing, blinking, head motion
  const breathe = Math.sin(frame / 18 + seed) * 0.01;
  const blinkCycle = 95 + Math.floor(rnd(seed * 7) * 50);
  const bf = (frame + Math.floor(rnd(seed) * 80)) % blinkCycle;
  const blink = bf < 6 ? Math.abs(Math.cos((bf / 6) * Math.PI)) * 0.9 + 0.1 : 1;
  const nod = talking ? Math.sin(frame / 6) * 2.2 * (0.4 + level) : Math.sin(frame / 40 + seed) * 1.2;
  const headTilt = mood === 'thinking' ? 5 : mood === 'worried' ? -3 : 0;

  const eyeScale = mood === 'surprised' ? 1.25 : 1;
  const pupilX = look * 5 + (mood === 'thinking' ? 4 : 0);
  const pupilY = mood === 'thinking' ? -5 : 0;
  const brow = {
    neutral: [0, 0], happy: [-4, 6], excited: [-8, 8], surprised: [-12, 0], worried: [-4, -14], thinking: [-8, 10], sad: [2, -12],
  }[mood] as [number, number];

  const mouth = () => {
    if (talking) {
      const open = 3 + level * 16 + Math.abs(Math.sin(frame / 2.2)) * level * 5;
      const wide = mood === 'happy' || mood === 'excited' ? 17 : 14;
      return (
        <g>
          <ellipse cx={200} cy={238} rx={wide} ry={open} fill="#5B1F24" />
          <rect x={200 - wide + 3} y={238 - open} width={wide * 2 - 6} height={Math.min(5, open)} rx={2} fill="#fff" />
          {open > 8 && <ellipse cx={200} cy={238 + open * 0.5} rx={wide * 0.55} ry={open * 0.35} fill="#E06A6F" />}
        </g>
      );
    }
    switch (mood) {
      case 'excited': return <path d="M178 228 Q200 262 222 228 Z" fill="#5B1F24" stroke="#5B1F24" strokeWidth={3} strokeLinejoin="round" />;
      case 'happy': return <path d="M180 230 Q200 250 220 230" fill="none" stroke="#5B1F24" strokeWidth={6} strokeLinecap="round" />;
      case 'surprised': return <ellipse cx={200} cy={240} rx={10} ry={13} fill="#5B1F24" />;
      case 'worried': case 'sad': return <path d="M182 244 Q200 230 218 244" fill="none" stroke="#5B1F24" strokeWidth={6} strokeLinecap="round" />;
      case 'thinking': return <path d="M186 240 Q204 238 216 230" fill="none" stroke="#5B1F24" strokeWidth={6} strokeLinecap="round" />;
      default: return <path d="M184 236 Q200 244 216 236" fill="none" stroke="#5B1F24" strokeWidth={6} strokeLinecap="round" />;
    }
  };

  const hand = (type: Hand | undefined, side: 1 | -1) => (
    <g>
      {type === 'point' && <rect x={-6} y={10} width={12} height={38} rx={6} fill={c.skin} />}
      {type === 'thumb' && <rect x={-7} y={-40} width={15} height={34} rx={7.5} fill={c.skin} stroke={c.skinShade} strokeWidth={2} />}
      {type === 'phone' && (
        <g transform={`rotate(${side * 160})`}>
          <rect x={-26} y={-58} width={52} height={92} rx={10} fill="#0A1633" />
          <rect x={-21} y={-52} width={42} height={78} rx={6} fill="#19A7FF" />
          <rect x={-14} y={-42} width={28} height={6} rx={3} fill="#fff" opacity={0.85} />
          <rect x={-14} y={-30} width={20} height={6} rx={3} fill="#fff" opacity={0.6} />
        </g>
      )}
      <circle r={type === 'open' ? 22 : 20} fill={c.skin} />
      {type === 'open' && <ellipse cx={0} cy={-6} rx={14} ry={8} fill={c.skinShade} opacity={0.35} />}
    </g>
  );

  const arm = (side: 1 | -1, s: number, e: number, h?: Hand) => {
    // side -1 = screen-left arm, +1 = screen-right arm
    const sx = side < 0 ? 126 : 274;
    const rot = side < 0 ? s : -s;
    const er = side < 0 ? -e : e;
    return (
      <g transform={`translate(${sx} 318) rotate(${rot})`}>
        <rect x={-21} y={-14} width={42} height={128} rx={21} fill={c.top} />
        <g transform={`translate(0 112) rotate(${er})`}>
          <rect x={-18} y={-12} width={36} height={112} rx={18} fill={c.top} />
          <rect x={-18} y={82} width={36} height={14} rx={6} fill={c.collar === 'hoodie' ? c.topShade : c.shirt} />
          <g transform="translate(0 112)">{hand(h, side)}</g>
        </g>
      </g>
    );
  };

  const hair = () => {
    if (c.hairStyle === 'swoop')
      return (
        <g>
          <path d="M118 176 C110 96 160 64 214 70 C262 74 292 108 284 172 C276 150 268 132 252 122 C236 140 196 140 170 128 C156 140 138 150 128 182 Z" fill={c.hair} />
          <path d="M150 96 C190 70 250 72 276 104 C246 92 214 96 196 112 C206 92 176 90 150 96 Z" fill={c.hair} />
          <path d="M228 118 C246 126 262 146 266 168" stroke={c.hair} strokeWidth={7} fill="none" strokeLinecap="round" />
        </g>
      );
    if (c.hairStyle === 'bun')
      return (
        <g>
          <circle cx={200} cy={70} r={36} fill={c.hair} />
          <path d="M116 190 C104 110 150 80 200 80 C252 80 296 110 284 190 C276 150 250 120 200 118 C150 120 124 150 116 190 Z" fill={c.hair} />
          <path d="M120 180 C114 230 126 262 142 280 C130 240 128 210 134 184 Z" fill={c.hair} />
          <path d="M280 180 C286 230 274 262 258 280 C270 240 272 210 266 184 Z" fill={c.hair} />
        </g>
      );
    return (
      <g>
        <path d="M120 170 C120 112 160 90 200 90 C240 90 280 112 280 170 C268 150 236 140 200 140 C164 140 132 150 120 170 Z" fill={c.hair} />
        <path d="M116 150 C116 92 160 70 202 70 C246 70 286 94 286 150 Z" fill={c.cap} />
        <path d="M200 140 C250 138 300 142 330 156 C300 164 250 160 200 152 Z" fill={c.cap} />
        <circle cx={202} cy={72} r={8} fill={c.top} />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 400 800" width="100%" height="100%" style={{overflow: 'visible'}}>
      {/* floor shadow */}
      <ellipse cx={200} cy={786} rx={120} ry={16} fill="rgba(10,22,51,0.16)" />
      {/* legs */}
      <rect x={148} y={520} width={48} height={250} rx={20} fill={c.pants} />
      <rect x={204} y={520} width={48} height={250} rx={20} fill={c.pants} />
      <ellipse cx={168} cy={774} rx={38} ry={16} fill={c.shoes} />
      <ellipse cx={232} cy={774} rx={38} ry={16} fill={c.shoes} />
      <g transform={`translate(200 540) scale(1 ${1 + breathe}) translate(-200 -540)`}>
        {/* back arm layer when folded across */}
        {/* torso */}
        <path d="M112 318 Q112 292 140 288 L260 288 Q288 292 288 318 L272 548 Q200 562 128 548 Z" fill={c.top} />
        {c.collar === 'blazer' && (
          <g>
            <path d="M176 288 L224 288 L200 372 Z" fill={c.shirt} />
            <path d="M176 288 L200 372 L170 352 L156 296 Z" fill={c.topShade} />
            <path d="M224 288 L200 372 L230 352 L244 296 Z" fill={c.topShade} />
            <circle cx={200} cy={420} r={6} fill={c.topShade} />
            <circle cx={200} cy={460} r={6} fill={c.topShade} />
          </g>
        )}
        {c.collar === 'sweater' && <path d="M168 288 Q200 316 232 288 Z" fill={c.shirt} />}
        {c.apron && (
          <g>
            <path d="M150 330 L250 330 L262 556 Q200 566 138 556 Z" fill={c.apron} />
            <rect x={176} y={420} width={48} height={34} rx={8} fill="rgba(255,255,255,0.22)" />
            <path d="M150 330 L172 290 M250 330 L228 290" stroke={c.apron} strokeWidth={8} />
          </g>
        )}
        {c.collar === 'hoodie' && (
          <g>
            <path d="M150 290 Q200 340 250 290 Q240 318 200 326 Q160 318 150 290 Z" fill={c.topShade} />
            <path d="M186 318 L182 380 M214 318 L218 380" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
            <path d="M156 450 L244 450 L238 510 L162 510 Z" fill={c.topShade} opacity={0.6} />
          </g>
        )}
        {/* head */}
        <g transform={`translate(200 280) rotate(${nod + headTilt}) translate(-200 -280)`}>
          <rect x={184} y={240} width={32} height={56} rx={12} fill={c.skinShade} />
          {c.necklace && <path d="M182 286 Q200 300 218 286" stroke="#B5823A" strokeWidth={4} fill="none" />}
          <circle cx={122} cy={190} r={17} fill={c.skin} />
          <circle cx={278} cy={190} r={17} fill={c.skin} />
          <rect x={120} y={92} width={160} height={186} rx={78} fill={c.skin} />
          {c.beard && <path d="M132 214 Q140 278 200 282 Q260 278 268 214 Q262 262 200 268 Q138 262 132 214 Z" fill={c.hair} opacity={0.28} />}
          {c.beard && <path d="M180 224 Q200 216 220 224" stroke={c.hair} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.7} />}
          {hair()}
          {/* brows */}
          <g stroke={c.hair} strokeWidth={7} strokeLinecap="round">
            <line x1={158} y1={152 + brow[0] * 0.5} x2={186} y2={150 + brow[0] * 0.5} transform={`rotate(${-brow[1]} 172 151)`} />
            <line x1={214} y1={150 + brow[0] * 0.5} x2={242} y2={152 + brow[0] * 0.5} transform={`rotate(${brow[1]} 228 151)`} />
          </g>
          {/* eyes */}
          {[172, 228].map((x) => (
            <g key={x} transform={`translate(${x} 182) scale(${eyeScale} ${eyeScale * blink})`}>
              <ellipse rx={13} ry={15} fill="#fff" />
              <circle cx={pupilX} cy={pupilY + 1} r={8} fill="#1D140F" />
              <circle cx={pupilX + 3} cy={pupilY - 3} r={2.6} fill="#fff" />
            </g>
          ))}
          {c.glasses && (
            <g fill="none" stroke="#2A1A12" strokeWidth={4}>
              <rect x={150} y={164} width={44} height={36} rx={14} />
              <rect x={206} y={164} width={44} height={36} rx={14} />
              <path d="M194 180 L206 180" />
            </g>
          )}
          <path d="M200 192 Q192 212 198 216 Q204 218 208 214" fill="none" stroke={c.skinShade} strokeWidth={5} strokeLinecap="round" />
          <ellipse cx={150} cy={222} rx={14} ry={8} fill="#FF7F7F" opacity={mood === 'happy' || mood === 'excited' ? 0.35 : 0.15} />
          <ellipse cx={250} cy={222} rx={14} ry={8} fill="#FF7F7F" opacity={mood === 'happy' || mood === 'excited' ? 0.35 : 0.15} />
          {mouth()}
        </g>
        {arm(-1, sL, eL, hL)}
        {arm(1, sR, eR, hR)}
      </g>
    </svg>
  );
};

/** Smooth gesture change between beats (0..1). */
export const gestureMix = (frameInBeat: number) => ease(frameInBeat, 0, 10);
