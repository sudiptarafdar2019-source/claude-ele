import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {getPointAtLength} from '@remotion/paths';
import {fonts} from '../../brand';
import {ease} from '../../lib/motion';
import {faceSrc} from '../../lib/faces';
import {Built, El, Ink} from './engine';

/** Board looks: whiteboard, green chalkboard, warm notebook paper, blueprint. */
export type BoardStyle = 'white' | 'chalk' | 'paper' | 'blueprint';

type Theme = {bg: React.ReactNode; ink: Record<Ink, string>; fillOp: number; rough: number; dark: boolean; chalk?: boolean};

export const THEMES: Record<BoardStyle, Theme> = {
  white: {
    bg: (
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F3F5F9 70%, #E5E9F0 100%)'}}>
        <AbsoluteFill style={{backgroundImage: 'linear-gradient(115deg, rgba(10,22,51,0.025) 0%, rgba(255,255,255,0) 40%, rgba(10,22,51,0.03) 70%, rgba(255,255,255,0) 100%)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, background: 'linear-gradient(#C9CFD8, #AEB5C0)'}} />
      </AbsoluteFill>
    ),
    ink: {ink: '#1B2440', blue: '#1F5BFF', sky: '#5CC1FF', gold: '#F2B544', red: '#E5484D', green: '#1FA67A', skin: '#F6D2B4', soft: '#C3CAD6', paper: '#FFFFFF', pink: '#FF7A9A'},
    fillOp: 1, rough: 3.5, dark: false,
  },
  chalk: {
    bg: (
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 35%, #2F4A3E 0%, #253C32 60%, #1C2E26 100%)'}}>
        <AbsoluteFill style={{opacity: 0.18, backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1.5px)', backgroundSize: '7px 7px'}} />
        <AbsoluteFill style={{opacity: 0.12, backgroundImage: 'linear-gradient(100deg, rgba(255,255,255,0.25), transparent 30%, rgba(255,255,255,0.18) 55%, transparent 80%)'}} />
        <AbsoluteFill style={{border: '26px solid #8A5A35', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'}} />
      </AbsoluteFill>
    ),
    ink: {ink: '#F4F1E8', blue: '#8EC5FF', sky: '#A9DCFF', gold: '#FFD480', red: '#FF8F8F', green: '#A6F0B5', skin: '#F9DEC9', soft: '#9FB3A9', paper: '#3A5649', pink: '#FFB3C7'},
    fillOp: 0.55, rough: 4.5, dark: true, chalk: true,
  },
  paper: {
    bg: (
      <AbsoluteFill style={{background: '#FBF6EA'}}>
        <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(70,110,180,0.13) 2px, transparent 2px)', backgroundSize: '100% 56px'}} />
        <div style={{position: 'absolute', left: 92, top: 0, bottom: 0, width: 3, background: 'rgba(229,72,77,0.35)'}} />
        <AbsoluteFill style={{boxShadow: 'inset 0 0 120px rgba(150,110,40,0.18)'}} />
      </AbsoluteFill>
    ),
    ink: {ink: '#2B2A33', blue: '#2F6BFF', sky: '#7CCBFF', gold: '#F4B740', red: '#E14B4B', green: '#2AA876', skin: '#F7D3B5', soft: '#C8C2B4', paper: '#FFFDF7', pink: '#FF8AA6'},
    fillOp: 0.9, rough: 3, dark: false,
  },
  blueprint: {
    bg: (
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, #1F63C9 0%, #134EA8 70%, #0D3C86 100%)'}}>
        <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.10) 2px, transparent 2px)', backgroundSize: '60px 60px'}} />
      </AbsoluteFill>
    ),
    ink: {ink: '#FFFFFF', blue: '#9FD3FF', sky: '#C8E8FF', gold: '#FFD27A', red: '#FF9A9A', green: '#9CF2C0', skin: '#FFE3CF', soft: '#7FA6DF', paper: '#2A6CD0', pink: '#FFB8CB'},
    fillOp: 0.5, rough: 3, dark: true,
  },
};

const cur = (els: El[], f: number) => els.find((e) => (e.kind === 'stroke' || e.kind === 'glyph') && f >= e.t0 && f < e.t1);

/** Where the marker tip is at frame f (scene time), or null when the hand is away. Board-box coordinates. */
export const handTip = (built: Built, f: number): {x: number; y: number; away: number} => {
  const OFF = {x: 1150, y: 1300};
  if (built.reveal === 'paint') {
    const p = Math.min(1, f / Math.max(1, built.total));
    const away = f < 0 ? 1 : p >= 1 ? ease(f - built.total, 0, 14) : 0;
    return {x: p * 1000, y: 550 + Math.sin(f / 2.2) * 420, away};
  }
  const strokes = built.els.filter((e) => e.kind === 'stroke' || e.kind === 'glyph') as Extract<El, {t1: number}>[];
  const end = (e: any) => (e.kind === 'stroke' ? getPointAtLength(e.d, e.len) : {x: e.x + 30, y: e.y});
  const start = (e: any) => (e.kind === 'stroke' ? getPointAtLength(e.d, 0) : {x: e.x - 30, y: e.y});
  const c = cur(built.els, f) as any;
  if (c) {
    if (c.kind === 'stroke') {
      const p = (f - c.t0) / (c.t1 - c.t0);
      const pt = getPointAtLength(c.d, c.len * Math.min(1, Math.max(0, p)));
      return {x: pt.x, y: pt.y, away: 0};
    }
    const p = (f - c.t0) / (c.t1 - c.t0);
    return {x: c.x - c.size * 0.3 + p * c.size * 0.6, y: c.y - c.size * 0.4 + Math.sin(p * 9) * c.size * 0.25, away: 0};
  }
  let prev: any = null, next: any = null;
  for (const e of strokes) { if (e.t1 <= f && (!prev || e.t1 > prev.t1)) prev = e; if (e.t0 > f && (!next || e.t0 < next.t0)) next = e; }
  if (!prev && !next) return {...OFF, away: 1};
  if (!prev) { const s = start(next); return {x: s.x, y: s.y, away: 1 - ease(f, next.t0 - 12, next.t0)}; }
  const pe = end(prev);
  if (next && next.t0 - prev.t1 <= 14) {
    const ns = start(next);
    const k = ease(f, prev.t1, next.t0);
    return {x: pe.x + (ns.x - pe.x) * k, y: pe.y + (ns.y - pe.y) * k, away: 0};
  }
  const outA = ease(f, prev.t1 + 6, prev.t1 + 20);
  const inA = next ? 1 - ease(f, next.t0 - 14, next.t0) : 1;
  const away = Math.min(outA, inA);
  const target = next && f > next.t0 - 14 ? start(next) : pe;
  return {x: target.x, y: target.y, away};
};

/** Renders a built drawing at scene frame f. */
export const SketchView: React.FC<{built: Built; f: number; style: BoardStyle; id: string}> = ({built, f, style, id}) => {
  const T = THEMES[style];
  const col = (c: Ink) => T.ink[c];
  const paint = built.reveal === 'paint';
  const pr = paint ? Math.min(1, Math.max(0, f / Math.max(1, built.total))) : 1;
  const fe = paint ? 1e6 : f;
  const rows = built.groups.map((g, gi) => {
    const els = built.els.filter((e) => e.g === gi);
    if (!els.length) return null;
    return (
      <g key={gi} transform={g.anim ? g.anim(f) : undefined}>
        {els.map((e, i) => {
          if (e.kind === 'fill') {
            const o = ease(fe, e.t0, e.t0 + 8);
            if (o <= 0) return null;
            return <path key={i} d={e.d} fill={col(e.c)} opacity={o * e.op * T.fillOp} stroke="none" />;
          }
          return null;
        })}
        {els.map((e, i) => {
          if (e.kind === 'stroke') {
            const p = Math.min(1, Math.max(0, (fe - e.t0) / (e.t1 - e.t0)));
            if (p <= 0) return null;
            return <path key={i} d={e.d} fill="none" stroke={col(e.c)} strokeWidth={e.w * (T.chalk ? 1.15 : 1)} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={T.chalk ? 0.92 : 1} />;
          }
          if (e.kind === 'glyph') {
            const p = Math.min(1, Math.max(0, (fe - e.t0) / (e.t1 - e.t0)));
            if (p <= 0) return null;
            return (
              <g key={i} clipPath={`url(#${id}-gc${i})`}>
                <defs><clipPath id={`${id}-gc${i}`}><rect x={e.x - e.size} y={e.y - e.size * 1.1} width={e.size * 2 * p} height={e.size * 1.5} /></clipPath></defs>
                <text x={e.x} y={e.y} fontFamily={fonts.hand} fontWeight={700} fontSize={e.size} fill={col(e.c)} textAnchor="middle" transform={e.rot ? `rotate(${e.rot} ${e.x} ${e.y})` : undefined}>{e.text}</text>
              </g>
            );
          }
          return null;
        })}
      </g>
    );
  });
  const photos = built.els.filter((e) => e.kind === 'photo') as Extract<El, {kind: 'photo'}>[];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg viewBox="0 0 1000 1100" width={1000} height={1100} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={T.chalk ? 0.9 : 0.04} numOctaves={2} seed={4} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={T.rough} />
          </filter>
          {paint && <clipPath id={`${id}-paint`}><rect x={-50} y={-50} width={pr * 1100} height={1300} /></clipPath>}
        </defs>
        <g filter={`url(#${id}-rough)`} clipPath={paint ? `url(#${id}-paint)` : undefined}>{rows}</g>
      </svg>
      {photos.map((p, i) => {
        const k = ease(f, p.t0, p.t0 + 12);
        if (k <= 0) return null;
        return (
          <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: p.w, transform: `translate(${(1 - k) * 700}px, ${(1 - k) * 300}px) rotate(${p.rot + (1 - k) * 20}deg)`, background: '#fff', padding: '14px 14px 46px', boxShadow: '0 22px 40px rgba(0,0,0,0.3)', borderRadius: 6}}>
            <div style={{width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: 'linear-gradient(160deg, #DCE8FF, #F4F8FF)', borderRadius: 3, position: 'relative'}}>
              <Img src={staticFile(faceSrc(p.face))} style={{position: 'absolute', left: '50%', top: '4%', height: '150%', transform: 'translateX(-50%)'}} />
            </div>
            {/* tape */}
            <div style={{position: 'absolute', left: '50%', top: -18, width: 120, height: 38, marginLeft: -60, background: 'rgba(242,181,68,0.75)', transform: 'rotate(-6deg)', opacity: ease(f, p.t0 + 10, p.t0 + 14)}} />
          </div>
        );
      })}
    </div>
  );
};
