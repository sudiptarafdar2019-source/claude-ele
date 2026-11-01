import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {fitText, measureText} from '@remotion/layout-utils';
import {getLength, getPointAtLength} from '@remotion/paths';
import {C, FPS, fonts} from '../brand';
import {Camera, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {tapFrame} from '../components/Phone';
import {Sfx} from '../components/Sound';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {ease, pop} from '../lib/motion';
import {TemplateProps} from './types';
import {ResolvedBeat} from '../types';

const TEXT_Y = 330; // centre line of the handwritten title
const WRITE_START = 2;
const writeLen = (b: ResolvedBeat) => Math.min(26, Math.max(12, Math.round((b.to - b.from) * 0.35)));
const PHONE_W = 430;
const PROP_TOP = 560;

const textBox = (text: string) => {
  const {fontSize} = fitText({text, withinWidth: 900, fontFamily: fonts.hand, fontWeight: '700'});
  const size = Math.min(118, fontSize);
  const {width} = measureText({text, fontFamily: fonts.hand, fontSize: size, fontWeight: '700'});
  return {size, width, x0: 540 - width / 2, x1: 540 + width / 2};
};

const decoPath = (kind: string, x0: number, x1: number, size: number) => {
  const y = TEXT_Y + size * 0.55;
  switch (kind) {
    case 'underline':
      return `M ${x0} ${y} C ${x0 + (x1 - x0) * 0.3} ${y + 14}, ${x0 + (x1 - x0) * 0.7} ${y - 8}, ${x1} ${y + 6}`;
    case 'circle': {
      const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2 + 50, ry = size * 0.85;
      return `M ${cx - rx} ${TEXT_Y} A ${rx} ${ry} 0 1 0 ${cx + rx} ${TEXT_Y - 10} A ${rx} ${ry} 0 1 0 ${cx - rx + 30} ${TEXT_Y - 30}`;
    }
    case 'box':
      return `M ${x0 - 40} ${TEXT_Y - size * 0.7} L ${x1 + 40} ${TEXT_Y - size * 0.72} L ${x1 + 42} ${TEXT_Y + size * 0.72} L ${x0 - 38} ${TEXT_Y + size * 0.7} Z`;
    case 'arrow':
      return `M ${x1 + 20} ${TEXT_Y + 10} C ${x1 + 120} ${TEXT_Y + 60}, ${x1 + 90} ${TEXT_Y + 230}, ${Math.min(x1, 800)} ${TEXT_Y + 300} M ${Math.min(x1, 800) + 40} ${TEXT_Y + 255} L ${Math.min(x1, 800)} ${TEXT_Y + 300} L ${Math.min(x1, 800) + 55} ${TEXT_Y + 315}`;
    case 'check':
      return `M ${x1 + 30} ${TEXT_Y} L ${x1 + 70} ${TEXT_Y + 40} L ${x1 + 140} ${TEXT_Y - 60}`;
    case 'cross':
      return `M 300 ${PROP_TOP + 220} L 780 ${PROP_TOP + 470} M 780 ${PROP_TOP + 220} L 300 ${PROP_TOP + 470}`;
    default:
      return '';
  }
};

/**
 * TEMPLATE 3 · HAND EXPLAINER (whiteboard)
 * A realistic hand writes the key words, circles and underlines them, and taps the
 * phone mockup. Every write gets a marker sound, every tap a click.
 */
export const Hands: React.FC<TemplateProps> = ({reel, timing, beats}) => {
  const frame = useCurrentFrame();
  const b = beatAt(beats, frame);
  const f = frame - b.from;
  const dur = b.to - b.from;
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  const text = b.write ?? '';
  const tb = textBox(text || ' ');
  const wl = writeLen(b);
  const wp = ease(f, WRITE_START, WRITE_START + wl, 0, 1, (t) => t);
  // decoration
  const d = b.draw && b.draw !== 'none' ? decoPath(b.draw, tb.x0, tb.x1, tb.size) : '';
  const dStart = WRITE_START + wl + 2;
  const dLen = 10;
  const len = d ? getLength(d) : 0;
  const dp = ease(f, dStart, dStart + dLen, 0, 1, (t) => t);
  // where is the marker tip?
  let tip: {x: number; y: number} | null = null;
  if (f >= WRITE_START - 4 && f <= WRITE_START + wl) tip = {x: tb.x0 + tb.width * wp, y: TEXT_Y + Math.sin(f * 1.7) * 14 + 10};
  else if (d && f > WRITE_START + wl && f <= dStart + dLen) tip = getPointAtLength(d, len * dp);
  const handOut = ease(f, dStart + dLen + 2, dStart + dLen + 12); // leaves after drawing
  const handIn = ease(f, WRITE_START - 6, WRITE_START);
  const lastTip = d ? getPointAtLength(d, len) : {x: tb.x1, y: TEXT_Y};
  const hp = tip ?? lastTip;
  const showMarker = frame > hookEnd - 4 && text && handOut < 1;
  // tap hand
  const tf = tapFrame(dur);
  const tapIn = ease(f, tf - 10, tf - 1);
  const tapOut = ease(f, tf + 8, tf + 18);
  const tapPress = f >= tf && f < tf + 6 ? 0.94 : 1;
  const btn = {x: 540 - PHONE_W / 2 + PHONE_W * 0.33, y: PROP_TOP + PHONE_W * 2.05 * 0.47};
  const thumbs = b.hand === 'thumbs-up';
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F3F5F9 70%, #E7EBF2 100%)'}}>
        <AbsoluteFill style={{opacity: 0.35, backgroundImage: 'linear-gradient(115deg, rgba(10,22,51,0.025) 0%, rgba(255,255,255,0) 40%, rgba(10,22,51,0.03) 70%, rgba(255,255,255,0) 100%)'}} />
      </AbsoluteFill>
      <Camera cutFrame={b.from} index={b.index} strength={0.6}>
        {frame > hookEnd && text && (
          <div style={{position: 'absolute', left: tb.x0 - 4, top: TEXT_Y - tb.size * 0.7, width: tb.width + 40, fontFamily: fonts.hand, fontWeight: 700, fontSize: tb.size, lineHeight: 1.3, color: C.navy, whiteSpace: 'nowrap', clipPath: `inset(-20% ${(1 - wp) * 100}% -20% -2%)`}}>
            {text}
          </div>
        )}
        {frame > hookEnd && d && (
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <path d={d} fill="none" stroke={b.draw === 'cross' ? C.red : b.draw === 'check' ? C.green : C.blue} strokeWidth={b.draw === 'cross' ? 22 : 12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - dp)} />
          </svg>
        )}
        {b.prop && (
          <div style={{position: 'absolute', top: PROP_TOP, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: b.draw === 'cross' ? 0 : 1}}>
            <PropView prop={b.prop} f={f - 4} dur={dur} theme="board" width={b.prop.type === 'phone' ? PHONE_W / 0.62 : 860} />
          </div>
        )}
        {b.draw === 'cross' && d && (
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <path d={d} fill="none" stroke={C.red} strokeWidth={22} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - dp)} />
          </svg>
        )}
      </Camera>
      {/* marker hand (tip of the marker is the image's top-left corner) */}
      {showMarker && (
        <Img src={staticFile('img/hands/marker.png')} style={{position: 'absolute', left: hp.x - 2 + (1 - handIn) * 500 + handOut * 600, top: hp.y - 2 + (1 - handIn) * 700 + handOut * 900, width: 410, transform: `rotate(${Math.sin(f / 3) * 2}deg)`, transformOrigin: '0 0', filter: 'drop-shadow(18px 30px 26px rgba(10,22,51,0.25))'}} />
      )}
      {b.prop?.tap && f > tf - 12 && tapOut < 1 && (
        <Img src={staticFile('img/hands/tap.png')} style={{position: 'absolute', left: btn.x - 89 + (1 - tapIn) * 380 + tapOut * 400, top: btn.y - 4 + (1 - tapIn) * 700 + tapOut * 800, width: 298, transform: `scale(${tapPress})`, transformOrigin: '89px 0', filter: 'drop-shadow(18px 30px 26px rgba(10,22,51,0.25))'}} />
      )}
      {b.prop?.tap && f >= tf && f < tf + 14 && (
        <div style={{position: 'absolute', left: btn.x - 60, top: btn.y - 60, width: 120, height: 120, borderRadius: 999, border: `6px solid ${C.blue}`, transform: `scale(${0.4 + ease(f, tf, tf + 14) * 1.6})`, opacity: 1 - ease(f, tf, tf + 14)}} />
      )}
      {thumbs && (
        <Img src={staticFile('img/hands/thumbs-up.png')} style={{position: 'absolute', right: 60, top: 640 + (1 - pop(f, 14, 10)) * 900, width: 470, transform: `rotate(${Math.sin(f / 5) * 4}deg)`, filter: 'drop-shadow(18px 30px 26px rgba(10,22,51,0.25))'}} />
      )}
      <HookTitle text={reel.hook} hi={reel.hookHighlight} until={hookEnd} top={300} />
      <Captions words={timing.words} y={1530} style="board" size={74} />
      <NamePill voice={reel.voice} />
      <ProgressBar track="rgba(10,22,51,0.08)" />
    </AbsoluteFill>
  );
};

export const handsSfx = (beats: ResolvedBeat[], hookEnd: number): Sfx[] =>
  beats.flatMap((b) => {
    const out: Sfx[] = [];
    if (b.write && b.from + WRITE_START > hookEnd - 4) out.push({f: b.from + WRITE_START, src: 'marker', vol: 0.3});
    if (b.draw && b.draw !== 'none') out.push({f: b.from + WRITE_START + writeLen(b) + 2, src: 'marker', vol: 0.25});
    if (b.hand === 'thumbs-up') out.push({f: b.from + 14, src: 'soft-pop-2', vol: 0.4});
    return out;
  });
