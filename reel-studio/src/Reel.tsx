import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {FPS} from './brand';
import {EndCard} from './components/Common';
import {propSfx} from './components/Props';
import {dedupe, Sfx, SoundTrack} from './components/Sound';
import {HOOK_SECONDS, resolveBeats, totalFrames, voiceEndFrame} from './lib/timing';
import {Toon} from './templates/Toon';
import {Faces} from './templates/Faces';
import {Hands, handsSfx} from './templates/Hands';
import {Podcast} from './templates/Podcast';
import {Tips} from './templates/Tips';
import {Story} from './templates/Story';
import {ReelProps} from './types';
import {autoShots} from './lib/visuals';

const TEMPLATES = {toon: Story, faces: Faces, hands: Hands, podcast: Podcast, tips: Tips, story: Story};

export const Reel: React.FC<ReelProps> = ({reel, timing}) => {
  const beats = useMemo(() => resolveBeats(reel, timing), [reel, timing]);
  const total = totalFrames(timing);
  const vEnd = voiceEndFrame(timing);
  const hookEnd = Math.round(HOOK_SECONDS * FPS);
  // Sound design: a soft swell at the start, a quiet swoosh on scene changes, gentle ticks/pops
  // for things that appear, one chime at the end. Nothing loud, nothing on every word.
  const sfx = useMemo(() => {
    const list: Sfx[] = [{f: 0, src: 'soft-swell', vol: 0.45}];
    beats.forEach((b, i) => {
      if (b.sfx === 'none') return;
      if (i > 0) list.push({f: b.from, src: b.sfx ?? 'soft-swoosh', vol: b.sfx ? 0.5 : 0.35});
      const pf = b.from + (reel.template === 'hands' ? 4 : reel.template === 'toon' || reel.template === 'story' ? 3 : 2);
      propSfx(b.prop, b.to - b.from).forEach((s) => list.push({...s, f: pf + s.f}));
    });
    if (reel.template === 'hands') list.push(...handsSfx(beats, autoShots(timing, beats, 1e6)));
    list.push({f: vEnd + 4, src: 'soft-chime', vol: 0.5});
    return dedupe(list.filter((s) => s.f < vEnd + 30));
  }, [beats, reel, timing]);
  const T = TEMPLATES[reel.template];
  return (
    <AbsoluteFill style={{background: '#071330'}}>
      <T reel={reel} timing={timing} beats={beats} />
      <EndCard from={vEnd} cta={reel.cta} dark={!['toon', 'hands', 'story'].includes(reel.template)} />
      <SoundTrack reel={reel} sfx={sfx} voiceEnd={vEnd} />
    </AbsoluteFill>
  );
};
export const reelDuration = (p: ReelProps) => totalFrames(p.timing);
