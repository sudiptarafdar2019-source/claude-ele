import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';
import {C, fonts, grad} from '../brand';
import {ease, pop, shake} from '../lib/motion';
import {itemFrames} from '../lib/timing';
import {Icon} from './Icon';
import {Phone, chatFrames, notifFrames, tapFrame} from './Phone';
import {Prop} from '../types';

export type Theme = 'dark' | 'light' | 'board';
const T = (th: Theme) =>
  th === 'dark'
    ? {card: 'rgba(14,28,64,0.92)', border: C.lineDark, fg: '#fff', sub: C.bodyDark, accent: C.gold, accent2: C.skyText, shadow: '0 30px 80px rgba(0,0,0,0.45)'}
    : th === 'board'
    ? {card: '#fff', border: C.navy, fg: C.navy, sub: C.ink, accent: C.blue, accent2: C.blue, shadow: '0 18px 40px rgba(10,22,51,0.10)'}
    : {card: '#fff', border: C.line, fg: C.navy, sub: C.ink, accent: C.blue, accent2: C.sky, shadow: '0 30px 70px rgba(10,22,51,0.14)'};

const cardBase = (th: Theme): React.CSSProperties => ({
  background: T(th).card, border: th === 'board' ? `5px solid ${C.navy}` : `2px solid ${T(th).border}`, borderRadius: 40, boxShadow: T(th).shadow,
});

/** Every on-screen "thing" a beat can show. Same timing drives the sound effects (propSfx). */
export const PropView: React.FC<{prop: Prop; f: number; dur: number; theme: Theme; width?: number}> = ({prop, f, dur, theme, width = 820}) => {
  const t = T(theme);
  const enter = pop(f, 0, 13);
  const wrap = (child: React.ReactNode) => (
    <div style={{transform: `translateY(${(1 - enter) * 80}px) scale(${0.85 + 0.15 * enter})`, opacity: Math.min(1, enter * 1.4)}}>{child}</div>
  );
  switch (prop.type) {
    case 'phone':
      return wrap(<Phone prop={prop} f={f} dur={dur} width={Math.round(width * 0.62)} />);
    case 'stat':
      return wrap(
        <div style={{...cardBase(theme), padding: '48px 60px', display: 'flex', alignItems: 'center', gap: 40, width}}>
          <div style={{width: 150, height: 150, borderRadius: 40, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: `rotate(${interpolate(pop(f, 4), [0, 1], [-30, 0])}deg)`}}>
            <Icon name={prop.icon ?? 'zap'} size={90} color="#fff" />
          </div>
          <div>
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: prop.value.length > 5 ? 104 : 130, lineHeight: 1, color: t.accent, letterSpacing: '-0.03em'}}>{prop.value}</div>
            <div style={{fontFamily: fonts.body, fontWeight: 500, fontSize: 38, color: t.sub, marginTop: 10, lineHeight: 1.25}}>{prop.label}</div>
          </div>
        </div>,
      );
    case 'card':
      return wrap(
        <div style={{...cardBase(theme), padding: '44px 54px', display: 'flex', alignItems: 'center', gap: 36, width}}>
          <div style={{width: 130, height: 130, borderRadius: 999, background: theme === 'dark' ? 'rgba(232,176,75,0.15)' : '#EAF1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <Icon name={prop.icon ?? 'sparkles'} size={70} color={t.accent} />
          </div>
          <div>
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 58, lineHeight: 1.05, color: t.fg, letterSpacing: '-0.02em'}}>{prop.title}</div>
            {prop.text && <div style={{fontFamily: fonts.body, fontSize: 38, color: t.sub, marginTop: 10}}>{prop.text}</div>}
          </div>
        </div>,
      );
    case 'vs': {
      const win = ease(f, 18, 28);
      const side = (s: any, isWin: boolean, d: number) => {
        const sp = pop(f, d);
        return (
          <div style={{...cardBase(theme), width: width * 0.42, padding: '40px 20px', textAlign: 'center', transform: `scale(${sp * (isWin ? 1 + 0.08 * win : 1 - 0.08 * win)})`, opacity: isWin ? 1 : 1 - 0.45 * win, borderColor: isWin ? t.accent : t.border, borderWidth: isWin ? 5 : 2, position: 'relative'}}>
            <Icon name={s.icon} size={110} color={isWin ? t.accent : t.sub} />
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 60, color: t.fg, marginTop: 14}}>{s.label}</div>
            {!isWin && win > 0 && <div style={{position: 'absolute', left: 30, right: 30, top: '50%', height: 12, borderRadius: 8, background: C.red, transform: `rotate(-12deg) scaleX(${win})`}} />}
          </div>
        );
      };
      return (
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          {side(prop.left, prop.winner === 'left', 0)}
          <div style={{fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 80, color: t.sub}}>vs</div>
          {side(prop.right, prop.winner === 'right', 6)}
        </div>
      );
    }
    case 'icons': {
      const fr = itemFrames(prop.items.length, dur, 4, 9);
      return (
        <div style={{display: 'flex', gap: 26, justifyContent: 'center'}}>
          {prop.items.map((it: any, i: number) => {
            const s = pop(f, fr[i]);
            return (
              <div key={i} style={{...cardBase(theme), width: (width - 52) / 3, padding: '36px 10px', textAlign: 'center', transform: `translateY(${(1 - s) * 60}px) scale(${s * (it.win ? 1.08 : 1)})`, borderColor: it.win ? t.accent : t.border, borderWidth: it.win ? 5 : 2}}>
                <Icon name={it.icon} size={88} color={it.win ? t.accent : t.fg} />
                <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 34, color: t.fg, marginTop: 14, lineHeight: 1.1}}>{it.label}</div>
              </div>
            );
          })}
        </div>
      );
    }
    case 'checklist': {
      const n = prop.items.length;
      const fr = prop.reveal === 'all' ? itemFrames(n, dur, 4, 7) : itemFrames(n, dur, 6, 20);
      return wrap(
        <div style={{...cardBase(theme), padding: '40px 50px', width, display: 'flex', flexDirection: 'column', gap: 26}}>
          {prop.items.map((it: string, i: number) => {
            const s = pop(f, fr[i]);
            const done = !prop.plain && (prop.preDone > i || f >= fr[i] + 4);
            const ck = pop(f, prop.preDone > i ? 0 : fr[i] + 4, 10);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, opacity: s, transform: `translateX(${(1 - s) * -50}px)`}}>
                <div style={{width: 76, height: 76, borderRadius: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? C.green : 'transparent', border: done ? 'none' : `4px solid ${t.sub}`, transform: `scale(${done ? 0.7 + 0.3 * ck : 1})`}}>
                  {done && <Icon name="check" size={54} color="#fff" stroke={3.4} />}
                  {prop.plain && <span style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 40, color: t.fg}}>{i + 1}</span>}
                </div>
                <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 50, color: t.fg, letterSpacing: '-0.01em'}}>{it}</div>
              </div>
            );
          })}
        </div>,
      );
    }
    case 'burn': {
      // the thing gets crossed out, shakes, then burns away
      const cross = ease(f, 10, 18);
      const burnStart = Math.max(26, Math.round(dur * 0.55));
      const b = ease(f, burnStart, burnStart + 16);
      const sh = shake(f, 10, 10, 10);
      return (
        <div style={{position: 'relative', width, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: `translate(${sh.x}px,${sh.y}px) scale(${(0.85 + 0.15 * enter) * (1 - 0.35 * b)}) rotate(${-3 + b * 8}deg)`, opacity: enter * (1 - b), filter: `sepia(${b}) saturate(${1 + b * 3}) blur(${b * 6}px)`}}>
            {prop.button ? (
              <div style={{padding: '34px 80px', borderRadius: 999, background: '#9AA3B5', color: '#fff', fontFamily: fonts.body, fontWeight: 700, fontSize: 74, position: 'relative'}}>
                {prop.text}
                <div style={{position: 'absolute', left: -20, right: -20, top: '48%', height: 14, borderRadius: 8, background: C.red, transform: `rotate(-6deg) scaleX(${cross})`, transformOrigin: 'left'}} />
              </div>
            ) : (
              <div style={{...cardBase(theme), padding: '44px 56px', maxWidth: width, display: 'flex', alignItems: 'center', gap: 30, position: 'relative'}}>
                {prop.icon && <Icon name={prop.icon} size={80} color={t.sub} />}
                <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: prop.text.length > 18 ? 58 : 68, color: t.fg, lineHeight: 1.1}}>“{prop.text}”</div>
                <div style={{position: 'absolute', left: 20, right: 20, top: '50%', height: 14, borderRadius: 8, background: C.red, transform: `rotate(-4deg) scaleX(${cross})`, transformOrigin: 'left'}} />
              </div>
            )}
          </div>
          <Flames f={f - burnStart + 4} />
        </div>
      );
    }
    case 'button': {
      const s = pop(f, 2, 9);
      const glow = 0.5 + 0.5 * Math.sin(f / 5);
      return (
        <div style={{padding: '40px 84px', borderRadius: 999, background: grad, color: '#fff', fontFamily: fonts.heading, fontWeight: 800, fontSize: 72, transform: `scale(${s})`, boxShadow: `0 0 ${40 + glow * 40}px rgba(25,167,255,${0.4 + glow * 0.3})`, display: 'flex', alignItems: 'center', gap: 24}}>
          {prop.text} <Icon name="arrow-right" size={70} color="#fff" stroke={3} />
        </div>
      );
    }
    case 'numbers': {
      const fr = itemFrames(prop.items.length, dur, 4, 6);
      return (
        <div style={{textAlign: 'center'}}>
          <div style={{display: 'flex', gap: 20, justifyContent: 'center'}}>
            {prop.items.map((n: string, i: number) => {
              const s = pop(f, fr[i]);
              const bob = Math.sin((f - fr[i]) / 6 + i) * 6;
              return <div key={i} style={{width: 140, height: 140, borderRadius: 40, ...cardBase(theme), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.heading, fontWeight: 800, fontSize: 80, color: t.accent, transform: `translateY(${(1 - s) * 60 + bob}px) scale(${s})`}}>{n}</div>;
            })}
          </div>
          <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 46, color: t.fg, marginTop: 30, opacity: ease(f, 14, 24)}}>{prop.label}</div>
        </div>
      );
    }
    case 'countdown': {
      const per = Math.max(10, Math.min(18, Math.floor((dur - 10) / prop.from)));
      const k = Math.min(prop.from - 1, Math.floor(f / per));
      const n = prop.from - k;
      const local = f - k * per;
      const s = pop(local, 0, 9);
      const ring = ease(f, 0, per * prop.from, 0, 1);
      return (
        <div style={{position: 'relative', width: 420, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={420} height={420} style={{position: 'absolute', transform: 'rotate(-90deg)'}}>
            <circle cx={210} cy={210} r={180} stroke={theme === 'dark' ? C.lineDark : C.line} strokeWidth={22} fill="none" />
            <circle cx={210} cy={210} r={180} stroke={C.blue} strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 180} strokeDashoffset={2 * Math.PI * 180 * ring} />
          </svg>
          <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 250, color: t.fg, transform: `scale(${0.5 + 0.5 * s})`}}>{n}</div>
        </div>
      );
    }
    case 'chips': {
      const fr = itemFrames(prop.items.length, dur, 6, 14);
      return (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'center', width}}>
          {prop.items.map((c: string, i: number) => {
            const s = pop(f, fr[i]);
            return (
              <div key={i} style={{...cardBase(theme), borderRadius: 999, padding: '26px 42px', display: 'flex', alignItems: 'center', gap: 16, transform: `scale(${s}) rotate(${(i % 2 ? 2 : -2) * s}deg)`, fontFamily: fonts.heading, fontWeight: 700, fontSize: 54, color: t.fg}}>
                {prop.icon && <Icon name={prop.icon} size={44} color={t.accent} />} {c}
              </div>
            );
          })}
        </div>
      );
    }
    case 'chip':
      return wrap(
        <div style={{...cardBase(theme), borderRadius: 999, padding: '24px 40px', display: 'flex', alignItems: 'center', gap: 18, fontFamily: fonts.heading, fontWeight: 700, fontSize: 44, color: t.fg}}>
          <Icon name={prop.icon ?? 'sparkles'} size={48} color={t.accent} /> {prop.text}
        </div>,
      );
    case 'step':
      return wrap(
        <div style={{...cardBase(theme), padding: '50px 54px', width, display: 'flex', flexDirection: 'column', gap: 26}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
            <div style={{width: 140, height: 140, borderRadius: 38, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: `scale(${pop(f, 5, 9)})`}}>
              <Icon name={prop.icon} size={84} color="#fff" />
            </div>
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 66, lineHeight: 1.02, color: t.fg, letterSpacing: '-0.02em'}}>{prop.title}</div>
          </div>
          <div style={{fontFamily: fonts.body, fontSize: 40, lineHeight: 1.3, color: t.sub, opacity: ease(f, 10, 20)}}>{prop.text}</div>
        </div>,
      );
    case 'intro':
      return wrap(
        <div style={{...cardBase(theme), padding: '44px 50px', width, display: 'flex', alignItems: 'center', gap: 36}}>
          <div style={{width: 190, height: 190, borderRadius: 999, overflow: 'hidden', background: grad, flexShrink: 0, border: `6px solid ${t.accent}`}}>
            <Img src={staticFile('img/faces/03-thumbs-up.webp')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%'}} />
          </div>
          <div>
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 56, color: t.fg}}>{prop.name}</div>
            <div style={{fontFamily: fonts.body, fontWeight: 600, fontSize: 34, color: t.accent, marginTop: 4}}>{prop.role}</div>
            <div style={{fontFamily: fonts.body, fontSize: 32, color: t.sub, marginTop: 14, lineHeight: 1.3}}>{prop.text}</div>
          </div>
        </div>,
      );
    case 'cta':
      return wrap(
        <div style={{...cardBase(theme), padding: '40px 50px', width, display: 'flex', alignItems: 'center', gap: 32}}>
          <div style={{width: 120, height: 120, borderRadius: 999, background: theme === 'dark' ? C.gold : C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: `rotate(${Math.sin(f / 4) * 8}deg)`}}>
            <Icon name={prop.icon ?? 'bell'} size={64} color={theme === 'dark' ? C.navy : '#fff'} />
          </div>
          <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 54, lineHeight: 1.1, color: t.fg}}>{prop.text}</div>
        </div>,
      );
    case 'tiles': {
      const fr = itemFrames(prop.items.length, dur, 4, 10);
      const broken = !!prop.broken;
      return (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width}}>
          {prop.items.map((it: any, i: number) => {
            const s = pop(f, broken ? 0 : fr[i]);
            const jitter = broken ? Math.sin(f * 1.3 + i * 2) * 6 * ease(f, 4, 10) : 0;
            const drift = broken ? ease(f, 6, 30) * (i % 2 ? 26 : -26) : 0;
            return (
              <div key={i} style={{...cardBase(theme), padding: '30px 24px', display: 'flex', alignItems: 'center', gap: 20, transform: `translate(${drift + jitter}px, ${(1 - s) * 50}px) rotate(${broken ? (i % 2 ? 3 : -3) * ease(f, 6, 20) : 0}deg) scale(${s})`, borderColor: broken ? C.red : t.border, borderWidth: broken ? 3 : 2}}>
                <Icon name={it.icon} size={60} color={broken ? C.red : t.accent} />
                <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 40, color: t.fg}}>{it.label}</div>
                {broken && <Icon name="unlink" size={40} color={C.red} style={{marginLeft: 'auto'}} />}
              </div>
            );
          })}
        </div>
      );
    }
    case 'orbit': {
      const R = 250;
      const rot = f * 0.9;
      const s = pop(f, 0);
      return (
        <div style={{position: 'relative', width: 760, height: 760, transform: `scale(${0.72 + 0.16 * s})`, opacity: s}}>
          <div style={{position: 'absolute', inset: 80, borderRadius: 999, border: `3px dashed ${t.accent2}`, opacity: 0.6, transform: `rotate(${rot}deg)`}} />
          <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, borderRadius: 999, background: 'radial-gradient(circle at 35% 30%, #5CC1FF, #0052FF 60%, #0A1633)', boxShadow: '0 0 90px rgba(25,167,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 52, color: '#fff'}}>Orbirise</div>
          </div>
          {prop.items.map((it: any, i: number) => {
            const a = ((i / prop.items.length) * 360 + rot) * (Math.PI / 180);
            const si = pop(f, 6 + i * 5);
            const x = 380 + Math.cos(a) * R * si, y = 380 + Math.sin(a) * R * si;
            return (
              <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${si})`, ...cardBase(theme), borderRadius: 999, padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 12, borderColor: C.green, borderWidth: 3}}>
                <Icon name={it.icon} size={40} color={t.accent} />
                <span style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, color: t.fg}}>{it.label}</span>
              </div>
            );
          })}
        </div>
      );
    }
    case 'flow': {
      const fr = itemFrames(prop.items.length, dur, 4, 16);
      return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width}}>
          {prop.items.map((it: any, i: number) => {
            const s = pop(f, fr[i]);
            return (
              <React.Fragment key={i}>
                {i > 0 && <div style={{opacity: s}}><Icon name="arrow-down" size={54} color={t.accent2} /></div>}
                <div style={{...cardBase(theme), padding: '26px 40px', display: 'flex', alignItems: 'center', gap: 26, width: width * 0.92, transform: `scale(${s})`, opacity: s}}>
                  <div style={{width: 90, height: 90, borderRadius: 26, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}><Icon name={it.icon} size={54} color="#fff" /></div>
                  <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 42, color: t.fg}}>{it.label}</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      );
    }
    default:
      return null;
  }
};

const Flames: React.FC<{f: number}> = ({f}) => {
  if (f < 0 || f > 40) return null;
  const a = ease(f, 0, 6) * (1 - ease(f, 24, 40));
  return (
    <div style={{position: 'absolute', left: '50%', top: '55%', transform: 'translate(-50%,-50%)', opacity: a}}>
      {[0, 1, 2, 3, 4].map((i) => {
        const h = 160 + Math.sin(f * 0.9 + i * 1.7) * 50;
        return <div key={i} style={{position: 'absolute', left: (i - 2) * 90 - 50, top: -h / 2, width: 100, height: h, borderRadius: '50% 50% 40% 40% / 70% 70% 30% 30%', background: 'radial-gradient(circle at 50% 75%, #FFF3B0 0%, #FFB020 35%, #FF5A1F 65%, rgba(255,60,0,0) 75%)', filter: 'blur(4px)', mixBlendMode: 'screen'}} />;
      })}
    </div>
  );
};

/** Soft sounds a prop makes, in frames from the start of its beat (quiet; the mix "sfx" level scales them). */
export const propSfx = (prop: Prop | undefined, dur: number): {f: number; src: string; vol: number}[] => {
  if (!prop || prop.sfx === 'none') return [];
  const out: {f: number; src: string; vol: number}[] = [];
  const first = (fr: number[], src: string, vol: number) => fr.forEach((f, i) => out.push({f, src, vol: i === 0 ? vol : vol * 0.7}));
  switch (prop.type) {
    case 'phone':
      if (prop.screen === 'notifications') first(notifFrames(prop, dur), 'soft-pop-2', 0.4);
      if (prop.screen === 'chat') first(chatFrames(prop, dur), 'soft-pop', 0.35);
      if (prop.tap) out.push({f: tapFrame(dur), src: 'soft-tick', vol: 0.6});
      break;
    case 'checklist': {
      const n = prop.items.length;
      const fr = prop.reveal === 'all' ? itemFrames(n, dur, 4, 7) : itemFrames(n, dur, 6, 20);
      first(fr.map((f) => (prop.plain ? f : f + 4)), 'soft-tick', 0.45);
      break;
    }
    case 'icons':
    case 'chips':
    case 'tiles':
      first(itemFrames(prop.items.length, dur, 4, 12), 'soft-pop', 0.35);
      break;
    case 'numbers':
      first(itemFrames(prop.items.length, dur, 4, 8), 'soft-tick', 0.4);
      break;
    case 'flow':
      first(itemFrames(prop.items.length, dur, 4, 16), 'soft-tick', 0.4);
      break;
    case 'countdown': {
      const per = Math.max(10, Math.min(18, Math.floor((dur - 10) / prop.from)));
      for (let k = 0; k < prop.from; k++) out.push({f: k * per, src: 'soft-tick', vol: 0.45});
      break;
    }
    case 'vs':
    case 'stat':
    case 'button':
    case 'cta':
      out.push({f: 6, src: 'soft-chime-2', vol: 0.35});
      break;
    case 'burn':
      out.push({f: Math.max(26, Math.round(dur * 0.55)), src: 'soft-swell', vol: 0.4});
      break;
    case 'orbit':
      out.push({f: 0, src: 'soft-swell', vol: 0.35});
      break;
  }
  return out;
};
