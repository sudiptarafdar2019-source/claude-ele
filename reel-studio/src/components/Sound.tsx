import React from 'react';
import {Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';

export type Sfx = {f: number; src: string; vol: number};

/** Voice + ducked background music + every sound effect, all frame-accurate. */
export const SoundTrack: React.FC<{voice: string; music?: string; musicVolume?: number; sfx: Sfx[]; voiceEnd: number}> = ({voice, music, musicVolume = 0.09, sfx, voiceEnd}) => {
  const {durationInFrames} = useVideoConfig();
  return (
    <>
      <Audio src={staticFile(voice)} volume={1} />
      {music && (
        <Audio
          src={staticFile(music)}
          loop
          volume={(f) =>
            interpolate(f, [0, 12, voiceEnd - 6, voiceEnd + 10, durationInFrames - 20, durationInFrames], [0, musicVolume, musicVolume, musicVolume * 2.2, musicVolume * 2.2, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
          }
        />
      )}
      {sfx
        .filter((s) => s.f >= 0 && s.f < durationInFrames)
        .map((s, i) => (
          <Sequence key={i} from={Math.round(s.f)} durationInFrames={60} layout="none">
            <Audio src={staticFile(`sfx/${s.src}.mp3`)} volume={s.vol} />
          </Sequence>
        ))}
    </>
  );
};

/** Drop sounds that land on top of each other (keeps the mix clean). */
export const dedupe = (list: Sfx[], minGap = 4) => {
  const sorted = [...list].sort((a, b) => a.f - b.f || b.vol - a.vol);
  const out: Sfx[] = [];
  for (const s of sorted) {
    const clash = out.find((o) => Math.abs(o.f - s.f) < minGap);
    if (!clash) out.push(s);
  }
  return out;
};
