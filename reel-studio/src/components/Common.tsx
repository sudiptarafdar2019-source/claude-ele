import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {C, fonts, grad} from '../brand';
import {ease, pop, rnd, shake} from '../lib/motion';
import {Icon} from './Icon';

/** Renders text with one phrase coloured (e.g. hookHighlight). */
export const Hi: React.FC<{text: string; hi?: string; color: string; serif?: boolean}> = ({text, hi, color, serif}) => {
  if (!hi) return <>{text}</>;
  const i = text.toLowerCase().indexOf(hi.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span style={{color, fontFamily: serif ? fonts.serif : undefined, fontWeight: serif ? 400 : undefined, fontStyle: serif ? 'italic' : undefined}}>{text.slice(i, i + hi.length)}</span>
      {text.slice(i + hi.length)}
    </>
  );
};

export const DarkBg: React.FC<{warm?: boolean}> = ({warm}) => {
  const f = useCurrentFrame();
  const x = 50 + Math.sin(f / 90) * 12, y = 42 + Math.cos(f / 110) * 8;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at ${x}% ${y}%, ${warm ? 'rgba(232,176,75,0.28)' : 'rgba(0,82,255,0.55)'} 0%, rgba(7,19,48,0) 46%), radial-gradient(circle at ${100 - x}% ${90 - y / 3}%, rgba(25,167,255,0.25) 0%, rgba(7,19,48,0) 40%), linear-gradient(180deg, #081638 0%, ${C.space} 55%, #050d24 100%)`}}>
      <Grid color="rgba(255,255,255,0.045)" />
      <Grain />
    </AbsoluteFill>
  );
};

export const LightBg: React.FC = () => {
  const f = useCurrentFrame();
  const x = 20 + Math.sin(f / 80) * 6;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at ${x}% 18%, rgba(25,167,255,0.18) 0%, rgba(245,248,252,0) 38%), radial-gradient(circle at ${90 - x / 2}% 78%, rgba(0,82,255,0.12) 0%, rgba(245,248,252,0) 40%), linear-gradient(180deg, #FFFFFF 0%, ${C.cloud} 100%)`}}>
      <Dots />
    </AbsoluteFill>
  );
};

export const Grid: React.FC<{color: string}> = ({color}) => (
  <AbsoluteFill style={{backgroundImage: `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)`, backgroundSize: '90px 90px', maskImage: 'radial-gradient(circle at 50% 40%, black 0%, transparent 75%)'}} />
);
export const Dots: React.FC = () => (
  <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(10,22,51,0.09) 2.5px, transparent 2.5px)', backgroundSize: '44px 44px', maskImage: 'radial-gradient(circle at 50% 45%, black 10%, transparent 80%)'}} />
);
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' seed='${f % 6}'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`}} />
  );
};

/** Thin progress line across the top: keeps viewers watching. */
export const ProgressBar: React.FC<{color?: string; track?: string}> = ({color = grad, track = 'rgba(255,255,255,0.12)'}) => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: track}}>
      <div style={{width: `${(f / durationInFrames) * 100}%`, height: '100%', background: color, boxShadow: '0 0 18px rgba(25,167,255,0.7)'}} />
    </div>
  );
};

/** Name pill with a live audio waveform, like the reference reels. */
export const NamePill: React.FC<{voice: string; dark?: boolean; label?: string; avatar?: string}> = ({voice, dark, label = 'Sudip · Orbirise', avatar = 'img/faces/01-neutral.webp'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audio = useAudioData(staticFile(voice));
  const bars = audio ? visualizeAudio({fps, frame: f, audioData: audio, numberOfSamples: 16}).slice(1, 6) : [0, 0, 0, 0, 0];
  const s = pop(f, 4);
  return (
    <div style={{position: 'absolute', top: 120, left: '50%', transform: `translateX(-50%) scale(${s})`, display: 'flex', alignItems: 'center', gap: 14, padding: '10px 26px 10px 10px', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.10)' : '#FFFFFF', border: dark ? '1.5px solid rgba(255,255,255,0.18)' : `1.5px solid ${C.line}`, boxShadow: dark ? 'none' : '0 10px 30px rgba(10,22,51,0.10)', backdropFilter: 'blur(10px)'}}>
      <div style={{width: 58, height: 58, borderRadius: 999, overflow: 'hidden', background: grad}}>
        <Img src={staticFile(avatar)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 10%'}} />
      </div>
      <span style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, color: dark ? '#fff' : C.navy}}>{label}</span>
      <div style={{display: 'flex', gap: 5, alignItems: 'center', height: 34}}>
        {bars.map((b, i) => (
          <div key={i} style={{width: 6, borderRadius: 4, height: 8 + Math.min(26, b * 160), background: i % 2 ? C.sky : C.blue}} />
        ))}
      </div>
    </div>
  );
};

/** Big hook text for the first ~2.4 seconds. */
export const HookTitle: React.FC<{text: string; hi?: string; dark?: boolean; until: number; top?: number}> = ({text, hi, dark, until, top = 300}) => {
  const f = useCurrentFrame();
  if (f > until) return null;
  const s = ease(f, 0, 14);
  const out = ease(f, until - 9, until);
  const sh = {x: 0, y: (1 - s) * 40};
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top, textAlign: 'center', transform: `translate(${sh.x}px, ${sh.y + out * -60}px) scale(${0.92 + 0.08 * s})`, opacity: Math.min(s, 1 - out)}}>
      <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: text.length > 26 ? 92 : 112, lineHeight: 1.02, letterSpacing: '-0.03em', color: dark ? '#fff' : C.navy, textShadow: dark ? '0 10px 40px rgba(0,0,0,0.5)' : 'none'}}>
        <Hi text={text} hi={hi} color={dark ? C.gold : C.blue} />
      </div>
    </div>
  );
};

/** Closing card with logo and the call to action. */
export const EndCard: React.FC<{from: number; cta?: {text: string; sub?: string}; dark?: boolean}> = ({from, cta, dark = true}) => {
  const f = useCurrentFrame() - from;
  if (f < 0) return null;
  const bg = ease(f, 0, 10);
  const s = pop(f, 3, 11);
  const s2 = pop(f, 10, 12);
  return (
    <AbsoluteFill style={{background: dark ? `rgba(7,19,48,${0.92 * bg})` : `rgba(255,255,255,${0.94 * bg})`, backdropFilter: `blur(${12 * bg}px)`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: `scale(${s})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 46}}>
        <Img src={staticFile(dark ? 'img/brand/logo-white.png' : 'img/brand/logo-dark.png')} style={{width: 620}} />
        {/* follow / save / share, as pictures (no text) */}
        <div style={{display: 'flex', gap: 40, transform: `translateY(${(1 - s2) * 60}px)`, opacity: s2}}>
          {['user-plus', 'bookmark', 'send'].map((ic, i) => {
            const k = pop(f, 10 + i * 5, 12);
            return (
              <div key={ic} style={{width: 150, height: 150, borderRadius: 44, background: i === 0 ? (dark ? C.gold : C.blue) : dark ? 'rgba(255,255,255,0.12)' : '#EAF1FF', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k}) translateY(${Math.sin((f + i * 8) / 8) * 6}px)`, boxShadow: '0 20px 50px rgba(0,0,0,0.25)'}}>
                <Icon name={ic} size={76} color={i === 0 ? (dark ? C.navy : '#fff') : dark ? '#fff' : C.blue} stroke={2.4} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Camera: punch-in on every cut plus a slow push, so graphics never sit still. */
export const Camera: React.FC<{cutFrame: number; index: number; children: React.ReactNode; strength?: number}> = ({cutFrame, index, children, strength = 1}) => {
  const f = useCurrentFrame();
  const t = f - cutFrame;
  const punch = interpolate(t, [0, 12], [1.02, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.36, 1)});
  const push = 1 + Math.min(t, 180) * 0.00012;
  const dx = (rnd(index + 1) - 0.5) * 8 * strength;
  return <AbsoluteFill style={{transform: `scale(${1 + (punch * push - 1) * strength}) translateX(${dx}px)`}}>{children}</AbsoluteFill>;
};

/** A white flash for 2 frames on a cut (used sparingly). */
export const Flash: React.FC<{at: number; color?: string}> = ({at, color = '#fff'}) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 4) return null;
  return <AbsoluteFill style={{background: color, opacity: 0.35 * (1 - f / 4)}} />;
};

export const Logo: React.FC<{dark?: boolean; width?: number; style?: React.CSSProperties}> = ({dark, width = 220, style}) => (
  <Img src={staticFile(dark ? 'img/brand/logo-white.png' : 'img/brand/logo-dark.png')} style={{width, ...style}} />
);
