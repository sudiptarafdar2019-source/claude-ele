import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {C, FPS, fonts} from '../brand';
import {DarkBg, Flash, HookTitle, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {Sfx} from '../components/Sound';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {ease, pop, rnd} from '../lib/motion';
import {TemplateProps} from './types';

// Face position (fraction of image) in each studio photo, used to frame close-ups.
const SHOTS: Record<string, {src: string; fx: number; fy: number}> = {
  a: {src: 'img/podcast/wide-a.jpg', fx: 0.43, fy: 0.3},
  b: {src: 'img/podcast/wide-b.jpg', fx: 0.48, fy: 0.3},
};
const FX = 40, FY = 470, FW = 1000, FH = 800;

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
  const audio = useAudioData(staticFile(reel.voice));
  const vis = audio ? visualizeAudio({fps, frame, audioData: audio, numberOfSamples: 32}) : new Array(32).fill(0);
  const amp = vis.slice(0, 8).reduce((a, x) => a + x, 0) / 8;
  const shot = (b.shot ?? 'a-wide').split('-');
  const S = SHOTS[shot[0]] ?? SHOTS.a;
  const close = shot[1] === 'close';
  const imgW = FH * 1.792;
  const zoom = (close ? 1.75 : 1.0) * (1 + Math.min(f, 240) * 0.00035) * (1 + amp * 0.025);
  const left = Math.min(0, Math.max(FW - imgW, FW / 2 - S.fx * imgW));
  const hand = {x: Math.sin(frame / 23) * 4 + Math.sin(frame / 7) * 1.5, y: Math.cos(frame / 19) * 3};
  const p = reel.podcast!;
  const scrim = b.prop && !['chip', 'cta', 'chips'].includes(b.prop.type) ? ease(f, 0, 6) * 0.72 : 0;
  const lower = ease(frame, hookEnd, hookEnd + 10) * (1 - ease(frame, hookEnd + 120, hookEnd + 130));
  return (
    <AbsoluteFill>
      <DarkBg warm={b.warm} />
      {/* show + episode */}
      <div style={{position: 'absolute', top: 210, left: 60, right: 60, textAlign: 'center', opacity: frame > hookEnd ? ease(frame, hookEnd, hookEnd + 8) : 0}}>
        <div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 30, letterSpacing: '0.28em', color: C.gold}}>{p.show.toUpperCase()}</div>
        <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 72, color: '#fff', marginTop: 12, letterSpacing: '-0.02em'}}>{reel.hook}</div>
      </div>
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
          <div style={{width: 18, height: 18, borderRadius: 99, background: C.red, opacity: Math.floor(frame / 15) % 2 ? 1 : 0.35}} /> REC
        </div>
        <div style={{position: 'absolute', top: 24, right: 28, fontFamily: fonts.body, fontWeight: 600, fontSize: 24, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em'}}>{p.episode.toUpperCase()}</div>
        {/* waveform */}
        <div style={{position: 'absolute', bottom: 26, left: 30, right: 30, height: 70, display: 'flex', alignItems: 'flex-end', gap: 6, opacity: 1 - scrim}}>
          {vis.slice(0, 32).map((v, i) => (
            <div key={i} style={{flex: 1, borderRadius: 6, height: 6 + Math.min(64, v * 380 * (1 - i / 50)), background: i % 3 ? C.sky : C.gold, opacity: 0.85}} />
          ))}
        </div>
        {/* lower third */}
        <div style={{position: 'absolute', left: 30, bottom: 120, transform: `translateX(${(1 - lower) * -500}px)`, opacity: lower}}>
          <div style={{background: C.gold, color: C.navy, fontFamily: fonts.heading, fontWeight: 800, fontSize: 40, padding: '10px 22px', borderRadius: '14px 14px 14px 0'}}>{p.name}</div>
          <div style={{display: 'inline-block', background: 'rgba(7,19,48,0.9)', color: '#fff', fontFamily: fonts.body, fontWeight: 500, fontSize: 28, padding: '8px 22px', borderRadius: '0 0 14px 14px'}}>{p.role}</div>
        </div>
        {/* b-roll card */}
        {b.prop && frame > hookEnd && (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: ['chip', 'cta', 'chips'].includes(b.prop.type) ? 'flex-start' : 'center', paddingTop: ['chip', 'cta', 'chips'].includes(b.prop.type) ? 90 : 0}}>
            <div style={{transform: `scale(${b.prop.type === 'orbit' ? 0.95 : 0.92})`}}>
              <PropView prop={b.prop} f={f - 3} dur={dur} theme="dark" width={860} />
            </div>
          </AbsoluteFill>
        )}
      </div>
      <Flash at={b.from} color="#000" />
      {b.warm && <Embers frame={frame} />}
      <HookTitle text={reel.hook} hi={reel.hookHighlight} dark until={hookEnd} top={250} />
      <Captions words={timing.words} y={1440} style="podcast" size={82} />
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
