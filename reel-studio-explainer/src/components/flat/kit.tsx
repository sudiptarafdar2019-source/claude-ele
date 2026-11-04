import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, fonts} from '../../brand';
import {ease, pop} from '../../lib/motion';

/**
 * FLAT KIT: polished flat-vector pieces for the Explainer template.
 * Clean shapes, soft shadows, brand colours, no outlines, no sketchy lines.
 */

export const SHADOW = '0 30px 70px rgba(10,22,51,0.16), 0 8px 20px rgba(10,22,51,0.08)';

/** place something by its centre */
export const At: React.FC<{x: number; y: number; s?: number; r?: number; o?: number; z?: number; children: React.ReactNode}> = ({x, y, s = 1, r = 0, o = 1, z, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s}) rotate(${r}deg)`, opacity: o, zIndex: z}}>{children}</div>
);

/** soft coloured disc behind the main subject of a scene */
export const Spot: React.FC<{x: number; y: number; r: number; color: string; f: number; from: number}> = ({x, y, r, color, f, from}) => {
  const k = pop(f, from, 22, 0.9);
  const b = Math.sin(f / 40) * 10;
  return (
    <div style={{position: 'absolute', left: x - r, top: y - r + b, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${color}55 0%, ${color}22 55%, ${color}00 72%)`, transform: `scale(${0.6 + 0.4 * k})`, opacity: k}} />
  );
};

// ---------------------------------------------------------------- people
export type Look = {skin: string; hair: string; shirt: string; pants: string; style: 'short' | 'long' | 'bun' | 'cap' | 'chef'; shoe?: string; cap?: string};
export const LOOKS: Record<string, Look> = {
  visitor: {skin: '#F7D8C2', hair: '#3A2A22', shirt: C.blue, pants: '#1E2C52', style: 'short'},
  maya: {skin: '#FADFCC', hair: '#7A4527', shirt: '#FF7A6B', pants: '#26365F', style: 'long'},
  sam: {skin: '#F5D3BC', hair: '#2B2B35', shirt: C.gold, pants: '#2D3B66', style: 'bun'},
  stranger: {skin: '#F6D6BE', hair: '#4A3426', shirt: '#8A9AC0', pants: '#1E2C52', style: 'cap', cap: '#0A1633'},
  chef: {skin: '#F8DAC4', hair: '#5A3A28', shirt: '#FFFFFF', pants: '#26365F', style: 'chef'},
};
export type Mood = 'happy' | 'neutral' | 'confused' | 'sad' | 'wow' | 'bored' | 'curious';

/**
 * Flat person, front view. (x, y) = feet. `walk` = phase in radians (legs and arms swing),
 * `arms` = [left, right] arm angles in degrees (0 = hanging; + swings the hand to the viewer's left).
 */
export const Person: React.FC<{
  look: Look; x: number; y: number; h?: number; mood?: Mood; walk?: number; arms?: [number, number]; f: number;
  phone?: boolean; magnifier?: boolean; o?: number; s?: number; tilt?: number;
}> = ({look, x, y, h = 420, mood = 'happy', walk, arms = [6, -6], f, phone, magnifier, o = 1, s = 1, tilt = 0}) => {
  const w = (h * 200) / 420;
  const sw = walk !== undefined ? Math.sin(walk) : 0;
  const bob = walk !== undefined ? -Math.abs(Math.cos(walk)) * 6 : Math.sin(f / 22) * 1.5;
  const leg = (side: number) => (walk !== undefined ? sw * 24 * side : 0);
  const arm = (side: number) => (side < 0 ? arms[0] : arms[1]) + (walk !== undefined ? -sw * 18 * side : Math.sin(f / 28 + side) * 2);
  const blink = f % 97 < 3 ? 0.12 : 1;
  const skinShade = shade(look.skin, -0.08);
  const shoe = look.shoe ?? '#0A1633';
  const brows: Record<Mood, [number, number]> = {happy: [0, 0], neutral: [0, 0], confused: [-14, 8], sad: [12, -12], wow: [-6, 6], bored: [4, -4], curious: [-10, 4]};
  const [bl, br] = brows[mood];
  return (
    <div style={{position: 'absolute', left: x - (w * s) / 2, top: y - h * s, width: w * s, height: h * s, opacity: o, transform: `rotate(${tilt}deg)`, transformOrigin: '50% 100%'}}>
      <svg viewBox="0 0 200 420" width={w * s} height={h * s} style={{overflow: 'visible'}}>
        <ellipse cx={100} cy={412} rx={56} ry={8} fill="rgba(10,22,51,0.13)" />
        <g transform={`translate(0 ${bob})`}>
          {look.style === 'long' && <path d="M50 78 Q48 150 64 168 L136 168 Q152 150 150 78 Z" fill={look.hair} />}
          {[-1, 1].map((sd) => {
            const hx = 100 + sd * 18;
            return (
              <g key={sd} transform={`rotate(${leg(sd)} ${hx} 256)`}>
                <rect x={hx - 13} y={250} width={26} height={138} rx={13} fill={look.pants} />
                <ellipse cx={hx + sd * 6} cy={392} rx={21} ry={11} fill={shoe} />
              </g>
            );
          })}
          <rect x={89} y={112} width={22} height={34} rx={9} fill={skinShade} />
          <path d="M56 178 Q56 140 100 140 Q144 140 144 178 L148 262 Q148 274 136 274 L64 274 Q52 274 52 262 Z" fill={look.shirt} />
          {look.shirt === '#FFFFFF' && <path d="M56 178 Q56 140 100 140 Q144 140 144 178 L148 262 Q148 274 136 274 L64 274 Q52 274 52 262 Z" fill="none" stroke="#E3E8F0" strokeWidth={3} />}
          <path d="M84 141 L100 166 L116 141 Z" fill={look.skin} />
          {look.style === 'chef' && [0, 1, 2].map((i) => <circle key={i} cx={100} cy={190 + i * 26} r={4} fill="#C9D3E6" />)}
          <rect x={56} y={256} width={88} height={14} rx={7} fill={shade(look.pants, -0.15)} />
          {phone && <rect x={78} y={176} width={44} height={74} rx={9} fill={C.navy} />}
          {phone && <rect x={83} y={182} width={34} height={60} rx={5} fill={C.sky} />}
          {[-1, 1].map((sd) => {
            const sx = 100 + sd * 38;
            return (
              <g key={sd} transform={`rotate(${arm(sd)} ${sx} 158)`}>
                <rect x={sx - 12} y={148} width={24} height={58} rx={12} fill={look.shirt} />
                {look.shirt === '#FFFFFF' && <rect x={sx - 12} y={148} width={24} height={58} rx={12} fill="none" stroke="#E3E8F0" strokeWidth={3} />}
                <rect x={sx - 10} y={196} width={20} height={50} rx={10} fill={look.skin} />
                <circle cx={sx} cy={248} r={13} fill={look.skin} />
                {magnifier && sd > 0 && (
                  <g>
                    <rect x={sx - 5} y={240} width={10} height={44} rx={5} fill={C.navy} />
                    <circle cx={sx} cy={312} r={34} fill="rgba(25,167,255,0.25)" stroke={C.navy} strokeWidth={9} />
                    <path d={`M${sx - 16} ${300} Q${sx - 10} ${290} ${sx} ${292}`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}
          <circle cx={53} cy={88} r={10} fill={skinShade} />
          <circle cx={147} cy={88} r={10} fill={skinShade} />
          <circle cx={100} cy={80} r={48} fill={look.skin} />
          {look.style !== 'cap' && look.style !== 'chef' && <path d="M52 82 Q50 30 100 28 Q150 30 148 82 Q142 58 120 52 Q98 66 66 58 Q56 66 52 82 Z" fill={look.hair} />}
          {look.style === 'bun' && <circle cx={100} cy={26} r={20} fill={look.hair} />}
          {look.style === 'cap' && (
            <g>
              <path d="M52 76 Q52 30 100 30 Q148 30 148 76 Z" fill={look.cap} />
              <path d="M96 70 Q140 62 172 74 Q150 82 100 80 Z" fill={shade(look.cap ?? C.navy, 0.15)} />
              <circle cx={100} cy={32} r={6} fill={C.gold} />
            </g>
          )}
          {look.style === 'chef' && (
            <g>
              <path d="M58 64 Q52 34 74 30 Q80 6 100 10 Q120 6 126 30 Q148 34 142 64 Z" fill="#FFFFFF" stroke="#E3E8F0" strokeWidth={3} />
              <rect x={58} y={56} width={84} height={20} rx={6} fill="#FFFFFF" stroke="#E3E8F0" strokeWidth={3} />
              <path d="M54 84 Q56 70 66 74 L66 90 Z" fill={look.hair} />
              <path d="M146 84 Q144 70 134 74 L134 90 Z" fill={look.hair} />
            </g>
          )}
          {/* face */}
          <g transform={`rotate(${bl} 84 72)`}><rect x={74} y={68} width={20} height={5} rx={2.5} fill={look.style === 'cap' || look.style === 'chef' ? look.hair : shade(look.hair, -0.1)} /></g>
          <g transform={`rotate(${br} 116 72)`}><rect x={106} y={68} width={20} height={5} rx={2.5} fill={look.style === 'cap' || look.style === 'chef' ? look.hair : shade(look.hair, -0.1)} /></g>
          <ellipse cx={84} cy={87} rx={5.5} ry={(mood === 'bored' ? 3 : mood === 'wow' ? 7.5 : 6.5) * blink} fill={C.navy} />
          <ellipse cx={116} cy={87} rx={5.5} ry={(mood === 'bored' ? 3 : mood === 'wow' ? 7.5 : 6.5) * blink} fill={C.navy} />
          <circle cx={86} cy={85} r={1.8} fill="#fff" opacity={blink} />
          <circle cx={118} cy={85} r={1.8} fill="#fff" opacity={blink} />
          <circle cx={72} cy={102} r={8} fill="#FF8F7A" opacity={0.28} />
          <circle cx={128} cy={102} r={8} fill="#FF8F7A" opacity={0.28} />
          <path d="M98 92 Q96 100 101 101" stroke={skinShade} strokeWidth={3} fill="none" strokeLinecap="round" />
          {mood === 'happy' && <path d="M86 108 Q100 124 114 108 Z" fill="#A8323E" />}
          {mood === 'curious' && <path d="M90 112 Q100 118 110 110" stroke="#A8323E" strokeWidth={4.5} fill="none" strokeLinecap="round" />}
          {mood === 'neutral' && <rect x={89} y={110} width={22} height={4.5} rx={2.2} fill="#A8323E" />}
          {mood === 'bored' && <path d="M88 114 Q100 110 112 113" stroke="#A8323E" strokeWidth={4.5} fill="none" strokeLinecap="round" />}
          {mood === 'confused' && <path d="M87 114 Q94 108 100 113 Q106 118 113 110" stroke="#A8323E" strokeWidth={4.5} fill="none" strokeLinecap="round" />}
          {mood === 'sad' && <path d="M88 116 Q100 106 112 116" stroke="#A8323E" strokeWidth={4.5} fill="none" strokeLinecap="round" />}
          {mood === 'wow' && <ellipse cx={100} cy={114} rx={7} ry={9} fill="#A8323E" />}
        </g>
      </svg>
    </div>
  );
};

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ---------------------------------------------------------------- devices
/** Phone mockup. Height = 2 x width. Children fill the screen. */
export const Phone: React.FC<{w: number; children?: React.ReactNode; glow?: number}> = ({w, children, glow = 0}) => (
  <div style={{width: w, height: w * 2, borderRadius: w * 0.15, background: 'linear-gradient(160deg, #1B2A55 0%, #0A1633 60%)', padding: 16, boxSizing: 'border-box', boxShadow: `${SHADOW}${glow ? `, 0 0 0 ${10 * glow}px rgba(0,82,255,${0.25 * glow})` : ''}`, position: 'relative'}}>
    <div style={{width: '100%', height: '100%', borderRadius: w * 0.12, overflow: 'hidden', background: '#fff', position: 'relative'}}>{children}</div>
    <div style={{position: 'absolute', top: 26, left: '50%', width: w * 0.26, height: 22, marginLeft: -w * 0.13, borderRadius: 20, background: '#0A1633'}} />
  </div>
);
/** screen point of a design-unit spot (dx, dy) inside the Site of a phone centred at (px, py) */
export const sitePt = (px: number, py: number, pw: number, dx: number, dy: number) => {
  const k = (pw - 32) / 400;
  return {x: px - pw / 2 + 16 + dx * k, y: py - pw + 16 + dy * k};
};

const Bar: React.FC<{w: number | string; h?: number; c?: string; mt?: number}> = ({w, h = 14, c = '#E9EEF6', mt = 0}) => (
  <div style={{width: w, height: h, borderRadius: h, background: c, marginTop: mt}} />
);

/**
 * A small-business homepage in design units (400 wide x 830 tall), scaled to `w`.
 * headline / button: what is written there (only words that are being said); undefined = grey placeholder.
 */
export const Site: React.FC<{
  w: number; headline?: React.ReactNode; headSize?: number; strike?: number; button?: React.ReactNode | null; btnScale?: number; btnShine?: number;
  clutter?: number; clutterOut?: number; audience?: number; topGlow?: number; fold?: number; load?: number; scroll?: number; dim?: number; f: number;
}> = ({w, headline, headSize = 38, strike = 0, button, btnScale = 1, btnShine = -1, clutter = 0, clutterOut = 0, audience = 0, topGlow = 0, fold = 0, load = 1, scroll = 0, dim = 0, f}) => {
  const k = w / 400;
  const hy = 96 + 74 * audience;
  const CL = [
    {x: 250, y: 330, w: 120, c: C.gold}, {x: 30, y: 470, w: 150, c: '#FF7A6B'}, {x: 210, y: 520, w: 160, c: '#8A9AC0'},
    {x: 40, y: 600, w: 130, c: C.green}, {x: 220, y: 650, w: 140, c: C.sky}, {x: 120, y: 735, w: 160, c: '#B07CFF'},
  ];
  return (
    <div style={{width: 400, height: 830, transform: `scale(${k})`, transformOrigin: '0 0', position: 'relative', fontFamily: fonts.heading, background: '#fff'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${-scroll}px)`}}>
        {/* nav */}
        <div style={{position: 'absolute', left: 22, top: 22, display: 'flex', alignItems: 'center', gap: 10}}>
          <div style={{width: 30, height: 30, borderRadius: 99, background: `linear-gradient(135deg, ${C.blue}, ${C.sky})`}} />
          <Bar w={84} h={13} c={C.navy} />
        </div>
        <div style={{position: 'absolute', right: 24, top: 26, display: 'flex', flexDirection: 'column', gap: 5}}>
          {[0, 1, 2].map((i) => <Bar key={i} w={26} h={4} c={C.navy} />)}
        </div>
        {/* audience chip */}
        {audience > 0 && (
          <div style={{position: 'absolute', left: 22, top: 84, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px 8px 8px', borderRadius: 99, background: '#EAF1FF', boxShadow: '0 8px 20px rgba(0,82,255,0.15)', transform: `scale(${audience})`, transformOrigin: '0 50%'}}>
            {['#F8DAC4', '#FADFCC', '#F5D3BC'].map((s, i) => (
              <svg key={i} width={48} height={48} viewBox="0 0 30 30" style={{marginLeft: i ? -16 : 0}}>
                <circle cx={15} cy={15} r={15} fill={i === 0 ? '#FFFFFF' : i === 1 ? '#FF7A6B' : C.gold} />
                <circle cx={15} cy={13} r={7} fill={s} />
                {i === 0 && <path d="M8 9 Q7 2 12 3 Q15 -1 18 3 Q23 2 22 9 Z" fill="#fff" stroke="#C9D3E6" strokeWidth={1.2} />}
                <path d="M5 27 Q15 17 25 27" fill={s} />
              </svg>
            ))}
            <Bar w={110} h={13} c={C.blue} />
          </div>
        )}
        {/* headline */}
        <div style={{position: 'absolute', left: 24, top: hy, width: 352, height: 228, opacity: load}}>
          {headline !== undefined ? (
            <div style={{fontSize: headSize, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.025em', color: C.navy}}>{headline}</div>
          ) : (
            <div>
              <Bar w={320} h={30} c="#DCE3EE" /><Bar w={270} h={30} c="#DCE3EE" mt={12} /><Bar w={190} h={30} c="#DCE3EE" mt={12} />
            </div>
          )}
          {strike > 0 && (
            <svg viewBox="0 0 352 200" width={352} height={200} style={{position: 'absolute', left: 0, top: -10, overflow: 'visible'}}>
              <path d="M6 20 L330 170" stroke={C.red} strokeWidth={14} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, strike * 2)} />
              <path d="M330 20 L6 170" stroke={C.red} strokeWidth={14} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, Math.min(1, strike * 2 - 1))} />
            </svg>
          )}
        </div>
        {/* sub lines */}
        <div style={{position: 'absolute', left: 24, top: 336 + 30 * audience, opacity: load}}>
          <Bar w={330} /><Bar w={250} mt={9} />
        </div>
        {/* button */}
        {button !== null && (
          <div style={{position: 'absolute', left: 24, top: 384 + 30 * audience, width: 300, height: 68, borderRadius: 99, background: `linear-gradient(135deg, ${C.blue}, #2A6BFF)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 31, fontWeight: 800, letterSpacing: '-0.01em', transform: `scale(${btnScale})`, boxShadow: `0 ${12 * btnScale}px ${30 * btnScale}px rgba(0,82,255,${0.2 + 0.25 * (btnScale - 1) * 4})`, overflow: 'hidden', opacity: load}}>
            {button === undefined ? <Bar w={120} h={12} c="rgba(255,255,255,0.75)" /> : button}
            {btnShine >= 0 && btnShine <= 1 && <div style={{position: 'absolute', top: -20, bottom: -20, width: 60, left: -80 + btnShine * 460, background: 'rgba(255,255,255,0.45)', transform: 'skewX(-20deg)'}} />}
          </div>
        )}
        {/* picture card */}
        <div style={{position: 'absolute', left: 24, top: 480 + 30 * audience, width: 352, height: 210, borderRadius: 26, overflow: 'hidden', background: 'linear-gradient(160deg, #DDEBFF 0%, #BFD8FF 100%)', opacity: load}}>
          <div style={{position: 'absolute', right: 40, top: 30, width: 54, height: 54, borderRadius: 99, background: C.gold}} />
          <div style={{position: 'absolute', left: -40, bottom: -90, width: 260, height: 200, borderRadius: '50%', background: '#8DB6FF'}} />
          <div style={{position: 'absolute', right: -60, bottom: -110, width: 320, height: 220, borderRadius: '50%', background: C.blue, opacity: 0.85}} />
        </div>
        {/* features */}
        <div style={{position: 'absolute', left: 24, top: 712 + 30 * audience, display: 'flex', gap: 14, opacity: load}}>
          {[C.blue, C.gold, C.green].map((c, i) => (
            <div key={i} style={{width: 108, height: 96, borderRadius: 18, background: C.cloud, padding: 14, boxSizing: 'border-box'}}>
              <div style={{width: 26, height: 26, borderRadius: 8, background: c}} /><Bar w={70} h={8} c="#DCE3EE" mt={12} /><Bar w={50} h={8} c="#DCE3EE" mt={6} />
            </div>
          ))}
        </div>
        {/* too many buttons */}
        {clutter > 0 && CL.map((b, i) => {
          const out = Math.max(0, Math.min(1, clutterOut * 1.6 - i * 0.12));
          return (
            <div key={i} style={{position: 'absolute', left: b.x, top: b.y + out * out * 700, width: b.w, height: 50, borderRadius: 99, background: b.c, opacity: clutter * (1 - out * 0.6), transform: `rotate(${(i % 2 ? 1 : -1) * (4 + out * 50)}deg) scale(${clutter})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(10,22,51,0.15)'}}>
              <Bar w={b.w * 0.5} h={9} c="rgba(255,255,255,0.8)" />
            </div>
          );
        })}
      </div>
      {/* loading skeleton */}
      {load < 1 && (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - load, background: '#fff', padding: 24, paddingTop: 90}}>
          {[300, 240, 330, 200, 330, 330].map((bw, i) => (
            <div key={i} style={{width: bw, height: i === 4 ? 200 : 26, marginBottom: 16, borderRadius: 14, background: `linear-gradient(90deg, #EEF2F8 ${((f * 4) % 200) - 60}%, #F8FAFD ${((f * 4) % 200) - 30}%, #EEF2F8 ${(f * 4) % 200}%)`}} />
          ))}
        </div>
      )}
      {topGlow > 0 && <div style={{position: 'absolute', left: 8, right: 8, top: 74, height: 300, borderRadius: 24, border: `5px solid ${C.blue}`, boxShadow: '0 0 40px rgba(0,82,255,0.35)', opacity: topGlow}} />}
      {fold > 0 && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 470, bottom: 0, background: `rgba(7,19,48,${0.62 * fold})`}} />
          <div style={{position: 'absolute', left: 10, right: 10, top: 10, height: 452, borderRadius: 26, border: `6px dashed ${C.blue}`, opacity: fold}} />
        </>
      )}
      {dim > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(7,19,48,${0.55 * dim})`}} />}
    </div>
  );
};

// ---------------------------------------------------------------- words
export type CueWord = {text: string; f: number; end: number};
/** Words appear exactly when they are spoken. Unspoken words keep their space so nothing jumps. */
export const Spoken: React.FC<{ws: CueWord[]; f: number; hi?: string[]; hiColor?: string; color?: string; lead?: number}> = ({ws, f, hi = [], hiColor = C.blue, color = C.navy, lead = 2}) => (
  <>
    {ws.map((w, i) => {
      const s = pop(f, w.f - lead, 20, 0.5);
      const on = f >= w.f - lead;
      const key = w.text.toLowerCase().replace(/[^a-z]/g, '');
      const isHi = hi.includes(key);
      const speaking = f >= w.f - lead && f < w.end + 4;
      return (
        <React.Fragment key={i}>
          <span style={{display: 'inline-block', opacity: on ? Math.min(1, s * 1.4) : 0, transform: `translateY(${(1 - s) * 18}px) scale(${0.7 + 0.3 * s})`, transformOrigin: '50% 80%', color: isHi ? hiColor : color, position: 'relative'}}>
            {isHi && <span style={{position: 'absolute', left: -4, right: -4, bottom: '0.06em', height: '0.32em', borderRadius: 6, background: `${hiColor}26`, transform: `scaleX(${ease(f, w.f, w.f + 8)})`, transformOrigin: '0 50%'}} />}
            <span style={{position: 'relative', textShadow: speaking ? `0 0 0.01px ${color}` : 'none'}}>{w.text}</span>
          </span>
          {i < ws.length - 1 ? ' ' : ''}
        </React.Fragment>
      );
    })}
  </>
);

/** Speech bubble; tail points to `tail` side at the bottom. */
export const Bubble: React.FC<{w: number; tail?: 'left' | 'right' | 'none'; children: React.ReactNode; color?: string; pad?: number}> = ({w, tail = 'left', children, color = '#fff', pad = 34}) => (
  <div style={{position: 'relative', width: w, background: color, borderRadius: 48, padding: `${pad}px ${pad + 8}px`, boxSizing: 'border-box', boxShadow: SHADOW}}>
    {children}
    {tail !== 'none' && (
      <svg width={70} height={60} viewBox="0 0 70 60" style={{position: 'absolute', bottom: -44, [tail]: 70, transform: tail === 'right' ? 'scaleX(-1)' : undefined} as any}>
        <path d="M0 0 L60 0 Q30 20 8 58 Q14 24 0 0 Z" fill={color} />
      </svg>
    )}
  </div>
);

export const Badge: React.FC<{size: number; bg: string; children: React.ReactNode; ring?: string}> = ({size, bg, children, ring}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOW, border: ring ? `${size * 0.04}px solid ${ring}` : undefined, boxSizing: 'border-box'}}>{children}</div>
);
export const NumBadge: React.FC<{n: string; size?: number; bg?: string; f: number}> = ({n, size = 230, bg = C.blue, f}) => (
  <div style={{position: 'relative', width: size, height: size}}>
    <div style={{position: 'absolute', inset: -18, borderRadius: '50%', border: `6px dashed ${bg}55`, transform: `rotate(${f * 0.8}deg)`}} />
    <Badge size={size} bg={`linear-gradient(140deg, ${bg} 0%, ${shade(bg, -0.25)} 100%)`}>
      <span style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: size * 0.58, color: '#fff', lineHeight: 1, marginTop: -size * 0.04}}>{n}</span>
    </Badge>
  </div>
);

// ---------------------------------------------------------------- icons (flat)
export const IconCard: React.FC<{size?: number; bg?: string; children: React.ReactNode}> = ({size = 210, bg = '#fff', children}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.28, background: bg, boxShadow: SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
);
export const Cloche: React.FC<{s?: number}> = ({s = 150}) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <ellipse cx={50} cy={78} rx={44} ry={7} fill="#DCE3EE" />
    <path d="M14 74 Q14 34 50 32 Q86 34 86 74 Z" fill={C.gold} />
    <path d="M24 64 Q26 46 42 40" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
    <rect x={8} y={72} width={84} height={8} rx={4} fill={shade(C.gold, -0.2)} />
    <circle cx={50} cy={28} r={7} fill={shade(C.gold, -0.2)} />
    <path d="M30 12 Q34 6 30 0 M50 14 Q54 8 50 2 M70 12 Q74 6 70 0" stroke="#C9D3E6" strokeWidth={3} fill="none" strokeLinecap="round" />
  </svg>
);
export const TexasIcon: React.FC<{s?: number}> = ({s = 160}) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <path d="M24 4 L44 4 L44 34 L58 37 L72 39 L86 39 L96 43 L97 62 L91 70 L79 77 L70 86 L66 98 L58 96 L50 86 L44 76 L36 66 L28 64 L22 70 L13 62 L7 52 L2 46 L24 46 Z" fill={C.blue} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
    <path d="M56 46 L59.5 55 L69 55 L61.5 61 L64.5 70 L56 64.5 L47.5 70 L50.5 61 L43 55 L52.5 55 Z" fill={C.gold} />
  </svg>
);
export const Ledger: React.FC<{s?: number}> = ({s = 160}) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <rect x={14} y={10} width={58} height={80} rx={8} fill={C.green} />
    <rect x={22} y={10} width={50} height={80} rx={6} fill="#fff" stroke="#E3E8F0" strokeWidth={2} />
    {[26, 38, 50, 62].map((y) => <rect key={y} x={30} y={y} width={32} height={5} rx={2.5} fill="#DCE3EE" />)}
    <rect x={56} y={46} width={34} height={46} rx={7} fill={C.navy} />
    <rect x={61} y={51} width={24} height={10} rx={3} fill={C.sky} />
    {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={62 + c * 12} y={66 + r * 8} width={9} height={5} rx={2} fill="#fff" opacity={0.8} />))}
  </svg>
);
export const CalendarIcon: React.FC<{s?: number; check?: number}> = ({s = 160, check = 1}) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <rect x={10} y={16} width={80} height={74} rx={12} fill="#fff" stroke="#E3E8F0" strokeWidth={2} />
    <path d="M10 28 Q10 16 22 16 L78 16 Q90 16 90 28 L90 34 L10 34 Z" fill={C.blue} />
    <rect x={28} y={8} width={8} height={18} rx={4} fill={C.navy} /><rect x={64} y={8} width={8} height={18} rx={4} fill={C.navy} />
    {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={20 + c * 16} y={44 + r * 14} width={10} height={8} rx={3} fill={r === 1 && c === 2 ? C.gold : '#DCE3EE'} />))}
    <g transform={`translate(70 74) scale(${check})`}>
      <circle r={17} fill={C.green} />
      <path d="M-8 0 L-2 6 L9 -6" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
export const DoorIcon: React.FC<{s?: number; open?: number}> = ({s = 200, open = 1}) => (
  <svg width={s} height={s * 1.3} viewBox="0 0 100 130">
    <rect x={14} y={6} width={72} height={118} rx={6} fill={C.navy} />
    <rect x={20} y={12} width={60} height={112} fill="#DCEBFF" />
    <path d="M60 46 L76 62 L60 78 M40 62 L74 62" stroke={C.blue} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={open} />
    <g transform={`translate(20 12) skewY(${-8 * open}) scale(${1 - 0.55 * open} 1)`}>
      <rect width={60} height={112} fill={C.gold} />
      <circle cx={50} cy={58} r={4} fill={C.navy} />
    </g>
  </svg>
);
export const ChartDrop: React.FC<{w?: number; p: number; drop: number}> = ({w = 640, p, drop}) => {
  const up = 'M30 250 L110 210 L190 225 L270 160 L350 175 L430 110';
  const down = 'M430 110 L520 270';
  return (
    <div style={{width: w, height: w * 0.66, borderRadius: 40, background: '#fff', boxShadow: SHADOW, padding: 30, boxSizing: 'border-box', position: 'relative'}}>
      <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
        <div style={{width: 40, height: 40, borderRadius: 12, background: '#EAF1FF', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={26} height={26} viewBox="0 0 26 26"><circle cx={13} cy={9} r={6} fill={C.blue} /><path d="M2 25 Q13 12 24 25" fill={C.blue} /></svg>
        </div>
        <Bar w={160} h={14} c="#DCE3EE" />
      </div>
      <svg viewBox="0 0 560 300" width={w - 60} height={(w - 60) * 0.53} style={{marginTop: 10, overflow: 'visible'}}>
        {[60, 130, 200, 270].map((y) => <line key={y} x1={20} x2={540} y1={y} y2={y} stroke="#EEF2F8" strokeWidth={3} />)}
        <path d={`${up} L430 290 L30 290 Z`} fill="rgba(0,82,255,0.08)" opacity={p} />
        <path d={up} stroke={C.blue} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        <path d={down} stroke={C.red} strokeWidth={9} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drop} />
        {drop > 0.95 && <path d="M500 262 L522 274 L528 248" stroke={C.red} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={430} cy={110} r={11 * p} fill="#fff" stroke={C.blue} strokeWidth={5} />
      </svg>
    </div>
  );
};
export const Signpost: React.FC<{h?: number; f: number}> = ({h = 520, f}) => (
  <svg width={h * 0.7} height={h} viewBox="0 0 140 200" style={{overflow: 'visible'}}>
    <ellipse cx={70} cy={196} rx={40} ry={5} fill="rgba(10,22,51,0.12)" />
    <rect x={64} y={20} width={12} height={176} rx={5} fill="#8A6A4E" />
    {[{y: 30, c: C.blue, d: 1, a: 6}, {y: 70, c: C.gold, d: -1, a: -8}, {y: 110, c: '#FF7A6B', d: 1, a: 10}].map((b, i) => (
      <g key={i} transform={`rotate(${b.a + Math.sin(f / 9 + i * 2) * 7} 70 ${b.y + 14})`}>
        <path d={b.d > 0 ? `M70 ${b.y} L128 ${b.y} L142 ${b.y + 14} L128 ${b.y + 28} L70 ${b.y + 28} Z` : `M70 ${b.y} L12 ${b.y} L-2 ${b.y + 14} L12 ${b.y + 28} L70 ${b.y + 28} Z`} fill={b.c} />
        <rect x={b.d > 0 ? 82 : 22} y={b.y + 11} width={34} height={6} rx={3} fill="#fff" opacity={0.8} />
      </g>
    ))}
  </svg>
);
export const Stopwatch: React.FC<{size?: number; p: number; n?: string; f: number}> = ({size = 300, p, n, f}) => {
  const R = 68, L = 2 * Math.PI * R;
  const warn = p < 0.34;
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220" style={{overflow: 'visible', filter: 'drop-shadow(0 24px 40px rgba(10,22,51,0.18))'}}>
      <rect x={86} y={4} width={28} height={16} rx={5} fill={C.navy} />
      <rect x={93} y={16} width={14} height={16} fill={C.navy} />
      <g transform={`rotate(${Math.sin(f / 3) * (warn ? 4 : 0)} 100 125)`}>
        <rect x={150} y={36} width={22} height={12} rx={4} fill={C.navy} transform="rotate(40 161 42)" />
        <circle cx={100} cy={125} r={90} fill={C.navy} />
        <circle cx={100} cy={125} r={78} fill="#fff" />
        <circle cx={100} cy={125} r={R} fill="none" stroke="#EEF2F8" strokeWidth={14} />
        <circle cx={100} cy={125} r={R} fill="none" stroke={warn ? C.red : C.blue} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${L * p} ${L}`} transform="rotate(-90 100 125)" />
        {n && <text x={100} y={150} textAnchor="middle" fontFamily={fonts.heading} fontWeight={800} fontSize={74} fill={warn ? C.red : C.navy}>{n}</text>}
      </g>
    </svg>
  );
};
export const QBubble: React.FC<{size?: number; bg?: string; mark?: 'q' | 'x' | 'check'}> = ({size = 150, bg = '#fff', mark = 'q'}) => {
  const fg = mark === 'x' ? '#fff' : mark === 'check' ? '#fff' : C.blue;
  const b = mark === 'x' ? C.red : mark === 'check' ? C.green : bg;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', filter: 'drop-shadow(0 16px 26px rgba(10,22,51,0.16))'}}>
      <circle cx={50} cy={46} r={42} fill={b} />
      <path d="M30 80 L22 98 L46 86 Z" fill={b} />
      {mark === 'q' && <text x={50} y={66} textAnchor="middle" fontFamily={fonts.heading} fontWeight={800} fontSize={58} fill={fg}>?</text>}
      {mark === 'x' && <path d="M34 30 L66 62 M66 30 L34 62" stroke={fg} strokeWidth={10} strokeLinecap="round" />}
      {mark === 'check' && <path d="M30 46 L44 60 L70 32" stroke={fg} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
};
export const StopBadge: React.FC<{s?: number}> = ({s = 170}) => (
  <svg width={s} height={s} viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 16px 26px rgba(255,77,94,0.3))'}}>
    <path d="M30 4 L70 4 L96 30 L96 70 L70 96 L30 96 L4 70 L4 30 Z" fill={C.red} />
    <path d="M30 4 L70 4 L96 30 L96 70 L70 96 L30 96 L4 70 L4 30 Z" fill="none" stroke="#fff" strokeWidth={4} transform="translate(50 50) scale(0.86) translate(-50 -50)" />
    <rect x={22} y={44} width={56} height={12} rx={6} fill="#fff" />
  </svg>
);
export const CheckBadge: React.FC<{s?: number; bg?: string}> = ({s = 130, bg = C.green}) => (
  <svg width={s} height={s} viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 16px 26px rgba(10,22,51,0.18))'}}>
    <circle cx={50} cy={50} r={46} fill={bg} />
    <path d="M28 51 L43 66 L73 36" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const XBadge: React.FC<{s?: number}> = ({s = 130}) => (
  <svg width={s} height={s} viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 16px 26px rgba(10,22,51,0.18))'}}>
    <circle cx={50} cy={50} r={46} fill={C.red} />
    <path d="M33 33 L67 67 M67 33 L33 67" stroke="#fff" strokeWidth={11} strokeLinecap="round" />
  </svg>
);
export const EyeIcon: React.FC<{s?: number; f: number}> = ({s = 170, f}) => {
  const look = Math.sin(f / 10) * 6;
  const blink = f % 70 < 3 ? 0.1 : 1;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 16px 26px rgba(10,22,51,0.16))'}}>
      <circle cx={50} cy={50} r={48} fill="#fff" />
      <g transform={`translate(50 50) scale(1 ${blink}) translate(-50 -50)`}>
        <path d="M10 50 Q50 14 90 50 Q50 86 10 50 Z" fill="#EAF1FF" />
        <circle cx={50 + look} cy={50} r={17} fill={C.blue} />
        <circle cx={50 + look} cy={50} r={8} fill={C.navy} />
        <circle cx={55 + look} cy={45} r={4} fill="#fff" />
      </g>
    </svg>
  );
};
export const Sparkle: React.FC<{s?: number; color?: string}> = ({s = 60, color = C.gold}) => (
  <svg width={s} height={s} viewBox="0 0 40 40"><path d="M20 0 Q23 17 40 20 Q23 23 20 40 Q17 23 0 20 Q17 17 20 0 Z" fill={color} /></svg>
);
/** burst of sparkles around a point, starting at frame t */
export const Burst: React.FC<{x: number; y: number; t: number; f: number; r?: number; color?: string; n?: number}> = ({x, y, t, f, r = 150, color = C.gold, n = 6}) => {
  const d = f - t;
  if (d < 0 || d > 26) return null;
  const k = ease(d, 0, 18);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.4;
        return <At key={i} x={x + Math.cos(a) * r * k} y={y + Math.sin(a) * r * k} s={(1 - ease(d, 12, 26)) * (i % 2 ? 0.6 : 1)} r={d * 4}><Sparkle s={44} color={i % 2 ? C.sky : color} /></At>;
      })}
    </>
  );
};
export const Ripple: React.FC<{x: number; y: number; t: number; f: number; color?: string}> = ({x, y, t, f, color = C.blue}) => {
  const d = f - t;
  if (d < 0 || d > 20) return null;
  return (
    <>
      {[0, 6].map((o) => {
        const k = ease(d - o, 0, 14);
        if (d < o) return null;
        return <div key={o} style={{position: 'absolute', left: x - 90 * k, top: y - 90 * k, width: 180 * k, height: 180 * k, borderRadius: '50%', border: `6px solid ${color}`, opacity: 1 - k}} />;
      })}
    </>
  );
};
export const Puff: React.FC<{x: number; y: number; t: number; f: number}> = ({x, y, t, f}) => {
  const d = f - t;
  if (d < 0 || d > 24) return null;
  const k = ease(d, 0, 20);
  return (
    <>
      {[[-70, -10, 70], [0, -50, 90], [70, -10, 70], [-36, 40, 60], [40, 40, 64]].map(([dx, dy, r], i) => (
        <div key={i} style={{position: 'absolute', left: x + dx * (0.6 + k) - (r * (0.5 + k)) / 2, top: y + dy * (0.6 + k) - (r * (0.5 + k)) / 2, width: r * (0.5 + k), height: r * (0.5 + k), borderRadius: '50%', background: '#E6ECF5', opacity: 1 - k}} />
      ))}
    </>
  );
};
export const SpeedLines: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) => (
  <>
    {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: x + (i % 2) * 40, top: y + i * 60, width: 160 - i * 20, height: 12, borderRadius: 6, background: C.sky, opacity: o * (0.8 - i * 0.12)}} />)}
  </>
);
export const Wrench: React.FC<{s?: number}> = ({s = 120}) => (
  <svg width={s} height={s} viewBox="0 0 100 100">
    <path d="M70 8 Q56 6 50 20 Q46 30 50 38 L12 76 Q6 84 14 90 Q20 96 26 88 L64 50 Q72 54 82 50 Q96 42 92 28 L80 40 L66 36 L62 22 Z" fill={C.blue} />
  </svg>
);
export const PaperPlane: React.FC<{s?: number}> = ({s = 40}) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M2 11 L22 2 L15 22 L11 13 Z" fill="#fff" /><path d="M11 13 L22 2" stroke={C.blue} strokeWidth={1.6} /></svg>
);

// ---------------------------------------------------------------- real hand
const HANDS = {
  tap: {src: 'img/hands/tap.png', w: 298, tx: 94, ty: 2, k: 1.08},
  point: {src: 'img/hands/point-up.png', w: 239, tx: 130, ty: 2, k: 1.1},
  marker: {src: 'img/hands/marker.png', w: 410, tx: 4, ty: 4, k: 0.85},
};
export type HandKey = {f: number; x: number; y: number};
/** A real hand gliding between key points (fingertip / marker tip position); presses on `taps` frames. */
export const Hand: React.FC<{f: number; keys: HandKey[]; kind?: keyof typeof HANDS; taps?: number[]; rot?: number}> = ({f, keys, kind = 'tap', taps = [], rot = -6}) => {
  if (!keys.length || f < keys[0].f || f > keys[keys.length - 1].f) return null;
  let i = 0;
  while (i < keys.length - 2 && f > keys[i + 1].f) i++;
  const a = keys[i], b = keys[i + 1] ?? a;
  const t = b.f === a.f ? 1 : ease(f, a.f, b.f);
  let x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
  let press = 0;
  for (const tp of taps) {
    const d = f - tp + 4;
    if (d >= 0 && d < 10) press = Math.max(press, Math.sin((d / 10) * Math.PI));
  }
  y += press * 10;
  const H = HANDS[kind];
  const w = H.w * H.k;
  return (
    <div style={{position: 'absolute', left: x - H.tx * H.k, top: y - H.ty * H.k, width: w, transform: `rotate(${rot + Math.sin(f / 9) * 1.2}deg) scale(${1 - press * 0.05})`, transformOrigin: `${H.tx * H.k}px ${H.ty * H.k}px`, zIndex: 50, filter: 'drop-shadow(16px 30px 24px rgba(10,22,51,0.25))'}}>
      <Img src={staticFile(H.src)} style={{width: w}} />
    </div>
  );
};
