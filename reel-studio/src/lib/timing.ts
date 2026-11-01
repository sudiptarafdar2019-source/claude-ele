import {FPS} from '../brand';
import {ReelSpec, ResolvedBeat, Timing, Word} from '../types';

export const norm = (s: string) => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9']/g, '');
export const HOOK_SECONDS = 2.4;
export const TAIL_SECONDS = 2.6; // end card after the voice

export const totalFrames = (t: Timing) => Math.ceil((t.duration + TAIL_SECONDS) * FPS);
export const voiceEndFrame = (t: Timing) => {
  const last = t.words[t.words.length - 1];
  return Math.round(((last?.end ?? t.duration) + 0.25) * FPS);
};

/** Find where each beat's "at" phrase is spoken and turn it into frames. */
export function resolveBeats(reel: ReelSpec, timing: Timing): ResolvedBeat[] {
  const words = timing.words.map((w) => norm(w.text));
  let cursor = 0;
  const starts: number[] = [];
  for (const b of reel.beats) {
    const target = b.at.split(/\s+/).map(norm).filter(Boolean);
    let found = -1;
    for (let i = cursor; i <= words.length - target.length && found < 0; i++) {
      if (target.every((t, k) => words[i + k] === t)) found = i;
    }
    if (found < 0) {
      // loose match: first word only
      for (let i = cursor; i < words.length && found < 0; i++) if (words[i] === target[0]) found = i;
    }
    if (found < 0) found = Math.min(cursor + 1, words.length - 1);
    starts.push(found);
    cursor = found + 1;
  }
  const end = voiceEndFrame(timing);
  return reel.beats.map((b, i) => {
    const w = timing.words[starts[i]];
    const from = i === 0 ? 0 : Math.max(0, Math.round((w.start - 0.1) * FPS));
    const nextW = timing.words[starts[i + 1]];
    const to = i + 1 < reel.beats.length ? Math.max(from + 6, Math.round((nextW.start - 0.1) * FPS)) : end;
    return {...b, index: i, from, to, wordIndex: starts[i]};
  });
}

export const beatAt = (beats: ResolvedBeat[], frame: number) => {
  let cur = beats[0];
  for (const b of beats) if (frame >= b.from) cur = b;
  return cur;
};

const NUM: Record<string, string> = {ten: '10', twenty: '20', thirty: '30', sixty: '60', ninety: '90', hundred: '100'};
export const cleanWord = (s: string) => {
  let t = s.replace(/\.\.\./g, '').replace(/^["“]+|["”]+$/g, '').replace(/[“”"]/g, '');
  t = t.replace(/[.,;:]+$/g, '');
  const n = NUM[norm(t)];
  return n ?? t;
};

export type CaptionPage = {words: (Word & {i: number})[]; start: number; end: number};
/** Group words into short caption pages (max 3 words / ~16 characters). */
export function captionPages(words: Word[], maxWords = 3, maxChars = 16): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let cur: (Word & {i: number})[] = [];
  const flush = () => {
    if (cur.length) pages.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const chars = cur.reduce((a, x) => a + cleanWord(x.text).length + 1, 0) + cleanWord(w.text).length;
    if (cur.length && (cur.length >= maxWords || chars > maxChars || w.line !== prev.line || w.start - prev.end > 0.35)) flush();
    cur.push({...w, i});
    if (/[.?!]$|\.\.\.$/.test(w.text.replace(/["”]$/, ''))) flush();
  });
  flush();
  for (let p = 0; p < pages.length; p++) {
    const next = pages[p + 1];
    pages[p].end = next ? Math.min(next.start, pages[p].end + 0.6) : pages[p].end + 0.6;
  }
  return pages;
}

/** Times (frames) at which items in a prop appear, shared by visuals and SFX. */
export const itemFrames = (n: number, dur: number, delay = 8, maxGap = 16) => {
  const gap = n > 1 ? Math.max(5, Math.min(maxGap, (dur - delay - 14) / n)) : 0;
  return Array.from({length: n}, (_, i) => Math.round(delay + i * gap));
};
