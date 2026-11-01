import {arc, B, circ, curve, fcirc, frect, head, Ink, ln, poly, rect, star} from './engine';

/** Doodle building blocks. Coordinates are in the 1000 x 1100 board box. */

export type PersonOpt = {mood?: 'happy' | 'sad' | 'neutral' | 'worried' | 'wow'; arms?: 'down' | 'up' | 'point' | 'think' | 'shrug' | 'wave' | 'self' | 'phone'; hat?: 'chef' | 'cap'; shades?: boolean; shirt?: Ink; hair?: boolean; flip?: boolean};

export const person = (b: B, x: number, fy: number, sc = 1, o: PersonOpt = {}) => {
  const {mood = 'happy', arms = 'down', hat, shades, shirt = 'blue', hair = true} = o;
  const fl = o.flip ? -1 : 1;
  const r = 46 * sc;
  const hy = fy - 340 * sc;
  const sh = hy + r + 14 * sc;
  const hips = fy - 150 * sc;
  // head
  b.line(circ(x, hy, r, r, 0.02), 'ink', 6).fill(fcirc(x, hy, r), 'skin', 1);
  // body
  b.line(rect(x - 52 * sc, sh, 104 * sc, hips - sh, 30 * sc, 2), 'ink', 6).fill(frect(x - 52 * sc, sh, 104 * sc, hips - sh, 30 * sc), shirt, 0.9);
  b.line(ln(x - 24 * sc, hips - 4, x - 32 * sc, fy), 'ink', 7).line(ln(x + 24 * sc, hips - 4, x + 32 * sc, fy), 'ink', 7);
  b.line(ln(x - 32 * sc, fy, x - 58 * sc, fy, 1), 'ink', 8, 0).line(ln(x + 32 * sc, fy, x + 58 * sc, fy, 1), 'ink', 8);
  // arms
  const L: [number, number] = [x - 50 * sc, sh + 14 * sc], R: [number, number] = [x + 50 * sc, sh + 14 * sc];
  const arm = (s0: [number, number], el: [number, number], hand: [number, number]) => {
    b.line(curve([s0, el, hand]), 'ink', 7, 0);
    b.fill(fcirc(hand[0], hand[1], 12 * sc), 'skin', 1);
  };
  const X = (dx: number) => x + dx * sc * fl;
  const Y = (dy: number) => sh + dy * sc;
  switch (arms) {
    case 'up': arm(L, [X(-95), Y(-30)], [X(-105), Y(-120)]); arm(R, [X(95), Y(-30)], [X(105), Y(-120)]); break;
    case 'point': arm(L, [X(-68), Y(70)], [X(-72), Y(150)]); arm(R, [X(110), Y(14)], [X(175), Y(4)]); break;
    case 'think': arm(L, [X(-68), Y(70)], [X(-72), Y(150)]); arm(R, [X(88), Y(80)], [X(34), Y(-28)]); break;
    case 'shrug': arm(L, [X(-100), Y(60)], [X(-120), Y(-10)]); arm(R, [X(100), Y(60)], [X(120), Y(-10)]); break;
    case 'wave': arm(L, [X(-68), Y(70)], [X(-72), Y(150)]); arm(R, [X(100), Y(-20)], [X(120), Y(-130)]); break;
    case 'self': arm(L, [X(-68), Y(70)], [X(-72), Y(150)]); arm(R, [X(90), Y(80)], [X(10), Y(56)]); break;
    case 'phone': arm(L, [X(-68), Y(70)], [X(-72), Y(150)]); arm(R, [X(84), Y(90)], [X(40), Y(10)]); b.line(rect(X(22), Y(-40), 40 * sc, 70 * sc, 8 * sc, 1), 'ink', 6).fill(frect(X(22), Y(-40), 40 * sc, 70 * sc, 8 * sc), 'sky', 0.9); break;
    default: arm(L, [X(-68), Y(70)], [X(-74), Y(150)]); arm(R, [X(68), Y(70)], [X(74), Y(150)]);
  }
  if (hair && !hat) b.line(arc(x, hy - 2, r * 1.02, r * 1.05, Math.PI * 1.02, Math.PI * 1.98), 'ink', 12);
  if (hat === 'chef') {
    b.line(curve([[x - r, hy - r * 0.6], [x - r * 1.2, hy - r * 1.5], [x - r * 0.4, hy - r * 2.0], [x + r * 0.4, hy - r * 2.05], [x + r * 1.2, hy - r * 1.5], [x + r, hy - r * 0.6]]), 'ink', 6)
      .line(ln(x - r, hy - r * 0.62, x + r, hy - r * 0.62), 'ink', 6).fill(`M ${x - r} ${hy - r * 0.6} C ${x - r * 1.5} ${hy - r * 2.2}, ${x + r * 1.5} ${hy - r * 2.2}, ${x + r} ${hy - r * 0.6} Z`, 'paper', 1);
  }
  if (hat === 'cap') b.line(arc(x, hy - 6, r * 1.02, r * 0.95, Math.PI, Math.PI * 2), 'ink', 7).fill(`M ${x - r} ${hy - 6} A ${r} ${r * 0.95} 0 0 1 ${x + r} ${hy - 6} Z`, 'gold', 1).line(ln(x + r * 0.2 * fl, hy - 8, x + r * 1.7 * fl, hy - 2), 'ink', 9);
  if (shades) {
    b.fill(frect(x - 34 * sc, hy - 14 * sc, 30 * sc, 20 * sc, 6), 'ink', 1).fill(frect(x + 4 * sc, hy - 14 * sc, 30 * sc, 20 * sc, 6), 'ink', 1);
  } else {
    b.fill(fcirc(x - 16 * sc, hy - 6 * sc, 5.5 * sc), 'ink', 1).fill(fcirc(x + 16 * sc, hy - 6 * sc, 5.5 * sc), 'ink', 1);
  }
  const m = {
    happy: arc(x, hy + 10 * sc, 20 * sc, 14 * sc, 0.25, Math.PI - 0.25),
    sad: arc(x, hy + 34 * sc, 17 * sc, 11 * sc, Math.PI + 0.35, Math.PI * 2 - 0.35),
    worried: curve([[x - 16 * sc, hy + 26 * sc], [x - 6 * sc, hy + 20 * sc], [x + 6 * sc, hy + 26 * sc], [x + 16 * sc, hy + 20 * sc]]),
    neutral: ln(x - 14 * sc, hy + 22 * sc, x + 14 * sc, hy + 22 * sc, 1),
    wow: circ(x, hy + 22 * sc, 9 * sc, 11 * sc, 0, 0.1),
  }[mood];
  b.line(m, 'ink', 5);
};

export const browser = (b: B, x: number, y: number, w: number, h: number, fillTop: Ink = 'soft') => {
  b.line(rect(x, y, w, h, 22), 'ink', 7).fill(frect(x, y, w, h, 22), 'paper', 1);
  b.line(ln(x + 4, y + 56, x + w - 4, y + 56, 2), 'ink', 6);
  b.fill(frect(x + 3, y + 3, w - 6, 52, 20), fillTop, 0.9);
  (['red', 'gold', 'green'] as Ink[]).forEach((c, i) => b.fill(fcirc(x + 34 + i * 30, y + 29, 9), c, 1));
  b.line(rect(x + 140, y + 16, Math.min(260, w - 180), 26, 13, 1), 'ink', 4);
};

/** wavy grey lines that stand for text */
export const fakeText = (b: B, x: number, y: number, w: number, rows = 3, gap = 34, c: Ink = 'soft', wd = 12) => {
  for (let i = 0; i < rows; i++) {
    const ww = i === rows - 1 ? w * 0.6 : w;
    b.line(curve([[x, y + i * gap], [x + ww * 0.3, y + i * gap - 4], [x + ww * 0.6, y + i * gap + 4], [x + ww, y + i * gap]]), c, wd, 0);
  }
};

export const phone = (b: B, x: number, y: number, w: number, h: number) => {
  b.line(rect(x, y, w, h, 46), 'ink', 8).fill(frect(x, y, w, h, 46), 'paper', 1);
  b.line(ln(x + w * 0.38, y + 30, x + w * 0.62, y + 30, 1), 'ink', 10);
  b.line(ln(x + w * 0.36, y + h - 26, x + w * 0.64, y + h - 26, 1), 'ink', 6);
};

export const stopwatch = (b: B, cx: number, cy: number, r: number, spin = (f: number) => f * 9) => {
  b.line(rect(cx - 30, cy - r - 54, 60, 34, 8), 'ink', 7).fill(frect(cx - 30, cy - r - 54, 60, 34, 8), 'gold', 1);
  b.line(ln(cx, cy - r - 20, cx, cy - r, 1), 'ink', 9);
  b.line(circ(cx, cy, r), 'ink', 9).fill(fcirc(cx, cy, r), 'paper', 1);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.line(ln(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82, cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92, 0), 'ink', 6, 0);
  }
  b.group((f) => `rotate(${spin(f)} ${cx} ${cy})`, () => b.line(`M ${cx} ${cy + 20} L ${cx} ${cy - r * 0.72}`, 'red', 10));
  b.fill(fcirc(cx, cy, 16), 'ink', 1);
};

export const bubble = (b: B, x: number, y: number, w: number, h: number, tx: number, ty: number, thought = false, c: Ink = 'paper') => {
  if (thought) {
    b.line(circ(x + w / 2, y + h / 2, w / 2, h / 2, 0.06), 'ink', 6).fill(fcirc(x + w / 2, y + h / 2, w / 2, h / 2), c, 1);
    const mx = (x + w / 2 + tx) / 2, my = (y + h + ty) / 2;
    b.line(circ(mx, my, 16), 'ink', 5).fill(fcirc(mx, my, 16), c, 1);
    b.line(circ(tx, ty, 9), 'ink', 5).fill(fcirc(tx, ty, 9), c, 1);
  } else {
    b.line(rect(x, y, w, h, 34), 'ink', 6).fill(frect(x, y, w, h, 34), c, 1);
    const bx = Math.max(x + 40, Math.min(x + w - 80, tx - 20));
    b.line(poly([[bx, y + h - 2], [tx, ty], [bx + 50, y + h - 2]]), 'ink', 6).fill(poly([[bx, y + h - 4], [tx, ty], [bx + 50, y + h - 4]], true), c, 1);
  }
};

export const door = (b: B, x: number, y: number, w: number, h: number) => {
  b.line(rect(x, y, w, h, 6), 'ink', 7).fill(frect(x, y, w, h, 6), 'gold', 0.85);
  b.fill(fcirc(x + w - 22, y + h / 2, 8), 'ink', 1);
};

export const shop = (b: B, x: number, y: number, w: number, h: number) => {
  b.line(rect(x, y + 60, w, h - 60, 8), 'ink', 7).fill(frect(x, y + 60, w, h - 60, 8), 'paper', 1);
  const n = 5;
  let d = `M ${x - 10} ${y + 60}`;
  for (let i = 0; i < n; i++) d += ` Q ${x - 10 + ((w + 20) / n) * (i + 0.5)} ${y + 120} ${x - 10 + ((w + 20) / n) * (i + 1)} ${y + 60}`;
  b.line(poly([[x - 10, y + 60], [x + 20, y], [x + w - 20, y], [x + w + 10, y + 60]]), 'ink', 7).fill(poly([[x - 10, y + 60], [x + 20, y], [x + w - 20, y], [x + w + 10, y + 60]], true), 'red', 0.8);
  b.line(d, 'ink', 6).fill(d + ' Z', 'red', 0.8);
  b.line(rect(x + 30, y + 150, w * 0.42, h * 0.38, 6), 'ink', 6).fill(frect(x + 30, y + 150, w * 0.42, h * 0.38, 6), 'sky', 0.6);
  door(b, x + w * 0.6, y + h - h * 0.55, w * 0.3, h * 0.55);
};

export const plate = (b: B, cx: number, cy: number, r: number) => {
  b.line(circ(cx, cy, r), 'ink', 7).fill(fcirc(cx, cy, r), 'paper', 1).line(circ(cx, cy, r * 0.62), 'ink', 5);
  b.line(ln(cx - r * 1.35, cy - r * 0.8, cx - r * 1.35, cy + r * 0.9), 'ink', 7);
  for (const dx of [-14, 0, 14]) b.line(ln(cx - r * 1.35 + dx, cy - r * 0.8, cx - r * 1.35 + dx, cy - r * 0.3, 0), 'ink', 5, 0);
  b.line(curve([[cx + r * 1.35, cy + r * 0.9], [cx + r * 1.35, cy - r * 0.2], [cx + r * 1.5, cy - r * 0.8], [cx + r * 1.35, cy - r * 0.8]]), 'ink', 7);
};

export const ledger = (b: B, x: number, y: number, w: number, h: number) => {
  b.line(rect(x, y, w, h, 12), 'ink', 7).fill(frect(x, y, w, h, 12), 'green', 0.8);
  b.line(ln(x + 30, y + 6, x + 30, y + h - 6, 1), 'ink', 6);
  b.glyph('$', x + w / 2 + 14, y + h / 2 + 30, h * 0.5, 'ink');
};

export const button = (b: B, x: number, y: number, w: number, h: number, c: Ink = 'blue') => {
  b.line(rect(x, y, w, h, h / 2), 'ink', 7).fill(frect(x, y, w, h, h / 2), c, 0.95);
};

export const check = (b: B, x: number, y: number, s2 = 1, c: Ink = 'green', w = 16) => b.line(poly([[x - 50 * s2, y], [x - 12 * s2, y + 40 * s2], [x + 60 * s2, y - 52 * s2]]), c, w);
export const cross = (b: B, x: number, y: number, s2 = 1, c: Ink = 'red', w = 18) => b.line(ln(x - 60 * s2, y - 60 * s2, x + 60 * s2, y + 60 * s2, 6), c, w).line(ln(x + 60 * s2, y - 60 * s2, x - 60 * s2, y + 60 * s2, 6), c, w);

export const badge = (b: B, cx: number, cy: number, n: string, c: Ink = 'gold') => {
  b.line(circ(cx, cy, 70), 'ink', 7).fill(fcirc(cx, cy, 70), c, 1);
  b.glyph(n, cx, cy + 34, 100, 'ink');
};

export const signpost = (b: B, x: number, fy: number) => {
  b.line(ln(x, fy, x, fy - 420, 2), 'ink', 12);
  const sign = (y: number, dir: 1 | -1, c: Ink, rot: number) => {
    const x0 = x, x1 = x + dir * 190;
    const pts: [number, number][] = [[x0, y - 30 + rot], [x1 - dir * 30, y - 30 - rot], [x1, y - rot], [x1 - dir * 30, y + 30 - rot], [x0, y + 30 + rot]];
    b.line(poly(pts, true), 'ink', 6).fill(poly(pts, true), c, 0.9);
  };
  sign(fy - 380, 1, 'blue', 6); sign(fy - 300, -1, 'gold', -4); sign(fy - 220, 1, 'green', -6);
};

export const target = (b: B, cx: number, cy: number, r: number) => {
  b.line(circ(cx, cy, r), 'ink', 7).fill(fcirc(cx, cy, r), 'red', 0.85);
  b.line(circ(cx, cy, r * 0.66), 'ink', 6).fill(fcirc(cx, cy, r * 0.66), 'paper', 1);
  b.line(circ(cx, cy, r * 0.33), 'ink', 6).fill(fcirc(cx, cy, r * 0.33), 'red', 0.9);
};

export const eye = (b: B, cx: number, cy: number, s2 = 1) => {
  b.line(curve([[cx - 90 * s2, cy], [cx, cy - 60 * s2], [cx + 90 * s2, cy], [cx, cy + 60 * s2], [cx - 90 * s2, cy]]), 'ink', 7).fill(fcirc(cx, cy, 34 * s2), 'sky', 1).fill(fcirc(cx, cy, 14 * s2), 'ink', 1);
};

export const envelope = (b: B, x: number, y: number, w: number, h: number) => {
  b.line(rect(x, y, w, h, 8), 'ink', 7).fill(frect(x, y, w, h, 8), 'paper', 1).line(poly([[x + 4, y + 6], [x + w / 2, y + h * 0.58], [x + w - 4, y + 6]]), 'ink', 6);
};

export const wrench = (b: B, cx: number, cy: number, s2 = 1, c: Ink = 'gold') => {
  const d = `M ${cx - 90 * s2} ${cy + 80 * s2} L ${cx + 20 * s2} ${cy - 30 * s2}`;
  b.line(d, 'ink', 28 * s2);
  b.line(d, c, 16 * s2);
  b.line(circ(cx + 45 * s2, cy - 55 * s2, 42 * s2), 'ink', 8).fill(fcirc(cx + 45 * s2, cy - 55 * s2, 42 * s2), c, 1);
  b.fill(frect(cx + 40 * s2, cy - 105 * s2, 30 * s2, 44 * s2, 6), 'paper', 1);
};

export const heart = (b: B, cx: number, cy: number, s2: number) => {
  const d = `M ${cx} ${cy + s2 * 0.9} C ${cx - s2 * 1.4} ${cy - s2 * 0.1}, ${cx - s2 * 0.7} ${cy - s2 * 1.2}, ${cx} ${cy - s2 * 0.45} C ${cx + s2 * 0.7} ${cy - s2 * 1.2}, ${cx + s2 * 1.4} ${cy - s2 * 0.1}, ${cx} ${cy + s2 * 0.9} Z`;
  b.line(d, 'ink', 6).fill(d, 'pink', 1);
};

export const arrow = (b: B, x1: number, y1: number, x2: number, y2: number, c: Ink = 'blue', bend = 60, w = 9) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const nx = -(y2 - y1), ny = x2 - x1;
  const l = Math.hypot(nx, ny) || 1;
  const cx = mx + (nx / l) * bend, cy = my + (ny / l) * bend;
  b.line(`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, c, w, 0).line(head(cx, cy, x2, y2, 36), c, w);
};

export const bulb = (b: B, cx: number, cy: number, r: number) => {
  b.line(circ(cx, cy, r), 'ink', 7).fill(fcirc(cx, cy, r), 'gold', 1);
  b.line(rect(cx - r * 0.45, cy + r * 0.85, r * 0.9, r * 0.6, 6), 'ink', 6).fill(frect(cx - r * 0.45, cy + r * 0.85, r * 0.9, r * 0.6, 6), 'soft', 1);
  for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; b.line(ln(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3, cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r * 1.6, 0), 'gold', 7, 0); }
};

export const coins = (b: B, cx: number, fy: number, n = 4) => {
  for (let i = 0; i < n; i++) {
    const y = fy - i * 34;
    b.line(circ(cx, y, 80, 24), 'ink', 6).fill(fcirc(cx, y, 80, 24), 'gold', 1);
  }
  b.glyph('$', cx, fy - n * 34 - 20, 110, 'green');
};

export const chart = (b: B, x: number, fy: number, w: number, h: number) => {
  b.line(ln(x, fy - h, x, fy, 2), 'ink', 7).line(ln(x, fy, x + w, fy, 2), 'ink', 7);
  const vals = [0.3, 0.45, 0.62, 0.9];
  vals.forEach((v, i) => {
    const bw = w / 6, bx = x + 30 + i * (bw + 26);
    b.line(rect(bx, fy - h * v, bw, h * v, 8), 'ink', 6).fill(frect(bx, fy - h * v, bw, h * v, 8), i === 3 ? 'gold' : 'blue', 0.9);
  });
  arrow(b, x + 30, fy - h * 0.25, x + w - 10, fy - h * 1.02, 'green', -40, 11);
};

export const starShape = (b: B, cx: number, cy: number, r: number, c: Ink = 'gold') => {
  const d = star(cx, cy, r);
  b.line(d + ' Z', 'ink', 6).fill(d + ' Z', c, 1);
};

/** speed / motion lines behind something moving */
export const motion = (b: B, x: number, y: number, dir: 1 | -1 = -1) => {
  for (let i = 0; i < 3; i++) b.line(ln(x, y + i * 40, x + dir * (90 - i * 20), y + i * 40, 1), 'ink', 6, 0);
};
