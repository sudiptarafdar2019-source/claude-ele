import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {captionPages, cleanWord} from '../lib/timing';
import {pop} from '../lib/motion';
import {Word} from '../types';

type Style = 'dark' | 'light' | 'board' | 'podcast';
/**
 * Word-by-word animated captions. Each page holds up to 3 words; every word pops in
 * when it is spoken and the word being spoken is highlighted. Emphasised (CAPS) words
 * get the accent colour. `y` is the vertical centre of the caption block (keep it
 * between 700 and 1450 so Instagram/TikTok buttons never cover it).
 */
export const Captions: React.FC<{words: Word[]; y: number; style?: Style; size?: number; hideBefore?: number; hideAfter?: number}> = ({
  words, y, style = 'dark', size = 78, hideBefore = 0, hideAfter = 1e9,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pages = useMemo(() => captionPages(words), [words]);
  if (frame < hideBefore || frame > hideAfter) return null;
  const page = pages.find((p) => t >= p.start - 0.05 && t < p.end);
  if (!page) return null;
  const pal = {
    dark: {fg: '#FFFFFF', active: C.gold, emph: C.gold, stroke: 'rgba(7,19,48,0.85)', chip: 'transparent'},
    podcast: {fg: '#FFFFFF', active: C.gold, emph: C.gold, stroke: 'rgba(0,0,0,0.9)', chip: 'transparent'},
    light: {fg: C.navy, active: '#FFFFFF', emph: C.blue, stroke: 'rgba(255,255,255,0.95)', chip: C.blue},
    board: {fg: C.navy, active: '#FFFFFF', emph: C.blue, stroke: 'rgba(255,255,255,0.95)', chip: C.blue},
  }[style];
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: y - 120, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 18px', textAlign: 'center'}}>
      {page.words.map((w) => {
        const wf = Math.round(w.start * FPS);
        const s = pop(frame, wf - 2, 11, 0.5);
        const active = t >= w.start - 0.03 && t < w.end + 0.08;
        const shown = frame >= wf - 2;
        const chipOn = active && (style === 'light' || style === 'board');
        const color = chipOn ? pal.active : w.emph ? pal.emph : active ? pal.active : pal.fg;
        return (
          <span key={w.i} style={{
            fontFamily: fonts.heading, fontWeight: 800, fontSize: size * (w.emph ? 1.18 : 1), lineHeight: 1.05,
            letterSpacing: '-0.02em', color, opacity: shown ? 1 : 0,
            transform: `translateY(${(1 - s) * 26}px) scale(${0.75 + 0.25 * s})`,
            WebkitTextStroke: chipOn ? '0px' : `10px ${pal.stroke}`, paintOrder: 'stroke fill',
            textShadow: style === 'dark' || style === 'podcast' ? '0 6px 24px rgba(0,0,0,0.45)' : 'none',
            background: chipOn ? pal.chip : 'transparent', borderRadius: 18, padding: chipOn ? '2px 16px 8px' : '2px 4px 8px',
            boxShadow: chipOn ? '0 10px 30px rgba(0,82,255,0.35)' : 'none', display: 'inline-block',
          }}>
            {cleanWord(w.text)}
          </span>
        );
      })}
    </div>
  );
};
