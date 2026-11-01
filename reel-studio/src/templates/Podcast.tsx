import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {C, FPS, fonts} from '../brand';
import {DarkBg, Flash, HookTitle, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {ShotStage} from '../components/Visual';
import {autoShots, shotAt} from '../lib/visuals';
import {Sfx, voiceFile} from '../components/Sound';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {ease, pop, rnd} from '../lib/motion';
import {TemplateProps} from './types';

// Face position (fraction of image) in each studio photo, used to frame close-ups.
const SHOTS: Record<string, {src: string; fx: number; fy: number}> = {
  a: {src: 'img/podcast/wide-a.jpg', fx: 0.43, fy: 0.3},
  b: {src: 'img/podcast/wide-b.jpg', fx: 0.48, fy: 0.3},
};
const FX = 40, FY = 170, FW = 1000, FH = 1060;

/**
 * TEMPLATE 4 · PODCAST CLIP
 * Your studio photo in a podcast frame. Cuts between two camera angles and wide/close
 * shots on every beat, slow push-ins, audio-reactive motion and a live waveform.
 * Optional: put a lip-sync video in reel.podcast.video to replace the photo.
 */
export const Podcast: React.FC<TemplateProps> = ({reel, timing, beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b = beatAt(beats, frame);
  const f = frame - b.from;
  const dur = b.to - b.from;
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  const audio = useAudioData(staticFile(voiceFile(reel)));
  const vis = audio ? visualizeAudio({fps, frame, audioData: audio, numberOfSamples: 32}) : new Array(32).fill(0);
  const amp = vis.slice(0, 8).reduce((a, x) => a + x, 0) / 8;
  // camera angle changes with every shot (1-2 s): wide / close / other angle
  const shots = React.useMemo(() => autoShots(timing, beats, 1e6), [timing, beats]);
  const vs = shotAt(shots, frame);
  const prevVs = shots[shots.indexOf(vs) - 1];
  const fsh = frame - vs.from;
  const ANGLES = ['a-wide', 'a-close', 'b-wide', 'b-close'];
  const shot = (shots.indexOf(vs) === 0 && b.shot ? b.shot : ANGLES[vs.layout]).split('-');
  const S = SHOTS[shot[0]] ?? SHOTS.a;
  const close = shot[1] === 'close';
  const imgW = FH * 1.792;
  const zoom = (close ? 1.6 : 1.0) * (1 + Math.min(fsh, 90) * 0.0008) * (1 + amp * 0.03);
  const left = Math.min(0, Math.max(FW - imgW, FW / 2 - S.fx * imgW));
  const hand = {x: Math.sin(frame / 23) * 4 + Math.sin(frame / 7) * 1.5, y: Math.cos(frame / 19) * 3};
  const p = reel.podcast!;
  const scrim = 0;
  const lower = ease(frame, hookEnd, hookEnd + 10) * (1 - ease(frame, hookEnd + 120, hookEnd + 130));
  return (
    <AbsoluteFill>
      <DarkBg warm={b.warm} />
      {/* the frame */}
      <div style={{position: 'absolute', left: FX, top: FY, width: FW, height: FH, borderRadius: 40, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.55)', border: `2px solid ${C.lineDark}`, background: '#000'}}>
        <div style={{position: 'absolute', inset: 0, transform: `translate(${hand.x}px, ${hand.y}px) scale(${zoom})`, transformOrigin: `${((S.fx * imgW + left) / FW) * 100}% ${S.fy * 100 + 8}%`}}>
          {p.video ? (
            <OffthreadVideo src={staticFile(p.video)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <Img src={staticFile(S.src)} style={{position: 'absolute', top: 0, left, height: FH, width: imgW}} />
          )}
        </div>
        {b.warm && <AbsoluteFill style={{background: 'radial-gradient(circle at 70% 30%, rgba(255,190,90,0.35), transparent 60%)', mixBlendMode: 'screen'}} />}
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.55) 100%)'}} />
        <AbsoluteFill style={{background: `rgba(7,19,48,${scrim})`, backdropFilter: scrim ? `blur(${scrim * 10}px)` : undefined}} />
        <div style={{position: 'absolute', top: 26, left: 30, display: 'flex', alignItems: 'center', gap: 12, fontFamily: fonts.body, fontWeight: 700, fontSize: 26, color: '#fff', letterSpacing: '0.12em'}}>
          <div style={{width: 18, height: 18, borderRadius: 99, background: C.red, opacity: Math.floor(frame / 15) % 2 ? 1 : 0.35}} />
        </div>
        {/* waveform */}
        <div style={{position: 'absolute', bottom: 26, left: 30, right: 30, height: 70, display: 'flex', alignItems: 'flex-end', gap: 6, opacity: 1 - scrim}}>
          {vis.slice(0, 32).map((v, i) => (
            <div key={i} style={{flex: 1, borderRadius: 6, height: 6 + Math.min(64, v * 380 * (1 - i / 50)), background: i % 3 ? C.sky : C.gold, opacity: 0.85}} />
          ))}
        </div>
      </div>
      <Flash at={vs.from} color="#000" />
      {b.warm && <Embers frame={frame} />}
      {/* the picture for what is being said, big, under the captions */}
      <div style={{position: 'absolute', left: 0, top: 1400, width: 1080, height: 500}}>
        <ShotStage shot={vs} prev={prevVs} frame={frame} size={250} dark />
      </div>
      <Captions words={timing.words} y={1310} style="podcast" size={82} />
      <ProgressBar />
    </AbsoluteFill>
  );
};

const Embers: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {Array.from({length: 18}).map((_, i) => {
      const x = rnd(i) * 1080, sp = 0.6 + rnd(i + 9) * 1.4;
      const y = 1920 - ((frame * sp * 3 + rnd(i + 3) * 1920) % 1920);
      const s = 6 + rnd(i + 5) * 10;
      return <div key={i} style={{position: 'absolute', left: x + Math.sin(frame / 20 + i) * 20, top: y, width: s, height: s, borderRadius: 99, background: C.goldLight, opacity: 0.55, filter: 'blur(1.5px)', boxShadow: `0 0 ${s * 2}px ${C.gold}`}} />;
    })}
  </AbsoluteFill>
);

export const podcastSfx = (): Sfx[] => [];
