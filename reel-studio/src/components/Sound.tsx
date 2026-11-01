import React from 'react';
import {Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {ReelSpec} from '../types';

export type Sfx = {f: number; src: string; vol: number};

/** The soft sound set. Old names still work and are mapped to the soft version. */
const ALIAS: Record<string, string> = {
  whoosh: 'soft-swoosh', 'whoosh-2': 'soft-swoosh', swipe: 'soft-swoosh', 'swipe-2': 'soft-swoosh',
  impact: 'soft-swell', 'impact-2': 'soft-swell', riser: 'soft-swell', 'riser-long': 'soft-swell',
  pop: 'soft-pop', click: 'soft-tick', 'click-2': 'soft-tick', typing: 'soft-tick', 'typing-2': 'soft-tick',
  ding: 'soft-chime', 'ding-2': 'soft-chime-2', notify: 'soft-pop-2', 'notify-2': 'soft-pop-2', 'marker-2': 'marker',
  swoosh: 'soft-swoosh', tick: 'soft-tick', chime: 'soft-chime', swell: 'soft-swell',
};
export const sfxName = (s: string) => ALIAS[s] ?? s;

export const DEFAULT_MIX = {voice: 1, music: 0.07, sfx: 0.6};
export const mixOf = (reel: ReelSpec) => ({
  voice: reel.mix?.voice ?? DEFAULT_MIX.voice,
  music: reel.mix?.music ?? reel.musicVolume ?? DEFAULT_MIX.music,
  sfx: reel.mix?.sfx ?? DEFAULT_MIX.sfx,
});
export const voiceFxPreset = (reel: ReelSpec) => reel.voiceFx ?? (reel.template === 'podcast' ? 'warm' : 'studio');
/** polished voice file made by scripts/voice-fx.mjs (runs automatically before render/studio) */
export const voiceFile = (reel: ReelSpec) => {
  const p = voiceFxPreset(reel);
  if (p === 'none') return reel.voice;
  const base = reel.voice.split('/').pop()!.replace(/\.[^.]+$/, '');
  return `voice/fx/${base}-${p}.mp3`;
};

/** Voice + quiet background music + a few soft effect sounds, all frame-accurate. */
export const SoundTrack: React.FC<{reel: ReelSpec; sfx: Sfx[]; voiceEnd: number}> = ({reel, sfx, voiceEnd}) => {
  const {durationInFrames} = useVideoConfig();
  const mix = mixOf(reel);
  return (
    <>
      <Audio src={staticFile(voiceFile(reel))} volume={mix.voice} />
      {reel.music && mix.music > 0 && (
        <Audio
          src={staticFile(reel.music)}
          loop
          volume={(f) =>
            interpolate(f, [0, 20, voiceEnd - 6, voiceEnd + 12, durationInFrames - 24, durationInFrames], [0, mix.music, mix.music, mix.music * 1.8, mix.music * 1.8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
          }
        />
      )}
      {mix.sfx > 0 &&
        sfx
          .filter((s) => s.f >= 0 && s.f < durationInFrames)
          .map((s, i) => (
            <Sequence key={i} from={Math.round(s.f)} durationInFrames={60} layout="none">
              <Audio src={staticFile(`sfx/${sfxName(s.src)}.mp3`)} volume={Math.min(1, s.vol * mix.sfx)} />
            </Sequence>
          ))}
    </>
  );
};

/** Keep the mix calm: never two effect sounds closer than minGap frames (default 0.4 s). */
export const dedupe = (list: Sfx[], minGap = 12) => {
  const sorted = [...list].sort((a, b) => a.f - b.f || b.vol - a.vol);
  const out: Sfx[] = [];
  for (const s of sorted) {
    const clash = out.find((o) => Math.abs(o.f - s.f) < minGap);
    if (!clash) out.push(s);
  }
  return out;
};
