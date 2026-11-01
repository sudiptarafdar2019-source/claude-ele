import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {faceSrc} from '../lib/faces';
import {ease} from '../lib/motion';

/** Smoothed loudness of the voice (0..1) at a frame. Used to make the speaker "alive" while talking. */
export const useVoiceLevel = (voice: string) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audio = useAudioData(staticFile(voice));
  if (!audio) return 0;
  let sum = 0;
  for (let k = -2; k <= 2; k++) {
    const fr = Math.max(0, frame + k);
    const v = visualizeAudio({fps, frame: fr, audioData: audio, numberOfSamples: 32});
    sum += (v[1] + v[2] + v[3] + v[4]) / 4;
  }
  return Math.min(1, (sum / 5) * 4);
};

/**
 * Your face cutout, speaking. Expressions cross-fade (no bouncing), the picture breathes and
 * pushes in slightly with your voice, and `focus` (0..1) makes it bigger for "talking to camera" moments.
 */
export const Speaker: React.FC<{
  face: string; prevFace?: string; since: number; voice: string;
  height: number; focusHeight?: number; focus?: number; glow?: string; x?: number;
}> = ({face, prevFace, since, voice, height, focusHeight, focus = 0, glow = 'rgba(0,82,255,0.55)', x = 0}) => {
  const frame = useCurrentFrame();
  const level = useVoiceLevel(voice);
  const t = ease(frame - since, 0, 8);
  const h = height + ((focusHeight ?? height) - height) * focus;
  const talk = 1 + level * 0.018;
  const breathe = 1 + Math.sin(frame / 22) * 0.004;
  const sway = Math.sin(frame / 37) * 0.6;
  const img = (name: string, opacity: number) => (
    <Img
      src={staticFile(faceSrc(name))}
      style={{position: 'absolute', bottom: 0, left: '50%', height: h, transform: `translateX(-50%)`, opacity, filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.45))'}}
    />
  );
  return (
    <div style={{position: 'absolute', left: x, right: -x, bottom: 0, height: h + 40, transform: `scale(${talk * breathe}) rotate(${sway}deg)`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', bottom: h * 0.18, left: '50%', width: h * 0.95, height: h * 0.95, transform: 'translateX(-50%)', borderRadius: 999, background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 66%)`, opacity: 0.8 + level * 0.4}} />
      {prevFace && prevFace !== face && t < 1 && img(prevFace, 1 - t)}
      {img(face, prevFace && prevFace !== face ? t : 1)}
    </div>
  );
};
