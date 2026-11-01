import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {C} from '../brand';
import {ease, pop, rnd} from '../lib/motion';
import {faceSrc} from '../lib/faces';
import {Character, Mood} from './Character';
import {Icon} from './Icon';

/**
 * Explainer scenes: small animated stories that SHOW what is being said
 * (a webpage when you say "website", a customer walking in when you say "customer",
 * someone visiting, a long form, a dull button, a fire...). No words on screen.
 * Every scene plays on a 1000 x 760 stage and changes something every 1-1.5 seconds.
 */

export const STAGE_W = 1000;
export const STAGE_H = 900;
const FLOOR = 870;

type SceneProps = {f: number; dur: number; face?: string};

/* ------------------------------------------------------------------ primitives */

const abs = (x: number, y: number, w?: number, h?: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w, height: h});

/** A browser window with a header bar (dots + address pill, no words). */
export const Browser: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode; appear?: number; tint?: number; style?: React.CSSProperties}> = ({x, y, w, h, children, appear = 1, tint = 0, style}) => (
  <div style={{...abs(x, y, w, h), borderRadius: 26, background: '#fff', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.45)', transform: `translateY(${(1 - appear) * 80}px) scale(${0.9 + 0.1 * appear})`, opacity: appear, ...style}}>
    <div style={{height: 54, background: '#EEF2F8', display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 15, height: 15, borderRadius: 99, background: c}} />)}
      <div style={{marginLeft: 16, flex: 1, height: 26, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px'}}>
        <Icon name="lock" size={14} color="#9AA6BC" stroke={2.6} />
        <div style={{width: '40%', height: 8, borderRadius: 9, background: '#DCE3EE'}} />
      </div>
    </div>
    <div style={{position: 'relative', width: w, height: h - 54}}>{children}</div>
    {tint > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(40,16,4,${tint * 0.75})`, mixBlendMode: 'multiply'}} />}
  </div>
);

/** Grey placeholder text lines. */
const Lines: React.FC<{n: number; w: number; h?: number; gap?: number; color?: string; last?: number}> = ({n, w, h = 12, gap = 12, color = '#DCE3EE', last = 0.6}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap}}>
    {Array.from({length: n}).map((_, i) => <div key={i} style={{width: i === n - 1 ? w * last : w, height: h, borderRadius: 9, background: color}} />)}
  </div>
);

/** A cartoon person on the stage. walk = 0..1 progress of walking from `from` to `x`. */
const Person: React.FC<{who: string; x: number; h?: number; gesture?: string; prev?: string; gT?: number; mood?: Mood; from?: number; walk?: number; flip?: boolean; talking?: boolean; look?: number}> = ({who, x, h = 500, gesture = 'idle', prev, gT = 1, mood = 'neutral', from, walk = 1, flip, talking, look = 0}) => {
  const frame = useCurrentFrame();
  const px = from === undefined ? x : from + (x - from) * walk;
  const moving = from !== undefined && walk > 0.02 && walk < 0.98;
  const bob = moving ? Math.abs(Math.sin(frame / 3.2)) * -14 : 0;
  const tilt = moving ? Math.sin(frame / 3.2) * 3 : 0;
  const w = h / 2;
  return (
    <div style={{...abs(px - w / 2, FLOOR - h + bob, w, h), transform: `rotate(${tilt}deg) scaleX(${flip ? -1 : 1})`}}>
      <div style={{position: 'absolute', left: w * 0.15, right: w * 0.15, bottom: -bob - 6, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.25)', filter: 'blur(4px)'}} />
      <Character who={who} gesture={gesture} prevGesture={prev} gestureT={gT} mood={mood} talking={talking} level={talking ? 0.5 : 0} look={look} />
    </div>
  );
};

/** Mouse pointer moving through points; clicks at `clickAt`. */
const Cursor: React.FC<{f: number; pts: [number, number, number][]; clickAt?: number}> = ({f, pts, clickAt}) => {
  let x = pts[0][1], y = pts[0][2];
  for (let i = 1; i < pts.length; i++) {
    const [t0, x0, y0] = pts[i - 1];
    const [t1, x1, y1] = pts[i];
    if (f >= t0) { const k = ease(f, t0, t1); x = x0 + (x1 - x0) * k; y = y0 + (y1 - y0) * k; }
  }
  const press = clickAt !== undefined && f >= clickAt && f < clickAt + 6 ? 0.82 : 1;
  const ring = clickAt !== undefined ? ease(f, clickAt, clickAt + 14) : 0;
  return (
    <div style={{...abs(x, y), opacity: ease(f, pts[0][0] - 4, pts[0][0] + 2)}}>
      {ring > 0 && ring < 1 && <div style={{position: 'absolute', left: -40 * ring, top: -40 * ring, width: 80 * ring, height: 80 * ring, borderRadius: 99, border: `5px solid ${C.sky}`, opacity: 1 - ring}} />}
      <svg width={54} height={54} viewBox="0 0 24 24" style={{transform: `scale(${press})`, transformOrigin: '0 0', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}}>
        <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.7 L11 13.5 L18 13.5 Z" fill="#0A1633" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** Big red cross or green tick stamped over something. */
const Stamp: React.FC<{f: number; at: number; kind: 'cross' | 'check'; x: number; y: number; size?: number}> = ({f, at, kind, x, y, size = 220}) => {
  const k = pop(f, at, 14);
  if (f < at) return null;
  const col = kind === 'cross' ? C.red : C.green;
  return (
    <div style={{...abs(x - size / 2, y - size / 2, size, size), borderRadius: 999, background: col, border: '10px solid #fff', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k}) rotate(${(1 - k) * -30}deg)`}}>
      <Icon name={kind === 'cross' ? 'x' : 'check'} size={size * 0.6} color="#fff" stroke={3.4} />
    </div>
  );
};

/** Flames along the bottom of an area; `power` 0..1 grows them. */
export const Fire: React.FC<{x: number; y: number; w: number; power: number; seed?: number}> = ({x, y, w, power, seed = 1}) => {
  const frame = useCurrentFrame();
  if (power <= 0) return null;
  const n = Math.max(5, Math.round(w / 70));
  return (
    <div style={{...abs(x, y - 360, w, 360), pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const hh = (160 + rnd(i * 7 + seed) * 200) * power * (0.85 + Math.sin(frame / 3 + i * 1.7) * 0.15);
        const ww = (w / n) * 1.9;
        const cx = (i + 0.5) * (w / n) - ww / 2 + Math.sin(frame / 5 + i) * 6;
        return (
          <svg key={i} viewBox="0 0 100 160" preserveAspectRatio="none" style={{position: 'absolute', left: cx, bottom: 0, width: ww, height: hh, overflow: 'visible'}}>
            <path d="M50 0 C62 40 98 62 92 112 C88 142 68 160 50 160 C32 160 12 142 8 112 C2 62 38 40 50 0 Z" fill="#FF6A1A" opacity={0.92} />
            <path d="M50 40 C58 66 80 84 76 118 C73 140 62 154 50 154 C38 154 27 140 24 118 C20 84 42 66 50 40 Z" fill="#FFB020" />
            <path d="M50 84 C55 100 66 112 63 130 C61 144 56 150 50 150 C44 150 39 144 37 130 C34 112 45 100 50 84 Z" fill="#FFF1A8" />
          </svg>
        );
      })}
      {/* sparks */}
      {Array.from({length: 10}).map((_, i) => {
        const p = ((frame * 1.4 + i * 37) % 90) / 90;
        return <div key={'s' + i} style={{position: 'absolute', left: rnd(i + seed * 3) * w + Math.sin(frame / 7 + i) * 20, bottom: p * 420 * power, width: 9, height: 9, borderRadius: 9, background: i % 2 ? '#FFD36A' : '#FF8A3D', opacity: (1 - p) * power}} />;
      })}
    </div>
  );
};

const Hearts: React.FC<{f: number; at: number; x: number; y: number; n?: number}> = ({f, at, x, y, n = 6}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const t = (f - at - i * 5) / 40;
      if (t < 0 || t > 1) return null;
      return <div key={i} style={{...abs(x + (rnd(i + 3) - 0.5) * 160 + Math.sin(t * 6 + i) * 18, y - t * 260), opacity: 1 - t, transform: `scale(${0.6 + t * 0.6})`}}><Icon name="heart" size={58} color="#FF4D6D" stroke={0} style={{fill: '#FF4D6D'}} /></div>;
    })}
  </>
);

const Confetti: React.FC<{f: number; at: number; x: number; y: number}> = ({f, at, x, y}) => {
  if (f < at) return null;
  const cols = [C.gold, C.sky, C.blue, '#FF4D6D', C.green];
  return (
    <>
      {Array.from({length: 26}).map((_, i) => {
        const t = (f - at) / 45;
        if (t > 1) return null;
        const a = rnd(i * 3) * Math.PI * 2;
        const v = 180 + rnd(i * 5) * 260;
        return <div key={i} style={{...abs(x + Math.cos(a) * v * t, y + Math.sin(a) * v * t + t * t * 260, 16, 26), background: cols[i % 5], borderRadius: 4, transform: `rotate(${t * 600 + i * 40}deg)`, opacity: 1 - t * 0.8}} />;
      })}
    </>
  );
};

/** Little thought bubble above a person with an icon (e.g. "?" or a yawn). */
const Thought: React.FC<{f: number; at: number; x: number; y: number; icon: string; col?: string}> = ({f, at, x, y, icon, col = C.navy}) => {
  const k = pop(f, at, 16);
  if (f < at) return null;
  return (
    <div style={{...abs(x - 70, y - 70, 140, 140), transform: `scale(${k}) translateY(${Math.sin(f / 9) * 5}px)`}}>
      <div style={{width: 140, height: 140, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.3)'}}><Icon name={icon} size={76} color={col} stroke={2.6} /></div>
      <div style={{position: 'absolute', left: 30, bottom: -26, width: 30, height: 30, borderRadius: 99, background: '#fff'}} />
      <div style={{position: 'absolute', left: 14, bottom: -50, width: 16, height: 16, borderRadius: 99, background: '#fff'}} />
    </div>
  );
};

/* ------------------------------------------------------------------ page contents */

/** A generic "welcome" hero: waving hand, grey lines, nothing that says what the business does. */
const HeroWelcome: React.FC<{f: number}> = ({f}) => (
  <div style={{...abs(0, 0, '100%' as any, '100%' as any), background: 'linear-gradient(180deg,#F4F6FA,#E9EDF4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26}}>
    <div style={{fontSize: 120, transform: `rotate(${Math.sin(f / 4) * 14}deg)`, transformOrigin: '70% 90%'}}><Icon name="hand" size={130} color="#B7C0D0" stroke={2} /></div>
    <div style={{width: 360, height: 30, borderRadius: 12, background: '#C9D1DE'}} />
    <Lines n={2} w={300} color="#DCE2EC" />
  </div>
);

/** A clear hero: what you do (plumber: wrench + house), a strong button and service cards. */
const HeroClear: React.FC<{f: number; at?: number}> = ({f, at = 0}) => (
  <div style={{...abs(0, 0, '100%' as any, '100%' as any), background: 'linear-gradient(180deg,#EAF1FF,#FFFFFF)', padding: 34}}>
    <div style={{display: 'flex', gap: 26, alignItems: 'center'}}>
      <div style={{width: 210, height: 210, borderRadius: 40, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(f, at + 2)})`}}>
        <Icon name="wrench" size={120} color="#fff" stroke={2.2} style={{transform: `rotate(${Math.sin(f / 8) * 12}deg)`}} />
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 14, opacity: ease(f, at + 6, at + 16)}}>
        <div style={{width: '90%', height: 30, borderRadius: 10, background: C.navy}} />
        <div style={{width: '70%', height: 30, borderRadius: 10, background: C.navy}} />
        <div style={{width: 210, height: 58, borderRadius: 99, background: C.gold, marginTop: 10, boxShadow: `0 0 ${20 + Math.sin(f / 6) * 10}px rgba(232,176,75,0.8)`}} />
      </div>
    </div>
    <div style={{display: 'flex', gap: 18, marginTop: 30}}>
      {['droplet', 'house', 'clock'].map((ic, i) => (
        <div key={ic} style={{flex: 1, height: 130, borderRadius: 22, background: '#fff', boxShadow: '0 10px 26px rgba(10,22,51,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - pop(f, at + 12 + i * 5)) * 60}px)`, opacity: ease(f, at + 12 + i * 5, at + 18 + i * 5)}}>
          <Icon name={ic} size={64} color={C.blue} stroke={2.4} />
        </div>
      ))}
    </div>
  </div>
);

const SLIDE_COLS = [['#FF9A62', '#FF5E7E'], ['#5EC8FF', '#3D6BFF'], ['#7BE3A4', '#1FA67A']];
const SLIDE_ICONS = ['image', 'mountain', 'sun'];
/** Banner that slides by itself, with dots. */
const HeroSlider: React.FC<{f: number; speed?: number; still?: boolean}> = ({f, speed = 34, still}) => {
  const pos = still ? 0 : f / speed;
  return (
    <div style={{...abs(0, 0, '100%' as any, '100%' as any), background: '#F4F6FA', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, height: '78%', width: '400%', display: 'flex', transform: `translateX(${-((pos % 3) / 4) * 100}%)`}}>
        {[0, 1, 2, 0].map((i, k) => (
          <div key={k} style={{flex: 1, background: `linear-gradient(135deg, ${SLIDE_COLS[i][0]}, ${SLIDE_COLS[i][1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name={SLIDE_ICONS[i]} size={150} color="rgba(255,255,255,0.9)" stroke={1.8} />
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: '9%', display: 'flex', gap: 14, justifyContent: 'center'}}>
        {[0, 1, 2].map((i) => <div key={i} style={{width: Math.floor(pos % 3) === i ? 44 : 16, height: 16, borderRadius: 99, background: Math.floor(pos % 3) === i ? C.blue : '#C9D1DE'}} />)}
      </div>
    </div>
  );
};

/** Stock photo: grey, two hands shaking, watermark lines. */
const HeroStock: React.FC<{f: number}> = ({f}) => (
  <div style={{...abs(0, 0, '100%' as any, '100%' as any), background: 'linear-gradient(135deg,#CBD2DC,#AEB7C4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
    <Icon name="handshake" size={260} color="#7D8796" stroke={1.6} style={{transform: `scale(${1 + Math.sin(f / 20) * 0.02})`}} />
    {Array.from({length: 6}).map((_, i) => <div key={i} style={{position: 'absolute', left: -200 + i * 190, top: -100, width: 26, height: 900, background: 'rgba(255,255,255,0.18)', transform: 'rotate(35deg)'}} />)}
  </div>
);

/** Real photo of the owner (Sudip's cutout) in the hero. */
const HeroReal: React.FC<{f: number; face?: string}> = ({f, face = 'big-smile'}) => (
  <div style={{...abs(0, 0, '100%' as any, '100%' as any), background: 'linear-gradient(160deg,#FFE8B8,#FFF8EA)', overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 40, top: 70, display: 'flex', flexDirection: 'column', gap: 14, opacity: ease(f, 8, 18)}}>
      <div style={{width: 300, height: 28, borderRadius: 10, background: C.navy}} />
      <div style={{width: 230, height: 28, borderRadius: 10, background: C.navy}} />
      <div style={{width: 180, height: 54, borderRadius: 99, background: C.blue, marginTop: 10}} />
    </div>
    <Img src={staticFile(faceSrc(face))} style={{position: 'absolute', right: -30, bottom: -20, height: '112%', transform: `translateY(${(1 - pop(f, 2)) * 120}px)`}} />
  </div>
);

/** Contact form with many boxes that keeps scrolling, or a short 3-box form. */
const FormLong: React.FC<{f: number}> = ({f}) => {
  const scroll = Math.max(0, f - 14) * 3.2;
  return (
    <div style={{...abs(0, 0, '100%' as any, '100%' as any), background: '#F7F9FC', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 40, right: 40, top: 30 - (scroll % 1200), display: 'flex', flexDirection: 'column', gap: 18}}>
        {Array.from({length: 22}).map((_, i) => (
          <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{width: 90 + rnd(i) * 120, height: 10, borderRadius: 6, background: '#C9D1DE'}} />
            <div style={{height: 52, borderRadius: 12, border: '3px solid #D5DCE8', background: '#fff'}} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FormShort: React.FC<{f: number; at?: number}> = ({f, at = 0}) => (
  <div style={{...abs(0, 0, '100%' as any, '100%' as any), background: 'linear-gradient(180deg,#EAF1FF,#fff)', padding: '34px 50px', display: 'flex', flexDirection: 'column', gap: 22}}>
    {['user', 'mail', 'message-circle-question'].map((ic, i) => {
      const s = at + 6 + i * 16;
      const fill = ease(f, s, s + 12);
      return (
        <div key={ic} style={{height: 84, borderRadius: 18, border: `3px solid ${fill > 0.99 ? C.green : '#C9D6EE'}`, background: '#fff', display: 'flex', alignItems: 'center', gap: 18, padding: '0 20px'}}>
          <Icon name={ic} size={42} color={C.blue} stroke={2.4} />
          <div style={{width: 300 * fill, height: 16, borderRadius: 8, background: C.navy, opacity: 0.75}} />
          <div style={{marginLeft: 'auto', transform: `scale(${pop(f, s + 12)})`}}><Icon name="circle-check" size={44} color={C.green} stroke={2.6} /></div>
        </div>
      );
    })}
    <div style={{alignSelf: 'center', width: 260, height: 74, borderRadius: 99, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(f, at + 50)})`}}><Icon name="send" size={40} color="#fff" stroke={2.6} /></div>
  </div>
);

/** A button in the middle of a page: dull grey, or bright with a gift (= says what you get). */
const PageButton: React.FC<{f: number; good?: boolean; pressed?: boolean}> = ({f, good, pressed}) => (
  <div style={{...abs(0, 0, '100%' as any, '100%' as any), background: good ? 'linear-gradient(180deg,#EAF1FF,#fff)' : '#F2F4F8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30}}>
    <Lines n={3} w={420} color={good ? '#C9D6EE' : '#DCE2EC'} />
    <div style={{width: good ? 440 : 300, height: good ? 120 : 96, borderRadius: good ? 99 : 14, background: good ? `linear-gradient(135deg, ${C.blue}, ${C.sky})` : '#C3C9D4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, transform: `scale(${pressed ? 0.94 : 1 + (good ? Math.sin(f / 7) * 0.03 : 0)})`, boxShadow: good ? `0 0 ${34 + Math.sin(f / 6) * 14}px rgba(25,167,255,0.7)` : 'none'}}>
      {good ? <><Icon name="gift" size={58} color="#fff" stroke={2.4} /><Icon name="arrow-right" size={50} color="#fff" stroke={2.8} /></> : <div style={{width: 150, height: 16, borderRadius: 8, background: '#E9ECF1'}} />}
    </div>
  </div>
);

/** Phone frame. */
const Phone: React.FC<{x: number; y: number; w?: number; children?: React.ReactNode; tilt?: number}> = ({x, y, w = 300, children, tilt = 0}) => (
  <div style={{...abs(x, y, w, w * 2), borderRadius: w * 0.16, background: '#0A1633', padding: 14, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', transform: `rotate(${tilt}deg)`}}>
    <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.12, background: '#F5F8FC', overflow: 'hidden'}}>{children}</div>
  </div>
);

/* ------------------------------------------------------------------ scenes */

/** Shared "bad thing on a website" scene: page appears, visitor gets bored, red cross, page burns. */
const BadThing: React.FC<SceneProps & {page: (f: number) => React.ReactNode; reaction?: string; mood?: Mood}> = ({f, dur, page, reaction = 'frown', mood = 'sad'}) => {
  const cross = Math.min(dur * 0.55, 62);
  const burn = cross + 14;
  const p = ease(f, burn, burn + 30);
  return (
    <>
      <Browser x={20} y={20} w={720} h={600} appear={ease(f, 0, 12)} tint={p} style={{transform: `translateY(${p * 30}px) rotate(${p * -3}deg) scale(${1 - p * 0.06})`}}>{page(f)}</Browser>
      <Fire x={20} y={650} w={720} power={p} />
      <Person who="leo" x={830} from={1120} walk={ease(f, 4, 26)} gesture={f > 30 ? 'crossed' : 'idle'} prev="idle" gT={ease(f, 30, 40)} mood={f > 26 ? mood : 'neutral'} look={-1} />
      <Thought f={f} at={26} x={880} y={290} icon={reaction} />
      <Stamp f={f} at={cross} kind="cross" x={380} y={330} size={250} />
    </>
  );
};

const SCENE_MAP: Record<string, React.FC<SceneProps>> = {
  /** fire + a webpage dropping into it (bonfire night / burn things) */
  bonfire: ({f}) => {
    const drop = ease(f, 18, 44);
    return (
      <>
        <div style={{...abs(250, 755, 500, 60), borderRadius: '50%', background: 'radial-gradient(#5A2B12, #2B1408)'}} />
        {[0, 1, 2].map((i) => <div key={i} style={{...abs(300 + i * 120, 745, 200, 34), borderRadius: 20, background: '#6B3A1E', transform: `rotate(${(i - 1) * 16}deg)`}} />)}
        <Fire x={260} y={785} w={480} power={0.75 + Math.sin(f / 10) * 0.05 + drop * 0.35} />
        <Browser x={290} y={-20 + drop * 560} w={420} h={300} appear={ease(f, 2, 14)} tint={ease(f, 40, 60)} style={{transform: `rotate(${drop * 22}deg) scale(${1 - ease(f, 44, 64) * 0.6})`, opacity: 1 - ease(f, 56, 70)}}>
          <HeroWelcome f={f} />
        </Browser>
        <Person who="sudip" x={130} gesture="point" prev="idle" gT={ease(f, 10, 20)} mood="excited" />
        <Person who="maya" x={880} gesture={f > 46 ? 'cheer' : 'idle'} prev="idle" gT={ease(f, 46, 56)} mood="happy" flip />
      </>
    );
  },
  /** a generic "welcome" page gets a cross and burns */
  'burn-welcome': (p) => <BadThing {...p} page={(f) => <HeroWelcome f={f} />} reaction="meh" />,
  /** auto-sliding banner: visitor can't keep up */
  'burn-slider': (p) => <BadThing {...p} page={(f) => <HeroSlider f={f} speed={22} />} reaction="timer" />,
  /** stock handshake photo */
  'burn-stock': (p) => <BadThing {...p} page={(f) => <HeroStock f={f} />} reaction="meh" />,
  /** contact form with ten boxes */
  'burn-form': (p) => <BadThing {...p} page={(f) => <FormLong f={f} />} reaction="frown" mood="worried" />,
  /** dull "submit" button */
  'burn-button': (p) => <BadThing {...p} page={(f) => <PageButton f={f} />} reaction="circle-help" mood="thinking" />,

  /** visitor looks at a vague page, shrugs and walks away */
  'visitor-leaves': ({f}) => {
    const leave = ease(f, 40, 70);
    return (
      <>
        <Browser x={20} y={20} w={720} h={600} appear={ease(f, 0, 10)}><HeroWelcome f={f} /></Browser>
        <Person who="leo" x={leave > 0 ? 1180 : 800} from={leave > 0 ? 800 : 1150} walk={leave > 0 ? leave : ease(f, 0, 20)} gesture={f > 22 && leave === 0 ? 'shrug' : 'idle'} prev="idle" gT={ease(f, 22, 30)} mood={f > 20 ? 'sad' : 'neutral'} flip={leave > 0} look={-1} />
        <Thought f={f} at={22} x={850} y={290} icon="circle-help" />
        {/* the competitor's page next door wins him */}
        <div style={{opacity: ease(f, 44, 56)}}><Icon name="arrow-right" size={90} color={C.gold} stroke={3} style={{position: 'absolute', left: 700, top: 700}} /></div>
      </>
    );
  },
  /** clear page: what you do, visitor smiles */
  'say-what-you-do': ({f}) => (
    <>
      <Browser x={20} y={20} w={720} h={620} appear={ease(f, 0, 12)}><HeroClear f={f} at={4} /></Browser>
      <Person who="leo" x={850} from={1150} walk={ease(f, 10, 32)} gesture={f > 40 ? 'thumbs-up' : 'idle'} prev="idle" gT={ease(f, 40, 50)} mood={f > 34 ? 'excited' : 'neutral'} look={-1} />
      <Hearts f={f} at={44} x={850} y={400} />
    </>
  ),
  /** one still message, pinned */
  'one-message': ({f}) => (
    <>
      <Browser x={20} y={20} w={720} h={620} appear={ease(f, 0, 12)}>
        <HeroSlider f={f} speed={20} still={f > 24} />
        <div style={{position: 'absolute', left: 310, top: -40 + ease(f, 24, 36) * 160, transform: `rotate(${(1 - ease(f, 24, 40)) * 30}deg)`, opacity: ease(f, 22, 28)}}><Icon name="pin" size={110} color={C.red} stroke={2.4} style={{fill: '#FF8A95'}} /></div>
      </Browser>
      <Person who="leo" x={850} gesture={f > 40 ? 'thumbs-up' : 'think'} prev="think" gT={ease(f, 40, 50)} mood={f > 38 ? 'happy' : 'thinking'} look={-1} />
      <Stamp f={f} at={48} kind="check" x={680} y={100} size={170} />
    </>
  ),
  /** your real photo on the page, visitor trusts it */
  'real-photo': ({f, face}) => (
    <>
      <Browser x={20} y={20} w={720} h={660} appear={ease(f, 0, 12)}><HeroReal f={f} face={face === 'pointing-you' ? 'big-smile' : 'big-smile'} /></Browser>
      <Person who="leo" x={850} from={1150} walk={ease(f, 8, 28)} gesture={f > 34 ? 'thumbs-up' : 'idle'} prev="idle" gT={ease(f, 34, 44)} mood={f > 30 ? 'excited' : 'neutral'} look={-1} />
      <Hearts f={f} at={36} x={600} y={250} n={8} />
    </>
  ),
  /** people buy from people: owner and customer shake on it */
  'people-buy': ({f}) => (
    <>
      <Person who="maya" x={330} from={-150} walk={ease(f, 0, 22)} gesture={f > 24 ? 'point' : 'idle'} prev="idle" gT={ease(f, 24, 34)} mood="happy" look={1} h={600} />
      <Person who="leo" x={640} from={1150} walk={ease(f, 0, 22)} gesture={f > 24 ? 'point' : 'idle'} prev="idle" gT={ease(f, 24, 34)} mood="happy" flip look={1} h={600} />
      <Hearts f={f} at={30} x={480} y={330} n={8} />
      <div style={{...abs(405, 230, 150, 150), transform: `scale(${pop(f, 30)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 99, background: C.gold}}><Icon name="handshake" size={90} color="#fff" stroke={2.2} /></div>
    </>
  ),
  /** short form: 3 boxes fill, send, paper plane flies to the owner */
  'short-form': ({f}) => {
    const fly = ease(f, 58, 80);
    return (
      <>
        <Browser x={20} y={20} w={700} h={660} appear={ease(f, 0, 12)}><FormShort f={f} at={4} /></Browser>
        <div style={{...abs(350 + fly * 480, 620 - fly * 420), opacity: f > 56 ? 1 - ease(f, 80, 86) : 0, transform: `rotate(-20deg)`}}><Icon name="send" size={90} color={C.gold} stroke={2.6} /></div>
        <Person who="maya" x={860} gesture={f > 78 ? 'cheer' : 'idle'} prev="idle" gT={ease(f, 78, 88)} mood={f > 76 ? 'excited' : 'neutral'} flip look={-1} />
      </>
    );
  },
  /** dull button: "to what?" question marks */
  'what-button': ({f}) => (
    <>
      <Browser x={20} y={20} w={720} h={600} appear={ease(f, 0, 10)}><PageButton f={f} /></Browser>
      <Cursor f={f} pts={[[6, 640, 700], [22, 400, 400], [40, 420, 410]]} />
      <Person who="leo" x={840} gesture="shrug" prev="idle" gT={ease(f, 8, 18)} mood="thinking" look={-1} />
      {[0, 1, 2].map((i) => <div key={i} style={{...abs(760 + i * 70, 230 - i * 40), transform: `scale(${pop(f, 14 + i * 6)}) rotate(${Math.sin(f / 8 + i) * 12}deg)`}}><Icon name="circle-help" size={70 + i * 10} color={C.gold} stroke={2.6} /></div>)}
    </>
  ),
  /** bright button that says what you get: click, confetti, a quote arrives */
  'good-button': ({f}) => (
    <>
      <Browser x={20} y={20} w={720} h={600} appear={ease(f, 0, 10)}><PageButton f={f} good pressed={f >= 34 && f < 40} /></Browser>
      <Cursor f={f} pts={[[6, 680, 720], [30, 420, 400]]} clickAt={34} />
      <Confetti f={f} at={36} x={400} y={380} />
      <div style={{...abs(560, 380), transform: `translate(${ease(f, 40, 60) * 160}px, ${ease(f, 40, 60) * -40}px) scale(${pop(f, 40)})`}}>
        <div style={{width: 150, height: 190, borderRadius: 16, background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.35)', padding: 18, display: 'flex', flexDirection: 'column', gap: 10}}>
          <Icon name="file-check" size={54} color={C.green} stroke={2.4} />
          <Lines n={3} w={110} h={9} gap={9} />
        </div>
      </div>
      <Person who="leo" x={870} gesture={f > 46 ? 'cheer' : 'idle'} prev="idle" gT={ease(f, 46, 56)} mood={f > 44 ? 'excited' : 'neutral'} look={-1} />
    </>
  ),
  /** many visitors walk to the website, messages fly into the owner's phone */
  'more-contacts': ({f}) => (
    <>
      <Browser x={190} y={10} w={620} h={440} appear={ease(f, 0, 10)}><HeroClear f={f} /></Browser>
      {[{w: 'leo', x0: -150, x: 200, d: 0}, {w: 'maya', x0: 1150, x: 800, d: 8}, {w: 'sudip', x0: -150, x: 380, d: 16}, {w: 'leo', x0: 1150, x: 620, d: 24}].map((p, i) => (
        <Person key={i} who={p.w} x={p.x} from={p.x0} walk={ease(f, p.d, p.d + 24)} h={400} gesture={f > p.d + 26 ? 'phone' : 'idle'} prev="idle" gT={ease(f, p.d + 26, p.d + 34)} mood="happy" flip={p.x0 > 500} />
      ))}
      {Array.from({length: 6}).map((_, i) => {
        const t = ease(f, 30 + i * 7, 48 + i * 7);
        if (t <= 0 || t >= 1) return null;
        return <div key={i} style={{...abs(470 + (i % 2 ? 1 : -1) * (1 - t) * 300, 520 - t * 360), opacity: 1 - t * 0.3}}><Icon name="mail" size={60} color={C.gold} stroke={2.4} /></div>;
      })}
      <div style={{...abs(640, 40, 90, 90), borderRadius: 99, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(f, 40)})`, boxShadow: '0 10px 24px rgba(0,0,0,0.3)'}}><Icon name="bell-ring" size={50} color="#fff" stroke={2.4} /></div>
    </>
  ),
  /** comments popping up on a phone */
  comment: ({f}) => (
    <>
      <Phone x={310} y={0} w={380}>
        <div style={{padding: 22, display: 'flex', flexDirection: 'column', gap: 16}}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{display: 'flex', gap: 12, alignItems: 'center', transform: `translateX(${(1 - pop(f, 6 + i * 9)) * 300}px)`, opacity: ease(f, 6 + i * 9, 12 + i * 9)}}>
              <div style={{width: 52, height: 52, borderRadius: 99, background: [C.gold, C.sky, C.blue, '#FF7AA0', C.green][i]}} />
              <div style={{flex: 1, height: 50, borderRadius: 18, background: '#fff', boxShadow: '0 6px 14px rgba(10,22,51,0.1)', display: 'flex', alignItems: 'center', padding: '0 14px'}}><div style={{width: 60 + rnd(i) * 90, height: 10, borderRadius: 5, background: '#C9D1DE'}} /></div>
            </div>
          ))}
        </div>
      </Phone>
      <Person who="leo" x={150} gesture="phone" mood="happy" />
      <Person who="maya" x={860} gesture="phone" mood="excited" flip />
    </>
  ),

  /* ---- general scenes for any script ---- */
  /** a webpage building itself */
  website: ({f}) => (
    <>
      <Browser x={40} y={20} w={920} h={700} appear={ease(f, 0, 12)}><HeroClear f={f} at={6} /></Browser>
      <Cursor f={f} pts={[[20, 900, 650], [40, 520, 330], [60, 300, 470]]} />
    </>
  ),
  /** a customer walks in and waves */
  customer: ({f}) => (
    <>
      <div style={{...abs(560, 240, 380, 630), borderRadius: '24px 24px 0 0', background: '#123073', border: `8px solid ${C.sky}`}}>
        <div style={{position: 'absolute', left: 30, right: 30, top: 40, bottom: 0, background: 'linear-gradient(180deg,#FFE7AE,#F7C873)', opacity: 0.9}} />
      </div>
      <Person who="leo" x={420} from={-150} walk={ease(f, 0, 28)} gesture={f > 30 ? 'wave' : 'idle'} prev="idle" gT={ease(f, 30, 38)} mood="happy" />
      <Person who="maya" x={760} gesture={f > 36 ? 'wave' : 'idle'} prev="idle" gT={ease(f, 36, 44)} mood="excited" flip look={-1} />
    </>
  ),
  /** someone visiting: walks to the shop and goes in */
  visit: ({f}) => {
    const door = ease(f, 26, 36);
    return (
      <>
        <div style={{...abs(520, 200, 440, 670), borderRadius: '30px 30px 0 0', background: '#16337A'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 70, background: `repeating-linear-gradient(90deg, ${C.blue} 0 50px, #fff 50px 100px)`, borderRadius: '30px 30px 0 0'}} />
          <div style={{position: 'absolute', left: 140, bottom: 0, width: 160, height: 300, background: '#FFE3A1'}} />
          <div style={{position: 'absolute', left: 140, bottom: 0, width: 160, height: 300, background: '#0E2A66', transformOrigin: 'left center', transform: `perspective(600px) rotateY(${-door * 75}deg)`}} />
        </div>
        <Person who="leo" x={740} from={-150} walk={ease(f, 0, 40)} gesture="idle" mood="happy" />
      </>
    );
  },
  /** phone ringing, the owner answers */
  call: ({f}) => (
    <>
      <Phone x={100} y={40} w={330} tilt={f < 30 ? Math.sin(f * 1.6) * 6 : 0}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 30}}>
          <div style={{width: 120, height: 120, borderRadius: 99, background: '#D7E4FF', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name="user" size={70} color={C.blue} /></div>
          <div style={{width: 96, height: 96, borderRadius: 99, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + Math.sin(f / 3) * 0.08})`}}><Icon name="phone" size={50} color="#fff" /></div>
        </div>
      </Phone>
      <Person who="maya" x={720} from={1150} walk={ease(f, 10, 30)} gesture={f > 32 ? 'phone' : 'idle'} prev="idle" gT={ease(f, 32, 40)} mood="happy" look={-1} />
    </>
  ),
  /** messages flying into a phone inbox */
  message: ({f}) => (
    <>
      <Phone x={320} y={0} w={380}>
        <div style={{padding: 18, display: 'flex', flexDirection: 'column', gap: 14}}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{height: 80, borderRadius: 18, background: '#fff', boxShadow: '0 8px 18px rgba(10,22,51,0.12)', display: 'flex', alignItems: 'center', gap: 12, padding: 12, transform: `translateY(${(1 - pop(f, 8 + i * 10)) * -200}px)`, opacity: ease(f, 8 + i * 10, 12 + i * 10)}}>
              <Icon name="mail" size={40} color={C.blue} /><Lines n={2} w={130} h={9} gap={8} />
            </div>
          ))}
        </div>
      </Phone>
      <Person who="maya" x={150} gesture={f > 30 ? 'cheer' : 'idle'} prev="idle" gT={ease(f, 30, 40)} mood="excited" />
    </>
  ),
  /** coins dropping into a jar */
  money: ({f}) => (
    <>
      <div style={{...abs(370, 500, 280, 370), borderRadius: '30px 30px 60px 60px', background: 'rgba(200,230,255,0.25)', border: '6px solid rgba(255,255,255,0.6)'}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${20 + ease(f, 10, 70) * 60}%`, borderRadius: '0 0 54px 54px', background: 'linear-gradient(180deg,#F7D27A,#E8B04B)'}} />
      </div>
      {Array.from({length: 7}).map((_, i) => {
        const t = ease(f, 6 + i * 8, 22 + i * 8);
        if (t >= 1) return null;
        return <div key={i} style={{...abs(470 + (rnd(i) - 0.5) * 80, 60 + t * 560, 80, 80), borderRadius: 99, background: C.gold, border: '6px solid #F6D58A', opacity: t > 0 ? 1 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name="dollar-sign" size={44} color="#fff" stroke={3} /></div>;
      })}
      <Person who="maya" x={800} gesture={f > 40 ? 'cheer' : 'idle'} prev="idle" gT={ease(f, 40, 50)} mood="excited" flip />
    </>
  ),
  /** search results: your result climbs to the top */
  search: ({f}) => {
    const climb = ease(f, 24, 44);
    return (
      <Browser x={60} y={20} w={880} h={760} appear={ease(f, 0, 10)}>
        <div style={{padding: 30}}>
          <div style={{height: 64, borderRadius: 99, border: '3px solid #D5DCE8', display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px'}}><Icon name="search" size={34} color={C.blue} /><div style={{width: 260 * ease(f, 6, 20), height: 14, borderRadius: 7, background: C.navy}} /></div>
          <div style={{position: 'relative', marginTop: 30, height: 400}}>
            {[0, 1, 2, 3].map((i) => {
              const mine = i === 3;
              const y = mine ? 3 * 100 - climb * 300 : i * 100 + climb * 100 * (i < 3 ? 1 : 0);
              return (
                <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 84, borderRadius: 16, background: mine ? '#EAF1FF' : '#F6F8FB', border: mine ? `3px solid ${C.blue}` : 'none', display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px'}}>
                  <div style={{width: 50, height: 50, borderRadius: 12, background: mine ? C.blue : '#D5DCE8'}} />
                  <Lines n={2} w={360} h={10} gap={10} color={mine ? '#9DB8F5' : '#DCE2EC'} />
                  {mine && <div style={{marginLeft: 'auto', transform: `scale(${pop(f, 44)})`}}><Icon name="trophy" size={44} color={C.gold} /></div>}
                </div>
              );
            })}
          </div>
        </div>
      </Browser>
    );
  },
  /** five stars filling, customer thumbs up */
  review: ({f}) => (
    <>
      <div style={{...abs(80, 160, 840, 160), display: 'flex', justifyContent: 'center', gap: 20}}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{transform: `scale(${pop(f, 8 + i * 6)}) rotate(${(1 - pop(f, 8 + i * 6)) * 90}deg)`}}><Icon name="star" size={130} color={C.gold} stroke={1.5} style={{fill: C.gold}} /></div>)}
      </div>
      <Person who="leo" x={500} gesture={f > 40 ? 'thumbs-up' : 'idle'} prev="idle" gT={ease(f, 40, 50)} mood="excited" />
    </>
  ),
  /** waiting: clock spins, customer taps foot and leaves */
  wait: ({f}) => (
    <>
      <div style={{...abs(140, 140, 300, 300), borderRadius: 99, background: '#fff', border: `12px solid ${C.navy}`}}>
        <div style={{position: 'absolute', left: 138, top: 40, width: 12, height: 110, background: C.navy, borderRadius: 6, transformOrigin: '50% 100%', transform: `rotate(${f * 12}deg)`}} />
        <div style={{position: 'absolute', left: 138, top: 80, width: 12, height: 70, background: C.red, borderRadius: 6, transformOrigin: '50% 100%', transform: `rotate(${f}deg)`}} />
      </div>
      <Person who="leo" x={f > 40 ? 1180 : 720} from={f > 40 ? 720 : undefined} walk={ease(f, 40, 66)} gesture="crossed" mood="worried" flip={f > 40} />
    </>
  ),
  /** bars growing */
  grow: ({f}) => (
    <>
      <div style={{...abs(140, 120, 720, 720), display: 'flex', alignItems: 'flex-end', gap: 30}}>
        {[0.25, 0.4, 0.6, 0.85].map((v, i) => <div key={i} style={{flex: 1, height: `${v * 100 * ease(f, 4 + i * 8, 20 + i * 8)}%`, borderRadius: '18px 18px 0 0', background: i === 3 ? `linear-gradient(180deg, ${C.gold}, #D9952B)` : `linear-gradient(180deg, ${C.sky}, ${C.blue})`}} />)}
      </div>
      <div style={{...abs(700, 60), transform: `scale(${pop(f, 40)})`}}><Icon name="trending-up" size={140} color={C.green} stroke={3} /></div>
    </>
  ),
};

export const SCENE_NAMES = Object.keys(SCENE_MAP);

/** Plays one scene inside the stage (soft fade-in). */
export const ExplainScene: React.FC<{name: string; f: number; dur: number; face?: string}> = ({name, f, dur, face}) => {
  const S = SCENE_MAP[name] ?? SCENE_MAP.website;
  return (
    <div style={{position: 'relative', width: STAGE_W, height: STAGE_H, opacity: ease(f, 0, 6)}}>
      {/* soft floor light */}
      <div style={{...abs(60, FLOOR - 40, 880, 90), borderRadius: '50%', background: 'radial-gradient(rgba(25,167,255,0.25), rgba(25,167,255,0))'}} />
      <S f={f} dur={dur} face={face} />
    </div>
  );
};

/** spoken word -> scene, for reels that don't name scenes. */
export const SCENE_WORDS: Record<string, string> = {
  website: 'website', site: 'website', webpage: 'website', homepage: 'website', page: 'website',
  customer: 'customer', customers: 'customer', client: 'customer', clients: 'customer',
  visit: 'visit', visiting: 'visit', visitor: 'visit', visitors: 'more-contacts', walk: 'visit',
  call: 'call', calls: 'call', phone: 'call', ring: 'call',
  message: 'message', messages: 'message', email: 'message', emails: 'message', enquiry: 'message', enquiries: 'message', inbox: 'message',
  money: 'money', price: 'money', cost: 'money', pay: 'money', paid: 'money', sales: 'money', revenue: 'money',
  google: 'search', search: 'search', seo: 'search', rank: 'search',
  review: 'review', reviews: 'review', stars: 'review', rating: 'review',
  wait: 'wait', waiting: 'wait', slow: 'wait', late: 'wait',
  grow: 'grow', growth: 'grow', more: 'grow',
  form: 'short-form', button: 'good-button', photo: 'real-photo', comment: 'comment', fire: 'bonfire', burn: 'bonfire', bonfire: 'bonfire',
};

/** Scene for a burn prop, from what is being burned. */
export const burnScene = (text = '', icon = '') => {
  const t = (text + ' ' + icon).toLowerCase();
  if (/slid|banner|gallery|carousel/.test(t)) return 'burn-slider';
  if (/photo|handshake|stock|image/.test(t)) return 'burn-stock';
  if (/form|box|list/.test(t)) return 'burn-form';
  if (/button|submit/.test(t)) return 'burn-button';
  return 'burn-welcome';
};

export type SceneSlot = {from: number; to: number; name: string; key: string};

/** Which scene plays when: a beat's `show` (one name, or a list that splits the beat), its burn prop, or a spoken keyword. */
export const sceneSlots = (beats: {from: number; to: number; index: number; show?: string | string[]; prop?: any}[], words: {text: string; start: number}[], fps: number): SceneSlot[] => {
  const out: SceneSlot[] = [];
  let last = 'website';
  for (const b of beats) {
    let names: string[] = [];
    if (b.show) names = Array.isArray(b.show) ? b.show : [b.show];
    else if (b.prop?.type === 'burn') names = [burnScene(b.prop.text, b.prop.icon)];
    else {
      const ws = words.filter((w) => w.start * fps >= b.from - 3 && w.start * fps < b.to);
      const hit = ws.map((w) => SCENE_WORDS[w.text.toLowerCase().replace(/[^a-z]/g, '')]).find(Boolean);
      names = [hit ?? last];
    }
    const len = (b.to - b.from) / names.length;
    names.forEach((n, i) => out.push({from: Math.round(b.from + i * len), to: Math.round(b.from + (i + 1) * len), name: n, key: `${b.index}-${i}`}));
    last = names[names.length - 1];
  }
  if (out.length) out[0].from = 0;
  return out;
};
