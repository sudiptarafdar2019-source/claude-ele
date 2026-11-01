import {getLength} from '@remotion/paths';
import {rnd} from '../../lib/motion';

/**
 * Tiny drawing language for the hand explainer.
 * A scene is built once (list of strokes, colour fills, glyphs, photos) with a timeline;
 * the board renders it at any frame and the hand follows the stroke being drawn.
 */

export type Ink = 'ink' | 'blue' | 'sky' | 'gold' | 'red' | 'green' | 'skin' | 'soft' | 'paper' | 'pink';

export type El =
  | {kind: 'stroke'; d: string; t0: number; t1: number; c: Ink; w: number; len: number; g: number}
  | {kind: 'fill'; d: string; t0: number; c: Ink; op: number; g: number}
  | {kind: 'glyph'; text: string; x: number; y: number; size: number; c: Ink; t0: number; t1: number; g: number; rot?: number}
  | {kind: 'photo'; face: string; x: number; y: number; w: number; rot: number; t0: number; g: number};

export type Group = {anim?: (f: number) => string};

export type Built = {els: El[]; groups: Group[]; total: number; reveal: Reveal};
export type Reveal = 'draw' | 'paint';

export class B {
  t = 0;
  els: El[] = [];
  groups: Group[] = [{}];
  g = 0;
  speed = 120; // px per frame while drawing
  reveal: Reveal = 'draw';
  private seed = 1;
  constructor(seed = 1) { resetSeed(seed); }

  wait(n: number) { this.t += n; return this; }
  at(n: number) { this.t = n; return this; }

  /** draw a path (stroke) */
  line(d: string, c: Ink = 'ink', w = 7, gap = 1) {
    const len = Math.max(1, getLength(d));
    const t1 = this.t + Math.min(12, Math.max(2.5, len / this.speed));
    this.els.push({kind: 'stroke', d, t0: this.t, t1, c, w, len, g: this.g});
    this.t = t1 + gap * 0.6;
    return this;
  }
  /** a colour wash that fades in now (draws under strokes) */
  fill(d: string, c: Ink, op = 0.85) { this.els.push({kind: 'fill', d, t0: this.t, c, op, g: this.g}); return this; }
  /** hand-lettered glyph: digits, ? ! $ etc. (kept tiny on purpose: pictures do the talking) */
  glyph(text: string, x: number, y: number, size = 120, c: Ink = 'ink', rot = 0) {
    const t1 = this.t + 6 + text.length * 3;
    this.els.push({kind: 'glyph', text, x, y, size, c, t0: this.t, t1, g: this.g, rot});
    this.t = t1 + 1;
    return this;
  }
  /** a polaroid photo of Sudip slid onto the board */
  photo(face: string, x: number, y: number, w = 300, rot = -4) {
    this.els.push({kind: 'photo', face, x, y, w, rot, t0: this.t, g: this.g});
    this.t += 12;
    return this;
  }
  /** everything drawn inside fn moves with anim(f) */
  group(anim: (f: number) => string, fn: () => void) {
    const prev = this.g;
    this.groups.push({anim});
    this.g = this.groups.length - 1;
    fn();
    this.g = prev;
    return this;
  }
  build(): Built { return {els: this.els, groups: this.groups, total: this.t, reveal: this.reveal}; }
  nextSeed() { return ++this.seed; }
}

/* ------------------------------------------------ hand-drawn geometry (returns SVG path data) */

type P = [number, number];
const j = (s: number, a: number) => (rnd(s) - 0.5) * 2 * a;

/** smooth path through points (Catmull-Rom to cubic) */
export const curve = (pts: P[], closed = false) => {
  if (pts.length < 2) return '';
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M ${p[1][0].toFixed(1)} ${p[1][1].toFixed(1)}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2];
    d += ` C ${(x1 + (x2 - x0) / 6).toFixed(1)} ${(y1 + (y2 - y0) / 6).toFixed(1)}, ${(x2 - (x3 - x1) / 6).toFixed(1)} ${(y2 - (y3 - y1) / 6).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d;
};

let SEED = 7;
const s = () => ++SEED;
/** call at the start of each scene so the wobble is identical on every render */
export const resetSeed = (n: number) => { SEED = n * 1000; };

/** slightly wobbly straight line */
export const ln = (x1: number, y1: number, x2: number, y2: number, wob = 3) => {
  const mx = (x1 + x2) / 2 + j(s(), wob), my = (y1 + y2) / 2 + j(s(), wob);
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
};
/** polyline with sharp corners */
export const poly = (pts: P[], close = false) => 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + (close ? ' Z' : '');
/** hand-drawn rectangle, drawn in one go with a little overshoot */
export const rect = (x: number, y: number, w: number, h: number, r = 18, wob = 3) => {
  const k = r;
  const pts: P[] = [
    [x + k, y + j(s(), wob)], [x + w - k, y + j(s(), wob)], [x + w + j(s(), wob), y + k], [x + w + j(s(), wob), y + h - k],
    [x + w - k, y + h + j(s(), wob)], [x + k, y + h + j(s(), wob)], [x + j(s(), wob), y + h - k], [x + j(s(), wob), y + k], [x + k + 14, y + j(s(), wob) - 2],
  ];
  return curve(pts);
};
/** clean rounded rect for fills */
export const frect = (x: number, y: number, w: number, h: number, r = 18) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
/** hand-drawn circle/ellipse with overshoot */
export const circ = (cx: number, cy: number, rx: number, ry = rx, wob = 0.03, over = 0.35, start = -2.2) => {
  const n = 14;
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = start + (i / n) * (Math.PI * 2 + over);
    const k = 1 + j(s(), wob);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return curve(pts);
};
export const fcirc = (cx: number, cy: number, rx: number, ry = rx) => `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
/** arc from angle a0 to a1 (radians) */
export const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number) => {
  const n = 8;
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return curve(pts);
};
/** arrow head at (x2,y2) pointing from (x1,y1) */
export const head = (x1: number, y1: number, x2: number, y2: number, size = 34) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const l = [x2 - Math.cos(a - 0.5) * size, y2 - Math.sin(a - 0.5) * size];
  const r = [x2 - Math.cos(a + 0.5) * size, y2 - Math.sin(a + 0.5) * size];
  return `M ${l[0]} ${l[1]} L ${x2} ${y2} L ${r[0]} ${r[1]}`;
};
/** curvy arrow */
export const arrowPath = (x1: number, y1: number, x2: number, y2: number, bend = 60) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const nx = -(y2 - y1), ny = x2 - x1;
  const l = Math.hypot(nx, ny) || 1;
  const cx = mx + (nx / l) * bend, cy = my + (ny / l) * bend;
  return {d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, hx: cx, hy: cy};
};
export const star = (cx: number, cy: number, r: number) => {
  const pts: P[] = [];
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return poly(pts);
};
export const heartPath = (cx: number, cy: number, s2: number) =>
  `M ${cx} ${cy + s2 * 0.9} C ${cx - s2 * 1.4} ${cy - s2 * 0.1}, ${cx - s2 * 0.7} ${cy - s2 * 1.2}, ${cx} ${cy - s2 * 0.45} C ${cx + s2 * 0.7} ${cy - s2 * 1.2}, ${cx + s2 * 1.4} ${cy - s2 * 0.1}, ${cx} ${cy + s2 * 0.9} Z`;
/** scribble fill (colouring-in strokes) inside a box */
export const scribble = (x: number, y: number, w: number, h: number, rows = 6) => {
  const pts: P[] = [];
  for (let i = 0; i <= rows; i++) {
    const yy = y + (h * i) / rows;
    pts.push(i % 2 ? [x + w, yy] : [x, yy]);
  }
  return poly(pts);
};
