import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Camera, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
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

const Bubble: React.FC<{x: number; y: number; text: string; f: number; think?: boolean; tailX: number}> = ({x, y, text, f, think, tailX}) => {
  const s = ease(f, 2, 12);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) scale(${0.85 + 0.15 * s})`, transformOrigin: `${50 + (tailX - x) / 6}% 100%`, opacity: s}}>
      <div style={{maxWidth: 620, padding: '26px 38px', borderRadius: think ? 80 : 44, background: '#fff', boxShadow: '0 18px 50px rgba(10,22,51,0.16)', border: `4px solid ${think ? '#DCE6FA' : C.navy}`, fontFamily: think ? fonts.hand : fonts.heading, fontWeight: think ? 700 : 800, fontSize: think ? 58 : 54, lineHeight: 1.12, color: C.navy, textAlign: 'center'}}>
        {text}
      </div>
      {think ? (
        <>
          <div style={{position: 'absolute', left: `calc(50% + ${(tailX - x) * 0.5}px)`, bottom: -40, width: 34, height: 34, borderRadius: 99, background: '#fff', border: '4px solid #DCE6FA'}} />
          <div style={{position: 'absolute', left: `calc(50% + ${(tailX - x) * 0.7}px)`, bottom: -78, width: 20, height: 20, borderRadius: 99, background: '#fff', border: '4px solid #DCE6FA'}} />
        </>
      ) : (
        <svg style={{position: 'absolute', left: `calc(50% + ${Math.max(-200, Math.min(200, tailX - x)) - 30}px)`, bottom: -40}} width={60} height={44} viewBox="0 0 60 44">
          <path d="M4 0 L56 0 L18 42 Z" fill="#fff" stroke={C.navy} strokeWidth={4} strokeLinejoin="round" />
          <rect x={6} y={0} width={46} height={5} fill="#fff" />
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
  const side = b.prop?.type === 'phone';
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
      <Camera cutFrame={b.from} index={b.index} strength={0.5}>
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
              <Character who={m.who} gesture={m.do ?? 'idle'} prevGesture={prev?.m.do ?? (enter ? 'wave' : 'idle')} gestureT={ease(f, 0, 10)} mood={m.mood} talking={talking} level={talking ? level : 0} look={m.who === speaker ? 0 : Math.sign(speakerX - x)} seed={i * 3 + 1} />
            </div>
          );
        })}
        {/* phone / side prop */}
        {frame > hookEnd && side && (
          <div style={{position: 'absolute', left: 560, top: 420, width: 480, height: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(3deg)'}}>
            <PropView prop={b.prop!} f={f - 3} dur={dur} theme="light" width={430 / 0.62} />
          </div>
        )}
        {/* top prop */}
        {topProp && (
          <div style={{position: 'absolute', top: 250, left: 0, right: 0, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{transform: 'scale(0.9)'}}><PropView prop={b.prop!} f={f - 3} dur={dur} theme="light" width={900} /></div>
          </div>
        )}
        {/* keyword when nothing else is up top */}
        {frame > hookEnd && !b.prop && !say && !think && b.headline && (
          <div style={{position: 'absolute', top: 300, left: 60, right: 60, textAlign: 'center', opacity: ease(f, 0, 8), transform: `translateY(${(1 - ease(f, 0, 10)) * 30}px)`}}>
            {b.eyebrow && <div style={{fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 58, color: C.ink}}>{b.eyebrow}</div>}
            <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 120, lineHeight: 1, letterSpacing: '-0.035em', color: C.blue}}>{b.headline}</div>
          </div>
        )}
        {/* speech / thought bubble */}
        {frame > hookEnd && !topProp && (say || think) && (
          <Bubble
            x={Math.max(340, Math.min(740, side ? 300 : speakerX))}
            y={FEET - 800 * s + 50}
            tailX={speakerX}
            text={(say ?? think)!}
            think={!say}
            f={f}
          />
        )}
      </Camera>
      <HookTitle text={reel.hook} hi={reel.hookHighlight} until={hookEnd} top={300} />
      <Captions words={timing.words} y={1640} style="light" size={70} />
      <NamePill voice={voiceFile(reel)} label="Sudip · Orbirise" avatar="img/faces/01-neutral.webp" />
      <ProgressBar track="rgba(10,22,51,0.08)" />
    </AbsoluteFill>
  );
};
