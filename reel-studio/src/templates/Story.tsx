import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Camera, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {Icon} from '../components/Icon';
import {ShotStage} from '../components/Visual';
import {autoShots, shotAt} from '../lib/visuals';
import {Character, Mood} from '../components/Character';
import {Scene} from '../components/Scenes';
import {useVoiceLevel} from '../components/Speaker';
import {voiceFile} from '../components/Sound';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {ease} from '../lib/motion';
import {TemplateProps} from './types';
import {ResolvedBeat, Timing} from '../types';

/**
 * TEMPLATE · CARTOON STORY (light theme)
 * Animated vector characters act out the script in a cartoon scene. The speaker's mouth
 * moves with the voice, everyone blinks and breathes, arms move between gestures,
 * new characters walk in, and speech/thought bubbles carry the few words on screen.
 */

export type CastMember = {who: string; do?: string; mood?: Mood};
const POSE_TO_GESTURE: Record<string, string> = {smile: 'idle', thinking: 'think', pointing: 'point', shocked: 'shrug', 'thumbs-up': 'thumbs-up', explaining: 'explain'};
const TAG_MOOD: Record<string, Mood> = {
  curious: 'thinking', sighs: 'worried', seriously: 'neutral', confidently: 'happy', excited: 'excited', warmly: 'happy',
  laughs: 'excited', thoughtfully: 'thinking', surprised: 'surprised', sarcastic: 'thinking', softly: 'happy',
};

const FEET = 1430;

const castOf = (b: ResolvedBeat | undefined, timing: Timing): CastMember[] => {
  if (!b) return [];
  const raw = (b as any).cast as CastMember[] | undefined;
  const tag = timing.words[b.wordIndex]?.tag;
  if (raw?.length) return raw.map((m) => ({...m, mood: m.mood ?? (m.who === 'sudip' ? TAG_MOOD[tag] ?? 'happy' : 'neutral')}));
  return [{who: 'sudip', do: POSE_TO_GESTURE[b.pose ?? 'smile'] ?? 'explain', mood: TAG_MOOD[tag] ?? 'happy'}];
};

const layout = (n: number, side: boolean) => {
  if (side) {
    if (n === 1) return {xs: [290], s: 0.92};
    if (n === 2) return {xs: [170, 420], s: 0.72};
    return {xs: [130, 300, 470], s: 0.6};
  }
  if (n === 1) return {xs: [540], s: 1.0};
  if (n === 2) return {xs: [330, 750], s: 0.92};
  return {xs: [210, 540, 870], s: 0.8};
};

const placeOf = (beat: ResolvedBeat | undefined, timing: Timing, who: string) => {
  if (!beat) return null;
  const cast = castOf(beat, timing);
  const i = cast.findIndex((m) => m.who === who);
  if (i < 0) return null;
  const l = layout(cast.length, beat.prop?.type === 'phone');
  return {x: l.xs[i], s: l.s, m: cast[i]};
};

/** Speech / thought bubble that shows a picture (no words). The picture changes with the shots. */
const Bubble: React.FC<{x: number; y: number; icon: string; f: number; fi: number; think?: boolean; tailX: number}> = ({x, y, icon, f, fi, think, tailX}) => {
  const s = ease(f, 2, 12);
  const pi = ease(fi, 0, 10);
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: x, top: y + Math.sin(frame / 14) * 6, transform: `translate(-50%, -100%) scale(${0.85 + 0.15 * s})`, transformOrigin: `${50 + (tailX - x) / 6}% 100%`, opacity: s}}>
      <div style={{width: 300, height: 230, borderRadius: think ? 120 : 60, background: '#fff', boxShadow: '0 18px 50px rgba(10,22,51,0.16)', border: `5px solid ${think ? '#DCE6FA' : C.navy}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transform: `scale(${0.6 + 0.4 * pi}) rotate(${(1 - pi) * -15}deg)`, opacity: pi, strokeDasharray: 120, strokeDashoffset: 120 * (1 - ease(fi, 2, 18))} as React.CSSProperties}>
          <Icon name={icon} size={140} color={C.blue} stroke={2.2} />
        </div>
      </div>
      {think ? (
        <>
          <div style={{position: 'absolute', left: `calc(50% + ${(tailX - x) * 0.5}px)`, bottom: -40, width: 34, height: 34, borderRadius: 99, background: '#fff', border: '4px solid #DCE6FA'}} />
          <div style={{position: 'absolute', left: `calc(50% + ${(tailX - x) * 0.7}px)`, bottom: -78, width: 20, height: 20, borderRadius: 99, background: '#fff', border: '4px solid #DCE6FA'}} />
        </>
      ) : (
        <svg style={{position: 'absolute', left: `calc(50% + ${Math.max(-120, Math.min(120, tailX - x)) - 30}px)`, bottom: -40}} width={60} height={44} viewBox="0 0 60 44">
          <path d="M4 0 L56 0 L18 42 Z" fill="#fff" stroke={C.navy} strokeWidth={5} strokeLinejoin="round" />
          <rect x={6} y={0} width={46} height={6} fill="#fff" />
        </svg>
      )}
    </div>
  );
};

export const Story: React.FC<TemplateProps> = ({reel, timing, beats}) => {
  const frame = useCurrentFrame();
  const b = beatAt(beats, frame);
  const pb = beats[b.index - 1];
  const f = frame - b.from;
  const dur = b.to - b.from;
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  const level = useVoiceLevel(voiceFile(reel));
  const cast = castOf(b, timing);
  const shots = React.useMemo(() => autoShots(timing, beats, 1e6), [timing, beats]);
  const shot = shotAt(shots, frame);
  const prevShot = shots[shots.indexOf(shot) - 1];
  // index of this shot inside the beat: the talking character changes gesture on every shot
  const si = shots.filter((x) => x.beat === b.index && x.from <= frame).length - 1;
  const ALT: Record<string, string> = {explain: 'present', present: 'explain', point: 'explain', 'point-up': 'explain', idle: 'explain', 'thumbs-up': 'present', shrug: 'explain', think: 'idle', crossed: 'think', wave: 'present', cheer: 'thumbs-up'};
  const gAt = (m: CastMember, k: number) => {
    const base = m.do ?? 'idle';
    if (k <= 0 || base === 'phone') return base;
    const talker = m.who === ((b as any).speaker ?? 'sudip');
    return talker && k % 2 === 1 ? ALT[base] ?? base : base;
  };
  const side = b.prop?.type === 'phone'; // cast stands on the left for the whole phone beat
  const {xs, s} = layout(cast.length, side);
  // the voice is Sudip's, so only he lip-syncs unless a beat names another speaker
  const speaker = (b as any).speaker ?? 'sudip';
  const t = ease(f, 0, 14);
  const scene = (b as any).scene ?? (reel as any).scene ?? 'studio';
  const prevScene = pb ? (pb as any).scene ?? (reel as any).scene ?? 'studio' : scene;
  const sceneT = scene === prevScene ? 1 : ease(f, 0, 12);
  const speakerX = xs[cast.findIndex((m) => m.who === speaker)] ?? 540;
  const topProp = frame > hookEnd && b.prop && !side;
  const say = (b as any).say as string | undefined;
  const think = (b as any).think as string | undefined;

  return (
    <AbsoluteFill>
      <Scene name={prevScene} />
      {sceneT < 1 && <AbsoluteFill style={{opacity: sceneT}}><Scene name={scene} /></AbsoluteFill>}
      {sceneT === 1 && scene !== prevScene && <Scene name={scene} />}
      <Camera cutFrame={shot.from} index={shots.indexOf(shot)} strength={0.5}>
        {/* cast */}
        {cast.map((m, i) => {
          const prev = placeOf(pb, timing, m.who);
          const x0 = prev ? prev.x : (xs[i] < 540 ? -300 : 1380);
          const s0 = prev ? prev.s : s;
          const enter = !prev;
          const tt = enter ? ease(f, 0, 18) : t;
          const x = x0 + (xs[i] - x0) * tt;
          const sc = s0 + (s - s0) * tt;
          const hop = enter ? Math.sin(Math.min(1, f / 18) * Math.PI) * 30 : 0;
          const talking = m.who === speaker && level > 0.03 && frame < (b.to + 2);
          const w = 400 * sc, h = 800 * sc;
          return (
            <div key={m.who} style={{position: 'absolute', left: x - w / 2, top: FEET - h * 0.9875 - hop, width: w, height: h}}>
              <Character who={m.who} gesture={gAt(m, si)} prevGesture={si > 0 ? gAt(m, si - 1) : prev?.m.do ?? (enter ? 'wave' : 'idle')} gestureT={ease(frame - (si > 0 ? shot.from : b.from), 0, 10)} mood={m.mood} talking={talking} level={talking ? level : 0} look={m.who === speaker ? 0 : Math.sign(speakerX - x)} seed={i * 3 + 1} />
            </div>
          );
        })}
        {/* phone / side prop */}
        {side && shot.phone && (
          <div style={{position: 'absolute', left: 560, top: 420, width: 480, height: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(3deg) translateX(${(1 - ease(frame - shot.from, 0, 12)) * 400}px)`}}>
            <PropView prop={b.prop!} f={f - 3} dur={dur} theme="light" width={430 / 0.62} />
          </div>
        )}
        {side && !shot.phone && (
          <div style={{position: 'absolute', left: 500, top: 450, width: 600, height: 700}}>
            <ShotStage shot={shot} frame={frame} size={240} dark={false} />
          </div>
        )}
        {/* bubble with a picture, or the picture floating above the cast */}
        {(say || think) && !side ? (
          <Bubble x={Math.max(260, Math.min(820, speakerX + (speakerX < 540 ? 120 : -120)))} y={FEET - 800 * s + 40} tailX={speakerX} icon={shot.icon} f={f} fi={frame - shot.from} think={!say} />
        ) : !side ? (
          <div style={{position: 'absolute', left: 140, top: 240, width: 800, height: 520}}>
            <ShotStage shot={shot} prev={prevShot && prevShot.beat === shot.beat ? prevShot : undefined} frame={frame} size={cast.length > 1 ? 250 : 280} dark={false} />
          </div>
        ) : null}
      </Camera>
      <Captions words={timing.words} y={1640} style="light" size={74} />
      <NamePill voice={voiceFile(reel)} label="Sudip · Orbirise" avatar="img/faces/01-neutral.webp" />
      <ProgressBar track="rgba(10,22,51,0.08)" />
    </AbsoluteFill>
  );
};
