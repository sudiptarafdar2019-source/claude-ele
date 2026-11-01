import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../brand';
import {ease, rnd} from '../lib/motion';
import {Badge, Shot} from '../lib/visuals';
import {Icon} from './Icon';

/**
 * One animated picture (no text): a big icon that draws itself in, sits in a glowing
 * badge, floats, has small related icons orbiting it, and a tick / cross / trophy when
 * the shot needs one. A new one every shot (1-2 s), with a smooth swap.
 */
export const IconHero: React.FC<{icon: string; f: number; size?: number; dark?: boolean; badge?: Badge; sat?: string[]; seed?: number; accent?: string}> = ({icon, f, size = 360, dark = true, badge, sat = [], seed = 1, accent}) => {
  const frame = useCurrentFrame();
  const inT = ease(f, 0, 12);
  const draw = ease(f, 2, 22);
  const float = Math.sin((frame + seed * 20) / 16) * 10;
  const tilt = Math.sin((frame + seed * 13) / 30) * 3;
  const PALS = [['#2F6BFF', '#0040D6'], ['#F4C063', '#D9952B'], ['#38BDF8', '#0E7FD1'], ['#FFFFFF', '#DCE6FF']];
  const pal = PALS[seed % PALS.length];
  const col = accent ?? (dark ? C.gold : C.blue);
  const iconCol = pal[0] === '#FFFFFF' ? C.blue : '#FFFFFF';
  const ring = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,82,255,0.10)';
  const bg = `linear-gradient(150deg, ${pal[0]} 0%, ${pal[1]} 100%)`;
  return (
    <div style={{position: 'relative', width: size * 1.6, height: size * 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${float + (1 - inT) * 60}px) scale(${0.7 + 0.3 * inT}) rotate(${tilt}deg)`, opacity: inT}}>
      {/* pulse rings */}
      {[0, 1].map((r) => {
        const p = ((frame + r * 30 + seed * 7) % 60) / 60;
        return <div key={r} style={{position: 'absolute', width: size * (1 + p * 0.55), height: size * (1 + p * 0.55), borderRadius: 999, border: `4px solid ${col}`, opacity: (1 - p) * 0.35}} />;
      })}
      <div style={{position: 'absolute', width: size * 1.35, height: size * 1.35, borderRadius: 999, border: `3px dashed ${ring}`, transform: `rotate(${frame * 0.6}deg)`}} />
      {/* badge */}
      <div style={{width: size, height: size, borderRadius: size * 0.3, background: bg, boxShadow: dark ? '0 40px 90px rgba(0,0,0,0.45), inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -10px 30px rgba(0,0,0,0.15)' : '0 30px 70px rgba(10,22,51,0.18), inset 0 3px 0 rgba(255,255,255,0.4), inset 0 -10px 30px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${(1 - inT) * -12}deg)`}}>
        <div style={{strokeDasharray: 120, strokeDashoffset: 120 * (1 - draw)} as React.CSSProperties}>
          <Icon name={icon} size={size * 0.58} color={iconCol} stroke={2.2} />
        </div>
      </div>
      {/* orbiting satellites */}
      {(badge ? [] : sat).slice(0, 2).map((s, i) => {
        const a = (frame * 1.2 + i * 180 + seed * 40) * (Math.PI / 180);
        const st = ease(f, 8 + i * 6, 20 + i * 6);
        const R = size * 1.0;
        return (
          <div key={s + i} style={{position: 'absolute', left: '50%', top: '50%', width: size * 0.34, height: size * 0.34, marginLeft: -size * 0.17, marginTop: -size * 0.17, transform: `translate(${Math.cos(a) * R}px, ${Math.sin(a) * R * 0.55}px) scale(${st})`, borderRadius: 999, background: dark ? '#fff' : C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(0,0,0,0.25)'}}>
            <Icon name={s} size={size * 0.18} color={dark ? C.blue : '#fff'} stroke={2.4} />
          </div>
        );
      })}
      {/* sparkles */}
      {Array.from({length: 6}).map((_, i) => {
        const a = rnd(seed * 10 + i) * Math.PI * 2;
        const d = size * (0.7 + rnd(i + seed) * 0.35);
        const tw = (Math.sin((frame + i * 11) / 7) + 1) / 2;
        return <div key={i} style={{position: 'absolute', left: '50%', top: '50%', width: 12, height: 12, borderRadius: 99, background: i % 2 ? col : (dark ? '#fff' : C.sky), transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(${0.4 + tw * 0.8 * inT})`, opacity: 0.8}} />;
      })}
      {badge && <BadgeMark kind={badge} f={f} size={size} />}
    </div>
  );
};

const BadgeMark: React.FC<{kind: Badge; f: number; size: number}> = ({kind, f, size}) => {
  const t = ease(f, 14, 24);
  const m = {check: {bg: '#22C55E', icon: 'check'}, cross: {bg: '#EF4444', icon: 'x'}, win: {bg: C.gold, icon: 'trophy'}}[kind!];
  return (
    <div style={{position: 'absolute', right: size * 0.18, top: size * 0.18, width: size * 0.36, height: size * 0.36, borderRadius: 999, background: m.bg, border: '8px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${t}) rotate(${(1 - t) * -40}deg)`, boxShadow: '0 16px 30px rgba(0,0,0,0.3)'}}>
      <Icon name={m.icon} size={size * 0.2} color="#fff" stroke={3.2} />
    </div>
  );
};

/** Plays the shot list: each shot's icon swaps in with a soft cross-move. */
export const ShotStage: React.FC<{shot: Shot; prev?: Shot; frame: number; size?: number; dark?: boolean}> = ({shot, prev, frame, size, dark}) => {
  const f = frame - shot.from;
  const out = 1 - ease(f, 0, 8);
  const dir = shot.layout % 2 ? 1 : -1;
  return (
    <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {prev && out > 0 && (
        <div style={{position: 'absolute', opacity: out, transform: `translateX(${(1 - out) * 160 * dir}px) scale(${0.9 + 0.1 * out})`}}>
          <IconHero icon={prev.icon} f={frame - prev.from} size={size} dark={dark} badge={prev.badge} sat={prev.sat} seed={prev.layout + 1} />
        </div>
      )}
      <div style={{position: 'absolute', transform: `translateX(${out * -160 * dir}px)`}}>
        <IconHero icon={shot.icon} f={f} size={size} dark={dark} badge={shot.badge} sat={shot.sat} seed={shot.layout + 1} />
      </div>
    </div>
  );
};
