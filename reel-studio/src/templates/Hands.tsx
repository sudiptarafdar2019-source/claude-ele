import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from '../brand';
import {ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {Sfx} from '../components/Sound';
import {ease, pop} from '../lib/motion';
import {beatAt} from '../lib/timing';
import {TemplateProps} from './types';
import {ResolvedBeat, Timing} from '../types';
import {Built, El} from '../components/sketch/engine';
import {buildSketch, SKETCH_WORDS} from '../components/sketch/scenes';
import {BoardStyle, handTip, SketchView, THEMES} from '../components/sketch/Board';

const BX = 40, BY = 190; // board box (1000 x 1100) on screen
const LEAD_ERASE = 16, LEAD_PAN = 12;

type Slot = {from: number; to: number; name: string; beat: number; first: boolean; i: number; trans: 'pan' | 'pan-up' | 'erase'};

/** Which drawing plays when: a beat's `show` (one or a list that splits the beat) or a keyword in what is said. */
export const sketchSlots = (beats: ResolvedBeat[], timing: Timing): Slot[] => {
  const out: Slot[] = [];
  const fallback = ['website', 'idea', 'customer', 'grow'];
  let k = 0;
  for (const b of beats) {
    let names: string[];
    if (b.show) names = Array.isArray(b.show) ? b.show : [b.show];
    else {
      const ws = timing.words.filter((w) => w.start * FPS >= b.from - 3 && w.start * FPS < b.to);
      const hit = ws.map((w) => SKETCH_WORDS[w.text.toLowerCase().replace(/[^a-z]/g, '')]).find(Boolean);
      names = [hit ?? fallback[b.index % fallback.length]];
    }
    const len = (b.to - b.from) / names.length;
    names.forEach((n, i) => {
      out.push({from: Math.round(b.from + i * len), to: Math.round(b.from + (i + 1) * len), name: n, beat: b.index, first: i === 0, i: k, trans: k === 0 ? 'pan' : k % 3 === 1 ? 'erase' : k % 3 === 2 ? 'pan' : 'pan-up'});
      k++;
    });
  }
  if (out.length) out[0].from = 0;
  return out;
};

const lead = (s: Slot) => (s.i === 0 ? 4 : s.trans === 'erase' ? LEAD_ERASE : LEAD_PAN);

/** time-scale so every drawing finishes with a little time left to look at it */
const sceneFrame = (s: Slot, built: Built, frame: number) => {
  const avail = Math.max(20, s.to - s.from - lead(s) - 14);
  const k = Math.min(1, avail / Math.max(1, built.total));
  return (frame - s.from - lead(s)) / k;
};

/**
 * TEMPLATE · HAND EXPLAINER
 * A real hand draws a storyboard for each line: doodle people, webpages, shops, charts,
 * colours them in, sometimes paints a whole picture across, and slides in a polaroid of you
 * now and then. The board pans or gets wiped between drawings. Boards: white, chalk, paper, blueprint.
 */
export const Hands: React.FC<TemplateProps> = ({reel, timing, beats}) => {
  const frame = useCurrentFrame();
  const style: BoardStyle = (reel.board as BoardStyle) ?? 'white';
  const T = THEMES[style];
  const slots = React.useMemo(() => sketchSlots(beats, timing), [beats, timing]);
  const builds = React.useMemo(() => slots.map((s) => {
    const bt = buildSketch(s.name, s.i + 1);
    const beat = beats[s.beat];
    if (s.first && beat.photo) {
      const right = beat.photoAt !== 'left';
      const el: El = {kind: 'photo', face: beat.photo, x: right ? 690 : 10, y: 700, w: 290, rot: right ? 5 : -5, t0: 2, g: 0};
      return {...bt, els: [...bt.els, el]};
    }
    return bt;
  }), [slots, beats]);
  let si = 0;
  slots.forEach((s, i) => { if (s.from <= frame) si = i; });
  const s = slots[si];
  const built = builds[si];
  const fs = sceneFrame(s, built, frame);
  const fin = frame - s.from; // frames since the slot started
  const prev = si > 0 ? slots[si - 1] : null;
  const tr = s.trans;
  const tl = lead(s);
  const tk = prev ? ease(fin, 0, tl) : 1;
  // board moves
  const panX = tr === 'pan' ? 1 : 0, panY = tr === 'pan-up' ? 1 : 0;
  const newOff = {x: prev ? (1 - tk) * 1080 * panX : 0, y: prev ? (1 - tk) * 1300 * panY : 0};
  const oldOff = {x: -tk * 1080 * panX, y: -tk * 1300 * panY};
  const showPrev = prev && tk < 1;
  const oldOpacity = tr === 'erase' ? 1 - ease(fin, 2, tl - 2) : 1;
  // hand
  const tip = handTip(built, fs);
  const handAway = Math.max(tip.away, showPrev && tr !== 'erase' ? 1 : 0);
  const beat = beatAt(beats, frame);
  const thumbs = beat.hand === 'thumbs-up';
  const bf = frame - beat.from;
  return (
    <AbsoluteFill>
      {T.bg}
      {showPrev && (
        <div style={{position: 'absolute', left: BX + oldOff.x, top: BY + oldOff.y, width: 1000, height: 1100, opacity: oldOpacity}}>
          <SketchView built={builds[si - 1]} f={1e5} style={style} id={`s${si - 1}`} />
        </div>
      )}
      <div style={{position: 'absolute', left: BX + newOff.x, top: BY + newOff.y, width: 1000, height: 1100, transform: `scale(${1 + Math.min(1, Math.max(0, fin) / 300) * 0.025})`, transformOrigin: '50% 50%'}}>
        <SketchView built={built} f={fs} style={style} id={`s${si}`} />
      </div>
      {/* felt eraser wiping the board */}
      {showPrev && tr === 'erase' && (
        <div style={{position: 'absolute', left: BX + 40 + ((fin * 3) % 2 < 1 ? 0 : 0) + Math.abs(Math.sin(fin / 2.4)) * 700, top: BY + 80 + (fin / tl) * 820, width: 230, height: 110, borderRadius: 16, background: 'linear-gradient(#2B3A67 0 55%, #D9D4C7 55%)', boxShadow: '0 20px 40px rgba(0,0,0,0.35)', transform: 'rotate(-12deg)'}} />
      )}
      {/* marker hand: the marker tip is the image's top-left corner */}
      {handAway < 1 && (
        <Img src={staticFile('img/hands/marker.png')} style={{position: 'absolute', left: BX + tip.x + newOff.x + handAway * 700, top: BY + tip.y + newOff.y + handAway * 1000, width: 410, transform: `rotate(${Math.sin(frame / 3) * 1.6}deg)`, transformOrigin: '0 0', filter: 'drop-shadow(18px 30px 26px rgba(10,22,51,0.28))'}} />
      )}
      {thumbs && (
        <Img src={staticFile('img/hands/thumbs-up.png')} style={{position: 'absolute', right: 30, top: 1080 + (1 - pop(bf, 30, 10)) * 900, width: 360, transform: `rotate(${Math.sin(frame / 5) * 4}deg)`, filter: 'drop-shadow(18px 30px 26px rgba(10,22,51,0.25))'}} />
      )}
      <Captions words={timing.words} y={1390} style={T.dark ? 'dark' : 'board'} size={76} />
      <ProgressBar track={T.dark ? 'rgba(255,255,255,0.15)' : 'rgba(10,22,51,0.08)'} />
    </AbsoluteFill>
  );
};

/** marker sound when a drawing starts, a soft swoosh when the board is wiped */
export const handsSfx = (beats: ResolvedBeat[], timing: Timing): Sfx[] => {
  const out: Sfx[] = [];
  for (const s of sketchSlots(beats, timing)) {
    if (s.trans === 'erase' && s.i > 0) out.push({f: s.from, src: 'swoosh', vol: 0.25});
    out.push({f: s.from + lead(s), src: 'marker', vol: 0.2});
  }
  return out;
};
