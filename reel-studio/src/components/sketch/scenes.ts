import {arc, B, Built, circ, curve, fcirc, frect, ln, poly, rect, scribble} from './engine';
import {arrow, badge, browser, bubble, bulb, button, chart, check, coins, cross, door, envelope, eye, fakeText, heart, ledger, motion, person, phone, plate, shop, signpost, starShape, stopwatch, target, wrench} from './parts';

/**
 * Storyboard drawings. Each one explains a whole line of a script (not one word):
 * who is in it, what they do and what the result is, drawn in the order it is said.
 * Board box: 1000 wide x 1100 tall.
 */

type Make = (b: B) => void;

const slide = (dx: number, a: number, z: number) => (f: number) => `translate(${Math.min(1, Math.max(0, (f - a) / (z - a))) * dx} 0)`;
const bob = (a = 8, sp = 6) => (f: number) => `translate(0 ${Math.sin(f / sp) * a})`;
const wobble = (cx: number, cy: number, deg = 6) => (f: number) => `rotate(${Math.sin(f / 5) * deg} ${cx} ${cy})`;

export const SKETCHES: Record<string, Make> = {
  /* ------------------------------------------------ day 2 storyboard: "why visitors leave your website" */

  /** someone visits your website and walks straight back out */
  'visit-leave': (b) => {
    browser(b, 290, 60, 440, 330);
    fakeText(b, 330, 170, 240, 3, 40);
    person(b, 150, 1000, 0.95, {mood: 'happy', arms: 'wave', shirt: 'sky'});
    arrow(b, 220, 560, 330, 420, 'blue', 50);
    b.wait(6);
    door(b, 760, 640, 170, 360);
    b.group(slide(110, b.t + 10, b.t + 40), () => {
      person(b, 680, 1000, 0.95, {mood: 'sad', arms: 'down', shirt: 'sky', flip: true});
      motion(b, 590, 760, -1);
    });
    arrow(b, 690, 420, 840, 600, 'red', -40);
    b.glyph('?', 520, 560, 170, 'red');
  },

  /** a visitor gives your site about three seconds */
  'three-seconds': (b) => {
    stopwatch(b, 500, 430, 270, (f) => f * 7);
    b.fill(`M 500 430 L 500 160 A 270 270 0 0 1 733.8 565 Z`, 'gold', 0.55);
    b.glyph('3', 500, 500, 210, 'blue');
    person(b, 160, 1060, 0.75, {mood: 'worried', arms: 'phone', shirt: 'sky'});
    browser(b, 640, 800, 320, 230);
    fakeText(b, 670, 890, 200, 2, 40);
  },

  /** in those three seconds they ask three questions */
  'three-questions': (b) => {
    person(b, 500, 1080, 1.25, {mood: 'worried', arms: 'think', shirt: 'sky'});
    const qs: [number, number, any][] = [[180, 210, 'blue'], [500, 120, 'gold'], [820, 210, 'green']];
    qs.forEach(([x, y, c], i) => {
      bubble(b, x - 120, y - 110, 240, 220, 500 + (i - 1) * 60, 560, true);
      b.glyph('?', x, y + 50, 150, c);
    });
  },

  /** no answers -> they're gone */
  gone: (b) => {
    browser(b, 80, 120, 460, 360);
    cross(b, 310, 330, 1.2);
    b.group(slide(260, b.t + 2, b.t + 34), () => {
      person(b, 640, 1000, 0.9, {mood: 'sad', arms: 'down', shirt: 'sky', flip: true});
      motion(b, 540, 720, -1);
    });
    for (let i = 0; i < 4; i++) b.line(circ(540 + i * 40, 980 - (i % 2) * 30, 26 + i * 6), 'soft', 6, 0);
  },

  /** question 1: what do you do? a shop with a question mark on its sign */
  'q-what': (b) => {
    badge(b, 140, 150, '1');
    shop(b, 380, 230, 480, 560);
    b.glyph('?', 620, 175, 150, 'blue');
    person(b, 190, 1060, 0.85, {mood: 'worried', arms: 'think', shirt: 'sky'});
  },

  /** don't open with "Welcome to our website" */
  'bad-welcome': (b) => {
    browser(b, 90, 70, 820, 600);
    // waving hand doodle in the hero
    b.group(wobble(500, 380, 10), () => {
      b.line(circ(500, 330, 70, 80), 'ink', 7).fill(fcirc(500, 330, 70, 80), 'soft', 0.9);
      for (let i = 0; i < 4; i++) b.line(ln(450 + i * 34, 270, 440 + i * 36, 190 + Math.abs(i - 1.5) * 12, 2), 'ink', 14, 0);
    });
    fakeText(b, 300, 480, 400, 3, 38);
    person(b, 830, 1060, 0.8, {mood: 'neutral', arms: 'down', shirt: 'sky'});
    b.glyph('z', 880, 640, 70, 'ink').glyph('z', 920, 590, 90, 'ink');
    cross(b, 500, 370, 2.4, 'red', 24);
  },

  /** say it simply: restaurants + Texas + bookkeeping -> one clear headline */
  'clear-headline': (b) => {
    plate(b, 180, 220, 80);
    b.glyph('+', 330, 250, 110, 'ink');
    starShape(b, 470, 215, 95, 'red');
    b.glyph('+', 610, 250, 110, 'ink');
    ledger(b, 700, 120, 190, 200);
    arrow(b, 500, 360, 500, 520, 'blue', 0);
    browser(b, 160, 540, 680, 460);
    b.fill(frect(200, 620, 600, 140, 16), 'sky', 0.35);
    plate(b, 300, 690, 42); starShape(b, 470, 688, 52, 'red'); ledger(b, 590, 640, 100, 100);
    button(b, 330, 820, 340, 90, 'gold');
    check(b, 800, 600, 1.2);
  },

  /** question 2: is this for me? */
  'q-for-me': (b) => {
    badge(b, 140, 150, '2');
    person(b, 330, 1040, 1.1, {mood: 'worried', arms: 'self', shirt: 'sky'});
    bubble(b, 400, 180, 230, 200, 380, 540);
    b.glyph('?', 515, 330, 140, 'gold');
    target(b, 780, 640, 150);
    arrow(b, 560, 860, 760, 650, 'blue', 40, 12);
  },

  /** say who you help, right at the top */
  'who-top': (b) => {
    browser(b, 130, 40, 560, 900);
    b.fill(frect(160, 110, 500, 200, 16), 'gold', 0.6);
    person(b, 260, 300, 0.48, {mood: 'happy', arms: 'wave', hat: 'chef', shirt: 'paper'});
    plate(b, 470, 210, 46);
    fakeText(b, 180, 400, 440, 3, 40);
    fakeText(b, 180, 560, 440, 3, 40);
    fakeText(b, 180, 720, 440, 3, 40);
    b.line(circ(410, 210, 310, 140, 0.03), 'blue', 10);
    person(b, 860, 1060, 0.85, {mood: 'happy', arms: 'point', hat: 'chef', shirt: 'paper', flip: true});
    arrow(b, 760, 640, 720, 300, 'blue', 40, 11);
  },

  /** question 3: what do I do next? (crossroads) */
  'q-next': (b) => {
    badge(b, 140, 150, '3');
    signpost(b, 560, 1000);
    person(b, 270, 1060, 0.95, {mood: 'worried', arms: 'shrug', shirt: 'sky'});
    b.glyph('?', 270, 560, 120, 'blue').glyph('?', 380, 500, 90, 'gold');
  },

  /** many buttons -> ONE clear button, tapped */
  'one-button': (b) => {
    browser(b, 120, 60, 760, 560);
    [0, 1, 2].forEach((i) => button(b, 180 + i * 225, 200, 190, 70, 'soft'));
    [0, 1, 2].forEach((i) => b.line(ln(180 + i * 225, 200, 370 + i * 225, 270, 3), 'red', 12, 0));
    button(b, 250, 380, 500, 130, 'blue');
    // phone + calendar doodle inside the button
    b.line(rect(330, 410, 44, 72, 8, 1), 'paper', 6).line(rect(420, 412, 70, 64, 6, 1), 'paper', 6).line(ln(420, 430, 490, 430, 1), 'paper', 6);
    b.line(ln(540, 445, 650, 445, 2), 'paper', 10).line(poly([[620, 420], [655, 445], [620, 470]]), 'paper', 10);
    b.group((f) => `translate(500 445) scale(${1 + Math.sin(f / 5) * 0.05}) translate(-500 -445)`, () => {
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.line(ln(500 + Math.cos(a) * 300, 445 + Math.sin(a) * 110, 500 + Math.cos(a) * 340, 445 + Math.sin(a) * 135, 0), 'gold', 8, 0); }
    });
    person(b, 500, 1060, 0.8, {mood: 'happy', arms: 'up', shirt: 'sky'});
    check(b, 820, 700, 1.1);
  },

  /** the phone test: only the first screen counts */
  'phone-test': (b) => {
    eye(b, 170, 260, 1.1);
    arrow(b, 260, 300, 360, 380, 'blue', -30);
    phone(b, 340, 60, 340, 700);
    b.fill(frect(356, 110, 308, 310, 10), 'sky', 0.45);
    fakeText(b, 380, 170, 240, 2, 40, 'ink', 14);
    button(b, 400, 300, 220, 64, 'gold');
    b.line('M 350 440 L 670 440', 'red', 6);
    for (let i = 0; i < 9; i++) b.line(ln(360 + i * 34, 470, 340 + i * 34, 720, 0), 'soft', 6, 0);
    b.line(scribble(380, 480, 260, 230, 7), 'soft', 4, 0);
    b.glyph('1', 720, 280, 120, 'red');
    check(b, 760, 400, 0.6, 'green', 12);
  },

  /** can a stranger answer all three? */
  'stranger-check': (b) => {
    person(b, 190, 1060, 1.0, {mood: 'neutral', arms: 'down', hat: 'cap', shades: true, shirt: 'soft'});
    b.line(rect(380, 120, 560, 720, 24), 'ink', 7).fill(frect(380, 120, 560, 720, 24), 'paper', 1);
    const rows = [200, 430, 660];
    // row icons: shop (what), person (who), button (next)
    rows.forEach((y, i) => b.line(rect(420, y, 110, 110, 14), 'ink', 6));
    shopMini(b, 475, 255); personMini(b, 475, 485); button(b, 425, 690, 100, 50, 'blue');
    rows.forEach((y, i) => fakeText(b, 560, y + 40, 200, 2, 36, 'soft'));
    rows.forEach((y) => { b.line(rect(810, y + 20, 80, 80, 12), 'ink', 6); check(b, 852, y + 60, 0.6, 'green', 12); });
  },

  /** if not, that's why people leave */
  leave: (b) => {
    shop(b, 120, 160, 420, 560);
    [0, 1, 2].forEach((i) => b.group(slide(160, b.t + 4 + i * 6, b.t + 40 + i * 6), () => person(b, 640 + i * 110, 1000 - i * 20, 0.62, {mood: 'sad', arms: 'down', shirt: (['sky', 'gold', 'green'] as const)[i], flip: true})));
    motion(b, 580, 820, -1);
    b.line(circ(330, 120, 50), 'soft', 6).fill(fcirc(330, 120, 50), 'soft', 0.6);
  },

  /** comment FIX: comment bubble with a wrench, arrow to your homepage */
  'comment-fix': (b) => {
    bubble(b, 80, 120, 440, 320, 200, 560);
    wrench(b, 300, 290, 1.1);
    heart(b, 470, 150, 40);
    arrow(b, 540, 300, 640, 420, 'blue', -40);
    browser(b, 560, 420, 380, 300);
    fakeText(b, 590, 520, 260, 2, 40);
    b.line(circ(750, 640, 90, 40, 0.03), 'red', 9);
    b.glyph('1', 870, 520, 90, 'red');
  },

  /* ------------------------------------------------ general drawings for any script */
  website: (b) => { browser(b, 100, 80, 800, 620); fakeText(b, 150, 220, 420, 3, 44, 'ink', 14); button(b, 150, 420, 260, 80, 'gold'); b.line(rect(600, 200, 250, 280, 16), 'ink', 6).fill(frect(600, 200, 250, 280, 16), 'sky', 0.6); person(b, 500, 1060, 0.7, {mood: 'happy', arms: 'point'}); },
  customer: (b) => { shop(b, 520, 260, 400, 560); person(b, 260, 1040, 1.0, {mood: 'happy', arms: 'wave', shirt: 'sky'}); arrow(b, 340, 620, 560, 700, 'blue', 40); },
  visit: (b) => { door(b, 640, 420, 200, 420); b.group(slide(260, b.t, b.t + 40), () => { person(b, 300, 860, 0.9, {mood: 'happy', shirt: 'sky'}); motion(b, 200, 600, -1); }); },
  call: (b) => { phone(b, 380, 120, 260, 520); b.group(wobble(510, 380, 8), () => b.line(circ(510, 380, 60), 'green', 10)); for (let i = 0; i < 3; i++) b.line(arc(510, 380, 160 + i * 50, 160 + i * 50, -0.8, 0.8), 'blue', 7, 0); person(b, 820, 1060, 0.85, {mood: 'happy', arms: 'phone', flip: true}); },
  message: (b) => { phone(b, 340, 120, 320, 640); [0, 1, 2].forEach((i) => envelope(b, 380, 200 + i * 150, 240, 120)); person(b, 150, 1060, 0.8, {mood: 'wow', arms: 'up'}); },
  money: (b) => { coins(b, 500, 760, 5); person(b, 830, 1060, 0.85, {mood: 'happy', arms: 'up', flip: true}); },
  search: (b) => { browser(b, 120, 80, 760, 640); b.line(rect(170, 170, 660, 70, 35), 'ink', 6); b.line(circ(220, 205, 18), 'ink', 6); [0, 1, 2].forEach((i) => { b.line(rect(170, 290 + i * 130, 660, 100, 14), i === 0 ? 'blue' : 'ink', 6); fakeText(b, 200, 330 + i * 130, 400, 1, 0); }); starShape(b, 780, 340, 40); },
  grow: (b) => { chart(b, 160, 900, 680, 640); },
  time: (b) => { stopwatch(b, 500, 520, 300); },
  idea: (b) => { bulb(b, 500, 380, 170); person(b, 500, 1080, 0.7, {mood: 'wow', arms: 'up'}); },
  question: (b) => { person(b, 500, 1060, 1.1, {mood: 'worried', arms: 'shrug'}); b.glyph('?', 500, 360, 220, 'blue'); },
  review: (b) => { [0, 1, 2, 3, 4].forEach((i) => starShape(b, 160 + i * 170, 300, 70)); person(b, 500, 1060, 0.9, {mood: 'happy', arms: 'up'}); },
};

/** tiny shop and person for list rows */
function shopMini(b: B, cx: number, cy: number) {
  b.line(poly([[cx - 40, cy - 18], [cx - 30, cy - 40], [cx + 30, cy - 40], [cx + 40, cy - 18]], true), 'ink', 5).fill(poly([[cx - 40, cy - 18], [cx - 30, cy - 40], [cx + 30, cy - 40], [cx + 40, cy - 18]], true), 'red', 0.85);
  b.line(rect(cx - 34, cy - 18, 68, 56, 4, 1), 'ink', 5);
}
function personMini(b: B, cx: number, cy: number) {
  b.line(circ(cx, cy - 18, 18), 'ink', 5).fill(fcirc(cx, cy - 18, 18), 'skin', 1);
  b.line(curve([[cx - 34, cy + 40], [cx - 30, cy + 8], [cx + 30, cy + 8], [cx + 34, cy + 40]]), 'ink', 5);
}

/** a polaroid of Sudip slid onto the board, with doodles drawn around it ("me-<face>") */
function me(b: B, face: string, seed: number) {
  const left = seed % 2 === 0;
  b.photo(face, left ? 170 : 290, 150, 540, left ? -4 : 4);
  b.wait(4);
  const cx = left ? 440 : 560;
  // sparkle lines around the photo
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * 0.95 + (i / 4) * Math.PI * 0.9;
    b.line(ln(cx + Math.cos(a) * 380, 520 + Math.sin(a) * 430, cx + Math.cos(a) * 450, 520 + Math.sin(a) * 500, 1), 'gold', 9, 0);
  }
  const side = left ? 860 : 140;
  if (/curious|thinking|hmm|suspicious/.test(face)) b.glyph('?', side, 360, 200, 'blue');
  else if (/smug|cool|announce|shocked|mind/.test(face)) b.glyph('!', side, 360, 220, 'red');
  else if (/thumbs|smile|ok|laugh/.test(face)) heart(b, side, 300, 70);
  else starShape(b, side, 300, 80);
  b.line(curve([[cx - 300, 960], [cx - 100, 990], [cx + 100, 950], [cx + 300, 985]]), 'blue', 12);
}

/** scenes that are revealed by painting across instead of line by line */
const PAINT = new Set(['clear-headline', 'stranger-check', 'review', 'grow']);

export const buildSketch = (name: string, seed: number): Built => {
  const b = new B(seed);
  if (name.startsWith('me-')) me(b, name.slice(3), seed);
  else (SKETCHES[name] ?? SKETCHES.website)(b);
  if (PAINT.has(name)) b.reveal = 'paint';
  return b.build();
};

/** spoken word -> drawing, for beats without `show` */
export const SKETCH_WORDS: Record<string, string> = {
  website: 'website', site: 'website', homepage: 'website', page: 'website',
  customer: 'customer', customers: 'customer', client: 'customer', clients: 'customer',
  visit: 'visit', visitor: 'visit', visitors: 'visit', leave: 'leave',
  call: 'call', phone: 'call', message: 'message', email: 'message', enquiry: 'message',
  money: 'money', price: 'money', cost: 'money', sales: 'money',
  google: 'search', search: 'search', grow: 'grow', growth: 'grow', more: 'grow',
  seconds: 'time', time: 'time', minutes: 'time', idea: 'idea', review: 'review', reviews: 'review',
  button: 'one-button', comment: 'comment-fix', question: 'question',
};
