import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, fonts} from '../brand';
import {Camera, Grain, Grid, HookTitle, NamePill, ProgressBar} from '../components/Common';
import {Captions} from '../components/Captions';
import {PropView} from '../components/Props';
import {beatAt, HOOK_SECONDS} from '../lib/timing';
import {faceSrc} from '../lib/faces';
import {ease, pop} from '../lib/motion';
import {FaceShots} from './Faces';
import {Speaker} from '../components/Speaker';
import {voiceFile} from '../components/Sound';
import {TemplateProps} from './types';

const TipsBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(165deg, #0047E0 0%, #0A1F5C 45%, #071330 100%)'}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 540 - (500 + i * 260) / 2, top: 700 - (500 + i * 260) / 2, width: 500 + i * 260, height: 500 + i * 260, borderRadius: 9999, border: '2px solid rgba(255,255,255,0.07)', transform: `rotate(${f * (0.3 + i * 0.1)}deg)`}}>
          <div style={{position: 'absolute', top: -9, left: '50%', width: 18, height: 18, borderRadius: 99, background: i === 1 ? C.gold : C.sky, boxShadow: `0 0 20px ${i === 1 ? C.gold : C.sky}`}} />
        </div>
      ))}
      <Grid color="rgba(255,255,255,0.04)" />
      <Grain />
    </AbsoluteFill>
  );
};

/**
 * TEMPLATE 5 · QUICK TIPS (kinetic list)
 * Bold numbered steps with icons that build into a checklist, orbit-ring background,
 * and your face reacting in the corner with the tone of each line.
 */
/** TEMPLATE · QUICK TIPS (Orbit Blue): same moving photo + animated pictures, on the orbit-ring background. */
export const Tips: React.FC<TemplateProps> = (p) => <FaceShots {...p} bg={<TipsBg />} glow="rgba(232,176,75,0.35)" />;
