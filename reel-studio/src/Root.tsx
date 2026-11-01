import React from 'react';
import {Composition, Still} from 'remotion';
import {FPS, H, W} from './brand';
import {Reel, reelDuration} from './Reel';
import {Cover} from './Cover';
import {REELS} from './reel-index';

export const Root: React.FC = () => (
  <>
    {REELS.map(({id, reel, timing}) => (
      <React.Fragment key={id}>
        <Composition id={id} component={Reel as any} width={W} height={H} fps={FPS} durationInFrames={reelDuration({reel, timing})} defaultProps={{reel, timing}} />
        <Still id={`${id}-cover`} component={Cover as any} width={W} height={H} defaultProps={{reel, timing}} />
      </React.Fragment>
    ))}
  </>
);
