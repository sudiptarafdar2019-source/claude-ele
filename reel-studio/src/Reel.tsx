import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {FPS} from './brand';
import {EndCard} from './components/Common';
import {propSfx} from './components/Props';
import {dedupe, Sfx, SoundTrack} from './components/Sound';
import {HOOK_SECONDS, resolveBeats, totalFrames, voiceEndFrame} from './lib/timing';
import {Toon, toonSfx} from './templates/Toon';
import {Faces, facesSfx} from './templates/Faces';
import {Hands, handsSfx} from './templates/Hands';
import {Podcast} from './templates/Podcast';
import {Tips} from './templates/Tips';
import {ReelProps} from './types';

const TEMPLATES = {toon: Toon, faces: Faces, hands: Hands, podcast: Podcast, tips: Tips};

export const Reel: React.FC<ReelProps> = ({reel, timing}) => {
  const beats = useMemo(() => resolveBeats(reel, timing), [reel, timing]);
  const total = totalFrames(timing);
  const vEnd = voiceEndFrame(timing);
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  const sfx = useMemo(() => {
    const list: Sfx[] = [{f: 0, src: 'impact', vol: 0.5}, {f: 0, src: 'whoosh', vol: 0.35}];
    const soft = reel.template === 'podcast';
    beats.forEach((b, i) => {
      if (i > 0) list.push({f: b.from, src: b.sfx ?? (soft ? 'swipe' : i % 2 ? 'whoosh' : 'whoosh-2'), vol: b.sfx === 'impact' ? 0.4 : soft ? 0.18 : 0.3});
      const pf = b.from + (reel.template === 'hands' ? 4 : reel.template === 'toon' ? 3 : 2);
      propSfx(b.prop, b.to - b.from).forEach((s) => list.push({...s, f: pf + s.f}));
    });
    if (reel.template === 'toon') list.push(...toonSfx(beats));
    if (reel.template === 'faces' || reel.template === 'tips') list.push(...facesSfx(beats, timing, vEnd));
    if (reel.template === 'hands') list.push(...handsSfx(beats, hookEnd));
    list.push({f: vEnd - 22, src: 'riser', vol: 0.3}, {f: vEnd + 2, src: 'impact-2', vol: 0.45});
    return dedupe(list.filter((s) => s.f < vEnd + 30));
  }, [beats, reel, timing]);
  const T = TEMPLATES[reel.template];
  return (
    <AbsoluteFill style={{background: '#071330'}}>
      <T reel={reel} timing={timing} beats={beats} />
      <EndCard from={vEnd} cta={reel.cta} dark={reel.template !== 'toon' && reel.template !== 'hands'} />
      <SoundTrack voice={reel.voice} music={reel.music} musicVolume={reel.musicVolume ?? (reel.template === 'podcast' ? 0.1 : 0.085)} sfx={sfx} voiceEnd={vEnd} />
    </AbsoluteFill>
  );
};
export const reelDuration = (p: ReelProps) => totalFrames(p.timing);
