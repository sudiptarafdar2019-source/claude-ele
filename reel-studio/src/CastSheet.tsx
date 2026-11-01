import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, fonts} from './brand';
import {Character, CHARACTERS, Mood} from './components/Character';

/** Catalog still: the cartoon cast with their gestures and moods. */
const ROWS: [string, string, Mood][][] = [
  [['sudip', 'idle', 'happy'], ['sudip', 'point', 'excited'], ['sudip', 'explain', 'neutral'], ['sudip', 'thumbs-up', 'happy'], ['sudip', 'think', 'thinking'], ['sudip', 'shrug', 'surprised']],
  [['maya', 'idle', 'neutral'], ['maya', 'phone', 'worried'], ['maya', 'cheer', 'excited'], ['maya', 'crossed', 'sad'], ['maya', 'wave', 'happy'], ['maya', 'present', 'happy']],
  [['leo', 'idle', 'neutral'], ['leo', 'phone', 'thinking'], ['leo', 'point-up', 'surprised'], ['leo', 'thumbs-up', 'excited'], ['leo', 'explain', 'happy'], ['leo', 'wave', 'happy']],
];
export const CastSheet: React.FC = () => (
  <AbsoluteFill style={{background: '#F3F6FC', padding: 40}}>
    <div style={{fontFamily: fonts.heading, fontWeight: 800, fontSize: 64, color: C.navy}}>Orbirise cartoon cast</div>
    {ROWS.map((row, r) => (
      <div key={r} style={{display: 'flex', alignItems: 'flex-end', marginTop: 20}}>
        <div style={{width: 200, fontFamily: fonts.heading, fontWeight: 800, fontSize: 34, color: C.blue}}>
          {CHARACTERS[row[0][0]].name}
          <div style={{fontFamily: fonts.body, fontWeight: 500, fontSize: 22, color: C.ink}}>{CHARACTERS[row[0][0]].role}</div>
        </div>
        {row.map(([who, g, m], i) => (
          <div key={i} style={{width: 280, height: 540, position: 'relative'}}>
            <Character who={who} gesture={g} mood={m} seed={i + r * 7} />
            <div style={{position: 'absolute', bottom: -6, width: '100%', textAlign: 'center', fontFamily: fonts.body, fontSize: 20, color: C.ink}}>{g} · {m}</div>
          </div>
        ))}
      </div>
    ))}
  </AbsoluteFill>
);
