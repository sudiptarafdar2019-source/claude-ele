import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Captions} from '../components/Captions';
import {Logo, ProgressBar} from '../components/Common';
import {Sfx} from '../components/Sound';
import {faceSrc} from '../lib/faces';
import {ease, pop} from '../lib/motion';
import {norm} from '../lib/timing';
import {ResolvedBeat, ReelProps, Timing} from '../types';
import {TemplateProps} from './types';
import {
  At, Badge, Bubble, Burst, CalendarIcon, ChartDrop, CheckBadge, Cloche, CueWord, DoorIcon, EyeIcon, Hand, IconCard, Ledger, LOOKS,
  NumBadge, PaperPlane, Spoken, Person, Phone, Puff, QBubble, Ripple, Signpost, Site, sitePt, Sparkle, SpeedLines, Spot, Stopwatch, StopBadge,
  TexasIcon, Wrench, XBadge,
} from '../components/flat/kit';

/**
 * TEMPLATE · EXPLAINER (polished hand explainer)
 * Clean flat-vector scenes on a bright stage, a real hand that points, taps and writes,
 * and Sudip's own photo for 1-2 reaction moments. Every word written on screen pops in
 * at the exact moment it is spoken (word timings from scripts/transcribe.py).
 * Each beat in the reel file names its scene with "show".
 */

const ENTER = 9, EXIT = 10;

type Ctx = {f: number; from: number; to: number; p: any; q: (word: string, n?: number) => number; w: (p: string, n?: number) => number; e: (p: string) => number; ws: (p: string) => CueWord[]};

const clean = (s: string) => s.replace(/\.\.\./g, '').replace(/[“”"]/g, '').replace(/,$/, '');

const makeCtx = (timing: Timing, b: ResolvedBeat, f: number): Ctx => {
  const words = timing.words.map((w) => norm(w.text));
  const find = (p: string, n = 1) => {
    const t = p.split(/\s+/).map(norm).filter(Boolean);
    let hit = 0;
    for (let i = b.wordIndex; i <= words.length - t.length; i++) {
      if (t.every((x, k) => words[i + k] === x)) { hit++; if (hit === n) return i; }
    }
    return -1;
  };
  const fr = (s: number) => Math.round(s * FPS);
  const P: any = (b as any).params ?? {};
  const w = (p: string, n = 1) => { const i = find(p, n); return i < 0 ? b.from : fr(timing.words[i].start); };
  return {
    f, from: b.from, to: b.to, p: P,
    q: (word, n = 1) => w(P.cues?.[word] ?? word, n),
    w: (p, n = 1) => { const i = find(p, n); return i < 0 ? b.from : fr(timing.words[i].start); },
    e: (p) => { const t = p.split(/\s+/).filter(Boolean); const i = find(p); return i < 0 ? b.to : fr(timing.words[i + t.length - 1].end); },
    ws: (p) => {
      const t = p.split(/\s+/).filter(Boolean); const i = find(p);
      if (i < 0) return [];
      return timing.words.slice(i, i + t.length).map((w) => ({text: clean(w.text), f: fr(w.start), end: fr(w.end)}));
    },
  };
};

/** walk from x0 to x1 between frames a and b */
const walkTo = (f: number, a: number, b: number, x0: number, x1: number) => {
  const t = ease(f, a, b, 0, 1, (v) => v);
  const moving = f > a && f < b;
  return {x: x0 + (x1 - x0) * t, walk: moving ? f * 0.42 : undefined};
};

const sx = (k: number) => 0.6 + 0.4 * k; // pop scale

// ======================================================================= scenes
const SCENES: Record<string, React.FC<{c: Ctx}>> = {
  // Do people visit your website and then just leave?
  visit: ({c}) => {
    const {f} = c;
    const tP = c.q('people'), tV = c.q('visit'), tS = c.q('website'), tJ = c.q('just'), tL = c.q('leave');
    const ph = pop(f, c.from);
    const door = pop(f, tL - 8);
    const xs = [250, 470, 690];
    return (
      <>
        <Spot x={540} y={640} r={460} color={C.sky} f={f} from={c.from} />
        <At x={540} y={620} s={sx(ph)} o={ph}>
          <Phone w={420}><Site w={388} f={f} dim={ease(f, tL, tL + 12) * 0.6} /></Phone>
        </At>
        <At x={950} y={1170} s={door} o={door}><DoorIcon s={170} open={ease(f, tL - 2, tL + 10)} /></At>
        {xs.map((x, i) => {
          const look = [LOOKS.maya, LOOKS.visitor, LOOKS.sam][i];
          const inn = walkTo(f, tP - 4 + i * 4, tS + 4 + i * 5, -160 - i * 90, x);
          const out = walkTo(f, tL + i * 4, tL + 30 + i * 4, x, 960);
          const leaving = f > tL + i * 4;
          const p = leaving ? out : inn;
          const fade = 1 - ease(f, tL + 22 + i * 4, tL + 32 + i * 4);
          return <Person key={i} look={look} f={f + i * 20} x={p.x} y={1400} h={400} walk={p.walk} mood={f > tJ ? 'bored' : f > tS ? 'curious' : 'happy'} o={fade} s={leaving ? 1 - 0.25 * ease(f, tL + 10, tL + 32) : 1} />;
        })}
        <Hand f={f} kind="point" keys={[{f: tV, x: 1250, y: 1600}, {f: tS + 2, x: 600, y: 560}, {f: tL - 10, x: 620, y: 600}, {f: tL + 6, x: 1300, y: 1700}]} />
      </>
    );
  },

  // Here's what's happening.
  happening: ({c}) => {
    const {f} = c;
    const k = pop(f, c.from);
    const tH = c.q('happening');
    return (
      <>
        <Spot x={540} y={700} r={480} color={C.blue} f={f} from={c.from} />
        <At x={540} y={700} s={sx(k)} o={k} r={-2 + 2 * k}><ChartDrop w={760} p={ease(f, c.from + 2, tH)} drop={ease(f, tH, tH + 10)} /></At>
        <At x={210} y={430} s={pop(f, tH + 4)}><EyeIcon s={160} f={f} /></At>
        <Hand f={f} kind="point" keys={[{f: c.from + 4, x: 1250, y: 1700}, {f: tH + 6, x: 900, y: 860}, {f: c.to + EXIT, x: 920, y: 880}]} />
      </>
    );
  },

  // A new visitor gives your website about three seconds.
  'three-seconds': ({c}) => {
    const {f} = c;
    const tN = c.q('new'), tS = c.q('website'), t3 = c.q('three'), tSec = c.q('seconds');
    const vis = walkTo(f, tN - 6, tN + 14, -200, 290);
    const ph = pop(f, tS - 3);
    const sw = pop(f, t3 - 3);
    return (
      <>
        <Spot x={760} y={800} r={430} color={C.sky} f={f} from={c.from} />
        <At x={770} y={820} s={sx(ph)} o={ph} r={4 - 4 * ph}><Phone w={390}><Site w={358} f={f} /></Phone></At>
        <Person look={LOOKS.visitor} f={f} x={vis.x} y={1390} h={440} walk={vis.walk} mood={f > tS ? 'curious' : 'happy'} />
        <Burst x={290} y={1010} t={tN + 10} f={f} r={170} />
        <At x={300} y={560} s={sx(sw)} o={sw}><Stopwatch size={300} f={f} p={1 - ease(f, tSec + 6, c.to + 40, 0, 0.12, (v) => v)} n="3" /></At>
      </>
    );
  },

  // And in those three seconds... they're asking three questions.
  'three-questions': ({c}) => {
    const {f} = c;
    const tA = c.q('asking'), t3 = c.q('three', 2), tQ = c.q('questions');
    const end = tQ + 18;
    const p = 0.88 * (1 - ease(f, c.from, end, 0, 1, (v) => v));
    const n = String(Math.max(1, Math.ceil(p * 3.4)));
    const sw = pop(f, c.from);
    const qs = [{x: 270, y: 830, t: t3}, {x: 540, y: 730, t: t3 + Math.round((tQ - t3) / 2)}, {x: 810, y: 830, t: tQ}];
    return (
      <>
        <Spot x={540} y={1000} r={420} color={C.gold} f={f} from={c.from} />
        <At x={540} y={410} s={sx(sw)} o={sw}><Stopwatch size={280} f={f} p={p} n={n} /></At>
        <Person look={LOOKS.visitor} f={f} x={540} y={1400} h={470} mood={f > tA ? 'confused' : 'curious'} arms={f > tA ? [6, 52] : [6, -6]} />
        {qs.map((q, i) => {
          const k = pop(f, q.t - 2);
          return <At key={i} x={q.x} y={q.y + Math.sin((f + i * 10) / 12) * 8} s={sx(k)} o={k} r={(i - 1) * 8}><QBubble size={160} /></At>;
        })}
      </>
    );
  },

  // If they can't find the answers, they're GONE.
  gone: ({c}) => {
    const {f} = c;
    const tF = c.q('find'), tA = c.q('answers'), tG = c.q('GONE');
    const ph = pop(f, c.from);
    const dash = ease(f, tG, tG + 9);
    const vx = 290 - dash * 700;
    return (
      <>
        <Spot x={700} y={760} r={420} color={C.sky} f={f} from={c.from} />
        <At x={720} y={760} s={sx(ph) * (1 - 0.05 * dash)} o={ph}>
          <Phone w={430}><Site w={398} f={f} scroll={Math.max(0, Math.sin((f - tF) / 9)) * 120 * ease(f, tF, tF + 6)} dim={ease(f, tG, tG + 8) * 0.7} /></Phone>
        </At>
        <At x={880} y={390} s={pop(f, tA + 2)} o={pop(f, tA + 2)} r={Math.sin(f / 4) * 3}><XBadge s={140} /></At>
        <Person look={LOOKS.visitor} f={f} x={vx} y={1390} h={440} mood={f > tA ? 'sad' : 'confused'} magnifier={f < tG} arms={f < tG ? [6, -78 + Math.sin(f / 7) * 10] : [60, -60]} tilt={-dash * 14} />
        <SpeedLines x={vx + 160} y={1060} o={dash * (1 - ease(f, tG + 10, tG + 18))} />
        <Puff x={300} y={1200} t={tG + 2} f={f} />
      </>
    );
  },

  // Question one. "What do you do?"
  question: ({c}) => <QuestionScene c={c} n={String(c.p.n ?? '1')} color={({blue: C.blue, gold: C.gold, sky: C.sky, green: C.green, coral: '#FF7A6B'} as any)[c.p.color ?? 'blue'] ?? C.blue} at={c.p.at ?? String(c.p.n ?? 'one')} quote={c.p.quote ?? ''} pose={c.p.pose ?? 'curious'} />,
  q1: ({c}) => <QuestionScene c={c} n="1" color={C.blue} at="one" quote="What do you do" pose="curious" />,
  // Question two. "Is this for me?"
  q2: ({c}) => <QuestionScene c={c} n="2" color={C.gold} at="two" quote="Is this for me" pose="self" />,
  // Question three. "What do I do next?"
  q3: ({c}) => <QuestionScene c={c} n="3" color={C.sky} at="three" quote="What do I do next" pose="lost" />,

  // So please... don't write "Welcome to our website."
  welcome: ({c}) => {
    const {f} = c;
    const tD = c.q("don't"), tW = c.q('write'), ws = c.ws(c.p.quote ?? 'Welcome to our website'), tEnd = c.e(c.p.quote ?? 'Welcome to our website');
    const ph = pop(f, c.from);
    const P = {x: 540, y: 810, w: 540};
    const strike = ease(f, tEnd + 2, tEnd + 16);
    const pt = (dx: number, dy: number) => sitePt(P.x, P.y, P.w, dx, dy);
    const keys = ws.length === 4 ? [
      {f: tW - 10, x: 1200, y: 1700}, {f: ws[0].f - 4, ...pt(20, 125)}, {f: ws[0].f + 6, ...pt(190, 125)}, {f: ws[1].f + 4, ...pt(245, 125)},
      {f: ws[2].f + 4, ...pt(335, 125)}, {f: ws[3].f + 4, ...pt(120, 180)}, {f: tEnd, ...pt(205, 180)}, {f: tEnd + 16, ...pt(330, 200)}, {f: tEnd + 30, x: 1200, y: 1800},
    ] : [];
    return (
      <>
        <Spot x={540} y={760} r={460} color={C.red} f={f} from={c.from} />
        <At x={P.x} y={P.y} s={sx(ph)} o={ph}>
          <Phone w={P.w}><Site w={P.w - 32} f={f} headline={<Spoken ws={ws} f={f} />} headSize={44} strike={strike} /></Phone>
        </At>
        <At x={850} y={330} s={pop(f, tD - 2)} o={pop(f, tD - 2)} r={Math.sin(f / 5) * 4}><StopBadge s={170} /></At>
        <Hand f={f} kind="marker" keys={keys} rot={0} />
      </>
    );
  },

  // Say it simply. "We help restaurants in Texas with their bookkeeping."
  simple: ({c}) => {
    const {f} = c;
    const tSim = c.q('simply');
    const ws = c.ws(c.p.quote ?? 'We help restaurants in Texas with their bookkeeping');
    const icons: {at: string; icon: string}[] = c.p.icons ?? [{at: 'restaurants', icon: 'food'}, {at: 'Texas', icon: 'texas'}, {at: 'bookkeeping', icon: 'books'}];
    const tR = c.q('restaurants'), tT = c.q('Texas'), tB = c.q('bookkeeping'), tEnd = c.e(ws.length ? (c.p.quote ?? 'bookkeeping').split(/\s+/).slice(-1)[0] : 'bookkeeping');
    const P = {x: 540, y: 810, w: 540};
    const oldOut = ease(f, tSim - 2, tSim + 10);
    const icon = (t: number, x: number, y: number, el: React.ReactNode, i: number) => {
      const k = pop(f, t - 3);
      return <At x={x} y={y + Math.sin((f + i * 15) / 14) * 8} s={sx(k)} o={k} r={(i - 1) * 5}><IconCard size={210}>{el}</IconCard></At>;
    };
    const headline = (
      <div style={{position: 'relative'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 352, opacity: 1 - oldOut, transform: `translateX(${-oldOut * 420}px)`}}>
          <span style={{fontSize: 44}}>{c.p.old ?? 'Welcome to our website.'}</span>
        </div>
        <div style={{fontSize: 40}}><Spoken ws={ws} f={f} hi={(c.p.highlight ?? icons.map((i) => i.at)).map((h: string) => h.toLowerCase().replace(/[^a-z]/g, ''))} /></div>
      </div>
    );
    return (
      <>
        <Spot x={540} y={760} r={460} color={C.green} f={f} from={c.from} />
        <At x={P.x} y={P.y}>
          <Phone w={P.w}><Site w={P.w - 32} f={f} headline={headline} strike={1 - oldOut} /></Phone>
        </At>
        <Burst x={P.x - 60} y={460} t={tSim} f={f} r={200} />
        {icons.slice(0, 3).map((it, i) => icon(c.q(it.at), [150, 935, 150][i], [520, 760, 1030][i], ICONS[it.icon] ?? ICONS.check, i))}
        <At x={830} y={380} s={pop(f, tEnd + 4)} o={pop(f, tEnd + 4)}><CheckBadge s={140} /></At>
        <Burst x={830} y={380} t={tEnd + 6} f={f} color={C.green} />
      </>
    );
  },

  // Say who you help, right at the top.
  who: ({c}) => {
    const {f} = c;
    const tW = c.q('who'), tH = c.q('help'), tR = c.q('right'), tT = c.q('top');
    const P = {x: 610, y: 810, w: 510};
    const top = sitePt(P.x, P.y, P.w, 120, 105);
    const chef = pop(f, tH - 4);
    return (
      <>
        <Spot x={600} y={600} r={440} color={C.blue} f={f} from={c.from} />
        <At x={P.x} y={P.y}>
          <Phone w={P.w}><Site w={P.w - 32} f={f} audience={pop(f, tW - 2)} topGlow={ease(f, tR, tR + 8)} /></Phone>
        </At>
        <Person look={LOOKS.chef} f={f} x={175} y={1410} h={470} mood="happy" arms={[150 + Math.sin(f / 5) * 12, -6]} o={chef} s={sx(chef)} />
        <Burst x={top.x - 40} y={top.y} t={tT} f={f} r={170} color={C.blue} />
        <Hand f={f} kind="point" keys={[{f: tR - 10, x: 1250, y: 1700}, {f: tR + 4, x: top.x + 60, y: top.y + 20}, {f: c.to + EXIT, x: top.x + 70, y: top.y + 26}]} />
      </>
    );
  },

  // Give them ONE clear button.
  'one-button': ({c}) => {
    const {f} = c;
    const tO = c.q('ONE'), tC = c.q('clear'), tB = c.q('button');
    const P = {x: 540, y: 810, w: 540};
    const btn = sitePt(P.x, P.y, P.w, 174, 418);
    return (
      <>
        <Spot x={540} y={800} r={460} color={C.blue} f={f} from={c.from} />
        <At x={P.x} y={P.y} s={sx(pop(f, c.from))}>
          <Phone w={P.w}><Site w={P.w - 32} f={f} clutter={1} clutterOut={ease(f, tO, tO + 20, 0, 1, (v) => v)} btnScale={1 + 0.14 * pop(f, tC)} btnShine={ease(f, tB, tB + 14)} /></Phone>
        </At>
        <At x={870} y={420} s={pop(f, tO - 2)} o={pop(f, tO - 2)}><NumBadge n="1" size={150} f={f} /></At>
        <Hand f={f} kind="tap" keys={[{f: c.from, x: 1250, y: 1700}, {f: tO - 2, x: 860, y: 1000}, {f: tO + 12, x: 260, y: 1060}, {f: tC + 4, x: btn.x + 60, y: btn.y + 10}, {f: c.to + EXIT, x: btn.x + 60, y: btn.y + 10}]} />
      </>
    );
  },

  // Like "Book a free call."
  book: ({c}) => {
    const {f} = c;
    const ws = c.ws(c.p.quote ?? 'Book a free call').map((w) => ({...w, text: w.text.replace(/\.$/, '')}));
    const tEnd = c.e(c.p.quote ?? 'Book a free call');
    const P = {x: 540, y: 810, w: 540};
    const btn = sitePt(P.x, P.y, P.w, 174, 418);
    const tap = tEnd + 5;
    return (
      <>
        <Spot x={540} y={800} r={460} color={C.gold} f={f} from={c.from} />
        <At x={P.x} y={P.y}>
          <Phone w={P.w} glow={ease(f, tap, tap + 6) * (1 - ease(f, tap + 14, tap + 24))}><Site w={P.w - 32} f={f} btnScale={1.14} button={<span><Spoken ws={ws} f={f} color="#fff" /></span>} /></Phone>
        </At>
        <Ripple x={btn.x} y={btn.y} t={tap} f={f} />
        <At x={860} y={380} s={pop(f, tap + 4)} o={pop(f, tap + 4)} r={6}><IconCard size={200}><CalendarIcon s={150} check={pop(f, tap + 10)} /></IconCard></At>
        <Hand f={f} kind="tap" keys={[{f: c.from - 4, x: btn.x + 60, y: btn.y + 10}, {f: tap, x: btn.x, y: btn.y}, {f: tap + 14, x: btn.x + 40, y: btn.y + 80}, {f: c.to + 6, x: 1250, y: 1800}]} taps={[tap]} />
      </>
    );
  },

  // [mischievously] Now try this.  -> Sudip, face moment 1
  'face-try': ({c}) => <FaceMoment c={c} face={c.p.face ?? 'idea'} side={c.p.side ?? 'right'} />,
  face: ({c}) => <FaceMoment c={c} face={c.p.face ?? 'idea'} side={c.p.side ?? 'right'} />,

  // Open your homepage on your phone. Only look at the first screen.
  'phone-test': ({c}) => {
    const {f} = c;
    const tO = c.q('Open'), tH = c.q('homepage'), tP = c.q('phone'), tOn = c.q('Only'), tF = c.q('first');
    const P = {x: 540, y: 810, w: 540};
    const ph = pop(f, tO - 4);
    const wig = Math.sin((f - tP) / 2.5) * 4 * (1 - ease(f, tP, tP + 14)) * (f > tP ? 1 : 0);
    const mid = sitePt(P.x, P.y, P.w, 200, 300);
    return (
      <>
        <Spot x={540} y={800} r={470} color={C.sky} f={f} from={c.from} />
        <At x={P.x} y={P.y} s={sx(ph)} o={ph} r={wig}>
          <Phone w={P.w}><Site w={P.w - 32} f={f} load={ease(f, tH, tH + 14)} fold={ease(f, tF, tF + 10)} /></Phone>
        </At>
        <At x={880} y={380} s={pop(f, tOn - 2)} o={pop(f, tOn - 2)}><EyeIcon s={170} f={f} /></At>
        <Ripple x={mid.x} y={mid.y} t={tO + 6} f={f} />
        <Hand f={f} kind="tap" keys={[{f: c.from, x: 1250, y: 1700}, {f: tO + 6, x: mid.x, y: mid.y}, {f: tH + 4, x: mid.x + 40, y: mid.y + 120}, {f: tP + 4, x: 1250, y: 1800}]} taps={[tO + 6]} />
      </>
    );
  },

  // Can a stranger answer all three questions?
  stranger: ({c}) => {
    const {f} = c;
    const tS = c.q('stranger'), tA = c.q('answer'), tAll = c.q('all'), tT = c.q('three'), tQ = c.q('questions');
    const k = pop(f, tS - 4);
    const qs = [{x: 250, y: 600, t: tA}, {x: 540, y: 500, t: tAll}, {x: 830, y: 600, t: tT}];
    return (
      <>
        <Spot x={540} y={1000} r={460} color={C.gold} f={f} from={c.from} />
        <Person look={LOOKS.stranger} f={f} x={540} y={1420} h={580} mood={f > tQ ? 'confused' : 'curious'} phone arms={[-38, 38]} o={k} s={sx(k)} />
        {qs.map((q, i) => {
          const kk = pop(f, q.t - 2);
          const pulse = f > tQ ? 1 + Math.sin((f - tQ) / 3 + i) * 0.05 : 1;
          return <At key={i} x={q.x} y={q.y + Math.sin((f + i * 10) / 12) * 8} s={sx(kk) * pulse} o={kk} r={(i - 1) * 8}><QBubble size={200} /></At>;
        })}
      </>
    );
  },

  // [softly] If not... that's why people leave.
  leave: ({c}) => {
    const {f} = c;
    const tN = c.q('not'), tWhy = c.q('why'), tP = c.q('people'), tL = c.q('leave');
    const qs = [{x: 250, y: 600}, {x: 540, y: 500}, {x: 830, y: 600}];
    const door = pop(f, tWhy - 4);
    return (
      <>
        <Spot x={540} y={900} r={460} color={C.red} f={f} from={c.from} />
        {qs.map((q, i) => {
          const flip = ease(f, tN + i * 4, tN + i * 4 + 8);
          return (
            <At key={i} x={q.x} y={q.y - ease(f, tWhy, tWhy + 12) * 120} s={1 - 0.3 * ease(f, tWhy, tWhy + 12)} r={(i - 1) * 8}>
              <div style={{position: 'relative'}}>
                <div style={{opacity: 1 - flip}}><QBubble size={200} /></div>
                <div style={{position: 'absolute', inset: 0, opacity: flip, transform: `scale(${0.6 + 0.4 * flip})`}}><QBubble size={200} mark="x" /></div>
              </div>
            </At>
          );
        })}
        <At x={950} y={1200} s={door} o={door}><DoorIcon s={180} open={ease(f, tL - 4, tL + 8)} /></At>
        {[0, 1, 2].map((i) => {
          const look = [LOOKS.sam, LOOKS.visitor, LOOKS.maya][i];
          const k = pop(f, tP - 4 + i * 3);
          const out = walkTo(f, tL + i * 5, tL + 34 + i * 5, 200 + i * 220, 960);
          const fade = 1 - ease(f, tL + 26 + i * 5, tL + 36 + i * 5);
          return <Person key={i} look={look} f={f + i * 15} x={out.x} y={1400} h={380} walk={out.walk} mood="sad" o={k * fade} s={sx(k) * (1 - 0.2 * ease(f, tL + 14 + i * 5, tL + 36 + i * 5))} />;
        })}
      </>
    );
  },

  // [warmly] Comment "FIX", and I'll tell you the one thing I'd change on your homepage.  -> Sudip, face moment 2
  comment: ({c}) => {
    const {f} = c;
    const KW: string = c.p.word ?? 'FIX';
    const tC = c.q('Comment'), tFix = c.q(KW), tT = c.q('tell'), tCh = c.q('change'), tH = c.q('homepage');
    const card = pop(f, tC - 2);
    const letters = KW.toUpperCase().slice(0, Math.max(0, Math.min(KW.length, Math.floor((f - tFix + 2) / 3) + 1)));
    const send = tFix + 16;
    const reply = pop(f, tT - 2);
    const mini = pop(f, tCh - 4);
    return (
      <>
        <FaceMoment c={c} face={c.p.face ?? 'thumbs-up'} side="left" bare />
        <At x={560} y={330} s={sx(card)} o={card}>
          <div style={{width: 900, height: 170, borderRadius: 40, background: '#fff', boxShadow: '0 30px 70px rgba(10,22,51,0.22)', display: 'flex', alignItems: 'center', gap: 26, padding: '0 30px', boxSizing: 'border-box'}}>
            <svg width={96} height={96} viewBox="0 0 30 30"><circle cx={15} cy={15} r={15} fill="#FF7A6B" /><circle cx={15} cy={12} r={6} fill="#FADFCC" /><path d="M4 27 Q15 17 26 27" fill="#FADFCC" /></svg>
            <div style={{flex: 1, height: 96, borderRadius: 30, background: C.cloud, display: 'flex', alignItems: 'center', padding: '0 30px', fontFamily: fonts.heading, fontWeight: 800, fontSize: 64, color: C.navy, letterSpacing: '0.04em'}}>
              {f >= tFix - 2 ? letters : ''}
              <span style={{width: 5, height: 60, background: C.blue, marginLeft: 6, opacity: Math.floor(f / 8) % 2 && f < send ? 1 : 0}} />
            </div>
            <div style={{transform: `scale(${1 + 0.15 * Math.sin(Math.max(0, f - tFix) / 4) * (f > tFix && f < send ? 1 : 0)})`}}>
              <Badge size={96} bg={f >= send ? C.green : C.blue}><PaperPlane s={46} /></Badge>
            </div>
          </div>
        </At>
        <Ripple x={1010 - 48 + 4} y={330} t={send} f={f} />
        <At x={620} y={610} s={sx(reply)} o={reply}>
          <Bubble w={600} tail="none" pad={30}>
            <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
              <div style={{width: 130, height: 130, borderRadius: 99, overflow: 'hidden', background: `linear-gradient(135deg, ${C.blue}, ${C.sky})`}}>
                <Img src={staticFile(faceSrc('big-smile'))} style={{width: 130, height: 174, objectFit: 'cover', objectPosition: '50% 0%'}} />
              </div>
              <Badge size={130} bg="#EAF1FF"><Wrench s={78} /></Badge>
              <div style={{transform: `rotate(${f * 3}deg)`}}><Sparkle s={72} /></div>
            </div>
          </Bubble>
        </At>
        <At x={860} y={1080} s={sx(mini)} o={mini} r={5}>
          <Phone w={250}><Site w={218} f={f} headline={undefined} topGlow={ease(f, tH, tH + 8)} btnShine={ease(f, tH + 4, tH + 18)} /></Phone>
        </At>
        <Burst x={860} y={820} t={tH} f={f} r={180} />
        <Hand f={f} kind="tap" keys={[{f: tFix - 8, x: 1250, y: 1400}, {f: send, x: 1012, y: 344}, {f: send + 16, x: 1250, y: 1400}]} taps={[send]} />
      </>
    );
  },
};


/** A big numbered question: badge, our visitor, and the question in a bubble word by word. */
const QuestionScene: React.FC<{c: Ctx; n: string; color: string; at: string; quote: string; pose: 'curious' | 'self' | 'lost'}> = ({c, n, color, at, quote, pose}) => {
  const {f} = c;
  const tN = Math.max(c.from, c.q(at) - 4);
  const ws = c.ws(quote);
  const b = pop(f, tN);
  const bub = pop(f, (ws[0]?.f ?? c.from) - 5);
  const arms: [number, number] = pose === 'self' ? [6, 42] : pose === 'lost' ? [48 + Math.sin(f / 6) * 6, -48 - Math.sin(f / 6) * 6] : [6, -6];
  return (
    <>
      <Spot x={540} y={500} r={360} color={color} f={f} from={c.from} />
      <At x={540} y={430} s={sx(b)} o={b} r={(1 - b) * -30}><NumBadge n={n} size={240} bg={color} f={f} /></At>
      {pose === 'lost' && <At x={860} y={1130} s={pop(f, c.from + 4)}><Signpost h={520} f={f} /></At>}
      <Person look={LOOKS.visitor} f={f} x={pose === 'lost' ? 330 : 300} y={1410} h={470} mood={pose === 'lost' ? 'confused' : 'curious'} arms={arms} />
      <At x={pose === 'lost' ? 560 : 640} y={pose === 'lost' ? 760 : 790} s={sx(bub)} o={bub}>
        <Bubble w={pose === 'lost' ? 620 : 560} tail="left">
          <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 68, lineHeight: 1.08, letterSpacing: '-0.02em', textAlign: 'center'}}>
            <Spoken ws={ws.map((w, i) => ({...w, text: i === ws.length - 1 ? w.text.replace(/[?.]$/, '') + '?' : w.text}))} f={f} />
          </div>
        </Bubble>
      </At>
    </>
  );
};

/** Sudip's own photo moment: slides in on a brand disc and keeps drifting. */
const FaceMoment: React.FC<{c: Ctx; face: string; side: 'left' | 'right'; bare?: boolean}> = ({c, face, side, bare}) => {
  const {f} = c;
  const k = pop(f, c.from, 22, 0.8);
  const t = f - c.from;
  const cx = side === 'left' ? 330 : 560;
  return (
    <>
      <div style={{position: 'absolute', left: cx - 430, top: 760, width: 860, height: 860, borderRadius: '50%', background: `linear-gradient(140deg, ${C.blue} 0%, ${C.sky} 100%)`, transform: `scale(${0.5 + 0.5 * k})`, opacity: k}} />
      <div style={{position: 'absolute', left: cx - 480, top: 710, width: 960, height: 960, borderRadius: '50%', border: `6px dashed ${C.blue}40`, transform: `rotate(${f * 0.5}deg) scale(${0.5 + 0.5 * k})`}} />
      {!bare && [0, 1, 2].map((i) => <At key={i} x={[180, 900, 860][i]} y={[620, 520, 980][i] + Math.sin((f + i * 20) / 10) * 12} s={pop(f, c.from + 4 + i * 3)} r={f * 2}><Sparkle s={[60, 80, 50][i]} color={i === 1 ? C.gold : C.sky} /></At>)}
      <Img src={staticFile(faceSrc(face))} style={{position: 'absolute', left: cx - 450 + (1 - k) * (side === 'left' ? -500 : 500) + Math.sin(t / 30) * 10, top: 560 + (1 - k) * 200, height: 1360, transform: `scale(${1 + Math.min(t, 150) * 0.0006})`, transformOrigin: '50% 100%', filter: 'drop-shadow(0 30px 50px rgba(10,22,51,0.3))'}} />
    </>
  );
};

const ICONS: Record<string, React.ReactNode> = {
  food: <Cloche s={150} />, texas: <TexasIcon s={160} />, books: <Ledger s={160} />, calendar: <CalendarIcon s={150} />,
  door: <DoorIcon s={120} />, wrench: <Wrench s={130} />, check: <CheckBadge s={140} />, x: <XBadge s={140} />,
};
/** friendlier scene names for new scripts (same scenes) */
const ALIAS: Record<string, string> = {
  'visitors-leave': 'visit', 'chart-drop': 'happening', timer: 'three-seconds', 'timer-questions': 'three-questions',
  'search-fail': 'gone', 'write-headline': 'welcome', 'rewrite-headline': 'simple', 'audience-top': 'who',
  'one-button': 'one-button', 'button-label': 'book', 'phone-check': 'phone-test', 'stranger-test': 'stranger',
  'questions-fail': 'leave', 'comment-cta': 'comment',
};

// ======================================================================= template
const Backdrop: React.FC<{f: number}> = ({f}) => {
  const x = 20 + Math.sin(f / 80) * 6;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at ${x}% 14%, rgba(25,167,255,0.14) 0%, rgba(255,255,255,0) 36%), radial-gradient(circle at ${88 - x / 2}% 82%, rgba(0,82,255,0.10) 0%, rgba(255,255,255,0) 40%), linear-gradient(180deg, #FFFFFF 0%, #F3F6FB 100%)`}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(10,22,51,0.07) 2.5px, transparent 2.5px)', backgroundSize: '46px 46px', maskImage: 'radial-gradient(circle at 50% 42%, black 10%, transparent 78%)'}} />
    </AbsoluteFill>
  );
};

export const Explainer: React.FC<TemplateProps> = ({timing, beats}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop f={f} />
      {beats.map((b) => {
        if (f < b.from - 1 || f > b.to + EXIT) return null;
        const name = (Array.isArray(b.show) ? b.show[0] : b.show) ?? 'visit';
        const Sc = SCENES[name] ?? SCENES[ALIAS[name]];
        if (!Sc) return null;
        const inn = b.index === 0 ? 1 : ease(f, b.from, b.from + ENTER);
        const out = ease(f, b.to, b.to + EXIT);
        const c = makeCtx(timing, b, f);
        return (
          <AbsoluteFill key={b.index} style={{opacity: Math.min(inn, 1 - out), transform: `translateX(${(1 - inn) * 90 - out * 90}px) scale(${(0.96 + 0.04 * inn) * (1 - 0.03 * out)})`}}>
            <Sc c={c} />
          </AbsoluteFill>
        );
      })}
      <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 0.9}}><Logo width={190} /></div>
      <Captions words={timing.words} y={1545} style="board" size={70} />
      <ProgressBar track="rgba(10,22,51,0.08)" />
    </AbsoluteFill>
  );
};

/** a soft pop when key things appear (kept few and quiet) */
const SFX_WORDS: Record<string, [string, string][]> = {
  visit: [['website', 'soft-pop'], ['leave', 'soft-swoosh']],
  'three-seconds': [['three', 'soft-tick']],
  'three-questions': [['questions', 'soft-pop-2']],
  gone: [['GONE', 'soft-swoosh']],
  q1: [['one', 'soft-pop']], q2: [['two', 'soft-pop']], q3: [['three', 'soft-pop']],
  welcome: [["don't", 'soft-tick']],
  simple: [['bookkeeping', 'soft-chime']],
  book: [['call', 'soft-tick']],
  'phone-test': [['Open', 'soft-tick']],
  comment: [['FIX', 'soft-pop-2']],
};
export const explainerSfx = (beats: ResolvedBeat[], timing: Timing): Sfx[] => {
  const out: Sfx[] = [];
  for (const b of beats) {
    const name = (Array.isArray(b.show) ? b.show[0] : b.show) ?? '';
    const c = makeCtx(timing, b, 0);
    for (const [w, s] of SFX_WORDS[name] ?? SFX_WORDS[ALIAS[name]] ?? []) out.push({f: c.q(w), src: s, vol: 0.4});
  }
  return out;
};

/** Cover: big title, the phone with the 3-second timer, Sudip pointing at it. */
export const ExplainerCover: React.FC<ReelProps> = ({reel}) => {
  const cv = reel.cover ?? {title: reel.hook};
  return (
    <AbsoluteFill>
      <Backdrop f={0} />
      <div style={{position: 'absolute', left: 580 - 470, top: 1000, width: 940, height: 940, borderRadius: '50%', background: `linear-gradient(140deg, ${C.blue} 0%, ${C.sky} 100%)`}} />
      <div style={{position: 'absolute', left: 70, top: 1020, transform: 'rotate(-7deg)'}}>
        <Phone w={330}><Site w={298} f={0} headline={<span>Welcome to our website.</span>} strike={1} /></Phone>
      </div>
      <At x={360} y={1060}><Stopwatch size={230} p={0.33} n="3" f={0} /></At>
      <Img src={staticFile(faceSrc(cv.face ?? 'shocked'))} style={{position: 'absolute', left: 380, top: 900, height: 1080, filter: 'drop-shadow(0 30px 50px rgba(10,22,51,0.3))'}} />
      <At x={960} y={1010}><XBadge s={130} /></At>
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}><Logo width={250} /></div>
      <div style={{position: 'absolute', top: 330, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
        {cv.kicker && <div style={{padding: '14px 30px', borderRadius: 999, background: '#EAF1FF', color: C.blue, fontFamily: fonts.body, fontWeight: 700, fontSize: 34, letterSpacing: '0.14em'}}>{cv.kicker.toUpperCase()}</div>}
        <div style={{fontFamily: fonts.heading, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.98, color: C.navy, textAlign: 'center'}}>
          <div style={{fontSize: 110}}>{cv.title}</div>
          {cv.highlight && <div style={{fontSize: 190, color: C.blue}}>{cv.highlight}</div>}
          {cv.after && <div style={{fontFamily: fonts.serif, fontStyle: 'italic', fontWeight: 400, letterSpacing: 0, fontSize: 86, color: C.ink, marginTop: 10}}>{cv.after}</div>}
        </div>
      </div>
    </AbsoluteFill>
  );
};
